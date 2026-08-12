import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Remove only rows created by the smoke test, in FK-safe order.
const triages = await p.triageAssessment.findMany({ where: { primary_symptom: { contains: 'SMOKE TEST' } } });
const appts = await p.appointment.findMany({ where: { reason: { contains: 'SMOKE TEST' } } });
const apptIds = appts.map((a) => a.id);

const pay = await p.paymentLog.deleteMany({ where: { OR: [{ appointment_id: { in: apptIds } }, { transaction_ref: { startsWith: 'SMOKE-' } }] } });
const app = await p.appointment.deleteMany({ where: { id: { in: apptIds } } });
const tri = await p.triageAssessment.deleteMany({ where: { id: { in: triages.map((t) => t.id) } } });
const notif = await p.notification.deleteMany({ where: { message: { contains: 'SMOKE' } } });
const audit = await p.auditLog.deleteMany({
  where: { OR: [{ actor: 'smoke' }, { details: { contains: 'SMOKE' } }, { details: { contains: 'SmokeSpecialty' } }] },
});
await p.specialization.deleteMany({ where: { name: { startsWith: 'SmokeSpecialty' } } });

console.log('deleted:', { payments: pay.count, appointments: app.count, triages: tri.count, notifications: notif.count, audit: audit.count });

// Remaining audit rows referencing deleted appointments (booked/payment events keyed by entity_id)
const stale = await p.auditLog.deleteMany({ where: { entity_id: { in: [...apptIds, ...triages.map((t) => t.id)] } } });
console.log('stale audit rows removed:', stale.count);

const counts = {
  users: await p.user.count(), doctors: await p.doctor.count(), appointments: await p.appointment.count(),
  triage: await p.triageAssessment.count(), payments: await p.paymentLog.count(),
  notifications: await p.notification.count(), specializations: await p.specialization.count(), audit: await p.auditLog.count(),
};
console.log('final counts:', JSON.stringify(counts));
await p.$disconnect();
