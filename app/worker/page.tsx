'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getUser } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { RoleGuard } from '@/components/rbac-guard';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Activity,
  X,
  FileText,
  Navigation,
} from 'lucide-react';

export default function WorkerPortal() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [availability, setAvailability] = useState<string>('available');
  const [loading, setLoading] = useState(true);

  // Resolution modal state
  const [resolveJob, setResolveJob] = useState<any | null>(null);
  const [workerNotes, setWorkerNotes] = useState<string>('');
  const [resolving, setResolving] = useState(false);

  const loadWorkerData = async () => {
    try {
      const [userProfile, casesData] = await Promise.all([
        apiFetch('/auth/me'),
        apiFetch('/cases'),
      ]);
      setAvailability(userProfile.availability || 'available');
      setJobs(casesData);
    } catch (err: any) {
      console.error('Failed to load worker data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const usr = getUser();
    if (!usr || usr.role !== 'worker') {
      router.push('/auth/login');
      return;
    }
    setCurrentUser(usr);
    loadWorkerData();

    const socket = getSocket();
    socket.on('case:updated', () => loadWorkerData());
    socket.on('case:assigned', () => loadWorkerData());

    return () => {
      socket.off('case:updated');
      socket.off('case:assigned');
    };
  }, []);

  const handleToggleAvailability = async (newVal: string) => {
    try {
      await apiFetch('/api/workers/availability', {
        method: 'PATCH',
        body: JSON.stringify({ availability: newVal }),
      });
      setAvailability(newVal);
    } catch (err: any) {
      alert(`Availability toggle error: ${err.message}`);
    }
  };

  const handleArriveOnSite = async (jobId: string) => {
    try {
      await apiFetch(`/cases/${jobId}/arrive`, {
        method: 'PATCH',
      });
      await loadWorkerData();
    } catch (err: any) {
      alert(`Arrival check-in error: ${err.message}`);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveJob) return;
    if (!workerNotes.trim()) {
      alert('Section 7 Rule: Resolution notes (workerNotes) cannot be empty.');
      return;
    }
    setResolving(true);

    try {
      await apiFetch(`/cases/${resolveJob.id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ workerNotes: workerNotes.trim() }),
      });
      setResolveJob(null);
      setWorkerNotes('');
      await loadWorkerData();
    } catch (err: any) {
      alert(`Section 7 Resolution error: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  const activeJobs = jobs.filter((j) => j.status !== 'resolved');
  const completedJobs = jobs.filter((j) => j.status === 'resolved');

  return (
    <RoleGuard allowedRoles={['worker']}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Worker Header & Availability Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bgPanel border border-borderToken rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <Wrench className="w-6 h-6 text-accentBlue" />
            <h1 className="text-2xl font-extrabold text-textPrimary">Field Worker Dispatch Portal</h1>
          </div>
          <p className="text-xs text-textSecondary mt-1">
            Technician: <span className="font-semibold text-textPrimary">{currentUser?.name}</span> ({currentUser?.email})
          </p>
        </div>

        {/* Availability Toggle Pills */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-textSecondary">Your Duty Status:</span>
          <div className="flex items-center space-x-1 bg-bgPrimary p-1 rounded-xl border border-borderToken text-xs font-bold">
            <button
              onClick={() => handleToggleAvailability('available')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                availability === 'available'
                  ? 'bg-emerald-500 text-black shadow'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => handleToggleAvailability('on_job')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                availability === 'on_job'
                  ? 'bg-blue-500 text-white shadow'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              On Job
            </button>
            <button
              onClick={() => handleToggleAvailability('off_duty')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                availability === 'off_duty'
                  ? 'bg-gray-600 text-white shadow'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Off Duty
            </button>
          </div>
        </div>
      </div>

      {/* Main Jobs Section */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-textPrimary uppercase tracking-wider flex items-center space-x-2">
          <Activity className="w-4 h-4 text-accentBlue" />
          <span>Assigned Active Field Jobs ({activeJobs.length})</span>
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-textSecondary bg-bgPanel border border-borderToken rounded-2xl">
            Loading assigned jobs...
          </div>
        ) : activeJobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-textSecondary bg-bgPanel border border-borderToken rounded-2xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-bold text-textPrimary">No active jobs assigned!</p>
            <p>You are currently on standby for new dispatch assignments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeJobs.map((j) => (
              <div key={j.id} className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-start">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase border ${
                    j.status === 'dispatched'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  }`}>
                    {j.status}
                  </span>
                  <span className="text-[11px] font-mono text-textSecondary">Case #{j.id.slice(-8)}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-textPrimary">{j.reason}</h3>
                  <p className="text-xs text-textSecondary bg-bgPrimary p-3 rounded-xl border border-borderToken">
                    {j.description}
                  </p>
                </div>

                {/* Customer Contact & Location */}
                <div className="text-xs space-y-1 bg-bgPrimary/60 p-3 rounded-xl border border-borderToken/60">
                  <div className="flex items-center space-x-1.5 text-textPrimary font-semibold">
                    <User className="w-4 h-4 text-accentBlue" />
                    <span>Customer: {j.customer?.name} ({j.customer?.phone || 'No phone provided'})</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-textSecondary">
                    <MapPin className="w-4 h-4 text-accentBlue" />
                    <span>Site Address: {j.customer?.savedAddress || 'San Francisco Enterprise HQ'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex justify-end">
                  {j.status === 'dispatched' && (
                    <button
                      onClick={() => handleArriveOnSite(j.id)}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all text-xs flex items-center justify-center space-x-2"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Mark Arrived On-Site (→ in_progress)</span>
                    </button>
                  )}
                  {j.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        setResolveJob(j);
                        setWorkerNotes('');
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all text-xs flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete & Resolve Job (→ resolved)</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Jobs History */}
        {completedJobs.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-borderToken">
            <h2 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Completed Resolution History ({completedJobs.length})</h2>
            <div className="space-y-3">
              {completedJobs.map((j) => (
                <div key={j.id} className="p-4 rounded-xl bg-bgPanel border border-borderToken flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <div className="font-bold text-xs text-textPrimary">{j.reason}</div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-0.5">Notes: "{j.workerNotes}"</div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                    ✓ Resolved
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {resolveJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-borderToken pb-3">
              <h3 className="font-extrabold text-base text-textPrimary">Complete & Resolve Field Job</h3>
              <button onClick={() => setResolveJob(null)} className="text-textSecondary hover:text-textPrimary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-bgPrimary p-3 rounded-xl border border-borderToken">
              <div className="font-bold text-textPrimary">Issue: {resolveJob.reason}</div>
              <div className="text-textSecondary">Customer: {resolveJob.customer?.name}</div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-textSecondary flex items-center justify-between">
                  <span>Mandatory Worker Resolution Notes (Section 7 Rule)</span>
                  <span className="text-red-400 font-bold">*Required</span>
                </label>
                <textarea
                  value={workerNotes}
                  onChange={(e) => setWorkerNotes(e.target.value)}
                  placeholder="Describe the diagnosis, physical repairs performed, replacement parts used, and final testing verification..."
                  rows={4}
                  required
                  className="w-full bg-bgPrimary border border-borderToken rounded-xl px-3.5 py-2 text-textPrimary outline-none focus:border-accentBlue resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 text-textSecondary bg-bgPrimary p-3 rounded-xl border border-borderToken">
                <input type="checkbox" id="confirm" required className="rounded border-borderToken text-accentBlue" />
                <label htmlFor="confirm" className="cursor-pointer font-medium">
                  I confirm the work has been completed and verified on-site.
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveJob(null)}
                  className="px-4 py-2 rounded-xl border border-borderToken font-semibold text-textSecondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {resolving ? 'Submitting...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
