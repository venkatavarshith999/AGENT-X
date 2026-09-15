'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getUser } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { RoleGuard } from '@/components/rbac-guard';
import {
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Activity,
  User,
  Wrench,
  ShieldCheck,
  Send,
  X,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

export default function CustomerDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Case Form state
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Feedback Form state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchCases = async () => {
    try {
      const data = await apiFetch('/cases');
      setCases(data);
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
      } else if (selectedCase) {
        const updated = data.find((c: any) => c.id === selectedCase.id);
        if (updated) setSelectedCase(updated);
      }
    } catch (err: any) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const usr = getUser();
    if (!usr) {
      router.push('/auth/login');
      return;
    }
    setCurrentUser(usr);
    fetchCases();

    const socket = getSocket();
    socket.on('case:updated', (payload: any) => {
      fetchCases();
    });
    socket.on('case:feedback_received', (payload: any) => {
      fetchCases();
    });

    return () => {
      socket.off('case:updated');
      socket.off('case:feedback_received');
    };
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !description) return;
    setSubmitting(true);

    try {
      const newCase = await apiFetch('/cases', {
        method: 'POST',
        body: JSON.stringify({ reason, description, photoUrl: photoUrl || null }),
      });
      setShowNewModal(false);
      setReason('');
      setDescription('');
      setPhotoUrl('');
      await fetchCases();
      setSelectedCase(newCase);
    } catch (err: any) {
      alert(`Error submitting case: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setSubmittingFeedback(true);

    try {
      await apiFetch(`/cases/${selectedCase.id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });
      setShowFeedbackModal(false);
      setComment('');
      await fetchCases();
    } catch (err: any) {
      alert(`Section 7 Error: ${err.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      submitted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      policy_checked: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      dispatched: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      in_progress: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase border ${styles[status] || 'bg-gray-500/10 text-gray-400'}`}>
        {status}
      </span>
    );
  };

  return (
    <RoleGuard allowedRoles={['customer']}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bgPanel border border-borderToken rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-textPrimary">Customer Resolution Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-accentBlue/10 text-accentBlue text-xs font-semibold">
              Live Socket Pushes Active
            </span>
          </div>
          <p className="text-xs text-textSecondary mt-1">
            Welcome back, <span className="font-semibold text-textPrimary">{currentUser?.name}</span> ({currentUser?.email})
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 rounded-xl bg-accentBlue text-white text-xs font-semibold shadow-lg shadow-accentBlue/25 hover:bg-accentBlueBright transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* Main Grid: Left Cases List, Right Active Case Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cases List Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Your Issue Reports ({cases.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-textSecondary bg-bgPanel border border-borderToken rounded-2xl">
              Loading cases...
            </div>
          ) : cases.length === 0 ? (
            <div className="p-8 text-center text-xs text-textSecondary bg-bgPanel border border-borderToken rounded-2xl space-y-3">
              <FileText className="w-8 h-8 text-textSecondary mx-auto" />
              <p>No issues reported yet. Click "Report New Issue" above to start.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all space-y-2 ${
                      isSelected
                        ? 'bg-bgPanel border-accentBlue shadow-lg shadow-accentBlue/10'
                        : 'bg-bgPanel/60 border-borderToken hover:border-textSecondary/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      {getStatusBadge(c.status)}
                      <span className="text-[11px] font-mono text-textSecondary">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-textPrimary line-clamp-1">{c.reason}</h3>
                    <p className="text-xs text-textSecondary line-clamp-2">{c.description}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Case Detail & Append-Only Event Timeline */}
        <div className="lg:col-span-7">
          {selectedCase ? (
            <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl sticky top-24">
              {/* Case Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-borderToken pb-4 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-textSecondary">Case #{selectedCase.id.slice(-8)}</span>
                    {getStatusBadge(selectedCase.status)}
                  </div>
                  <h2 className="text-xl font-extrabold text-textPrimary mt-1">{selectedCase.reason}</h2>
                </div>

                {selectedCase.status === 'resolved' && !selectedCase.feedback && (
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all flex items-center space-x-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Rate Resolution</span>
                  </button>
                )}
              </div>

              {/* Description & Photo Attachment */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider">Reported Issue Details</h3>
                <p className="text-xs text-textPrimary bg-bgPrimary p-4 rounded-xl border border-borderToken leading-relaxed">
                  {selectedCase.description}
                </p>
                {selectedCase.photoUrl && (
                  <div className="pt-1">
                    <img
                      src={selectedCase.photoUrl}
                      alt="Issue proof"
                      className="w-full max-h-48 object-cover rounded-xl border border-borderToken"
                    />
                  </div>
                )}
              </div>

              {/* Policy & Assigned Worker Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-bgPrimary border border-borderToken space-y-1">
                  <div className="text-textSecondary font-semibold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-accentBlue" />
                    <span>Policy Evaluation</span>
                  </div>
                  <div className="text-textPrimary font-medium">
                    {selectedCase.policyCovered === true
                      ? 'Covered under Warranty (Fee Waived)'
                      : selectedCase.policyCovered === false
                      ? `Not Covered (Estimate: $${selectedCase.charge || 0})`
                      : 'Pending Policy Review'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-bgPrimary border border-borderToken space-y-1">
                  <div className="text-textSecondary font-semibold flex items-center space-x-1.5">
                    <Wrench className="w-4 h-4 text-accentBlue" />
                    <span>Assigned Field Tech</span>
                  </div>
                  <div className="text-textPrimary font-medium">
                    {selectedCase.assignedWorker ? (
                      <span>{selectedCase.assignedWorker.name} ({selectedCase.assignedWorker.phone || 'On Dispatch'})</span>
                    ) : (
                      'Awaiting Technician Dispatch'
                    )}
                  </div>
                </div>
              </div>

              {/* Resolution Notes (if resolved) */}
              {selectedCase.workerNotes && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Technician Resolution Summary</span>
                  </div>
                  <p className="text-emerald-200">{selectedCase.workerNotes}</p>
                </div>
              )}

              {/* Customer Feedback Card (if submitted) */}
              {selectedCase.feedback && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-1">
                  <div className="font-bold text-purple-300 flex items-center space-x-1.5">
                    <Star className="w-4 h-4 fill-purple-400 text-purple-400" />
                    <span>Customer Feedback Rating: {'★'.repeat(selectedCase.feedback.rating)}{'☆'.repeat(5 - selectedCase.feedback.rating)} ({selectedCase.feedback.rating}/5)</span>
                  </div>
                  {selectedCase.feedback.comment && (
                    <p className="text-purple-200">"{selectedCase.feedback.comment}"</p>
                  )}
                </div>
              )}

              {/* Realtime Append-Only Event Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-accentBlue" />
                    <span>Append-Only Case Timeline</span>
                  </h3>
                  <span className="text-[11px] text-textSecondary font-mono">{selectedCase.events?.length || 0} events logged</span>
                </div>

                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-borderToken">
                  {selectedCase.events?.map((ev: any, idx: number) => (
                    <div key={ev.id} className="relative pl-8 space-y-1">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-accentBlue border-2 border-bgPanel shadow" />
                      <div className="text-xs font-semibold text-textPrimary">{ev.label}</div>
                      <div className="text-[10px] text-textSecondary font-mono">
                        {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-bgPanel border border-borderToken rounded-2xl p-12 text-center text-xs text-textSecondary">
              Select a case from the left list to view timeline details.
            </div>
          )}
        </div>
      </div>

      {/* New Case Submission Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-borderToken pb-3">
              <h3 className="font-extrabold text-base text-textPrimary">Submit New Issue Report</h3>
              <button onClick={() => setShowNewModal(false)} className="text-textSecondary hover:text-textPrimary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-textSecondary">Issue Summary / Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Server Room HVAC Cooling Valve Dripping"
                  required
                  className="w-full bg-bgPrimary border border-borderToken rounded-xl px-3.5 py-2 text-textPrimary outline-none focus:border-accentBlue"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-textSecondary">Detailed Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about symptoms, error codes, and location..."
                  rows={4}
                  required
                  className="w-full bg-bgPrimary border border-borderToken rounded-xl px-3.5 py-2 text-textPrimary outline-none focus:border-accentBlue resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-textSecondary">Optional Photo URL</label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-bgPrimary border border-borderToken rounded-xl px-3.5 py-2 text-textPrimary outline-none focus:border-accentBlue"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-borderToken font-semibold text-textSecondary hover:text-textPrimary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-accentBlue text-white font-semibold shadow-lg shadow-accentBlue/25 hover:bg-accentBlueBright disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rating & Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-borderToken pb-3">
              <h3 className="font-extrabold text-base text-textPrimary">Submit Case Feedback</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-textSecondary hover:text-textPrimary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              <div className="space-y-2 text-center">
                <label className="font-semibold text-textSecondary block">Rate Resolution (1 to 5 Stars)</label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-textSecondary'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-textSecondary">Comment / Review</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share feedback on technician response speed and repair quality..."
                  rows={3}
                  className="w-full bg-bgPrimary border border-borderToken rounded-xl px-3.5 py-2 text-textPrimary outline-none focus:border-accentBlue resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 rounded-xl border border-borderToken font-semibold text-textSecondary hover:text-textPrimary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submittingFeedback ? 'Submitting...' : 'Post Rating'}
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
