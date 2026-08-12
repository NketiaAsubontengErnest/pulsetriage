---
title: "Technical Debt Identification & Management Plan"
subtitle: "PulseTriage — Telehealth Appointment & Urgency Auto-Triage System"
author: "Ernest Nketia Asubonteng (Index No. 22424715)"
date: "12 August 2026"
---

# TECHNICAL DEBT IDENTIFICATION & MANAGEMENT PLAN

## PulseTriage — Telehealth Appointment & Urgency Auto-Triage System

| Field | Value |
| :--- | :--- |
| **Course** | CSCD 602 — Advanced Software Engineering |
| **Candidate** | Ernest Nketia Asubonteng |
| **Index Number** | 22424715 |
| **Examiner** | Prof. Solomon Mensah |
| **Document version** | 1.0 |
| **Date** | 12 August 2026 |
| **Register size** | 15 tracked items — 4 Critical, 5 High, 6 Medium |
| **Estimated total remediation** | **246 person-hours** |

---

# 1. Executive Summary

Technical debt in this project was **incurred deliberately, recorded at the moment of incurrence, and priced**. It is not a list of defects discovered after the fact.

The 48-hour examination constraint forced a single strategic decision: deliver the **full functional surface** of the system at demonstrator fidelity, rather than a **narrow slice** at production fidelity. That decision was made at hour 6, immediately after the Use Case Points estimate showed that a production-grade build of the specified scope carries an effort of roughly **1,900–2,130 person-hours** (see Project Documentation §7), against an available budget of approximately **46 person-hours**.

The gap between those two figures is not waste and it is not failure. It is the **technical debt principal plus deferred scope**, and this document is the ledger for it. Of that gap, **246 person-hours is classified as true technical debt** — work that must be done to make the *already-delivered* functionality safe and correct. The remainder is deferred scope: features that were never promised for v1.0.

Two consequences follow, and both are stated plainly rather than concealed:

1. **Four items are Critical.** Three of them (TD-01, TD-02, TD-03) are security defects that make the deployed application unsuitable for real patient data in its current state. They are disclosed here, they are reproducible by the examiner using the test cases in the Testing Report, and they carry a repayment window measured in days rather than months.
2. **The demonstrator is honest about what it simulates.** The payment gate, the notification queue and the consultation media path are all simulated. Each simulation sits behind a stable interface specifically so that the real implementation is a substitution rather than a rewrite. That design choice is what converts an unmanageable rewrite into a bounded, estimable repayment.

## 1.1 Debt Classification Scheme

Every item is classified along two axes.

**By intent (Fowler's technical debt quadrant):**

| Quadrant | Meaning | Count in this register |
| :--- | :--- | :---: |
| **Deliberate & Prudent** | "We know this is not the right long-term design; we are accepting it consciously with a repayment plan." | 11 |
| **Deliberate & Reckless** | "We knew better and shipped it anyway without a plan." | 0 |
| **Inadvertent & Prudent** | "Now that we have built it, we see the better design." | 3 |
| **Inadvertent & Reckless** | "We did not know what we were doing." | 1 (TD-02) |

**By urgency (as required by the examination brief):**

| Class | Definition | Items |
| :--- | :--- | :--- |
| **Critical — immediate attention required** | The system must not process real patient data until this is repaid. Blocks any pilot. | TD-01, TD-02, TD-03, TD-13 |
| **Scheduled for future resolution** | Genuine debt with a real cost, but the system functions correctly for its stated demonstrator purpose. Assigned to a named release. | TD-04, TD-05, TD-06, TD-08, TD-11, TD-07, TD-09, TD-10, TD-12, TD-14 |
| **Acceptable temporarily** | Consciously accepted; the cost of repaying now exceeds the cost of carrying it. Reviewed each release. | TD-15 |

## 1.2 Debt Register at a Glance

| ID | Debt item | Severity | Class | Effort (h) | Target |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **TD-01** | No server-side authentication or authorisation on API endpoints | **CRITICAL** | Immediate | 24 | v1.1 |
| **TD-02** | Literal API key committed to source as a fallback | **CRITICAL** | Immediate | 3 | v1.1 (hotfix) |
| **TD-03** | Unsigned session profile in browser local storage | **CRITICAL** | Immediate | 16 | v1.1 |
| **TD-13** | Internal error messages echoed to the client | **CRITICAL** | Immediate | 4 | v1.1 (hotfix) |
| **TD-04** | Administrator triage-rule edits are session-scoped, not persisted | High | Scheduled | 20 | v1.2 |
| **TD-05** | No e-mail/phone verification and no password reset | High | Scheduled | 18 | v1.2 |
| **TD-06** | No slot-level concurrency control; double-booking is possible | High | Scheduled | 12 | v1.2 |
| **TD-08** | PHI read access not comprehensively audited | High | Scheduled | 10 | v1.2 |
| **TD-11** | Payment settlement fully simulated | High | Scheduled | 40 | v2.0 |
| **TD-07** | No patient-initiated reschedule or cancellation | Medium | Scheduled | 14 | v1.3 |
| **TD-09** | No accessibility audit; WCAG 2.1 AA unverified | Medium | Scheduled | 16 | v1.3 |
| **TD-10** | Consultation room has local media preview only, no peer connection | Medium | Scheduled | 36 | v2.0 |
| **TD-12** | Notification delivery is in-application only | Medium | Scheduled | 20 | v2.0 |
| **TD-14** | Monetary amounts stored as floating-point | Medium | Scheduled | 8 | v1.3 |
| **TD-15** | No data-processing agreement or de-identification for LLM calls | Medium | Acceptable | 5 | v2.0 |
| | **TOTAL** | | | **246** | |

---

# 2. Technical Debt Register (Detailed)

Each item follows the required format: **Debt → Cause → Impact → Priority → Proposed Resolution**, extended with the artefact where the debt lives, the requirement it violates, and the effort to repay it.

---

## TD-01 — No server-side authentication or authorisation on API endpoints

| Field | Detail |
| :--- | :--- |
| **Debt** | Access control is enforced only in the browser, by the `AuthGuard` React component. Not a single API route handler verifies who the caller is or whether they are permitted to perform the operation. Any client that can reach the public URL can call `GET /api/patients`, `PATCH /api/doctors/{id}` or `GET /api/audit` directly and receive a `200 OK`. |
| **Where it lives** | Every file under `src/app/api/**/route.ts`; the guard is at `src/components/auth/auth-guard.tsx`. |
| **Requirements violated** | FR-4.5, FR-4.6, API-5, API-6, NFR-6, NFR-15 |
| **Cause** | Direct consequence of the 48-hour constraint. Implementing this correctly requires a session-token scheme (issue, sign, transmit, verify, expire, refresh), a middleware layer, and a permission predicate evaluated per route against the operations matrix in SRS §3.2.4. That is roughly a full working day of the 46-hour budget — a quarter of the entire implementation allocation — for work that produces **no visible functionality** in a demonstration. The conscious trade was: build the visible clinical workflow, disclose the gap. |
| **Impact** | **Severe.** The role separation the system claims is cosmetic. A patient who opens the browser developer console can retrieve every other patient's triage history, read the full audit log, and change a doctor's verification status. Confidentiality, integrity and non-repudiation are all compromised. The system **must not** be exposed to real patient data in this state. In the deployed demonstrator this is contained by the fact that all data is synthetic seed data. |
| **Priority** | **CRITICAL — requires immediate attention.** Blocks any pilot deployment. |
| **Fowler quadrant** | Deliberate & Prudent — known at the time of the decision, recorded immediately, priced. |
| **Proposed resolution** | (1) Issue a signed, short-lived JWT on successful login, delivered in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. (2) Add Next.js middleware that verifies the token on every `/api/*` request and attaches the resolved principal to the request context. (3) Encode the operations matrix from SRS §3.2.4 as a declarative permission table and evaluate it per route, returning `401` for unauthenticated and `403` for unauthorised. (4) Write every `403` to the audit log, satisfying FR-4.6. (5) Add an automated test per role per endpoint asserting that cross-role access is refused — this converts the fix into a permanent regression barrier. |
| **Effort to repay** | 24 person-hours |
| **Repayment milestone** | v1.1 — Security Hardening (Week 1) |
| **Verification on repayment** | Test case TC-SEC-01 must invert from FAIL to PASS; the full role × endpoint matrix test must pass. |

---

## TD-02 — Literal API key committed to source as a fallback

| Field | Detail |
| :--- | :--- |
| **Debt** | `src/lib/ai/ollama-client.ts` reads the inference API key from the environment but falls back to a hard-coded literal string when the variable is absent. That literal is committed to the Git repository and is therefore present in the repository history. |
| **Where it lives** | `src/lib/ai/ollama-client.ts`, the `apiKey` initialisation. |
| **Requirements violated** | NFR-7, COM-3 |
| **Cause** | Convenience during rapid local development: the fallback removed the need to configure an environment variable on every machine and on the first deployment. The intention was to remove it before deployment; under time pressure that step was not taken. This is the one item in the register that is genuinely **Inadvertent & Reckless** — no engineering trade-off justifies it. |
| **Impact** | The key is exposed to anyone with repository access, and it will remain in Git history even after the line is deleted from the working tree. Consequences are unauthorised inference consumption billed to the key owner, and potential rate-limit exhaustion causing the AI features to fail for legitimate users. Because the AI layer has deterministic fallbacks, the *availability* impact is contained; the *financial and credential* impact is not. |
| **Priority** | **CRITICAL — requires immediate attention.** |
| **Fowler quadrant** | Inadvertent & Reckless. |
| **Proposed resolution** | (1) **Revoke and rotate the exposed key immediately** — deletion from source is insufficient because history retains it. (2) Remove the literal fallback and fail fast at startup with a clear configuration error when the variable is absent. (3) Purge the secret from Git history using `git filter-repo`, then force-push and invalidate all clones. (4) Add a pre-commit secret-scanning hook (`gitleaks` or `trufflehog`) and enable repository-level secret scanning so the class of defect cannot recur. |
| **Effort to repay** | 3 person-hours |
| **Repayment milestone** | v1.1 — hotfix, ahead of all other work |
| **Verification on repayment** | Test case TC-SEC-02 must invert from FAIL to PASS; a repository-wide secret scan must return zero findings. |

---

## TD-03 — Unsigned session profile in browser local storage

| Field | Detail |
| :--- | :--- |
| **Debt** | On successful login the complete user profile — including the `role` field — is serialised to `localStorage` under the key `pulsetriage_session`. There is no signature, no expiry and no server-side session record. The client is trusted to report its own identity and privilege. |
| **Where it lives** | `src/lib/auth-context.tsx`; consumed by `src/app/login/page.tsx` and `src/components/auth/auth-modal.tsx`. |
| **Requirements violated** | FR-1.5, NFR-6, DP-4 |
| **Cause** | `localStorage` is the fastest possible way to make session persistence work across page reloads in a client-rendered React application — roughly fifteen minutes of work, against several hours for a cookie-based signed-token scheme with server-side verification. Chosen deliberately to protect the implementation budget. |
| **Impact** | **Compounds TD-01 into a complete authorisation bypass.** A user need only edit one word in browser storage — changing `"role":"PATIENT"` to `"role":"ADMIN"` — and reload, to be presented with the full administrator console. Because no server-side check exists (TD-01), every action taken from that console succeeds. Additionally, storage in `localStorage` makes the session readable by any injected script, so any future cross-site-scripting defect becomes an immediate account-takeover. Sessions also never expire. |
| **Priority** | **CRITICAL — requires immediate attention.** |
| **Fowler quadrant** | Deliberate & Prudent. |
| **Proposed resolution** | Replace with the token scheme described in TD-01: server-issued signed JWT with a 15-minute access lifetime and a rotating refresh token, both in `HttpOnly` cookies that JavaScript cannot read. Retain in client state only non-sensitive display fields (name, avatar). Add explicit session invalidation on logout, server-side. Repay **together with TD-01** — they share the same implementation and repaying either alone leaves the bypass open. |
| **Effort to repay** | 16 person-hours (shares infrastructure with TD-01) |
| **Repayment milestone** | v1.1 — Security Hardening (Week 1) |
| **Verification on repayment** | Manual privilege-escalation attempt via storage editing must fail; TC-SEC-05 must pass. |

---

## TD-13 — Internal error messages echoed to the client

| Field | Detail |
| :--- | :--- |
| **Debt** | Several route handlers return the caught exception's own message in the JSON error response — for example the login handler returns `error?.message` with HTTP 500. Database driver messages, constraint names and connection details can therefore reach the browser. |
| **Where it lives** | `src/app/api/auth/login/route.ts` and comparable handlers across `src/app/api/**`. |
| **Requirements violated** | FR-9.2, NFR-7 |
| **Cause** | Deliberate during development: echoing the real error made serverless deployment failures diagnosable without log access, which materially accelerated the deployment phase. The intent was to remove it once deployment stabilised. |
| **Impact** | Information disclosure (OWASP A05, Security Misconfiguration). Leaked schema and driver detail gives an attacker a map of the data layer and shortens the reconnaissance phase of an attack. Not directly exploitable on its own, but it lowers the cost of exploiting everything else. |
| **Priority** | **CRITICAL — requires immediate attention.** Cheap to fix; no reason to carry it. |
| **Fowler quadrant** | Deliberate & Prudent (with an overrun repayment date). |
| **Proposed resolution** | Introduce a single error-response helper used by every handler. It logs the full exception server-side with a generated correlation identifier, and returns to the client only a generic message plus that identifier. Add a lint rule forbidding `error.message` inside any `NextResponse.json` call. |
| **Effort to repay** | 4 person-hours |
| **Repayment milestone** | v1.1 — hotfix |
| **Verification on repayment** | TC-SEC-04 must pass; no response body may contain driver or schema text. |

---

## TD-04 — Administrator triage-rule edits are session-scoped, not persisted

| Field | Detail |
| :--- | :--- |
| **Debt** | The rule configurator at `/admin/rules` seeds its state from the `INITIAL_TRIAGE_RULES` constant and holds edits in React component state. Adding a rule, or toggling one active/inactive, affects only the current browser session and is lost on reload. The engine used by patients continues to read the compiled-in constant. |
| **Where it lives** | `src/app/admin/rules/page.tsx`; the rule source is `INITIAL_TRIAGE_RULES` in `src/lib/triage-engine.ts`. |
| **Requirements violated** | FR-2.12 (partially), FR-2.13, NFR-11 |
| **Cause** | The rules-as-data design goal was met at the *representation* level — rules are declarative records with thresholds, weights and active flags, exactly as FR-2.10 requires — but the persistence half (a `triage_rules` table, CRUD endpoints, versioning and a publish step) was cut when the effort estimate showed it would consume roughly 20 hours of the 46-hour budget. Representation was preserved because it is the part that is expensive to retrofit; persistence was deferred because it is mechanical. |
| **Impact** | Changing clinical rule content still requires a code change and a redeployment, which defeats the stated maintainability objective and blocks the intended clinician-in-the-loop workflow. It also means the simulator at `/admin/rules` demonstrates a capability the production path does not yet have — a discrepancy an examiner or clinician could reasonably find misleading if it were not disclosed here. |
| **Priority** | **HIGH — scheduled for future resolution.** |
| **Fowler quadrant** | Deliberate & Prudent. |
| **Proposed resolution** | (1) Add a `triage_rules` table mirroring the `DynamicTriageRule` shape, with `version`, `published_at` and `created_by`. (2) Add `GET/POST/PATCH /api/triage-rules` guarded by the administrator permission introduced in TD-01. (3) Change the engine to load the active published rule set, with the compiled-in constant retained only as a cold-start fallback. (4) Add a two-step publish flow: edit → simulate against a sample corpus → publish, with the simulation result recorded in the audit log. (5) Retain every superseded version so that any historical triage decision can be replayed against the rules in force at the time — a genuine clinical-governance requirement. |
| **Effort to repay** | 20 person-hours |
| **Repayment milestone** | v1.2 — Clinical Governance (Month 1) |

---

## TD-05 — No e-mail/phone verification and no password reset

| Field | Detail |
| :--- | :--- |
| **Debt** | Registration activates an account immediately on submission. There is no confirmation code, and a user who forgets their password has no recovery path. |
| **Where it lives** | `src/app/api/auth/register/route.ts` |
| **Requirements violated** | FR-1.7, FR-1.8 |
| **Cause** | Both flows depend on a real message-delivery channel, which is itself deferred (TD-12). Building verification against a simulated channel would have produced a flow that could not actually be completed by a real user, so it was deferred as a unit with its dependency. |
| **Impact** | Accounts can be registered against e-mail addresses the registrant does not control, which permits impersonation and pollutes the user table. Password loss is unrecoverable, which in production would generate a continuous manual support burden. |
| **Priority** | **HIGH — scheduled for future resolution.** |
| **Fowler quadrant** | Deliberate & Prudent. |
| **Proposed resolution** | Repay immediately after TD-12 lands the real delivery channel. Add a `verification_tokens` table with single-use, time-limited, hashed tokens. Gate login on `email_verified`. Implement password reset as a separate single-use token flow that invalidates all active sessions on completion. Rate-limit both endpoints. |
| **Effort to repay** | 18 person-hours |
| **Repayment milestone** | v1.2 — Clinical Governance (Month 1), sequenced after TD-12 |

---

## TD-06 — No slot-level concurrency control; double-booking is possible

| Field | Detail |
| :--- | :--- |
| **Debt** | `POST /api/appointments` validates that the doctor exists and then inserts the appointment. It performs no check that the requested slot is free, and there is no unique constraint on `(doctor_id, appointment_date, start_time)`. Two patients submitting the same slot concurrently both succeed. |
| **Where it lives** | `src/app/api/appointments/route.ts`; schema at `prisma/schema.prisma`. |
| **Requirements violated** | FR-3.8 |
| **Cause** | Correct handling requires either a database-level unique constraint with graceful conflict handling, or a serialisable transaction that reads availability and inserts atomically. Under time pressure the simpler insert was shipped, on the reasoning that a single-user demonstration cannot surface the race. That reasoning is valid for the demonstration and invalid for production — which is precisely why it is recorded here rather than left implicit. |
| **Impact** | Two patients can hold the same 30-minute slot. Clinically this produces a real consultation collision; commercially it produces two charged transactions for one deliverable service. The severity is masked in the demonstrator only because concurrent load does not occur. |
| **Priority** | **HIGH — scheduled for future resolution.** |
| **Fowler quadrant** | Deliberate & Prudent. |
| **Proposed resolution** | (1) Add a composite unique index on `(doctor_id, appointment_date, start_time)` filtered to non-cancelled statuses. (2) Wrap creation in a transaction that catches the unique-violation error and returns HTTP 409 with the refreshed availability list. (3) Add a materialised slot table so availability can be read without recomputation. (4) Add a concurrency regression test that fires simultaneous booking requests for one slot and asserts exactly one success. |
| **Effort to repay** | 12 person-hours |
| **Repayment milestone** | v1.2 — Clinical Governance (Month 1) |

---

## TD-08 — PHI read access not comprehensively audited

| Field | Detail |
| :--- | :--- |
| **Debt** | Audit entries are written for *write* events — triage submitted, appointment booked, payment processed, doctor verified. Administrator and doctor **read** access to patient clinical data is not logged. |
| **Where it lives** | Audit writes across `src/app/api/**`; read paths in `/api/triage`, `/api/patients`, `/api/appointments`. |
| **Requirements violated** | FR-4.7, NFR-8 (partially), NFR-15 |
| **Cause** | Write-path auditing was implemented because it was needed for the administrator console's visible audit view. Read-path auditing produces no visible feature and was cut. It also cannot be implemented meaningfully until TD-01 lands, because without server-side identity there is no reliable actor to record. |
| **Impact** | The access-to-PHI trail required by health-data governance regimes is absent. It is impossible to answer "who looked at this patient's record, and when" — a question that is routinely asked during a privacy investigation. |
| **Priority** | **HIGH — scheduled for future resolution.** |
| **Fowler quadrant** | Inadvertent & Prudent — the write/read asymmetry was only recognised during the security review in Phase 4. |
| **Proposed resolution** | Once TD-01 provides an authenticated principal, add a shared read-audit decorator applied to every handler returning PHI. Record actor, subject patient, entity, purpose-of-access and timestamp. Route audit records to append-only storage with a retention period distinct from business data. Add an administrator view filtered to PHI access events. |
| **Effort to repay** | 10 person-hours |
| **Repayment milestone** | v1.2 — Clinical Governance (Month 1), sequenced after TD-01 |

---

## TD-11 — Payment settlement fully simulated

| Field | Detail |
| :--- | :--- |
| **Debt** | `processSimulatedPayment` waits 800 ms, applies a trivial validity rule to the account identifier, and synchronously returns a success result with a generated reference. No money moves. There is no gateway call, no webhook, no settlement, no reconciliation and no refund path. |
| **Where it lives** | `src/lib/simulated-payment.ts`; called from `src/app/api/payments/route.ts`. |
| **Requirements violated** | FR-5.8 (declared constraint), and by extension the commercial viability of the product |
| **Cause** | Obtaining a live merchant account requires business registration documents, KYC review and a settlement bank account — a process measured in days to weeks, and categorically impossible inside a 48-hour window. A publicly reachable webhook endpoint with signature verification is additionally required. |
| **Impact** | **For the demonstrator: none — this is the correct decision.** The simulated gate exercises the complete booking-to-confirmation state machine, produces auditable transaction records, and lets the examiner observe both the success and the decline path deterministically. **For production: total.** No revenue can be collected. |
| **Priority** | **HIGH — scheduled for future resolution.** Not Critical, because it does not endanger data or patients; it simply blocks commercialisation. |
| **Fowler quadrant** | Deliberate & Prudent — and the abstraction boundary was designed specifically to make this repayment cheap. |
| **Proposed resolution** | The interface `PaymentRequest → PaymentResult` was designed as the substitution seam and does not change. (1) Implement a `PaystackGateway` and a `HubtelMomoGateway` behind that same interface. (2) Add an asynchronous state: `PENDING_AUTHORISATION` between initiation and webhook confirmation — the one genuine model change, because real payments are not synchronous. (3) Implement a webhook endpoint with HMAC-SHA256 signature verification and replay protection. (4) Implement reconciliation against the provider's settlement report. (5) Implement the refund path required by FR-5.8's future scope. (6) Retain the simulator as the test double, selected by configuration, so the automated test suite never touches a real gateway. |
| **Effort to repay** | 40 person-hours |
| **Repayment milestone** | v2.0 — Production Readiness (Months 2–3) |

---

## TD-07 — No patient-initiated reschedule or cancellation

| Field | Detail |
| :--- | :--- |
| **Debt** | An appointment, once confirmed, cannot be moved or cancelled by the patient. The status field supports `CANCELLED` and the detail endpoint supports `PATCH`, but no interface path or cut-off policy exists. |
| **Where it lives** | `src/app/api/appointments/[id]/route.ts`; patient views under `src/app/patient/**`. |
| **Requirements violated** | FR-3.9, FR-3.10 |
| **Cause** | Prioritisation. The booking path is what demonstrates the triage-to-consultation value chain; the amendment path does not add assessable engineering substance proportional to its cost, which includes a cut-off policy, a refund interaction with TD-11, slot release, and re-notification of both parties. |
| **Impact** | Patients must contact the clinic by other means to change an appointment, reintroducing exactly the manual coordination loop the product exists to remove. Slots held by patients who will not attend are not released, depressing utilisation. |
| **Priority** | **MEDIUM — scheduled for future resolution.** |
| **Fowler quadrant** | Deliberate & Prudent. |
| **Proposed resolution** | Add a configurable cut-off (default 24 hours). Implement cancel and reschedule as explicit state transitions that release the slot, write an audit entry, notify both parties, and — once TD-11 lands — trigger the refund policy. Add doctor-side block/release for clinical emergencies. |
| **Effort to repay** | 14 person-hours |
| **Repayment milestone** | v1.3 — Experience & Access (Month 2) |

---

## TD-09 — No accessibility audit; WCAG 2.1 AA unverified

| Field | Detail |
| :--- | :--- |
| **Debt** | Accessibility was addressed by convention only: semantic elements, text labels alongside colour coding, and `aria-hidden` on decorative icons. No automated audit, no screen-reader pass, no keyboard-only traversal and no contrast measurement were performed. |
| **Where it lives** | The whole interface, `src/app/**` and `src/components/**`. |
| **Requirements violated** | NFR-17, UI-7 |
| **Cause** | Testing time in Phase 4 was allocated to functional correctness and the security review. An accessibility audit is a multi-hour activity requiring assistive-technology testing. |
| **Impact** | A healthcare product that cannot be operated by users with visual, motor or cognitive impairment excludes exactly the population most likely to need it, and in many jurisdictions creates legal exposure. The pain-intensity slider and the emergency banner are the highest-risk components: the slider is a custom control that may not be keyboard-operable, and the emergency banner conveys the single most safety-critical message in the system. |
| **Priority** | **MEDIUM — scheduled for future resolution.** Escalates to HIGH before any public launch. |
| **Fowler quadrant** | Inadvertent & Prudent. |
| **Proposed resolution** | (1) Run `axe-core` in CI and fail the build on serious or critical violations. (2) Manual keyboard-only traversal of the three primary journeys. (3) Screen-reader verification (NVDA and VoiceOver) of the triage wizard, with the emergency banner given an `aria-live="assertive"` region. (4) Replace the custom slider with a native `input[type=range]` carrying a proper accessible label. (5) Measure and correct contrast in both light and dark modes. |
| **Effort to repay** | 16 person-hours |
| **Repayment milestone** | v1.3 — Experience & Access (Month 2) |

---

## TD-10 — Consultation room has local media preview only, no peer connection

| Field | Detail |
| :--- | :--- |
| **Debt** | The consultation room requests camera and microphone permission and renders the local stream, giving the appearance of a live call. There is no `RTCPeerConnection`, no signalling channel, no ICE negotiation and no relay. The two participants cannot actually see or hear each other. |
| **Where it lives** | `src/components/video/telehealth-video-room.tsx`, `src/app/room/[appointmentId]/page.tsx` |
| **Requirements violated** | FR-7.6 (declared constraint) |
| **Cause** | Real-time media requires a signalling server, STUN for address discovery and TURN relay for the substantial fraction of users behind symmetric NAT — infrastructure that cannot be provisioned and tested inside the window. The room shell was built because it demonstrates the appointment-to-consultation transition and the notes capture, both of which are genuine. |
| **Impact** | The consultation itself must happen out of band (telephone or an external link). Because the interface *looks* like a working call, there is a real risk a user believes the call is connected when it is not — the most user-visible honesty risk in the product. This is why the limitation is stated in the User Manual as well as here. |
| **Priority** | **MEDIUM — scheduled for future resolution.** The *labelling* fix is immediate; the *capability* fix is v2.0. |
| **Fowler quadrant** | Deliberate & Prudent. |
| **Proposed resolution** | **Immediately (v1.1, 1 hour):** label the room unambiguously as a preview so no user can mistake it for a connected call. **v2.0:** integrate a managed real-time provider (Daily.co, LiveKit or Twilio Video) rather than hand-rolling signalling and TURN — a managed provider removes the entire infrastructure burden and brings recording, bandwidth adaptation and connection diagnostics with it. Add explicit consent capture before any session recording. |
| **Effort to repay** | 36 person-hours |
| **Repayment milestone** | v2.0 — Production Readiness (Months 2–3); labelling fix in v1.1 |

---

## TD-12 — Notification delivery is in-application only

| Field | Detail |
| :--- | :--- |
| **Debt** | Notifications are rows in a table rendered in the interface. The module presents itself as a queue and includes records labelled "24-Hour Email Reminder" and "30-Minute Email Reminder", but no e-mail or SMS is ever transmitted. There is no worker, no scheduler, no retry and no delivery-status tracking. |
| **Where it lives** | `src/lib/notifications.ts`, `src/app/api/notifications/route.ts` |
| **Requirements violated** | FR-6.4 (declared constraint), FR-6.6 |
| **Cause** | Real delivery requires a paid provider account with verified sender identity, plus a scheduler for time-based reminders — neither obtainable in the window. A serverless deployment additionally has no long-running process to host a worker, so this is an architectural change and not only an integration. |
| **Impact** | Patients only learn of an appointment or a reminder if they open the application, which defeats the purpose of a reminder and will directly increase the no-show rate the AI risk-scorer is designed to predict. The record labels are also misleading in isolation, which is why they are disclosed here. |
| **Priority** | **MEDIUM — scheduled for future resolution.** |
| **Fowler quadrant** | Deliberate & Prudent. |
| **Proposed resolution** | The `enqueue / list / markRead` interface is the substitution seam. (1) Add a Redis-backed queue (BullMQ) or the platform-native queue service. (2) Add worker processes for e-mail (Resend/SendGrid) and SMS (Twilio, or Hubtel for the Ghanaian market). (3) Add exponential-backoff retry with a dead-letter queue, satisfying FR-6.6. (4) Add a scheduler for the 24-hour and 30-minute reminders. (5) Track per-notification delivery status and expose retry to the administrator. (6) Honour user notification preferences and unsubscribe. |
| **Effort to repay** | 20 person-hours |
| **Repayment milestone** | v2.0 — Production Readiness (Months 2–3) |

---

## TD-14 — Monetary amounts stored as floating-point

| Field | Detail |
| :--- | :--- |
| **Debt** | `consultation_fee`, `payment_amount` and `payment_logs.amount` are all declared `Float`, mapping to a binary double-precision column. Currency is being represented in a type that cannot exactly represent most decimal fractions. |
| **Where it lives** | `prisma/schema.prisma` |
| **Requirements violated** | DI-5 |
| **Cause** | `Float` is the path of least resistance in an ORM schema and works acceptably for demonstration values. The defect is latent rather than visible. |
| **Impact** | Accumulated rounding error across aggregate revenue reporting; potential one-pesewa discrepancies between the displayed total and a real gateway's settled amount once TD-11 lands. Financial reconciliation failures of this kind are notoriously expensive to diagnose after the fact, because each individual transaction appears correct. |
| **Priority** | **MEDIUM — scheduled for future resolution.** Must be repaid **before** TD-11, not after — migrating currency data once real transactions exist is far more costly than migrating synthetic data now. |
| **Fowler quadrant** | Inadvertent & Prudent. |
| **Proposed resolution** | Migrate to `Decimal(10,2)`, or store integer minor units (pesewas) with formatting confined to the presentation layer. Add a currency code column in anticipation of multi-currency. Add a property-based test asserting that a sum of stored amounts equals the exact expected total. |
| **Effort to repay** | 8 person-hours |
| **Repayment milestone** | v1.3 — Experience & Access (Month 2), scheduled ahead of TD-11 |

---

## TD-15 — No data-processing agreement or de-identification for LLM calls

| Field | Detail |
| :--- | :--- |
| **Debt** | The AI assistants transmit free-text symptom descriptions, consultation transcripts and laboratory report text to a third-party inference service. No data-processing agreement is in place, the payload is not de-identified, and no explicit consent is captured for this specific transfer. |
| **Where it lives** | `src/lib/ai/ai-services.ts`, `src/lib/ai/ollama-client.ts` |
| **Requirements violated** | DP-5, NFR-15 |
| **Cause** | The AI layer is a Could-have that was delivered opportunistically. The governance work around a cross-border PHI transfer is a legal and procurement activity, not an engineering one, and has no place inside a 48-hour build. |
| **Impact** | For the demonstrator, contained: all data is synthetic. For production, this is a cross-border transfer of health data to a processor without a contract — a direct regulatory exposure under GDPR-equivalent regimes and Ghana's Data Protection Act. |
| **Priority** | **MEDIUM — acceptable temporarily**, and only because the demonstrator processes no real patient data. Escalates to **BLOCKING** the moment a real patient record enters the system. |
| **Fowler quadrant** | Deliberate & Prudent. |
| **Proposed resolution** | (1) Execute a data-processing agreement with the inference provider, with data-residency terms. (2) Add a de-identification pass that strips direct identifiers before transmission. (3) Capture explicit, separate, revocable consent for AI-assisted features. (4) Add a configuration switch that disables all AI features for tenants who decline. (5) Evaluate a self-hosted model to remove the transfer boundary entirely. |
| **Effort to repay** | 5 person-hours engineering (plus legal/procurement lead time) |
| **Repayment milestone** | v2.0 — Production Readiness (Months 2–3) |

---

# 3. Technical Debt Repayment Plan

## 3.1 Sequencing Principles

The order below is not arbitrary; it follows four rules:

1. **Security first, without exception.** TD-01, TD-02, TD-03 and TD-13 precede every functional improvement. There is no defensible reason to add features to a system with a known authorisation bypass.
2. **Repay dependencies before dependants.** TD-01 must land before TD-08 (read auditing needs an authenticated actor). TD-12 must land before TD-05 (verification needs a real delivery channel). TD-14 must land before TD-11 (migrate currency representation while data is still synthetic).
3. **Repay together what shares an implementation.** TD-01 and TD-03 are a single piece of work; splitting them would leave the bypass open.
4. **Cheap and critical first.** TD-02 (3 h) and TD-13 (4 h) are repaid on day one purely because their cost-to-risk ratio makes any delay indefensible.

## 3.2 Release Plan

| Release | Window | Items repaid | Effort (h) | Exit criterion |
| :--- | :--- | :--- | :---: | :--- |
| **v1.1 — Security Hardening** | Week 1 | TD-02, TD-13 (day 1 hotfix); TD-01 + TD-03 (days 2–5); TD-10 relabelling | 48 | All four Critical items closed. Cross-role API probe returns 403 for every unauthorised combination. Repository secret scan clean. Independent security review sign-off. |
| **v1.2 — Clinical Governance** | Month 1 | TD-04, TD-06, TD-08, TD-05 | 60 | Triage rules editable and versioned without redeployment. Concurrency test passes. PHI read access fully audited. Account lifecycle complete. |
| **v1.3 — Experience & Access** | Month 2 | TD-07, TD-09, TD-14 | 38 | WCAG 2.1 AA verified by automated and manual audit. Reschedule/cancel live. Currency migrated to exact representation. |
| **v2.0 — Production Readiness** | Months 2–3 | TD-11, TD-12, TD-10 (remaining 35 h), TD-15 | 100 | Real payment settlement with webhook reconciliation. Real SMS/e-mail delivery with retry. Real two-way consultation media. LLM data-processing agreement executed. |
| | | **TOTAL** | **246** | |

## 3.3 Repayment Burn-Down

| Milestone | Critical open | High open | Medium open | Debt remaining (h) |
| :--- | :---: | :---: | :---: | :---: |
| At v1.0 release (now) | 4 | 5 | 6 | 246 |
| After v1.1 | 0 | 5 | 6 | 198 |
| After v1.2 | 0 | 1 | 6 | 138 |
| After v1.3 | 0 | 1 | 3 | 100 |
| After v2.0 | 0 | 0 | 0 | 0 |

## 3.4 Debt Prevention Controls

Repaying debt without changing the process that produced it merely resets the clock. The following controls are introduced alongside the repayment work:

| Control | Prevents | Introduced at |
| :--- | :--- | :--- |
| Pre-commit secret scanning (`gitleaks`) | Recurrence of TD-02 | v1.1 |
| Role × endpoint authorisation test matrix in CI | Recurrence of TD-01 | v1.1 |
| Lint rule forbidding raw error text in HTTP responses | Recurrence of TD-13 | v1.1 |
| `axe-core` accessibility gate in CI | Recurrence of TD-09 | v1.3 |
| Mandatory debt entry in every pull-request template | Undocumented debt accrual | v1.1 |
| Debt register reviewed at each release planning session; any item aged beyond two releases is escalated | Silent debt ageing | v1.2 |
| Test coverage threshold enforced in CI, raised one release at a time | Coverage erosion | v1.2 |

## 3.5 Monitoring the Debt Position

The register is a live artefact, not a submission document. Each item carries an identifier that is quoted in the source at the point where the debt lives, so that a developer encountering the code is led to the entry rather than rediscovering the problem. Three of the modules (`simulated-payment.ts`, `notifications.ts`) already carry such an annotation in their file header; extending this convention to all fifteen items is part of the v1.1 work.

The measure that matters is not the number of open items but **the ratio of remediation effort to delivered functional size**. At v1.0 that ratio is 246 hours of debt against a functional size of 106.31 Use Case Points, or roughly **2.3 debt-hours per Use Case Point**. This figure is recomputed at each release and is the single number reported to stakeholders.

---

# 4. Reflection: What This Register Demonstrates

The examination brief asks for technical debt to be identified, prioritised and managed. Three things in this register are worth stating explicitly.

**First, the debt was priced before it was incurred, not after.** The decision to simulate the payment gate was made at hour 6 with the 40-hour repayment cost already understood. That is the difference between managing debt and accumulating it.

**Second, the abstraction boundaries were chosen to make repayment cheap.** The payment gate, the notification queue and the rule engine each sit behind an interface that the rest of the system depends on. Replacing a simulator with a real implementation is therefore a substitution of one implementation for another — 40 hours — rather than an excavation through the call sites of the entire application, which would be several times that. Choosing where to place a seam is the highest-leverage decision available when incurring deliberate debt.

**Third, the register discloses items that reflect badly on the work.** TD-02 is a committed secret with no engineering justification whatsoever. TD-01 means the role separation the system advertises is, at the API level, not real. Recording these accurately is more useful than a register that lists only the flattering, obviously-deliberate simplifications — and a debt register that contains no uncomfortable entries is almost always an incomplete one.

---

*End of Technical Debt Identification & Management Plan.*
