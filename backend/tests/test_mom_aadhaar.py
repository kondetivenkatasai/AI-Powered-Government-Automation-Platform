import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ocr_service import ocr_service

def test_mom_aadhaar():
    img_path = "c:/Users/DELL/OneDrive/Pictures/Camera Roll/AI automation/backend/app/uploads/c67c9ad0-74a6-4002-a975-dc2d678304da_ADDRESS_PROOF_57f2.jpeg"
    print("=== TESTING MOM AADHAAR IMAGE EXTRACTION ===")
    res = ocr_service.extract_strict("", img_path)
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    test_mom_aadhaar()
