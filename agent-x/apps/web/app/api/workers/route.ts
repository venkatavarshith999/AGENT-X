import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/auth-server';
import { ensureDatabaseSeeded } from '@/lib/seed';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const user = verifyUserToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Access Denied: Authentication token required.' }, { status: 401 });
    }

    const workers = await db.user.findMany({
      where: { role: 'worker' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        shopName: true,
        skills: true,
        availability: true,
        accountStatus: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(workers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
