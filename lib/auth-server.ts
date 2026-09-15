import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export const JWT_SECRET = process.env.JWT_SECRET || 'agent-x-super-secret-key-2026';

export interface DecodedUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function generateToken(user: DecodedUser) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyUserToken(req: NextRequest): DecodedUser | null {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;
    return decoded;
  } catch (err) {
    return null;
  }
}

export function requireRoleGuard(req: NextRequest, allowedRoles: string[]): { user: DecodedUser } | NextResponse {
  const user = verifyUserToken(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Access Denied: Authentication token required.' },
      { status: 401 }
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Access Denied: You are not authorized to access this page.', code: 'ROLE_MISMATCH' },
      { status: 403 }
    );
  }

  return { user };
}
