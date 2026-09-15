import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/auth-server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { policyCovered, charge } = await req.json();
    const caseItem = await db.case.findUnique({ where: { id: params.id } });

    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (caseItem.status !== 'submitted') {
      return NextResponse.json(
        { error: `Invalid transition. Policy check requires status 'submitted', current status is '${caseItem.status}'` },
        { status: 400 }
      );
    }

    const isCovered = Boolean(policyCovered);
    const chargeVal = isCovered ? 0 : Number(charge || 0);

    const updated = await db.case.update({
      where: { id: caseItem.id },
      data: {
        policyCovered: isCovered,
        charge: chargeVal,
        status: 'policy_checked',
        events: {
          create: {
            label: `Policy evaluation completed by Admin: ${isCovered ? 'Covered under Warranty (Fee Waived)' : `Not Covered (Estimated Charge: $${chargeVal})`}`,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
