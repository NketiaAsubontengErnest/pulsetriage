---
title: "Technical Debt Identification and Management Plan"
subtitle: "PulseTriage — Telehealth Appointment & Urgency Auto-Triage System"
author: "Ernest Nketia Asubonteng (22424715)"
date: "CSCD 602 Advanced Software Engineering · University of Ghana"
lang: en-GB
---

# TECHNICAL DEBT IDENTIFICATION AND MANAGEMENT PLAN

| Field | Detail |
|---|---|
| Student | Ernest Nketia Asubonteng — 22424715 |
| Course | CSCD 602 Advanced Software Engineering |
| Examiner | Prof. Solomon Mensah |
| Scope | Technical debt only. Requirements are in `SRS.docx`; test evidence in `Testing_Report.docx` |

---

# 1. Executive Summary

Technical debt here is used in Cunningham's original sense: a deliberate
trade-off taken to ship sooner, carrying interest that must eventually be paid.
Not every shortcoming is debt. A missing feature that was never in scope is not
debt — it is scope. Debt is what was *taken on knowingly* to meet the deadline,
plus what was discovered afterwards and left in place.

The effort estimate in `Project_Documentation.docx` §7 established that the full
specification was roughly fifty times larger than the 48-hour budget. That gap
had to be absorbed somewhere. It was absorbed here: this register is the priced
remainder of that estimate.

## 1.1 Classification Scheme

| Class | Definition | Action |
|---|---|---|
| **Critical** | Blocks deployment with real patient data, or risks harm | Must be repaid before any production use |
| **Scheduled** | Accepted for the demonstrator; a real gap with a named release | Dated resolution in §3 |
| **Acceptable** | Proportionate to the current scope; only becomes a problem if scope grows | Monitor; revisit at the quarterly review |

## 1.2 Register at a Glance

| ID | Debt | Class | Priority |
|---|---|---|---|
| TD-01 | Authorisation enforced on only part of the API surface | Critical | P1 |
| TD-02 | Credentials remain in Git history | Critical | P1 |
| TD-03 | Unsigned session copy retained in browser local storage | Critical | P1 |
| TD-21 | Session signing key has a published fallback value | Critical | P1 |
| TD-04 | Administrator rule edits are session-scoped, not persisted | Scheduled | P2 |
| TD-05 | No e-mail verification and no password reset | Scheduled | P2 |
| TD-08 | Read access to patient data is not comprehensively audited | Scheduled | P2 |
| TD-11 | Payment settlement is fully simulated | Scheduled | P2 |
| TD-12 | Notification delivery is in-application only | Scheduled | P2 |
| TD-13 | Internal error detail reaches the client on some paths | Scheduled | P2 |
| TD-14 | Monetary amounts stored as floating point | Scheduled | P2 |
| TD-15 | No data-processing agreement covering inference calls | Scheduled | P2 |
| TD-17 | No rate limiting on authentication or inference endpoints | Scheduled | P2 |
| TD-09 | No accessibility audit with assistive technology | Acceptable | P3 |
| TD-16 | Unused Tailwind dependency and configuration | Acceptable | P3 |
| TD-18 | No caching layer on read-heavy public endpoints | Acceptable | P3 |
| TD-19 | No idempotency keys on payment and booking writes | Acceptable | P3 |
| TD-20 | No automated end-to-end browser tests | Acceptable | P3 |

**Totals:** 4 critical, 9 scheduled, 5 acceptable.

## 1.3 Debt Closed During the Examination Period

Four items from the original register were repaid before submission and are
recorded here so the register reflects reality rather than history.

| ID | Debt | How it was closed |
|---|---|---|
| ~~TD-06~~ | Double-booking possible | Unique constraint on `(doctor_id, slot_key)` plus a transactional re-check. Verified: eight concurrent attempts on one slot produced exactly one appointment |
| ~~TD-07~~ | No patient-initiated reschedule or cancellation | Both implemented; rescheduling re-checks availability |
| ~~TD-10~~ | Consultation room had local preview only | Full two-way WebRTC media, signalled through the database |
| ~~TD-02a~~ | Literal API key in source | Removed from the working tree; environment variables only; secret scanner and pre-commit hook added. The Git-history half remains open as TD-02 |

---

# 2. Debt Register

Each item is recorded as **Debt → Cause → Impact → Priority → Proposed
Resolution**.

## Critical — Requires Immediate Attention

### TD-01 — Authorisation enforced on only part of the API surface

| | |
|---|---|
| **Debt** | A session layer now exists — HMAC-SHA256 signed tokens, HTTP-only cookie, seven-day expiry, and a `requireAuth(req, roles)` guard returning 401/403. **It is applied to 7 of 28 route handlers.** The remaining 21 still accept a caller-supplied identifier and act on it without verifying who is asking |
| **Cause** | The session layer was estimated at 4–6 hours and initially deferred in favour of the safety-critical triage work. It was subsequently built, but retrofitting the guard across every existing handler is a separate pass that is still in progress |
| **Impact** | **Severe while incomplete.** Unguarded routes include appointments (POST), profile, notifications, triage, the consultation room and every AI endpoint. A caller who can reach those can read or modify another user's records, including health data. OWASP A01:2021 Broken Access Control |
| **Priority** | **P1 — blocks any deployment holding real data** |
| **Resolution** | Apply `requireAuth` to the remaining 21 handlers and enforce record ownership, not merely authentication — a signed-in patient must not be able to read another patient's appointment by changing an identifier. Prefer a single middleware that denies by default, so a newly added route is protected unless explicitly opened. Estimated 5–6 hours |

Stated plainly: the mechanism is now correct; its coverage is not. Until the
remaining handlers are guarded, the deployment notice against entering real
personal or medical data stands.

> **Note on currency.** Route protection was being extended while this document
> was written. The figure above (7 of 28) was measured on the working tree at
> the time of submission and should be re-measured with:
> `grep -rl "requireAuth\|getSessionUser" src/app/api | wc -l`

### TD-02 — Credentials remain in Git history

| | |
|---|---|
| **Debt** | An inference API key was committed early in the project. It has been removed from the working tree, but remains retrievable from earlier commits |
| **Cause** | A convenience fallback added during initial development so the AI features worked without configuration, committed before its significance was considered |
| **Impact** | **High.** Anyone who clones the repository can recover the key from history and consume the associated quota |
| **Priority** | **P1** |
| **Resolution** | Rotate the key at the provider first — this alone neutralises the exposure. Then rewrite history with `git filter-repo` and force-push. Rotation is 10 minutes; the history purge is about an hour and requires coordination with anyone holding a clone |

**Preventive control already in place.** `npm run scan:secrets` scans the full
tree and is wired into a pre-commit hook, so a recurrence requires deliberate
override. The scan currently reports clean.

### TD-03 — Unsigned session copy retained in browser local storage

| | |
|---|---|
| **Debt** | Session state is now carried by a signed HTTP-only cookie, but an unsigned copy of the user profile is still mirrored into `localStorage` and is trusted to restore the session when `/api/auth/me` cannot be reached |
| **Cause** | The `localStorage` copy predates the cookie and was retained as an offline fallback rather than removed when the token layer landed |
| **Impact** | **Medium — reduced from High.** Editing the stored copy now yields only a misleading interface: any guarded route rejects the forged identity, because the server trusts the cookie rather than the client's claim. The residual risk is that unguarded routes (TD-01) still act on client-supplied identifiers |
| **Priority** | **P1 — closes with TD-01** |
| **Resolution** | Remove the `localStorage` fallback and treat `/api/auth/me` as the sole source of session truth; show a signed-out state if it cannot be reached. Add `SameSite=Strict` and shorten the seven-day expiry with a refresh. Estimated 2 hours |

### TD-21 — Session signing key has a published fallback value

| | |
|---|---|
| **Debt** | `JWT_SECRET` falls back to a string literal held in the repository when the environment variable is unset. Session tokens are signed with that key |
| **Cause** | A convenience default so a fresh clone runs without configuration — the same pattern that produced TD-02 |
| **Impact** | **Severe if it reaches a deployment.** Anyone with the repository can forge a valid session token for any user and any role, which defeats the session layer entirely and would also defeat the TD-01 remediation built on top of it |
| **Priority** | **P1** |
| **Resolution** | Set `JWT_SECRET` in every deployed environment and verify it is present. Then remove the fallback and fail closed at start-up rather than signing with a known key. A start-up warning is already emitted when the fallback is in use under `NODE_ENV=production`; that is a detection aid, not a fix. Estimated 1 hour |

This item was found while documenting the session layer, not during
implementation. It is recorded here rather than quietly patched because the
class of fault — a convenient default that becomes a production secret — has now
occurred twice in this project, and that pattern is worth naming.

## Scheduled for Resolution

### TD-04 — Administrator rule edits are session-scoped

| | |
|---|---|
| **Debt** | The administrator's rule configurator edits an in-memory copy. Changes are lost on reload and never reach the patient-facing engine |
| **Cause** | Persisting rules requires a schema table, migration, an editing API and cache invalidation — roughly a day. The rule *engine* reading rules as data was the requirement (FR-2.3); the editor was a Should |
| **Impact** | **Medium.** The screen implies a capability the system does not have. Misleading rather than dangerous, since patient-facing behaviour is unaffected |
| **Priority** | **P2** |
| **Resolution** | Add a `triage_rules` table, seed it from the current constants, and read through it. Label the screen read-only until then. Estimated 8 hours |

### TD-05 — No e-mail verification and no password reset

| | |
|---|---|
| **Debt** | E-mail addresses are unverified, and a user who forgets their password cannot recover the account |
| **Cause** | Both need an e-mail gateway, deliberately excluded from scope (see TD-12) |
| **Impact** | **Medium.** Accounts can be registered against addresses the registrant does not control; lockout is permanent |
| **Priority** | **P2** |
| **Resolution** | Deliver with the e-mail work in v1.2: verification token on registration, time-limited single-use reset link. Estimated 6 hours once a gateway exists |

### TD-08 — Read access to patient data is not comprehensively audited

| | |
|---|---|
| **Debt** | Writes are audited thoroughly. Reads of patient data — a clinician opening an intake record — are not consistently recorded |
| **Cause** | Write auditing was implemented first as the higher-value case; read auditing was not reached |
| **Impact** | **Medium.** A governance review can establish what changed, but not who looked. Inappropriate access would leave no trace |
| **Priority** | **P2** |
| **Resolution** | Add an audit write to every PHI read path, with a retention policy so the table does not grow without bound. Estimated 4 hours |

### TD-11 — Payment settlement is fully simulated

| | |
|---|---|
| **Debt** | Checkout produces realistic references and status transitions without contacting any provider |
| **Cause** | A deliberate scope decision recorded in `Project_Documentation.docx` §7.5. No merchant account was available, and integration — onboarding, credentials, webhooks, reconciliation — dominates the logic |
| **Impact** | **Low as a demonstrator, total as a product.** No money moves. The interface states this |
| **Priority** | **P2** |
| **Resolution** | Implement a real provider behind the existing payment interface, which was shaped for the substitution. Add webhook handling and reconciliation. Estimated 16 hours plus merchant onboarding |

### TD-12 — Notification delivery is in-application only

| | |
|---|---|
| **Debt** | Notifications are rows shown in the application. No e-mail or SMS is sent. Appointment reminders are written at booking time rather than dispatched at the reminder time |
| **Cause** | No gateway, and no scheduler in a serverless model without additional infrastructure |
| **Impact** | **Medium.** A patient who does not open the application receives no reminder — which is precisely when a reminder matters |
| **Priority** | **P2** |
| **Resolution** | Add a transactional e-mail provider and an SMS gateway; move dispatch to a scheduled job so reminders fire at the right time. Estimated 12 hours |

### TD-13 — Internal error detail reaches the client on some paths

| | |
|---|---|
| **Debt** | Several handlers return the caught error's message directly in the response body |
| **Cause** | Convenience during development, when seeing the real error in the browser was worth the exposure |
| **Impact** | **Medium.** Leaks internal structure that assists an attacker. OWASP A05:2021 |
| **Priority** | **P2** |
| **Resolution** | Return a correlation identifier and a generic message; log the detail server-side. Estimated 3 hours |

### TD-14 — Monetary amounts stored as floating point

| | |
|---|---|
| **Debt** | Fees and payment amounts use `Float` |
| **Cause** | The default numeric type; chosen without deliberation early on |
| **Impact** | **Medium, latent.** Binary floating point cannot represent decimal currency exactly. Harmless at demonstration volume; produces reconciliation discrepancies at scale |
| **Priority** | **P2 — cheap now, expensive after real transactions exist** |
| **Resolution** | Migrate to `Decimal(10,2)`, or store minor units as integers. Estimated 3 hours now; considerably more once live data must be migrated |

### TD-15 — No data-processing agreement covering inference calls

| | |
|---|---|
| **Debt** | Consultation context is sent to a third-party inference provider with no data-processing agreement and no de-identification |
| **Cause** | Not considered until the AI features were already working |
| **Impact** | **High in a real deployment.** Sending identifiable health data to a third party without a lawful basis would breach the Data Protection Act. Currently mitigated only because the data is synthetic |
| **Priority** | **P2 now; P1 the moment real data exists** |
| **Resolution** | Execute a processing agreement, or self-host the model. De-identify context before transmission. Add explicit patient consent for AI-assisted documentation. Estimated 6 hours plus legal time |

### TD-17 — No rate limiting on authentication or inference endpoints

| | |
|---|---|
| **Debt** | Sign-in, registration and the AI routes accept unlimited requests from any source |
| **Cause** | Not reached within the window; would require either in-process state or a shared store |
| **Impact** | **Medium.** Sign-in is open to unthrottled credential guessing. The AI routes are unauthenticated *and* incur real inference cost per call, so a third party can spend the project's quota |
| **Priority** | **P2** |
| **Resolution** | Add a fixed-window limiter keyed by address and account for authentication, and a tighter per-user limit on inference. In-process is sufficient for a single instance; a shared store is needed once horizontally scaled. Estimated 4 hours |

## Acceptable Temporarily

### TD-09 — No accessibility audit with assistive technology

| | |
|---|---|
| **Debt** | WCAG 2.1 AA was designed for and contrast was measured, but no audit with a screen reader or keyboard-only navigation has been performed |
| **Cause** | No time and no access to assistive technology within the window |
| **Impact** | **Medium.** Contrast is verified across all colour pairs; semantics, focus order and announcements are unverified. Conformance cannot be claimed |
| **Priority** | **P3** |
| **Resolution** | Automated axe pass, then manual testing with NVDA and VoiceOver, then remediation. Estimated 8 hours |

### TD-16 — Unused Tailwind dependency and configuration

| | |
|---|---|
| **Debt** | `tailwindcss` is installed and `tailwind.config.ts` exists, but the stylesheet contains no `@tailwind` directive. The interface is Bootstrap plus hand-written CSS |
| **Cause** | A stack decision reversed early in the project; the dependency was never removed |
| **Impact** | **Low.** Misleads a reader about the styling approach and carries needless install weight. It is why the deployment notes explicitly correct the record |
| **Priority** | **P3** |
| **Resolution** | Remove the dependency, the config file and the PostCSS entry. Estimated 30 minutes |

### TD-18 — No caching on read-heavy public endpoints

| | |
|---|---|
| **Debt** | The clinician directory, specialisation list and public statistics are recomputed on every request |
| **Cause** | Not required at current volume |
| **Impact** | **Low now.** Unnecessary database load; would become material under traffic |
| **Priority** | **P3** |
| **Resolution** | Add time-based revalidation to the three public read endpoints. Estimated 2 hours |

### TD-19 — No idempotency keys on payment and booking writes

| | |
|---|---|
| **Debt** | A retried or double-submitted payment request can write two payment rows |
| **Cause** | Not reached. Partially mitigated for booking by the `slot_key` constraint, which rejects the duplicate appointment |
| **Impact** | **Low now, higher once payments are real.** Duplicate payment records complicate reconciliation |
| **Priority** | **P3 now; P2 alongside TD-11** |
| **Resolution** | Accept a client-supplied idempotency key on write endpoints; store and replay the first response. Estimated 4 hours |

### TD-20 — No automated end-to-end browser tests

| | |
|---|---|
| **Debt** | Unit and integration testing are automated. System and acceptance testing were performed manually |
| **Cause** | Setting up a browser automation harness competed with writing the features it would test |
| **Impact** | **Medium as the system grows.** Manual regression does not scale, and the safety-critical journey is exactly the one that must never silently break |
| **Priority** | **P3** |
| **Resolution** | Add Playwright covering the three role journeys, with the red-flag path first. Run in continuous integration. Estimated 10 hours |

---

# 3. Repayment Plan

## 3.1 Sequencing Principles

1. **Harm first.** Anything that could injure a patient or expose their data
   outranks everything else.
2. **Cheap-now-expensive-later next.** TD-14 costs three hours today and a data
   migration after go-live. Deferring it is the worst value in the register.
3. **Repay in coherent groups.** TD-01 and TD-03 are one piece of work. TD-05 and
   TD-12 both wait on an e-mail gateway.
4. **Preventive controls before repayment.** The secret scanner was added before
   TD-02 was fully repaid, so the class of fault cannot recur while the instance
   is outstanding.

## 3.2 Release Schedule

| Release | Theme | Items | Effort |
|---|---|---|---|
| **v1.1** | Safe to hold real data | TD-01, TD-02, TD-03, TD-13, TD-17, TD-21 | ≈ 22 h |
| **v1.2** | Operationally real | TD-04, TD-05, TD-11, TD-12, TD-19 | ≈ 46 h |
| **v1.3** | Defensible | TD-08, TD-09, TD-14, TD-15, TD-20 | ≈ 31 h |
| **v2.0** | Scale | TD-16, TD-18, plus scalability work in `Project_Documentation.docx` §16 | ≈ 5 h |

**Total outstanding: approximately 104 person-hours** — more than twice the
original 48-hour build. That ratio is the honest cost of the delivery schedule,
and it is why the estimate in `Project_Documentation.docx` §7 is reported as a
shortfall rather than a target that was met.

## 3.3 Exit Criterion for Real Data

The system must not process real patient data until **all four critical items
are closed and independently verified**. Specifically:

- TD-01 — every API route rejects an unauthenticated caller, and ownership is
  enforced on every record access;
- TD-02 — the exposed inference key is rotated and history is purged;
- TD-03 — the unsigned client-side session copy is removed;
- TD-21 — `JWT_SECRET` is set from the environment in every deployment and the
  published fallback is deleted from source.

Verification is the security probe suite passing 9 of 9 rather than the current
4 of 9. Until then the deployment carries its notice, and that notice is a
control, not a disclaimer.

---

*End of Technical Debt Identification and Management Plan.*
