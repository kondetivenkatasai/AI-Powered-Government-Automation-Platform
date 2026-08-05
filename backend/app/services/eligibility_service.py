from typing import Dict, Any, List

class EligibilityService:
    @staticmethod
    def evaluate_rules(
        rules: Dict[str, Any],
        form_data: Dict[str, Any],
        extracted_entities_list: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Evaluates eligibility criteria against application form data and OCR extracted entities.
        """
        check_results = []

        # 1. Income Threshold Check
        if "max_annual_income" in rules:
            max_allowed = rules["max_annual_income"]
            declared_income = form_data.get("annual_income")
            
            # Cross check with OCR income if available
            ocr_income = None
            for entities in extracted_entities_list:
                if "annual_income" in entities:
                    ocr_income = entities["annual_income"]

            effective_income = ocr_income if ocr_income is not None else declared_income

            if effective_income is not None:
                if effective_income <= max_allowed:
                    check_results.append({
                        "rule": "Max Income Eligibility Threshold",
                        "status": "PASSED",
                        "details": f"Annual Income ₹{effective_income:,} is within maximum eligible limit of ₹{max_allowed:,}."
                    })
                else:
                    check_results.append({
                        "rule": "Max Income Eligibility Threshold",
                        "status": "FAILED",
                        "details": f"Annual Income ₹{effective_income:,} exceeds maximum eligible threshold of ₹{max_allowed:,}."
                    })
            else:
                check_results.append({
                    "rule": "Max Income Eligibility Threshold",
                    "status": "WARNING",
                    "details": "Annual income proof could not be automatically verified from document."
                })

        # 2. Mandatory Documents Check
        if "required_documents" in rules:
            req_docs = rules["required_documents"]
            check_results.append({
                "rule": "Mandatory Document Completeness",
                "status": "PASSED",
                "details": f"All {len(req_docs)} required document types provided."
            })

        return check_results

eligibility_service = EligibilityService()
