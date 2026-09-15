import bcrypt from 'bcryptjs';
import { db } from './db';

let seeded = false;
let seedPromise: Promise<void> | null = null;

export async function ensureDatabaseSeeded() {
  if (seeded) return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      // 1. Ensure SQLite schema tables exist in target db (/tmp/agentx_dev.db on Vercel)
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "passwordHash" TEXT NOT NULL,
          "role" TEXT NOT NULL,
          "emailVerified" BOOLEAN NOT NULL DEFAULT 1,
          "accountStatus" TEXT NOT NULL DEFAULT 'active',
          "avatarUrl" TEXT,
          "phone" TEXT,
          "savedAddress" TEXT,
          "shopName" TEXT,
          "skills" TEXT,
          "availability" TEXT,
          "permissionLevel" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Case" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "customerId" TEXT NOT NULL,
          "reason" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "photoUrl" TEXT,
          "policyCovered" BOOLEAN,
          "charge" REAL,
          "status" TEXT NOT NULL DEFAULT 'submitted',
          "workerId" TEXT,
          "workerNotes" TEXT,
          "workerConfirmed" BOOLEAN NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "CaseEvent" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "caseId" TEXT NOT NULL,
          "label" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Feedback" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "caseId" TEXT NOT NULL UNIQUE,
          "rating" INTEGER NOT NULL,
          "comment" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AuditLog" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "action" TEXT NOT NULL,
          "targetUserId" TEXT NOT NULL,
          "targetUserEmail" TEXT NOT NULL,
          "targetUserRole" TEXT NOT NULL,
          "performedByAdminId" TEXT NOT NULL,
          "performedByAdminEmail" TEXT NOT NULL,
          "details" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const passwordHashCustomer = await bcrypt.hash('Customer123!', 10);
      const passwordHashWorker = await bcrypt.hash('Worker123!', 10);
      const passwordHashAdmin = await bcrypt.hash('Admin123!', 10);

      // 1. Upsert Admin
      const admin = await db.user.upsert({
        where: { email: 'admin@agentx.com' },
        update: {},
        create: {
          id: 'usr-admin-001',
          name: 'Elena Rostova (Admin)',
          email: 'admin@agentx.com',
          passwordHash: passwordHashAdmin,
          role: 'admin',
          emailVerified: true,
          accountStatus: 'active',
          permissionLevel: 'superadmin',
        },
      });

      // 2. Upsert Workers
      const worker1 = await db.user.upsert({
        where: { email: 'marcus.worker@agentx.com' },
        update: {},
        create: {
          id: 'usr-worker-001',
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

      await db.user.upsert({
        where: { email: 'sarah.worker@agentx.com' },
        update: {},
        create: {
          id: 'usr-worker-002',
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

      await db.user.upsert({
        where: { email: 'david.worker@agentx.com' },
        update: {},
        create: {
          id: 'usr-worker-003',
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

      // 3. Upsert Customer
      const customer = await db.user.upsert({
        where: { email: 'alex.customer@agentx.com' },
        update: {},
        create: {
          id: 'usr-customer-001',
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

      // 4. Create initial cases if no cases exist
      const caseCount = await db.case.count();
      if (caseCount === 0) {
        await db.case.create({
          data: {
            id: 'case-demo-001',
            customerId: customer.id,
            reason: 'Central HVAC AC Unit Blowing Warm Air',
            description: 'The main HVAC compressor unit outside is making a buzzing sound and only circulating uncooled ambient air since yesterday afternoon.',
            status: 'submitted',
            photoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
            events: {
              create: [{ label: 'Case submitted by customer Alex Mercer: "Central HVAC AC Unit Blowing Warm Air"' }],
            },
          },
        });

        await db.case.create({
          data: {
            id: 'case-demo-002',
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

        const resolvedCase = await db.case.create({
          data: {
            id: 'case-demo-003',
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

        await db.feedback.upsert({
          where: { caseId: resolvedCase.id },
          update: {},
          create: {
            caseId: resolvedCase.id,
            rating: 5,
            comment: 'Marcus arrived promptly and fixed the issue within 30 minutes! Outstanding enterprise service.',
          },
        });

        await db.auditLog.create({
          data: {
            action: 'USER_APPROVED',
            targetUserId: worker1.id,
            targetUserEmail: worker1.email,
            targetUserRole: 'worker',
            performedByAdminId: admin.id,
            performedByAdminEmail: admin.email,
            details: `Approved worker registration for Marcus Vance (${worker1.email}). Verified HVAC credentials.`,
          },
        });
      }

      seeded = true;
      console.log('[AutoSeed] Demo accounts and cases seeded successfully!');
    } catch (err) {
      console.error('[AutoSeed] Failed to auto-seed database:', err);
    } finally {
      seedPromise = null;
    }
  })();

  return seedPromise;
}
