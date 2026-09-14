import { Router, Response } from 'express';
import { db } from './db';
import { authenticateToken, requireRole, AuthenticatedRequest } from './auth';
import { broadcastEvent } from './realtime';

export const casesRouter = Router();

// State machine valid transitions definition
const ALLOWED_TRANSITIONS: Record<string, string> = {
  submitted: 'policy_checked',
  policy_checked: 'dispatched',
  dispatched: 'in_progress',
  in_progress: 'resolved',
};

// GET /cases - role-scoped list (own cases / worker assigned jobs / full admin queue)
casesRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, id: userId } = req.user!;
    let whereClause: any = {};

    if (role === 'customer') {
      whereClause.customerId = userId;
    } else if (role === 'worker') {
      whereClause.workerId = userId;
    }
    // Admin sees all cases

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

    return res.json(cases);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /cases/:id
casesRouter.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const caseItem = await db.case.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, savedAddress: true } },
        assignedWorker: { select: { id: true, name: true, phone: true, shopName: true, skills: true, availability: true } },
        events: { orderBy: { createdAt: 'asc' } },
        feedback: true,
      },
    });

    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Role scope check
    if (req.user!.role === 'customer' && caseItem.customerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user!.role === 'worker' && caseItem.workerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(caseItem);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /cases - customer submits case (Status -> 'submitted')
casesRouter.post('/', authenticateToken, requireRole(['customer', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason, description, photoUrl } = req.body;
    if (!reason || !description) {
      return res.status(400).json({ error: 'Reason and description are required' });
    }

    const newCase = await db.case.create({
      data: {
        customerId: req.user!.id,
        reason,
        description,
        photoUrl: photoUrl || null,
        status: 'submitted',
        events: {
          create: {
            label: `Case submitted by ${req.user!.name}: "${reason}"`,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        events: true,
      },
    });

    broadcastEvent('case:updated', { caseId: newCase.id, status: 'submitted', case: newCase });
    return res.status(201).json(newCase);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /cases/:id/policy - admin sets policyCovered & charge (Status -> 'policy_checked')
casesRouter.patch('/:id/policy', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { policyCovered, charge } = req.body;
    const caseItem = await db.case.findUnique({ where: { id: req.params.id } });

    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // State machine check
    if (caseItem.status !== 'submitted') {
      return res.status(400).json({
        error: `Invalid transition. Policy check requires status 'submitted', current status is '${caseItem.status}'`,
      });
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

    broadcastEvent('case:updated', { caseId: updated.id, status: 'policy_checked', case: updated });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /cases/:id/dispatch - admin assigns worker (Status -> 'dispatched')
casesRouter.patch('/:id/dispatch', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workerId } = req.body;
    if (!workerId) {
      return res.status(400).json({ error: 'Worker ID required' });
    }

    const caseItem = await db.case.findUnique({ where: { id: req.params.id } });
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // State machine check
    if (caseItem.status !== 'policy_checked') {
      return res.status(400).json({
        error: `Invalid state transition. Dispatching requires status 'policy_checked', current status is '${caseItem.status}'`,
      });
    }

    const worker = await db.user.findUnique({ where: { id: workerId } });
    if (!worker || worker.role !== 'worker') {
      return res.status(400).json({ error: 'Invalid worker ID specified' });
    }

    const updated = await db.case.update({
      where: { id: caseItem.id },
      data: {
        workerId: worker.id,
        status: 'dispatched',
        events: {
          create: {
            label: `Dispatched to Field Technician: ${worker.name} (${worker.shopName || 'Field Ops'})`,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        assignedWorker: { select: { id: true, name: true, phone: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Also update worker availability to 'on_job'
    await db.user.update({
      where: { id: worker.id },
      data: { availability: 'on_job' },
    });

    broadcastEvent('case:assigned', { caseId: updated.id, workerId: worker.id });
    broadcastEvent('case:updated', { caseId: updated.id, status: 'dispatched', case: updated });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /cases/:id/arrive - worker marks on-site arrival (Status -> 'in_progress')
casesRouter.patch('/:id/arrive', authenticateToken, requireRole(['worker', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const caseItem = await db.case.findUnique({ where: { id: req.params.id } });
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // State machine check
    if (caseItem.status !== 'dispatched') {
      return res.status(400).json({
        error: `Invalid transition. Mark Arrived requires status 'dispatched', current status is '${caseItem.status}'`,
      });
    }

    const updated = await db.case.update({
      where: { id: caseItem.id },
      data: {
        status: 'in_progress',
        events: {
          create: {
            label: `Technician arrived on-site and initiated diagnostic/repair work`,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        assignedWorker: { select: { id: true, name: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    broadcastEvent('case:updated', { caseId: updated.id, status: 'in_progress', case: updated });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /cases/:id/resolve - worker resolves job (Status -> 'resolved', requires workerNotes)
casesRouter.patch('/:id/resolve', authenticateToken, requireRole(['worker', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workerNotes } = req.body;
    if (!workerNotes || typeof workerNotes !== 'string' || !workerNotes.trim()) {
      return res.status(400).json({ error: 'Section 7 Rule: workerNotes is required and cannot be empty when resolving a case' });
    }

    const caseItem = await db.case.findUnique({ where: { id: req.params.id } });
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // State machine check
    if (caseItem.status !== 'in_progress') {
      return res.status(400).json({
        error: `Invalid transition. Resolving requires status 'in_progress', current status is '${caseItem.status}'`,
      });
    }

    const updated = await db.case.update({
      where: { id: caseItem.id },
      data: {
        status: 'resolved',
        workerNotes: workerNotes.trim(),
        workerConfirmed: true,
        events: {
          create: {
            label: `Resolution completed by Technician. Notes: "${workerNotes.trim()}"`,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        assignedWorker: { select: { id: true, name: true } },
        events: { orderBy: { createdAt: 'asc' } },
        feedback: true,
      },
    });

    // Restore worker availability to 'available'
    if (updated.workerId) {
      await db.user.update({
        where: { id: updated.workerId },
        data: { availability: 'available' },
      });
    }

    broadcastEvent('case:updated', { caseId: updated.id, status: 'resolved', case: updated });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /cases/:id/feedback - customer submits rating (Section 7 Rule: allowed only when status === 'resolved')
casesRouter.post('/:id/feedback', authenticateToken, requireRole(['customer', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const caseItem = await db.case.findUnique({
      where: { id: req.params.id },
      include: { feedback: true },
    });

    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Section 7 Rule check
    if (caseItem.status !== 'resolved') {
      return res.status(400).json({
        error: `Section 7 Rule: Feedback can only be submitted once case status is 'resolved'. Current status is '${caseItem.status}'`,
      });
    }

    if (caseItem.feedback) {
      return res.status(400).json({ error: 'Feedback has already been submitted for this case' });
    }

    const feedback = await db.feedback.create({
      data: {
        caseId: caseItem.id,
        rating,
        comment: comment ? comment.trim() : null,
      },
    });

    await db.caseEvent.create({
      data: {
        caseId: caseItem.id,
        label: `Customer rating submitted: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5). ${comment ? `Comment: "${comment}"` : ''}`,
      },
    });

    broadcastEvent('case:feedback_received', { caseId: caseItem.id, feedback });
    return res.status(201).json(feedback);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
