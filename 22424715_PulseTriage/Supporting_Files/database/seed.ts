import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PulseTriage SQLite database...');

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // ── Clear existing data ───────────────────────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.paymentLog.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.triageAssessment.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.specialization.deleteMany();

  // ── Specializations ───────────────────────────────────────────────────────
  const specs = [
    'Cardiology', 'Pulmonology', 'General Practice', 'Neurology',
    'Orthopedics', 'Pediatrics', 'Dermatology', 'Gynecology',
    'Ophthalmology', 'Psychiatry', 'Oncology', 'Endocrinology'
  ];
  for (const name of specs) {
    await prisma.specialization.create({ data: { name } });
  }
  console.log('Specializations seeded');

  // ── Users ─────────────────────────────────────────────────────────────────
  const patientUser = await prisma.user.create({
    data: {
      id: 'patient-1',
      email: 'patient@ug.edu.gh',
      password: hash('password123'),
      full_name: 'Ama Serwaa Prempeh',
      role: 'PATIENT',
      phone: '+233 24 123 4567',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const doctorUser1 = await prisma.user.create({
    data: {
      id: 'doctor-1',
      email: 'dr.mensah@ug.edu.gh',
      password: hash('password123'),
      full_name: 'Dr. Kwame Mensah',
      role: 'DOCTOR',
      phone: '+233 20 888 9999',
      avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    },
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      id: 'doctor-2',
      email: 'dr.appiah@ug.edu.gh',
      password: hash('password123'),
      full_name: 'Dr. Akosua Appiah',
      role: 'DOCTOR',
      phone: '+233 55 444 3333',
      avatar_url: 'https://images.unsplash.com/photo-1594824813566-78a9327d7f76?w=150',
    },
  });

  const doctorUser3 = await prisma.user.create({
    data: {
      id: 'doctor-3',
      email: 'dr.owusu@ug.edu.gh',
      password: hash('password123'),
      full_name: 'Dr. Emmanuel Owusu',
      role: 'DOCTOR',
      phone: '+233 26 111 2222',
      avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      id: 'admin-1',
      email: 'admin@ug.edu.gh',
      password: hash('password123'),
      full_name: 'Prof. Solomon Mensah (Admin)',
      role: 'ADMIN',
      phone: '+233 30 200 0000',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
  });
  console.log('Users seeded');

  // ── Doctors ───────────────────────────────────────────────────────────────
  const doc1 = await prisma.doctor.create({
    data: {
      id: 'doc-1',
      user_id: doctorUser1.id,
      specialization: 'Cardiology',
      license_number: 'GMC-2018-8472',
      bio: 'Consultant Cardiologist with 12+ years experience in acute cardiovascular management and hypertension triage.',
      consultation_fee: 200.0,
      is_verified: true,
      rating: 4.9,
      avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    },
  });

  const doc2 = await prisma.doctor.create({
    data: {
      id: 'doc-2',
      user_id: doctorUser2.id,
      specialization: 'Pulmonology',
      license_number: 'GMC-2019-9912',
      bio: 'Specialist in respiratory disorders, asthma management, and urgent pulmonary care.',
      consultation_fee: 180.0,
      is_verified: true,
      rating: 4.85,
      avatar_url: 'https://images.unsplash.com/photo-1594824813566-78a9327d7f76?w=150',
    },
  });

  const doc3 = await prisma.doctor.create({
    data: {
      id: 'doc-3',
      user_id: doctorUser3.id,
      specialization: 'General Practice',
      license_number: 'GMC-2020-4410',
      bio: 'Experienced General Practitioner providing comprehensive family health triage and consultations.',
      consultation_fee: 150.0,
      is_verified: true,
      rating: 4.75,
      avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150',
    },
  });
  console.log('Doctors seeded');

  // ── Schedules ─────────────────────────────────────────────────────────────
  await prisma.doctorSchedule.createMany({
    data: [
      { doctor_id: doc1.id, day_of_week: 1, start_time: '08:00', end_time: '14:00', slot_duration_mins: 30 },
      { doctor_id: doc1.id, day_of_week: 3, start_time: '09:00', end_time: '15:00', slot_duration_mins: 30 },
      { doctor_id: doc2.id, day_of_week: 2, start_time: '10:00', end_time: '16:00', slot_duration_mins: 30 },
      { doctor_id: doc3.id, day_of_week: 1, start_time: '08:00', end_time: '17:00', slot_duration_mins: 30 },
    ],
  });
  console.log('Schedules seeded');

  // ── Triage Assessments ────────────────────────────────────────────────────
  const triage1 = await prisma.triageAssessment.create({
    data: {
      id: 'triage-101',
      patient_id: patientUser.id,
      primary_symptom: 'Chest Pain / Palpitations',
      pain_score: 8,
      symptom_duration: 'Sudden (< 6 hours)',
      red_flag_present: true,
      red_flags_json: JSON.stringify(['Chest pain or pressure radiates to arm/jaw']),
      severity_score: 95,
      urgency_level: 'EMERGENCY',
      triage_summary: 'Red flag emergency detected! Call 112 or proceed immediately to nearest emergency room.',
      action_recommendation: 'Red flag emergency detected! Call 112 or proceed immediately to nearest emergency room.',
      recommended_specialty: 'Emergency Cardiology',
    },
  });

  const triage2 = await prisma.triageAssessment.create({
    data: {
      id: 'triage-102',
      patient_id: patientUser.id,
      primary_symptom: 'Shortness of Breath / Asthma / Cough',
      pain_score: 6,
      symptom_duration: '1-2 days',
      red_flag_present: false,
      red_flags_json: JSON.stringify([]),
      severity_score: 65,
      urgency_level: 'URGENT',
      triage_summary: 'Urgent non-emergency case. Book appointment within 24 hours.',
      action_recommendation: 'Urgent non-emergency case. Book appointment within 24 hours.',
      recommended_specialty: 'Pulmonology',
    },
  });
  console.log('Triage records seeded');

  // ── Appointments ──────────────────────────────────────────────────────────
  const app1 = await prisma.appointment.create({
    data: {
      id: 'app-001',
      patient_id: patientUser.id,
      doctor_id: doc1.id,
      triage_id: triage1.id,
      appointment_date: '2026-08-14',
      start_time: '09:00 AM',
      end_time: '09:30 AM',
      status: 'CONFIRMED',
      payment_status: 'SIMULATED_SUCCESS',
      payment_amount: 200.0,
      reason: 'Chest pain followup & ECG consultation',
    },
  });

  const app2 = await prisma.appointment.create({
    data: {
      id: 'app-002',
      patient_id: patientUser.id,
      doctor_id: doc2.id,
      triage_id: triage2.id,
      appointment_date: '2026-08-16',
      start_time: '11:00 AM',
      end_time: '11:30 AM',
      status: 'CONFIRMED',
      payment_status: 'SIMULATED_SUCCESS',
      payment_amount: 180.0,
      reason: 'Wheezing and shortness of breath evaluation',
    },
  });
  console.log('Appointments seeded');

  // ── Payment Logs ──────────────────────────────────────────────────────────
  await prisma.paymentLog.createMany({
    data: [
      {
        appointment_id: app1.id,
        patient_id: patientUser.id,
        transaction_ref: 'MOMO-8839201',
        amount: 200.0,
        payment_method: 'MOBILE_MONEY',
        provider: 'MTN Mobile Money',
        status: 'SUCCESS',
      },
      {
        appointment_id: app2.id,
        patient_id: patientUser.id,
        transaction_ref: 'CARD-4491023',
        amount: 180.0,
        payment_method: 'CREDIT_CARD',
        provider: 'Visa / Mastercard',
        status: 'SUCCESS',
      },
    ],
  });
  console.log('Payment logs seeded');

  // ── Notifications ─────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        user_id: patientUser.id,
        title: 'Emergency Triage Alert',
        message: 'Your triage assessment has flagged an emergency. Please seek immediate care.',
        type: 'TRIAGE',
        is_read: false,
      },
      {
        user_id: patientUser.id,
        title: 'Appointment Confirmed',
        message: 'Your appointment with Dr. Kwame Mensah on Aug 14 has been confirmed.',
        type: 'APPOINTMENT',
        is_read: true,
      },
      {
        user_id: doctorUser1.id,
        title: 'New Patient Appointment',
        message: 'Ama Serwaa Prempeh has booked an appointment for Aug 14 at 9:00 AM.',
        type: 'APPOINTMENT',
        is_read: false,
      },
    ],
  });
  console.log('Notifications seeded');

  // ── Audit Logs ────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { actor: 'admin@ug.edu.gh', action: 'DOCTOR_VERIFIED', entity: 'Doctor', entity_id: doc1.id, details: 'Dr. Kwame Mensah verified' },
      { actor: 'patient@ug.edu.gh', action: 'TRIAGE_SUBMITTED', entity: 'TriageAssessment', entity_id: triage1.id, details: 'Emergency triage submitted' },
      { actor: 'patient@ug.edu.gh', action: 'APPOINTMENT_BOOKED', entity: 'Appointment', entity_id: app1.id, details: 'Booked with Dr. Mensah' },
      { actor: 'SYSTEM', action: 'PAYMENT_PROCESSED', entity: 'PaymentLog', details: 'MOMO payment GHC 200 - SUCCESS' },
    ],
  });
  console.log('Audit logs seeded');

  console.log('\n🎉 Database seeding complete!');
  console.log('   Login credentials for all accounts: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
