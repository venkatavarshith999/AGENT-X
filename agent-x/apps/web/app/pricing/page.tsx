import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-textPrimary">Flexible Enterprise Plans</h1>
        <p className="text-textSecondary max-w-2xl mx-auto">Scale your field resolution operations with state-machine guaranteed accuracy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-textPrimary">Starter</h3>
            <div className="text-3xl font-extrabold text-textPrimary">$499 <span className="text-xs font-normal text-textSecondary">/ mo</span></div>
            <p className="text-xs text-textSecondary">For growing regional field support teams.</p>
            <ul className="text-xs text-textSecondary space-y-2 pt-2">
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-accentBlue" /><span>Up to 15 Field Workers</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-accentBlue" /><span>State Machine Engine</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-accentBlue" /><span>Customer Feedback Portal</span></li>
            </ul>
          </div>
          <Link href="/auth/signup" className="w-full py-2.5 rounded-xl border border-borderToken text-center text-xs font-semibold hover:border-accentBlue">Start Trial</Link>
        </div>

        <div className="bg-bgPanel border-2 border-accentBlue rounded-2xl p-6 space-y-6 flex flex-col justify-between relative shadow-xl shadow-accentBlue/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-accentBlue text-white text-[10px] uppercase font-bold tracking-wider">Most Popular</div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-textPrimary">Enterprise Pro</h3>
            <div className="text-3xl font-extrabold text-textPrimary">$1,499 <span className="text-xs font-normal text-textSecondary">/ mo</span></div>
            <p className="text-xs text-textSecondary">Full multi-role dispatch & policy engine.</p>
            <ul className="text-xs text-textSecondary space-y-2 pt-2">
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-accentBlue" /><span>Unlimited Field Workers</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-accentBlue" /><span>Automated Policy Engine</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-accentBlue" /><span>Real-time Socket Event Streams</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-accentBlue" /><span>Role Security Guards (Section 10)</span></li>
            </ul>
          </div>
          <Link href="/auth/signup" className="w-full py-2.5 rounded-xl bg-accentBlue text-white text-center text-xs font-semibold shadow-lg shadow-accentBlue/20 hover:bg-accentBlueBright">Get Started</Link>
        </div>

        <div className="bg-bgPanel border border-borderToken rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-textPrimary">Custom Corporate</h3>
            <div className="text-3xl font-extrabold text-textPrimary">Custom</div>
            <p className="text-xs text-textSecondary">For high-volume global service providers.</p>
            <ul className="text-xs text-textSecondary space-y-2 pt-2">
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-accentBlue" /><span>Dedicated Database Node</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-accentBlue" /><span>Custom API Integrations</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-accentBlue" /><span>SLA Guarantee</span></li>
            </ul>
          </div>
          <Link href="/contact" className="w-full py-2.5 rounded-xl border border-borderToken text-center text-xs font-semibold hover:border-accentBlue">Contact Sales</Link>
        </div>
      </div>
    </div>
  );
}
