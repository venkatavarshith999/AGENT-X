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

    const { rating, comment } = await req.json();
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }

    const caseItem = await db.case.findUnique({ where: { id: params.id } });
    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && caseItem.customerId !== user.id) {
      return NextResponse.json({ error: 'Access Denied: Feedback can only be provided by case owner.' }, { status: 403 });
    }

    const feedback = await db.feedback.upsert({
      where: { caseId: params.id },
      create: {
        caseId: params.id,
        rating: Math.round(rating),
        comment: comment || null,
      },
      update: {
        rating: Math.round(rating),
        comment: comment || null,
      },
    });

    await db.caseEvent.create({
      data: {
        caseId: params.id,
        label: `Customer rating submitted: ${rating}/5 stars. ${comment ? `Comment: "${comment}"` : ''}`,
      },
    });

    return NextResponse.json(feedback);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
