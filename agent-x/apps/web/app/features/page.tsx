import React from 'react';
import { ShieldCheck, Cpu, Activity, Clock, CheckCircle2, Lock } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-textPrimary">Enterprise Platform Features</h1>
        <p className="text-textSecondary max-w-2xl mx-auto">Built from the ground up for strict state machine enforcement, realtime dispatch, and policy compliance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-3">
          <Activity className="w-8 h-8 text-accentBlue" />
          <h3 className="text-lg font-bold text-textPrimary">State Machine Engine</h3>
          <p className="text-sm text-textSecondary">
            Cases transition sequentially: submitted → policy_checked → dispatched → in_progress → resolved. No state can be skipped from the API layer.
          </p>
        </div>

        <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-3">
          <ShieldCheck className="w-8 h-8 text-accentBlue" />
          <h3 className="text-lg font-bold text-textPrimary">Policy Engine & Fee Estimation</h3>
          <p className="text-sm text-textSecondary">
            Automated warranty coverage checking and transparent customer charge calculation prior to field dispatch.
          </p>
        </div>

        <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-3">
          <Cpu className="w-8 h-8 text-accentBlue" />
          <h3 className="text-lg font-bold text-textPrimary">Intelligent Worker Dispatch</h3>
          <p className="text-sm text-textSecondary">
            Worker matching by real-time availability (available, on_job, off_duty), skill sets, and location proximity.
          </p>
        </div>

        <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-3">
          <Lock className="w-8 h-8 text-accentBlue" />
          <h3 className="text-lg font-bold text-textPrimary">Section 10 Security Architecture</h3>
          <p className="text-sm text-textSecondary">
            Public signup restricted to customer role; worker registrations require admin approval; admin creation restricted to invite links.
          </p>
        </div>
      </div>
    </div>
  );
}
