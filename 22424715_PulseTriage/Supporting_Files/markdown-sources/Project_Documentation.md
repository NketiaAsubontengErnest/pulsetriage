---
title: "Consolidated Project Documentation"
subtitle: "PulseTriage — Telehealth Appointment & Urgency Auto-Triage System"
author: "Ernest Nketia Asubonteng (Index No. 22424715)"
date: "12 August 2026"
---

# CONSOLIDATED PROJECT DOCUMENTATION

## PulseTriage — Telehealth Appointment & Urgency Auto-Triage System

| | |
| :--- | :--- |
| **University** | University of Ghana |
| **Department** | Department of Computer Science |
| **Programme** | MPhil/MSc Computer Science & MPhil/MSc Data Science |
| **Course** | CSCD 602 — Advanced Software Engineering (3 Credits) |
| **Assessment** | Individual Project-Based Examination, First Semester 2025/2026 |
| **Candidate** | **Ernest Nketia Asubonteng** |
| **Index Number** | **22424715** |
| **Examiner** | Prof. Solomon Mensah |
| **Submission date** | 12 August 2026 |
| **Live application** | <https://pulsetriage.vercel.app> |
| **Source repository** | <https://github.com/NketiaAsubontengErnest/pulsetriage> |

---

## Companion Documents

This consolidated document is self-contained, but four companion documents contain the full detail of their respective areas and are submitted alongside it:

| Document | Contents |
| :--- | :--- |
| `SRS.docx` | Complete IEEE 830-1998 Software Requirements Specification — 61 identified requirements with priorities, verification status and a full traceability matrix. |
| `Testing_Report.docx` | 68 test cases, executed results, performance measurements, security probe evidence and the defect log. |
| `Technical_Debt_Plan.docx` | The 15-item technical debt register with the Debt → Cause → Impact → Priority → Resolution analysis and a costed repayment roadmap. |
| `User_Manual.docx` | End-user operating instructions for all three roles. |

---

## Table of Contents

1. Project Title
2. Problem Statement
3. Aim and Objectives
4. Stakeholders
5. Requirements Analysis
6. Software Requirements Specification (Summary)
7. Software Effort Estimation
8. System Analysis
9. System Design
10. Implementation
11. Testing
12. Technical Debt
13. Deployment
14. User Manual (Summary)
15. Maintenance Strategy
16. Future Evolution
17. Limitations
18. Conclusion
19. References

---

# 1. Project Title

**PulseTriage — A Telehealth Appointment and Symptom-Based Urgency Auto-Triage System**

A web-based platform that replaces first-come-first-served outpatient scheduling with clinically-ordered scheduling, by automatically classifying patient-reported symptoms into urgency tiers and routing each patient to an appropriately qualified clinician within a timeframe matched to that urgency.

---

# 2. Problem Statement

## 2.1 The Problem

In outpatient and telehealth settings across Ghana and comparable health systems, appointment scheduling is predominantly manual — a telephone call, a paper ledger or a spreadsheet — and it is ordered by **when the patient called**, not by **how sick the patient is**.

This produces four specific, observable failures:

**First, urgency is invisible at the point of scheduling.** The receptionist taking the booking is not clinically trained and has no instrument for distinguishing a patient describing crushing chest pain radiating to the jaw from a patient requesting a medical certificate. Both are entered into the next available slot. The clinical consequence of getting this wrong is not an inconvenience; for time-critical presentations such as myocardial infarction and stroke, outcome is a direct function of time to treatment.

**Second, genuine emergencies enter the wrong pathway entirely.** A patient with stroke symptoms who books a telehealth appointment for next Tuesday has not been triaged — they have been delayed. The booking system itself becomes an obstacle to correct care, because it silently absorbs a patient who should have been redirected to emergency services within minutes.

**Third, patients are routinely routed to the wrong specialty.** Without symptom-to-specialty guidance, patients self-select a clinician, or are assigned to whoever is free. The result is a consultation that ends in a referral — one appointment consumed, no clinical progress made, and the patient re-entering the queue at the back.

**Fourth, the clinician arrives at the consultation with no prior context.** The first several minutes of every appointment are spent establishing what the patient's problem actually is, information the patient already gave the receptionist and which was not captured in any structured form.

## 2.2 Why Software Is the Right Response

Triage is fundamentally a **classification problem over structured inputs against clinical rules** — precisely the class of problem that deterministic software solves reliably, consistently and instantly, and that humans under time pressure solve inconsistently. The objective is not to replace clinical judgement. It is to ensure that by the time clinical judgement is applied, it is applied to the right patient, at the right time, by the right specialist, with the relevant information already in hand.

## 2.3 Scope Boundary

PulseTriage explicitly addresses **non-emergency outpatient triage and scheduling**. It is a decision-support instrument, not a diagnostic one. Where it detects an indicator of a genuine emergency, its correct behaviour is to **stop and redirect**, not to schedule. This boundary is enforced in code: an emergency classification suppresses the booking flow entirely rather than merely warning about it.

---

# 3. Aim and Objectives

## 3.1 Aim

> To design, build, test, deploy and document a functional web-based telehealth platform that automatically classifies patient-reported symptoms into clinical urgency tiers and schedules consultations in order of clinical need rather than order of arrival — demonstrating disciplined Advanced Software Engineering practice across the complete lifecycle under a 48-hour constraint.

## 3.2 Objectives

| # | Objective | Achieved | Evidence |
| :--- | :--- | :---: | :--- |
| **O1** | Elicit, analyse, document and prioritise a complete requirement set before writing any implementation code. | Yes | `SRS.docx` — 61 requirements, MoSCoW prioritised, scope frozen at hour 6 |
| **O2** | Produce a defensible effort estimate using a recognised technique, and use it to make an explicit, recorded scope decision. | Yes | §7 — Use Case Points, cross-checked with COCOMO II |
| **O3** | Build a deterministic, rules-as-data triage engine that scores 0–100, classifies into four tiers, and short-circuits on safety red flags. | Yes | `src/lib/triage-engine.ts`; 12 dedicated unit tests |
| **O4** | Implement role-based portals for Patient, Doctor and Administrator over a persistent relational datastore. | Yes | 3 portals, 9 entities, 18 API endpoints |
| **O5** | Implement booking with an abstracted, deterministic simulated payment gate and a notification queue. | Yes | `simulated-payment.ts`, `notifications.ts` |
| **O6** | Test at unit, integration, system, security, performance and acceptance levels, and report failures as honestly as passes. | Yes | `Testing_Report.docx` — 68 cases, 7 defects raised including 3 Critical |
| **O7** | Identify, price, prioritise and schedule technical debt at the moment it is incurred, not retrospectively. | Yes | `Technical_Debt_Plan.docx` — 15 items, 246 person-hours costed |
| **O8** | Deploy publicly with a managed cloud database and verify the live deployment. | Yes | <https://pulsetriage.vercel.app> — verified live |
| **O9** | Produce a maintenance strategy and a costed 12-month evolution roadmap. | Yes | §15 and §16 |

---

# 4. Stakeholders

## 4.1 Stakeholder Register

| Stakeholder | Type | Interest | Influence | Key requirement | Engagement |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Patient** | Primary user | Fast access to the right clinician; not to be harmed by a mis-triage | High | Correct urgency classification; a booking journey completable without help | Requirements source; UAT participant |
| **Doctor / Clinician** | Primary user | A queue ordered by clinical need; context before the consultation begins | High | Urgency-ordered queue; triage summary attached to each appointment | Requirements source; UAT participant |
| **Administrator** | Primary user | System integrity; verified practitioners; a defensible audit trail | High | Licence verification; immutable audit log; rule governance | Requirements source |
| **Clinical Advisor** | Governance | That rule content is clinically safe | **Decisive** | Rules must be reviewable and versioned as data, not buried in code | **Not yet engaged — see §17** |
| **Clinic Owner / Operator** | Commercial | Utilisation, revenue, reduced no-shows | Medium | Payment capture; no-show risk prediction | Indirect |
| **Data Protection Authority** | Regulatory | Lawful processing of health data | High | Access control, audit trail, lawful transfer basis | Requirements source (via legislation) |
| **Payment Provider** | External | Settlement integrity | Low (v1.0) | A stable integration interface | Deferred to v2.0 |
| **Developer / Maintainer** | Delivery | A codebase that can be safely changed | Medium | Type safety; clear seams; a documented debt register | Author |
| **Examiner** | Assessment | Evidence of disciplined lifecycle practice | **Decisive** | Complete, verifiable, honest documentation | This submission |

## 4.2 Stakeholder Analysis

Two stakeholders deserve particular comment.

**The Clinical Advisor is the highest-influence stakeholder who has not been engaged.** This is a genuine gap and it is stated rather than glossed. The rule *mechanism* has been engineered to a professional standard: rules are declarative data records with thresholds, priority weights and active flags, and they can be inspected and simulated. The rule *content* — the specific numeric thresholds separating `URGENT` from `SEMI_URGENT` — is engineering placeholder and carries no clinical authority. The architecture was deliberately shaped so that a clinician can later change content without a developer, which is the correct way to prepare for a stakeholder you cannot engage inside the delivery window.

**The Patient is the stakeholder with the least power and the most at risk.** Every other stakeholder can detect and complain about a system error. A patient who is told their symptoms are `ROUTINE` has no independent way to know that the classification was wrong. This asymmetry drove three specific design decisions: the emergency short-circuit suppresses booking rather than merely warning; the disclaimer stating the system is decision support rather than diagnosis is displayed prominently; and the triage engine is deterministic and pure, so that any classification can be reproduced exactly and audited after the fact. An AI-only triage path was explicitly rejected for this reason.

---

# 5. Requirements Analysis

## 5.1 Elicitation Approach

With no access to a live clinical site inside the examination window, requirements were elicited by four complementary techniques, each chosen for what it could contribute in the absence of direct stakeholder interviews:

| Technique | Applied to | What it yielded |
| :--- | :--- | :--- |
| **Domain analysis of published triage practice** | Manchester Triage System and comparable emergency-triage instruments | The four-tier urgency structure and the principle that a red flag dominates a numeric score |
| **Process modelling of the current state** | The existing manual scheduling workflow | The four failure modes in §2.1, each of which became a functional requirement |
| **Analogous-system analysis** | Existing telehealth and appointment products | The role structure, the notification event set, and the payment-at-confirmation pattern |
| **Regulatory and standards analysis** | Data-protection legislation, OWASP Top 10, IEEE 830 | The audit, access-control and PHI-handling requirements |

## 5.2 From Problem to Requirement

Each observed failure was traced to the requirements that address it, so that no requirement exists without a problem behind it:

| Observed failure (§2.1) | Requirement response |
| :--- | :--- |
| Urgency invisible at scheduling | FR-2.1–FR-2.5 (structured intake, scoring, banding), FR-4.2 (urgency-ordered queue) |
| Emergencies enter the booking pathway | FR-2.6 (red-flag short-circuit with **booking suppression**) |
| Patients routed to the wrong specialty | FR-2.7 (specialty recommendation), FR-3.2 (specialty filtering) |
| Clinician has no prior context | FR-2.9 (assessment persisted), FR-3.6 (appointment linked to assessment), FR-4.2 (triage summary in the queue) |
| Manual coordination overhead | FR-3.3–FR-3.5 (self-service booking), FR-6.1 (automated notification) |
| Untraceable decisions | FR-8.1–FR-8.2 (immutable audit trail) |

## 5.3 Requirement Prioritisation (MoSCoW)

Prioritisation was performed **before** implementation and was the mechanism by which the effort estimate in §7 was converted into a scope decision.

| Priority | Definition applied | Count | Delivered |
| :--- | :--- | :---: | :---: |
| **Must have** | Without it the system does not solve the stated problem, or it is unsafe | 38 | 34 |
| **Should have** | Important but the system remains useful without it | 12 | 5 |
| **Could have** | Desirable; included only if capacity remains | 8 | 6 |
| **Won't have (this release)** | Explicitly excluded, with rationale recorded | 3 | 0 |

The four undelivered Must-haves are FR-3.8 (slot concurrency control) and FR-4.5–FR-4.7 (server-side authorisation). Each is recorded as a Critical or High technical debt item with an assigned repayment milestone, rather than being quietly re-classified as a lower priority — which is the failure mode this documentation is designed to avoid.

## 5.4 Requirement Prioritisation Rationale — Two Worked Examples

**Why FR-2.6 (emergency short-circuit) is the highest-priority requirement in the system.** Every other requirement, if it fails, produces inconvenience. If FR-2.6 fails, a patient with an evolving myocardial infarction is offered an appointment slot instead of being told to call emergency services. It is therefore the only requirement implemented as an unconditional short-circuit that runs *before* any scoring logic, and the only one with three dedicated unit tests including a property-based assertion over the entire red-flag set. That assertion is what found defect D-03.

**Why FR-4.5 (server-side authorisation) was classified Must and still not delivered.** The classification was correct and the omission was a conscious, recorded trade against the time budget — roughly 24 hours of a 36-hour productive budget, producing no demonstrable feature. The decision was to deliver the complete clinical workflow with the gap disclosed, rather than a partial workflow that was secure. Reasonable engineers would disagree about that trade; what is not defensible is making it silently. It is recorded as TD-01, proven by executed probes in the Testing Report, and scheduled first in the v1.1 release.

---

# 6. Software Requirements Specification (Summary)

The full specification is in `SRS.docx`. In summary:

**Functional requirement groups:** FR-1 Account management (9) · FR-2 Triage engine (14) · FR-3 Booking (11) · FR-4 Dashboards and RBAC (7) · FR-5 Payment (8) · FR-6 Notifications (6) · FR-7 Consultation (6) · FR-8 Administration and audit (5) · FR-9 Validation and error handling (5).

**Key functional requirements:**

- **FR-2.4** — banding: score ≥ 80 → `EMERGENCY`; ≥ 60 → `URGENT`; ≥ 35 → `SEMI_URGENT`; otherwise `ROUTINE`.
- **FR-2.6** — *safety-critical*: any matched red flag yields `EMERGENCY` at score 95 with the booking flow suppressed.
- **FR-2.10** — rules are stored as data records with priority weights, never as nested conditionals.
- **FR-4.5** — every permission enforced server-side on every call *(not delivered — TD-01)*.
- **FR-5.7** — the payment interface must be substitutable by a real processor without changing booking logic.

**Key non-functional requirements:**

| ID | Requirement | Budget | Measured |
| :--- | :--- | :--- | :--- |
| NFR-1 | Rule-engine latency | ≤ 200 ms | **0.0011 ms median** over 30,000 evaluations |
| NFR-2 | API response, p95 | ≤ 2,000 ms | **425–1,167 ms** across 7 live targets |
| NFR-4 | Password storage | bcrypt, cost ≥ 10 | bcrypt, cost 10 — **met** |
| NFR-6 | Server-side authorisation | Enforced on every request | **Not met — TD-01** |
| NFR-7 | No secrets in the repository | Zero findings | **Not met — TD-02** |
| NFR-9 | First-time patient journey | < 5 minutes | Completed unaided within budget |

---

# 7. Software Effort Estimation

## 7.1 Selection of Technique, and Why

Four candidate techniques were evaluated against the specific circumstances of this project: a single developer, a greenfield system, a fully specified use-case model available before implementation, and no historical velocity data whatsoever.

| Technique | Fit for this project | Decision |
| :--- | :--- | :--- |
| **Function Point Analysis** | Sound, but its file/inquiry/interface counting model was designed for transaction-processing systems. The dominant complexity here is a decision engine, which FPA sizes poorly. | Rejected |
| **Story points with velocity** | Requires historical velocity from the same team. A single developer with no prior sprints on this codebase has no velocity to plan against — the number would be fabricated. | Rejected |
| **Expert judgement** | Fast, but unfalsifiable. Its accuracy cannot be argued for, and in an assessment context an unfalsifiable estimate demonstrates nothing. | Rejected as primary |
| **Use Case Points (Karner, 1993)** | Sizes directly from the use-case model, which was the first artefact produced. Explicitly accounts for actor complexity, technical factors and — critically — **environmental factors** including team experience and requirement stability. | **Selected as primary** |
| **COCOMO II (Post-Architecture)** | Requires a size estimate in SLOC, unavailable before implementation. But it becomes available *after*, making it an ideal independent cross-check. | **Selected as cross-check** |

**Why UCP is the right primary choice here.** The single largest risk to any estimate for this project is that the estimator is also the developer, is working alone, and is working under severe schedule compression. UCP is one of the few techniques whose model has explicit parameters for exactly those conditions: the environmental factor set covers motivation, requirement stability, staff continuity and lead-analyst capability. An estimation technique that could not represent "one highly motivated developer, perfectly stable self-authored requirements, extreme schedule pressure" would be modelling a different project.

## 7.2 Step 1 — Unadjusted Actor Weight (UAW)

| Actor | Type | Justification | Weight |
| :--- | :--- | :--- | :---: |
| Patient | Complex | Interacts through a graphical interface | 3 |
| Doctor | Complex | Interacts through a graphical interface | 3 |
| Administrator | Complex | Interacts through a graphical interface | 3 |
| Ollama Cloud LLM service | Simple | Another system reached through a defined API | 1 |
| | | **UAW** | **10** |

## 7.3 Step 2 — Unadjusted Use Case Weight (UUCW)

Classification follows Karner's transaction-count rule: Simple ≤ 3 transactions (weight 5), Average 4–7 (weight 10), Complex > 7 (weight 15).

| Complexity | Use cases | Count | Weight | Subtotal |
| :--- | :--- | :---: | :---: | ---: |
| **Simple** | UC-01 Register/log in · UC-04 Search doctors · UC-08 View appointments and notifications · UC-13 Verify licences · UC-14 Monitor metrics · UC-15 Inspect audit trail | 6 | 5 | 30 |
| **Average** | UC-03 View urgency result and emergency redirect · UC-06 Complete simulated payment · UC-09 Manage availability · UC-10 Review urgency-sorted queue · UC-11 Record clinical/SOAP notes · UC-12 Complete consultation · UC-16 Manage rules and specialisations · UC-17 AI clinical assistance | 8 | 10 | 80 |
| **Complex** | UC-02 Submit symptom triage (structured multi-step intake, rule evaluation, red-flag branch, persistence, notification, audit) · UC-05 Book consultation slot (availability, slot generation, reservation, triage linkage) · UC-07 Join video consultation room (media permission, session state, chat, completion) | 3 | 15 | 45 |
| | | **17** | **UUCW** | **155** |

**Unadjusted Use Case Points (UUCP) = UUCW + UAW = 155 + 10 = 165**

## 7.4 Step 3 — Technical Complexity Factor (TCF)

`TCF = 0.6 + (0.01 × TFactor)`

| Factor | Description | Weight | Rating (0–5) | Justification | Value |
| :--- | :--- | :---: | :---: | :--- | ---: |
| T1 | Distributed system | 2 | 4 | Serverless functions + managed DB + external inference API | 8.0 |
| T2 | Response time / performance | 1 | 4 | Explicit sub-200 ms budget on the triage path | 4.0 |
| T3 | End-user efficiency | 1 | 4 | Under-5-minute journey requirement | 4.0 |
| T4 | Complex internal processing | 1 | 4 | Weighted rule engine with priority resolution and short-circuit | 4.0 |
| T5 | Reusability | 1 | 3 | Payment and notification designed as substitutable interfaces | 3.0 |
| T6 | Easy to install | 0.5 | 5 | Git push deploys; no installation for end users | 2.5 |
| T7 | Easy to use | 0.5 | 4 | Low-proficiency primary users | 2.0 |
| T8 | Portability | 2 | 3 | Any Node runtime with a PostgreSQL connection string | 6.0 |
| T9 | Easy to change | 1 | 3 | Rules-as-data; typed seams | 3.0 |
| T10 | Concurrency | 1 | 3 | Concurrent slot booking is an explicit concern | 3.0 |
| T11 | Special security features | 1 | 4 | PHI, RBAC, hashing, audit trail | 4.0 |
| T12 | Direct access for third parties | 1 | 2 | Only the LLM API | 2.0 |
| T13 | Special user training | 1 | 1 | Self-service by design | 1.0 |
| | | | | **TFactor** | **46.5** |

**TCF = 0.6 + (0.01 × 46.5) = 1.065**

## 7.5 Step 4 — Environmental Factor (EF)

`EF = 1.4 + (−0.03 × EFactor)`

| Factor | Description | Weight | Rating (0–5) | Justification | Value |
| :--- | :--- | :---: | :---: | :--- | ---: |
| E1 | Familiarity with the development process | 1.5 | 4 | Lifecycle taught and applied throughout the course | 6.0 |
| E2 | Application experience | 0.5 | 3 | Familiar with web applications; new to clinical triage | 1.5 |
| E3 | Object-oriented / component experience | 1 | 4 | Strong React/TypeScript component experience | 4.0 |
| E4 | Lead analyst capability | 0.5 | 4 | Analyst and developer are the same person — no handoff loss | 2.0 |
| E5 | Motivation | 1 | 5 | Examination conditions | 5.0 |
| E6 | Stable requirements | 2 | 5 | Self-authored and frozen at hour 6; no external change source | 10.0 |
| E7 | Part-time staff | −1 | 0 | None | 0.0 |
| E8 | Difficult programming language | −1 | 2 | TypeScript is familiar | −2.0 |
| | | | | **EFactor** | **26.5** |

**EF = 1.4 − (0.03 × 26.5) = 1.4 − 0.795 = 0.605**

## 7.6 Step 5 — Adjusted Use Case Points

```
UCP = UUCP × TCF × EF
    = 165 × 1.065 × 0.605
    = 106.31 Use Case Points
```

## 7.7 Step 6 — Effort Conversion, and the Number That Changed the Project

Karner's calibration is **20 person-hours per UCP**. Applying it:

```
Production-grade effort = 106.31 × 20 = 2,126 person-hours
                        ≈ 13.3 person-months (at 160 h/month)
```

**This is the single most consequential number in the entire project.** The available budget was approximately **36 productive person-hours** inside a 48-hour elapsed window. The estimate said the specified system required roughly **59 times** the available effort.

An estimate that is ignored is not an estimate; it is decoration. This one was acted upon, and §7.10 records exactly how.

## 7.8 Independent Cross-Check — COCOMO II (Post-Architecture)

Because COCOMO II requires a size estimate that was unavailable before implementation, it was applied *after* delivery as an independent validation of the UCP figure.

**Measured size:** 10,684 lines of TypeScript/TSX across 66 source files, 413 lines of schema and seed, 729 lines of stylesheet, 125 lines of test — **11,951 physical lines**, taken as approximately **9.0 KSLOC** logical after discounting blank and comment lines.

**Scale factors:**

| Factor | Rating | Value |
| :--- | :--- | ---: |
| PREC — precedentedness | High (familiar problem class) | 2.48 |
| FLEX — development flexibility | High (self-defined requirements) | 2.03 |
| RESL — architecture / risk resolution | Nominal | 4.24 |
| TEAM — team cohesion | Extra High (single developer) | 0.00 |
| PMAT — process maturity | Nominal | 4.68 |
| | **ΣSF** | **13.43** |

```
E = 0.91 + (0.01 × 13.43) = 1.0443
Nominal effort = 2.94 × 9.0^1.0443 = 2.94 × 9.920 = 29.16 person-months
```

**Effort multipliers:** RELY 0.92 · CPLX 1.17 · DOCU 1.11 · ACAP 0.85 · PCAP 0.88 · PCON 0.81 · PLEX 0.91 · LTEX 0.91 · TOOL 0.78 · SITE 0.84 · SCED 1.43 · (DATA, RUSE, TIME, STOR, PVOL, APEX at nominal 1.00)

```
∏EM = 0.5617
Effort = 29.16 × 0.5617 = 16.38 person-months ≈ 2,490 person-hours
```

**Schedule:**

```
F    = 0.28 + 0.2 × (1.0443 − 0.91) = 0.3069
TDEV = 3.67 × 16.38^0.3069 = 8.7 months
Compressed at SCED Very Low (75%) = 6.5 months
Average staffing = 16.38 / 8.7 ≈ 2 developers
```

**Convergence:**

| Technique | Estimated production effort |
| :--- | :--- |
| Use Case Points (Karner calibration) | 2,126 person-hours |
| COCOMO II Post-Architecture | 2,490 person-hours |
| **Convergent range** | **2,100 – 2,500 person-hours** |

Two structurally independent techniques — one sized from the use-case model before implementation, the other from measured source size after — agree within 17%. That agreement is what makes the conclusion in §7.7 defensible rather than merely assertive: a production-grade PulseTriage is roughly **two developers for eight to nine months**.

## 7.9 The 48-Hour Demonstrator Budget

The delivered artefact is a **demonstrator**, not a production system, and it must be estimated as such.

**Planned effort allocation (36 productive person-hours within a 48-hour elapsed window):**

| Phase | Elapsed hours | Planned effort (h) | Activities |
| :--- | :--- | ---: | :--- |
| 1 — Planning & Requirements | 1–6 | 5 | Problem definition, stakeholders, elicitation, SRS, MoSCoW, **effort estimation**, scope freeze |
| 2 — Analysis & Design | 7–12 | 5 | Architecture, UML, data model, interface design, technical-debt forecast |
| 3 — Implementation | 13–32 | 15 | Rule engine, database, API layer, three portals, payment and notification simulators, AI layer |
| 4 — Testing & Refinement | 33–38 | 4 | Test execution, security review, defect fixes, debt documentation |
| 5 — Deployment | 39–42 | 3 | Cloud deployment, database provisioning and seeding, live verification |
| 6 — Documentation | 43–48 | 4 | Consolidated documentation, user manual, testing report, debt plan, packaging |
| | **48** | **36** | |

**Implied productivity: 36 ÷ 106.31 = 0.34 person-hours per UCP**, against Karner's 20. That is a factor of 59, and it demands an explanation rather than a footnote. It decomposes into four multiplicative factors:

| Factor | Multiplier | Justification |
| :--- | :---: | :--- |
| **Framework and template reuse** | ×0.40 | Next.js App Router supplies routing, SSR and the serverless API layer; Prisma supplies schema management, migration and typed data access; Tailwind and an existing admin HTML template supply the interface system. Karner's calibration assumes construction from primitives. |
| **Managed platform** | ×0.85 | Zero effort on provisioning, CI/CD, TLS, scaling or database administration — all absorbed by the platform. |
| **AI-assisted development** | ×0.60 | Substantial throughput gain on scaffolding-heavy, boilerplate-heavy work, which is the majority of construction in an application of this shape. |
| **Demonstrator fidelity** | ×0.085 | The decisive factor. The delivered system omits server-side authorisation, real integrations, the full test pyramid, load and soak testing, observability, operational runbooks, disaster recovery, accessibility conformance, compliance audit and clinical validation. |

```
0.40 × 0.85 × 0.60 × 0.085 = 0.0173
20 × 0.0173 = 0.35 person-hours per UCP  →  106.31 × 0.35 ≈ 37 person-hours
```

This reconstructs the 36-hour budget from first principles rather than back-fitting to it. **The fidelity factor of 0.085 is the honest core of this estimate: the demonstrator represents roughly 8.5% of the production engineering effort for the same functional scope.**

## 7.10 How the Estimation Changed the Project

The estimate was produced at hour 5 and drove five recorded decisions at the hour-6 scope freeze:

| # | Decision | Effort released | Consequence |
| :--- | :--- | ---: | :--- |
| **1** | Simulate the payment gate rather than integrate a real processor — **behind a stable interface** | ~40 h | TD-11. Merchant onboarding is impossible in 48 hours regardless of effort; the interface makes the later substitution a 40-hour job rather than a rewrite. |
| **2** | Simulate notification delivery rather than integrate SMS/e-mail — **behind a stable interface** | ~20 h | TD-12. Same reasoning. |
| **3** | Build the consultation room shell without peer media relay | ~36 h | TD-10. TURN and signalling infrastructure cannot be provisioned and tested in the window. |
| **4** | Enforce access control at the interface layer only | ~24 h | TD-01. **The most consequential and most debatable decision in the project.** Recorded, proven by executed probes, and scheduled first for repayment. |
| **5** | Implement the rule engine with rules-as-data but without database persistence of rule edits | ~20 h | TD-04. The expensive half (the declarative representation) was kept; the mechanical half (persistence) was deferred. |
| | **Total released** | **~140 h** | Against a 36-hour budget — without these decisions nothing would have shipped. |

**The pattern in these five decisions is the point.** In every case the choice was to **keep the architectural seam and defer the implementation behind it**, rather than to cut the feature or to hard-wire a shortcut through the abstraction. That single principle is what converts 140 hours of deferred work from an unbounded liability into a costed, scheduled and individually estimable repayment plan — which is exactly the register in §12.

## 7.11 Assumptions and Constraints on the Estimate

**Assumptions:** requirements remain frozen after hour 6; the developer works alone with no coordination overhead; framework and managed-platform reuse is available as assumed; no unrecoverable environment failure occurs; Karner's 20 PH/UCP is a valid production baseline.

**Constraints:** the 48-hour window is absolute and cannot be extended; there is no second developer to absorb overrun; deployment must succeed, because an undeployed system scores zero on three assessment components regardless of code quality; documentation must be complete, because it carries 24 of the 50 available marks.

**Threats to estimate validity:** the productivity calibration in §7.9 is derived rather than empirically measured against historical data — with no prior project history, no better basis was available. The fidelity factor of 0.085 is the least certain parameter and the one most deserving of challenge. Its indirect support is the debt register: 246 hours of identified repayable debt, against a 2,090-hour gap between production estimate and actual effort, is consistent with a demonstrator that implements the functional surface while omitting the great majority of production hardening.

## 7.12 Reconciling the Gap: Estimate, Actual, and Debt

```
Production estimate (UCP, Karner)          2,126 person-hours
Actual demonstrator effort                    36 person-hours
                                          ─────────────────────
Gap                                        2,090 person-hours
```

Order-of-magnitude apportionment of that gap:

| Component | Effort | Share | Nature |
| :--- | ---: | ---: | :--- |
| **Technical debt principal** — work required to make *delivered* functionality correct and safe | 246 h | 11.8% | **Repayable; itemised in `Technical_Debt_Plan.docx`** |
| **Deferred scope** — features explicitly excluded from v1.0 (EHR/FHIR interoperability, e-prescription, insurance claims, native applications) | ~640 h | 30.6% | Not debt — never promised for this release |
| **Production hardening** — full test pyramid, load and soak testing, observability, runbooks, disaster recovery, compliance audit, clinical validation of rule content | ~1,204 h | 57.6% | Not debt — out of scope for a demonstrator |

**Only the first line is technical debt**, and the distinction matters. Debt is the cost of having built something in a way that must later be corrected. Deferred scope is simply work not yet started. Conflating the two produces a debt register nobody believes and therefore nobody acts on.

---

# 8. System Analysis

## 8.1 Use Case Analysis

Seventeen use cases across four actors were identified and became the basis of the size estimate in §7.

> **FIGURE 8.1 — Use Case Diagram**
>
> ![Use case diagram showing 17 use cases across Patient, Doctor, Administrator and the external LLM service](images/02-use-case.png)
>
> *Source: `docs/diagrams/02-use-case.mmd`. Editable Mermaid Live Editor link in `docs/diagrams/diagram-links.md`, row 2.*

### Expanded Use Case — UC-02 Submit Symptom Triage (the system's critical path)

| Field | Detail |
| :--- | :--- |
| **Actor** | Patient (primary); Ollama LLM service (secondary, optional) |
| **Pre-condition** | The patient is authenticated |
| **Trigger** | The patient opens the triage wizard |
| **Main success scenario** | 1. Patient selects a symptom category. 2. Patient selects duration. 3. Patient sets pain intensity 1–10. 4. Patient reviews the red-flag checklist and ticks any applicable. 5. System evaluates the rule set. 6. System computes the severity score and urgency band. 7. System selects the highest-priority matching rule. 8. System persists the assessment, enqueues a notification and writes an audit entry. 9. System displays the urgency card with the recommended specialty and booking window. |
| **Alternate flow A — red flag detected** | At step 5, if any ticked flag matches an `EMERGENCY` rule: the system short-circuits to score 95 / `EMERGENCY`, displays the emergency-services redirect, **suppresses the booking flow entirely**, and terminates the use case. |
| **Alternate flow B — inference unavailable** | If the optional AI narrative is requested and the service is unreachable, the deterministic fallback is returned and the use case continues. The deterministic classification is unaffected in all cases. |
| **Post-condition** | An immutable triage assessment exists and is linked to the patient's history |
| **Requirements** | FR-2.1 – FR-2.14 |

## 8.2 Process and Data-Flow Analysis

> **FIGURE 8.2 — Level-1 Data Flow Diagram**
>
> ![Level 1 data flow diagram showing seven processes, four external entities and seven data stores](images/08-dfd-level1.png)
>
> *Source: `docs/diagrams/08-dfd-level1.mmd`. Editable link in `docs/diagrams/diagram-links.md`, row 8.*

Seven processes (authenticate, triage, book, pay, notify, consult, administer) exchange data with four external entities across seven data stores. Two properties of this model are worth noting: every one of processes 1.0–4.0 writes to the audit store D7, which is what makes FR-8.1 structural rather than incidental; and the external LLM entity touches only processes 2.0 and 6.0, and never a data store — the inference service is never given database access, which bounds the data-transfer surface to exactly what is passed in a request payload.

## 8.3 Object and Class Analysis

> **FIGURE 8.3 — Class Diagram (domain and service layer)**
>
> ![Class diagram of the triage engine, payment gateway, notification service, AI services and authentication context](images/04-class-diagram.png)
>
> *Source: `docs/diagrams/04-class-diagram.mmd`. Editable link in `docs/diagrams/diagram-links.md`, row 4.*

The design is module-oriented rather than class-oriented, which is idiomatic for TypeScript and React. The structurally important relationships are the three **substitution seams**: `TriageEngine` depends on `DynamicTriageRule` records rather than on hard-coded logic; `PaymentGateway` depends on the `PaymentRequest → PaymentResult` contract rather than on any provider; and `AIServices` delegates through `OllamaClient` rather than calling an inference API directly. Each seam is the exact point at which a simulated implementation is later replaced by a real one.

## 8.4 Feasibility Analysis

| Dimension | Assessment |
| :--- | :--- |
| **Technical** | Feasible. Every capability required by the Must-have set is achievable with mature, well-documented technology. The only genuinely hard problem — real-time media relay — was scoped out. |
| **Schedule** | Feasible **only after descoping**. The estimate in §7 established that the specified scope was not deliverable and forced the five decisions in §7.10. Without them the project would have failed. |
| **Operational** | Feasible for demonstration; **not feasible for clinical operation** until the Critical debt is repaid and rule content is clinically validated. |
| **Economic** | Feasible. Zero marginal cost at demonstration scale on managed free tiers. |
| **Legal / regulatory** | **Not yet feasible for production.** Lawful processing of health data requires the access controls of TD-01, the PHI access trail of TD-08, and a lawful basis for the transfer in TD-15. |

---

# 9. System Design

## 9.1 Architectural Design

**Style: layered monolith deployed to a serverless runtime.**

**Why not microservices?** With one developer and 36 hours, service decomposition would have added network boundaries, deployment topology, distributed tracing and eventual-consistency handling — all cost, no benefit at this scale. The system is instead a monolith with **internally enforced layer boundaries**, so that the rule engine or the notification queue could later be extracted into a service without disturbing its callers. This is the standard, and correct, "monolith first" progression.

> **FIGURE 9.1 — System Architecture**
>
> ![Four-tier system architecture: client, delivery, application, domain and data tiers with the external LLM service](images/01-system-architecture.png)
>
> *Source: `docs/diagrams/01-system-architecture.mmd`. Editable link in `docs/diagrams/diagram-links.md`, row 1.*

| Layer | Responsibility | Realisation |
| :--- | :--- | :--- |
| **Client** | Presentation, input capture, session context | React 19 components; `AuthContext` and `UIContext` |
| **Delivery** | Routing, server rendering, static optimisation | Next.js 15 App Router on the Vercel edge |
| **Application** | HTTP contract, input validation, orchestration | 18 Route Handlers under `src/app/api` |
| **Domain** | Business rules, isolated from transport and storage | `triage-engine.ts`, `simulated-payment.ts`, `notifications.ts`, `ai/` |
| **Data access** | Typed persistence, schema as source of truth | Prisma ORM v5 |
| **Data** | Durable storage | Managed PostgreSQL |

### Architectural Decision Records

| ADR | Decision | Alternatives rejected | Rationale |
| :--- | :--- | :--- | :--- |
| **ADR-1** | Next.js App Router monolith | Separate SPA + API service; microservices | One deployment artefact, one language, one type system across client and server. Halves the integration surface for a single developer. |
| **ADR-2** | PostgreSQL via Prisma | MongoDB; raw SQL | The domain is inherently relational (patients↔appointments↔doctors↔payments). Prisma's generated types make the schema the single source of truth, satisfying NFR-12. Parameterised queries eliminate the injection class entirely. |
| **ADR-3** | Deterministic rule engine as the authority; AI strictly advisory | LLM-driven triage | A clinical decision must be reproducible, auditable and explainable. A non-deterministic model can be none of those. This is the most important design decision in the system. |
| **ADR-4** | Simulate payment and notifications **behind interfaces** | Omit them; hard-wire a fake inline | Preserves the complete state machine and produces auditable records, while making the eventual real integration a substitution rather than a rewrite. |
| **ADR-5** | Rules as data records with priority weights | Nested conditionals | Satisfies FR-2.10 and NFR-11; makes rules reviewable by a non-programmer clinician; makes the engine testable as a pure function. |
| **ADR-6** | Managed serverless hosting | Self-managed VPS or container host | Deployment is an assessed component. Managed hosting removes provisioning, TLS and scaling from a budget that could not absorb them. |

## 9.2 Database Design

> **FIGURE 9.2 — Entity-Relationship Diagram**
>
> ![Entity relationship diagram of the nine PulseTriage entities with attributes and cardinalities](images/03-er-diagram.png)
>
> *Source: `docs/diagrams/03-er-diagram.mmd`. Editable link in `docs/diagrams/diagram-links.md`, row 3.*

Nine entities in third normal form. Three design points:

- **`users` is a single table for all three roles**, discriminated by `role`, with `doctors` as a 1:1 extension. Separate tables per role would have duplicated authentication logic three times.
- **`triage_assessments` is append-only.** A re-assessment creates a new row. Clinical decisions must remain reproducible after the fact, so no update path exists.
- **`audit_logs` has no foreign keys.** It deliberately holds denormalised actor and entity strings so that an audit entry survives deletion of the record it refers to — a trail that can be erased by deleting its subject is not a trail.

## 9.3 Behavioural Design

> **FIGURE 9.3 — Sequence Diagram: triage → booking → payment**
>
> ![Sequence diagram of the complete triage, appointment creation and simulated payment flow including both alternate paths](images/05-sequence-triage-booking.png)
>
> *Source: `docs/diagrams/05-sequence-triage-booking.mmd`. Editable link in `docs/diagrams/diagram-links.md`, row 5.*

> **FIGURE 9.4 — Activity Diagram: rule evaluation**
>
> ![Activity diagram of the triage rule engine including the red-flag short-circuit and the banding decisions](images/06-activity-triage.png)
>
> *Source: `docs/diagrams/06-activity-triage.mmd`. Editable link in `docs/diagrams/diagram-links.md`, row 6.*

## 9.4 Deployment and Component Design

> **FIGURE 9.5 — Component and Deployment Diagram**
>
> ![Deployment diagram showing the development workstation, GitHub, the Vercel production environment and the managed cloud backends](images/07-component-deployment.png)
>
> *Source: `docs/diagrams/07-component-deployment.mmd`. Editable link in `docs/diagrams/diagram-links.md`, row 7.*

## 9.5 Interface Design

The interface uses a single component vocabulary across all three portals — panels, badges, page icons and a consistent action hierarchy of one primary action per view. Urgency is always conveyed by a text label as well as a colour (NFR-10), because colour alone excludes colour-blind users and fails in monochrome print.

> **📷 FIGURE 9.6 — INSERT SCREENSHOT HERE — Landing page**
>
> **Where to get it:** <https://pulsetriage.vercel.app/>
> **What to capture:** the full landing page including the value proposition and the primary call to action.
> **Save as:** `docs/images/screenshot-landing.png`

> **📷 FIGURE 9.7 — INSERT SCREENSHOT HERE — Triage wizard**
>
> **Where to get it:** <https://pulsetriage.vercel.app/triage> (sign in as `patient@ug.edu.gh` / `password123`)
> **What to capture:** the wizard showing the symptom selector, duration control, pain slider and red-flag checklist.
> **Save as:** `docs/images/screenshot-triage-wizard.png`

> **📷 FIGURE 9.8 — INSERT SCREENSHOT HERE — Urgency result card**
>
> **Where to get it:** same page, after evaluating a non-emergency symptom set (e.g. severe headache, pain 7, sudden onset).
> **What to capture:** the severity score out of 100, the urgency badge, the recommended specialty and the booking window guidance.
> **Save as:** `docs/images/screenshot-urgency-result.png`

> **📷 FIGURE 9.9 — INSERT SCREENSHOT HERE — Emergency redirect (safety-critical behaviour)**
>
> **Where to get it:** same page — select **Chest Pain / Palpitations**, duration *Sudden (< 6 hours)*, pain **9**, and tick **"Chest pain or pressure radiating to arm/jaw"**.
> **What to capture:** the emergency banner, demonstrating that **no booking control is offered**. This is the single most important screenshot in the submission.
> **Save as:** `docs/images/screenshot-emergency-redirect.png`

> **📷 FIGURE 9.10 — INSERT SCREENSHOT HERE — Doctor directory and booking modal**
>
> **Where to get it:** <https://pulsetriage.vercel.app/doctors> then open a doctor's booking modal.
> **What to capture:** the specialisation filter, the doctor cards, and the date/slot picker with the fee summary.
> **Save as:** `docs/images/screenshot-booking.png`

> **📷 FIGURE 9.11 — INSERT SCREENSHOT HERE — Simulated payment checkout**
>
> **Where to get it:** the payment step of the booking modal.
> **What to capture:** the Mobile Money / Card / Insurance options and the fee confirmation.
> **Save as:** `docs/images/screenshot-payment.png`

> **📷 FIGURE 9.12 — INSERT SCREENSHOT HERE — Patient dashboard**
>
> **Where to get it:** <https://pulsetriage.vercel.app/patient> (`patient@ug.edu.gh` / `password123`)
> **What to capture:** appointments, triage history and the notification badge.
> **Save as:** `docs/images/screenshot-patient-dashboard.png`

> **📷 FIGURE 9.13 — INSERT SCREENSHOT HERE — Doctor workspace (urgency-ordered queue)**
>
> **Where to get it:** <https://pulsetriage.vercel.app/doctor> (`dr.mensah@ug.edu.gh` / `password123`)
> **What to capture:** the queue with the highest-severity patient at the top — this evidences FR-4.2.
> **Save as:** `docs/images/screenshot-doctor-queue.png`

> **📷 FIGURE 9.14 — INSERT SCREENSHOT HERE — Administrator console**
>
> **Where to get it:** <https://pulsetriage.vercel.app/admin> (`admin@ug.edu.gh` / `password123`)
> **What to capture:** the metrics tiles and the doctor verification controls.
> **Save as:** `docs/images/screenshot-admin-dashboard.png`

> **📷 FIGURE 9.15 — INSERT SCREENSHOT HERE — Triage rule configurator and simulator**
>
> **Where to get it:** <https://pulsetriage.vercel.app/admin/rules>
> **What to capture:** the rule list with active toggles and the rule simulator output — evidences FR-2.12.
> **Save as:** `docs/images/screenshot-admin-rules.png`

> **📷 FIGURE 9.16 — INSERT SCREENSHOT HERE — Audit trail**
>
> **Where to get it:** <https://pulsetriage.vercel.app/admin/audit>
> **What to capture:** audit entries showing actor, action, entity and timestamp — evidences FR-8.1.
> **Save as:** `docs/images/screenshot-audit-trail.png`

> **📷 FIGURE 9.17 — INSERT SCREENSHOT HERE — Responsive mobile layout**
>
> **Where to get it:** any page, with the browser developer tools device toolbar set to 390 × 844 (iPhone 14).
> **What to capture:** the triage wizard at mobile width, showing correct reflow with no horizontal scrolling — evidences UI-1 and NFR-13.
> **Save as:** `docs/images/screenshot-mobile-responsive.png`

## 9.6 Security Design

| Control | Design | Delivered |
| :--- | :--- | :---: |
| Credential storage | bcrypt, work factor 10; hash never returned in any response | ✔ |
| Transport security | TLS enforced by the platform on every route | ✔ |
| Injection prevention | Prisma parameterises all queries; no raw SQL exists in the codebase | ✔ |
| Input validation | Required-field and type checks before any datastore access | ✔ |
| Audit trail | Append-only log with no exposed mutation path | ✔ |
| Role separation (interface) | `AuthGuard` component with an allowed-roles list | ✔ |
| **Role separation (API)** | **Server-side permission evaluation per request** | ✘ **TD-01** |
| **Session integrity** | **Signed, expiring token in an `HttpOnly` cookie** | ✘ **TD-03** |
| **Secret management** | **Environment-only, with no source fallback** | ✘ **TD-02** |
| **Error hygiene** | **Generic client messages; detail logged server-side** | ✘ **TD-13** |

The four unmet controls are the subject of the v1.1 security release and are evidenced by executed probes in the Testing Report.

---

# 10. Implementation

## 10.1 Technology Stack and Justification

| Layer | Technology | Why chosen |
| :--- | :--- | :--- |
| Language | TypeScript 5.7 | One statically-typed language across client, server and schema; the type system caught a substantial class of defect before runtime (NFR-12) |
| Framework | Next.js 15 (App Router) | Server components, file-based routing and serverless API handlers in a single deployable unit |
| UI runtime | React 19 | Component model; large ecosystem |
| Styling | Tailwind CSS 3.4 + a licensed admin template | Utility-first styling with no context switching; the template supplied a complete, responsive interface system that would otherwise have consumed several hours |
| Motion | Framer Motion 12 | Declarative transitions for state changes in the wizard |
| Icons | Lucide React + Bootstrap Icons | Consistent icon vocabulary |
| ORM | Prisma 5.22 | Schema-as-source-of-truth, generated types, parameterised queries, migration tooling |
| Database | PostgreSQL (Neon managed) | Relational integrity, transactions, serverless-friendly pooled connections |
| Credentials | bcryptjs 3.0 | Adaptive hashing with a tunable work factor |
| AI | Ollama JS client 0.6 | Simple JSON-mode inference client with a straightforward fallback path |
| Testing | `node --test`, `tsx --test` | Zero additional dependency weight; native runner |
| Hosting | Vercel | Git-push deployment, global edge, zero infrastructure management |

## 10.2 Delivered Scale

| Measure | Value |
| :--- | ---: |
| TypeScript / TSX source files | 66 |
| Lines of application source | 10,684 |
| Lines of schema and seed | 413 |
| Lines of stylesheet | 729 |
| Automated test cases | 22 |
| Application routes (pages) | 24 |
| API endpoints | 18 |
| Database entities | 9 |
| Runtime dependencies | 12 |
| Git commits | 13 |

## 10.3 The Triage Rule Engine — Core Implementation

The engine (`src/lib/triage-engine.ts`) is a **pure function**: identical input always produces identical output, and it performs no input/output of any kind. This is what makes every triage decision reproducible and auditable, and it is asserted by test TC-UNIT-12.

**Evaluation order — and why the order itself matters:**

1. **Red-flag short-circuit (FR-2.6).** Before any arithmetic, the engine tests whether any ticked flag matches an active `EMERGENCY` rule. If so it returns immediately: score 95, `EMERGENCY`, `is_emergency_redirect = true`. This runs first specifically so that a low reported pain score can never suppress a genuine emergency — the case verified by TC-UNIT-02, where a patient reporting 1/10 pain with a stroke indicator is still classified `EMERGENCY`.
2. **Base score.** `severity × 8`, giving a maximum of 80 from the intensity slider alone and deliberately leaving headroom so that intensity alone cannot reach the emergency band.
3. **Duration weighting.** Onset within 2 days adds 15 (acute presentations are more urgent); duration beyond 14 days adds 5 (chronic presentations warrant attention but not urgency).
4. **Red-flag weighting.** Each non-critical flag adds 10.
5. **Clamp** to 0–100.
6. **Rule selection.** Among active rules whose severity threshold is met, the highest `priority_weight` wins (FR-2.11).
7. **Banding**, then the matched rule's action recommendation and specialty override the generic band defaults.

**Rules as data (FR-2.10).** Each rule is a declarative record — identifier, category, symptom, severity threshold, required red flags, urgency output, action recommendation, specialty, active flag, priority weight. Six rules ship in v1.0 covering cardiovascular, respiratory, neurological and general presentations. Adding a rule requires adding a record, not editing an algorithm — which is what makes the engine reviewable by a clinician and testable as a unit.

## 10.4 Simulated Payment Gate

`processSimulatedPayment` implements the `PaymentRequest → PaymentResult` contract. It introduces an 800 ms delay so that the interface's loading states are exercised realistically, applies a deterministic validity rule (account shorter than five characters, or the literal `00000`, is declined), and on authorisation issues a reference of the form `PAY-SIM-nnnnnn` and returns a payment log record.

The determinism is a deliberate testability property (NFR-16): both the success and the decline path can be triggered reliably, which a real gateway sandbox does not guarantee. The module carries a technical-debt annotation in its own file header pointing to the register entry.

## 10.5 AI Clinical Assistants

Six assistants are implemented: symptom triage narrative, SOAP note drafting, laboratory report interpretation, no-show risk scoring, doctor matching, and a patient chat assistant.

Two implementation properties matter more than the features themselves:

- **Every call is wrapped by `queryOllamaJson(messages, fallback, options)`.** The fallback is a fully-formed, schema-valid object supplied at the call site. An inference failure therefore degrades the feature to a safe default rather than propagating an error (FR-9.3), and the fallback shapes are themselves unit-tested (TC-UNIT-13 to TC-UNIT-16).
- **No AI output may alter a deterministic classification.** The AI layer produces narrative and suggestion only. This is a safety constraint (ADR-3), not a limitation of the integration.

## 10.6 Error Handling and Validation

Every route handler validates required fields before touching the datastore and returns a structured error object with an appropriate status code. Every asynchronous client action has an explicit loading and error state. The known gap — internal exception text reaching the client on HTTP 500 — is defect D-04 / TD-13.

## 10.7 Development Practice

Work proceeded in small, single-purpose commits with descriptive messages, and the commit history reflects the actual sequence of the project: schema and seeding, deployment troubleshooting, feature completion, then defect fixes. Two of the closed defects in the Testing Report (D-07, D-08) are traceable to specific commits, which is the practical value of a disciplined commit history — it makes the defect log verifiable rather than assertive.

---

# 11. Testing

Full detail is in `Testing_Report.docx`. Summary:

| Level | Cases | Result |
| :--- | :---: | :--- |
| Unit — production rule engine | 12 | **12 pass** |
| Unit — supporting modules | 10 | **10 pass** |
| Static type analysis | 1 | **Pass** — zero diagnostics |
| Performance | 10 | **All within budget** |
| Security probes | 9 | **4 pass, 5 fail** |
| Integration | 13 | **13 pass** |
| System | 14 | **11 pass, 3 partial** |
| User acceptance | 5 | **5 pass** |

**Headline measurements:**

- Rule-engine latency: **0.0011 ms median** over 30,000 measured evaluations, against a 200 ms budget.
- Live API p95: **425–1,167 ms** across seven targets, against a 2,000 ms budget.
- Unauthenticated probes: **five endpoints returned 200 and disclosed protected data**.

**Seven defects raised, three closed.** The most significant finding is **D-03**: two published critical red flags — suspected meningitis and uncontrolled bleeding — are presented to patients but are not bound to any `EMERGENCY` rule, so they contribute only 10 points instead of triggering the short-circuit. It was found by a *property-based* assertion ("every published red flag must be bound to an `EMERGENCY` rule") rather than by any example-based test, because every example test happened to use a flag that was covered.

**The most instructive observation from the whole testing effort:** all three closed defects were found by functional testing, and **all five open defects were found by security probing and by reviewing the tests themselves.** The functional suite was entirely green while a complete authorisation bypass was live in production. Functional testing establishes that a system does what it should. It says nothing about whether the system also does what it should not.

---

# 12. Technical Debt

Full detail is in `Technical_Debt_Plan.docx`. Summary:

**15 items · 4 Critical · 5 High · 6 Medium · 246 person-hours to repay.**

## 12.1 The Critical Items

| ID | Debt | Cause | Impact | Priority | Resolution |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TD-01** | No server-side authentication or authorisation on any API endpoint | 24 h of the 36 h budget, producing no visible feature | Any anonymous caller can read patient, clinical, appointment, financial and audit data — **proven by executed probes** | **Critical** | Signed token in an `HttpOnly` cookie + middleware + declarative per-route permission table + a role × endpoint CI regression matrix (24 h) |
| **TD-02** | Literal inference API key committed to source as a fallback | Local development convenience; removal step missed under time pressure | Credential exposed in Git history; unauthorised billed usage | **Critical** | Revoke and rotate; remove the fallback and fail fast; purge history; add pre-commit secret scanning (3 h) |
| **TD-03** | Unsigned session profile in browser local storage | 15 minutes of work versus several hours for a cookie-based token scheme | Editing one word (`"role":"PATIENT"` → `"ADMIN"`) grants the administrator console; with TD-01 open, full administrator capability | **Critical** | Repay jointly with TD-01 (16 h) |
| **TD-13** | Internal exception text returned to clients | Deliberate during deployment troubleshooting; removal overran | Schema and driver detail disclosed (OWASP A05) | **Critical** | Central error helper with correlation ids; lint rule to prevent recurrence (4 h) |

## 12.2 Classification as Required by the Brief

| Class | Items |
| :--- | :--- |
| **Critical — immediate attention required** | TD-01, TD-02, TD-03, TD-13 |
| **Scheduled for future resolution** | TD-04 rule persistence · TD-05 account lifecycle · TD-06 slot concurrency · TD-07 reschedule/cancel · TD-08 PHI read auditing · TD-09 accessibility · TD-10 consultation media · TD-11 real payment settlement · TD-12 real notification delivery · TD-14 currency representation |
| **Acceptable temporarily** | TD-15 LLM data-processing agreement — acceptable **only** while all data is synthetic; becomes blocking the moment a real patient record enters the system |

## 12.3 Repayment Roadmap

| Release | Window | Items | Effort | Exit criterion |
| :--- | :--- | :--- | ---: | :--- |
| **v1.1 Security Hardening** | Week 1 | TD-02, TD-13 (day 1); TD-01 + TD-03 (days 2–5); TD-10 labelling | 48 h | All Critical items closed; cross-role probe returns 403 for every unauthorised combination; secret scan clean |
| **v1.2 Clinical Governance** | Month 1 | TD-04, TD-06, TD-08, TD-05 | 60 h | Rules editable and versioned without redeployment; concurrency test passes; PHI reads audited |
| **v1.3 Experience & Access** | Month 2 | TD-07, TD-09, TD-14 | 38 h | WCAG 2.1 AA verified; reschedule/cancel live; currency migrated before real money exists |
| **v2.0 Production Readiness** | Months 2–3 | TD-11, TD-12, TD-10, TD-15 | 101 h | Real settlement with webhook reconciliation; real SMS/e-mail; real consultation media; data-processing agreement executed |

## 12.4 The Principle Behind Every Debt Decision

In each of the five descoping decisions in §7.10, the choice was to **keep the architectural seam and defer the implementation behind it**. Replacing the payment simulator with a real gateway is a 40-hour substitution because `PaymentRequest → PaymentResult` does not change. Had the booking logic called a provider SDK directly, the same change would have been an excavation through every call site in the application.

Choosing *where* to place the seam is the highest-leverage decision available when incurring deliberate debt, and it is the difference between debt that can be repaid on a schedule and debt that compounds until the system is rewritten.

---

# 13. Deployment

## 13.1 Deployment Architecture

> See **Figure 9.5** — Component and Deployment Diagram.

| Element | Provider | Configuration |
| :--- | :--- | :--- |
| Application | Vercel | Production, global edge; build command `prisma generate && next build` |
| Database | Neon (managed PostgreSQL) | TLS, pooled connections, schema applied via `prisma db push`, seeded via `prisma/seed.ts` |
| Source control | GitHub | `main` branch; push triggers automatic build and deployment |
| Secrets | Vercel environment variables | `DATABASE_URL`, `OLLAMA_API_KEY` *(with the source-fallback defect TD-02 outstanding)* |

## 13.2 Live Environment

| Item | Value |
| :--- | :--- |
| **Live application** | <https://pulsetriage.vercel.app> |
| **Administrator console** | <https://pulsetriage.vercel.app/admin> |
| **Source repository** | <https://github.com/NketiaAsubontengErnest/pulsetriage> |
| **Verified build** | Commit `000c32e` |

## 13.3 Examiner Test Credentials

All seeded accounts share the password **`password123`**.

| Role | E-mail | Entry point |
| :--- | :--- | :--- |
| **Patient** | `patient@ug.edu.gh` | `/patient` |
| **Doctor** | `dr.mensah@ug.edu.gh` (Cardiology) | `/doctor` |
| **Doctor** | `dr.appiah@ug.edu.gh` (Pulmonology) | `/doctor` |
| **Doctor** | `dr.owusu@ug.edu.gh` (General Practice) | `/doctor` |
| **Administrator** | `admin@ug.edu.gh` | `/admin` |

## 13.4 Live Deployment Verification

Executed on 12 August 2026 against the production URL:

| Check | Result |
| :--- | :--- |
| All 8 primary routes return HTTP 200 | ✔ |
| `GET /api/doctors` returns seeded doctors | ✔ |
| `GET /api/specializations` returns the catalogue | ✔ |
| `POST /api/auth/login` with `patient@ug.edu.gh` / `password123` | ✔ returns a role-tagged profile |
| Invalid password rejected with HTTP 401 | ✔ |
| Duplicate registration rejected with HTTP 409 | ✔ |
| Malformed login payload rejected with HTTP 400 | ✔ |
| p95 response time within the 2,000 ms budget on all measured targets | ✔ |

## 13.5 Reproducing the Deployment

```bash
git clone https://github.com/NketiaAsubontengErnest/pulsetriage.git
cd pulsetriage
npm install

# Configure the environment
cp .env.example .env          # then set DATABASE_URL (and OLLAMA_API_KEY for AI features)

# Provision and seed the database
npm run db:push
npm run db:seed

# Verify locally
npm run dev                   # http://localhost:3000
npm run test:all

# Deploy
vercel --prod                 # or push to main with the GitHub integration enabled
```

---

# 14. User Manual (Summary)

Full instructions are in `User_Manual.docx`. In brief:

**Patient:** register or sign in → *Start Symptom Triage* → select symptom, duration and pain level, tick any red flags → *Evaluate* → read the urgency card → *Book with recommended specialist* → choose doctor, date and slot → pay by Mobile Money, Card or Insurance → receive confirmation.

> **If the result is `EMERGENCY`, no booking is offered. Call emergency services or attend the nearest emergency department immediately.** This is intended behaviour, not a fault.

**Doctor:** sign in → review the queue, ordered by clinical urgency with the most urgent patient first → open a patient to read their triage assessment → join the consultation room → record clinical notes (optionally drafting a SOAP note with the AI assistant) → mark the consultation complete.

**Administrator:** sign in → review metrics → verify doctor licences → curate the specialisation catalogue → inspect and simulate triage rules → read the audit trail.

---

# 15. Maintenance Strategy

## 15.1 The Four Maintenance Categories

| Category | Scope for PulseTriage | Trigger | Response target | Owner |
| :--- | :--- | :--- | :--- | :--- |
| **Corrective** | Defect repair — misclassification, booking failure, payment state inconsistency | Defect report or monitoring alert | Safety-critical (any triage misclassification): **4 hours**. Critical (booking or payment broken): 24 hours. Major: 5 working days. Minor: next release. | Maintenance engineer |
| **Adaptive** | Change forced by the environment — clinical guideline updates, platform runtime upgrades, payment provider API changes, regulatory change | External notification | Within the deprecation window; runtime upgrades quarterly | Maintenance engineer + clinical advisor |
| **Perfective** | Improvement without a defect — new specialties, richer analytics, performance work, usability improvement | User feedback and analytics | Prioritised into the quarterly roadmap | Product owner |
| **Preventive** | Work that stops future failure — dependency patching, refactoring, index tuning, **technical debt repayment** | Scheduled | Weekly dependency scan; monthly debt review | Maintenance engineer |

**Preventive maintenance is where the technical debt register lives.** The 246 hours in `Technical_Debt_Plan.docx` are not a separate initiative competing with maintenance — they are the preventive maintenance backlog, already itemised, costed and sequenced.

## 15.2 Corrective Maintenance — Triage Misclassification

Misclassification is the one defect class with direct clinical consequence, and it warrants a distinct procedure:

1. Reproduce the exact input from the persisted assessment record. Because the engine is pure (TC-UNIT-12), this reproduction is exact.
2. Replay it against the rule set that was in force at the time — which requires rule versioning, and is one of the reasons TD-04 includes version retention.
3. Classify: rule *content* error (clinical advisor owns it) or rule *engine* error (engineering owns it).
4. For content errors, correct the rule, simulate against the historical corpus, obtain clinical sign-off, publish.
5. For engine errors, fix, add a regression test that fails without the fix, then release.
6. In both cases, review all assessments produced since the defect was introduced and contact affected patients where the correction is material.

Step 6 is the reason `triage_assessments` is append-only and fully populated: a system that overwrites its clinical decisions cannot perform a look-back review.

## 15.3 Security and Dependency Maintenance

| Activity | Frequency |
| :--- | :--- |
| Automated dependency vulnerability scan | Weekly (automated pull requests) |
| Critical CVE in a direct dependency | Patch within 48 hours |
| Secret scanning | Every commit (pre-commit hook + repository scanning) |
| Dependency minor/patch updates | Monthly, batched |
| Major framework upgrades | Quarterly, on a branch, behind the full test suite |
| Penetration test | Before any production launch, then annually |
| Access-control regression matrix | Every CI run, once TD-01 lands |

## 15.4 Performance and Scalability Maintenance

Current measurements identify **serverless cold start** as the dominant tail-latency contributor and the **database round trip** as the dominant median cost. The scaling path in priority order:

1. Connection pooling at the edge (removes most per-request connection cost).
2. Cache the doctor directory and specialisation catalogue at the edge — both are read-heavy and change rarely.
3. Add indexes on `appointments(doctor_id, appointment_date)` and `triage_assessments(patient_id, created_at)` as row counts grow.
4. Extract the rule engine into a separate service **only if** rule-set size or evaluation volume makes it necessary — the seam already exists, so this remains a deferred option rather than a commitment.
5. Introduce read replicas when reporting queries begin to affect transactional latency.

## 15.5 Monitoring and Observability

Not implemented in v1.0 and required before any production operation. The minimum viable set: structured request logging with correlation identifiers, error-rate and latency alerting per endpoint, database connection-pool saturation alerts, a business-metric dashboard (triage volume, urgency distribution, booking conversion, no-show rate), and — most importantly — an alert on any statistically significant shift in the urgency-classification distribution, which is the earliest possible signal that a rule change has had an unintended clinical effect.

## 15.6 Maintainability Assessment

| Property | Assessment |
| :--- | :--- |
| **Analysability** | Good. End-to-end static typing; clear module boundaries; the schema is the single source of truth for entity shapes. |
| **Modifiability** | Good for rules and for the simulated services, because each sits behind a stable seam. Weaker for the interface layer, which has no component tests. |
| **Testability** | Strong for the domain layer (the rule engine is a pure function). Weak for the route-handler and component layers, which have no automated coverage. |
| **Modularity** | Good. Domain logic is isolated from transport and from persistence. |
| **Reusability** | The rule engine and both simulators are independently reusable; they import nothing from the framework. |

---

# 16. Future Evolution

## 16.1 Twelve-Month Roadmap

| Release | Window | Theme | Content |
| :--- | :--- | :--- | :--- |
| **v1.1** | Week 1 | **Security hardening** | Repay TD-01, TD-02, TD-03, TD-13. Server-side authorisation, signed sessions, secret rotation and history purge, error hygiene, and the CI regression matrix that makes recurrence structurally impossible. **No feature content whatsoever.** |
| **v1.2** | Month 1 | **Clinical governance** | Persisted, versioned triage rules with a simulate-then-publish workflow; clinical advisor onboarding and formal sign-off of rule content; slot concurrency control; PHI read auditing; account verification and password reset. |
| **v1.3** | Month 2 | **Experience and access** | WCAG 2.1 AA conformance; reschedule and cancellation with a cut-off policy; exact currency representation; doctor slot block/release. |
| **v2.0** | Months 2–3 | **Production readiness** | Real payment settlement (Paystack + Hubtel Mobile Money) with webhook verification and reconciliation; real SMS and e-mail delivery with retry and scheduling; real two-way consultation media via a managed provider; LLM data-processing agreement and de-identification. |
| **v2.1** | Months 4–5 | **Clinical depth** | Structured medical history and allergy capture; e-prescription with pharmacy integration; laboratory order and result workflow; follow-up scheduling driven by the consultation outcome. |
| **v2.2** | Months 6–7 | **Intelligence** | Rule-set refinement driven by outcome data — the accumulated `triage_assessments` corpus paired with consultation outcomes becomes a validation set for the thresholds that are currently engineering placeholders; no-show prediction moved from heuristic to trained model; clinician-facing decision support. |
| **v3.0** | Months 8–12 | **Interoperability and scale** | HL7 FHIR R4 resource mapping for exchange with hospital EHRs; multi-clinic tenancy; native mobile applications; insurance and NHIS claim submission; offline-capable intake for low-connectivity settings. |

## 16.2 Evolution Principles

**Technical debt is repaid before features are added.** v1.1 contains no feature content at all. Adding features to a system with a known authorisation bypass increases the surface of the bypass.

**Clinical validation gates clinical intelligence.** v2.2 uses accumulated data to refine thresholds, but the rule *content* remains under clinical authority throughout. The system may propose a threshold change; it may never publish one unilaterally.

**Every substitution uses an existing seam.** The v2.0 integrations replace implementations behind interfaces that already exist. This is the deliberate payoff of the design decisions recorded in §7.10 and §12.4.

**Scale is deferred until it is measured.** Multi-tenancy, read replicas and service extraction appear late in the roadmap because there is no evidence yet that they are needed. Building for a scale that has not arrived is itself a form of debt.

## 16.3 Anticipated Technology Change

| Change | Anticipated impact | Preparation already in place |
| :--- | :--- | :--- |
| Framework major versions (React, Next.js) | Routine but non-trivial migrations | Quarterly upgrade cadence behind the full test suite |
| LLM capability and cost improvement | Better clinical narrative at lower cost | The `OllamaClient` seam makes the provider swappable |
| Regulatory tightening on AI in healthcare | Possible constraints on AI-assisted clinical text | The AI layer is strictly advisory and can be disabled by configuration without affecting the deterministic path |
| Ghanaian Mobile Money API evolution | Payment integration changes | The `PaymentRequest → PaymentResult` seam localises the impact |
| Health-data residency requirements | Possible requirement to relocate data | Managed PostgreSQL supports regional placement; the application tier is stateless |

---

# 17. Limitations

Stated plainly, because a limitations section that lists only comfortable limitations is not a limitations section.

## 17.1 Clinical Limitations

| # | Limitation | Consequence |
| :--- | :--- | :--- |
| **L1** | **The rule content has not been clinically validated.** The thresholds separating urgency bands are engineering placeholders. The mechanism is sound; the numbers carry no clinical authority. | The system must not be used for real triage until a qualified clinical advisor reviews and signs off the rule content. This is the single most important limitation in the document. |
| **L2** | **Two published red flags do not escalate.** Suspected meningitis and uncontrolled bleeding are offered to patients as red flags but are not bound to any `EMERGENCY` rule (defect D-03). | A patient ticking either receives a score contribution of 10 rather than an emergency redirect. |
| **L3** | Triage depends entirely on accurate patient self-report. | A patient who understates pain, or does not recognise a red flag in their own presentation, will be under-triaged. No software can compensate for this. |
| **L4** | The system covers common presentations only. Rare, atypical and paediatric presentations are not modelled. | Out-of-model presentations will be mis-scored. |

## 17.2 Security Limitations

| # | Limitation | Consequence |
| :--- | :--- | :--- |
| **L5** | **No server-side authorisation.** Proven by executed probes: five endpoints return protected data to anonymous callers. | The system must not process real patient data in its current state. |
| **L6** | **Sessions are client-forgeable.** An unsigned profile in browser storage, with a client-editable role field. | Trivial privilege escalation. |
| **L7** | **A credential is present in the repository history.** | Requires rotation, not merely deletion. |
| **L8** | No rate limiting, account lockout or session expiry. | Brute-force and session-fixation exposure. |

## 17.3 Functional Limitations

| # | Limitation |
| :--- | :--- |
| **L9** | Payments are simulated. No money moves; no settlement, refund or reconciliation exists. |
| **L10** | Notifications are in-application only. Nothing is sent by e-mail or SMS, including records labelled as reminders. |
| **L11** | The consultation room shows a local camera preview only. The two participants cannot see or hear each other. |
| **L12** | Administrator rule edits are lost on page reload; the patient-facing engine continues to use the compiled-in rule set. |
| **L13** | Appointments cannot be rescheduled or cancelled by the patient. |
| **L14** | Concurrent booking of the same slot is not prevented. |
| **L15** | No accessibility conformance has been verified. |

## 17.4 Methodological Limitations

| # | Limitation |
| :--- | :--- |
| **L16** | Requirements were elicited from domain analysis and published practice, not from interviews with real patients, clinicians or administrators. Every requirement is therefore a reasoned inference rather than a validated stakeholder statement. |
| **L17** | The effort estimate's productivity calibration is derived from stated reuse and fidelity factors rather than measured against historical project data, because no such history exists. The fidelity factor of 0.085 is the least certain parameter in the estimate. |
| **L18** | User acceptance testing used a small number of participants over a single session. It establishes that the journeys are completable; it does not establish usability at population scale. |
| **L19** | Load and soak testing were not performed. The performance figures describe a lightly-loaded system, and say nothing about behaviour under concurrency. |
| **L20** | The route-handler and component layers have no automated test coverage at all — which is precisely where every open Critical defect lives. |

---

# 18. Conclusion

PulseTriage addresses a specific and consequential failure in outpatient care: appointments ordered by when a patient called rather than by how sick they are. The delivered system replaces arrival order with clinical order, detects emergency presentations and redirects them out of the booking pathway entirely, routes patients to an appropriate specialty, and gives the clinician structured context before the consultation begins. It is deployed, publicly reachable and verified working end-to-end across three roles.

Measured against the examination's stated principle — that the assessment is not of whether a working application can be produced in 48 hours, but of whether disciplined engineering practice can be demonstrated under a realistic constraint — three things in this submission carry the argument.

**The estimate governed the project rather than decorating it.** Use Case Points, cross-checked by COCOMO II, established that the specified system required 2,100–2,500 person-hours against a budget of 36. That number, produced at hour 5, forced five specific descoping decisions at hour 6, each recorded with its released effort and its consequence. Every one of those decisions preserved an architectural seam and deferred the implementation behind it — which is why 140 hours of deferred work became a costed, scheduled repayment plan rather than an unbounded liability.

**The technical debt was priced before it was incurred.** Fifteen items, 246 person-hours, each with cause, impact, urgency classification and an assigned release. The register includes items that reflect badly on the work — a committed credential with no engineering justification, and an authorisation model that is, at the API layer, decorative. A debt register containing no uncomfortable entries is almost always an incomplete one.

**The testing found things, and the report says so.** Twenty-two automated tests pass; five security probes fail, with the response bodies reproduced as evidence. The most valuable single finding — that two red flags shown to patients do not actually escalate — was produced by a property-based assertion over the whole rule set, not by any example-based test, and it is the only defect in the register with direct clinical consequence.

What the project does **not** claim is equally important. The rule content is not clinically validated. The system is not safe for real patient data until four Critical debt items are repaid. The payment gate, the notification queue and the consultation media path are simulations, and are labelled as such everywhere they appear. Stating these plainly costs nothing that matters and is the difference between a demonstrator and a misrepresentation.

The complete lifecycle demanded by the brief — Requirements → Effort Estimation → Analysis → Design → Implementation → Testing → Technical Debt Management → Deployment → Documentation → Maintenance → Future Evolution — has been traversed, with each stage producing artefacts that the next stage actually used. The requirements drove the estimate; the estimate drove the scope; the scope decisions generated the debt register; the debt register set the evolution roadmap; and the testing verified, and in five cases refuted, the claims made earlier in the chain. That closed loop, rather than the running application, is the substance of what is submitted here.

---

# 19. References

1. Karner, G. (1993). *Resource Estimation for Objectory Projects*. Objective Systems SF AB. — Use Case Points method and the 20 person-hours-per-UCP calibration.
2. Boehm, B. W., Abts, C., Brown, A. W., Chulani, S., Clark, B. K., Horowitz, E., Madachy, R., Reifer, D., & Steece, B. (2000). *Software Cost Estimation with COCOMO II*. Prentice Hall. — Scale factors, effort multipliers and the schedule equation used in §7.8.
3. IEEE Computer Society (1998). *IEEE Std 830-1998: Recommended Practice for Software Requirements Specifications*. — SRS structure.
4. Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson. — Lifecycle models, maintenance categories, requirements engineering process.
5. Pressman, R. S., & Maxim, B. R. (2020). *Software Engineering: A Practitioner's Approach* (9th ed.). McGraw-Hill. — Design principles, testing strategy, maintenance taxonomy.
6. Cunningham, W. (1992). *The WyCash Portfolio Management System*. OOPSLA '92 Experience Report. — Origin of the technical debt metaphor.
7. Fowler, M. (2009). *Technical Debt Quadrant*. martinfowler.com. — The deliberate/inadvertent × prudent/reckless classification used in the debt register.
8. Kruchten, P., Nord, R. L., & Ozkaya, I. (2012). Technical Debt: From Metaphor to Theory and Practice. *IEEE Software*, 29(6), 18–21. — Debt management and repayment planning.
9. Clegg, D., & Barker, R. (1994). *Case Method Fast-Track: A RAD Approach*. Addison-Wesley. — MoSCoW prioritisation.
10. OWASP Foundation (2021). *OWASP Top 10 Web Application Security Risks*. — Security assessment framework used in the Testing Report.
11. Nielsen, J. (1994). *Enhancing the Explanatory Power of Usability Heuristics*. CHI '94. — Usability heuristics applied in the Testing Report.
12. Manchester Triage Group (2014). *Emergency Triage* (3rd ed.). BMJ Books. — Conceptual reference for urgency banding structure only; no rule content is derived from it.
13. World Wide Web Consortium (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. — Accessibility target referenced in NFR-17.
14. HL7 International (2019). *FHIR Release 4 Specification*. — Interoperability target for v3.0.
15. Beck, K. (2002). *Test-Driven Development: By Example*. Addison-Wesley. — Test design influence, particularly property-based assertion over example-based testing.

## Acknowledgement of Third-Party Components

In accordance with Examination Rule 6, all external frameworks, libraries and services used are acknowledged:

| Component | Version | Licence | Use |
| :--- | :--- | :--- | :--- |
| Next.js | 15.1.7 | MIT | Application framework |
| React / React DOM | 19.0.0 | MIT | UI runtime |
| Prisma / @prisma/client | 5.22.0 | Apache-2.0 | ORM and schema tooling |
| Tailwind CSS | 3.4.17 | MIT | Styling |
| bcryptjs | 3.0.3 | MIT | Password hashing |
| Framer Motion | 12.4.7 | MIT | Animation |
| lucide-react | 0.475.0 | ISC | Icons |
| ollama (JS client) | 0.6.3 | MIT | LLM inference client |
| @supabase/supabase-js, @supabase/ssr | 2.48.1 / 0.5.2 | MIT | Database client utilities |
| clsx, tailwind-merge | 2.1.1 / 3.0.1 | MIT | Class-name utilities |
| TypeScript | 5.7.3 | Apache-2.0 | Language and type checking |
| tsx | 4.23.12 | MIT | TypeScript execution for tests |
| AdminHMD HTML template | — | Licensed template | Base interface component system |
| Vercel | — | Commercial (free tier) | Hosting and CI/CD |
| Neon | — | Commercial (free tier) | Managed PostgreSQL |
| Ollama Cloud | — | Commercial | LLM inference |
| Mermaid / mermaid.ink | — | MIT | Diagram authoring and rendering |
| Unsplash | — | Unsplash Licence | Placeholder avatar imagery in seed data |

---

**Submitted by Ernest Nketia Asubonteng (Index No. 22424715)**
**CSCD 602 Advanced Software Engineering — Individual Project-Based Examination**
**Department of Computer Science, University of Ghana — 12 August 2026**
