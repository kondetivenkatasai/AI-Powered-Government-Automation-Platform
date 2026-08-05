import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.document_classifier import document_classifier

def test_cross_matching():
    mom_img_path = "c:/Users/DELL/OneDrive/Pictures/Camera Roll/AI automation/backend/app/uploads/c67c9ad0-74a6-4002-a975-dc2d678304da_ADDRESS_PROOF_57f2.jpeg"
    my_img_path = "c:/Users/DELL/OneDrive/Pictures/Camera Roll/AI automation/backend/app/uploads/4a23cde6-d10d-48cb-871e-b2f070410e09_IDENTITY_PROOF_0978.jpeg"

    with open(mom_img_path, "rb") as f:
        mom_bytes = f.read()

    with open(my_img_path, "rb") as f:
        my_bytes = f.read()

    print("=== TEST 1: Applicant Name 'Kondeti Venkata Sai' vs Uploaded Mom Aadhaar ('Kondeti Vijaya Lakshmi') ===")
    res1 = document_classifier.process_batch_intake(
        [("aadharmom.jpeg", mom_bytes)],
        ["IDENTITY_PROOF"],
        applicant_data={"applicant_name": "Kondeti Venkata Sai"}
    )
    print(json.dumps(res1["uploaded_analysis"], indent=2))
    print("AI Summary Recommendation:", res1["ai_summary"]["recommendation"])

    print("\n=== TEST 2: Applicant Name 'Kondeti Venkata Sai' vs Uploaded Own Aadhaar ('Kondeti Venkata Sai') ===")
    res2 = document_classifier.process_batch_intake(
        [("aadhar.jpeg", my_bytes)],
        ["IDENTITY_PROOF"],
        applicant_data={"applicant_name": "Kondeti Venkata Sai"}
    )
    print(json.dumps(res2["uploaded_analysis"], indent=2))
    print("AI Summary Recommendation:", res2["ai_summary"]["recommendation"])

if __name__ == "__main__":
    test_cross_matching()
