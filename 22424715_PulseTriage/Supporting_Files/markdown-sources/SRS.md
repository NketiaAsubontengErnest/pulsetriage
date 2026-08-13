---
title: "Software Requirements Specification"
subtitle: "PulseTriage — Telehealth Appointment & Urgency Auto-Triage System"
author: "Ernest Nketia Asubonteng (22424715)"
date: "CSCD 602 Advanced Software Engineering · University of Ghana"
lang: en-GB
---

# SOFTWARE REQUIREMENTS SPECIFICATION

## PulseTriage — Telehealth Appointment & Urgency Auto-Triage System

| Field | Detail |
|---|---|
| Student | Ernest Nketia Asubonteng — 22424715 |
| Course | CSCD 602 Advanced Software Engineering |
| Examiner | Prof. Solomon Mensah |
| Document status | Baselined for development |
| Standard followed | IEEE 830 (adapted) |

> **Status of this document.** This SRS is a *pre-implementation* specification.
> It states what the system **shall** do; it does not report what has been
> built. Construction status, test evidence and known debt are recorded in the
> companion documents and are deliberately not repeated here.

**Companion documents (no content is duplicated between them):**

| Document | Covers |
|---|---|
| `Project_Documentation.docx` | Problem, stakeholders, estimation, design artefacts, outcome |
| `Testing_Report.docx` | Test cases, executed results, defects |
| `Technical_Debt_Plan.docx` | Debt register and repayment plan |
| `User_Manual.docx` | End-user operating instructions |

---

# 1. Introduction

## 1.1 Purpose

This document specifies the requirements for **PulseTriage**, a web-based
telehealth system that assesses the clinical urgency of a patient's reported
symptoms and schedules an appropriate consultation.

It is written for the developer who will build the system, the examiner who
will assess it, and any future maintainer. It is the authority on *what* the
system must do. It does not prescribe *how* the code should be organised,
except where a constraint is genuinely externally imposed.

## 1.2 Scope of the Software Product

The product is named **PulseTriage**. It shall:

- accept a structured description of a patient's symptoms;
- compute a reproducible urgency score and assign one of four urgency tiers;
- detect a defined set of clinical red flags and, when one is present,
  suppress booking and direct the patient to emergency services;
- recommend a medical specialty appropriate to the presentation;
- allow a patient to book a consultation slot that the chosen clinician has
  genuinely published as available;
- collect a simulated consultation payment and record it;
- present each clinician a work queue ordered by clinical urgency;
- host a two-way video consultation between patient and clinician;
- capture a structured clinical record at the end of each consultation; and
- give administrators oversight of the clinician registry, the triage rules
  and a record of system activity.

The product shall **not**:

- replace emergency medical services;
- issue a medical diagnosis, or act as a regulated medical device;
- move real money; or
- transmit e-mail or SMS.

**Benefits.** Ordering an outpatient queue by clinical need rather than arrival
time reduces the time a genuinely urgent patient waits, and gives the clinician
the case history before the consultation opens.

## 1.3 Definitions, Acronyms and Abbreviations

| Term | Meaning |
|---|---|
| **Triage** | Sorting patients by the urgency of their need for care |
| **Red flag** | A symptom that indicates possible immediate danger to life |
| **Urgency tier** | One of EMERGENCY, URGENT, SEMI_URGENT, ROUTINE |
| **Severity score** | An integer 0–100 produced by the rule engine |
| **Slot** | A bookable interval within a clinician's published consulting hours |
| **PHI** | Protected Health Information |
| **SOAP note** | Subjective, Objective, Assessment, Plan — a clinical note format |
| **WebRTC** | Browser standard for peer-to-peer audio and video |
| **MoSCoW** | Must / Should / Could / Won't — a prioritisation scheme |

## 1.4 References

1. IEEE Std 830-1998, *Recommended Practice for Software Requirements Specifications*.
2. W3C, *Web Content Accessibility Guidelines (WCAG) 2.1*, Level AA.
3. OWASP, *Top 10 Web Application Security Risks*, 2021.
4. Manchester Triage Group, *Emergency Triage*, 3rd edn — consulted for the
   concept of red-flag short-circuiting only. The rule content in this system
   is illustrative and is not clinically validated.
5. Ghana Data Protection Act, 2012 (Act 843).

## 1.5 Overview of the Remainder of this Document

Section 2 describes the product in general terms and the constraints acting on
it. Section 3 states the specific, verifiable requirements. Section 4 records
requirement priority and what has been deferred out of the first release.

---

# 2. Overall Description

## 2.1 Product Perspective

PulseTriage shall be a new, self-contained product. It shall not replace an
existing system and shall not require integration with a hospital information
system in its first release.

It shall be delivered as a single web application, served responsively to
desktop and mobile browsers, backed by one relational database. Two external
services shall be used:

| External service | Role | Failure behaviour required |
|---|---|---|
| Managed PostgreSQL | System of record | Hard dependency — the system may fail |
| LLM inference API | Advisory assistance only | Soft dependency — the system **shall** continue to function fully without it |

The second row is a requirement, not a note: no clinical or scheduling function
may depend on the availability of a language model.

## 2.2 Product Functions (Summary)

| Group | Function |
|---|---|
| Access | Register, sign in, sign out, manage own profile and password |
| Triage | Submit symptoms, receive score, tier, specialty and guidance |
| Safety | Detect red flags, escalate, suppress booking, redirect to emergency care |
| Scheduling | Publish consulting hours; generate slots; book, reschedule, cancel |
| Payment | Take a simulated payment and record the transaction |
| Consultation | Join a video room; exchange chat; capture a clinical record |
| Assistance | Offer AI-drafted clinical documentation and decision support |
| Governance | Verify clinicians, inspect rules, review an activity trail |

## 2.3 User Classes and Characteristics

| User class | Characteristics | Technical skill | Frequency |
|---|---|---|---|
| **Patient** | Adult, possibly unwell or anxious, often on a phone | Low; must not be assumed | Occasional |
| **Clinician** | Registered doctor, time-pressured, works a queue | Moderate | Daily |
| **Administrator** | Operates the platform, verifies clinicians | High | Weekly |

The patient class is the least skilled and the most likely to be under stress.
Where a design conflict arises between user classes, the patient's clarity
shall take precedence.

## 2.4 Operating Environment

| Element | Requirement |
|---|---|
| Client | Current versions of Chrome, Edge, Firefox or Safari, desktop and mobile |
| Screen | Shall be usable from 360 px wide upwards |
| Server | Serverless runtime, Node.js 20 or later |
| Database | PostgreSQL 14 or later |
| Media | WebRTC with STUN; no media server shall be required |
| Network | Shall remain usable on a 3G-class mobile connection |

## 2.5 Design and Implementation Constraints

| # | Constraint | Origin |
|---|---|---|
| C-1 | The complete system shall be delivered within a 48-hour examination window | Examination rules |
| C-2 | The work shall be performed by one developer | Examination rules |
| C-3 | Payment shall be simulated; no payment provider may be contacted | No merchant account available |
| C-4 | The system shall be deployable to a free serverless tier | No budget |
| C-5 | Triage logic shall be deterministic and inspectable, not learned | Clinical explainability |
| C-6 | No credential or key shall appear in source control | Security policy |
| C-7 | The clinical rule content is illustrative and unvalidated; the interface shall say so | Professional honesty |

Constraint C-5 is significant: it rules out a machine-learning approach to
triage. A clinician must be able to read why a case scored what it did.

## 2.6 Assumptions and Dependencies

**Assumptions**

- A-1 Patients can describe symptoms through guided selection; free-text
  understanding shall not be required for a valid assessment.
- A-2 One patient equals one account; proxy booking is out of scope.
- A-3 Clinicians will keep their published consulting hours current.
- A-4 A browser with a working camera and microphone is available for video
  consultations; the system shall degrade to audio-only if not.

**Dependencies**

- D-1 Availability of the managed PostgreSQL service.
- D-2 Availability of the serverless hosting platform.
- D-3 Availability of the inference API — **advisory only**, per §2.1.

## 2.7 Apportioning of Requirements

Requirements marked **Must** in §4 shall be delivered in the first release.
Requirements marked **Should**, **Could** or **Won't** are apportioned to later
releases and are listed in §4.2.

---

# 3. Specific Requirements

Every requirement below is stated so that it can be verified by inspection,
demonstration or test. The verification method is named in each table.

## 3.1 External Interface Requirements

### 3.1.1 User Interfaces

| # | Requirement | Verification |
|---|---|---|
| UI-1 | The interface shall be responsive and fully operable from 360 px width upwards, with no horizontal scrolling | Demonstration |
| UI-2 | Every interactive control shall present a touch target of at least 44 × 44 px | Inspection |
| UI-3 | Text shall meet a contrast ratio of at least 4.5:1 against its background | Measurement |
| UI-4 | Every form field shall carry a persistently visible label; a placeholder alone shall not suffice | Inspection |
| UI-5 | Validation errors shall appear adjacent to the field in error and shall state how to correct it | Inspection |
| UI-6 | Colour shall never be the sole carrier of meaning; an icon or text shall accompany it | Inspection |
| UI-7 | An EMERGENCY result shall be visually distinct from all other tiers and shall present no booking control | Demonstration |
| UI-8 | The interface shall honour the operating system's reduced-motion preference | Inspection |

### 3.1.2 Hardware Interfaces

| # | Requirement | Verification |
|---|---|---|
| HW-1 | The system shall request camera and microphone access only when a consultation room is opened | Demonstration |
| HW-2 | Where only one of camera or microphone is available, the system shall proceed with the one it has and state clearly which is missing | Test |

### 3.1.3 Software Interfaces

| # | Requirement | Verification |
|---|---|---|
| SI-1 | All persistence shall be through one relational database accessed via an ORM | Inspection |
| SI-2 | Inference calls shall be made over HTTPS with the key supplied by environment variable only | Inspection |
| SI-3 | Where inference is unavailable, the caller shall receive an explicit failure indication; fabricated clinical content shall never be substituted | Test |

Requirement SI-3 is a safety requirement. A canned "fallback" that reads like a
generated clinical answer is worse than no answer, because the clinician cannot
tell the difference.

### 3.1.4 Communications Interfaces

| # | Requirement | Verification |
|---|---|---|
| CI-1 | All traffic shall be carried over HTTPS | Inspection |
| CI-2 | Consultation media shall travel peer-to-peer; media shall not be relayed through the application server | Inspection |
| CI-3 | Signalling messages shall be exchanged through the application's own persistence layer, so that no separate socket server is required | Inspection |

## 3.2 Functional Requirements

Priority uses MoSCoW. **M** = Must, **S** = Should, **C** = Could.

### FR-1 Account and Access Management

| # | Requirement | Pri | Verification |
|---|---|---|---|
| FR-1.1 | The system shall allow a visitor to register a patient account with full name, e-mail, phone and password | M | Test |
| FR-1.2 | The system shall reject a registration whose e-mail already exists | M | Test |
| FR-1.3 | The system shall store passwords only as a salted one-way hash | M | Inspection |
| FR-1.4 | The system shall require a password of at least 8 characters containing an upper-case letter, a lower-case letter, a digit and a special character, and shall enforce this on the server as well as in the browser | M | Test |
| FR-1.5 | The system shall authenticate a user by e-mail and password and establish a session | M | Test |
| FR-1.6 | The system shall route a signed-in user to the portal matching their role | M | Demonstration |
| FR-1.7 | The system shall prevent a user of one role from reaching another role's portal | M | Test |
| FR-1.8 | The system shall allow a user to change their own name, phone and photograph | S | Test |
| FR-1.9 | The system shall allow a user to change their own password, requiring the current password | S | Test |
| FR-1.10 | The system shall allow a user to sign out and shall discard the session | M | Test |

### FR-2 Symptom Triage and Safety Screening

| # | Requirement | Pri | Verification |
|---|---|---|---|
| FR-2.1 | The system shall collect primary symptom, duration, pain score (1–10) and any red flags | M | Demonstration |
| FR-2.2 | The system shall compute a severity score of 0–100 from the collected inputs | M | Test |
| FR-2.3 | Triage rules shall be held as data, each with a condition, weight and priority | M | Inspection |
| FR-2.4 | The system shall assign a tier using fixed boundaries: ≥80 EMERGENCY, ≥60 URGENT, ≥35 SEMI_URGENT, else ROUTINE | M | Test |
| FR-2.5 | Reported severity shall contribute up to 80 points; onset within two days shall add 15, longer-standing 5; each non-critical red flag shall add 10; the total shall be capped at 100 | M | Test |
| **FR-2.6** | **Where a critical red flag is present the system shall short-circuit to EMERGENCY at score 95, shall present emergency-service guidance, and shall offer no booking control** | **M** | **Test** |
| FR-2.7 | The system shall recommend a medical specialty for every symptom category | M | Test |
| FR-2.8 | The system shall record every completed assessment against the patient's account | M | Test |
| FR-2.9 | The system shall produce identical output for identical input | M | Test |
| FR-2.10 | Where several rules match, the highest-priority rule shall determine the outcome | M | Test |
| FR-2.11 | A deactivated rule shall take no part in evaluation | M | Test |
| FR-2.12 | An assessment shall complete without contacting any external service | M | Test |

FR-2.6 is the single safety-critical requirement in this specification. It shall
be covered by dedicated automated tests, and every red flag offered in the
interface shall be bound to a rule that triggers it.

### FR-3 Clinician Availability and Scheduling

| # | Requirement | Pri | Verification |
|---|---|---|---|
| FR-3.1 | A clinician shall be able to publish consulting hours per weekday, with a start time, end time and slot length | M | Test |
| FR-3.2 | The system shall generate bookable slots only from published consulting hours | M | Test |
| FR-3.3 | A slot already held by a non-cancelled appointment shall not be offered | M | Test |
| FR-3.4 | The system shall reject a booking for a date or time the clinician does not publish | M | Test |
| FR-3.5 | The system shall reject a booking in the past | M | Test |
| **FR-3.6** | **Concurrent attempts to book one slot shall result in exactly one appointment; the others shall be refused with a message inviting another slot** | **M** | **Test** |
| FR-3.7 | Cancelling an appointment shall return its slot to availability | M | Test |
| FR-3.8 | A patient shall be able to reschedule a confirmed appointment without further payment; availability shall be re-checked | S | Test |
| FR-3.9 | A patient shall be able to cancel a confirmed appointment | S | Test |
| FR-3.10 | Slot end time shall be derived from the clinician's configured slot length, not supplied by the client | M | Test |

FR-3.6 shall be enforced by the database itself, not by application logic alone.
An availability check performed before an insert leaves a window in which two
requests can both pass.

### FR-4 Payment

| # | Requirement | Pri | Verification |
|---|---|---|---|
| FR-4.1 | The system shall present the consultation fee before payment | M | Demonstration |
| FR-4.2 | The system shall simulate Mobile Money and card payment | M | Test |
| FR-4.3 | A successful payment shall issue a unique transaction reference and set the appointment to CONFIRMED | M | Test |
| FR-4.4 | A declined payment shall leave the appointment payable and retryable | M | Test |
| FR-4.5 | Every payment attempt shall be recorded with method, provider, amount and outcome | M | Test |
| FR-4.6 | The interface shall state plainly that payment is simulated | M | Inspection |

### FR-5 Clinical Workflow

| # | Requirement | Pri | Verification |
|---|---|---|---|
| FR-5.1 | The system shall present each clinician a queue of their appointments ordered by urgency tier, not booking time | M | Demonstration |
| FR-5.2 | The queue shall show each patient's tier and severity score | M | Demonstration |
| FR-5.3 | A clinician shall be able to open the patient's intake record before and during the consultation | M | Demonstration |
| FR-5.4 | A clinician shall be able to record a structured clinical note and mark the consultation complete | M | Test |
| FR-5.5 | Completing a consultation shall notify the patient and make the note visible to them | M | Test |
| FR-5.6 | A clinician shall be able to see notes from the patient's previous completed consultations | S | Demonstration |

### FR-6 Video Consultation

| # | Requirement | Pri | Verification |
|---|---|---|---|
| FR-6.1 | Patient and clinician shall be able to join a consultation room for a confirmed appointment | M | Demonstration |
| FR-6.2 | The room shall carry two-way audio and video between the participants | M | Demonstration |
| FR-6.3 | The room shall provide text chat alongside the media | S | Demonstration |
| FR-6.4 | Each participant shall be able to mute audio, disable video and control incoming audio | M | Demonstration |
| FR-6.5 | The room shall be usable on a mobile screen, with the remote participant given visual priority | M | Demonstration |
| FR-6.6 | The room shall report clearly which media devices are unavailable and what that means for the other participant | S | Test |
| FR-6.7 | Screen sharing shall be offered where the browser supports it | C | Demonstration |

### FR-7 AI-Assisted Documentation and Decision Support

| # | Requirement | Pri | Verification |
|---|---|---|---|
| FR-7.1 | The system shall offer to draft a structured clinical note from consultation context | S | Demonstration |
| FR-7.2 | The system shall offer clinical decision support in response to a clinician's question | S | Demonstration |
| FR-7.3 | Every AI output shall be attributed to the model that produced it | S | Inspection |
| FR-7.4 | Where several models are consulted, the level of agreement between them shall be shown | C | Inspection |
| FR-7.5 | No AI output shall enter a patient record without explicit clinician review and submission | M | Demonstration |
| FR-7.6 | Where inference is unavailable the interface shall say so explicitly, and shall not present substitute content as AI-generated | M | Test |

### FR-8 Administration and Governance

| # | Requirement | Pri | Verification |
|---|---|---|---|
| FR-8.1 | An administrator shall be able to list, add and verify clinicians | M | Test |
| FR-8.2 | An unverified clinician shall not be offered to patients for booking | M | Test |
| FR-8.3 | An administrator shall be able to inspect the active triage rules | M | Demonstration |
| FR-8.4 | An administrator shall be able to evaluate a hypothetical case against the rules without affecting patient data | S | Demonstration |
| FR-8.5 | The system shall append an audit record for every registration, assessment, booking, payment, profile change and administrative action | M | Test |
| FR-8.6 | Audit records shall not be editable or deletable through the interface | M | Inspection |
| FR-8.7 | An administrator shall be able to review platform metrics | S | Demonstration |

### FR-9 Notification and Enquiry

| # | Requirement | Pri | Verification |
|---|---|---|---|
| FR-9.1 | The system shall raise an in-application notification on booking, payment, reminder and consultation completion | M | Test |
| FR-9.2 | Notifications shall persist and shall survive a reload | M | Test |
| FR-9.3 | The system shall show a count of unread notifications | S | Demonstration |
| FR-9.4 | A visitor shall be able to send an enquiry that reaches an administrator and is recorded | C | Test |

## 3.3 Non-Functional Requirements

### 3.3.1 Performance

| # | Requirement | Verification |
|---|---|---|
| NFR-1 | A triage evaluation shall complete within 200 ms at the 95th percentile, excluding network time | Load harness |
| NFR-2 | Interactive pages and API responses shall complete within 2,000 ms at the 95th percentile over a broadband connection | Measurement |
| NFR-3 | The deployment shall be reachable whenever the hosting platform is available | Probe |
| NFR-4 | Query paths used on every page load shall be served by an index rather than a full table scan | Inspection |

### 3.3.2 Safety

| # | Requirement | Verification |
|---|---|---|
| NFR-5 | No path through the interface shall permit a booking to be made from an EMERGENCY assessment | Test |
| NFR-6 | Every red flag presented to a patient shall be bound to a rule that triggers escalation | Test |
| NFR-7 | The interface shall state that the system does not provide a diagnosis and is not a substitute for emergency care | Inspection |

### 3.3.3 Security

| # | Requirement | Verification |
|---|---|---|
| NFR-8 | Passwords shall be stored only as salted one-way hashes | Inspection |
| NFR-9 | No credential, key or connection string shall be committed to source control | Automated scan |
| NFR-10 | All traffic shall be carried over HTTPS | Inspection |
| NFR-11 | User-supplied input shall be validated on the server before it reaches persistence | Test |
| NFR-12 | Internal error detail shall not be returned to the client | Inspection |
| NFR-13 | Personal data shall be shown only to its subject and to a clinician with a consultation relationship to them | Test |

### 3.3.4 Reliability and Integrity

| # | Requirement | Verification |
|---|---|---|
| NFR-14 | A multi-record operation shall complete entirely or not at all | Test |
| NFR-15 | The system shall not lose a confirmed appointment or a payment record | Test |
| NFR-16 | Failure of the inference service shall not affect triage, booking or consultation | Test |

### 3.3.5 Usability and Accessibility

| # | Requirement | Verification |
|---|---|---|
| NFR-17 | A first-time patient shall be able to complete an assessment without instruction | Acceptance test |
| NFR-18 | The interface shall target WCAG 2.1 Level AA | Audit |
| NFR-19 | All functionality shall be reachable by keyboard, with a visible focus indicator | Inspection |
| NFR-20 | The interface shall use British English throughout | Inspection |

### 3.3.6 Maintainability and Portability

| # | Requirement | Verification |
|---|---|---|
| NFR-21 | The codebase shall be statically typed and shall compile without type errors | Build |
| NFR-22 | The triage rules shall be modifiable without altering evaluation logic | Inspection |
| NFR-23 | The schema shall be defined declaratively and applied reproducibly | Inspection |
| NFR-24 | The system shall run on any platform providing Node.js and PostgreSQL | Inspection |

---

# 4. Requirement Priority and Apportioning

## 4.1 Prioritisation Method

Requirements are prioritised by MoSCoW, applied against two questions: *does a
patient's safety depend on it?* and *is the system coherent without it?* A
requirement answering yes to either is a **Must**.

| Priority | Count | Meaning |
|---|---|---|
| Must | 45 | Required for the first release. Safety, or the system is incoherent without it |
| Should | 12 | Materially improves the product; deliverable if time allows |
| Could | 4 | Desirable; first to be dropped under pressure |
| Won't (this release) | see §4.2 | Explicitly out of scope |

## 4.2 Explicitly Out of Scope for This Release

The following are recognised as valuable and are deliberately excluded. They are
recorded here so that their absence is understood as a decision rather than an
omission.

| Item | Reason for exclusion |
|---|---|
| Real payment settlement | No merchant account; C-3 |
| E-mail and SMS delivery | No gateway available within the window |
| Electronic prescription transmission | Requires regulatory approval |
| Integration with a hospital information system | No counterparty |
| Native mobile applications | The responsive web interface serves the same need |
| Multi-language interface | English is sufficient for the target setting |
| Clinical validation of rule content | Requires a qualified clinical advisor; C-7 |
| Machine-learned triage | Excluded on explainability grounds; C-5 |

## 4.3 Requirements Traceability

Each requirement identifier in §3 is referenced by the corresponding test case
in `Testing_Report.docx`, and each design artefact in `Project_Documentation.docx`
names the requirements it realises. No requirement in this document is left
without a stated verification method.

---

*End of Software Requirements Specification.*
