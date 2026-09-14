'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getUser } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { RoleGuard } from '@/components/rbac-guard';
import {
  ShieldCheck,
  Wrench,
  Users,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  DollarSign,
  Star,
  X,
  UserCheck,
  Search,
  Zap,
  TrendingUp,
  Award,
  FileCheck,
  UserX,
  History,
} from 'lucide-react';

export default function AdminPortal() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'workers' | 'profit' | 'analytics'>('queue');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Policy Modal state
  const [policyCase, setPolicyCase] = useState<any | null>(null);
  const [policyCovered, setPolicyCovered] = useState<boolean>(true);
  const [estimatedCharge, setEstimatedCharge] = useState<number>(0);
  const [policySubmitting, setPolicySubmitting] = useState(false);

  // Dispatch Modal state
  const [dispatchCase, setDispatchCase] = useState<any | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [casesData, workersData, pendingData, logsData] = await Promise.all([
        apiFetch('/cases'),
        apiFetch('/api/workers'),
        apiFetch('/api/admin/users?status=pending_approval'),
        apiFetch('/api/admin/audit-logs'),
      ]);
      setCases(casesData);
      setWorkers(workersData);
      setPendingUsers(pendingData);
      setAuditLogs(logsData);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const usr = getUser();
    if (!usr || usr.role !== 'admin') {
      router.push('/auth/login');
      return;
    }
    setCurrentUser(usr);
    loadData();

    const socket = getSocket();
    socket.on('case:updated', () => loadData());
    socket.on('case:feedback_received', () => loadData());

    return () => {
      socket.off('case:updated');
      socket.off('case:feedback_received');
    };
  }, []);

  const handlePolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyCase) return;
    setPolicySubmitting(true);

    try {
      await apiFetch(`/cases/${policyCase.id}/policy`, {
        method: 'PATCH',
        body: JSON.stringify({
          policyCovered,
          charge: policyCovered ? 0 : estimatedCharge,
        }),
      });
      setPolicyCase(null);
      await loadData();
    } catch (err: any) {
      alert(`Policy transition error: ${err.message}`);
    } finally {
      setPolicySubmitting(false);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchCase || !selectedWorkerId) return;
    setDispatchSubmitting(true);

    try {
      await apiFetch(`/cases/${dispatchCase.id}/dispatch`, {
        method: 'PATCH',
        body: JSON.stringify({ workerId: selectedWorkerId }),
      });
      setDispatchCase(null);
      setSelectedWorkerId('');
      await loadData();
    } catch (err: any) {
      alert(`Dispatch transition error: ${err.message}`);
    } finally {
      setDispatchSubmitting(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
      });
      await loadData();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/reject`, {
        method: 'PATCH',
      });
      await loadData();
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  const activeWorkers = workers.filter((w) => w.accountStatus === 'active');

  // Profit Financial Calculation Math
  const grossRevenue = cases
    .filter((c) => c.policyCovered === false && c.charge)
    .reduce((sum, c) => sum + (c.charge || 0), 0);

  const warrantySubsidiesWaived = cases
    .filter((c) => c.policyCovered === true)
    .length * 120; // Estimated standard repair value per covered job

  const resolvedCasesCount = cases.filter((c) => c.status === 'resolved').length;
  const techPayoutExpense = resolvedCasesCount * 75; // $75 field worker labor rate per resolved case

  const netProfit = grossRevenue - techPayoutExpense;
  const profitMarginPct = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 100;

  const ratings = cases.filter((c) => c.feedback?.rating).map((c) => c.feedback.rating);
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 'N/A';

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bgPanel border border-borderToken rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-accentBlue" />
            <h1 className="text-2xl font-extrabold text-textPrimary">Admin Operations & Command Center</h1>
          </div>
          <p className="text-xs text-textSecondary mt-1">
            Logged in as <span className="font-semibold text-textPrimary">{currentUser?.name}</span> (Superadmin)
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 bg-bgPrimary p-1 rounded-xl border border-borderToken text-xs font-semibold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'queue' ? 'bg-accentBlue text-white shadow' : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            Case Queue ({cases.length})
          </button>
          <button
            onClick={() => setActiveTab('profit')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
              activeTab === 'profit' ? 'bg-emerald-500 text-black font-extrabold shadow' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Profit & Financials</span>
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`px-3 py-1.5 rounded-lg transition-all relative ${
              activeTab === 'workers' ? 'bg-accentBlue text-white shadow' : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            Approvals & Audit Logs ({activeWorkers.length})
            {pendingUsers.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'analytics' ? 'bg-accentBlue text-white shadow' : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            Metrics
          </button>
        </div>
      </div>

      {/* PROFIT & FINANCIALS TAB */}
      {activeTab === 'profit' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-textPrimary flex items-center space-x-2">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <span>Enterprise Profit & Revenue Financial Dashboard</span>
              </h2>
              <p className="text-xs text-textSecondary">Real-time aggregate financial metrics calculated across all active and resolved cases</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
              Net Profit Margin: {profitMarginPct}%
            </span>
          </div>

          {/* Top 4 Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-2 shadow-xl">
              <div className="text-xs text-textSecondary font-semibold">Gross Customer Revenue</div>
              <div className="text-3xl font-extrabold text-emerald-400">${grossRevenue.toLocaleString()}</div>
              <p className="text-[11px] text-textSecondary">Billable non-covered repair charges</p>
            </div>

            <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-2 shadow-xl">
              <div className="text-xs text-textSecondary font-semibold">Warranty Subsidies Waived</div>
              <div className="text-3xl font-extrabold text-purple-400">${warrantySubsidiesWaived.toLocaleString()}</div>
              <p className="text-[11px] text-textSecondary">Covered by policy warranty engine</p>
            </div>

            <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-2 shadow-xl">
              <div className="text-xs text-textSecondary font-semibold">Field Tech Labor Expense</div>
              <div className="text-3xl font-extrabold text-amber-400">${techPayoutExpense.toLocaleString()}</div>
              <p className="text-[11px] text-textSecondary">$75 rate x {resolvedCasesCount} resolved jobs</p>
            </div>

            <div className="bg-bgPanel border border-emerald-500/30 rounded-2xl p-6 space-y-2 shadow-xl bg-gradient-to-br from-emerald-500/10 to-transparent">
              <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Net Enterprise Profit</div>
              <div className="text-3xl font-extrabold text-emerald-400">${netProfit.toLocaleString()}</div>
              <p className="text-[11px] text-emerald-300 font-medium">Gross revenue minus technician payouts</p>
            </div>
          </div>

          {/* Financial Case Ledger Table */}
          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-textPrimary uppercase tracking-wider">Financial Transaction Breakdown per Case</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bgPrimary border-b border-borderToken text-textSecondary uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Case ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Policy Coverage</th>
                    <th className="p-3">Charge ($)</th>
                    <th className="p-3 text-right">Net Financial Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderToken">
                  {cases.map((c) => {
                    const contribution = c.policyCovered === false ? (c.charge || 0) : 0;
                    return (
                      <tr key={c.id} className="hover:bg-bgPanelRaised/40">
                        <td className="p-3 font-mono text-textSecondary">#{c.id.slice(-8)}</td>
                        <td className="p-3 font-bold text-textPrimary">{c.customer?.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-bgPrimary border border-borderToken">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {c.policyCovered === true ? (
                            <span className="text-purple-400 font-semibold">✓ Warranty Covered</span>
                          ) : c.policyCovered === false ? (
                            <span className="text-emerald-400 font-semibold">Chargeable Service</span>
                          ) : (
                            <span className="text-textSecondary italic">Pending</span>
                          )}
                        </td>
                        <td className="p-3 font-bold">${c.charge || 0}</td>
                        <td className="p-3 text-right font-extrabold text-emerald-400">
                          +${contribution}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QUEUE TAB */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="text-textSecondary font-semibold mr-2 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter by State:</span>
            </span>
            {['all', 'submitted', 'policy_checked', 'dispatched', 'in_progress', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  filterStatus === st
                    ? 'bg-accentBlue/10 border-accentBlue text-accentBlue font-bold'
                    : 'bg-bgPanel border-borderToken text-textSecondary hover:border-textSecondary'
                }`}
              >
                {st} ({st === 'all' ? cases.length : cases.filter((c) => c.status === st).length})
              </button>
            ))}
          </div>

          <div className="bg-bgPanel border border-borderToken rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bgPrimary/80 border-b border-borderToken text-textSecondary uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Case / Customer</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">State</th>
                    <th className="p-4">Policy Warranty</th>
                    <th className="p-4">Assigned Tech</th>
                    <th className="p-4 text-right">Action Gate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderToken text-textPrimary">
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="hover:bg-bgPanelRaised/40 transition-colors">
                      <td className="p-4 space-y-0.5">
                        <div className="font-bold text-textPrimary">{c.customer?.name}</div>
                        <div className="text-[11px] text-textSecondary">{c.customer?.email}</div>
                        <div className="text-[10px] text-textSecondary font-mono">#{c.id.slice(-8)}</div>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="font-semibold text-textPrimary">{c.reason}</div>
                        <div className="text-[11px] text-textSecondary line-clamp-1">{c.description}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border ${
                          c.status === 'submitted'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : c.status === 'policy_checked'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : c.status === 'dispatched'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : c.status === 'in_progress'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 font-medium">
                        {c.policyCovered === true ? (
                          <span className="text-emerald-400 font-semibold">✓ Covered ($0)</span>
                        ) : c.policyCovered === false ? (
                          <span className="text-amber-400 font-semibold">${c.charge || 0} Charge</span>
                        ) : (
                          <span className="text-textSecondary italic">Pending Evaluation</span>
                        )}
                      </td>
                      <td className="p-4">
                        {c.assignedWorker ? (
                          <div className="font-semibold text-textPrimary">{c.assignedWorker.name}</div>
                        ) : (
                          <span className="text-textSecondary italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {c.status === 'submitted' && (
                          <button
                            onClick={() => {
                              setPolicyCase(c);
                              setPolicyCovered(true);
                              setEstimatedCharge(0);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-500 text-white font-semibold shadow hover:bg-purple-400 text-xs"
                          >
                            Policy Check
                          </button>
                        )}
                        {c.status === 'policy_checked' && (
                          <button
                            onClick={() => {
                              setDispatchCase(c);
                              setSelectedWorkerId(activeWorkers[0]?.id || '');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-500 text-white font-semibold shadow hover:bg-blue-400 text-xs"
                          >
                            Dispatch Worker
                          </button>
                        )}
                        {c.status === 'dispatched' && (
                          <span className="text-[11px] text-textSecondary font-mono">En Route to Site</span>
                        )}
                        {c.status === 'in_progress' && (
                          <span className="text-[11px] text-cyan-400 font-mono font-semibold">Repairing On-Site</span>
                        )}
                        {c.status === 'resolved' && (
                          <span className="text-[11px] text-emerald-400 font-semibold">✓ Complete</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* WORKERS & AUDIT LOGS TAB */}
      {activeTab === 'workers' && (
        <div className="space-y-8">
          {/* Section 10 Pending User Approvals */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-amber-300 font-extrabold text-base">
              <ShieldCheck className="w-5 h-5" />
              <span>Section 10 Pending User Approvals ({pendingUsers.length})</span>
            </div>
            <p className="text-xs text-textSecondary">
              Worker and Admin registrations remain in <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded text-amber-200">pending_approval</code> state until explicitly authorized below.
            </p>

            {pendingUsers.length === 0 ? (
              <div className="p-4 rounded-xl bg-bgPanel border border-borderToken text-xs text-textSecondary text-center">
                No users currently awaiting approval. All worker & admin credentials active.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="p-4 rounded-xl bg-bgPanel border border-borderToken space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-textPrimary text-sm">{u.name}</div>
                        <div className="text-textSecondary">{u.email}</div>
                        <div className="text-[11px] text-accentBlue">Requested Role: <span className="uppercase font-bold">{u.role}</span></div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase">
                        Pending
                      </span>
                    </div>

                    <div className="flex space-x-2 pt-2 border-t border-borderToken">
                      <button
                        onClick={() => handleApproveUser(u.id)}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 text-black font-extrabold hover:bg-emerald-400 transition-all text-xs flex items-center justify-center space-x-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve Access</span>
                      </button>
                      <button
                        onClick={() => handleRejectUser(u.id)}
                        className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-semibold hover:bg-red-500/30 transition-all text-xs flex items-center space-x-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Append-Only Audit Log Timeline */}
          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-accentBlue" />
              <h3 className="font-extrabold text-base text-textPrimary">Append-Only User Approval Audit Trail</h3>
            </div>
            <p className="text-xs text-textSecondary">Decoupled audit log entries recorded on every admin approval or rejection action</p>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-borderToken">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative pl-8 space-y-1 text-xs">
                  <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-bgPanel ${
                    log.action === 'USER_APPROVED' ? 'bg-emerald-400' : 'bg-red-400'
                  }`} />
                  <div className="font-bold text-textPrimary flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      log.action === 'USER_APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {log.action}
                    </span>
                    <span>{log.details}</span>
                  </div>
                  <div className="text-[10px] text-textSecondary font-mono">
                    Performed by Admin {log.performedByAdminEmail} • {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-2 shadow-xl">
            <div className="text-xs text-textSecondary font-semibold">Total Cases Handled</div>
            <div className="text-3xl font-extrabold text-textPrimary">{cases.length}</div>
            <p className="text-[11px] text-emerald-400 font-medium">100% Enforced state tracking</p>
          </div>

          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-2 shadow-xl">
            <div className="text-xs text-textSecondary font-semibold">Resolved Cases</div>
            <div className="text-3xl font-extrabold text-emerald-400">{resolvedCasesCount}</div>
            <p className="text-[11px] text-textSecondary font-medium">Completed on-site repairs</p>
          </div>

          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-2 shadow-xl">
            <div className="text-xs text-textSecondary font-semibold">Net Profit Margin</div>
            <div className="text-3xl font-extrabold text-emerald-400">{profitMarginPct}%</div>
            <p className="text-[11px] text-textSecondary font-medium">Margin after technician labor payouts</p>
          </div>

          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-2 shadow-xl">
            <div className="text-xs text-textSecondary font-semibold">Customer Satisfaction</div>
            <div className="text-3xl font-extrabold text-amber-400 flex items-center space-x-1">
              <span>{avgRating}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-[11px] text-textSecondary font-medium">Average review score</p>
          </div>
        </div>
      )}

      {/* Policy Evaluation Drawer / Modal */}
      {policyCase && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-borderToken pb-3">
              <h3 className="font-extrabold text-base text-textPrimary">Policy Engine Evaluation</h3>
              <button onClick={() => setPolicyCase(null)} className="text-textSecondary hover:text-textPrimary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 bg-bgPrimary p-3 rounded-xl border border-borderToken">
              <div className="font-bold text-textPrimary">{policyCase.reason}</div>
              <div className="text-textSecondary">{policyCase.description}</div>
            </div>

            <form onSubmit={handlePolicySubmit} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-textSecondary block">Warranty Coverage Determination</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPolicyCovered(true);
                      setEstimatedCharge(0);
                    }}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      policyCovered
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-bgPrimary border-borderToken text-textSecondary'
                    }`}
                  >
                    ✓ Covered ($0 Fee)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPolicyCovered(false);
                      setEstimatedCharge(150);
                    }}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      !policyCovered
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-bgPrimary border-borderToken text-textSecondary'
                    }`}
                  >
                    Not Covered (Chargeable)
                  </button>
                </div>
              </div>

              {!policyCovered && (
                <div className="space-y-1">
                  <label className="font-semibold text-textSecondary">Estimated Charge ($ USD)</label>
                  <input
                    type="number"
                    value={estimatedCharge}
                    onChange={(e) => setEstimatedCharge(Number(e.target.value))}
                    min={0}
                    className="w-full bg-bgPrimary border border-borderToken rounded-xl px-3 py-2 text-textPrimary outline-none focus:border-accentBlue"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPolicyCase(null)}
                  className="px-4 py-2 rounded-xl border border-borderToken font-semibold text-textSecondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={policySubmitting}
                  className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow hover:bg-purple-400 disabled:opacity-50"
                >
                  {policySubmitting ? 'Updating...' : 'Advance → policy_checked'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Worker Drawer / Modal */}
      {dispatchCase && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-borderToken pb-3">
              <h3 className="font-extrabold text-base text-textPrimary">Dispatch Field Worker</h3>
              <button onClick={() => setDispatchCase(null)} className="text-textSecondary hover:text-textPrimary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-bgPrimary p-3 rounded-xl border border-borderToken">
              <div className="font-bold text-textPrimary">Issue: {dispatchCase.reason}</div>
              <div className="text-textSecondary">Customer Location: {dispatchCase.customer?.savedAddress || 'San Francisco Headquarters'}</div>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-textSecondary block">Select Field Technician</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeWorkers.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWorkerId(w.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                        selectedWorkerId === w.id
                          ? 'bg-accentBlue/10 border-accentBlue text-textPrimary'
                          : 'bg-bgPrimary border-borderToken text-textSecondary hover:border-textSecondary'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-textPrimary">{w.name} ({w.shopName || 'Field Tech'})</div>
                        <div className="text-[11px] text-textSecondary">Skills: {w.skills?.join(', ') || 'General'}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        w.availability === 'available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {w.availability}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchCase(null)}
                  className="px-4 py-2 rounded-xl border border-borderToken font-semibold text-textSecondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchSubmitting || !selectedWorkerId}
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold shadow hover:bg-blue-400 disabled:opacity-50"
                >
                  {dispatchSubmitting ? 'Dispatching...' : 'Advance → dispatched'}
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
