export type UserRole = 'CITIZEN' | 'OFFICER' | 'ADMINISTRATOR';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  department_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface ApplicationType {
  id: string;
  department_id: string;
  title: string;
  code: string;
  required_documents: string[];
  eligibility_rules: Record<string, any>;
  department_name?: string;
}

export interface Document {
  id: string;
  application_id: string;
  document_type: string;
  expected_type?: string;
  detected_type?: string;
  classification_confidence?: number;
  mandatory_fields_status?: Record<string, any>;
  file_path: string;
  file_hash: string;
  ocr_raw_text?: string;
  extracted_entities?: Record<string, any>;
  created_at: string;
}

export interface Application {
  id: string;
  application_number: string;
  applicant_id: string;
  application_type_id: string;
  department_id: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PROCESSING' | 'NEEDS_MANUAL_REVIEW' | 'APPROVED' | 'REJECTED';
  form_data: Record<string, any>;
  assigned_officer_id?: string;
  decision_reason?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  documents: Document[];
  application_type_title?: string;
  department_name?: string;
  applicant_name?: string;
  applicant_email?: string;
  ai_risk_score?: number;
  verification_score?: number;
  verification_report?: any;
}

export type OfficerApplication = Application;

export interface DocumentVerificationDetail {
  document_id: string;
  document_slot: string;
  expected_type: string;
  detected_type: string;
  classification_confidence: number;
  emblem_detected: boolean;
  pre_ocr_valid: boolean;
  ocr_extracted_fields: Record<string, any>;
  classification_status: string;
}

export interface ApplicationVerificationReport {
  application_id: string;
  application_number: string;
  applicant_name: string;
  application_type_title: string;
  department_name: string;
  submitted_at: string;
  overall_status: string;
  ocr_accuracy_score: number;
  fraud_risk_score: number;
  sla_compliance_score: number;
  recommendation: 'APPROVE' | 'REJECT' | 'MANUAL_REVIEW';
  document_verifications: DocumentVerificationDetail[];
  rule_evaluations: Record<string, any>;
  audit_trail: any[];
}

export interface DigitalCertificate {
  id: string;
  certificate_number: string;
  application_id: string;
  issue_date: string;
  qr_code_data: string;
  digital_signature: string;
  certificate_payload: Record<string, any>;
}

export interface SystemAnalytics {
  total_applications: number;
  auto_approved: number;
  manual_reviewed: number;
  rejected: number;
  avg_processing_time_seconds: number;
  system_accuracy_rate: number;
  department_workload: Record<string, number>;
}
