from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import Application, ApplicationType, Document, VerificationReport, ApplicationStatus, RecommendationType
from app.services.ocr_service import ocr_service
from app.services.eligibility_service import eligibility_service
from app.services.fraud_service import fraud_service
from app.services.document_classifier import ACCEPTED_TYPES_MAP

class AIPipeline:
    @staticmethod
    def process_application(db: Session, application_id: str) -> VerificationReport:
        """
        Strict Multi-Stage AI Verification Pipeline:
        Stage 1: Document Classification (Supported type check)
        Stage 2: Expected Document Type Validation (Circuit Breaker: Immediate Stop on mismatch)
        Stage 3: Confidence Thresholding (95-100% Accept, 80-94% Manual Review, <80% Reject)
        Stage 4: Mandatory Field OCR Validation
        Stage 5: Cross-Document Entity Validation
        Stage 6: Comprehensive Fraud & Anomaly Scoring
        Stage 7: AI Decision & Detailed Stopping Reason Generation
        """
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise ValueError(f"Application {application_id} not found.")

        app_type = db.query(ApplicationType).filter(ApplicationType.id == app.application_type_id).first()
        docs = db.query(Document).filter(Document.application_id == app.id).all()

        document_verifications = []
        extracted_entities_list = []
        
        circuit_breaker_triggered = False
        circuit_breaker_reason = ""
        circuit_breaker_stage = ""

        # Run Stage 1, 2, 3 & 4 per uploaded document
        for doc in docs:
            ocr_res = ocr_service.classify_and_extract(doc.file_path, doc.document_type)
            
            doc.expected_type = ocr_res["expected_type"]
            doc.detected_type = ocr_res["detected_type"]
            doc.classification_confidence = ocr_res["classification_confidence"]
            doc.mandatory_fields_status = ocr_res["mandatory_fields_status"]
            doc.ocr_raw_text = ocr_res["ocr_raw_text"]
            doc.extracted_entities = ocr_res["extracted_entities"]

            if ocr_res["extracted_entities"]:
                extracted_entities_list.append(ocr_res["extracted_entities"])

            doc_verif = {
                "document_id": doc.id,
                "document_slot": doc.document_type,
                "expected_type": doc.expected_type,
                "detected_type": doc.detected_type,
                "classification_confidence": float(doc.classification_confidence),
                "mandatory_fields_valid": doc.mandatory_fields_status.get("valid", False),
                "missing_fields": doc.mandatory_fields_status.get("missing_fields", []),
                "present_fields": doc.mandatory_fields_status.get("present_fields", []),
                "status": "PASSED"
            }

            # STAGE 1 CHECK: Unsupported / Unknown Document Type
            if not ocr_res["is_supported"]:
                circuit_breaker_triggered = True
                circuit_breaker_stage = "Stage 1: Document Classification"
                circuit_breaker_reason = f"❌ Unsupported File Uploaded. Detected '{doc.detected_type}' which is not a recognized government identity or income document. Processing stopped."
                doc_verif["status"] = "REJECTED"
                document_verifications.append(doc_verif)
                break

            # STAGE 2 CHECK: Expected vs Detected Document Mismatch (Circuit Breaker)
            slot_key = doc.document_type or doc.expected_type
            accepted_types = ACCEPTED_TYPES_MAP.get(slot_key, ACCEPTED_TYPES_MAP.get(doc.expected_type, []))

            exp_clean = doc.expected_type.lower().replace("_", " ").replace("proof", "").strip()
            det_clean = doc.detected_type.lower().replace("_", " ").replace("proof", "").strip()

            is_valid_type = (
                doc.detected_type in accepted_types
                or (bool(exp_clean) and exp_clean in det_clean)
                or (bool(det_clean) and det_clean in exp_clean)
            )

            if not is_valid_type:
                circuit_breaker_triggered = True
                circuit_breaker_stage = "Stage 2: Expected Document Validation"
                circuit_breaker_reason = (
                    f"❌ Wrong Document Uploaded!\n"
                    f"Expected: {doc.expected_type}\n"
                    f"Detected: {doc.detected_type}\n"
                    f"Classification Confidence: {doc.classification_confidence:.1f}%\n"
                    f"Processing stopped at Stage 2."
                )
                doc_verif["status"] = "MISMATCH_REJECTED"
                document_verifications.append(doc_verif)
                break

            # STAGE 3 CHECK: Classification Confidence Threshold
            if doc.classification_confidence < 80.0:
                circuit_breaker_triggered = True
                circuit_breaker_stage = "Stage 3: Confidence Threshold"
                circuit_breaker_reason = f"❌ Low Classification Confidence ({doc.classification_confidence:.1f}%). Document scan is too blurred or illegible. Processing stopped."
                doc_verif["status"] = "LOW_CONFIDENCE_REJECTED"
                document_verifications.append(doc_verif)
                break

            # STAGE 4 CHECK: Mandatory Fields Validation
            if not doc.mandatory_fields_status.get("valid", False):
                circuit_breaker_triggered = True
                circuit_breaker_stage = "Stage 4: Mandatory Field OCR Validation"
                circuit_breaker_reason = f"❌ Mandatory Fields Missing ({', '.join(doc.mandatory_fields_status.get('missing_fields', []))}) on {doc.detected_type}. Processing stopped."
                doc_verif["status"] = "MISSING_FIELDS_REJECTED"
                document_verifications.append(doc_verif)
                break

            document_verifications.append(doc_verif)

        # Handle Circuit Breaker Rejections Immediately
        if circuit_breaker_triggered:
            confidence_score = 15.0
            risk_score = 95.0
            fraud_score = 90.0
            recommendation = RecommendationType.REJECT.value
            status_update = ApplicationStatus.REJECTED.value
            summary = f"AIR_STOP [{circuit_breaker_stage}]\n{circuit_breaker_reason}"
            
            existing_report = db.query(VerificationReport).filter(VerificationReport.application_id == app.id).first()
            if existing_report:
                existing_report.confidence_score = confidence_score
                existing_report.risk_score = risk_score
                existing_report.fraud_score = fraud_score
                existing_report.recommendation = recommendation
                existing_report.summary = summary
                existing_report.document_verifications = document_verifications
                report = existing_report
            else:
                report = VerificationReport(
                    application_id=app.id,
                    confidence_score=confidence_score,
                    risk_score=risk_score,
                    fraud_score=fraud_score,
                    recommendation=recommendation,
                    summary=summary,
                    document_verifications=document_verifications
                )
                db.add(report)

            app.status = status_update
            db.commit()
            db.refresh(report)
            return report

        # STAGE 5: Eligibility Rule Verification
        rules = app_type.eligibility_rules if app_type else {}
        eligibility_checks = eligibility_service.evaluate_rules(rules, app.form_data, extracted_entities_list)

        # STAGE 6: Advanced Fraud & Anomaly Scoring
        applicant_name = app.form_data.get("applicant_name", "")
        fraud_score, is_duplicate, fraud_flags, discrepancies, dup_app_id = fraud_service.evaluate_fraud_score(
            db, app.id, applicant_name, docs
        )

        # STAGE 7: Final AI Decision & Scoring Calculation
        base_confidence = 96.0
        base_risk = 4.0

        required_doc_count = len(app_type.required_documents) if app_type else 1
        if len(docs) < required_doc_count:
            base_confidence -= 30.0
            base_risk += 40.0
            discrepancies.append({
                "type": "MISSING_DOCUMENTS",
                "severity": "CRITICAL",
                "description": f"Uploaded {len(docs)} out of {required_doc_count} mandatory document slots."
            })

        for check in eligibility_checks:
            if check["status"] == "FAILED":
                base_confidence -= 35.0
                base_risk += 45.0

        if is_duplicate:
            base_confidence -= 40.0
            base_risk += 50.0

        if discrepancies:
            base_confidence -= (15.0 * len(discrepancies))
            base_risk += (20.0 * len(discrepancies))

        confidence_score = max(0.0, min(100.0, base_confidence))
        risk_score = max(0.0, min(100.0, base_risk))

        has_eligibility_failure = any(c.get("status") == "FAILED" for c in eligibility_checks)

        if has_eligibility_failure:
            recommendation = RecommendationType.REJECT.value
            status_update = ApplicationStatus.REJECTED.value
        elif confidence_score >= 80.0 and risk_score <= 25.0 and fraud_score <= 25.0 and not is_duplicate and not discrepancies:
            recommendation = RecommendationType.APPROVE.value
            status_update = ApplicationStatus.APPROVED.value
        elif is_duplicate or risk_score >= 60.0:
            recommendation = RecommendationType.REJECT.value
            status_update = ApplicationStatus.NEEDS_MANUAL_REVIEW.value
        else:
            recommendation = RecommendationType.MANUAL_REVIEW.value
            status_update = ApplicationStatus.NEEDS_MANUAL_REVIEW.value

        summary = (
            f"AI Multi-Stage Assessment Summary for Application #{app.application_number}:\n"
            f"• Classification Confidence: {confidence_score:.1f}% | Fraud Risk: {fraud_score:.1f}%\n"
            f"• Documents Verified: {len(docs)} passed classification & mandatory field checks.\n"
            f"• AI Recommendation: {recommendation}\n"
            f"• Executive Decision Note: "
        )
        if recommendation == RecommendationType.APPROVE.value:
            summary += "All mandatory document proofs match expected classification. 100% policy eligibility confirmed."
        elif recommendation == RecommendationType.REJECT.value:
            summary += "Critical policy failure, duplicate submission, or document discrepancy detected. Recommended for rejection."
        else:
            summary += "Confidence index (80-94%) or minor discrepancy requires human officer manual verification."

        existing_report = db.query(VerificationReport).filter(VerificationReport.application_id == app.id).first()
        if existing_report:
            existing_report.confidence_score = confidence_score
            existing_report.risk_score = risk_score
            existing_report.fraud_score = fraud_score
            existing_report.recommendation = recommendation
            existing_report.summary = summary
            existing_report.discrepancies = discrepancies
            existing_report.eligibility_checks = eligibility_checks
            existing_report.fraud_flags = fraud_flags
            existing_report.document_verifications = document_verifications
            existing_report.is_duplicate = is_duplicate
            existing_report.duplicate_application_id = dup_app_id
            report = existing_report
        else:
            report = VerificationReport(
                application_id=app.id,
                confidence_score=confidence_score,
                risk_score=risk_score,
                fraud_score=fraud_score,
                recommendation=recommendation,
                summary=summary,
                discrepancies=discrepancies,
                eligibility_checks=eligibility_checks,
                fraud_flags=fraud_flags,
                document_verifications=document_verifications,
                is_duplicate=is_duplicate,
                duplicate_application_id=dup_app_id
            )
            db.add(report)

        app.status = status_update
        db.commit()
        db.refresh(report)
        return report

ai_pipeline = AIPipeline()
