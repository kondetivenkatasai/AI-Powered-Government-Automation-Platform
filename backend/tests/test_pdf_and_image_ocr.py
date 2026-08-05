import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ocr_service import ocr_service

def test_pdf_and_image():
    pdf_path = "c:/Users/DELL/OneDrive/Pictures/Camera Roll/AI automation/backend/app/uploads/8c760717-1d7f-4901-8d18-dc26eea06f1f_IDENTITY_PROOF_8b93.pdf"
    img_path = "c:/Users/DELL/OneDrive/Pictures/Camera Roll/AI automation/backend/app/uploads/4a23cde6-d10d-48cb-871e-b2f070410e09_IDENTITY_PROOF_0978.jpeg"

    print("=== TEST 1: PDF DOCUMENT OCR EXTRACTION ===")
    res1 = ocr_service.extract_strict("", pdf_path)
    print(json.dumps(res1, indent=2))

    print("\n=== TEST 2: IMAGE DOCUMENT OCR EXTRACTION ===")
    res2 = ocr_service.extract_strict("", img_path)
    print(json.dumps(res2, indent=2))

if __name__ == "__main__":
    test_pdf_and_image()
