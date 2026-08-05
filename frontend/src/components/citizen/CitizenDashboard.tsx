import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Application } from '../../types';
import { apiFetch } from '../../services/api';
import { ApplicationModal } from './ApplicationModal';
import { CertificateModal } from './CertificateModal';
import {
  FileText, Plus, Clock, CheckCircle2, XCircle, AlertTriangle, Eye, RefreshCw,
  Search, Filter, ShieldCheck, Download, Trash2, Zap, Sparkles, Building2, Calendar, X
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedCertAppId, setSelectedCertAppId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED' | 'PROCESSING'>('ALL');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Application[]>('/applications/my-applications');
      setApplications(data);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDeleteApplication = async (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this application record?')) return;

    setDeletingId(appId);
    try {
      await apiFetch(`/applications/${appId}`, { method: 'DELETE' });
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete application');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenCert = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    setSelectedCertAppId(appId);
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.application_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.application_type_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.department_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'APPROVED') return app.status === 'APPROVED';
    if (statusFilter === 'REJECTED') return app.status === 'REJECTED';
    if (statusFilter === 'PROCESSING') return ['DRAFT', 'SUBMITTED', 'PROCESSING', 'NEEDS_MANUAL_REVIEW'].includes(app.status);

    return true;
  });

  const totalApps = applications.length;
  const approvedApps = applications.filter((a) => a.status === 'APPROVED').length;
  const rejectedApps = applications.filter((a) => a.status === 'REJECTED').length;
  const processingApps = applications.filter((a) => ['DRAFT', 'SUBMITTED', 'PROCESSING', 'NEEDS_MANUAL_REVIEW'].includes(a.status)).length;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* Top Glassmorphic Hero Banner */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Citizen Autonomous Governance Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{user?.full_name || 'Citizen'}</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Track government service applications in real time, view AI document verification insights, and download cryptographically signed digital certificates.
            </p>
          </div>

          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm rounded-2xl shadow-xl shadow-cyan-500/20 flex items-center space-x-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Apply for New Government Service</span>
          </button>
        </div>
      </div>

      {/* Modern Stats Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 glass-panel bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Submissions</div>
            <div className="text-2xl font-extrabold text-white mt-1">{totalApps}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 glass-panel bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Issued Certificates</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{approvedApps}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 glass-panel bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Action Needed / Rejected</div>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">{rejectedApps}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 glass-panel bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Verification</div>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">{processingApps}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

      </div>

      {/* Main Applications Section */}
      <div className="glass-panel bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        
        {/* Controls Header: Search & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-white tracking-tight">Your Active Applications</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-bold border border-slate-700">
              {filteredApps.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search GF number, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none w-full sm:w-64"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-xl text-xs">
              {(['ALL', 'APPROVED', 'REJECTED', 'PROCESSING'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    statusFilter === st
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <button
              onClick={fetchApplications}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-xs">Loading application records...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <FileText className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">No application records found.</p>
            <p className="text-xs">Apply for a new government service to begin AI verification.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredApps.map((app) => {
              const isApproved = app.status === 'APPROVED';
              const isRejected = app.status === 'REJECTED';
              const isDeleting = deletingId === app.id;
              const reasonText = app.rejection_reason || app.decision_reason;

              return (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedApp(app);
                    setIsDetailModalOpen(true);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                    isApproved
                      ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40'
                      : isRejected
                      ? 'bg-slate-900/60 border-slate-800 hover:border-rose-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Left Details */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 font-mono font-bold text-xs border border-cyan-500/30 rounded-md">
                          {app.application_number}
                        </span>
                        <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition">
                          {app.application_type_title || 'Government Service Application'}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{app.department_name}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Submitted: {new Date(app.created_at).toLocaleDateString()}</span>
                        </span>
                      </div>

                      {reasonText && (
                        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-medium max-w-2xl">
                          Reason: {reasonText}
                        </div>
                      )}
                    </div>

                    {/* Right Actions & Status Badges */}
                    <div className="flex items-center space-x-3 self-end md:self-center shrink-0">
                      
                      {/* Status Badge */}
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 border ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : isRejected
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}>
                        {isApproved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Approved</span>
                          </>
                        ) : isRejected ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Rejected</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            <span>{app.status.replace('_', ' ')}</span>
                          </>
                        )}
                      </span>

                      {/* Certificate Download Button (If Approved) */}
                      {isApproved && (
                        <button
                          onClick={(e) => handleOpenCert(e, app.id)}
                          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/10"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>View Certificate</span>
                        </button>
                      )}

                      {/* View Details Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                          setIsDetailModalOpen(true);
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition"
                      >
                        <Eye className="w-4 h-4 text-cyan-400" />
                        <span>View Details</span>
                      </button>

                      {/* Delete Button (Allowed for Non-Approved Applications) */}
                      {!isApproved && (
                        <button
                          disabled={isDeleting}
                          onClick={(e) => handleDeleteApplication(e, app.id)}
                          className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl transition shadow-lg hover:shadow-rose-500/20 disabled:opacity-50"
                          title="Delete Application Record"
                        >
                          {isDeleting ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modals */}
      <ApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          fetchApplications();
        }}
      />

      {/* Detailed Application Information Drawer/Modal */}
      {selectedApp && isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Application Details: {selectedApp.application_number}</span>
              </div>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedApp(null);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Service Title</div>
                <div className="text-sm font-bold text-white">{selectedApp.application_type_title || 'Government Service'}</div>
                <div className="text-slate-400">{selectedApp.department_name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Status: </span>
                  <strong className="text-cyan-300 ml-1">{selectedApp.status}</strong>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Date: </span>
                  <strong className="text-cyan-300 ml-1">{new Date(selectedApp.created_at).toLocaleString()}</strong>
                </div>
              </div>

              {selectedApp.form_data && (
                <div className="space-y-2">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Applicant Form Payload</div>
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
                    {Object.entries(selectedApp.form_data).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400 capitalize">{k.replace('_', ' ')}:</span>
                        <span className="text-cyan-300 font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.documents && selectedApp.documents.length > 0 && (
                <div className="space-y-2">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Attached Supporting Documents ({selectedApp.documents.length})</div>
                  <div className="space-y-2">
                    {selectedApp.documents.map((doc) => (
                      <div key={doc.id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex justify-between items-center text-[11px]">
                        <div>
                          <div className="font-bold text-white">{doc.expected_type || doc.document_type}</div>
                          <div className="text-slate-500 font-mono">{doc.detected_type} ({doc.classification_confidence || 0}%)</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-bold">
                          {doc.document_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedCertAppId && (
        <CertificateModal
          applicationId={selectedCertAppId}
          onClose={() => setSelectedCertAppId(null)}
        />
      )}

    </div>
  );
};
