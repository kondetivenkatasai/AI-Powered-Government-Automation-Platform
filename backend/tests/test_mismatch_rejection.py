import urllib.request
import json

def test_mismatch():
    # 1. Login
    login_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/auth/login',
        data=json.dumps({'email': 'citizen.demo@govflow.gov', 'password': 'CitizenPassword123!'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    token = json.loads(urllib.request.urlopen(login_req).read().decode('utf-8'))['access_token']

    # 2. Get Types
    types = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/v1/applications/types').read().decode('utf-8'))
    inc_type = [t for t in types if t['code'] == 'INC_CERT'][0]

    # 3. Create Application
    create_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/applications',
        data=json.dumps({
            'application_type_id': inc_type['id'],
            'form_data': {'applicant_name': 'Priya Sharma', 'annual_income': 180000}
        }).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    )
    app = json.loads(urllib.request.urlopen(create_req).read().decode('utf-8'))
    print("Application Created:", app["application_number"])

    # 4. Upload PAN Card file for IDENTITY_PROOF slot (which expects Aadhaar Card)
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = []
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="document_type"\r\n\r\nIDENTITY_PROOF')
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="file"; filename="pan_card_document.pdf"\r\nContent-Type: application/pdf\r\n\r\nINCOME TAX DEPARTMENT GOVT OF INDIA PAN: BKPPS9021K')
    body.append(f'--{boundary}--\r\n'.encode('utf-8'))
    payload = b'\r\n'.join(body)

    upload_req = urllib.request.Request(
        f'http://127.0.0.1:8000/api/v1/applications/{app["id"]}/upload-doc',
        data=payload,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'Authorization': f'Bearer {token}'
        }
    )
    doc_res = json.loads(urllib.request.urlopen(upload_req).read().decode('utf-8'))
    print("Uploaded Document Slot:", doc_res["document_type"])
    print("Expected Type:", doc_res.get("expected_type"))
    print("Detected Type:", doc_res.get("detected_type"))
    print("Classification Confidence:", doc_res.get("classification_confidence"), "%")

    # 5. Fetch Verification Report
    report_req = urllib.request.Request(
        f'http://127.0.0.1:8000/api/v1/verification/{app["id"]}/report',
        headers={'Authorization': f'Bearer {token}'}
    )
    report = json.loads(urllib.request.urlopen(report_req).read().decode('utf-8'))
    print("\n--- STAGE 2 CIRCUIT BREAKER VERIFICATION REPORT ---")
    print("Recommendation:", report["recommendation"])
    print("Summary:")
    print(report["summary"].encode('ascii', errors='replace').decode('ascii'))

if __name__ == "__main__":
    test_mismatch()
