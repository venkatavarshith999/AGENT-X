import { Router, Response } from 'express';
import { db } from './db';
import { authenticateToken, requireRole, AuthenticatedRequest } from './auth';

export const dispatchRouter = Router();

// GET /admin/users?status=pending_approval - List users filtered by status
dispatchRouter.get('/admin/users', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    let whereClause: any = {};
    if (status) {
      whereClause.accountStatus = String(status);
    }

    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        shopName: true,
        skills: true,
        availability: true,
        accountStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map((u) => ({
      ...u,
      skills: u.skills ? JSON.parse(u.skills) : [],
    }));

    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/users/:id/approve - Approve pending worker/admin registration + write AuditLog
dispatchRouter.patch('/admin/users/:id/approve', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUser = await db.user.findUnique({ where: { id: req.params.id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const updatedUser = await db.user.update({
      where: { id: targetUser.id },
      data: {
        accountStatus: 'active',
        availability: targetUser.role === 'worker' ? 'available' : targetUser.availability,
      },
    });

    // Write Decoupled Append-Only AuditLog Entry
    await db.auditLog.create({
      data: {
        action: 'USER_APPROVED',
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role,
        performedByAdminId: req.user!.id,
        performedByAdminEmail: req.user!.email,
        details: `Approved ${targetUser.role} registration for ${targetUser.name} (${targetUser.email}). Account state changed to active.`,
      },
    });

    return res.json({
      message: `User ${targetUser.name} successfully approved.`,
      user: updatedUser,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/users/:id/reject - Reject pending worker/admin registration + write AuditLog
dispatchRouter.patch('/admin/users/:id/reject', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUser = await db.user.findUnique({ where: { id: req.params.id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const updatedUser = await db.user.update({
      where: { id: targetUser.id },
      data: { accountStatus: 'rejected' },
    });

    // Write Decoupled Append-Only AuditLog Entry
    await db.auditLog.create({
      data: {
        action: 'USER_REJECTED',
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role,
        performedByAdminId: req.user!.id,
        performedByAdminEmail: req.user!.email,
        details: `Rejected ${targetUser.role} registration for ${targetUser.name} (${targetUser.email}). Account state changed to rejected.`,
      },
    });

    return res.json({
      message: `User ${targetUser.name} rejected.`,
      user: updatedUser,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /admin/audit-logs - Fetch append-only audit logs
dispatchRouter.get('/admin/audit-logs', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /workers - Admin view of workers with availability
dispatchRouter.get('/workers', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workers = await db.user.findMany({
      where: { role: 'worker' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        shopName: true,
        skills: true,
        availability: true,
        accountStatus: true,
        savedAddress: true,
        casesAsWorker: {
          select: { id: true, status: true, updatedAt: true },
        },
      },
    });

    const formatted = workers.map((w) => ({
      ...w,
      skills: w.skills ? JSON.parse(w.skills) : [],
      activeJobsCount: w.casesAsWorker.filter((c) => c.status !== 'resolved').length,
    }));

    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /workers/availability - Worker toggles availability
dispatchRouter.patch('/workers/availability', authenticateToken, requireRole(['worker', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { availability } = req.body;
    if (!['available', 'on_job', 'off_duty'].includes(availability)) {
      return res.status(400).json({ error: 'Availability must be available, on_job, or off_duty' });
    }

    const updated = await db.user.update({
      where: { id: req.user!.id },
      data: { availability },
      select: { id: true, name: true, availability: true },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Deprecated alias for backwards compatibility
dispatchRouter.patch('/workers/:id/approve', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUser = await db.user.findUnique({ where: { id: req.params.id } });
    if (!targetUser) return res.status(404).json({ error: 'Worker not found' });

    const updated = await db.user.update({
      where: { id: req.params.id },
      data: { accountStatus: 'active', availability: 'available' },
    });

    await db.auditLog.create({
      data: {
        action: 'USER_APPROVED',
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role,
        performedByAdminId: req.user!.id,
        performedByAdminEmail: req.user!.email,
        details: `Approved worker ${targetUser.name}`,
      },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
