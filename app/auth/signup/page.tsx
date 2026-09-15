'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, setAuthToken, setUser } from '@/lib/api';
import { Lock, Mail, User, Phone, MapPin, Wrench, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'customer' | 'worker'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [savedAddress, setSavedAddress] = useState('');
  const [shopName, setShopName] = useState('');
  const [skills, setSkills] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          phone,
          savedAddress: role === 'customer' ? savedAddress : null,
          shopName: role === 'worker' ? shopName : null,
          skills: role === 'worker' ? skills.split(',').map((s) => s.trim()).filter(Boolean) : null,
        }),
      });

      if (res.user.approvalStatus === 'pending_approval') {
        setSuccessMsg('Section 10 Compliance Notice: Field Worker account registered successfully and is now pending Admin approval. An administrator must approve your account before you can accept dispatches.');
      } else {
        setAuthToken(res.token);
        setUser(res.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-textPrimary">Create Agent X Account</h1>
        <p className="text-xs text-textSecondary">Select role below. Note: Admin accounts are invite-only per Section 10 security policy.</p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-bgPanel p-1.5 rounded-xl border border-borderToken">
        <button
          type="button"
          onClick={() => setRole('customer')}
          className={`py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
            role === 'customer'
              ? 'bg-accentBlue text-white shadow-md'
              : 'text-textSecondary hover:text-textPrimary hover:bg-bgPanelRaised'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Customer Account</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('worker')}
          className={`py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
            role === 'worker'
              ? 'bg-accentBlue text-white shadow-md'
              : 'text-textSecondary hover:text-textPrimary hover:bg-bgPanelRaised'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Field Worker (Pending Approval)</span>
        </button>
      </div>

      {/* Section 10 Banner */}
      {role === 'worker' && (
        <div className="p-3.5 rounded-xl bg-accentBlue/10 border border-accentBlue/20 text-xs text-accentBlueBright flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-accentBlue" />
          <div>
            <span className="font-bold">Section 10 Security Rule:</span> Field Worker signups are submitted to a <code className="font-mono bg-accentBlue/20 px-1 py-0.5 rounded text-white">pending_approval</code> state. An admin will review and approve your credentials before your account becomes active.
          </div>
        </div>
      )}

      {/* Main Signup Form */}
      <form onSubmit={handleSubmit} className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-4 shadow-xl">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Registration Submitted</span>
            </div>
            <p>{successMsg}</p>
            <Link href="/auth/login" className="inline-block pt-2 text-accentBlue font-bold underline">
              Return to Sign In
            </Link>
          </div>
        )}

        {!successMsg && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-textSecondary">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Vance"
                required
                className="w-full bg-bgPrimary border border-borderToken rounded-xl px-4 py-2.5 text-xs text-textPrimary outline-none focus:border-accentBlue transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-textSecondary">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan@domain.com"
                required
                className="w-full bg-bgPrimary border border-borderToken rounded-xl px-4 py-2.5 text-xs text-textPrimary outline-none focus:border-accentBlue transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-textSecondary">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-bgPrimary border border-borderToken rounded-xl px-4 py-2.5 text-xs text-textPrimary outline-none focus:border-accentBlue transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-textSecondary">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full bg-bgPrimary border border-borderToken rounded-xl px-4 py-2.5 text-xs text-textPrimary outline-none focus:border-accentBlue transition-colors"
              />
            </div>

            {role === 'customer' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-textSecondary">Service / Delivery Address</label>
                <input
                  type="text"
                  value={savedAddress}
                  onChange={(e) => setSavedAddress(e.target.value)}
                  placeholder="100 Enterprise Way, Suite 400"
                  className="w-full bg-bgPrimary border border-borderToken rounded-xl px-4 py-2.5 text-xs text-textPrimary outline-none focus:border-accentBlue transition-colors"
                />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-textSecondary">Shop / Business Name</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Vance HVAC & Industrial Repair"
                    className="w-full bg-bgPrimary border border-borderToken rounded-xl px-4 py-2.5 text-xs text-textPrimary outline-none focus:border-accentBlue transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-textSecondary">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="HVAC, Electrical, Plumbing"
                    className="w-full bg-bgPrimary border border-borderToken rounded-xl px-4 py-2.5 text-xs text-textPrimary outline-none focus:border-accentBlue transition-colors"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-accentBlue text-white font-semibold text-xs shadow-lg shadow-accentBlue/25 hover:bg-accentBlueBright transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : role === 'customer' ? 'Create Customer Account' : 'Submit Worker Registration'}
            </button>
          </>
        )}

        <div className="text-center pt-2">
          <p className="text-xs text-textSecondary">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-accentBlue font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
