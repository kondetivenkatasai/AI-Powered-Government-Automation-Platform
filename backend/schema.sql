-- GovFlow AI Database Schema Definition (PostgreSQL 14+)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('CITIZEN', 'OFFICER', 'ADMINISTRATOR');
CREATE TYPE application_status AS ENUM ('DRAFT', 'SUBMITTED', 'PROCESSING', 'NEEDS_MANUAL_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE recommendation_type AS ENUM ('APPROVE', 'REJECT', 'MANUAL_REVIEW');

-- Departments Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    role user_role NOT NULL DEFAULT 'CITIZEN',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Application Types
CREATE TABLE application_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    eligibility_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Applications Table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(50) NOT NULL UNIQUE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_type_id UUID NOT NULL REFERENCES application_types(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    status application_status NOT NULL DEFAULT 'SUBMITTED',
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    assigned_officer_id UUID REFERENCES users(id),
    decision_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    ocr_raw_text TEXT,
    extracted_entities JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Verification Reports Table
CREATE TABLE verification_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
    confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    risk_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    recommendation recommendation_type NOT NULL DEFAULT 'MANUAL_REVIEW',
    summary TEXT NOT NULL,
    discrepancies JSONB DEFAULT '[]'::jsonb,
    eligibility_checks JSONB DEFAULT '[]'::jsonb,
    fraud_flags JSONB DEFAULT '[]'::jsonb,
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_application_id UUID REFERENCES applications(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Certificates Table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    digital_signature VARCHAR(500) NOT NULL,
    qr_code_data TEXT NOT NULL,
    pdf_path VARCHAR(500) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
