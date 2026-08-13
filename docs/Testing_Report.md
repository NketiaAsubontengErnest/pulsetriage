---
title: "Testing and Quality Assurance Report"
subtitle: "PulseTriage — Telehealth Appointment & Urgency Auto-Triage System"
author: "Ernest Nketia Asubonteng (22424715)"
date: "CSCD 602 Advanced Software Engineering · University of Ghana"
lang: en-GB
---

# TESTING AND QUALITY ASSURANCE REPORT

| Field | Detail |
|---|---|
| Student | Ernest Nketia Asubonteng — 22424715 |
| Course | CSCD 602 Advanced Software Engineering |
| Examiner | Prof. Solomon Mensah |
| Scope | Test strategy, cases and executed results. Requirements are in `SRS.docx`; defects that became debt are in `Technical_Debt_Plan.docx` |

---

# 1. Executive Summary

| Measure | Result |
|---|---|
| Automated tests executed | **44** |
| Automated tests passing | **44 (100%)** |
| Static type errors | **0** |
| Secret scan findings | **0** |
| Performance budget (NFR-1) | **PASS** — worst p95 0.0032 ms against a 200 ms budget |
| Security probes | **4 of 9 pass; 5 fail as expected** |
| Defects raised | **8** — 6 closed, 2 open and carried as debt |

The five failing security probes are reported as failures. They are the evidence
for the incomplete authorisation coverage recorded as TD-01, and adjusting the
test to make it pass would have destroyed the only objective record of the
weakness.

**Overall assessment.** Functional behaviour meets the prioritised requirements.
The safety-critical requirement FR-2.6 is covered by five dedicated tests and
passes all of them. The system is **not** fit to hold real patient data until the
critical items in `Technical_Debt_Plan.docx` are closed; this report is the
evidence for that judgement rather than a contradiction of it.

---

# 2. Test Strategy

## 2.1 Objectives

1. Prove that FR-2.6 — the red-flag short-circuit — cannot be bypassed.
2. Prove that FR-3.6 — exactly one appointment per slot — holds under concurrency.
3. Confirm that each prioritised functional requirement behaves as specified.
4. Establish whether the non-functional budgets are met.
5. Establish the true security posture rather than a flattering one.

## 2.2 Levels and Techniques

| Level | Technique | Automation |
|---|---|---|
| Unit | Equivalence partitioning, boundary analysis, decision tables | Automated (44) |
| Static | Whole-program type checking; secret scanning | Automated |
| Integration | API-to-database round trips against the live database | Scripted |
| System | End-to-end journeys per role through the interface | Manual |
| Acceptance | Scenario walkthrough against acceptance criteria | Manual |
| Performance | Repeated-execution latency harness | Automated |
| Security | Probe suite against the live deployment | Automated |

Boundary analysis drove the banding tests specifically: the tier boundaries at
80, 60 and 35 are exactly where an off-by-one would put a patient in the wrong
tier, so each boundary is tested on both sides.

## 2.3 Entry and Exit Criteria

**Entry.** Code compiles with zero type errors; the feature under test is
reachable through the interface; seed data is loaded.

**Exit.** All unit tests pass; no open defect is rated Critical against a
safety requirement; every remaining defect is recorded in the debt register with
an owner and a proposed resolution.

## 2.4 Environment

| Element | Detail |
|---|---|
| Runtime | Node.js 24, TypeScript 5.7 |
| Database | PostgreSQL (Neon), seeded |
| Deployment under test | <https://pulsetriage.vercel.app> |
| Unit runner | `node --test` and `tsx --test` |
| Commands | `npm test`, `npm run test:unit`, `npm run test:perf`, `npm run scan:secrets` |

---

# 3. Unit Testing — Executed Results

## 3.1 Suite A — Triage Rule Engine (14 tests)

Exercises the production engine directly. No database, no network.

| Test case | Requirement | Expected | Actual | Result |
|---|---|---|---|---|
| TC-UNIT-01 | FR-2.6 | Red flag forces EMERGENCY at 95 with booking suppressed | As expected | **Pass** |
| TC-UNIT-02 | FR-2.6 | Red flag overrides even a minimal-severity report | As expected | **Pass** |
| TC-UNIT-03 | FR-2.6 | Every published critical red flag is bound to an EMERGENCY rule | As expected | **Pass** |
| TC-UNIT-13 | FR-2.6 | Each newly bound red flag short-circuits independently | As expected | **Pass** |
| TC-UNIT-14 | FR-2.11 | New rules do not disturb existing rule selection | As expected | **Pass** |
| TC-UNIT-04 | FR-2.2, FR-2.5 | Score = severity×8 + onset bonus, clamped to 0–100 | As expected | **Pass** |
| TC-UNIT-05 | FR-2.4 | Banding at 80 / 60 / 35 applied on both sides of each boundary | As expected | **Pass** |
| TC-UNIT-06 | FR-2.2 | Each non-critical red flag contributes +10 | As expected | **Pass** |
| TC-UNIT-07 | FR-2.11 | Highest-priority rule wins when several match | As expected | **Pass** |
| TC-UNIT-08 | FR-2.10 | A deactivated rule takes no part in evaluation | As expected | **Pass** |
| TC-UNIT-09 | FR-2.7 | Every symptom category maps to a specialty | As expected | **Pass** |
| TC-UNIT-10 | FR-2.4 | Output contract holds for every urgency band | As expected | **Pass** |
| TC-UNIT-11 | FR-2.8 | The persistence adapter preserves the engine verdict | As expected | **Pass** |
| TC-UNIT-12 | FR-2.9 | Identical input yields identical output | As expected | **Pass** |

TC-UNIT-03 deserves particular note. Rather than testing a fixed list, it reads
the red flags the interface actually offers the patient and asserts that each one
is bound to a rule that escalates. It is the test that found defect D-03.

## 3.2 Suite B — Scheduling and Slot Generation (16 tests)

Exercises the shared slot generator that backs the clinician's availability
manager, the patient's booking picker and the server-side booking guard.

| Test case | Requirement | Expected | Actual | Result |
|---|---|---|---|---|
| TC-SCH-01 | FR-3.2 | A weekday window expands into back-to-back slots | 6 slots, 09:00–12:00 at 30 min | **Pass** |
| TC-SCH-02 | FR-3.10 | Slot length comes from the clinician, not a fixed 30 minutes | 9 slots at 20 min | **Pass** |
| TC-SCH-03 | FR-3.2 | A trailing part-slot that does not fit is not offered | 2 slots, not 2 + stub | **Pass** |
| TC-SCH-04 | FR-3.4 | A day with no published hours produces no slots | 0 slots | **Pass** |
| TC-SCH-05 | FR-3.1 | An inactive window is ignored on its own weekday | 0 slots | **Pass** |
| TC-SCH-06 | FR-3.3 | A booked slot is marked unavailable and names the patient | As expected | **Pass** |
| TC-SCH-07 | FR-3.7 | A cancelled appointment releases its slot | Slot available again | **Pass** |
| TC-SCH-08 | FR-3.2 | Overlapping windows never offer a duplicate slot | Unique starts only | **Pass** |
| TC-SCH-09 | FR-3.2 | Slots return in chronological order regardless of input order | Sorted | **Pass** |
| TC-SCH-10 | FR-3.4 | Dates read as local calendar days, not UTC instants | Monday = 1 | **Pass** |
| TC-SCH-11 | — | Time helpers round-trip | Exact | **Pass** |
| TC-SCH-12 | FR-3.1 | Valid availability accepted and defaulted | 30 min, active | **Pass** |
| TC-SCH-13 | FR-3.1 | Out-of-range weekday rejected | Rejected | **Pass** |
| TC-SCH-14 | FR-3.1 | Window ending before it starts rejected | Rejected, names the day | **Pass** |
| TC-SCH-15 | FR-3.1 | Malformed times and absurd slot lengths rejected | Rejected | **Pass** |
| TC-SCH-16 | FR-3.2 | Non-array availability rejected | Rejected | **Pass** |

TC-SCH-10 exists because a UTC-parsed date silently shifts to the previous day
for anyone west of Greenwich, which would offer Sunday slots on a Monday.

## 3.3 Suite C — Clinical Record Composition (5 tests)

| Test case | Requirement | Expected | Actual | Result |
|---|---|---|---|---|
| TC-REC-01 | FR-5.4 | Every completed section is recorded | As expected | **Pass** |
| TC-REC-02 | FR-5.4 | Notes written after the call survive into the record | As expected | **Pass** |
| TC-REC-03 | FR-5.4 | Empty sections produce explicit placeholders, not blanks | As expected | **Pass** |
| TC-REC-04 | FR-5.4 | Whitespace-only input treated as empty | As expected | **Pass** |
| TC-REC-05 | FR-5.4 | Sign-off timestamp stamped on the record | As expected | **Pass** |

## 3.4 Suite D — Supporting Modules (10 tests)

| Test case | Subject | Expected | Actual | Result |
|---|---|---|---|---|
| TC-SUP-01 | AI triage fallback schema integrity | Shape preserved | As expected | **Pass** |
| TC-SUP-02 | SOAP note schema structure | Shape preserved | As expected | **Pass** |
| TC-SUP-03 | Lab result normalisation | Normalised | As expected | **Pass** |
| TC-SUP-04 | No-show risk calculation | Correct tiering | As expected | **Pass** |
| TC-SUP-05 | Triage engine — emergency trigger | EMERGENCY | As expected | **Pass** |
| TC-SUP-06 | Triage engine — urgent classification | URGENT | As expected | **Pass** |
| TC-SUP-07 | Triage engine — routine classification | ROUTINE | As expected | **Pass** |
| TC-SUP-08 | Consultation room URL generation | Correct URL | As expected | **Pass** |
| TC-SUP-09 | Consultation completion transition | COMPLETED | As expected | **Pass** |
| TC-SUP-10 | Chat message data structure | Shape preserved | As expected | **Pass** |

## 3.5 Static Analysis

| Check | Command | Expected | Actual | Result |
|---|---|---|---|---|
| TC-STAT-01 | `npx tsc --noEmit` | 0 errors | 0 errors | **Pass** |
| TC-STAT-02 | `npm run scan:secrets` | 0 findings | 0 findings | **Pass** |
| TC-STAT-03 | `npm run build` | Build succeeds | Succeeds | **Pass** |

TC-STAT-01 caught defect **D-08** during this reporting cycle — a malformed
import statement in the session module that made the whole project fail to
compile. See §7.

---

# 4. Performance Testing — Executed Results

## 4.1 TC-PERF-01 — Rule engine latency (NFR-1, budget 200 ms)

30,000 evaluations, 10,000 per case.

| Case | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) | Verdict |
|---|---:|---:|---:|---:|:---:|
| Emergency red-flag short-circuit | 0.0005 | 0.0010 | 0.0015 | 0.6527 | **Pass** |
| Full banding path, no red flag | 0.0011 | 0.0032 | 0.0063 | 0.6777 | **Pass** |
| Routine low-severity path | 0.0009 | 0.0019 | 0.0024 | 0.3270 | **Pass** |

The worst p95 is 0.0032 ms against a 200 ms budget — roughly 62,000× margin. The
result is unsurprising and is reported for completeness: the engine is pure
computation over a small rule set, so the budget was never at risk. The
meaningful finding is the `max` column, where first-call figures reach 0.65 ms
from just-in-time warm-up, still four orders of magnitude inside budget.

## 4.2 TC-PERF-02 — Interactive response (NFR-2, budget 2,000 ms at p95)

| Endpoint | Observed | Verdict |
|---|---|---|
| Public pages (`/`, `/about`, `/doctors`) | Within budget | **Pass** |
| `GET /api/doctors` | Within budget | **Pass** |
| `GET /api/doctors/:id/schedule?date=` | Within budget | **Pass** |
| `POST /api/ai/*` | **Exceeds budget** — 3–25 s | **Fail (accepted)** |

The AI endpoints exceed the interactive budget because they wait on external
model inference. This is accepted rather than fixed: NFR-2 governs interactive
paths, and the AI features are explicitly advisory and asynchronous from the
user's point of view. It is recorded as defect **D-07** with a resolution
(move to a background job) rather than silently reclassified.

## 4.3 TC-PERF-03 — Availability (NFR-3)

| Check | Expected | Actual | Result |
|---|---|---|---|
| Deployment reachable | HTTP 200 | HTTP 200 on all public routes | **Pass** |

---

# 5. Security Testing — Executed Results

Nine probes against the live deployment.

| # | Probe | Expected | Actual | Result |
|---|---|---|---|---|
| SEC-01 | HTTPS enforced | Enforced | Enforced | **Pass** |
| SEC-02 | Password hashed, never returned | Hash only | bcrypt, never returned | **Pass** |
| SEC-03 | Weak password rejected at registration | Rejected | Rejected on client and server | **Pass** |
| SEC-04 | No secret in the working tree | 0 findings | 0 findings | **Pass** |
| SEC-05 | Unauthenticated read of another user's appointments | Denied | **Permitted on unguarded routes** | **Fail** |
| SEC-06 | Unauthenticated write to a protected resource | Denied | **Permitted on unguarded routes** | **Fail** |
| SEC-07 | Role escalation by editing client-side session copy | Denied | **Interface changes; guarded routes correctly reject** | **Partial** |
| SEC-08 | Internal error detail suppressed | Suppressed | **Echoed on some paths** | **Fail** |
| SEC-09 | Brute-force protection on sign-in | Throttled | **No throttling** | **Fail** |

## 5.1 Interpretation

SEC-05, SEC-06 and SEC-07 all stem from one cause: a signed-session layer exists
and is correct, but it is applied to only part of the route surface. Where
`requireAuth` is present the probe is correctly rejected; where it is absent the
route acts on a caller-supplied identifier. This is TD-01, and it is the reason
the deployment carries a notice against entering real data.

SEC-07 is recorded as *Partial* rather than *Fail* because the outcome changed
during the project: editing the client-side session copy still alters the
interface, but any guarded route now rejects the forged identity outright.

SEC-08 is TD-13. SEC-09 is TD-17.

## 5.2 OWASP Top 10 (2021) Assessment

| Category | Status | Note |
|---|---|---|
| A01 Broken Access Control | **Open** | TD-01 — partial route coverage |
| A02 Cryptographic Failures | **Partial** | bcrypt and HTTPS correct; signing key has a published fallback (TD-21) |
| A03 Injection | Addressed | Parameterised access through the ORM throughout |
| A04 Insecure Design | Partial | Simulated payment is deliberate and disclosed |
| A05 Security Misconfiguration | **Open** | TD-13 — internal error detail echoed |
| A06 Vulnerable Components | Addressed | Dependencies current at build time |
| A07 Identification & Authentication Failures | **Open** | TD-17 — no throttling; TD-05 — no verification or reset |
| A08 Software & Data Integrity | Addressed | Transactional writes; unique slot constraint |
| A09 Logging & Monitoring | Partial | Writes audited; reads not (TD-08) |
| A10 Server-Side Request Forgery | Not applicable | No user-supplied URL is fetched server-side |

---

# 6. Integration, System and Acceptance Testing

## 6.1 Integration

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| TC-INT-01 | Triage submission persists and returns the stored assessment | Row written, verdict preserved | As expected | **Pass** |
| TC-INT-02 | Booking writes appointment, notification and audit row in one transaction | All three or none | All three | **Pass** |
| TC-INT-03 | Booking outside published hours is refused | HTTP 409 naming available slots | As expected | **Pass** |
| TC-INT-04 | Booking in the past is refused | HTTP 400 | As expected | **Pass** |
| TC-INT-05 | **Eight concurrent bookings of one slot** | Exactly 1 created, 7 refused | 1 created, 7 refused | **Pass** |
| TC-INT-06 | Cancellation clears the slot key and frees the slot | Re-booking succeeds | As expected | **Pass** |
| TC-INT-07 | Schedule save round-trips and regenerates slots | 20-min windows produce 6 slots | As expected | **Pass** |
| TC-INT-08 | Consultation brief served to the clinician only | Clinician receives it; patient receives `null` | As expected | **Pass** |
| TC-INT-09 | Password change verified against the current password | Wrong rejected; correct succeeds and new password signs in | As expected | **Pass** |
| TC-INT-10 | Contact enquiry reaches an administrator and is audited | Notification and audit row written | As expected | **Pass** |

TC-INT-05 is the evidence for FR-3.6 and is the single most important
integration result in this report.

## 6.2 System Testing

| # | Journey | Expected | Actual | Result |
|---|---|---|---|---|
| TC-SYS-01 | Register → triage → book → pay → confirmed | Completes; appointment CONFIRMED | As expected | **Pass** |
| TC-SYS-02 | Red-flag triage end to end | EMERGENCY; no booking control anywhere on the view | As expected | **Pass** |
| TC-SYS-03 | Clinician signs in and works the queue | Ordered by urgency, not booking time | As expected | **Pass** |
| TC-SYS-04 | Two-party video consultation | Two-way audio and video, chat, notes | As expected | **Pass** |
| TC-SYS-05 | Clinician signs off; patient sees the note | Status COMPLETED; note visible | As expected | **Pass** |
| TC-SYS-06 | Administrator verifies a clinician | Clinician becomes bookable | As expected | **Pass** |
| TC-SYS-07 | Patient reschedules a confirmed appointment | Moves; availability re-checked; no repayment | As expected | **Pass** |
| TC-SYS-08 | Responsive behaviour at 360 px | No horizontal scroll; controls reachable | As expected | **Pass** |

## 6.3 User Acceptance Testing

Scenario-based walkthrough against the acceptance criteria for each user class.

| # | Acceptance criterion | Verdict |
|---|---|---|
| UAT-01 | A first-time patient completes an assessment without instruction | **Accepted** |
| UAT-02 | The result is understandable without clinical knowledge | **Accepted** |
| UAT-03 | A red-flag result makes the required action unmistakable | **Accepted** |
| UAT-04 | A clinician can identify the most urgent patient at a glance | **Accepted** |
| UAT-05 | A clinician has the case history before the consultation opens | **Accepted** |
| UAT-06 | An administrator can verify a clinician and see the effect | **Accepted** |
| UAT-07 | The patient can find and understand their clinical notes afterwards | **Accepted** |

**Limitation of this evidence.** Acceptance testing was performed by the
developer, not by representative users. It establishes that the criteria are
*met as written*; it does not establish that they are the right criteria. Testing
with real patients and clinicians is required before any claim of usability is
defensible.

---

# 7. Defect Register

| ID | Description | Severity | Found by | Status | Corrective action |
|---|---|---|---|---|---|
| D-01 | Unauthenticated access permitted on unguarded API routes | **Critical** | SEC-05, SEC-06 | **Open** | Signed-session layer built; applied to 7 of 28 routes. Remainder tracked as TD-01 |
| D-02 | Inference API key committed to source | **Critical** | Code review | **Closed** | Removed from tree; env-var only; scanner and pre-commit hook added. History purge remains as TD-02 |
| D-03 | Two published red flags bound to no EMERGENCY rule | **Critical** | TC-UNIT-03 | **Closed** | RULE-007 and RULE-008 added; regression tests TC-UNIT-13/14 |
| D-04 | Two patients could hold the same slot | **Critical** | TC-INT-05 | **Closed** | Unique constraint on `(doctor_id, slot_key)` plus transactional re-check |
| D-05 | Consultation carried no audio to the remote participant | **Major** | TC-SYS-04 | **Closed** | Missing audio m-line added; camera and microphone acquired independently; dedicated audio element |
| D-06 | Clinical note template presented as AI output when inference failed | **Major** | TC-SYS-05 | **Closed** | Fabricated content removed; the interface now states plainly when no model was reached |
| D-07 | AI endpoints exceed the NFR-2 interactive budget | **Minor** | TC-PERF-02 | **Open (accepted)** | Advisory paths only; move to a background job in v1.2 |
| D-08 | Malformed import made the project fail to compile | **Critical** | TC-STAT-01 | **Closed** | Import corrected; signature comparison also made constant-time |

D-06 is worth singling out. When inference was unreachable, the system filled the
clinical note from a keyword-matched template — any transcript containing the
letters "bp" produced a confident hypertension diagnosis with a prescription. It
was indistinguishable from a generated answer in the interface, so an outage
looked like a working feature. The template was removed rather than improved: a
blank note the clinician must complete is the only safe failure mode.

---

# 8. Traceability and Conclusion

| Requirement | Verified by |
|---|---|
| FR-2.6 (safety-critical) | TC-UNIT-01, 02, 03, 13, TC-SYS-02 |
| FR-2.2 – FR-2.5, FR-2.9 – FR-2.11 | TC-UNIT-04 – 08, 10, 12 |
| FR-3.1 – FR-3.4, FR-3.10 | TC-SCH-01 – 05, 12 – 16, TC-INT-03, 04 |
| FR-3.6 (concurrency) | TC-INT-05 |
| FR-3.7 – FR-3.9 | TC-SCH-07, TC-INT-06, TC-SYS-07 |
| FR-4.x (payment) | TC-SYS-01 |
| FR-5.x (clinical workflow) | TC-REC-01 – 05, TC-SYS-03, 05, TC-INT-08 |
| FR-6.x (video consultation) | TC-SYS-04, TC-SUP-08 – 10 |
| FR-8.x (governance) | TC-SYS-06, TC-INT-10 |
| NFR-1 / NFR-2 / NFR-3 | TC-PERF-01 / 02 / 03 |
| NFR-8 – NFR-12 | SEC-01 – 09 |

**Conclusion.** The prioritised functional requirements are met and evidenced.
Both requirements identified in the SRS as carrying disproportionate weight —
FR-2.6 and FR-3.6 — are covered by dedicated tests and pass. Performance is
comfortably inside budget.

The security posture is the honest exception: four probes fail and one is
partial, all traceable to authorisation coverage that is correct in mechanism but
incomplete in application. That is stated as a failure here, priced in
`Technical_Debt_Plan.docx`, and reflected in the deployment notice. The system is
a sound demonstrator and is not yet fit to hold real patient data.

---

*End of Testing and Quality Assurance Report.*
