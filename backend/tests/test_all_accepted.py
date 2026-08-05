import urllib.request
import json

def test_all_accepted():
    # 1. Login
    login_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/auth/login',
        data=json.dumps({'email': 'citizen.demo@govflow.gov', 'password': 'CitizenPassword123!'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    token = json.loads(urllib.request.urlopen(login_req).read().decode('utf-8'))['access_token']

    # 2. Get Types (Income Certificate requiring IDENTITY_PROOF, INCOME_PROOF, ADDRESS_PROOF)
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

    # 4. Construct Multi-File Batch Intake Payload (Aadhaar, Income Cert, Electricity Bill)
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = []

    # Doc 1: Aadhaar Card
    aadhaar_bytes = b'GOVERNMENT OF INDIA UNIQUE IDENTIFICATION AUTHORITY OF INDIA (UIDAI) Aadhaar Card Number 4892-1029-8841 Priya Sharma DOB 14/08/1994 Official Identity Proof Document'
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="files"; filename="aadhaar.jpg"\r\nContent-Type: image/jpeg\r\n\r\n' + aadhaar_bytes)

    # Doc 2: Income Certificate
    inc_bytes = b'REVENUE DEPARTMENT GOVT CERTIFICATE Certificate of Income Applicant: Priya Sharma Income: INR 1,80,000 Issue Date: 15/01/2026 Cert No: INC-2026-8849'
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="files"; filename="income.pdf"\r\nContent-Type: application/pdf\r\n\r\n' + inc_bytes)

    # Doc 3: Electricity Bill
    bill_bytes = b'STATE ELECTRICITY BOARD UTILITY BILL Consumer Number: EB-90412884 Name: Priya Sharma Address: 42 Palm Avenue, Civil Lines, Jaipur 302001 Billing Month: July 2026'
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="files"; filename="bill.jpg"\r\nContent-Type: image/jpeg\r\n\r\n' + bill_bytes)

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

    print("\n--- 3-DOCUMENT PERFECT MATCH INTAKE TEST ---")
    res = urllib.request.urlopen(batch_req)
    result = json.loads(res.read().decode('utf-8'))
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_all_accepted()
