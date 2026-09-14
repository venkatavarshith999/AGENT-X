'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme, ThemeMode } from './theme-provider';
import { getAuthToken, getUser, setAuthToken, setUser, apiFetch } from '@/lib/api';
import { ShieldAlert, Sun, Moon, User, LogOut, CheckCircle2, ArrowRight, Zap } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setCurrentUser(null);
    router.push('/auth/login');
  };

  const quickDemoLogin = async (role: 'customer' | 'worker' | 'admin') => {
    let email = 'alex.customer@agentx.com';
    let password = 'Customer123!';
    if (role === 'worker') {
      email = 'marcus.worker@agentx.com';
      password = 'Worker123!';
    } else if (role === 'admin') {
      email = 'admin@agentx.com';
      password = 'Admin123!';
    }

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuthToken(res.token);
      setUser(res.user);
      setCurrentUser(res.user);

      if (res.user.role === 'admin') router.push('/admin');
      else if (res.user.role === 'worker') router.push('/worker');
      else router.push('/dashboard');
    } catch (err: any) {
      alert(`Demo login error: ${err.message}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bgPanel/80 border-b border-borderToken px-4 lg:px-8 py-3.5 flex items-center justify-between transition-colors">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accentBlue to-accentBlueBright flex items-center justify-center shadow-lg shadow-accentBlue/20 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-textPrimary tracking-tight">AGENT X</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-accentBlue/10 text-accentBlue border border-accentBlue/20">Enterprise</span>
            </div>
            <p className="text-[11px] text-textSecondary hidden sm:block">Autonomous State-Driven Resolution</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium text-textSecondary">
          <Link href="/features" className="px-3 py-1.5 rounded-lg hover:text-textPrimary hover:bg-bgPanelRaised transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="px-3 py-1.5 rounded-lg hover:text-textPrimary hover:bg-bgPanelRaised transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="px-3 py-1.5 rounded-lg hover:text-textPrimary hover:bg-bgPanelRaised transition-colors">
            Architecture
          </Link>
        </nav>
      </div>

      {/* Action & Controls */}
      <div className="flex items-center space-x-3">
        {/* Quick Demo Switcher Pills */}
        <div className="hidden xl:flex items-center space-x-1.5 bg-bgPrimary/60 p-1 rounded-xl border border-borderToken text-xs font-semibold">
          <span className="text-[11px] text-textSecondary px-2">Demo Quick-Role:</span>
          <button
            onClick={() => quickDemoLogin('customer')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currentUser?.role === 'customer'
                ? 'bg-accentBlue text-white shadow-md'
                : 'text-textSecondary hover:text-textPrimary hover:bg-bgPanelRaised'
            }`}
          >
            Customer
          </button>
          <button
            onClick={() => quickDemoLogin('worker')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currentUser?.role === 'worker'
                ? 'bg-accentBlue text-white shadow-md'
                : 'text-textSecondary hover:text-textPrimary hover:bg-bgPanelRaised'
            }`}
          >
            Worker
          </button>
          <button
            onClick={() => quickDemoLogin('admin')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currentUser?.role === 'admin'
                ? 'bg-accentBlue text-white shadow-md'
                : 'text-textSecondary hover:text-textPrimary hover:bg-bgPanelRaised'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Theme Selector */}
        <div className="relative">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeMode)}
            className="bg-bgPanelRaised text-textPrimary text-xs font-medium px-3 py-2 rounded-xl border border-borderToken outline-none cursor-pointer hover:border-accentBlue/50 transition-colors"
          >
            <option value="dark-navy">🌙 Dark Navy (Default)</option>
            <option value="cloud-white">☀️ Cloud White (Option A)</option>
            <option value="soft-ice">🧊 Soft Ice (Option B)</option>
            <option value="midnight-contrast">⚡ Midnight High Contrast (Option C)</option>
          </select>
        </div>

        {/* User Auth Buttons */}
        {currentUser ? (
          <div className="flex items-center space-x-3">
            <Link
              href={
                currentUser.role === 'admin'
                  ? '/admin'
                  : currentUser.role === 'worker'
                  ? '/worker'
                  : '/dashboard'
              }
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-accentBlue text-white text-xs font-semibold shadow-lg shadow-accentBlue/20 hover:bg-accentBlueBright transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>{currentUser.name.split(' ')[0]} ({currentUser.role})</span>
            </Link>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-bgPanelRaised transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              href="/auth/login"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-textPrimary hover:bg-bgPanelRaised transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-3.5 py-2 rounded-xl bg-accentBlue text-white text-xs font-semibold shadow-lg shadow-accentBlue/20 hover:bg-accentBlueBright transition-all flex items-center space-x-1"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
