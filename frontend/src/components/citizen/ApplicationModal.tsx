import React, { useState, useEffect, useRef } from 'react';
import { ApplicationType, Application } from '../../types';
import { apiFetch } from '../../services/api';
import {
  X, Upload, CheckCircle, FileText, AlertCircle, ArrowRight, ShieldCheck,
  FileX, Cpu, Layers, AlertTriangle, RefreshCw, CheckCircle2, Copy, Eye, Zap, ShieldAlert, UserCheck, UserX, Calendar
} from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AnalysisItem {
  filename: string;
  detected_type: string;
  confidence: number;
  status: 'Accepted' | 'Rejected';
  mapped_slot: string | null;
  reason?: string;
  fraud_score: number;
  is_duplicate: boolean;
  name_match_status?: 'MATCH' | 'MISMATCH' | 'UNVERIFIED';
  name_match_pct?: number;
  dob_match_status?: 'MATCH' | 'MISMATCH' | 'UNVERIFIED';
  form_applicant_name?: string;
  form_dob?: string;
  doc_extracted_name?: string;
  doc_extracted_dob?: string;
  ocr_extracted_fields?: Record<string, any>;
  strict_ocr_json?: {
    document_type: string;
    confidence: number;
    status: string;
    fields: Record<string, any>;
    warnings: string[];
  };
  ocr_raw_text?: string;
}

interface RequiredDocItem {
  slot: string;
  title: string;
  status: 'FULFILLED' | 'MISSING';
  detected_type: string | null;
}

interface AISummary {
  uploaded: number;
  accepted: number;
  rejected: number;
  missing: number;
  fraud_risk: number;
  ocr_accuracy: number;
  verification_score: number;
  recommendation: 'APPROVED' | 'NEEDS_MANUAL_REVIEW' | 'REJECTED' | 'REJECT' | string;
}

interface IntakeResult {
  intake_success: boolean;
  overall_verification_progress: number;
  required_documents: RequiredDocItem[];
  uploaded_analysis: AnalysisItem[];
  missing_documents: string[];
  ai_summary: AISummary;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<number>(1);
  const [types, setTypes] = useState<ApplicationType[]>([]);
  const [selectedType, setSelectedType] = useState<ApplicationType | null>(null);
  
  // Dynamic Form Fields
  const [applicantName, setApplicantName] = useState('');
  const [dob, setDob] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [address, setAddress] = useState('');
  const [vehicleType, setVehicleType] = useState('Light Motor Vehicle (LMV)');

  // Unified Multi-File Intake State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [intakeProcessing, setIntakeProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('Uploading...');
  const [intakeResult, setIntakeResult] = useState<IntakeResult | null>(null);
  const [createdApplicationId, setCreatedApplicationId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      apiFetch<ApplicationType[]>('/applications/types')
        .then((data) => setTypes(data))
        .catch((err) => setError('Failed to load application types'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMultipleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  const runBatchIntake = async () => {
    if (!selectedType || uploadedFiles.length === 0) return;
    setIntakeProcessing(true);
    setError('');

    const steps = [
      'Uploading Supporting Documents...',
      'AI Document Classification & Quality Check...',
      'Running Deep Learning Image OCR & Field Extraction...',
      'Cross-Matching Applicant Name & DOB Details...',
      'Calculating Fraud Risk & Eligibility Score...'
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setProcessingStep(steps[stepIdx]);
      }
    }, 1500);

    try {
      let appId = createdApplicationId;
      if (!appId) {
        const formDataPayload: Record<string, any> = {
          applicant_name: applicantName,
          dob: dob,
          address: address,
        };
        if (selectedType.code === 'INC_CERT') {
          formDataPayload['annual_income'] = Number(annualIncome);
        } else if (selectedType.code === 'DL_COMM') {
          formDataPayload['vehicle_type'] = vehicleType;
        }

        const createdApp = await apiFetch<Application>('/applications', {
          method: 'POST',
          body: JSON.stringify({
            application_type_id: selectedType.id,
            form_data: formDataPayload,
          }),
        });
        appId = createdApp.id;
        setCreatedApplicationId(appId);
      }

      const intakeData = new FormData();
      uploadedFiles.forEach((file) => {
        intakeData.append('files', file);
      });

      const token = localStorage.getItem('govflow_token');
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${apiBase}/applications/${appId}/batch-upload-intake`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: intakeData,
      });

      if (!res.ok) {
        throw new Error('Batch AI intake processing failed.');
      }

      const result: IntakeResult = await res.json();
      setProcessingStep('Completed');
      setIntakeResult(result);
    } catch (err: any) {
      setError(err.message || 'AI Document Intake failed.');
    } finally {
      clearInterval(interval);
      setIntakeProcessing(false);
    }
  };

  const handleFinalFinish = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-4xl glass-panel bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>Multi-Document Async Intake & Document Detail Verification</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Step {step} of 3 • Document Classification & User Detail Matching (Name, DOB & Cert Numbers)</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                1. Select Government Service
              </label>
              <div className="grid grid-cols-1 gap-3">
                {types.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedType(t)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedType?.id === t.id
                        ? 'bg-blue-600/20 border-cyan-400 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-base">{t.title}</div>
                        <div className="text-xs text-cyan-400 font-medium">{t.department_name}</div>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {t.required_documents.length} Docs Required
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Citizen Details Form */}
          {step === 2 && selectedType && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Applicant Form Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Applicant Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Kondeti Venkata Sai"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Date of Birth (DOB)
                  </label>
                  <input
                    type="text"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="DD/MM/YYYY or YYYY-MM-DD"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat No, Street, City, State, Pincode"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {selectedType.code === 'INC_CERT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Total Annual Income (INR ₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    placeholder="e.g. 180000"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}

              {selectedType.code === 'DL_COMM' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Vehicle Category
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Light Motor Vehicle (LMV)">Light Motor Vehicle (LMV)</option>
                    <option value="Heavy Goods Vehicle (HGV)">Heavy Goods Vehicle (HGV)</option>
                    <option value="Passenger Transport Vehicle">Passenger Transport Vehicle</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Multi-Document AI Intake Area */}
          {step === 3 && selectedType && (
            <div className="space-y-6">
              
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 rounded-2xl text-center cursor-pointer transition-all space-y-3"
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={(e) => handleMultipleFiles(e.target.files)}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <Upload className="w-10 h-10 text-cyan-400 mx-auto animate-bounce" />
                <div>
                  <h4 className="text-base font-bold text-white">Drag & Drop All Supporting Documents Here</h4>
                  <p className="text-xs text-slate-400 mt-1">Upload Aadhaar Card, Income Certificate, Electricity Bill, etc. together</p>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold">
                    {uploadedFiles.length} File(s) Selected: {uploadedFiles.map(f => f.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Action Button & Processing Animation Indicator */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <button
                    disabled={intakeProcessing}
                    onClick={runBatchIntake}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                  >
                    {intakeProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>AI Pipeline Executing...</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4" />
                        <span>Run Multi-Document AI Classification & Identity Verification</span>
                      </>
                    )}
                  </button>

                  {/* Processing Step Animation Bar */}
                  {intakeProcessing && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs animate-pulse">
                      <span className="text-slate-400">Current AI Processing Step:</span>
                      <span className="font-mono font-bold text-cyan-400">{processingStep}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Results Breakdown */}
              {intakeResult && (
                <div className="space-y-6 pt-2">
                  
                  {/* Overall AI Summary Dashboard Card */}
                  {intakeResult.ai_summary && (
                    <div className="p-5 glass-panel bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-5 h-5 text-cyan-400" />
                          <h4 className="font-bold text-white text-sm">Overall AI Verification Assessment</h4>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider border ${
                          intakeResult.ai_summary.recommendation === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : intakeResult.ai_summary.recommendation === 'NEEDS_MANUAL_REVIEW' || intakeResult.ai_summary.recommendation === 'INCOMPLETE'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        }`}>
                          {intakeResult.ai_summary.recommendation === 'INCOMPLETE' ? 'INCOMPLETE (MISSING DOCS)' : intakeResult.ai_summary.recommendation}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                          <div className="text-slate-400 font-semibold uppercase text-[10px]">Uploaded Docs</div>
                          <div className="text-lg font-bold text-white mt-0.5">{intakeResult.ai_summary.uploaded}</div>
                        </div>

                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                          <div className="text-slate-400 font-semibold uppercase text-[10px]">Accepted / Rejected</div>
                          <div className="text-sm font-bold text-emerald-400 mt-0.5">
                            {intakeResult.ai_summary.accepted} Accepted / <span className="text-rose-400">{intakeResult.ai_summary.rejected} Rejected</span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                          <div className="text-slate-400 font-semibold uppercase text-[10px]">Fraud Risk</div>
                          <div className="text-lg font-bold text-amber-400 mt-0.5">{intakeResult.ai_summary.fraud_risk}%</div>
                        </div>

                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                          <div className="text-slate-400 font-semibold uppercase text-[10px]">OCR Accuracy</div>
                          <div className="text-lg font-bold text-cyan-400 mt-0.5">{intakeResult.ai_summary.ocr_accuracy}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Required Documents Checklist */}
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider">Required Documents Status Checklist</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {intakeResult.required_documents.map((req, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                            req.status === 'FULFILLED'
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          <div className="font-bold truncate">{req.title}</div>
                          {req.status === 'FULFILLED' ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                          ) : (
                            <FileX className="w-4 h-4 shrink-0 text-rose-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Per-Document Classification & Extracted OCR Cards */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                      Uploaded Documents AI Classification & Identity Verification Cards ({intakeResult.uploaded_analysis.length})
                    </h4>
                    
                    <div className="space-y-4">
                      {intakeResult.uploaded_analysis.map((item, idx) => {
                        const fieldsToDisplay = item.strict_ocr_json?.fields || item.ocr_extracted_fields || {};
                        const filteredFields = Object.entries(fieldsToDisplay).filter(([k, v]) => v !== null && v !== undefined && k !== 'emblem_detected');

                        return (
                          <div
                            key={idx}
                            className={`p-5 rounded-2xl border space-y-3 text-xs ${
                              item.status === 'Accepted'
                                ? 'bg-slate-900/90 border-slate-800'
                                : 'bg-rose-950/30 border-rose-500/40'
                            }`}
                          >
                            {/* File Card Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                              <span className="font-mono text-cyan-400 font-bold text-sm">{item.filename}</span>
                              <div className="flex items-center space-x-2">
                                <span className="px-2.5 py-1 rounded bg-slate-800 text-cyan-300 font-mono font-bold text-xs">
                                  Confidence: {item.confidence}%
                                </span>
                                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                                  item.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>

                            {/* Applicant Identity Cross-Verification Banner */}
                            {item.name_match_status && item.detected_type !== 'Electricity Bill' && (
                              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                item.name_match_status === 'MATCH'
                                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                  : item.name_match_status === 'MISMATCH'
                                  ? 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                                  : 'bg-slate-800/60 border-slate-700 text-slate-300'
                              }`}>
                                <div className="flex items-center space-x-2 font-bold">
                                  {item.name_match_status === 'MATCH' ? (
                                    <>
                                      <UserCheck className="w-4 h-4 text-emerald-400" />
                                      <span>Applicant Identity Matched ({item.name_match_pct}% Match)</span>
                                    </>
                                  ) : item.name_match_status === 'MISMATCH' ? (
                                    <>
                                      <UserX className="w-4 h-4 text-rose-400 animate-pulse" />
                                      <span>Applicant Name Mismatch: Form states "{item.form_applicant_name}", but document belongs to "{item.doc_extracted_name}"!</span>
                                    </>
                                  ) : (
                                    <span>Identity Cross-Verification Pending</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* DOB Matching Banner */}
                            {item.dob_match_status && item.form_dob && item.doc_extracted_dob && (
                              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                item.dob_match_status === 'MATCH'
                                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                  : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                              }`}>
                                <div className="flex items-center space-x-2 font-bold">
                                  <Calendar className="w-4 h-4 text-cyan-400" />
                                  <span>
                                    {item.dob_match_status === 'MATCH'
                                      ? `Date of Birth Verified (${item.doc_extracted_dob})`
                                      : `DOB Mismatch: Form states "${item.form_dob}", but document states "${item.doc_extracted_dob}"`}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                              <div>Detected Document: <strong className="text-emerald-400 font-bold ml-1">✓ {item.detected_type}</strong></div>
                              {item.is_duplicate && (
                                <span className="text-rose-400 font-semibold flex items-center space-x-1">
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Duplicate File Hash</span>
                                </span>
                              )}
                            </div>

                            {item.status === 'Rejected' && item.reason && (
                              <div className="text-xs text-rose-300 bg-rose-900/40 p-3 rounded-xl border border-rose-500/30 font-medium">
                                Reason: {item.reason}
                              </div>
                            )}

                            {/* Extracted OCR Information Grid */}
                            <div className="pt-2">
                              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Extracted OCR Information</span>
                              </div>

                              {filteredFields.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 font-mono text-[11px]">
                                  {filteredFields.map(([k, v]) => (
                                    <div key={k} className="truncate p-1.5 bg-slate-900/60 rounded border border-slate-800">
                                      <span className="text-slate-400 capitalize">{k.replace('_', ' ')}: </span>
                                      <strong className="text-cyan-300 ml-1">{String(v)}</strong>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-slate-500 text-xs italic">
                                  No fields could be extracted with high confidence from this scan.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Missing Documents Alert Panel */}
                  {intakeResult.missing_documents.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="font-bold text-xs text-amber-400 flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Missing Documents Panel</span>
                      </div>
                      <div className="text-xs text-amber-200">
                        The following required document proofs are still unfulfilled:
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {intakeResult.missing_documents.map((md, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold">
                            ❌ {md}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              disabled={!selectedType || (step === 2 && !applicantName)}
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-600/30 flex items-center space-x-2 disabled:opacity-50"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled={!intakeResult || intakeResult.missing_documents.length > 0 || intakeResult.ai_summary.rejected > 0 || intakeResult.ai_summary.recommendation === 'REJECTED' || intakeResult.ai_summary.recommendation === 'REJECT'}
              onClick={handleFinalFinish}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Application & Verification</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
