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

    if (user.role !== 'worker' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access Denied: You are not authorized to access this page.', code: 'ROLE_MISMATCH' },
        { status: 403 }
      );
    }

    const { workerNotes } = await req.json().catch(() => ({}));

    const caseItem = await db.case.findUnique({ where: { id: params.id } });
    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (caseItem.status !== 'in_progress') {
      return NextResponse.json(
        { error: `Invalid transition. Resolution requires status 'in_progress', current status is '${caseItem.status}'` },
        { status: 400 }
      );
    }

    if (user.role === 'worker' && caseItem.workerId !== user.id) {
      return NextResponse.json({ error: 'Access Denied: Case is assigned to a different worker.' }, { status: 403 });
    }

    const updatedCase = await db.case.update({
      where: { id: params.id },
      data: {
        status: 'resolved',
        workerNotes: workerNotes || null,
        events: {
          create: {
            label: `Service resolved by ${user.name}.${workerNotes ? ` Notes: "${workerNotes}"` : ''}`,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        assignedWorker: { select: { id: true, name: true, phone: true } },
        events: { orderBy: { createdAt: 'asc' } },
        feedback: true,
      },
    });

    return NextResponse.json(updatedCase);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
