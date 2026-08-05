# GovFlow AI - Smart Government File Processing & Approval Platform

GovFlow AI is an end-to-end AI-powered government file processing and approval workflow automation platform. It reduces government file processing time from ~30 minutes down to under 2 minutes per application while maintaining strict human-in-the-loop oversight, cryptographic verification, transparency, and auditability.

---

## 🌟 Key Capabilities & Highlights

- **30 Mins to <2 Mins Processing**: Automated OCR scanning, entity extraction, policy eligibility checking, and multi-document consistency validation.
- **Human-in-the-Loop Officer Workstation**: High-density AI Copilot dashboard displaying Confidence Score (0-100%), Risk Index (0-100%), LLM Executive Summaries, and 1-Click Digital Sign-Off.
- **Cryptographic Fraud & Duplicate Detection**: SHA256 file hashing to detect duplicate submissions and cross-document entity mismatch alerts.
- **Digital Certificate Issuance**: Instant cryptographic digital certificate generation with verification QR codes and digital signatures for approved citizens.
- **Role-Based Isolation (RBAC)**: Secure access separation for Citizens, Department Officers, and System Administrators.
- **n8n Workflow Integration**: Event-driven webhook automation for department routing and multi-channel notifications (Email, SMS, Portal).

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
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── n8n/
│   └── workflows/govflow_approval_workflow.json
├── docker-compose.yml
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
   - Click **Submit & Trigger AI Processing**.

2. **Automated AI Processing (<2 Seconds)**:
   - The AI Pipeline executes OCR scanning, parses identity numbers, checks max income eligibility (<= ₹3,00,000 threshold), and checks SHA256 checksums for tampering.
   - Computes **95% Confidence Score** and **5% Risk Index**.
   - Generates an **Executive LLM Summary Note**.

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

Run backend unit tests and API checks:
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

---

## 🚀 Future Enhancements

- Multi-language OCR support for regional Indic languages (Hindi, Tamil, Marathi, Bengali).
- Direct Integration with DigiLocker API for authentic document fetching.
- Blockchain-backed certificate hash logging on Polygon / Ethereum testnet.
