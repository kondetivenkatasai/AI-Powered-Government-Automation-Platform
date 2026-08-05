import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { ShieldCheck, Award, QrCode, Download, Printer, X, CheckCircle2 } from 'lucide-react';

interface CertificateModalProps {
  applicationId: string;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ applicationId, onClose }) => {
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/certificates/${applicationId}`)
      .then((data) => setCert(data))
      .catch((err) => setError(err.message || 'Failed to load certificate'))
      .finally(() => setLoading(false));
  }, [applicationId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
            <Award className="w-5 h-5 text-emerald-400" />
            <span>Official Government Digital Certificate</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body (Printable Seal) */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-[#0F172A]">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Fetching digital certificate...</div>
          ) : error ? (
            <div className="py-12 text-center text-xs text-rose-400">{error}</div>
          ) : cert && (
            <div id="certificate-print-area" className="p-8 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 relative overflow-hidden shadow-2xl space-y-6">
              
              {/* Background Watermark Seal */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <ShieldCheck className="w-80 h-80 text-emerald-400" />
              </div>

              {/* Top Authority Header */}
              <div className="text-center space-y-1">
                <div className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest">STATE GOVERNMENT OF INDIA • GOVFLOW AI VAULT</div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{cert.title}</h2>
                <div className="text-xs text-slate-400">{cert.department_name}</div>
              </div>

              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto"></div>

              {/* Recipient Details */}
              <div className="text-center space-y-2">
                <p className="text-xs text-slate-400">This is to officially certify that</p>
                <div className="text-xl font-bold text-emerald-400 tracking-wide">{cert.applicant_name}</div>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  has completed all mandatory document verifications and policy eligibility checks with 100% compliance.
                </p>
              </div>

              {/* Certificate Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-semibold">Certificate Number</span>
                  <div className="font-mono text-cyan-300 font-bold mt-0.5">{cert.certificate_number}</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-semibold">Date of Issuance</span>
                  <div className="font-semibold text-white mt-0.5">{new Date(cert.issued_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Footer Digital Signature & QR Verification */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Cryptographic Signature</div>
                  <div className="font-mono text-[10px] text-emerald-400/80 max-w-[280px] truncate">{cert.digital_signature}</div>
                </div>

                <div className="p-2 bg-white rounded-lg shrink-0">
                  {/* Simulated QR Code */}
                  <QrCode className="w-12 h-12 text-slate-900" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Verified by GovFlow AI Autonomous Engine</span>
          </span>

          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
