import React, { useState, useEffect } from 'react';
import { OfficerApplication } from '../../types';
import { apiFetch } from '../../services/api';
import {
  ShieldAlert, CheckCircle, XCircle, AlertTriangle, FileText, Search,
  CheckCircle2, RefreshCw, Cpu, UserCheck, Lock, ChevronRight, ShieldCheck, Zap, FileSearch
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const [applications, setApplications] = useState<OfficerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<OfficerApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  // Decision Form State
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    apiFetch<any[]>('/applications/types')
      .then((types) => {
        const deptsMap = new Map<string, string>();
        types.forEach((t) => {
          if (t.department_id && t.department_name) {
            deptsMap.set(t.department_id, t.department_name);
          }
        });
        const deptsList = Array.from(deptsMap.entries()).map(([id, name]) => ({ id, name }));
        setDepartments(deptsList);
      })
      .catch((err) => console.error("Failed to load departments list:", err));
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.append('status_filter', filterStatus);
      if (filterDept !== 'ALL') {
        params.append('department_filter', filterDept);
      } else {
        params.append('department_filter', 'ALL');
      }

      const endpoint = `/officer/applications?${params.toString()}`;
      const data = await apiFetch<OfficerApplication[]>(endpoint);
      setApplications(data);
      if (data.length > 0 && (!selectedApp || !data.some(a => a.id === selectedApp.id))) {
        setSelectedApp(data[0]);
      }
    } catch (err) {
      console.error("Failed to load officer applications queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filterStatus, filterDept]);

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedApp) return;
    setSubmittingDecision(true);
    setDecisionSuccess(null);

    try {
      const res: any = await apiFetch(`/officer/applications/${selectedApp.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          decision_reason: decisionNotes || `Verified and ${decision.toLowerCase()} by assigned officer.`,
        }),
      });

      setDecisionSuccess(res.message);
      setDecisionNotes('');
      fetchApplications();

      setSelectedApp((prev) => prev ? { ...prev, status: decision } : null);
    } catch (err: any) {
      alert(err.message || 'Failed to submit decision.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const getRecommendationBadge = (rec?: string) => {
    switch (rec) {
      case 'APPROVE':
        return <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center space-x-1"><CheckCircle2 className="w-3.5 h-3.5" /><span>AI Rec: Approve</span></span>;
      case 'REJECT':
        return <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center space-x-1"><XCircle className="w-3.5 h-3.5" /><span>AI Rec: Reject</span></span>;
      default:
        return <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center space-x-1"><AlertTriangle className="w-3.5 h-3.5" /><span>AI Rec: Manual Review</span></span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Officer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 glass-panel rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Officer Approval Workstation</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              Forensic Queue
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Multi-stage document classification, fraud index scoring & 1-click approvals</p>
        </div>

        {/* Controls: Department & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter Select */}
          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Department:</span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-xs">
            {['ALL', 'NEEDS_MANUAL_REVIEW', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Queue List vs AI Copilot Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Applications List (4 cols) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Department Application Queue ({applications.length})</h3>
            <button onClick={fetchApplications} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading queue...</div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No applications matching criteria</div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-[700px] overflow-y-auto">
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedApp?.id === app.id
                      ? 'bg-blue-600/15 border-l-4 border-cyan-400'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-cyan-400">{app.application_number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      app.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                      app.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="font-bold text-white text-xs truncate">{app.applicant_name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{app.application_type_title}</div>

                  {app.verification_report && (
                    <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Classification: <strong className="text-cyan-300">{app.verification_report.confidence_score}%</strong></span>
                      <span className="text-slate-400">Fraud Score: <strong className={(app.verification_report.fraud_score || 0) > 30 ? 'text-rose-400' : 'text-emerald-400'}>{app.verification_report.fraud_score || 0}%</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: High-Density AI Workstation Inspector (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedApp ? (
            <>
              {/* Top AI Decision Bar */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-bold text-cyan-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                        {selectedApp.application_number}
                      </span>
                      <h2 className="text-lg font-bold text-white">{selectedApp.application_type_title}</h2>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Applicant: <strong className="text-slate-200">{selectedApp.applicant_name}</strong> ({selectedApp.applicant_email})</div>
                  </div>

                  {getRecommendationBadge(selectedApp.verification_report?.recommendation)}
                </div>

                {/* Score Cards */}
                {selectedApp.verification_report && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Classification Confidence</div>
                        <div className="text-2xl font-extrabold text-cyan-400 mt-0.5">{selectedApp.verification_report.confidence_score}%</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fraud Anomaly Index</div>
                        <div className="text-2xl font-extrabold text-rose-400 mt-0.5">{selectedApp.verification_report.fraud_score || 0}%</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Risk Score</div>
                        <div className="text-2xl font-extrabold text-amber-400 mt-0.5">{selectedApp.verification_report.risk_score}%</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* LLM Summary Note */}
                {selectedApp.verification_report?.summary && (
                  <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200 leading-relaxed font-mono whitespace-pre-line">
                    <div className="font-bold text-cyan-400 mb-1 flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4" />
                      <span>Executive LLM Multi-Stage Assessment Note</span>
                    </div>
                    {selectedApp.verification_report.summary}
                  </div>
                )}
              </div>

              {/* Stage 9 Officer Forensic Document Breakdown */}
              {selectedApp.verification_report?.document_verifications && selectedApp.verification_report.document_verifications.length > 0 && (
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                    <FileSearch className="w-4 h-4 text-cyan-400" />
                    <span>Stage 1-4 Document Classification & Forensic Verification</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedApp.verification_report.document_verifications.map((dv, idx) => (
                      <div key={idx} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">Slot: {dv.document_slot.replace('_', ' ')}</span>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            dv.status.includes('REJECTED') ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {dv.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                          <div>Expected: <strong className="text-slate-300">{dv.expected_type}</strong></div>
                          <div>Detected: <strong className={dv.expected_type !== dv.detected_type ? 'text-rose-400' : 'text-cyan-400'}>{dv.detected_type}</strong></div>
                          <div>Confidence: <strong className="text-cyan-400">{dv.classification_confidence}%</strong></div>
                          <div>Mandatory Fields: <strong className={dv.mandatory_fields_valid ? 'text-emerald-400' : 'text-rose-400'}>{dv.mandatory_fields_valid ? 'Valid' : 'Invalid'}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discrepancies & Fraud Banners */}
              {selectedApp.verification_report?.discrepancies && selectedApp.verification_report.discrepancies.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <div className="font-bold text-xs text-rose-400 flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Cross-Document Discrepancy Warnings ({selectedApp.verification_report.discrepancies.length})</span>
                  </div>
                  {selectedApp.verification_report.discrepancies.map((disc, idx) => (
                    <div key={idx} className="text-xs text-rose-300 font-medium pl-5 list-disc">
                      • {disc.description} (Severity: {disc.severity})
                    </div>
                  ))}
                </div>
              )}

              {/* Eligibility Check List */}
              {selectedApp.verification_report?.eligibility_checks && (
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">Policy Rule Eligibility Checks</h3>
                  <div className="space-y-2">
                    {selectedApp.verification_report.eligibility_checks.map((chk, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-200">{chk.rule}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{chk.details}</div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          chk.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {chk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1-Click Officer Decision Panel */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900">
                <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>Officer Final Digital Sign-Off</span>
                </h3>

                {decisionSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    {decisionSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Officer Decision Notes / Audit Justification
                  </label>
                  <textarea
                    rows={2}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Enter decision comments (e.g., Verified income statement against tax portal)."
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    disabled={submittingDecision || selectedApp.status === 'REJECTED'}
                    onClick={() => handleDecision('REJECTED')}
                    className="px-5 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Application</span>
                  </button>

                  <button
                    disabled={submittingDecision || selectedApp.status === 'APPROVED'}
                    onClick={() => handleDecision('APPROVED')}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>One-Click Digital Approval</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel p-12 text-center text-xs text-slate-400">
              Select an application from the left queue to launch AI Workstation inspection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
