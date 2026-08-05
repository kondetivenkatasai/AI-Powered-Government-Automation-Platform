import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ocr_service import ocr_service

def test_real_user_image():
    img_path = "c:/Users/DELL/OneDrive/Pictures/Camera Roll/AI automation/backend/app/uploads/4a23cde6-d10d-48cb-871e-b2f070410e09_IDENTITY_PROOF_0978.jpeg"
    
    print("=== TESTING REAL USER UPLOADS DIGILOCKER AADHAAR CARD ===")
    res = ocr_service.extract_strict("", img_path)
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    test_real_user_image()
