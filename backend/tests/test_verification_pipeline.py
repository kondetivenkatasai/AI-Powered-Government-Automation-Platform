import urllib.request
import json

def test_pipeline():
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

    # 4. Upload Mismatched Document (PAN Card for IDENTITY_PROOF slot which expects Aadhaar Card)
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = []
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="document_type"\r\n\r\nIDENTITY_PROOF')
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="file"; filename="pan_card_scan.pdf"\r\nContent-Type: application/pdf\r\n\r\nINCOME TAX DEPARTMENT GOVT OF INDIA PAN: BKPPS9021K')
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
    print("Uploaded Document:", doc_res["document_type"], "Detected:", doc_res.get("detected_type"))

    # 5. Fetch Verification Report
    report_req = urllib.request.Request(
        f'http://127.0.0.1:8000/api/v1/verification/{app["id"]}/report',
        headers={'Authorization': f'Bearer {token}'}
    )
    report = json.loads(urllib.request.urlopen(report_req).read().decode('utf-8'))
    print("\n--- AI Multi-Stage Verification Result ---")
    print("Recommendation:", report["recommendation"])
    print("Summary:", report["summary"])

if __name__ == "__main__":
    test_pipeline()
