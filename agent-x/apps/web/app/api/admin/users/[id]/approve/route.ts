import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/auth-server';

async function handleApprove(req: NextRequest, params: { id: string }) {
  try {
    const adminUser = verifyUserToken(req);
    if (!adminUser) {
      return NextResponse.json({ error: 'Access Denied: Authentication token required.' }, { status: 401 });
    }

    if (adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access Denied: You are not authorized to access this page.', code: 'ROLE_MISMATCH' },
        { status: 403 }
      );
    }

    const targetUser = await db.user.findUnique({ where: { id: params.id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const updatedUser = await db.user.update({
      where: { id: targetUser.id },
      data: { accountStatus: 'active' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
      },
    });

    await db.auditLog.create({
      data: {
        action: 'USER_APPROVED',
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role,
        performedByAdminId: adminUser.id,
        performedByAdminEmail: adminUser.email,
        details: `Approved ${targetUser.role} user account for ${targetUser.name}`,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handleApprove(req, params);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handleApprove(req, params);
}
