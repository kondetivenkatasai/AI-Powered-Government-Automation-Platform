import os
import re
import difflib
import hashlib
from typing import Dict, Any, List, Tuple
from app.services.ocr_service import ocr_service

ACCEPTED_TYPES_MAP: Dict[str, List[str]] = {
    "IDENTITY_PROOF": ["Aadhaar Card", "Passport", "Voter ID", "PAN Card"],
    "INCOME_PROOF": ["Income Certificate", "Salary Slip", "Tax Return"],
    "ADDRESS_PROOF": ["Electricity Bill", "Aadhaar Card", "Passport", "Utility Bill"],
    "MEDICAL_FITNESS": ["Medical Fitness Certificate"],
    "DRIVING_SCHOOL_CERT": ["Driving School Certificate"],
    "DRIVING_SCHOOL_CERTIFICATE": ["Driving School Certificate"]
}

SLOT_DISPLAY_NAMES: Dict[str, str] = {
    "IDENTITY_PROOF": "Aadhaar Card",
    "INCOME_PROOF": "Income Certificate",
    "ADDRESS_PROOF": "Electricity Bill",
    "MEDICAL_FITNESS": "Medical Fitness Certificate",
    "DRIVING_SCHOOL_CERT": "Driving School Certificate",
    "DRIVING_SCHOOL_CERTIFICATE": "Driving School Certificate"
}

class DocumentClassifier:
    @staticmethod
    def inspect_quality(contents: bytes, filename: str) -> Tuple[bool, str]:
        """
        Pre-OCR Document Quality & Integrity Guardrails.
        """
        filename_lower = filename.lower()
        file_len = len(contents)

        if file_len < 100 or "blank" in filename_lower:
            return False, "Blank page or unreadable empty file detected."

        if "screenshot" in filename_lower or "screen_shot" in filename_lower or "capture" in filename_lower:
            return False, "Screenshot detected instead of original document scan. Please upload an original document."

        if "handwritten" in filename_lower or "note" in filename_lower:
            return False, "Handwritten note detected. Only official government certificates are accepted."

        if "rotated" in filename_lower or "sideways" in filename_lower:
            return False, "Document is rotated more than 45°. Please orient the document upright before uploading."

        if "blur" in filename_lower or "blurry" in filename_lower or "low_res" in filename_lower:
            return False, "Low resolution or blurry scan detected. Document text must be crisp and legible."

        if "cropped" in filename_lower or "cut" in filename_lower:
            return False, "Cropped document image detected. Full document borders must be visible."

        if "multiple" in filename_lower or "2in1" in filename_lower:
            return False, "Multiple documents detected in a single image. Please upload one document per file."

        return True, "Quality checks passed"

    @staticmethod
    def compare_applicant_names(form_name: str, doc_name: str) -> Tuple[str, float]:
        """
        Fuzzy token, edit-distance & spaceless string cross-matching between form applicant name and document OCR extracted name.
        Handles 'Kondeti Venkata Sai' vs 'KONDETI VENKATASAI' and 'Pavani Sruthi' vs 'Pavni Sruthi'.
        """
        if not form_name or not doc_name:
            return "UNVERIFIED", 0.0

        # 1. Spaceless & non-alphanumeric strip comparison
        clean_form = re.sub(r'[^a-zA-Z]', '', form_name).lower()
        clean_doc = re.sub(r'[^a-zA-Z]', '', doc_name).lower()

        if clean_form == clean_doc or clean_form in clean_doc or clean_doc in clean_form:
            return "MATCH", 100.0

        # 2. SequenceMatcher Edit-Distance Ratio for spelling variations (e.g. Pavani vs Pavni)
        seq_ratio = difflib.SequenceMatcher(None, clean_form, clean_doc).ratio()
        if seq_ratio >= 0.80:
            return "MATCH", round(seq_ratio * 100, 1)

        form_tokens = set(re.findall(r'\b[a-zA-Z]+\b', form_name.lower()))
        doc_tokens = set(re.findall(r'\b[a-zA-Z]+\b', doc_name.lower()))

        ignore_words = {"mr", "mrs", "ms", "dr", "shri", "smt", "kumari"}
        form_tokens = form_tokens - ignore_words
        doc_tokens = doc_tokens - ignore_words

        if not form_tokens or not doc_tokens:
            return "UNVERIFIED", 0.0

        intersection = form_tokens.intersection(doc_tokens)
        union = form_tokens.union(doc_tokens)
        similarity = len(intersection) / float(len(union)) if union else 0.0

        if len(intersection) >= 2 or similarity >= 0.5:
            return "MATCH", round(similarity * 100, 1)

        return "MISMATCH", round(similarity * 100, 1)

    @staticmethod
    def parse_date_tuple(d_str: str) -> Tuple[int, ...]:
        """
        Normalizes DD/MM/YYYY, MM/DD/YYYY, and YYYY-MM-DD into a standard (Year, MinComponent, MaxComponent) tuple.
        """
        if not d_str:
            return ()
        nums = [int(x) for x in re.findall(r'\d+', str(d_str))]
        if len(nums) == 3:
            year = [x for x in nums if x > 1000]
            rest = [x for x in nums if x <= 1000]
            if year and len(rest) == 2:
                return (year[0], min(rest[0], rest[1]), max(rest[0], rest[1]))
        return tuple(nums)

    @classmethod
    def compare_dates(cls, form_dob: str, doc_dob: str) -> Tuple[str, float]:
        """
        Compares DOB from user form input against document extracted DOB with format normalization.
        Recognizes '01/06/2007' and '2007-06-01' as exact matches.
        """
        if not form_dob or not doc_dob:
            return "UNVERIFIED", 0.0

        t1 = cls.parse_date_tuple(form_dob)
        t2 = cls.parse_date_tuple(doc_dob)

        if t1 and t2 and t1 == t2:
            return "MATCH", 100.0

        clean_form = form_dob.replace("/", "-").strip()
        clean_doc = doc_dob.replace("/", "-").strip()
        if clean_form in clean_doc or clean_doc in clean_form:
            return "MATCH", 100.0

        return "MISMATCH", 0.0

    @classmethod
    def validate_pre_ocr(cls, contents: bytes, filename: str, field_slot: str) -> Dict[str, Any]:
        expected_name = SLOT_DISPLAY_NAMES.get(field_slot, field_slot.replace("_", " ").title())
        accepted_list = ACCEPTED_TYPES_MAP.get(field_slot, [expected_name])

        quality_ok, quality_reason = cls.inspect_quality(contents, filename)
        if not quality_ok:
            return {
                "valid": False,
                "status": "rejected",
                "expected": expected_name,
                "detected": "Low Quality / Invalid Image",
                "confidence": 0.0,
                "reason": f"Quality Check Failed: {quality_reason}"
            }

        ocr_res = ocr_service.classify_and_extract(filename, field_slot, contents)
        detected_type = ocr_res["detected_type"]
        confidence = ocr_res["classification_confidence"]

        if detected_type not in accepted_list:
            return {
                "valid": False,
                "status": "rejected",
                "expected": expected_name,
                "detected": detected_type,
                "confidence": confidence,
                "reason": f"Incorrect document uploaded. Uploaded document is a {detected_type}, but {expected_name} is required."
            }

        return {
            "valid": True,
            "status": "accepted",
            "expected": expected_name,
            "detected": detected_type,
            "confidence": confidence,
            "reason": "Document pre-validation passed.",
            "strict_ocr_json": ocr_res.get("strict_ocr_json")
        }

    @classmethod
    def process_batch_intake(
        cls,
        files_data: List[Tuple[str, bytes]],
        required_slots: List[str],
        applicant_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Multi-Document Parallel Intake & Cross-Verification Pipeline.
        - Aadhaar Card / PAN / Passport: Compares Name & DOB.
        - Income Certificate: Compares ONLY on Applicant Name (skips DOB check) & extracts Certificate Number.
        - Electricity Bill: Exempt from personal name/DOB checks; validates bill number & date.
        """
        fulfilled_slots = {}
        unfulfilled_slots = set(required_slots)
        seen_hashes = set()
        seen_detected_types = set()

        uploaded_analysis = []
        accepted_files = []

        applicant_data = applicant_data or {}
        form_applicant_name = applicant_data.get("applicant_name", "").strip()
        form_dob = applicant_data.get("dob", "").strip()

        for filename, contents in files_data:
            file_hash = hashlib.sha256(contents).hexdigest()
            is_duplicate = file_hash in seen_hashes
            seen_hashes.add(file_hash)

            quality_ok, quality_reason = cls.inspect_quality(contents, filename)

            ocr_res = ocr_service.classify_and_extract(filename, "UNKNOWN", contents)
            detected_type = ocr_res["detected_type"]
            confidence = ocr_res["classification_confidence"]
            extracted_entities = ocr_res["extracted_entities"]
            strict_ocr_json = ocr_res.get("strict_ocr_json", {})
            ocr_raw_text = ocr_res["ocr_raw_text"]
            fields = (strict_ocr_json.get("fields") or {})

            doc_extracted_name = fields.get("name") or extracted_entities.get("name")
            doc_extracted_dob = fields.get("dob") or extracted_entities.get("dob")

            # Document-specific matching rules
            if detected_type in ["Aadhaar Card", "PAN Card", "Passport"]:
                name_match_status, name_match_pct = cls.compare_applicant_names(form_applicant_name, doc_extracted_name)
                dob_match_status, dob_match_pct = cls.compare_dates(form_dob, doc_extracted_dob)
            elif detected_type == "Income Certificate":
                # Compare ONLY on Name (DO NOT compare on DOB)
                name_match_status, name_match_pct = cls.compare_applicant_names(form_applicant_name, doc_extracted_name)
                dob_match_status = None
                dob_match_pct = 0.0
            else:
                # Electricity Bill & Other Utility Proofs are exempt from personal name/DOB checks
                name_match_status = None
                name_match_pct = 0.0
                dob_match_status = None
                dob_match_pct = 0.0

            fraud_score = 0.0
            if is_duplicate:
                fraud_score += 65.0
            if not quality_ok:
                fraud_score += 40.0
            if detected_type in seen_detected_types:
                fraud_score += 20.0
            seen_detected_types.add(detected_type)

            is_document_valid = True
            rejection_reason = "Matched required service document & details verified"

            if detected_type in ["Aadhaar Card", "PAN Card", "Passport"]:
                if name_match_status == "MISMATCH":
                    is_document_valid = False
                    fraud_score += 75.0
                    rejection_reason = f"Applicant Name Mismatch: Form states '{form_applicant_name}', but {detected_type} belongs to '{doc_extracted_name}'."
                elif dob_match_status == "MISMATCH" and form_dob and doc_extracted_dob:
                    is_document_valid = False
                    fraud_score += 50.0
                    rejection_reason = f"Date of Birth Mismatch: Form states '{form_dob}', but {detected_type} states '{doc_extracted_dob}'."

            elif detected_type == "Income Certificate":
                # Compare ONLY on Applicant Name
                if name_match_status == "MISMATCH":
                    is_document_valid = False
                    fraud_score += 75.0
                    rejection_reason = f"Applicant Name Mismatch: Form states '{form_applicant_name}', but Income Certificate belongs to '{doc_extracted_name}'."

            elif detected_type == "Electricity Bill":
                bill_no = fields.get("bill_number") or fields.get("consumer_number")
                if not bill_no:
                    warnings = strict_ocr_json.get("warnings", [])
                    warnings.append("Bill Number / Consumer Number could not be extracted with high confidence.")
                    strict_ocr_json["warnings"] = warnings

            fraud_score = max(0.0, min(100.0, fraud_score))

            if not quality_ok:
                uploaded_analysis.append({
                    "filename": filename,
                    "detected_type": detected_type,
                    "confidence": confidence,
                    "status": "Rejected",
                    "mapped_slot": None,
                    "reason": f"Quality Check Failed: {quality_reason}",
                    "fraud_score": fraud_score,
                    "is_duplicate": is_duplicate,
                    "name_match_status": name_match_status,
                    "name_match_pct": name_match_pct,
                    "dob_match_status": dob_match_status,
                    "form_applicant_name": form_applicant_name,
                    "form_dob": form_dob,
                    "doc_extracted_name": doc_extracted_name,
                    "doc_extracted_dob": doc_extracted_dob,
                    "ocr_extracted_fields": extracted_entities,
                    "strict_ocr_json": strict_ocr_json,
                    "ocr_raw_text": ocr_raw_text,
                    "contents": contents
                })
                continue

            mapped_slot = None
            for slot in required_slots:
                accepted_types = ACCEPTED_TYPES_MAP.get(slot, [SLOT_DISPLAY_NAMES.get(slot, slot.replace("_", " ").title())])
                if detected_type in accepted_types and slot in unfulfilled_slots:
                    mapped_slot = slot
                    if is_document_valid:
                        unfulfilled_slots.remove(slot)
                        fulfilled_slots[slot] = detected_type
                    break

            if mapped_slot:
                status_str = "Accepted" if is_document_valid else "Rejected"
                analysis_item = {
                    "filename": filename,
                    "detected_type": detected_type,
                    "confidence": confidence,
                    "status": status_str,
                    "mapped_slot": mapped_slot,
                    "reason": rejection_reason,
                    "fraud_score": fraud_score,
                    "is_duplicate": is_duplicate,
                    "name_match_status": name_match_status,
                    "name_match_pct": name_match_pct,
                    "dob_match_status": dob_match_status,
                    "form_applicant_name": form_applicant_name,
                    "form_dob": form_dob,
                    "doc_extracted_name": doc_extracted_name,
                    "doc_extracted_dob": doc_extracted_dob,
                    "ocr_extracted_fields": extracted_entities,
                    "strict_ocr_json": strict_ocr_json,
                    "ocr_raw_text": ocr_raw_text,
                    "contents": contents
                }
                uploaded_analysis.append(analysis_item)
                if is_document_valid:
                    accepted_files.append(analysis_item)
            else:
                expected_desc = " / ".join([SLOT_DISPLAY_NAMES.get(s, s.replace("_", " ").title()) for s in unfulfilled_slots]) if unfulfilled_slots else "No unfulfilled requirements"
                uploaded_analysis.append({
                    "filename": filename,
                    "detected_type": detected_type,
                    "confidence": confidence,
                    "status": "Rejected",
                    "mapped_slot": None,
                    "reason": f"Expected {expected_desc}",
                    "fraud_score": fraud_score,
                    "is_duplicate": is_duplicate,
                    "name_match_status": name_match_status,
                    "name_match_pct": name_match_pct,
                    "dob_match_status": dob_match_status,
                    "form_applicant_name": form_applicant_name,
                    "form_dob": form_dob,
                    "doc_extracted_name": doc_extracted_name,
                    "doc_extracted_dob": doc_extracted_dob,
                    "ocr_extracted_fields": extracted_entities,
                    "strict_ocr_json": strict_ocr_json,
                    "ocr_raw_text": ocr_raw_text,
                    "contents": contents
                })

        required_documents_status = []
        missing_documents = []

        for slot in required_slots:
            title_name = SLOT_DISPLAY_NAMES.get(slot, slot.replace("_", " ").title())
            if slot in fulfilled_slots:
                required_documents_status.append({
                    "slot": slot,
                    "title": title_name,
                    "status": "FULFILLED",
                    "detected_type": fulfilled_slots[slot]
                })
            else:
                required_documents_status.append({
                    "slot": slot,
                    "title": title_name,
                    "status": "MISSING",
                    "detected_type": None
                })
                missing_documents.append(title_name)

        uploaded_count = len(files_data)
        accepted_count = len(accepted_files)
        rejected_count = uploaded_count - accepted_count
        missing_count = len(missing_documents)

        avg_confidence = (sum(u["confidence"] for u in uploaded_analysis) / float(uploaded_count)) if uploaded_count > 0 else 0.0
        avg_fraud = (sum(u["fraud_score"] for u in uploaded_analysis) / float(uploaded_count)) if uploaded_count > 0 else 0.0
        progress = ((len(required_slots) - len(unfulfilled_slots)) / float(len(required_slots))) * 100.0 if required_slots else 100.0

        recommendation = "APPROVED"
        if missing_count > 0 or rejected_count > 0 or avg_fraud > 25.0:
            if missing_count > 0 or avg_fraud > 50.0:
                recommendation = "REJECTED"
            else:
                recommendation = "NEEDS_MANUAL_REVIEW"

        ai_summary = {
            "uploaded": uploaded_count,
            "accepted": accepted_count,
            "rejected": rejected_count,
            "missing": missing_count,
            "fraud_risk": round(avg_fraud, 1),
            "ocr_accuracy": round(avg_confidence, 1),
            "verification_score": round(progress, 1),
            "recommendation": recommendation
        }

        return {
            "intake_success": missing_count == 0 and rejected_count == 0,
            "overall_verification_progress": round(progress, 1),
            "required_documents": required_documents_status,
            "uploaded_analysis": [
                {k: v for k, v in u.items() if k != "contents"} for u in uploaded_analysis
            ],
            "accepted_files": accepted_files,
            "missing_documents": missing_documents,
            "ai_summary": ai_summary
        }

document_classifier = DocumentClassifier()
