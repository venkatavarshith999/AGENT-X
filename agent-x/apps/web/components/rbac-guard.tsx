'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch, getAuthToken, setUser } from '@/lib/api';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: ('customer' | 'worker' | 'admin')[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const token = getAuthToken();
      if (!token) {
        setAccessDeniedMsg('Access Denied: You are not authorized to access this page.');
        setAuthorized(false);
        setTimeout(() => router.push('/auth/login'), 2000);
        return;
      }

      try {
        // Re-verify actual role from server JWT via GET /auth/me
        const userData = await apiFetch('/auth/me');
        setUser(userData);
        setUserRole(userData.role);

        if (allowedRoles.includes(userData.role)) {
          setAuthorized(true);
        } else {
          setAccessDeniedMsg('Access Denied: You are not authorized to access this page.');
          setAuthorized(false);

          // Auto redirect to user's authorized role portal
          const targetPortal =
            userData.role === 'admin'
              ? '/admin'
              : userData.role === 'worker'
              ? '/worker'
              : '/dashboard';

          setTimeout(() => {
            router.push(targetPortal);
          }, 2200);
        }
      } catch (err) {
        setAccessDeniedMsg('Access Denied: You are not authorized to access this page.');
        setAuthorized(false);
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    }

    checkAuth();
  }, [pathname]);

  if (authorized === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 text-xs text-textSecondary">
        <div className="flex items-center space-x-2 bg-bgPanel px-4 py-3 rounded-xl border border-borderToken">
          <div className="w-4 h-4 rounded-full border-2 border-accentBlue border-t-transparent animate-spin" />
          <span>Verifying role authorization permissions...</span>
        </div>
      </div>
    );
  }

  if (!authorized) {
    const targetPortal =
      userRole === 'admin'
        ? '/admin'
        : userRole === 'worker'
        ? '/worker'
        : '/dashboard';

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-bgPanel border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-red-400">Access Denied</h2>
            <p className="text-sm font-bold text-textPrimary leading-relaxed">
              Access Denied: You are not authorized to access this page.
            </p>
            {userRole && (
              <p className="text-xs text-textSecondary pt-1">
                You are currently logged in as a <span className="font-bold text-accentBlue uppercase">{userRole}</span>. This section is restricted to <span className="font-bold text-textPrimary uppercase">{allowedRoles.join(', ')}</span> users.
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-bgPrimary border border-borderToken text-xs text-textSecondary flex items-center justify-center space-x-2">
            <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>Redirecting to your authorized dashboard...</span>
          </div>

          <button
            onClick={() => router.push(userRole ? targetPortal : '/auth/login')}
            className="w-full py-3 rounded-xl bg-accentBlue text-white font-semibold text-xs shadow-lg shadow-accentBlue/25 hover:bg-accentBlueBright transition-all flex items-center justify-center space-x-2"
          >
            <span>Go to Authorized Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
