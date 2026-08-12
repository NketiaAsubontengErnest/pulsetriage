/**
 * Security verification probes against the deployed application.
 *
 * These probes verify the security requirements NFR-4, NFR-6 and FR-9.2 by
 * calling the public API with NO credentials of any kind and observing whether
 * privileged data is returned. They document the CRITICAL findings recorded as
 * TD-01 and TD-13 in the Technical Debt Plan.
 *
 * Run:  node tests/security-probe.mjs [baseUrl]
 * Default base URL: https://pulsetriage.vercel.app
 */
const BASE = process.argv[2] || 'https://pulsetriage.vercel.app';

const probes = [
  { id: 'TC-SEC-01a', requirement: 'NFR-6 / FR-4.5', method: 'GET', path: '/api/patients', expect: '401 or 403', note: 'Patient roster — Admin-only per operations matrix' },
  { id: 'TC-SEC-01b', requirement: 'NFR-6 / FR-4.5', method: 'GET', path: '/api/audit', expect: '401 or 403', note: 'Audit trail — Admin-only per operations matrix' },
  { id: 'TC-SEC-01c', requirement: 'NFR-6 / FR-4.5', method: 'GET', path: '/api/triage', expect: '401 or 403', note: 'Triage assessments are PHI-adjacent' },
  { id: 'TC-SEC-01d', requirement: 'NFR-6 / FR-4.5', method: 'GET', path: '/api/appointments', expect: '401 or 403', note: 'Appointments expose patient names and phone numbers' },
  { id: 'TC-SEC-01e', requirement: 'NFR-6 / FR-4.5', method: 'GET', path: '/api/payments', expect: '401 or 403', note: 'Financial transaction log' },
  { id: 'TC-SEC-06',  requirement: 'FR-1.3 / NFR-4', method: 'POST', path: '/api/auth/login', body: { email: 'patient@ug.edu.gh', password: 'password123' }, expect: '200 without a password hash in the body', note: 'The password hash must never be returned' },
  { id: 'TC-SEC-07',  requirement: 'FR-1.4', method: 'POST', path: '/api/auth/login', body: { email: 'patient@ug.edu.gh', password: 'wrong-password' }, expect: '401', note: 'Wrong password must be rejected' },
  { id: 'TC-SEC-08',  requirement: 'FR-9.1', method: 'POST', path: '/api/auth/login', body: {}, expect: '400', note: 'Missing required fields must be rejected before the datastore is touched' },
  { id: 'TC-SEC-09',  requirement: 'FR-1.2', method: 'POST', path: '/api/auth/register', body: { email: 'patient@ug.edu.gh', password: 'Another1!', full_name: 'Duplicate Probe' }, expect: '409 or 400', note: 'Duplicate e-mail must not create a second account' },
];

const truncate = (s, n = 160) => (s.length > n ? `${s.slice(0, n)}…` : s);

console.log(`Security probes against ${BASE}`);
console.log(`Executed ${new Date().toISOString()}\n`);
console.log('| Probe | Requirement | Request | Expected | Actual | Verdict |');
console.log('| :--- | :--- | :--- | :--- | :--- | :---: |');

const findings = [];

for (const p of probes) {
  let status = 'n/a';
  let body = '';
  try {
    const res = await fetch(`${BASE}${p.path}`, {
      method: p.method,
      ...(p.body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p.body) } : {}),
    });
    status = String(res.status);
    body = (await res.text()).replace(/\s+/g, ' ').trim();
  } catch (err) {
    status = `ERROR ${err.message}`;
  }

  let verdict;
  if (p.id.startsWith('TC-SEC-01')) {
    verdict = status === '401' || status === '403' ? 'PASS' : 'FAIL';
  } else if (p.id === 'TC-SEC-06') {
    verdict = status === '200' && !/"password"/.test(body) ? 'PASS' : 'FAIL';
  } else if (p.id === 'TC-SEC-07') {
    verdict = status === '401' ? 'PASS' : 'FAIL';
  } else if (p.id === 'TC-SEC-08') {
    verdict = status === '400' ? 'PASS' : 'FAIL';
  } else if (p.id === 'TC-SEC-09') {
    verdict = status === '409' || status === '400' ? 'PASS' : 'FAIL';
  }

  if (verdict === 'FAIL') findings.push({ ...p, status, body: truncate(body, 220) });

  console.log(
    `| ${p.id} | ${p.requirement} | \`${p.method} ${p.path}\` | ${p.expect} | ${status} | **${verdict}** |`
  );
}

console.log(`\nProbes executed: ${probes.length} · Passed: ${probes.length - findings.length} · Failed: ${findings.length}\n`);

if (findings.length) {
  console.log('Failed probe evidence:\n');
  for (const f of findings) {
    console.log(`- ${f.id} — ${f.note}`);
    console.log(`  ${f.method} ${f.path} → HTTP ${f.status}`);
    console.log(`  body: ${f.body}\n`);
  }
}
