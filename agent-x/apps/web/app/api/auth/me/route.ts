import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/auth-server';
import { ensureDatabaseSeeded } from '@/lib/seed';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const userPayload = verifyUserToken(req);
    if (!userPayload) {
      return NextResponse.json({ error: 'Access Denied: Authentication token required.' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userPayload.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        availability: true,
        phone: true,
        savedAddress: true,
        shopName: true,
        skills: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      skills: user.skills ? JSON.parse(user.skills) : [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
