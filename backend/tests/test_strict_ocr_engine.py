import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ocr_service import ocr_service

def test_strict_ocr():
    print("=== TEST 1: Aadhaar Document with Explicit Text ===")
    sample_text_1 = """
    GOVERNMENT OF INDIA
    UNIQUE IDENTIFICATION AUTHORITY OF INDIA (UIDAI)
    Name: Ramesh Kumar
    DOB: 12/05/1990
    Address: House 102, Sector 15, Chandigarh
    Aadhaar Number: 5542 9012 3341
    PIN Code: 160015
    """
    res1 = ocr_service.extract_strict(sample_text_1, "aadhaar_sample.pdf")
    print(json.dumps(res1, indent=2))

    print("\n=== TEST 2: Blur / Empty Document with NO Visible Values ===")
    sample_text_2 = "Blurry scan content unreadable text"
    res2 = ocr_service.extract_strict(sample_text_2, "scan_blur.png")
    print(json.dumps(res2, indent=2))

if __name__ == "__main__":
    test_strict_ocr()
