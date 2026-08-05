import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ocr_service import ocr_service

def test_applicationno_prevention():
    income_cert_text = """
    Application No: IC202612345
    Certificate No: 991283
    GOVERNMENT OF ANDHRA PRADESH
    REVENUE DEPARTMENT
    This is certified to person that PAVANI SRUTHI is resident of Cuddapah.
    Income per annum: Rs. 1,80,000/-
    Tahsildar Badvel
    """

    res = ocr_service.extract_strict("ChatGPT Image Aug 5.png", "", contents=income_cert_text.encode("utf-8"))
    print("=== TEST: Applicationno Blacklist & Name Extraction ===")
    print("Detected Document Type:", res["document_type"])
    print("Extracted Name:", res["fields"]["name"])
    print("Certificate Number:", res["fields"]["certificate_number"])
    assert res["fields"]["name"] != "Applicationno", "FAILED: Applicationno was extracted as name!"
    assert res["fields"]["name"] == "Pavani Sruthi", f"FAILED: Expected Pavani Sruthi, got {res['fields']['name']}"
    print("SUCCESS: Name extracted as Pavani Sruthi, Applicationno correctly blacklisted!")

if __name__ == "__main__":
    test_applicationno_prevention()
