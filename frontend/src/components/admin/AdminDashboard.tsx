import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import {
  TrendingUp, Clock, CheckCircle2, ShieldAlert, Cpu, Award, Zap,
  BarChart3, RefreshCw, Layers, ShieldCheck, Activity, Users
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/analytics/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">Loading System Analytics & Audit Engine...</div>
    );
  }

  const summary = data?.summary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 glass-panel rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">System Analytics & Audit Control</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-semibold">
              Live Monitoring
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Cross-department throughput performance, processing reduction, and audit trails</p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Processing Time Reduction KPI */}
        <div className="p-5 glass-card rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-cyan-500/20">
            <Zap className="w-16 h-16" />
          </div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Processing Time</div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-1">{summary.avg_processing_time}</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Down from {summary.manual_baseline_time} ({summary.time_reduction_percentage} faster)</span>
          </div>
        </div>

        {/* Total Volume & Approvals */}
        <div className="p-5 glass-card rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Submissions</div>
          <div className="text-3xl font-extrabold text-white mt-1">{summary.total_applications}</div>
          <div className="text-[11px] text-slate-400 mt-2">
            Approved: <strong className="text-emerald-400">{summary.approved_applications}</strong> | Pending: <strong className="text-amber-400">{summary.pending_approvals}</strong>
          </div>
        </div>

        {/* AI Accuracy Index */}
        <div className="p-5 glass-card rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Accuracy Index</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">{summary.ai_accuracy_rate}</div>
          <div className="text-[11px] text-slate-400 mt-2">
            Confidence & Eligibility Rule Precision
          </div>
        </div>

        {/* Certificates & Fraud Alerts */}
        <div className="p-5 glass-card rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Certificates Issued</div>
          <div className="text-3xl font-extrabold text-purple-400 mt-1">{summary.certificates_issued}</div>
          <div className="text-[11px] text-slate-400 mt-2">
            Fraud Alerts Prevented: <strong className="text-rose-400">{summary.fraud_alerts_prevented}</strong>
          </div>
        </div>

      </div>

      {/* Split Grid: Department Breakdown vs Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Department Performance Table (6 cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Department Performance Metrics</h3>
            <span className="text-xs text-slate-500 font-mono">Active Departments: {data?.department_performance?.length}</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {data?.department_performance?.map((dept: any) => (
              <div key={dept.code} className="p-4 hover:bg-slate-800/40 transition flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">{dept.department_name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Code: {dept.code}</div>
                </div>

                <div className="text-right text-xs">
                  <div className="font-bold text-cyan-400">{dept.approved} / {dept.total_received} Approved</div>
                  <div className="text-[10px] text-slate-500">Avg speed: {dept.avg_processing_time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs Trail (6 cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Real-Time System Audit Trail</h3>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[400px] overflow-y-auto">
            {data?.recent_audit_logs?.map((log: any) => (
              <div key={log.id} className="p-4 hover:bg-slate-800/40 transition space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 font-mono">{log.action}</span>
                  <span className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="text-xs text-slate-300">
                  Actor: <strong className="text-white">{log.actor_name}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
