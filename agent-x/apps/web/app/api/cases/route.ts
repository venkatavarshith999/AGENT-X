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

    let whereClause: any = {};
    if (user.role === 'customer') {
      whereClause.customerId = user.id;
    } else if (user.role === 'worker') {
      whereClause.workerId = user.id;
    }

    const cases = await db.case.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, savedAddress: true } },
        assignedWorker: { select: { id: true, name: true, phone: true, shopName: true, skills: true, availability: true } },
        events: { orderBy: { createdAt: 'asc' } },
        feedback: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(cases);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const user = verifyUserToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Access Denied: Authentication token required.' }, { status: 401 });
    }

    if (user.role !== 'customer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access Denied: You are not authorized to access this page.', code: 'ROLE_MISMATCH' },
        { status: 403 }
      );
    }

    const { reason, description, photoUrl } = await req.json();
    if (!reason || !description) {
      return NextResponse.json({ error: 'Reason and description are required' }, { status: 400 });
    }

    const newCase = await db.case.create({
      data: {
        customerId: user.id,
        reason,
        description,
        photoUrl: photoUrl || null,
        status: 'submitted',
        events: {
          create: {
            label: `Case submitted by ${user.name}: "${reason}"`,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        events: true,
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
