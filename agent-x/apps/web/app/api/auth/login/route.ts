import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth-server';
import { ensureDatabaseSeeded } from '@/lib/seed';

export const dynamic = 'force-dynamic';

const DEMO_USERS: Record<string, any> = {
  'admin@agentx.com': {
    id: 'usr-admin-001',
    name: 'Elena Rostova (Admin)',
    email: 'admin@agentx.com',
    role: 'admin',
    accountStatus: 'active',
    availability: 'available',
    skills: [],
    phone: '+1 (555) 000-1111',
    savedAddress: 'Enterprise HQ, Sector 1',
  },
  'marcus.worker@agentx.com': {
    id: 'usr-worker-001',
    name: 'Marcus Vance',
    email: 'marcus.worker@agentx.com',
    role: 'worker',
    accountStatus: 'active',
    availability: 'available',
    skills: ['HVAC', 'Electrical Repair', 'Smart Thermostats'],
    phone: '+1 (555) 019-2834',
    savedAddress: '742 Evergreen Terrace, Sector 4',
  },
  'alex.customer@agentx.com': {
    id: 'usr-customer-001',
    name: 'Alex Mercer',
    email: 'alex.customer@agentx.com',
    role: 'customer',
    accountStatus: 'active',
    availability: null,
    skills: [],
    phone: '+1 (555) 012-3456',
    savedAddress: '450 Tech Park Boulevard, Suite 12, San Francisco, CA',
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    try {
      await ensureDatabaseSeeded();
      const user = await db.user.findUnique({ where: { email } });
      if (user) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (isMatch) {
          if (user.accountStatus !== 'active') {
            return NextResponse.json(
              {
                error: `Your ${user.role} account is currently ${user.accountStatus.replace('_', ' ')}. Administrator approval is required before logging in.`,
                pendingApproval: user.accountStatus === 'pending_approval',
                accountStatus: user.accountStatus,
              },
              { status: 403 }
            );
          }

          const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
          });

          return NextResponse.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              accountStatus: user.accountStatus,
              availability: user.availability,
              skills: user.skills ? JSON.parse(user.skills) : [],
              phone: user.phone,
              savedAddress: user.savedAddress,
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn('[Login Route] DB error, using fallback demo store:', dbErr);
    }

    // Fallback for demo users
    const demoUser = DEMO_USERS[email.toLowerCase()];
    if (demoUser) {
      const token = generateToken({
        id: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
        name: demoUser.name,
      });

      return NextResponse.json({
        token,
        user: demoUser,
      });
    }

    return NextResponse.json({ error: 'Invalid email or password credentials' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
