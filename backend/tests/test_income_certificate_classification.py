import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ocr_service import ocr_service

def test_income_cert_priority():
    # Test case 1: Income Certificate text that also includes Aadhaar Number
    sample_text_with_aadhaar = """
    GOVERNMENT OF ANDHRA PRADESH
    REVENUE DEPARTMENT
    MEESEVA INCOME CERTIFICATE
    Application No: INC-2026-991283
    Name: Kondeti Venkata Sai
    Father Name: Kondeti Narayana
    Aadhaar No: 704025742920
    DOB: 01/06/2007
    This is to certify that the Annual Family Income from all sources is Rs. 1,80,000/-
    Tahsildar Badvel
    """

    res1 = ocr_service.extract_strict("income_certificate.jpeg", "", contents=sample_text_with_aadhaar.encode("utf-8"))
    print("=== TEST 1: Income Cert with Aadhaar Number ===")
    print("Detected Document Type:", res1["document_type"])
    print("Confidence:", res1["confidence"])
    print("Fields:", json.dumps(res1["fields"], indent=2))

    img_path = "c:/Users/DELL/OneDrive/Pictures/Camera Roll/AI automation/backend/app/uploads/1b5a8289-0881-47e1-abdb-946ea8c62a2d_INCOME_PROOF_499c.png"
    res2 = ocr_service.extract_strict("income_certificate.jpeg", img_path)
    print("\n=== TEST 2: Actual Uploaded Income Cert File ===")
    print("Detected Document Type:", res2["document_type"])
    print("Confidence:", res2["confidence"])
    print("Fields:", json.dumps(res2["fields"], indent=2))

if __name__ == "__main__":
    test_income_cert_priority()
