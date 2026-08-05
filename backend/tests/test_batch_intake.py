import urllib.request
import urllib.error
import json

def test_batch_intake():
    # 1. Login
    login_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/auth/login',
        data=json.dumps({'email': 'citizen.demo@govflow.gov', 'password': 'CitizenPassword123!'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    token = json.loads(urllib.request.urlopen(login_req).read().decode('utf-8'))['access_token']

    # 2. Get Types (Commercial Driving License requiring IDENTITY_PROOF, MEDICAL_FITNESS, DRIVING_SCHOOL_CERT)
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

    # 4. Construct Multi-File Batch Intake Payload
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = []

    # Doc 1: Aadhaar Card (Valid)
    aadhaar_bytes = b'GOVERNMENT OF INDIA UNIQUE IDENTIFICATION AUTHORITY OF INDIA (UIDAI) Aadhaar Card Number 4892-1029-8841 Priya Sharma DOB 14/08/1994 Official Identity Proof Document'
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="files"; filename="aadhaar_card.pdf"\r\nContent-Type: application/pdf\r\n\r\n' + aadhaar_bytes)

    # Doc 2: PAN Card (Invalid for Medical Fitness slot)
    pan_bytes = b'INCOME TAX DEPARTMENT GOVT OF INDIA PAN: BKPPS9021K Father Name: Suresh Sharma Permanent Account Number Card Official Identification'
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="files"; filename="pan_card.pdf"\r\nContent-Type: application/pdf\r\n\r\n' + pan_bytes)

    # Doc 3: Driving School Certificate (Valid)
    ds_bytes = b'MOTOR DRIVING SCHOOL TRAINING COMPLETION CERTIFICATE Government Approved Driving School License No RJ-142021008892 Priya Sharma Passed Training'
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="files"; filename="driving_school_cert.pdf"\r\nContent-Type: application/pdf\r\n\r\n' + ds_bytes)

    body.append(f'--{boundary}--\r\n'.encode('utf-8'))
    payload = b'\r\n'.join(body)

    batch_req = urllib.request.Request(
        f'http://127.0.0.1:8000/api/v1/applications/{app["id"]}/batch-upload-intake',
        data=payload,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'Authorization': f'Bearer {token}'
        }
    )

    print("\n--- AI-DRIVEN INTELLIGENT DOCUMENT INTAKE MATRIX TEST ---")
    res = urllib.request.urlopen(batch_req)
    result = json.loads(res.read().decode('utf-8'))
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_batch_intake()
