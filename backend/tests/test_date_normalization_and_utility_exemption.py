import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.document_classifier import document_classifier

def test_date_and_utility():
    aadhaar_path = "c:/Users/DELL/OneDrive/Pictures/Camera Roll/AI automation/backend/app/uploads/4a23cde6-d10d-48cb-871e-b2f070410e09_IDENTITY_PROOF_0978.jpeg"
    elec_path = "c:/Users/DELL/OneDrive/Pictures/Camera Roll/AI automation/backend/app/uploads/4a23cde6-d10d-48cb-871e-b2f070410e09_ADDRESS_PROOF_6eb8.jpeg"

    with open(aadhaar_path, "rb") as f:
        aadhaar_bytes = f.read()

    with open(elec_path, "rb") as f:
        elec_bytes = f.read()

    print("=== TEST 1: Aadhaar Card Date Normalization ('01/06/2007' vs '2007-06-01') ===")
    res1 = document_classifier.process_batch_intake(
        [("aadhar.jpeg", aadhaar_bytes)],
        ["IDENTITY_PROOF"],
        applicant_data={
            "applicant_name": "Kondeti Venkata Sai",
            "dob": "01/06/2007"
        }
    )
    print("Aadhaar Result:", json.dumps(res1["uploaded_analysis"], indent=2))

    print("\n=== TEST 2: Electricity Bill Name Exemption ===")
    res2 = document_classifier.process_batch_intake(
        [("current_bill.jpeg", elec_bytes)],
        ["ADDRESS_PROOF"],
        applicant_data={
            "applicant_name": "Kondeti Venkata Sai",
            "dob": "01/06/2007"
        }
    )
    print("Electricity Bill Result:", json.dumps(res2["uploaded_analysis"], indent=2))

if __name__ == "__main__":
    test_date_and_utility()
