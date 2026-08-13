---
title: "Consolidated Project Documentation"
subtitle: "PulseTriage — Telehealth Appointment & Urgency Auto-Triage System"
author: "Ernest Nketia Asubonteng (22424715)"
date: "CSCD 602 Advanced Software Engineering · University of Ghana"
lang: en-GB
---

# CONSOLIDATED PROJECT DOCUMENTATION

| Field | Detail |
|---|---|
| Student | Ernest Nketia Asubonteng — 22424715 |
| Course | CSCD 602 Advanced Software Engineering |
| Examiner | Prof. Solomon Mensah |
| Live application | <https://pulsetriage.vercel.app> |
| Repository | <https://github.com/NketiaAsubontengErnest/pulsetriage> |

**Companion documents.** To keep this document within a readable length, four
subjects are specified in depth elsewhere and are only summarised here. Nothing
is duplicated between them.

| Document | Holds the detail for |
|---|---|
| `SRS.docx` | The full requirement catalogue (§6 here summarises it) |
| `Testing_Report.docx` | Test cases and executed results (§11) |
| `Technical_Debt_Plan.docx` | Debt register and repayment plan (§12) |
| `User_Manual.docx` | Operating instructions for each role (§14) |
| `Deployment_and_Source_Links.txt` | URLs, credentials, walkthrough (§13) |

---

# 1. Project Title

**PulseTriage — A Telehealth Appointment and Urgency Auto-Triage System**

A web application that assesses the clinical urgency of a patient's symptoms
before an appointment is booked, so that an outpatient queue is ordered by
clinical need rather than by who contacted the clinic first.

---

# 2. Problem Statement

In a conventional outpatient department, the order in which patients are seen is
decided by the order in which they arrive or telephone. Clinical urgency plays no
part until a clinician is physically in the room with the patient. Four
consequences follow.

**Urgency is invisible at the point of scheduling.** A patient with exertional
chest pain and a patient collecting a repeat certificate occupy identical
positions in the queue. The clinic has no signal that would let it distinguish
them, because no assessment has taken place.

**The clinician starts the consultation uninformed.** History-taking begins at
the appointment. Time that could have been spent on examination is spent on
questions the patient has already answered to a receptionist.

**Telephone scheduling loses slots.** Two callers can be promised the same slot
because no shared, authoritative record of availability exists at the moment of
the promise.

**Prioritisation decisions leave no trace.** When a patient asks why they waited,
or a clinical governance review asks how a case was handled, there is no record
of the reasoning.

The consequence is not merely inconvenience. A patient whose condition is
deteriorating waits behind patients whose conditions are not, and nobody in the
system knows.

## 2.1 Why Software Is an Appropriate Response

The decision "how urgent is this?" is rule-governed, repeatable and currently
performed inconsistently by people under time pressure. That is a good fit for
software: a deterministic rule engine applies the same standard to every patient
and can explain its reasoning afterwards. Scheduling against a single
authoritative record eliminates the double-booking that telephone scheduling
cannot prevent.

What software must **not** do here is decide clinical outcomes. The system
prioritises and schedules; the clinician diagnoses and treats.

---

# 3. Aim and Objectives

## 3.1 Aim

To design, build, test and deploy a working telehealth system that orders
outpatient care by assessed clinical urgency, delivers the patient's case history
to the clinician before the consultation, and records the basis of every
prioritisation decision.

## 3.2 Objectives

| # | Objective | Met by |
|---|---|---|
| O-1 | Elicit, analyse and prioritise requirements before writing code | §5, `SRS.docx` |
| O-2 | Produce a defensible effort estimate and let it govern scope | §7 |
| O-3 | Design the architecture, data model and interfaces before implementation | §9 |
| O-4 | Implement a deterministic, explainable triage engine | §10.2 |
| O-5 | Guarantee that a red-flag presentation cannot result in a booking | §10.2, FR-2.6 |
| O-6 | Bind scheduling to real clinician availability and make double-booking impossible | §10.3 |
| O-7 | Deliver a working two-way video consultation | §10.4 |
| O-8 | Test the system at unit, integration, system and acceptance levels | §11 |
| O-9 | Identify technical debt honestly and plan its repayment | §12 |
| O-10 | Deploy publicly and verify the running system | §13 |

---

# 4. Stakeholders

## 4.1 Stakeholder Register

| Stakeholder | Interest | Influence | What they need from the system |
|---|---|---|---|
| **Patient** | Primary user | Low | To be seen in proportion to how unwell they are; to understand what is happening |
| **Clinician** | Primary user | High | A queue ordered by need; the case history before the consultation opens |
| **Platform administrator** | Operator | High | Control of who may practise on the platform; visibility of activity |
| **Clinic management** | Sponsor | High | Shorter waits for urgent cases without additional staff |
| **Clinical governance** | Assurance | High | Evidence of why each case was prioritised as it was |
| **Data protection officer** | Compliance | Medium | Confidence that personal health data is confined and auditable |
| **Examiner** | Assessor | High | Evidence of engineering method, not only a working artefact |
| **Maintainer (future)** | Successor | Low | A codebase and a debt register they can act on |

## 4.2 Analysis

Two stakeholders shape the design most strongly and pull in opposite directions.

The **patient** is the least technically skilled user and the most likely to be
anxious or unwell. They need the interface to be unambiguous and to fail safe.
The **clinician** is time-pressured and needs density: as much clinical context
as possible, as close to the consultation as possible.

Where the two conflict, the patient's clarity takes precedence, because the
patient bears the risk of misunderstanding. This produced two concrete decisions:
an EMERGENCY result removes the booking control entirely rather than merely
warning, and the clinician's dense clinical panel is placed beside the
consultation rather than in the patient's path.

**Clinical governance** is the stakeholder most often forgotten in a student
project and is the reason the audit trail exists at all: a prioritisation
decision that cannot be reconstructed cannot be defended.

---

# 5. Requirements Analysis

## 5.1 Elicitation Approach

With no live client available inside the examination window, requirements were
derived from four substitute sources, in descending order of weight:

1. **Documented triage practice.** The concept of a red-flag short-circuit —
   where certain findings bypass scoring entirely — is taken from established
   emergency-triage practice. The specific rule content here is illustrative and
   is *not* clinically validated; this is stated in the interface itself.
2. **Problem decomposition.** Each consequence in §2 was traced to the
   requirement that addresses it (§5.2).
3. **Stakeholder role analysis.** Each register entry in §4.1 was asked what it
   must be able to do, producing the user-class actions in the SRS.
4. **Regulatory context.** The Ghana Data Protection Act and WCAG 2.1 AA
   supplied non-functional constraints.

The weakness of this approach is honestly stated: requirements derived without a
real clinician carry the risk that the rule content is plausible rather than
correct. This is recorded as a limitation (§17), not glossed over.

## 5.2 From Problem to Requirement

| Problem (§2) | Requirement response | Key IDs |
|---|---|---|
| Urgency invisible at scheduling | Assess before booking; score and tier every case | FR-2.1 – FR-2.5 |
| Dangerous presentations queued | Red flags short-circuit and suppress booking | FR-2.6, NFR-5, NFR-6 |
| Clinician starts uninformed | Deliver the intake record to the clinician's workspace | FR-5.1 – FR-5.3 |
| Slots double-booked | Bind slots to published hours; make duplication impossible | FR-3.1 – FR-3.6 |
| No record of reasoning | Persist every assessment; append an audit row per action | FR-2.8, FR-8.5 |

## 5.3 Prioritisation (MoSCoW)

Requirements were prioritised against two questions: *does patient safety depend
on it?* and *is the system coherent without it?* A "yes" to either makes it a
Must.

| Priority | Count | Treatment |
|---|---|---|
| Must | 45 | Delivered in this release |
| Should | 12 | Delivered where the schedule permitted |
| Could | 4 | First to be dropped |
| Won't | 8 | Explicitly out of scope; listed in `SRS.docx` §4.2 |

Two worked examples show the rule in use.

*FR-2.6 (red-flag suppression) is a Must.* A patient with a red flag who is
offered a booking may wait at home instead of going to hospital. The failure
mode is harm, so no other consideration outranks it.

*FR-7.4 (showing agreement between AI models) is a Could.* It improves a
clinician's ability to judge a suggestion, but its absence changes nothing about
safety or coherence — the clinician still reviews every suggestion before signing.

---

# 6. Software Requirements Specification (Summary)

The complete specification is `SRS.docx`. It is written as a pre-implementation
document: it states what the system *shall* do, and deliberately contains no
report of what was built or tested.

It defines **61 functional requirements** across nine groups and **24
non-functional requirements** across six categories, each with a stated
verification method.

| Group | Subject | Count |
|---|---|---|
| FR-1 | Account and access management | 10 |
| FR-2 | Symptom triage and safety screening | 12 |
| FR-3 | Clinician availability and scheduling | 10 |
| FR-4 | Payment | 6 |
| FR-5 | Clinical workflow | 6 |
| FR-6 | Video consultation | 7 |
| FR-7 | AI-assisted documentation and support | 6 |
| FR-8 | Administration and governance | 7 |
| FR-9 | Notification and enquiry | 4 |
| NFR | Performance, safety, security, reliability, usability, maintainability | 24 |

Two requirements are singled out in the SRS as carrying disproportionate weight:

- **FR-2.6** — the red-flag short-circuit. The only safety-critical requirement.
- **FR-3.6** — exactly one appointment may result from concurrent attempts on a
  single slot, enforced by the database rather than by application logic.

---

# 7. Software Effort Estimation

## 7.1 Technique Selected, and Why

**Use Case Points (UCP)** was selected.

| Technique | Why not chosen |
|---|---|
| COCOMO II | Calibrated on lines of code; no reliable size estimate exists before construction, and its industry productivity constants assume a team |
| Function Point Analysis | Strong for transaction-heavy data systems, but weakly expressive for interaction-heavy features such as a video consultation room |
| Story points | Relative, not absolute; requires a team velocity that a solo first-time project does not have |
| Expert judgement | No comparable prior project to anchor against |

UCP was chosen because the requirements were already expressed as role-based
interactions, because it accounts explicitly for technical and environmental
factors — both unusual here — and because it yields absolute person-hours that
can be compared against a fixed 48-hour budget.

## 7.2 Calculation

**Unadjusted Actor Weight.** Three human actors through a graphical interface
(complex, weight 3); one external inference API (simple, weight 1).

> UAW = (3 × 3) + (1 × 1) = **10**

**Unadjusted Use Case Weight.** Twenty use cases classified by transaction count.

| Class | Criterion | Count | Weight | Subtotal |
|---|---|---|---|---|
| Simple | ≤ 3 transactions | 10 | 5 | 50 |
| Average | 4–7 transactions | 8 | 10 | 80 |
| Complex | > 7 transactions | 2 | 15 | 30 |
| | | | **UUCW** | **160** |

> UUCP = UAW + UUCW = 10 + 160 = **170**

**Technical Complexity Factor.** Thirteen factors rated 0–5. Security (5),
usability (5), performance (4) and concurrency (4) rated high; training needs (1)
and reusability (2) low.

> TFactor = 44 → TCF = 0.6 + (0.01 × 44) = **1.04**

**Environmental Complexity Factor.** Eight factors. Requirement stability (4) and
motivation (5) rated high; process familiarity (3) moderate, reflecting a first
formal application of the method.

> EFactor = 24 → ECF = 1.4 − (0.03 × 24) = **0.68**

> **UCP = 170 × 1.04 × 0.68 = 120.2**

## 7.3 Estimated Effort and Duration

| Productivity factor | Basis | Person-hours | Person-days (8 h) |
|---|---|---|---|
| 20 h/UCP | Karner's original industry figure | 2,404 | 301 |
| 15 h/UCP | Experienced team, familiar stack | 1,803 | 225 |
| 5 h/UCP | Aggressive: solo, no coordination, no formal QA | 601 | 75 |

**Estimated duration at the industry figure: approximately 15 person-months.**

**Budget available: 48 hours.**

The shortfall is a factor of **50**. This is the single most important number in
the project, and it is reported rather than concealed.

## 7.4 Assumptions and Constraints

**Assumptions.** One developer throughout; requirements stable once baselined;
the technology stack is already familiar; no time for formal review cycles;
AI pair-programming assistance is available.

**Constraints.** 48 hours fixed and non-negotiable; one person; no budget, so
free tiers only; no payment provider; no clinical advisor; no second developer to
review code.

## 7.5 How the Estimation Governed Scope

The estimate did not predict how long the work would take — it demonstrated that
the full specification was unbuildable in the window. Its value was in forcing
three decisions *before* any code was written.

**Decision 1 — Build Must only, and say so.** Everything below Must was moved to
a later release and recorded in `SRS.docx` §4.2 as an explicit exclusion, so that
absence reads as a decision rather than an oversight.

**Decision 2 — Simulate where integration cost dominates.** Payment settlement
and message delivery are each small in logic and large in integration: merchant
onboarding, gateway credentials, webhook handling, an SMS provider. Both were
simulated behind interfaces shaped for the real thing. This bought roughly a day
of the 48 hours and is logged as debt TD-11 and TD-12.

**Decision 3 — Spend the saved time on safety, not on breadth.** The hours
released were spent on the red-flag short-circuit and its tests, and on making
double-booking impossible at the database level. Both are places where a defect
causes harm rather than annoyance.

**Observed outcome.** The delivered scope corresponds to an effective
productivity of about **0.4 h/UCP**, against the 20 h/UCP industry figure. That
ratio is not a claim of fifty-fold personal productivity; it reflects AI-assisted
implementation, a familiar stack, the absence of coordination overhead, and — most
of all — the deliberate substitution of simulated components and documented debt
for production hardening. The debt is the unpaid remainder of the estimate, and
`Technical_Debt_Plan.docx` prices it.

---

# 8. System Analysis

## 8.1 Analysis of the Existing Process

| Step today | Actor | Weakness |
|---|---|---|
| Patient telephones or attends | Patient | No assessment occurs |
| Receptionist offers next free slot | Receptionist | Ordered by arrival; availability held informally |
| Patient waits | Patient | Position unrelated to clinical need |
| Clinician takes history | Clinician | History-taking begins at the appointment |
| Notes filed | Clinician | Prioritisation reasoning not recorded |

## 8.2 Analysis of the Proposed Process

| Step | Actor | Improvement |
|---|---|---|
| Patient completes guided assessment | Patient / engine | Urgency established before scheduling |
| Engine screens red flags | Engine | Dangerous presentations diverted to emergency care |
| Slots generated from published hours | System | Availability authoritative; duplication impossible |
| Queue ordered by tier | System | Clinician sees the sickest patient first |
| Intake record shown in consultation | Clinician | Consultation opens informed |
| Every action appended to audit trail | System | Reasoning reconstructable |

## 8.3 Feasibility

| Dimension | Assessment |
|---|---|
| Technical | Feasible. No component requires unavailable technology; WebRTC removes the need for a media server |
| Economic | Feasible. Built entirely on free tiers; no licence cost |
| Operational | Partly feasible. Depends on clinicians maintaining their published hours (assumption A-3) |
| Legal | **Conditional.** Not deployable with real patient data until TD-01 and TD-03 are closed |
| Schedule | Feasible only for the reduced scope defined in §7.5 |

The legal row is the significant one and is stated plainly in the deployment
notes: the demonstrator must not receive real personal or medical data.

---

# 9. System Design

Eight diagrams were produced. All are in `Supporting_Files/images/`, with editable
Mermaid sources and mermaid.live links in `Supporting_Files/diagrams/`.

Five are reproduced below. Three supporting views — the class diagram, the
component/deployment diagram and the data-flow diagram — are referenced rather
than embedded, to keep this document within its page budget. No diagram is
reproduced in any other document.

## 9.1 System Architecture

![System architecture](images/01-system-architecture.png)

A three-tier arrangement inside one deployable unit. The browser holds
presentation and the WebRTC peer connection; serverless route handlers hold
application logic and are the only component that touches the database; managed
PostgreSQL is the system of record.

Two design rules are visible in the diagram and matter more than the boxes:

- **The rule engine has no outbound dependency.** Triage is pure computation
  over rule data. It cannot fail because a network call failed (FR-2.12).
- **Inference is on a side branch.** The inference API touches only advisory
  features. No clinical or scheduling path passes through it (NFR-16).

## 9.2 Use Case Diagram

![Use case diagram](images/02-use-case.png)

Three human actors and one system actor across the twenty use cases counted in
§7.2. The `«extend»` from *Submit Triage* to *Emergency Redirect* is the
diagrammatic form of FR-2.6: it is an alternative path that terminates the flow,
not a decoration on the normal path.

## 9.3 Entity–Relationship Diagram

![Entity–relationship diagram](images/03-er-diagram.png)

Eleven entities. Three features of the model deserve comment.

**`appointments.slot_key`** holds `"<date>_<start_time>"` while an appointment
occupies a slot, and `NULL` once cancelled. A unique constraint on
`(doctor_id, slot_key)` makes a duplicate booking impossible; because PostgreSQL
permits many `NULL`s in a unique index, cancellation genuinely releases the slot.
This is how FR-3.6 is met in the database rather than in application code.

**`room_signals` and `room_presence`** carry WebRTC offer/answer/ICE exchange and
participant heartbeats. Using the database as the signalling channel removes the
need for a websocket server that serverless hosting would not sustain.

**`audit_logs`** has no update or delete path in the application.

## 9.4 Class Diagram

> **See `Supporting_Files/images/04-class-diagram.png`.**

Domain types, the rule engine and the service modules. The engine is a pure
function of `(TriageInput, DynamicTriageRule[]) → TriageResult`, which is what
makes FR-2.9 (identical output for identical input) testable without a database.

## 9.5 Sequence Diagram — Triage to Confirmed Booking

![Sequence diagram](images/05-sequence-triage-booking.png)

The primary path. The interaction worth tracing is the booking write: the server
re-checks availability, then performs the insert inside a transaction that also
writes the clinician's notification and the audit row. A failure at any point
leaves none of the three.

## 9.6 Activity Diagram — Triage Evaluation

![Activity diagram](images/06-activity-triage.png)

The decision structure of the engine, showing the red-flag branch terminating
before the scoring path is reached.

## 9.7 Component and Deployment Diagram

> **See `Supporting_Files/images/07-component-deployment.png`.**

Components and their deployment onto the serverless platform, the managed
database and the browser.

## 9.8 Data-Flow Diagram (Level 1)

> **See `Supporting_Files/images/08-dfd-level1.png`.**

Five processes and six data stores, showing where personal health information
comes to rest — the basis of the data-protection assessment in §8.3.

## 9.9 Interface Design

No separate wireframes were produced. The interface was designed directly in
code against a written design system, and the running application is the
artefact. The system defines semantic colour tokens, a serif/sans type pairing,
a 4/8-pixel spacing scale, and one focus treatment applied everywhere.

Three interface rules follow from requirements rather than taste:

| Rule | Requirement |
|---|---|
| An EMERGENCY result presents no booking control anywhere on the view | FR-2.6 |
| Colour never carries meaning alone; an icon or text accompanies it | UI-6 |
| Every field has a visible label and its error message sits beside it | UI-4, UI-5 |

---

# 10. Implementation

## 10.1 Technology Stack and Justification

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19 | One project for interface and API; first-class serverless deployment |
| Language | TypeScript 5.7 | Compile-time checking substitutes for the code review a solo project lacks |
| Styling | Bootstrap 5.3 + a hand-written CSS layer | Accessible primitives out of the box; no build step to configure |
| ORM | Prisma 5.22 | Declarative schema, generated types, reproducible migration |
| Database | PostgreSQL (Neon) | Free managed tier; partial-unique-index behaviour needed for `slot_key` |
| Media | Native WebRTC | Peer-to-peer; no media server to run or pay for |
| Inference | Ollama Cloud | Multiple models behind one API; advisory use only |
| Hosting | Vercel | Zero-configuration deployment from the repository |

## 10.2 Triage Engine

Rules are data, not branches. Each carries a condition, weight, priority and
active flag, so a rule can be changed without touching evaluation logic (NFR-22).

Evaluation is ordered: critical red flags are tested **first** and terminate the
computation at score 95 with tier EMERGENCY. Only if no critical flag is present
does scoring proceed — severity × 8, plus an onset bonus, plus 10 per remaining
red flag, capped at 100 — followed by banding at the fixed boundaries.

The engine is a pure function with no I/O, which is why its 22 unit tests need
no database and run in under a second.

## 10.3 Scheduling and the Concurrency Guarantee

Bookable slots are generated from the clinician's published consulting hours by
one shared module used by three callers: the clinician's availability manager,
the patient's booking picker, and the server-side booking guard. Before this
module existed, those three disagreed with one another.

The concurrency guarantee has two layers. The server re-checks availability and
performs the insert inside a transaction; underneath, the unique constraint on
`(doctor_id, slot_key)` makes a duplicate physically impossible. The first layer
produces a friendly message; the second is what makes the guarantee true.

## 10.4 Consultation Room

Media is peer-to-peer WebRTC. Signalling — offer, answer, ICE candidates, chat —
is exchanged by polling a database-backed room endpoint, which avoids a
websocket server that the hosting model would not support.

Two implementation decisions came from defects found in testing. Camera and
microphone are acquired **independently**, because requesting both together meant
a camera already held by another application also cost the user their microphone.
The remote participant's audio plays through a dedicated `<audio>` element rather
than the video element, because browsers refuse to autoplay a video carrying
sound — the earlier arrangement silenced the consultation to keep the picture.

## 10.5 Security Controls Implemented

| Control | Implementation |
|---|---|
| Password storage | bcrypt, cost 10; never returned by any endpoint |
| Password policy | ≥ 8 characters with upper, lower, digit and symbol; enforced on client **and** server |
| Transport | HTTPS throughout |
| Input validation | Server-side validation on every write path |
| Secret management | Environment variables only; automated scanner plus a pre-commit hook |
| Data integrity | Multi-record writes wrapped in transactions |
| Least exposure | The consultation endpoint returns the patient brief only to the clinician's poll |

Controls **not** implemented are listed in §17 and priced in
`Technical_Debt_Plan.docx`. The most significant is that API routes do not verify
the caller's identity server-side.

## 10.6 Scale of the Delivered System

| Measure | Value |
|---|---|
| Application pages | 25 |
| API route handlers | 26 |
| React components | 15 |
| Database entities | 11 |
| Lines of TypeScript/TSX | ≈ 16,800 |
| Automated tests | 44, all passing |

---

# 11. Testing (Summary)

Full detail, including every test case with expected and actual results, is in
`Testing_Report.docx`.

| Level | Approach | Result |
|---|---|---|
| Unit | 44 automated tests over the rule engine, scheduling arithmetic and note composition | 44 / 44 pass |
| Static | `tsc --noEmit` across the codebase | 0 errors |
| Integration | API routes exercised against the live database | Pass |
| System | End-to-end journeys per role | Pass |
| Acceptance | Scenario walkthroughs against the acceptance criteria | Pass |
| Performance | 30,000-evaluation latency harness (NFR-1) | Within budget |
| Security | 9 probes against the deployment | 4 pass, 5 fail as expected |

The five failing security probes are not surprises. They are the evidence for
defects D-01 and D-05 — the absence of server-side authorisation — and they are
reported as failures rather than adjusted away.

---

# 12. Technical Debt (Summary)

Full detail is in `Technical_Debt_Plan.docx`, which records each item as
**Debt → Cause → Impact → Priority → Proposed Resolution**.

| Classification | Count | Meaning |
|---|---|---|
| Critical — immediate attention | 3 | Blocks any real-patient deployment |
| Scheduled for resolution | 9 | Accepted now; dated for a named release |
| Acceptable temporarily | 5 | Proportionate to a demonstrator; revisit if scope grows |

The three critical items are the absence of server-side authorisation (TD-01),
credentials remaining in Git history (TD-02), and unsigned session state in
browser storage (TD-03). Together they are why §8.3 records the legal
feasibility as conditional.

Debt closed during the examination period is listed in
`Deployment_and_Source_Links.txt` §7.

---

# 13. Deployment

The application is deployed on Vercel and builds automatically from the `main`
branch. The database is managed PostgreSQL on Neon, reached over TLS with the
connection string supplied as an environment variable.

| Item | Value |
|---|---|
| Live application | <https://pulsetriage.vercel.app> |
| Administrator entry point | <https://pulsetriage.vercel.app/admin> |
| Repository | <https://github.com/NketiaAsubontengErnest/pulsetriage> |

Credentials for every role, a suggested twelve-minute walkthrough, and
instructions for reproducing the build locally are in
`Deployment_and_Source_Links.txt`.

**Deployment verification.** After each deployment the following are checked:
the application responds; authentication succeeds for each role; a triage
evaluation returns the expected tier; a booking writes to the database; and
`GET /api/ai/health` reports whether the inference layer is reachable. That last
endpoint exists because the most likely production failure is a missing
environment variable, and a diagnostic that says so is worth more than a generic
error.

---

# 14. User Manual (Summary)

`User_Manual.docx` is the operating guide, written for readers who have not used
the system before. It covers signing in, the patient journey from assessment to
consultation notes, the clinician's queue and consultation workspace,
administrative functions, and a troubleshooting section.

It is deliberately free of implementation detail: it explains what the reader
sees and what to do next, not how the system works internally.

---

# 15. Maintenance Strategy

## 15.1 The Four Maintenance Types

| Type | What it covers here | Trigger | Target response |
|---|---|---|---|
| **Corrective** | Defects in delivered behaviour | Report or monitoring | Safety-related: same day. Others: next release |
| **Adaptive** | Change in an external dependency — hosting, database, browser APIs, inference provider | Provider notice | Before the deprecation date |
| **Perfective** | Improvements to what already works: performance, usability, refactoring | Metrics or feedback | Scheduled into releases |
| **Preventive** | Work that stops future faults: dependency updates, debt repayment, test coverage | Monthly cycle | Continuous |

## 15.2 Routine Activities

| Cadence | Activity |
|---|---|
| Continuous | Automated tests and type check on every push |
| Weekly | Review audit trail and error logs for anomalies |
| Monthly | Dependency audit; patch security advisories |
| Quarterly | Review the debt register; re-prioritise; accessibility spot-check |
| Annually | Review the clinical rule content with a qualified advisor |

## 15.3 Security and Dependency Maintenance

Security is treated as continuous rather than periodic. The secret scanner runs
in the pre-commit hook, so a credential cannot be committed without deliberate
override. Dependency advisories are reviewed monthly, and any advisory rated high
or critical is patched out of cycle.

The annual clinical review in the table above is the most important recurring
item and the easiest to neglect: rule content that is merely plausible ages
badly, and nothing in the software will report that it has.

## 15.4 Scalability Path

The current arrangement — serverless functions, one managed database, WebRTC
peer-to-peer media — scales horizontally on the application tier without change,
because the application holds no server-side session state. The two limits that
would be reached first are database connection exhaustion under serverless fan-out
(addressed by connection pooling) and the polling-based signalling channel
(addressed by moving to a managed real-time service). Neither is near at
demonstration scale.

---

# 16. Future Evolution

| Release | Theme | Contents |
|---|---|---|
| **v1.1** | Make it safe to hold real data | Server-side authorisation on every route (TD-01); signed, expiring sessions (TD-03); credential rotation and Git history purge (TD-02); rate limiting on authentication and inference (TD-17) |
| **v1.2** | Make it operationally real | Live payment provider; e-mail and SMS delivery; scheduled reminder dispatch; persisted administrator rule edits (TD-04) |
| **v1.3** | Make it defensible | Independent WCAG 2.1 AA audit; clinical validation of rule content; comprehensive PHI read auditing (TD-08); decimal money type (TD-14) |
| **v2.0** | Extend the clinical model | Multi-clinic tenancy; clinician-to-clinician referral; outcome analytics comparing assigned tier against clinical outcome |

The v1.3 outcome analytics deserve emphasis. The system currently assumes its
tiers are correct. Measuring assigned tier against actual outcome is the only way
to discover whether the triage model is right, and until that exists every claim
about its accuracy is unevidenced.

A full technical-debt repayment schedule, mapping each item to one of these
releases, is in `Technical_Debt_Plan.docx` §3.

---

# 17. Limitations

Stated plainly, because a limitation concealed is a defect waiting to be found by
someone else.

**Clinical.** The rule content is illustrative and has not been reviewed by a
qualified clinician. It demonstrates a mechanism, not a validated instrument. The
interface says so; this document says so; it should not be inferred otherwise.

**Security.** API routes do not verify the caller's identity server-side. Role
separation is enforced in the browser only, which means a determined caller can
reach data belonging to another user. The deployment must therefore not receive
real personal or medical data. This is the single most serious limitation.

**Functional.** Payments are simulated. Notifications are in-application only.
Administrator rule edits do not reach the patient-facing engine. Reminders are
written at booking rather than dispatched at the reminder time.

**Quality assurance.** There is no automated end-to-end browser test suite;
system and acceptance testing were performed manually. Accessibility has been
designed for and measured for contrast, but not audited with assistive
technology. There is no load testing beyond the rule-engine harness.

**Process.** One developer, no code review, no independent tester. Requirements
were derived without a real user. The 48-hour constraint means every judgement
in this document was made once, quickly, and not revisited by anyone else.

---

# 18. Conclusion

PulseTriage delivers a working telehealth system that assesses clinical urgency
before scheduling, guarantees that a red-flag presentation cannot produce a
booking, binds appointments to real clinician availability with a database-level
guarantee against duplication, and carries a two-way video consultation with the
patient's record beside it. Forty-four automated tests pass, the system is
deployed publicly, and every action it takes is recorded.

The engineering claim worth making is not that the system is complete — it is
not, and §17 says where. It is that the incompleteness is *known, priced and
scheduled*. The effort estimate showed at the outset that the full specification
was fifty times larger than the available budget. Scope was cut deliberately
rather than by attrition, the substitutions were made behind interfaces shaped
for their replacements, and what was traded away was written down as debt with a
resolution and a release attached.

The most valuable output of the exercise is therefore not the running
application. It is the demonstration that a project can be delivered under a
severe constraint without pretending the constraint had no cost.

---

# 19. References

1. IEEE Std 830-1998, *Recommended Practice for Software Requirements Specifications*. IEEE, 1998.
2. Karner, G. *Resource Estimation for Objectory Projects*. Objective Systems SF AB, 1993.
3. Boehm, B. et al. *Software Cost Estimation with COCOMO II*. Prentice Hall, 2000.
4. Cunningham, W. "The WyCash Portfolio Management System." *OOPSLA '92 Experience Report*, 1992.
5. Kruchten, P., Nord, R. and Ozkaya, I. *Managing Technical Debt: Reducing Friction in Software Development*. Addison-Wesley, 2019.
6. Sommerville, I. *Software Engineering*, 10th edn. Pearson, 2015.
7. Pressman, R. and Maxim, B. *Software Engineering: A Practitioner's Approach*, 9th edn. McGraw-Hill, 2020.
8. W3C. *Web Content Accessibility Guidelines (WCAG) 2.1*. W3C Recommendation, 2018.
9. OWASP Foundation. *OWASP Top 10: 2021*. <https://owasp.org/Top10/>
10. Manchester Triage Group. *Emergency Triage*, 3rd edn. BMJ Books, 2014.
11. Republic of Ghana. *Data Protection Act, 2012 (Act 843)*.
12. Fowler, M. *Refactoring: Improving the Design of Existing Code*, 2nd edn. Addison-Wesley, 2018.
13. Newman, S. *Building Microservices*, 2nd edn. O'Reilly, 2021.
14. Nielsen, J. *Usability Engineering*. Morgan Kaufmann, 1993.

---

*End of Consolidated Project Documentation.*
