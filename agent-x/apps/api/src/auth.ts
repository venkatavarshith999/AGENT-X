import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';

export const JWT_SECRET = process.env.JWT_SECRET || 'agent-x-super-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export function generateToken(user: { id: string; email: string; role: string; name: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      name: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Access Denied: You are not authorized to access this page.' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access Denied: Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access Denied: You are not authorized to access this page.',
        code: 'ROLE_MISMATCH',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }
    next();
  };
}

export const authRouter = Router();

// Signup endpoint (Section 10 updated rules)
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'customer', phone, savedAddress, shopName, skills } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    let accountStatus = 'active';
    if (role === 'worker' || role === 'admin') {
      accountStatus = 'pending_approval';
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : (skills ? JSON.stringify([skills]) : null);

    const newUser = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        accountStatus,
        phone,
        savedAddress,
        shopName,
        skills: skillsJson,
        availability: role === 'worker' ? 'available' : null,
      },
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        accountStatus: newUser.accountStatus,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

// Login endpoint
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        error: `Your ${user.role} account is currently ${user.accountStatus.replace('_', ' ')}. Administrator approval is required before logging in.`,
        pendingApproval: user.accountStatus === 'pending_approval',
        accountStatus: user.accountStatus,
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        availability: user.availability,
        skills: user.skills ? JSON.parse(user.skills) : [],
        phone: user.phone,
        savedAddress: user.savedAddress,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Get current user profile
authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        availability: true,
        phone: true,
        savedAddress: true,
        shopName: true,
        skills: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      ...user,
      skills: user.skills ? JSON.parse(user.skills) : [],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
