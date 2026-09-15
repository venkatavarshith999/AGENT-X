import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = verifyUserToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Access Denied: Authentication token required.' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access Denied: You are not authorized to access this page.', code: 'ROLE_MISMATCH' },
        { status: 403 }
      );
    }

    const { workerId } = await req.json();
    if (!workerId) {
      return NextResponse.json({ error: 'workerId is required for dispatch' }, { status: 400 });
    }

    const caseItem = await db.case.findUnique({ where: { id: params.id } });
    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (caseItem.status !== 'policy_checked') {
      return NextResponse.json(
        { error: `Invalid transition. Dispatch requires status 'policy_checked', current status is '${caseItem.status}'` },
        { status: 400 }
      );
    }

    const worker = await db.user.findUnique({ where: { id: workerId } });
    if (!worker || worker.role !== 'worker') {
      return NextResponse.json({ error: 'Selected worker is invalid or not a worker' }, { status: 400 });
    }

    const updatedCase = await db.case.update({
      where: { id: params.id },
      data: {
        workerId: worker.id,
        status: 'dispatched',
        events: {
          create: {
            label: `Worker ${worker.name} assigned and dispatched by Admin`,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        assignedWorker: { select: { id: true, name: true, phone: true, shopName: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return NextResponse.json(updatedCase);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
