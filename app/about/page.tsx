import React from 'react';
import { Layers, Server, Cpu, Database, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-textPrimary">System Architecture</h1>
        <p className="text-textSecondary max-w-2xl mx-auto">
          Agent X Enterprise is an event-driven resolution engine built for full end-to-end auditability and strict state transitions.
        </p>
      </div>

      <div className="bg-bgPanel border border-borderToken rounded-2xl p-8 space-y-6">
        <h2 className="text-xl font-bold text-textPrimary flex items-center space-x-2">
          <Layers className="w-5 h-5 text-accentBlue" />
          <span>Layered Architecture Overview</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-bgPrimary border border-borderToken space-y-2">
            <div className="font-bold text-accentBlue flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <span>Backend API (Node/Express/TypeScript)</span>
            </div>
            <p className="text-textSecondary">
              Houses state machine guards, JWT authentication, Argon2/Bcrypt hashing, policy evaluation engine, and Socket.io realtime broadcasting.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-bgPrimary border border-borderToken space-y-2">
            <div className="font-bold text-accentBlue flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Database Layer (Prisma ORM)</span>
            </div>
            <p className="text-textSecondary">
              Models User roles (customer, worker, admin), Case state transitions, append-only CaseEvent logs, and Feedback ratings.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-bgPrimary border border-borderToken space-y-2">
            <div className="font-bold text-accentBlue flex items-center space-x-2">
              <Cpu className="w-4 h-4" />
              <span>Dispatch Engine</span>
            </div>
            <p className="text-textSecondary">
              Evaluates field worker availability (`available`, `on_job`, `off_duty`), skill qualifications, and job assignment states.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-bgPrimary border border-borderToken space-y-2">
            <div className="font-bold text-accentBlue flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Section 10 Role Protection</span>
            </div>
            <p className="text-textSecondary">
              Server-side `@Roles()` guard verification ensures customer, worker, and admin endpoints cannot be bypassed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
