import bcrypt from 'bcryptjs';
import { db } from './db';

export async function seedDatabase() {
  console.log('[Seed] Seeding Agent X Enterprise database...');

  // Reset existing data cleanly
  await db.auditLog.deleteMany({});
  await db.feedback.deleteMany({});
  await db.caseEvent.deleteMany({});
  await db.case.deleteMany({});
  await db.user.deleteMany({});

  const passwordHashCustomer = await bcrypt.hash('Customer123!', 10);
  const passwordHashWorker = await bcrypt.hash('Worker123!', 10);
  const passwordHashAdmin = await bcrypt.hash('Admin123!', 10);

  // 1. Create Admin
  const admin = await db.user.create({
    data: {
      name: 'Elena Rostova (Admin)',
      email: 'admin@agentx.com',
      passwordHash: passwordHashAdmin,
      role: 'admin',
      emailVerified: true,
      accountStatus: 'active',
      permissionLevel: 'superadmin',
    },
  });

  // 2. Create Workers
  const worker1 = await db.user.create({
    data: {
      name: 'Marcus Vance',
      email: 'marcus.worker@agentx.com',
      passwordHash: passwordHashWorker,
      role: 'worker',
      emailVerified: true,
      accountStatus: 'active',
      availability: 'available',
      phone: '+1 (555) 019-2834',
      shopName: 'Vance HVAC & Electrical',
      savedAddress: '742 Evergreen Terrace, Sector 4',
      skills: JSON.stringify(['HVAC', 'Electrical Repair', 'Smart Thermostats']),
    },
  });

  const worker2 = await db.user.create({
    data: {
      name: 'Sarah Lin',
      email: 'sarah.worker@agentx.com',
      passwordHash: passwordHashWorker,
      role: 'worker',
      emailVerified: true,
      accountStatus: 'active',
      availability: 'on_job',
      phone: '+1 (555) 014-9921',
      shopName: 'ProFlow Plumbing & Tech',
      savedAddress: '1088 Innovation Way, North District',
      skills: JSON.stringify(['Plumbing', 'Water Heaters', 'Leak Detection']),
    },
  });

  const workerPending = await db.user.create({
    data: {
      name: 'David Miller (Pending Worker)',
      email: 'david.worker@agentx.com',
      passwordHash: passwordHashWorker,
      role: 'worker',
      emailVerified: true,
      accountStatus: 'pending_approval',
      availability: 'available',
      phone: '+1 (555) 088-7711',
      shopName: 'Miller Solar Solutions',
      skills: JSON.stringify(['Solar Panel Maintenance', 'Inverters']),
    },
  });

  const adminPending = await db.user.create({
    data: {
      name: 'Rachel Zane (Pending Admin)',
      email: 'rachel.admin@agentx.com',
      passwordHash: passwordHashAdmin,
      role: 'admin',
      emailVerified: true,
      accountStatus: 'pending_approval',
      phone: '+1 (555) 099-3322',
      permissionLevel: 'standard',
    },
  });

  // 3. Create Customer
  const customer = await db.user.create({
    data: {
      name: 'Alex Mercer',
      email: 'alex.customer@agentx.com',
      passwordHash: passwordHashCustomer,
      role: 'customer',
      emailVerified: true,
      accountStatus: 'active',
      phone: '+1 (555) 012-3456',
      savedAddress: '450 Tech Park Boulevard, Suite 12, San Francisco, CA',
    },
  });

  // 4. Create Pre-seeded Cases representing full state machine range
  // Case 1: Submitted state
  await db.case.create({
    data: {
      customerId: customer.id,
      reason: 'Central HVAC AC Unit Blowing Warm Air',
      description: 'The main HVAC compressor unit outside is making a buzzing sound and only circulating uncooled ambient air since yesterday afternoon.',
      status: 'submitted',
      photoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      events: {
        create: [
          { label: 'Case submitted by customer Alex Mercer: "Central HVAC AC Unit Blowing Warm Air"' },
        ],
      },
    },
  });

  // Case 2: Policy Checked state (Warranty covered, $0 charge)
  await db.case.create({
    data: {
      customerId: customer.id,
      reason: 'Emergency Water Heater Pressure Relief Leak',
      description: 'Water pressure relief valve on main tank is dripping continuously into overflow bucket.',
      status: 'policy_checked',
      policyCovered: true,
      charge: 0,
      photoUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
      events: {
        create: [
          { label: 'Case submitted by customer Alex Mercer: "Emergency Water Heater Pressure Relief Leak"' },
          { label: 'Policy evaluation completed by Admin: Covered under Warranty (Fee Waived)' },
        ],
      },
    },
  });

  // Case 3: Dispatched state (Non-covered, $150 charge)
  await db.case.create({
    data: {
      customerId: customer.id,
      reason: 'Main Breaker Panel Tripping Repeatedly',
      description: 'The 200A breaker trips when the server room cooling unit starts up.',
      status: 'dispatched',
      policyCovered: false,
      charge: 150,
      workerId: worker1.id,
      events: {
        create: [
          { label: 'Case submitted by customer Alex Mercer: "Main Breaker Panel Tripping Repeatedly"' },
          { label: 'Policy evaluation completed by Admin: Not Covered (Estimated Charge: $150)' },
          { label: `Dispatched to Field Technician: ${worker1.name} (${worker1.shopName})` },
        ],
      },
    },
  });

  // Case 4: Resolved state with feedback (Warranty covered, $0 charge)
  const resolvedCase = await db.case.create({
    data: {
      customerId: customer.id,
      reason: 'Smart Thermostats Offline Connection Failure',
      description: 'Thermostat screen un-responsive and failing to sync with central heating schedule.',
      status: 'resolved',
      policyCovered: true,
      charge: 0,
      workerId: worker1.id,
      workerNotes: 'Replaced faulty Wi-Fi control module on main board and recalibrated temperature sensors. System verified 100% operational.',
      workerConfirmed: true,
      events: {
        create: [
          { label: 'Case submitted by customer Alex Mercer: "Smart Thermostats Offline Connection Failure"' },
          { label: 'Policy evaluation completed by Admin: Covered under Warranty (Fee Waived)' },
          { label: `Dispatched to Field Technician: ${worker1.name}` },
          { label: 'Technician arrived on-site and initiated diagnostic work' },
          { label: 'Resolution completed by Technician. Notes: "Replaced faulty Wi-Fi control module on main board and recalibrated temperature sensors."' },
          { label: 'Customer rating submitted: ★★★★★ (5/5). Comment: "Marcus arrived promptly and fixed the issue within 30 minutes! Outstanding enterprise service."' },
        ],
      },
    },
  });

  await db.feedback.create({
    data: {
      caseId: resolvedCase.id,
      rating: 5,
      comment: 'Marcus arrived promptly and fixed the issue within 30 minutes! Outstanding enterprise service.',
    },
  });

  // 5. Create Pre-seeded Audit Logs
  await db.auditLog.create({
    data: {
      action: 'USER_APPROVED',
      targetUserId: worker1.id,
      targetUserEmail: worker1.email,
      targetUserRole: 'worker',
      performedByAdminId: admin.id,
      performedByAdminEmail: admin.email,
      details: `Approved worker registration for Marcus Vance (${worker1.email}). Verified HVAC & Electrical credentials.`,
    },
  });

  await db.auditLog.create({
    data: {
      action: 'USER_APPROVED',
      targetUserId: worker2.id,
      targetUserEmail: worker2.email,
      targetUserRole: 'worker',
      performedByAdminId: admin.id,
      performedByAdminEmail: admin.email,
      details: `Approved worker registration for Sarah Lin (${worker2.email}). Verified Plumbing certifications.`,
    },
  });

  console.log('[Seed] Database seeded successfully with accountStatus and AuditLogs!');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
