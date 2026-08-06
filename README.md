# GovFlow AI - Smart Government File Processing & Approval Platform

GovFlow AI is an end-to-end AI-powered government file processing and approval workflow automation platform. It reduces government file processing time from ~30 minutes down to under 2 minutes per application while maintaining strict human-in-the-loop oversight, cryptographic verification, transparency, and auditability.

---

## 🌐 Live Production Deployments

- **Backend API (Render)**: [https://ai-powered-government-automation-platform.onrender.com](https://ai-powered-government-automation-platform.onrender.com)
- **API Health Check**: [https://ai-powered-government-automation-platform.onrender.com/health](https://ai-powered-government-automation-platform.onrender.com/health)
- **API v1 Base Endpoint**: [https://ai-powered-government-automation-platform.onrender.com/api/v1](https://ai-powered-government-automation-platform.onrender.com/api/v1)
- **Interactive Swagger Docs**: [https://ai-powered-government-automation-platform.onrender.com/docs](https://ai-powered-government-automation-platform.onrender.com/docs)
- **Frontend App (Vercel)**: Configured with `vercel.json` same-origin API proxying.

---

## 🌟 Key Capabilities & Highlights

- **30 Mins to <2 Mins Processing**: Automated OCR scanning, entity extraction, policy eligibility checking, and multi-document consistency validation.
- **Pre-OCR Image Preprocessing**: EXIF auto-rotation (`exif_transpose`), contrast enhancement (`ImageEnhance.Contrast`), noise reduction, and image upscaling (minimum 1500px width) before deep learning OCR scanning.
- **JPEG Metadata Filtering**: Strips binary header noise (`JFIF`, `Exif`, `ICC_PROFILE`, `Adobe`, `Photoshop`, `XMP`, `DQT`, `DHT`, `APP0`, `APP1`, `TSSV9P`) to prevent text contamination.
- **Dedicated Per-Document Extractors**:
  - **Aadhaar Card**: `{ documentType, name, gender, dob, aadhaarNumber, address, uid, vid }`
  - **Income Certificate**: `{ documentType, applicantName, certificateNumber, annualIncome, issueDate, issuingAuthority }`
  - **Electricity Bill**: `{ documentType, consumerName, consumerNumber, billNumber, dueDate, amount }`
- **85% Confidence Guardrail**: Documents below 85% classification confidence return `"Unknown Document"` with warning `"Unknown Document - Please upload a clearer image."`.
- **Cross-Verification Rules**:
  - **Aadhaar Card**: Compare Applicant Name + DOB + 12-digit Aadhaar Number.
  - **Income Certificate**: Compare Applicant Name + Government Certificate Number.
  - **Electricity Bill**: Compare Consumer Name + Consumer Number.
- **Human-in-the-Loop Officer Workstation**: High-density AI Copilot dashboard displaying Confidence Score (0-100%), Risk Index (0-100%), LLM Executive Summaries, and 1-Click Digital Sign-Off.
- **Cryptographic Fraud & Duplicate Detection**: SHA256 file hashing to detect duplicate submissions and cross-document entity mismatch alerts.
- **Digital Certificate Issuance**: Instant cryptographic digital certificate generation with verification QR codes and digital signatures for approved citizens.
- **Instant Authentication & Navigation**: Seamless JWT authentication state management with zero-delay role-based routing (`Citizen`, `Officer`, `Admin`).

---

## 🏛️ System Architecture

```
                                +-------------------+
                                |   Citizen Portal  |
                                |  Officer Dashboard|
                                |  Admin Console    |
                                +---------+---------+
                                          |
                                    REST / WebSockets
                                          v
+-----------------------------------------------------------------------------------+
|                              GovFlow AI Backend (FastAPI)                          |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Auth & RBAC        |  | Application Engine   |  | Verification Pipeline     |  |
|  | (JWT, Bcrypt, Roles)|  | (Lifecycle & Route) |  | (OCR, Entity, Fraud, RAG) |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Rule/Eligibility   |  | Audit Log &          |  | Notification Engine       |  |
|  | Engine             |  | Analytics Engine     |  | (Email / SMS Mock)        |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                   +-----------------------+-----------------------+
                   |                       |                       |
                   v                       v                       v
          +------------------+   +------------------+    +------------------+
          |  PostgreSQL DB   |   |   Object Store   |    |  n8n Automation  |
          |  (SQLAlchemy/    |   |   (S3 / MinIO /  |    |  Workflow Engine |
          |   Alembic)       |   |   Local Uploads) |    |  Webhooks        |
          +------------------+   +------------------+    +------------------+
```

---

## 📂 Directory Structure

```
AI automation/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py
│   │   │   │   │   ├── applications.py
│   │   │   │   │   ├── verification.py
│   │   │   │   │   ├── officer.py
│   │   │   │   │   ├── certificates.py
│   │   │   │   │   └── analytics.py
│   │   │   │   └── router.py
│   │   │   └── deps.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   └── models.py
│   │   ├── schemas/
│   │   │   └── schemas.py
│   │   └── services/
│   │       ├── ocr_service.py
│   │       ├── eligibility_service.py
│   │       ├── fraud_service.py
│   │       ├── ai_pipeline.py
│   │       └── notification_service.py
│   ├── uploads/
│   ├── main.py
│   ├── seed.py
│   ├── schema.sql
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/Navbar.tsx
│   │   │   ├── auth/LoginForm.tsx
│   │   │   ├── auth/RegisterForm.tsx
│   │   │   ├── citizen/CitizenDashboard.tsx
│   │   │   ├── citizen/ApplicationModal.tsx
│   │   │   ├── citizen/CertificateModal.tsx
│   │   │   ├── officer/OfficerDashboard.tsx
│   │   │   └── admin/AdminDashboard.tsx
│   │   ├── context/AuthContext.tsx
│   │   ├── services/api.ts
│   │   ├── types/index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vercel.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── n8n/
│   └── workflows/govflow_approval_workflow.json
├── docker-compose.yml
├── render.yaml
└── README.md
```

---

## ⚡ Quickstart & Local Execution

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python seed.py
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🔑 Demo Account Presets

The login page features 1-click preset buttons for instant demo switching:

1. **Citizen Account**:
   - Email: `citizen.demo@govflow.gov`
   - Password: `CitizenPassword123!`
2. **Revenue Department Officer**:
   - Email: `officer.revenue@govflow.gov`
   - Password: `OfficerPassword123!`
3. **System Administrator**:
   - Email: `admin@govflow.gov`
   - Password: `AdminPassword123!`

---

## 🎬 Step-by-Step Demo Walkthrough Scenario

1. **Citizen Submission**:
   - Login as `citizen.demo@govflow.gov`.
   - Click **New Application** and select **Income Certificate**.
   - Fill in applicant details (Annual Income: ₹1,80,000) and attach required document proofs.
   - Click **Run Multi-Document AI Classification & Identity Verification**.

2. **Automated AI Processing (<2 Seconds)**:
   - The AI Pipeline executes OCR scanning, parses identity numbers, checks max income eligibility (<= ₹3,00,000 threshold), and checks SHA256 checksums for tampering.
   - Computes **95% Confidence Score** and **5% Risk Index**.
   - Displays `Detected Document: ✓ Aadhaar Card` and cross-verifies name/DOB.

3. **Officer Review & 1-Click Approval**:
   - Log in as `officer.revenue@govflow.gov`.
   - Select the newly submitted application in the **Department Queue**.
   - Inspect the AI Copilot gauges, eligibility checklist, and LLM summary.
   - Click **One-Click Digital Approval**.

4. **Digital Certificate Download**:
   - Log back into the Citizen account.
   - Application status updates to **Approved**.
   - Click **Download Certificate** to view and print the official certificate complete with SHA256 digital signature and QR verification code.

---

## 🧪 Testing Strategy

Run backend unit tests and OCR verification:
```bash
pytest backend/tests
```
Run frontend TypeScript and bundle compilation checks:
```bash
cd frontend && npm run build
```

---

## 🐋 Docker Production Deployment

To launch the complete production stack (PostgreSQL + FastAPI + Nginx Frontend):
```bash
docker-compose up --build -d
```

