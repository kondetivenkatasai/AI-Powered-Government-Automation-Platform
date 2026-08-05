import urllib.request
import urllib.error
import json

def test_pre_ocr_rejection():
    # 1. Login
    login_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/auth/login',
        data=json.dumps({'email': 'citizen.demo@govflow.gov', 'password': 'CitizenPassword123!'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    token = json.loads(urllib.request.urlopen(login_req).read().decode('utf-8'))['access_token']

    # 2. Get Application Types (Commercial Driving License requiring MEDICAL_FITNESS)
    types = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/v1/applications/types').read().decode('utf-8'))
    dl_type = [t for t in types if t['code'] == 'DL_COMM'][0]

    # 3. Create Application
    create_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/applications',
        data=json.dumps({
            'application_type_id': dl_type['id'],
            'form_data': {'applicant_name': 'Priya Sharma', 'vehicle_type': 'Light Motor Vehicle (LMV)'}
        }).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    )
    app = json.loads(urllib.request.urlopen(create_req).read().decode('utf-8'))
    print("Application Created:", app["application_number"])

    # 4. Upload Aadhaar Card file for MEDICAL_FITNESS slot (which expects Medical Fitness Certificate)
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    dummy_aadhaar_text = b'GOVERNMENT OF INDIA UNIQUE IDENTIFICATION AUTHORITY OF INDIA (UIDAI) Aadhaar Card Number 4892-1029-8841 Priya Sharma DOB 14/08/1994 Official Identity Proof Document'

    body = []
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="document_type"\r\n\r\nMEDICAL_FITNESS')
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="file"; filename="aadhaar_card_official.pdf"\r\nContent-Type: application/pdf\r\n\r\n' + dummy_aadhaar_text)
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

    print("\n--- PRE-OCR UPLOAD VERIFICATION TEST ---")
    try:
        res = urllib.request.urlopen(upload_req)
        print("UNEXPECTED SUCCESS:", res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print("HTTP Status Code:", e.code)
        err_body = e.read().decode('utf-8')
        print("Structured Rejection Response:")
        print(json.dumps(json.loads(err_body), indent=2))

if __name__ == "__main__":
    test_pre_ocr_rejection()
