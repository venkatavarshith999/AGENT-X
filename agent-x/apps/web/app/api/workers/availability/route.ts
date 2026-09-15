import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/auth-server';

async function updateAvailability(req: NextRequest) {
  try {
    const user = verifyUserToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Access Denied: Authentication token required.' }, { status: 401 });
    }

    if (user.role !== 'worker' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access Denied: You are not authorized to access this page.', code: 'ROLE_MISMATCH' },
        { status: 403 }
      );
    }

    const { availability } = await req.json();
    if (!availability || !['available', 'off_duty', 'on_job'].includes(availability)) {
      return NextResponse.json({ error: 'Invalid availability value' }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { availability },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        availability: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return updateAvailability(req);
}

export async function POST(req: NextRequest) {
  return updateAvailability(req);
}
