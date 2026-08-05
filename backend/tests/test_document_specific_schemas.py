import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ocr_service import ocr_service
from app.services.document_classifier import document_classifier

def test_document_specific_rules():
    my_aadhaar = "c:/Users/DELL/OneDrive/Pictures/Camera Roll/AI automation/backend/app/uploads/4a23cde6-d10d-48cb-871e-b2f070410e09_IDENTITY_PROOF_0978.jpeg"
    elec_bill = "c:/Users/DELL/OneDrive/Pictures/Camera Roll/AI automation/backend/app/uploads/4a23cde6-d10d-48cb-871e-b2f070410e09_ADDRESS_PROOF_6eb8.jpeg"

    print("=== TEST 1: Aadhaar Card Extraction & Matching ===")
    res1 = ocr_service.extract_strict("", my_aadhaar)
    print("Aadhaar Fields:", json.dumps(res1["fields"], indent=2))

    print("\n=== TEST 2: Electricity Bill Extraction ===")
    res2 = ocr_service.extract_strict("", elec_bill)
    print("Electricity Bill Fields:", json.dumps(res2["fields"], indent=2))

    print("\n=== TEST 3: User Form Cross-Verification (Name + DOB) ===")
    with open(my_aadhaar, "rb") as f:
        aadhaar_bytes = f.read()

    batch_res = document_classifier.process_batch_intake(
        [("aadhar.jpeg", aadhaar_bytes)],
        ["IDENTITY_PROOF"],
        applicant_data={
            "applicant_name": "Kondeti Venkata Sai",
            "dob": "2007-06-01"
        }
    )
    print("Cross-Matching Results:", json.dumps(batch_res["uploaded_analysis"], indent=2))

if __name__ == "__main__":
    test_document_specific_rules()
