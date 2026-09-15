import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth-server';
import { ensureDatabaseSeeded } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const { name, email, password, role, phone, savedAddress, shopName, skills } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    if (!['customer', 'worker'].includes(role)) {
      return NextResponse.json({ error: 'Public registration is only allowed for Customer and Worker roles' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const accountStatus = role === 'customer' ? 'active' : 'pending_approval';

    const newUser = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        accountStatus,
        phone: phone || null,
        savedAddress: savedAddress || null,
        shopName: shopName || null,
        skills: skills ? JSON.stringify(skills) : null,
        availability: role === 'worker' ? 'available' : null,
      },
    });

    if (accountStatus === 'pending_approval') {
      return NextResponse.json(
        {
          message: 'Worker account created successfully. Account is pending administrator approval before login.',
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            accountStatus: newUser.accountStatus,
          },
        },
        { status: 202 }
      );
    }

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    return NextResponse.json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        accountStatus: newUser.accountStatus,
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
