'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Wrench,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Activity,
  Layers,
  Clock,
  ChevronRight,
  Star,
  Zap,
  Lock,
  Cpu,
} from 'lucide-react';

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: '1. Issue Intake (submitted)',
      role: 'Customer',
      desc: 'Customer submits a issue report with photos, location, and description.',
      detail: 'Event logged: Case submitted by customer Alex Mercer.',
      badge: 'submitted',
    },
    {
      title: '2. Policy Evaluation (policy_checked)',
      role: 'Admin',
      desc: 'Admin/Rules Engine inspects warranty coverage and sets fee estimate or waiver.',
      detail: 'Event logged: Policy evaluation completed — Covered under warranty ($0 charge).',
      badge: 'policy_checked',
    },
    {
      title: '3. Worker Dispatch (dispatched)',
      role: 'Admin & Dispatcher',
      desc: 'Proximity & skill matching algorithm assigns the optimal available field technician.',
      detail: 'Event logged: Dispatched to Field Tech Marcus Vance (HVAC & Electrical Specialist).',
      badge: 'dispatched',
    },
    {
      title: '4. On-Site Diagnostics (in_progress)',
      role: 'Field Worker',
      desc: 'Technician arrives on site, updates status to in_progress, and begins repair.',
      detail: 'Event logged: Technician arrived on-site and initiated repair work.',
      badge: 'in_progress',
    },
    {
      title: '5. Verification & Feedback (resolved)',
      role: 'Worker & Customer',
      desc: 'Worker enters mandatory resolution notes to resolve. Customer rates 1-5 stars.',
      detail: 'Event logged: Resolution completed & 5-star customer rating submitted.',
      badge: 'resolved',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 space-y-20">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-accentBlue/10 border border-accentBlue/20 text-accentBlue text-xs font-semibold tracking-wide">
          <Zap className="w-4 h-4" />
          <span>Section 7 Compliant State Machine Engine</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-textPrimary leading-tight">
          Not a Ticketing Tool. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accentBlue to-accentBlueBright">
            Real Enterprise State Changes.
          </span>
        </h1>
        <p className="text-lg text-textSecondary max-w-2xl mx-auto leading-relaxed">
          Agent X Enterprise takes customer-reported issues from intake through policy check, field worker dispatch, on-site resolution, and customer feedback.
        </p>

        {/* Action CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/auth/signup"
            className="px-6 py-3.5 rounded-xl bg-accentBlue text-white font-semibold shadow-xl shadow-accentBlue/25 hover:bg-accentBlueBright transition-all flex items-center space-x-2 text-sm"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3.5 rounded-xl bg-bgPanelRaised text-textPrimary border border-borderToken font-semibold hover:border-accentBlue/40 transition-colors text-sm"
          >
            Demo Sign In
          </Link>
        </div>
      </div>

      {/* Interactive State Machine Pipeline Visualizer */}
      <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 lg:p-8 space-y-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-borderToken pb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-textPrimary flex items-center space-x-2">
              <Activity className="w-5 h-5 text-accentBlue" />
              <span>Interactive State Machine Pipeline</span>
            </h2>
            <p className="text-xs text-textSecondary">Click any state to preview server-side rules and transition events</p>
          </div>
          <div className="text-xs text-textSecondary bg-bgPrimary px-3 py-1.5 rounded-lg border border-borderToken font-mono">
            State Sequence: submitted → policy_checked → dispatched → in_progress → resolved
          </div>
        </div>

        {/* State Node Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {steps.map((s, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={s.badge}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-xl text-left border transition-all relative overflow-hidden ${
                  isActive
                    ? 'bg-accentBlue/10 border-accentBlue text-textPrimary shadow-lg shadow-accentBlue/10 scale-[1.02]'
                    : 'bg-bgPrimary/60 border-borderToken text-textSecondary hover:border-textSecondary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-accentBlue">Step {idx + 1}</span>
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-accentBlue animate-pulse' : 'bg-borderToken'}`} />
                </div>
                <div className="font-bold text-sm text-textPrimary truncate">{s.badge}</div>
                <div className="text-[11px] text-textSecondary mt-1">{s.role}</div>
              </button>
            );
          })}
        </div>

        {/* Active State Detail Panel */}
        <div className="bg-bgPrimary/90 border border-borderToken rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-2.5 py-1 rounded-md bg-accentBlue/10 text-accentBlue font-mono text-xs font-semibold border border-accentBlue/20 uppercase">
                {steps[activeStep].badge}
              </span>
              <h3 className="text-lg font-bold text-textPrimary mt-2">{steps[activeStep].title}</h3>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-bgPanelRaised text-textSecondary border border-borderToken">
              Role: {steps[activeStep].role}
            </span>
          </div>

          <p className="text-sm text-textSecondary">{steps[activeStep].desc}</p>

          <div className="p-3 bg-bgPanel rounded-lg border border-borderToken text-xs font-mono text-accentBlueBright flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-accentBlue" />
            <span>{steps[activeStep].detail}</span>
          </div>
        </div>
      </div>

      {/* Three Roles Grid */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-textPrimary">Three Tailored Enterprise Role Portals</h2>
          <p className="text-sm text-textSecondary">Enforced server-side permissions and role guard middleware</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer */}
          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-4 hover:border-accentBlue/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-accentBlue/10 text-accentBlue flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-textPrimary">1. Customer Portal</h3>
            <ul className="text-xs text-textSecondary space-y-2">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accentBlue" />
                <span>Submit issue requests with description & photos</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accentBlue" />
                <span>Real-time event timeline & technician tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accentBlue" />
                <span>Submit 1-5 star rating & feedback upon resolution</span>
              </li>
            </ul>
          </div>

          {/* Admin */}
          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-4 hover:border-accentBlue/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-accentBlue/10 text-accentBlue flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-textPrimary">2. Admin & Dispatcher</h3>
            <ul className="text-xs text-textSecondary space-y-2">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accentBlue" />
                <span>Policy Engine check (set warranty coverage & charges)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accentBlue" />
                <span>Intelligent Field Worker dispatch matching</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accentBlue" />
                <span>Worker approval workflow (Section 10 compliant)</span>
              </li>
            </ul>
          </div>

          {/* Worker */}
          <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-4 hover:border-accentBlue/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-accentBlue/10 text-accentBlue flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-textPrimary">3. Field Worker Portal</h3>
            <ul className="text-xs text-textSecondary space-y-2">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accentBlue" />
                <span>Availability toggle (Available, On Job, Off Duty)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accentBlue" />
                <span>Mark on-site arrival (in_progress)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accentBlue" />
                <span>Enforced resolution form with mandatory worker notes</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
