import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const counts = {
  users: await p.user.count(),
  doctors: await p.doctor.count(),
  schedules: await p.doctorSchedule.count(),
  appointments: await p.appointment.count(),
  triage: await p.triageAssessment.count(),
  payments: await p.paymentLog.count(),
  notifications: await p.notification.count(),
  specializations: await p.specialization.count(),
  audit: await p.auditLog.count(),
};
console.log(JSON.stringify(counts, null, 2));
await p.$disconnect();
