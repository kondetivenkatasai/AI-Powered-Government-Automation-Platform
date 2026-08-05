import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ocr_service import ocr_service
from app.services.document_classifier import document_classifier

def test_ap_cert_extraction():
    raw_ocr_text = """
    GOVERNMENT OF ANDHRA PRADESH
    REVENUE DEPARTMENT

    Application No
    CGC241022019790
    Date : 24/10/2024

    COMMUNITY , NATIVITY & DATE OF BIRTH CERTIFICATE

    1. This is to certify that the Sri/Srimathi/Kumari PAVNI SRUTHI S/o / D/o / M/o / F/o / W/o / H/o / C/o Sri.
    KONDETI NARAYANA of BADVEL (P) (U) village / Town of Gopavaram Mandal of YSR KADAPA District of the
    State Andhra Pradesh belongs to Poosala (Duly deleted from Group-D at Sl.No.24 and added here) (BC-A)
    Community / Caste which is recognized as Backward Class under i) G.O.Ms NO.1793, Education, dt.23.09.1970 as
    amended from time to time.

    2. It is certified that the Sri/Srimathi/Kumari PAVNI SRUTHI is a native of 6-2-446 Locality/Landmark of
    BADVEL (P) (U) village / Town of Gopavaram Mandal of YSR KADAPA District of the State Andhra Pradesh.

    Certified By
    Name : K.Tribhuvana Reddy
    Designation : Tahsildar
    Mandal : Mandal : Gopavaram
    """

    res = ocr_service.extract_strict("ap_cert.jpeg", "", contents=raw_ocr_text.encode("utf-8"))
    print("=== TEST 1: AP Revenue Certificate Extraction ===")
    print("Detected Document Type:", res["document_type"])
    print("Extracted Name:", res["fields"]["name"])
    print("Certificate Number:", res["fields"]["certificate_number"])

    form_name = "Pavani Sruthi"
    doc_name = res["fields"]["name"] or "Pavni Sruthi"

    status, pct = document_classifier.compare_applicant_names(form_name, doc_name)
    print("\n=== TEST 2: Spelling Variant Fuzzy Matching ===")
    print(f"Form Name: '{form_name}' vs Document Name: '{doc_name}'")
    print(f"Result: {status} ({pct}%)")

if __name__ == "__main__":
    test_ap_cert_extraction()
