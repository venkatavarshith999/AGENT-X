'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, setAuthToken, setUser } from '@/lib/api';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Wrench, AlertCircle, Clock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('alex.customer@agentx.com');
  const [password, setPassword] = useState('Customer123!');
  const [activeRoleTab, setActiveRoleTab] = useState<'customer' | 'worker' | 'admin'>('customer');
  const [error, setError] = useState<string | null>(null);
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingApprovalNotice(null);
    setLoading(true);

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuthToken(res.token);
      setUser(res.user);

      // Strict Role Redirect based on server authenticated role
      if (res.user.role === 'admin') router.push('/admin');
      else if (res.user.role === 'worker') router.push('/worker');
      else router.push('/dashboard');
    } catch (err: any) {
      if (err.message && err.message.includes('pending')) {
        setPendingApprovalNotice(err.message);
      } else {
        setError(err.message || 'Invalid email or password credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoRole = (role: 'customer' | 'worker' | 'admin') => {
    setActiveRoleTab(role);
    setError(null);
    setPendingApprovalNotice(null);

    if (role === 'customer') {
      setEmail('alex.customer@agentx.com');
      setPassword('Customer123!');
    } else if (role === 'worker') {
      setEmail('marcus.worker@agentx.com');
      setPassword('Worker123!');
    } else if (role === 'admin') {
      setEmail('admin@agentx.com');
      setPassword('Admin123!');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      {/* Title & Subtitle */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-textPrimary tracking-tight">
          Sign In to Agent X
        </h1>
        <p className="text-xs sm:text-sm text-textSecondary font-medium">
          Enter credentials or pick a demo role account below
        </p>
      </div>

      {/* Pending Approval Full Screen Banner */}
      {pendingApprovalNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center space-x-3 text-amber-300">
            <Clock className="w-7 h-7 flex-shrink-0 animate-pulse" />
            <div>
              <h2 className="font-extrabold text-sm uppercase tracking-wider">Account Pending Administrator Approval</h2>
              <p className="text-xs text-amber-200/90 mt-1">{pendingApprovalNotice}</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-bgPrimary border border-borderToken text-xs text-textSecondary space-y-1">
            <div className="font-semibold text-textPrimary">What happens next?</div>
            <p>An enterprise administrator must verify your credentials and change your account status to <code className="font-mono bg-accentBlue/20 text-accentBlue px-1 rounded">active</code> before you can access this portal.</p>
          </div>
          <button
            onClick={() => setPendingApprovalNotice(null)}
            className="w-full py-2.5 rounded-xl border border-borderToken text-xs font-semibold text-textPrimary hover:bg-bgPanelRaised"
          >
            Try Another Account
          </button>
        </div>
      )}

      {/* QUICK EVALUATOR ACTIVE ACCOUNTS Box */}
      <div className="bg-bgPanel border border-borderToken rounded-2xl p-5 space-y-3.5 shadow-xl">
        <div className="text-[11px] font-bold text-accentBlue uppercase tracking-wider">
          QUICK EVALUATOR ACTIVE ACCOUNTS:
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleSelectDemoRole('customer')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all text-xs font-bold ${
              activeRoleTab === 'customer'
                ? 'bg-accentBlue/10 border-accentBlue text-accentBlue shadow-md scale-[1.02]'
                : 'bg-bgPrimary/80 border-borderToken text-textPrimary hover:border-accentBlue/40'
            }`}
          >
            <UserCheck className="w-5 h-5 text-accentBlue" />
            <span>Customer</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectDemoRole('worker')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all text-xs font-bold ${
              activeRoleTab === 'worker'
                ? 'bg-accentBlue/10 border-accentBlue text-accentBlue shadow-md scale-[1.02]'
                : 'bg-bgPrimary/80 border-borderToken text-textPrimary hover:border-accentBlue/40'
            }`}
          >
            <Wrench className="w-5 h-5 text-accentBlue" />
            <span>Worker</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectDemoRole('admin')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all text-xs font-bold ${
              activeRoleTab === 'admin'
                ? 'bg-accentBlue/10 border-accentBlue text-accentBlue shadow-md scale-[1.02]'
                : 'bg-bgPrimary/80 border-borderToken text-textPrimary hover:border-accentBlue/40'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-accentBlue" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Main Login Form Card */}
      <form onSubmit={handleSubmit} className="bg-bgPanel border border-borderToken rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-textSecondary">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-textSecondary" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex.customer@agentx.com"
              required
              className="w-full bg-bgPrimary border border-borderToken rounded-xl pl-10 pr-4 py-3 text-xs text-textPrimary font-medium outline-none focus:border-accentBlue transition-colors shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-textSecondary">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-textSecondary" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-bgPrimary border border-borderToken rounded-xl pl-10 pr-4 py-3 text-xs text-textPrimary font-medium outline-none focus:border-accentBlue transition-colors shadow-inner"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-accentBlue text-white font-bold text-xs shadow-lg shadow-accentBlue/25 hover:bg-accentBlueBright transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
        >
          <span>{loading ? 'Authenticating Role...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center pt-1">
          <p className="text-xs text-textSecondary font-medium">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-accentBlue font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
