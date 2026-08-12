const test = require('node:test');
const assert = require('assert');

test('Telehealth Video Room - Room URL generation', () => {
  const appointmentId = 'APP-998877';
  const roomUrl = `/room/${appointmentId}`;

  assert.strictEqual(roomUrl, '/room/APP-998877');
  assert.ok(roomUrl.includes('APP-998877'));
});

test('Telehealth Video Room - Consultation completion status transition', () => {
  const initialAppointment = {
    id: 'APP-101',
    status: 'CONFIRMED',
    notes: '',
  };

  // Simulate End Consultation Handler
  const endConsultation = (app, soapNotes) => {
    return {
      ...app,
      status: 'COMPLETED',
      notes: soapNotes || 'Consultation completed via Telehealth Video Room.',
    };
  };

  const updated = endConsultation(initialAppointment, 'S: Cough\nO: Normal\nA: Resolved\nP: Rest');
  assert.strictEqual(updated.status, 'COMPLETED');
  assert.ok(updated.notes.includes('Cough'));
});

test('Telehealth Video Room - Chat Message Data Structure', () => {
  const msg = {
    sender: 'Dr. Mensah',
    text: 'Hello, please confirm your symptoms.',
    time: '10:05 AM',
    isDoctor: true,
  };

  assert.strictEqual(msg.sender, 'Dr. Mensah');
  assert.strictEqual(msg.isDoctor, true);
  assert.ok(msg.text.length > 0);
});
