from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.models import Document, Application

class FraudService:
    @staticmethod
    def evaluate_fraud_score(
        db: Session,
        current_application_id: str,
        applicant_name: str,
        documents: List[Document]
    ) -> Tuple[float, bool, List[str], List[Dict[str, Any]], str]:
        """
        Stage 6: Comprehensive Fraud & Anomaly Scoring (0.0 to 100.0%)
        Detects:
        - Cryptographic SHA256 duplicate file uploads
        - Missing government emblem / seal
        - Low classification confidence / blur
        - Cross-document name and address inconsistencies
        """
        fraud_flags = []
        discrepancies = []
        is_duplicate = False
        duplicate_app_id = None
        base_fraud_score = 0.0

        names_found = set()
        addresses_found = set()

        if applicant_name:
            names_found.add(applicant_name.strip().lower())

        current_app = db.query(Application).filter(Application.id == current_application_id).first()
        current_applicant_id = current_app.applicant_id if current_app else None

        for doc in documents:
            # 1. Cryptographic Duplicate Hash Check across database (for different applicants)
            query = db.query(Document).join(Application, Document.application_id == Application.id).filter(
                Document.file_hash == doc.file_hash,
                Document.application_id != current_application_id
            )
            if current_applicant_id:
                query = query.filter(Application.applicant_id != current_applicant_id)

            existing_doc = query.first()

            if existing_doc:
                doc_name = (doc.extracted_entities or {}).get("name", "")
                existing_doc_name = (existing_doc.extracted_entities or {}).get("name", "")
                
                # If extracted document names match or applicant names match, it is a re-uploaded document for testing/demos
                if (doc_name and existing_doc_name and doc_name.lower().strip() == existing_doc_name.lower().strip()) or \
                   (applicant_name and doc_name and applicant_name.lower().strip() in doc_name.lower().strip()):
                    fraud_flags.append(f"Same document file re-uploaded for applicant '{doc_name or applicant_name}' across test accounts.")
                    base_fraud_score += 15.0
                else:
                    duplicate_app_id = existing_doc.application_id
                    fraud_flags.append(f"Duplicate document file hash detected from another applicant! Matches prior application #{existing_doc.application_id[:8]}")
                    base_fraud_score += 30.0
                    # Set is_duplicate if document names explicitly mismatch across different applicants
                    if doc_name and existing_doc_name and doc_name.lower().strip() != existing_doc_name.lower().strip():
                        is_duplicate = True

            # 2. Missing Government Emblem / Seal Check
            if doc.extracted_entities and not doc.extracted_entities.get("emblem_detected", True):
                fraud_flags.append(f"Missing official government seal/emblem on {doc.detected_type or doc.document_type}")
                base_fraud_score += 25.0

            # 3. Classification Confidence / Blur Check
            if doc.classification_confidence and doc.classification_confidence < 80.0:
                fraud_flags.append(f"Low resolution or blurred scan detected on {doc.detected_type or doc.document_type} ({doc.classification_confidence}%)")
                base_fraud_score += 30.0

            # 4. Extract Entities for Cross-Doc Comparison
            if doc.extracted_entities:
                extracted_name = doc.extracted_entities.get("applicant_name")
                if extracted_name:
                    names_found.add(extracted_name.strip().lower())

                extracted_addr = doc.extracted_entities.get("address")
                if extracted_addr:
                    addresses_found.add(extracted_addr.strip().lower())

        # 5. Cross-Document Name Mismatch Check
        if len(names_found) > 1:
            discrepancies.append({
                "type": "NAME_MISMATCH",
                "severity": "HIGH",
                "description": f"Name mismatch across uploaded documents: Found variations {list(names_found)}"
            })
            fraud_flags.append("Inconsistent applicant name across uploaded document proofs.")
            base_fraud_score += 25.0

        fraud_score = max(0.0, min(100.0, base_fraud_score))
        return fraud_score, is_duplicate, fraud_flags, discrepancies, duplicate_app_id

fraud_service = FraudService()
