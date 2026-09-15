import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth-server';
import { ensureDatabaseSeeded } from '@/lib/seed';

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password credentials' }, { status: 401 });
    }

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
