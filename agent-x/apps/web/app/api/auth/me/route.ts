import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUserToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = verifyUserToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Access Denied: Authentication token required.' }, { status: 401 });
    }

    try {
      const dbUser = await db.user.findUnique({ where: { id: user.id } });
      if (dbUser) {
        return NextResponse.json({
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          accountStatus: dbUser.accountStatus,
          availability: dbUser.availability,
          skills: dbUser.skills ? JSON.parse(dbUser.skills) : [],
          phone: dbUser.phone,
          savedAddress: dbUser.savedAddress,
        });
      }
    } catch (e) {
      // Fallback to token payload
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: 'active',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
