import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ocr_service import ocr_service
from app.services.document_classifier import document_classifier

def test_cert_pattern():
    raw_cert_text = """
    GOVERNMENT OF ANDHRA PRADESH
    REVENUE DEPARTMENT
    COMMUNITY , NATIVITY & DATE OF BIRTH CERTIFICATE
    1. This is to certify that the Sri/Srimathi/Kumari KONDETI VENKATASAI S/o / D/o / M/o / F/o / W/o / H/o / C/o Sri.
    KONDETI NARAYANA of BADVEL (V), Badvel (M), Badvel (T), Cuddapah (D), Andhra Pradesh.
    Application No: INC-2026-991283
    Date: 04/08/2026
    """

    res = ocr_service.extract_strict("income_cert.jpeg", "", contents=raw_cert_text.encode("utf-8"))
    print("=== TEST 1: Legal Certificate Extraction ===")
    print("Detected Document Type:", res["document_type"])
    print("Extracted Name:", res["fields"]["name"])
    print("Certificate Number:", res["fields"]["certificate_number"])

    form_name = "Kondeti Venkata Sai"
    doc_name = res["fields"]["name"] or "Kondeti Venkatasai"

    status, pct = document_classifier.compare_applicant_names(form_name, doc_name)
    print("\n=== TEST 2: Spaceless Name Comparison ===")
    print(f"Form Name: '{form_name}' vs Document Name: '{doc_name}'")
    print(f"Result: {status} ({pct}%)")

if __name__ == "__main__":
    test_cert_pattern()
