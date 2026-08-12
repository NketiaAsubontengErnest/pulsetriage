/**
 * NFR-1 verification harness.
 *
 * Measures the wall-clock latency of a single deterministic triage evaluation
 * over a large sample so that the p50/p95/p99/max figures quoted in the Testing
 * Report are measured rather than asserted.
 *
 * Run:  npx tsx tests/perf-triage-engine.mjs
 */
import { evaluateSymptomTriage } from '../src/lib/triage-engine.ts';

const SAMPLES = 10000;

const cases = [
  {
    name: 'Emergency red-flag short-circuit',
    input: {
      primary_symptom: 'Chest Pain / Palpitations',
      category: 'CARDIOVASCULAR',
      severity: 9,
      duration_days: 1,
      red_flags: ['Chest pain or pressure radiating to arm/jaw'],
    },
  },
  {
    name: 'Full banding path (no red flag)',
    input: {
      primary_symptom: 'Severe Headache / Dizziness / Numbness',
      category: 'NEUROLOGICAL',
      severity: 7,
      duration_days: 1,
      red_flags: [],
    },
  },
  {
    name: 'Routine low-severity path',
    input: {
      primary_symptom: 'Routine Checkup / Medical Certificate',
      category: 'GENERAL',
      severity: 1,
      duration_days: 20,
      red_flags: [],
    },
  },
];

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

console.log(`NFR-1 rule-engine latency — ${SAMPLES} iterations per case\n`);
console.log('| Case | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) | Budget | Verdict |');
console.log('| :--- | ---: | ---: | ---: | ---: | ---: | :---: |');

let allPass = true;

for (const c of cases) {
  // Warm up so the JIT steady state, not the interpreter, is measured.
  for (let i = 0; i < 1000; i++) evaluateSymptomTriage(c.input);

  const timings = [];
  for (let i = 0; i < SAMPLES; i++) {
    const t0 = process.hrtime.bigint();
    evaluateSymptomTriage(c.input);
    const t1 = process.hrtime.bigint();
    timings.push(Number(t1 - t0) / 1e6);
  }

  timings.sort((a, b) => a - b);
  const p50 = pct(timings, 50);
  const p95 = pct(timings, 95);
  const p99 = pct(timings, 99);
  const max = timings[timings.length - 1];
  const pass = max <= 200;
  allPass = allPass && pass;

  console.log(
    `| ${c.name} | ${p50.toFixed(4)} | ${p95.toFixed(4)} | ${p99.toFixed(4)} | ${max.toFixed(4)} | 200 | ${pass ? 'PASS' : 'FAIL'} |`
  );
}

console.log(`\nNFR-1 overall: ${allPass ? 'PASS' : 'FAIL'} (budget 200 ms per evaluation)`);
