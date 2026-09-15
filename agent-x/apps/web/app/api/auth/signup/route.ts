import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth-server';
import { ensureDatabaseSeeded } from '@/lib/seed';

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const { name, email, password, role = 'customer', phone, savedAddress, shopName, skills } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    let accountStatus = 'active';
    if (role === 'worker' || role === 'admin') {
      accountStatus = 'pending_approval';
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : (skills ? JSON.stringify([skills]) : null);

    const newUser = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        accountStatus,
        phone,
        savedAddress,
        shopName,
        skills: skillsJson,
        availability: role === 'worker' ? 'available' : null,
      },
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    return NextResponse.json(
      {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          accountStatus: newUser.accountStatus,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}
