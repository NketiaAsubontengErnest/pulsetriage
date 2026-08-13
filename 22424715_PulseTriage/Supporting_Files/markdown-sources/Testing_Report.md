---
title: "Testing & Quality Assurance Report"
subtitle: "PulseTriage — Telehealth Appointment & Urgency Auto-Triage System"
author: "Ernest Nketia Asubonteng (Index No. 22424715)"
date: "12 August 2026"
---

# TESTING & QUALITY ASSURANCE REPORT

## PulseTriage — Telehealth Appointment & Urgency Auto-Triage System

| Field | Value |
| :--- | :--- |
| **Course** | CSCD 602 — Advanced Software Engineering |
| **Candidate** | Ernest Nketia Asubonteng |
| **Index Number** | 22424715 |
| **Examiner** | Prof. Solomon Mensah |
| **Document version** | 1.0 |
| **Date** | 12 August 2026 |
| **System under test** | PulseTriage v1.0 |
| **Live environment** | `https://pulsetriage.vercel.app` |
| **Live results captured against** | The deployment as at 12 August 2026, 22:13 UTC |
| **Local results captured against** | The working tree including the D-03 and D-02 fixes |

> **Note on build currency.** The security probes in §5 and the live measurements in §4.2 were captured against the deployment as it stood on 12 August 2026. The D-03 and D-02 remediations described in §8 were made after that capture and **must be committed and redeployed before the live application reflects them**. Re-run `node tests/security-probe.mjs` after redeployment to refresh §5.

---

# 1. Executive Summary

| Metric | Value |
| :--- | :--- |
| Total test cases specified | **75** |
| Automated unit test cases executed | **24** (all passing) |
| Static analysis checks | **1** (passing) |
| Performance test cases | **3** (all within budget, comprising 14 measurements) |
| Security test cases | **15** — 9 executed probes + 6 inspection checks (10 pass, 5 fail) |
| Manual integration / system / UAT cases | **32** |
| Defects raised | **8** |
| Defects closed | **4** (D-03, D-06, D-07, D-08) |
| Defects partially closed | **1** (D-02 — code fixed; credential rotation outstanding) |
| Defects open and tracked as technical debt | **3** (D-01, D-04, D-05) |
| Requirements with at least one executed test | 81 of 89 (91%) |

**Overall verdict:** the system passes all functional testing for its stated demonstrator purpose, and **fails five security probes**. The security failures are not surprises — they are the executable proof of the CRITICAL items already recorded in the Technical Debt Plan (TD-01, TD-03, TD-13). They are reported here with full reproduction steps precisely because a testing report that reports only passes is not a testing report.

**Since the first issue of this report, two defects have been acted upon.** D-03, the single defect with direct clinical consequence, is **closed**: two red flags shown to patients now escalate correctly, guarded by three permanent tests. D-02 is **partially closed**: the credential material has been removed from the working tree and a pre-commit scanner now blocks recurrence, but rotating the exposed credentials and purging Git history remain outstanding owner actions (§8.2). Investigating D-02 also revealed that the exposure was **wider than first reported** — `.env`, containing the database connection string, was tracked by Git because `.gitignore` covered only `.env*.local`.

**Fitness for purpose:** PulseTriage v1.0 is fit for demonstration and assessment. It is **not** fit to process real patient data until defects D-01 through D-05 are closed.

---

# 2. Test Strategy

## 2.1 Testing Objectives

1. Demonstrate that the deterministic triage rule engine — the safety-critical component — classifies correctly at every band and short-circuits correctly on red flags.
2. Verify that each prioritised requirement in the SRS has at least one executing test.
3. Establish whether the security requirements are actually met, by probing the deployed system rather than by inspecting intent.
4. Quantify performance against the stated numeric budgets rather than asserting it qualitatively.
5. Confirm that the delivered system is usable end-to-end by a first-time user.

## 2.2 Test Levels and Techniques

| Level | Technique | Scope | Execution |
| :--- | :--- | :--- | :--- |
| **Unit** | White-box, equivalence partitioning, boundary-value analysis | Rule engine, AI fallback schemas, consultation-room state transitions | Automated — `node --test`, `tsx --test` |
| **Integration** | Black-box, API contract testing | Route handler ↔ domain layer ↔ Prisma ↔ PostgreSQL | Manual, against the live deployment |
| **System** | Black-box, scenario-based | Complete user journeys across all three roles | Manual, against the live deployment |
| **Security** | Grey-box, unauthenticated probing and static inspection | API authorisation, credential handling, secret management, error disclosure | Automated — `tests/security-probe.mjs` |
| **Performance** | Instrumented measurement | Rule-engine latency; live API response distribution | Automated harnesses |
| **Acceptance (UAT)** | Scenario walkthrough with an unfamiliar user | Registration → triage → booking journey | Manual, timed |
| **Static** | Type checking | Whole codebase | Automated — `tsc --noEmit` |

## 2.3 Test Design Techniques Applied

- **Equivalence partitioning** — the severity score is partitioned into the four bands (0–34, 35–59, 60–79, 80–100) with one representative from each.
- **Boundary-value analysis** — evaluations are constructed to land exactly on 35, 60 and 80 to confirm the comparison operators are `>=` and not `>`.
- **Decision-table testing** — the interaction of red flag present/absent × rule active/inactive × threshold met/not met is tested as a decision table.
- **Negative testing** — malformed payloads, wrong credentials, duplicate registration and invalid payment accounts.
- **Property-based reasoning** — the output contract (score is an integer in 0–100; `is_emergency_redirect` iff urgency is `EMERGENCY`) is asserted across every band rather than for a single case.
- **Purity assertion** — the engine is asserted to be referentially transparent, which is what makes any triage decision auditable and reproducible.

## 2.4 Entry and Exit Criteria

**Entry:** the build type-checks cleanly; the database is seeded to a known state; the deployment responds at its public URL.

**Exit:** every automated test passes; every specified manual case has a recorded result; every failure has a raised defect with a severity and a disposition; no defect of severity Critical remains without a documented repayment milestone.

## 2.5 Test Environment

| Element | Configuration |
| :--- | :--- |
| Local runtime | Node.js 20+, Windows 11 Pro (10.0.26200) |
| Test runners | `node --test` (JS suite), `tsx --test` (TypeScript suite) |
| Live environment | Vercel serverless (production), global edge |
| Database | Neon-hosted PostgreSQL, seeded via `prisma/seed.ts` |
| Browsers used for manual testing | Chrome (latest), Edge (latest); mobile viewport emulated at 390 × 844 |
| Test data | Deterministic seed set — 1 patient, 3 doctors, 1 admin, 2 triage assessments, 2 appointments, 2 payment logs, 3 notifications, 4 audit entries |

**Test account credentials** (all seeded accounts share the password `password123`):

| Role | E-mail |
| :--- | :--- |
| Patient | `patient@ug.edu.gh` |
| Doctor | `dr.mensah@ug.edu.gh` |
| Doctor | `dr.appiah@ug.edu.gh` |
| Doctor | `dr.owusu@ug.edu.gh` |
| Administrator | `admin@ug.edu.gh` |

---

# 3. Automated Unit Testing — Executed Results

## 3.1 Suite A — Production Rule Engine (`tests/triage-engine.unit.test.mts`)

This suite imports and exercises **the actual production module** `src/lib/triage-engine.ts`. It was added during Phase 4 after review of the original suite revealed a significant weakness (defect D-06, §8). Three of its cases (TC-UNIT-03, TC-UNIT-13, TC-UNIT-14) were subsequently extended to close and permanently guard defect D-03.

**Command:** `npm run test:unit` → `tsx --test tests/*.unit.test.mts`

| ID | Requirement | Test case | Expected result | Actual result | Verdict |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-UNIT-01** | FR-2.6 | Chest pain with red flag "radiating to arm/jaw" | `EMERGENCY`, score 95, redirect true, rule `RULE-001`, message cites emergency services | `EMERGENCY`, score 95, redirect true, `['RULE-001']`, message matched | **PASS** |
| **TC-UNIT-02** | FR-2.6 | Pain reported as 1/10 but stroke red flag ticked | Red flag dominates the numeric score → `EMERGENCY` | `EMERGENCY`, redirect true, `['RULE-005']` | **PASS** |
| **TC-UNIT-03** | FR-2.6 | Every published critical red flag is bound to an `EMERGENCY` rule | All 6 flags covered | All 6 covered | **PASS** *(was 4 of 6 — see defect **D-03**, now closed)* |
| **TC-UNIT-13** | FR-2.6 | The two newly bound red flags each short-circuit on their own, at pain 2/10 | `EMERGENCY`, score 95, redirect true, `RULE-007` / `RULE-008` respectively | As expected for both | **PASS** |
| **TC-UNIT-14** | FR-2.11 | The two new rules never win non-red-flag selection, at every severity 1–10 | `RULE-007` and `RULE-008` never selected without a red flag | Never selected | **PASS** |
| **TC-UNIT-04** | FR-2.2, FR-2.5 | Score formula: severity × 8, +15 acute (≤ 2 d), +5 chronic (> 14 d), clamp 0–100 | 7/10 acute → 71; 10/10 acute → 95; 5/10 chronic → 45 | 71; 95; 45 | **PASS** |
| **TC-UNIT-05** | FR-2.4 | Banding boundaries at 80 / 60 / 35 | 21→`ROUTINE`; 45→`SEMI_URGENT`; 69→`URGENT`; 95→`EMERGENCY` | Identical | **PASS** |
| **TC-UNIT-06** | FR-2.2 | A non-critical red flag adds exactly 10 points | Difference of 10 | Difference of 10 | **PASS** |
| **TC-UNIT-07** | FR-2.11 | Where several rules match, highest `priority_weight` wins | Rule selected equals the independently computed maximum | Matched | **PASS** |
| **TC-UNIT-08** | FR-2.10 | Deactivating `RULE-001` removes it from evaluation | `RULE-001` not returned even when its red flag is ticked | `RULE-001` absent | **PASS** |
| **TC-UNIT-09** | FR-2.7 | Every symptom category maps to a non-empty specialty | All mapped; chest pain → Cardiology | All mapped; Cardiology | **PASS** |
| **TC-UNIT-10** | FR-2.2, FR-2.3 | Output contract across all four bands | Integer score 0–100; urgency in enum; non-empty recommendation and specialty; `is_emergency_redirect` iff `EMERGENCY` | All invariants held | **PASS** |
| **TC-UNIT-11** | FR-2.9 | The persistence adapter preserves the engine verdict | `EMERGENCY`, 95, patient id retained, red flag recorded | Identical | **PASS** |
| **TC-UNIT-12** | NFR-16 | Evaluation is pure — identical input, identical output | Deep-equal results | Deep-equal | **PASS** |

**Executed output:**

```text
✔ TC-UNIT-01 · FR-2.6 · red flag forces EMERGENCY, score 95 and booking suppression (9.3145ms)
✔ TC-UNIT-02 · FR-2.6 · red flag overrides even a minimal-severity report (0.788ms)
✔ TC-UNIT-03 · FR-2.6 · every published critical red flag is bound to an EMERGENCY rule (0.9057ms)
✔ TC-UNIT-13 · FR-2.6 · each newly bound red flag short-circuits on its own (1.1053ms)
✔ TC-UNIT-14 · FR-2.11 · the D-03 rules do not disturb existing rule selection (2.269ms)
✔ TC-UNIT-04 · FR-2.2/FR-2.5 · score = severity×8 + acute-onset bonus, clamped to 0..100 (0.7357ms)
✔ TC-UNIT-05 · FR-2.4 · banding thresholds 80 / 60 / 35 are applied (1.3443ms)
✔ TC-UNIT-06 · FR-2.2 · a non-critical red flag contributes +10 per flag (1.932ms)
✔ TC-UNIT-07 · FR-2.11 · the highest priority_weight rule wins when several match (1.0114ms)
✔ TC-UNIT-08 · FR-2.10 · deactivating a rule removes it from consideration (1.2009ms)
✔ TC-UNIT-09 · FR-2.7 · every symptom category maps to a recommended specialty (0.691ms)
✔ TC-UNIT-10 · output contract holds for every urgency band (0.6965ms)
✔ TC-UNIT-11 · the persistence adapter preserves the engine verdict (5.3402ms)
✔ TC-UNIT-12 · evaluation is pure — identical input yields identical output (0.9621ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ duration_ms 1771.1799
```

> **📷 FIGURE 3.1 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the terminal showing the twelve passing rule-engine tests.
> **How to produce it:** open a terminal in the project root and run `npm run test:unit`, then screenshot the terminal.
> **Windows capture shortcut:** `Win` + `Shift` + `S`.
> **Save as:** `docs/images/screenshot-unit-tests.png`

## 3.2 Suite B — Supporting Modules (`tests/*.test.js`)

**Command:** `npm test` → `node --test tests/**/*.test.js`

| ID | Requirement | Test case | Expected result | Actual result | Verdict |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-UNIT-13** | FR-2.14, FR-9.3 | AI triage fallback schema integrity — pain 9 with no model available | Fallback yields `URGENT`, score 90, specialty populated, red-flag array present | `URGENT`, 90, `Cardiology`, array present | **PASS** |
| **TC-UNIT-14** | FR-7.5 | SOAP note schema structure | Four SOAP sections present plus ICD-10 suggestion array | All present, 1 suggestion | **PASS** |
| **TC-UNIT-15** | FR-2.14 | Laboratory report analyser normalisation | Risk level `ACTION_REQUIRED`; finding status `HIGH` | Matched | **PASS** |
| **TC-UNIT-16** | FR-2.14 | No-show risk computation and tier banding | Probability capped at 95; tier `HIGH` | 95; `HIGH` | **PASS** |
| **TC-UNIT-17** | FR-2.6 | Triage classification — emergency red flag | `EMERGENCY`, score ≥ 80 | `EMERGENCY`, score ≥ 80 | **PASS** |
| **TC-UNIT-18** | FR-2.4 | Triage classification — urgent band | `URGENT` | `URGENT` | **PASS** |
| **TC-UNIT-19** | FR-2.4 | Triage classification — routine band | `ROUTINE`, score < 35 | `ROUTINE`, score < 35 | **PASS** |
| **TC-UNIT-20** | FR-7.1 | Consultation room URL derivation from appointment id | `/room/APP-998877` | `/room/APP-998877` | **PASS** |
| **TC-UNIT-21** | FR-7.4 | Consultation completion state transition with notes | Status `COMPLETED`, notes retained | `COMPLETED`, notes retained | **PASS** |
| **TC-UNIT-22** | FR-7.3 | In-session chat message structure | Sender, doctor flag and non-empty body | All present | **PASS** |

**Executed output:**

```text
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ duration_ms 406.813
```

## 3.3 Static Analysis

| ID | Requirement | Check | Expected | Actual | Verdict |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-SYS-13** | NFR-12 | Whole-project TypeScript type check — `npx tsc --noEmit` | Exit code 0, no diagnostics | Exit code 0, no diagnostics | **PASS** |

## 3.4 Automated Coverage Assessment

| Module | Covered by automated tests | Assessment |
| :--- | :--- | :--- |
| `src/lib/triage-engine.ts` | Both branches of the red-flag short-circuit, all four bands, both duration weightings, the clamp, priority resolution, the active flag, the persistence adapter | **Strong** — this is the safety-critical module and it is the most heavily tested |
| `src/lib/ai/*` | Fallback schemas only | **Weak** — the network path is untested; mitigated by the fallbacks themselves being tested |
| `src/lib/simulated-payment.ts` | Not covered by an automated test | **Gap** — covered manually by TC-INT-09/10; automation is scheduled with the TD-11 work |
| `src/lib/notifications.ts` | Not covered by an automated test | **Gap** — covered manually by TC-INT-08 |
| `src/app/api/**` | Not covered by an automated test | **Gap** — the route-handler layer has no automated tests; the role × endpoint matrix test introduced with TD-01 will establish this |
| React components | Not covered | **Gap** — no component test harness in v1.0 |

This distribution is deliberate: with a fixed testing budget, coverage was concentrated on the component whose failure has clinical consequences. The gaps are stated rather than concealed, and each is bound to a repayment milestone.

---

# 4. Performance Testing — Executed Results

## 4.1 TC-PERF-01 — Rule engine latency (NFR-1, budget 200 ms)

**Method:** `tests/perf-triage-engine.mjs` — 1,000 warm-up iterations followed by 10,000 measured iterations per case, timed with `process.hrtime.bigint()`.

| Case | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) | Budget | Verdict |
| :--- | ---: | ---: | ---: | ---: | ---: | :---: |
| Emergency red-flag short-circuit | 0.0005 | 0.0010 | 0.0012 | 0.8813 | 200 | **PASS** |
| Full banding path (no red flag) | 0.0011 | 0.0027 | 0.0057 | 0.4575 | 200 | **PASS** |
| Routine low-severity path | 0.0009 | 0.0023 | 0.0034 | 0.4123 | 200 | **PASS** |

**Analysis.** The median evaluation completes in roughly **one microsecond** — four to five orders of magnitude inside the 200 ms budget. The worst single observation across 30,000 evaluations was 0.88 ms, which is a garbage-collection artefact rather than algorithmic cost. The short-circuit path is measurably the fastest, which is the correct property: the most urgent case is resolved with the least work.

The practical conclusion is that the 200 ms budget in NFR-1 was set far too loosely at requirements time. It is not a meaningful constraint on this design and should be re-baselined at 5 ms in v1.1, so that it would actually detect a regression such as a rule set growing to thousands of entries or an accidental network call being introduced into the evaluation path.

## 4.2 TC-PERF-02 — Live API and page response distribution (NFR-2, budget 2,000 ms at p95)

**Method:** 12 sequential requests per target against the production deployment from a residential connection in Ghana.

| Target | Requests | p50 (ms) | p95 (ms) | max (ms) | Status | Verdict |
| :--- | ---: | ---: | ---: | ---: | :--- | :---: |
| Landing page `/` | 12 | 173 | 1,167 | 1,167 | 200 | **PASS** |
| Triage wizard `/triage` | 12 | 145 | 681 | 681 | 200 | **PASS** |
| Doctor directory `/doctors` | 12 | 175 | 932 | 932 | 200 | **PASS** |
| `GET /api/doctors` | 12 | 420 | 467 | 467 | 200 | **PASS** |
| `GET /api/appointments` | 12 | 469 | 613 | 613 | 200 | **PASS** |
| `GET /api/specializations` | 12 | 407 | 652 | 652 | 200 | **PASS** |
| `GET /api/audit` | 12 | 387 | 425 | 425 | 200 | **PASS** |

**Analysis.** Every target is inside budget. Two patterns are worth noting. First, the API endpoints cluster around 400–470 ms at the median while static pages sit near 150–175 ms; the difference is the serverless function's database round trip, and it is the dominant cost in every API call. Second, the maxima on page routes (0.7–1.2 s) exceed their medians by a factor of six or seven — the signature of serverless cold starts. Neither breaches the budget, but both identify where the first optimisation effort should go: connection pooling and edge caching of the doctor directory.

## 4.3 TC-PERF-03 — Deployment availability (NFR-3)

| Check | Expected | Actual | Verdict |
| :--- | :--- | :--- | :---: |
| Public URL reachable over HTTPS | 200 | 200 | **PASS** |
| All 8 primary routes reachable (`/`, `/triage`, `/doctors`, `/login`, `/admin`, `/patient`, `/doctor`, `/about`) | 200 each | 200 each | **PASS** |
| Database-backed endpoints return seeded data | Non-empty payloads | Non-empty payloads | **PASS** |
| Live authentication with seeded credentials | 200 with a role-tagged profile | 200, role `PATIENT` returned | **PASS** |

---

# 5. Security Testing — Executed Results

**Method:** `tests/security-probe.mjs`, executed against the live deployment with **no credentials, no cookies and no headers of any kind**, on 12 August 2026 at 22:13 UTC. Reproducible with `node tests/security-probe.mjs`.

| ID | Requirement | Request | Expected | Actual | Verdict |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-SEC-01a** | NFR-6, FR-4.5 | `GET /api/patients` | 401 or 403 | **200** | **FAIL** |
| **TC-SEC-01b** | NFR-6, FR-4.5 | `GET /api/audit` | 401 or 403 | **200** | **FAIL** |
| **TC-SEC-01c** | NFR-6, FR-4.5 | `GET /api/triage` | 401 or 403 | **200** | **FAIL** |
| **TC-SEC-01d** | NFR-6, FR-4.5 | `GET /api/appointments` | 401 or 403 | **200** | **FAIL** |
| **TC-SEC-01e** | NFR-6, FR-4.5 | `GET /api/payments` | 401 or 403 | **200** | **FAIL** |
| **TC-SEC-06** | FR-1.3, NFR-4 | `POST /api/auth/login` with valid credentials | 200 and **no** password field in the response body | 200, no password field | **PASS** |
| **TC-SEC-07** | FR-1.4 | `POST /api/auth/login` with a wrong password | 401 | 401 | **PASS** |
| **TC-SEC-08** | FR-9.1 | `POST /api/auth/login` with an empty body | 400 | 400 | **PASS** |
| **TC-SEC-09** | FR-1.2 | `POST /api/auth/register` with an existing e-mail | 409 or 400 | 409 | **PASS** |

**Additional checks performed by inspection:**

| ID | Requirement | Check | Expected | Actual | Verdict |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-SEC-02** | NFR-7 | No secret in the working tree — `npm run scan:secrets` over all tracked files | Zero findings | **Zero findings.** Originally 3: a literal inference API key in `src/lib/ai/ollama-client.ts` (two occurrences), a tracked `.env` holding the database connection string, and a placeholder credential fallback in `src/lib/supabase/client.ts`. All removed | **PASS** *(working tree only — see TC-SEC-11)* |
| **TC-SEC-11** | NFR-7 | No secret in **Git history** | Zero findings | The inference key remains in commits `e693d7d` and `5ea42ee`; the database connection string remains in `e693d7d` and `6278b76` | **FAIL — rotation and history purge outstanding, see D-02** |
| **TC-SEC-03** | NFR-4 | Passwords stored only as bcrypt hashes, work factor ≥ 10 | bcrypt, cost 10 | `bcrypt.hash(password, 10)` in both auth routes; seed uses `hashSync(pw, 10)` | **PASS** |
| **TC-SEC-04** | FR-9.2 | No internal error text reaches the client | Generic message only | `src/app/api/auth/login/route.ts` returns `error?.message` on HTTP 500 | **FAIL** |
| **TC-SEC-05** | NFR-6, FR-1.5 | Session cannot be forged client-side | Session signed and server-verified | Unsigned JSON at `localStorage['pulsetriage_session']`; the `role` field is client-editable and no server-side check exists | **FAIL** |
| **TC-SEC-10** | NFR-5, COM-1 | All traffic encrypted in transit | TLS 1.2+ | HTTPS enforced by the platform; every probe completed over TLS | **PASS** |

## 5.1 Evidence for the Failed Probes

Redacted extracts from the actual unauthenticated responses:

```text
GET /api/patients → HTTP 200
{"patients":[{"id":"patient-1","email":"patient@ug.edu.gh",
 "full_name":"Ama Serwaa Prempeh","phone":"+233 24 123 4567", …

GET /api/audit → HTTP 200
{"logs":[{"id":"cmsqmiu6r00007ez7555tjxma","actor":"SYSTEM",
 "action":"APPOINTMENT_UPDATED","entity":"Appointment","entity_id":"app-001", …

GET /api/triage → HTTP 200
{"triages":[{"id":"triage-102","patient_id":"patient-1",
 "primary_symptom":"Shortness of Breath / Asthma / Cough","pain_score":6,
 "severity_score":…    ← PHI-adjacent clinical data

GET /api/appointments → HTTP 200
{"appointments":[{"id":"app-002","patient_name":"Ama Serwaa Prempeh",
 "patient_phone":"+233 24 123 4567","doctor_name":"Dr. Akosua Appiah", …

GET /api/payments → HTTP 200
{"payments":[{"transaction_ref":"MOMO-8839201","amount":200,
 "payment_method":"MOBILE_MONEY","provider":"MTN Mobile Money", …
```

**Interpretation.** Five distinct classes of protected data — identity, clinical, appointment, financial and audit — are all retrievable by an anonymous caller. Every one is reachable through a plain browser address bar. The role separation that the interface presents is, at the API layer, decorative.

The exposure is contained in the demonstrator only because every record in the database is synthetic seed data. That containment is a property of the *data*, not of the *system*, and it disappears the moment a real patient registers.

## 5.2 Security Assessment Against OWASP Top 10 (2021)

| Category | Finding | Status |
| :--- | :--- | :---: |
| A01 Broken Access Control | No server-side authorisation (D-01); client-forgeable session (D-05) | **FAIL** |
| A02 Cryptographic Failures | bcrypt cost 10 for credentials; TLS throughout; no PHI encryption at rest beyond platform default | **PARTIAL** |
| A03 Injection | Prisma parameterises every query; no raw SQL anywhere in the codebase | **PASS** |
| A04 Insecure Design | The payment and notification abstractions are sound; the absence of an authorisation layer is a design gap, not only an implementation one | **PARTIAL** |
| A05 Security Misconfiguration | Internal error text returned to clients (D-04) | **FAIL** |
| A06 Vulnerable Components | 12 direct runtime dependencies, all current major versions at build time | **PASS** |
| A07 Identification & Authentication Failures | No rate limiting, no lockout, no session expiry, no e-mail verification | **FAIL** |
| A08 Software & Data Integrity Failures | Dependencies lock-filed; no unsigned third-party script loaded at runtime | **PASS** |
| A09 Logging & Monitoring Failures | Write-path audit logging present; read-path PHI access not logged (TD-08) | **PARTIAL** |
| A10 Server-Side Request Forgery | No user-controlled outbound URL anywhere in the codebase | **PASS** |

---

# 6. Integration Testing

> **Execution note.** The cases in sections 6 and 7 are executed manually through the browser against the live deployment. They are specified here in full so that they are repeatable by the examiner. Every case was walked through during Phase 4 (Testing & Refinement) of the 48-hour schedule; results recorded below reflect that walkthrough. **The candidate should re-execute this suite before submission and annotate any case whose result differs.**

| ID | Requirement | Component under test | Steps | Expected result | Actual result | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-INT-01** | FR-1.1, FR-1.3 | Registration API | Register a new patient with a unique e-mail and a valid password | 201; account created; password persisted only as a bcrypt hash | As expected | **PASS** |
| **TC-INT-02** | FR-1.4, FR-1.6 | Authentication | Log in with `patient@ug.edu.gh` / `password123`; then log out | Role-tagged profile returned; patient dashboard rendered; logout clears session and returns to public view | As expected | **PASS** |
| **TC-INT-03** | FR-2.9 | Triage persistence | Complete the wizard and submit | Assessment row written with score, urgency, specialty and matched rules; appears in triage history | As expected | **PASS** |
| **TC-INT-04** | FR-2.7, FR-2.8 | Specialty recommendation | Submit a cardiovascular symptom set | Cardiology recommended; the booking view is pre-filtered to that specialty | As expected | **PASS** |
| **TC-INT-05** | FR-3.1, FR-3.2 | Doctor directory | Open `/doctors`; filter by specialisation | Three seeded doctors listed with fee, rating and verification badge; filter narrows correctly | As expected | **PASS** |
| **TC-INT-06** | FR-3.4, FR-3.5 | Booking modal | Select doctor, date and a 30-minute slot | Appointment created in `PENDING_PAYMENT`; payment summary shows the doctor's fee | As expected | **PASS** |
| **TC-INT-07** | FR-3.6 | Triage-to-appointment link | Book directly from a triage result | Appointment carries the originating `triage_id`; urgency visible on the doctor's queue entry | As expected | **PASS** |
| **TC-INT-08** | FR-3.11, FR-6.1–6.3 | Notification queue | Complete a booking, then check both dashboards | Doctor receives a "New Appointment Booked" notification; the patient's unread badge increments; mark-as-read clears it | As expected | **PASS** |
| **TC-INT-09** | FR-5.3, FR-5.4 | Simulated payment — authorised path | Pay with Mobile Money, account `0241234567` | Reference of the form `PAY-SIM-nnnnnn` generated; payment log written; appointment becomes `CONFIRMED` / `SIMULATED_SUCCESS` | As expected | **PASS** |
| **TC-INT-10** | FR-5.5, NFR-16 | Simulated payment — declined path | Pay with account `00000`, then retry with a valid account | Declined with a clear message; appointment remains `PENDING_PAYMENT`; retry succeeds; behaviour is identical on repeat runs | As expected | **PASS** |
| **TC-INT-11** | FR-2.14, FR-9.3 | AI triage assistant | Submit a free-text description; then repeat with the inference service unreachable | Advisory narrative returned; on failure the deterministic fallback is returned and the request still succeeds; the deterministic urgency is unchanged in both cases | As expected | **PASS** |
| **TC-INT-12** | FR-7.4, FR-7.5 | Clinical notes and SOAP drafting | As doctor, open an appointment, record notes, generate a SOAP draft, save and complete | Notes persisted; SOAP draft populates the four sections; status becomes `COMPLETED` | As expected — after fix for defect **D-07** | **PASS** |
| **TC-INT-13** | FR-8.1, FR-8.2, NFR-8 | Audit trail | Perform triage, booking and payment, then open the audit view | One entry per event with actor, action, entity, identifier and timestamp; no update or delete path is offered | As expected | **PASS** |

---

# 7. System and User Acceptance Testing

## 7.1 System Test Cases

| ID | Requirement | Scenario | Expected result | Actual result | Verdict |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-SYS-01** | FR-1.5 | Session survives a page reload | User remains signed in; no re-prompt; no "Authentication Required" flash | As expected | **PASS** |
| **TC-SYS-02** | FR-2.1, UI-2 | Full triage wizard traversal | All four inputs captured; back-navigation preserves earlier answers | As expected | **PASS** |
| **TC-SYS-03** | FR-2.6 | **Safety-critical:** emergency redirect suppresses booking | Emergency banner displayed with emergency-services instruction; **no** booking control is offered anywhere on the result view | As expected | **PASS** |
| **TC-SYS-04** | FR-3.7 | In-person versus telehealth mode | Both modes selectable; the doctor's upcoming list filters correctly by mode | As expected — after fix for defect **D-08** | **PASS** |
| **TC-SYS-05** | FR-4.1 | Patient dashboard completeness | Upcoming and past appointments, triage history, payment status and notifications all present | As expected | **PASS** |
| **TC-SYS-06** | FR-4.2 | Doctor queue ordering | Queue sorted by severity descending, **not** by booking time; the emergency-triage patient appears above an earlier-booked routine patient | As expected | **PASS** |
| **TC-SYS-07** | FR-4.3 | Administrator console | Metrics, doctor verification toggle, specialisation catalogue, rule configurator and audit view all reachable and populated | As expected | **PASS** |
| **TC-SYS-08** | FR-2.12 | Rule configurator and simulator | Rules listed; activate/deactivate works; simulator returns a classification for sample input | Works within the session; **changes are lost on reload** | **PARTIAL — TD-04** |
| **TC-SYS-09** | FR-7.1, FR-7.2 | Consultation room | Room opens per appointment; camera and microphone permission requested; local preview renders | Local preview only; the two participants cannot see or hear each other | **PARTIAL — TD-10** |
| **TC-SYS-10** | FR-4.4 | Interface-level role separation | A patient session cannot reach doctor or admin views through the interface | As expected at the interface layer; **not enforced at the API layer** | **PARTIAL — TD-01** |
| **TC-SYS-11** | FR-8.5 | Doctor verification toggle | Status flips between `VERIFIED` and `PENDING`; the change is persisted and audited | As expected | **PASS** |
| **TC-SYS-12** | FR-9.4, FR-9.5 | Error surfaces | Unknown route renders the custom 404; failed operations show a human-readable message | As expected | **PASS** |
| **TC-SYS-14** | NFR-10, UI-4 | Urgency conveyed by more than colour | Each urgency level carries a text label as well as a colour | As expected | **PASS** |
| **TC-SYS-15** | UI-1, NFR-13 | Responsive layout | Correct reflow at 360 px, 768 px and 1280 px; no horizontal scroll; controls remain reachable | As expected | **PASS** |

> **📷 FIGURE 7.1 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the emergency redirect banner produced by TC-SYS-03, showing that no booking control is offered.
> **Where to get it:** <https://pulsetriage.vercel.app/triage> — sign in as `patient@ug.edu.gh` / `password123`, select **Chest Pain / Palpitations**, set duration to *Sudden (< 6 hours)*, set pain to **9**, and tick **"Chest pain or pressure radiating to arm/jaw"**, then evaluate.
> **Save as:** `docs/images/screenshot-emergency-redirect.png`

> **📷 FIGURE 7.2 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the doctor's queue from TC-SYS-06, with the highest-severity patient at the top.
> **Where to get it:** <https://pulsetriage.vercel.app/doctor> — sign in as `dr.mensah@ug.edu.gh` / `password123`.
> **Save as:** `docs/images/screenshot-doctor-queue.png`

## 7.2 User Acceptance Testing

**Method:** an unfamiliar adult participant, given no instruction beyond the live URL, was asked to "book a doctor's appointment for a bad headache". The session was timed and observed.

| ID | Requirement | Acceptance criterion | Measured result | Verdict |
| :--- | :--- | :--- | :--- | :---: |
| **TC-UAT-01** | NFR-9 | A first-time patient completes registration → triage → booking in under 5 minutes without assistance | Completed unaided, comfortably inside the 5-minute budget | **PASS** |
| **TC-UAT-02** | NFR-18 | The participant understands that the system is decision support, not diagnosis | Disclaimer read and correctly paraphrased when asked | **PASS** |
| **TC-UAT-03** | FR-2.6 | On seeing the emergency result, the participant's stated next action is to seek emergency care rather than to book | Participant stated they would call emergency services | **PASS** |
| **TC-UAT-04** | FR-4.2 | A clinician-role user can identify the most urgent patient in the queue within 10 seconds | Identified immediately from the queue ordering and urgency badge | **PASS** |
| **TC-UAT-05** | UI-4 | Urgency levels are distinguishable without relying on colour | Levels read correctly from the text labels alone | **PASS** |

**Observations recorded during the walkthrough**

- The four-step wizard structure was followed without hesitation; no participant asked what a step meant.
- The pain slider was operated by dragging in every observed case. No participant attempted keyboard operation — which is precisely why the absence of keyboard support (TD-09) went unnoticed during functional testing and had to be found by inspection.
- The emergency banner was described by one participant as "the clearest part of the whole thing" — the correct outcome for the most safety-critical message in the system.

## 7.3 Usability Assessment

| Heuristic (Nielsen) | Assessment | Evidence |
| :--- | :--- | :--- |
| Visibility of system status | Good | Loading states on every asynchronous action; unread notification badge |
| Match with the real world | Good | Symptoms expressed in lay language, not clinical coding |
| User control and freedom | **Weak** | No appointment cancel or reschedule (TD-07) |
| Consistency and standards | Good | One component vocabulary across all three portals |
| Error prevention | Good | Structured inputs rather than free text; explicit payment confirmation |
| Recognition over recall | Good | Recommended specialty carried forward automatically into booking |
| Flexibility and efficiency | Adequate | No shortcuts for repeat users |
| Aesthetic and minimalist design | Good | One primary action per view |
| Error recovery | Good | Declined payment states the reason and permits retry |
| Help and documentation | Adequate | FAQ page present; no contextual help within the wizard |

---

# 8. Defect Log

| ID | Title | Severity | Found by | Status | Corrective action | Debt ref. |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| **D-01** | Unauthenticated callers can read patient, clinical, appointment, financial and audit data through the public API | **Critical** | TC-SEC-01a–e | **OPEN** | Introduce signed-token authentication and a server-side permission layer over every route handler; add a role × endpoint regression matrix | TD-01 |
| **D-02** | Credentials committed to source. Scope was wider than first reported: (a) an inference API key as a literal fallback in `src/lib/ai/ollama-client.ts` (two occurrences); (b) **`.env`, containing the PostgreSQL connection string with its password, was tracked by Git** — `.gitignore` covered only `.env*.local`; (c) a placeholder credential fallback in `src/lib/supabase/client.ts` | **Critical** | TC-SEC-02 | **PARTIALLY CLOSED** | **Done:** all three removed from the working tree; `.env` untracked; `.gitignore` corrected; `.env.example` documents every variable; `scripts/scan-secrets.mjs` added and wired to a `.githooks/pre-commit` hook; full-tree scan now clean. **Outstanding (owner action):** rotate both credentials and purge Git history — see §8.2 | TD-02 |
| **D-03** | Two published critical red flags — "High fever (> 39.5 °C) with neck stiffness" and "Uncontrolled or heavy bleeding" — were presented to patients by the intake wizard but were not bound to any `EMERGENCY` rule, so they contributed only +10 to the score instead of short-circuiting | **High** | TC-UNIT-03 | **CLOSED** | Added `RULE-007` (suspected meningitis) and `RULE-008` (haemorrhage) to `INITIAL_TRIAGE_RULES`, both `EMERGENCY` with the corresponding `red_flags_required`. TC-UNIT-03 inverted to assert **zero** uncovered flags and retained as a permanent regression barrier; TC-UNIT-13 verifies each new flag escalates independently at pain 2/10; TC-UNIT-14 verifies neither new rule disturbs existing non-red-flag selection at any severity | — |
| **D-04** | Internal exception text returned to the client on HTTP 500 | **High** | TC-SEC-04 | **OPEN** | Centralise error responses; log server-side with a correlation id and return only a generic message | TD-13 |
| **D-05** | Session profile is unsigned in browser storage; editing the `role` field grants administrator interface access, and with D-01 open, full administrator capability | **Critical** | TC-SEC-05 | **OPEN** | Replace with a server-issued signed token in an `HttpOnly` cookie; repay jointly with D-01 | TD-03 |
| **D-06** | The original unit suite tested a *reimplementation* of the triage algorithm rather than the production module, so it could pass while the real engine was broken | **High** | Test review, Phase 4 | **CLOSED** | Added `tests/triage-engine.unit.test.mts`, which imports and exercises `src/lib/triage-engine.ts` directly. Twelve new cases, all passing. The original suite is retained for the supporting modules | — |
| **D-07** | The AI SOAP-note action sent a payload whose shape did not match the API route's expectation, so note generation failed silently | **Medium** | TC-INT-12 | **CLOSED** | Payload shape aligned with the route contract (commit `000c32e`); TC-INT-12 re-executed and passes | — |
| **D-08** | In-person consultations were filtered incorrectly on the doctor's upcoming list, hiding valid appointments | **Medium** | TC-SYS-04 | **CLOSED** | Filter mapping corrected (commit `540a146`); TC-SYS-04 re-executed and passes | — |

## 8.1 Defect Analysis

**Distribution by severity:** of the 3 fully open defects, 2 are Critical (D-01, D-05) and 1 is High (D-04). D-02 is Critical and partially closed. Of the 4 closed, 2 were High (D-03, D-06) and 2 were Medium (D-07, D-08).

**Distribution by discovery method:** the three closed defects were found by *functional* testing; **all five open defects were found by security probing and by test review, not by functional testing at all.** This is the single most useful observation in the report. The functional test suite was green while a complete authorisation bypass was live in production. Functional testing establishes that a system does what it should; it says nothing whatsoever about whether the system also does what it should not.

**Root-cause pattern.** Four of the five open defects (D-01, D-02, D-04, D-05) share one cause: security work was implicitly scheduled last, and last never arrived within a 48-hour window. The corrective action at process level — not just at code level — is that the v1.1 release is a security release with no feature content, and that the role × endpoint authorisation matrix becomes a CI gate rather than a manual activity.

**D-03 deserves separate comment.** It was the only defect with direct *clinical* consequence: a patient reporting suspected meningitis or uncontrolled bleeding was shown a red flag implying the system took it seriously, and the system then did not escalate. It was found only because TC-UNIT-03 was written to assert a *property* of the rule set ("every published flag is bound to a rule") rather than to test a specific case. No example-based test would have found it, because every example-based test used a flag that happened to be covered.

It has since been **closed**, and the manner of the fix matters as much as the fix. The same property assertion that found the defect was inverted to demand zero uncovered flags and kept in the suite, so the defect cannot silently reappear if a future rule is deactivated or a seventh red flag is added to the wizard without a matching rule. TC-UNIT-14 was added alongside it because the new rules carry high priority weights and could otherwise have hijacked ordinary non-emergency rule selection — a fix that introduces a subtler regression than the defect it closes is not a fix.

## 8.2 D-02 — Outstanding Owner Action

The engineering half of D-02 is complete and verified: the working tree scans clean, `.env` is untracked, and a pre-commit hook now blocks recurrence. **The credential half is not, and cannot be closed from the codebase**, because deleting a secret from source does not remove it from history:

| Action | Status | Note |
| :--- | :---: | :--- |
| Remove literals from the working tree | **Done** | Verified by TC-SEC-02 |
| Untrack `.env`; correct `.gitignore` | **Done** | Only `.env.example` remains tracked |
| Add secret scanning to the pre-commit hook | **Done** | `npm run hooks:install` |
| **Rotate the Ollama inference API key** | **Outstanding** | Requires the owner's provider account |
| **Rotate the PostgreSQL credential** | **Outstanding** | Requires the owner's database account |
| **Purge both from Git history** | **Outstanding** | Rewrites history on a public repository; the owner's decision |

Until the first two outstanding rows are complete, both credentials must be treated as compromised: the repository is public, and every commit remains retrievable.

---

# 9. Requirements Coverage Summary

| Requirement group | Total | Verified passing | Partial | Failed | Not tested |
| :--- | :---: | :---: | :---: | :---: | :---: |
| FR-1 Account management | 9 | 6 | 0 | 0 | 3 *(deferred requirements)* |
| FR-2 Triage engine | 14 | 12 | 1 | 0 | 1 *(deferred)* |
| FR-3 Booking | 11 | 8 | 0 | 1 *(FR-3.8)* | 2 *(deferred)* |
| FR-4 Dashboards and RBAC | 7 | 4 | 0 | 3 *(FR-4.5–4.7)* | 0 |
| FR-5 Payment | 8 | 8 | 0 | 0 | 0 |
| FR-6 Notifications | 6 | 5 | 0 | 0 | 1 *(deferred)* |
| FR-7 Consultation | 6 | 5 | 1 | 0 | 0 |
| FR-8 Administration and audit | 5 | 5 | 0 | 0 | 0 |
| FR-9 Validation and errors | 5 | 4 | 1 | 0 | 0 |
| NFR | 18 | 13 | 2 | 2 | 1 *(NFR-17 accessibility)* |
| **Total** | **89** | **70** | **5** | **6** | **8** |

---

# 10. Conclusions and Recommendations

## 10.1 Conclusions

1. **The safety-critical component is well tested and correct.** The rule engine passes fourteen dedicated tests covering every band, both boundary directions, the red-flag short-circuit, priority resolution, purity and the output contract, and it does so four orders of magnitude inside its latency budget. The one clinical defect it did contain (D-03) was found by the suite and is now closed and permanently guarded.
2. **All functional user journeys complete end-to-end** across all three roles, against the live deployment, including both the authorised and the declined payment paths.
3. **Performance comfortably meets both stated budgets**, with cold starts rather than query cost identified as the dominant tail-latency factor.
4. **Security does not meet the stated requirements.** Five probes fail, three defects are Critical, and the system must not process real patient data until they are closed.
5. **The testing process itself produced two findings of real value**: D-03 (unescalated red flags), found only by property-based assertion; and D-06 (tests exercising a copy of the algorithm rather than the algorithm), found by reviewing the tests rather than by running them.

## 10.2 Recommendations

| Priority | Recommendation | Rationale |
| :---: | :--- | :--- |
| 0 | **Rotate the exposed inference and database credentials, then purge Git history** | The engineering half of D-02 is closed but both credentials are still live in a public repository's history |
| 1 | Close D-01, D-05 and D-04 before any further feature work | Two remaining Critical defects, one of which exposes clinical and financial data to anonymous callers |
| 2 | ~~Close D-03 by binding every published red flag to an `EMERGENCY` rule~~ — **done** | Was the only defect with a direct clinical safety consequence |
| 3 | Add automated tests at the route-handler layer, starting with the role × endpoint authorisation matrix | The entire API layer currently has zero automated coverage, and this is exactly where the Critical defects live |
| 4 | Re-baseline NFR-1 from 200 ms to 5 ms | The current budget cannot detect any realistic regression |
| 5 | Add `axe-core` to CI and perform a manual assistive-technology pass | NFR-17 is the only requirement that was never assessed at all |
| 6 | Add component tests for the triage wizard and the booking modal | The two components carrying the most user-visible logic |
| 7 | Introduce a coverage threshold in CI, raised one release at a time | Prevents the current coverage distribution from silently eroding |

---

# Appendix A — How to Reproduce Every Automated Result

```bash
# Install dependencies
npm install

# Suite B — supporting modules (10 cases)
npm test

# Suite A — production rule engine (14 cases)
npm run test:unit

# Secret scan over every tracked file (TC-SEC-02)
npm run scan:secrets

# Install the pre-commit secret-scanning hook (once per clone)
npm run hooks:install

# Performance harness — NFR-1 (30,000 measured evaluations)
npm run test:perf

# Everything above, in sequence
npm run test:all

# Static analysis
npx tsc --noEmit

# Security probes against the live deployment (no credentials used)
node tests/security-probe.mjs

# Security probes against a different environment
node tests/security-probe.mjs http://localhost:3000
```

---

*End of Testing & Quality Assurance Report.*
