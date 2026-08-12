# Software Requirements Specification (SRS)
## Telehealth Appointment & Triage System

**Version:** 1.0
**Date:** August 12, 2026
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for the **Telehealth Appointment & Triage System**, a web-based platform that enables patients to register, report symptoms, receive automated urgency classification, and book appointments with doctors. It also enables doctors to manage availability and consultations, and administrators to oversee system operations. This SRS is intended for developers, QA engineers, project stakeholders, and clinical advisors involved in the design, build, and validation of the system.

### 1.2 Scope
The system addresses the problem of manual, delay-prone scheduling and inconsistent triage of urgent non-emergency cases in outpatient/telehealth settings. It will:

- Allow patients to self-register and submit structured symptom data.
- Automatically classify case urgency using a rule-based triage engine.
- Allow doctors to define availability and manage bookings.
- Allow patients to book, reschedule, or cancel appointments based on triage priority and doctor availability.
- Provide role-based dashboards for Patients, Doctors, and Admins.
- Simulate a payment gate for consultation fees (non-production-grade, for demonstration/testing).
- Queue and simulate delivery of notifications (appointment confirmations, triage alerts, reminders).

**Out of scope (v1.0):** real-time video/audio consultation infrastructure, real payment processor integration, e-prescription and pharmacy integration, insurance claims processing, and full HIPAA/GDPR certification (architecture will be designed to be compliance-ready, but formal certification is out of scope).

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| SRS | Software Requirements Specification |
| Triage | Process of determining the priority/urgency of a patient's case |
| Rule Engine | Software component that evaluates symptom inputs against predefined clinical rules to output an urgency level |
| Slot | A discrete, bookable unit of a doctor's schedule (e.g., 15/30 min) |
| RBAC | Role-Based Access Control |
| PII/PHI | Personally Identifiable Information / Protected Health Information |
| Admin | System administrator responsible for user, doctor, and configuration management |
| Notification Queue | Asynchronous mechanism for dispatching (simulated) SMS/email/in-app alerts |
| Payment Gate | Module simulating a payment authorization step before appointment confirmation |

### 1.4 References
- IEEE Std 830-1998 (Recommended Practice for SRS)
- HL7/FHIR concepts (referenced conceptually for future interoperability, not implemented in v1.0)
- OWASP Top 10 (security baseline reference)

### 1.5 Overview
Section 2 describes the product context and overall constraints. Section 3 details specific functional and non-functional requirements. Section 4 covers system features in depth. Section 5 defines data requirements. Section 6 lists appendices, including identified technical debt items and future work.

---

## 2. Overall Description

### 2.1 Product Perspective
The system is a new, standalone web application (not replacing an existing EHR). It may later integrate with third-party EHR/payment/notification providers; v1.0 uses internal simulated modules for payment and notifications to reduce integration risk during initial development while preserving the interfaces needed for future real integration.

**High-level architecture:**
- **Client:** Web front-end (responsive), role-based views.
- **Application layer:** REST/GraphQL API, authentication/authorization, business logic including the Rule Engine.
- **Data layer:** Relational database for structured records (users, appointments, schedules); queue/broker for notifications.
- **Simulated Payment Gate:** Mocked service mimicking authorize/capture/decline flows.
- **Notification Queue:** Simplified in-app/DB-backed queue simulating async email/SMS dispatch.

### 2.2 Product Functions (Summary)
1. Patient registration, authentication, and profile management.
2. Symptom intake form and automated urgency classification (Rule Engine).
3. Doctor availability/schedule management.
4. Appointment slot search, booking, rescheduling, and cancellation.
5. Role-based dashboards for Patient, Doctor, and Admin.
6. Simulated payment authorization at booking confirmation.
7. Queued notifications for triage results, booking confirmations, and reminders.
8. Basic reporting/audit views for Admin.

### 2.3 User Classes and Characteristics

| User Class | Description | Technical Proficiency |
|---|---|---|
| Patient | Registers, submits symptoms, books/manages appointments | Low–Medium |
| Doctor | Manages availability, views assigned patients/queue, conducts consultations | Medium |
| Admin | Manages users, doctors, triage rules, system configuration, monitors queue/payment logs | Medium–High |

### 2.4 Operating Environment
- Web browsers (latest two major versions of Chrome, Firefox, Edge, Safari).
- Backend deployable on Linux-based cloud infrastructure (containerized).
- Relational database (e.g., PostgreSQL/MySQL class system).
- Responsive design supporting desktop and mobile browsers (no native mobile app in v1.0).

### 2.5 Design and Implementation Constraints
- Must support RBAC with strict separation between Patient, Doctor, and Admin capabilities.
- Triage Rule Engine must be configurable/extensible by Admin without code redeployment (rules stored as data, not hardcoded, where feasible).
- Payment Gate and Notification Queue are explicitly simulated in v1.0; interfaces must be designed so real providers (e.g., Stripe, Twilio) can be substituted later with minimal refactoring (see Section 6.1, Technical Debt).
- All PHI-related data handling must follow security best practices even though formal compliance certification is out of scope.

### 2.6 Assumptions and Dependencies
- Doctors will input accurate availability; the system does not auto-detect real-world doctor absence.
- Symptom-based triage supports common, well-documented, non-emergency symptom sets; it is **not** a diagnostic tool and does not replace clinical judgment.
- Users have access to a stable internet connection and modern browser.
- Emergency cases (e.g., life-threatening symptoms) are expected to be redirected to emergency services outside this system's scope (see FR-2.6).

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

**3.1.1 User Interfaces**
- UI-1: Responsive web interface with distinct dashboard views per role.
- UI-2: Symptom intake form with guided, structured inputs (checklists, severity sliders, duration fields) rather than free text only, to support reliable rule evaluation.
- UI-3: Calendar/slot-picker UI for appointment booking.
- UI-4: Clear, color-coded urgency indicators (e.g., Emergency-redirect / High / Medium / Low).

**3.1.2 API Interfaces**
- API-1: RESTful API for all client-server interactions, secured via token-based authentication (e.g., JWT/OAuth2).
- API-2: Internal API contract for the Rule Engine (symptom input → urgency output) decoupled from booking logic.
- API-3: Abstracted Payment Gate interface (`authorize()`, `capture()`, `decline()`, `refund()`) implemented by a simulator in v1.0.
- API-4: Abstracted Notification interface (`enqueue()`, `dispatch()`, `status()`) implemented by an in-app/DB-backed queue in v1.0.

**3.1.3 Hardware Interfaces**
- None beyond standard client devices (desktop/mobile browsers). No specialized hardware required.

**3.1.4 Communications Interfaces**
- HTTPS/TLS for all client-server and inter-service communication.

### 3.2 Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Performance | 95% of API requests must respond within 2 seconds under normal load (≤500 concurrent users). |
| NFR-2 | Availability | System uptime target of 99.5% (excluding scheduled maintenance). |
| NFR-3 | Security | All PHI/PII encrypted at rest and in transit; passwords hashed (e.g., bcrypt/argon2); RBAC enforced server-side on every request. |
| NFR-4 | Auditability | All triage decisions, bookings, cancellations, and payment simulation events must be logged with timestamp and actor ID. |
| NFR-5 | Scalability | Architecture must support horizontal scaling of the application layer and independent scaling of the notification queue. |
| NFR-6 | Usability | Core flows (registration → triage → booking) completable by a first-time patient user in under 5 minutes without assistance. |
| NFR-7 | Maintainability | Rule Engine logic must be modifiable via configuration/data changes without requiring a full application redeploy. |
| NFR-8 | Compliance-readiness | Data model and access controls designed to be extensible toward HIPAA/GDPR-aligned practices, even though formal certification is out of scope for v1.0. |
| NFR-9 | Reliability of Simulation | Simulated Payment Gate and Notification Queue must behave deterministically enough for automated testing (configurable success/failure modes). |

---

## 4. System Features

### 4.1 Patient Registration & Profile Management
**Description:** Enables patients to create an account, verify identity/contact info, and manage a basic medical profile (age, sex, known conditions, allergies — optional fields).

**Functional Requirements:**
- FR-1.1: System shall allow new patients to register using email/phone + password, with input validation.
- FR-1.2: System shall verify email or phone via a confirmation code before activating the account.
- FR-1.3: System shall allow patients to update profile information and view their appointment/triage history.
- FR-1.4: System shall enforce unique accounts per email/phone.
- FR-1.5: System shall allow password reset via secure token-based flow.

### 4.2 Symptom-Based Urgency Auto-Triage (Rule Engine)
**Description:** Core differentiator addressing the stated problem — automatically classifies patient-reported symptoms into urgency tiers to prioritize scheduling.

**Functional Requirements:**
- FR-2.1: System shall present a structured symptom intake form (symptom category, severity 1–10, duration, associated red-flag indicators).
- FR-2.2: System shall evaluate submitted symptoms against a configurable rule set to output one of: **Emergency (redirect)**, **High**, **Medium**, **Low** urgency.
- FR-2.3: Rules shall be stored as data (e.g., condition-action pairs) editable by Admin through an interface, not hardcoded in application logic.
- FR-2.4: System shall log every triage evaluation (inputs, matched rule(s), resulting urgency, timestamp) for audit and later rule refinement.
- FR-2.5: System shall recommend appointment scheduling windows based on urgency (e.g., High → next available slot within 24h; Low → within 7 days).
- FR-2.6: If triage detects potential emergency indicators (e.g., chest pain + shortness of breath), system shall immediately display an emergency-services redirect message instead of offering a booking flow.
- FR-2.7: System shall allow Admin to test/simulate rule changes against sample inputs before publishing updated rules to production.

**Design Note:** The Rule Engine should be implemented as a decision-table or rules-as-data pattern (e.g., ordered condition sets with priority weights) rather than nested if/else in application code, to satisfy FR-2.3 and NFR-7.

### 4.3 Doctor Schedule Management & Slot Booking
**Description:** Allows doctors to define availability; allows patients to book against triage-prioritized slots.

**Functional Requirements:**
- FR-3.1: System shall allow doctors to define recurring and one-off availability windows.
- FR-3.2: System shall divide availability into discrete bookable slots (configurable duration, default 15/30 min).
- FR-3.3: System shall prevent double-booking of a single slot (atomic booking transaction).
- FR-3.4: System shall allow patients to filter available slots by urgency-recommended timeframe, specialty, and doctor.
- FR-3.5: System shall allow patients to reschedule or cancel a booking up to a configurable cutoff time before the appointment.
- FR-3.6: System shall allow doctors to block/release slots (e.g., for emergencies or admin leave approval).
- FR-3.7: High-urgency triage results shall be visually flagged and prioritized in the doctor's queue view.
- FR-3.8: System shall send a booking confirmation/cancellation event to the Notification Queue (see 4.6).

### 4.4 Role-Based Dashboards
**Description:** Distinct views and permissions for Patient, Doctor, and Admin roles.

**Functional Requirements:**
- FR-4.1 (Patient Dashboard): View upcoming/past appointments, triage history, profile, and payment status.
- FR-4.2 (Doctor Dashboard): View daily/weekly schedule, patient queue sorted by urgency, patient triage summaries (not full free-text medical history unless explicitly shared), and slot management tools.
- FR-4.3 (Admin Dashboard): Manage user accounts (patients/doctors), configure triage rules, monitor system logs (triage, booking, payment simulation, notification delivery status), and generate basic usage reports.
- FR-4.4: System shall enforce RBAC such that no role can access another role's restricted data or functions via UI or direct API calls.
- FR-4.5: System shall log all Admin configuration changes with actor and timestamp (audit trail).

### 4.5 Simulated Payment Gate
**Description:** A mocked payment authorization step at booking confirmation, designed for future replacement with a real payment processor.

**Functional Requirements:**
- FR-5.1: System shall present a payment step during booking confirmation showing a simulated consultation fee.
- FR-5.2: System shall simulate authorize/capture/decline outcomes based on configurable test conditions (e.g., specific test card numbers or a toggle for success/failure simulation).
- FR-5.3: System shall record simulated transaction records (status, amount, timestamp) associated with each booking.
- FR-5.4: System shall allow Admin to view simulated payment logs.
- FR-5.5: Payment interface shall be abstracted (see API-3) so a real gateway can later be substituted without changing booking logic.
- FR-5.6 *(Technical debt, documented)*: No real financial transaction, PCI compliance, or refund processing is implemented in v1.0.

### 4.6 Simplified Notification Queue
**Description:** A lightweight, internal mechanism simulating asynchronous delivery of notifications.

**Functional Requirements:**
- FR-6.1: System shall enqueue notification events for: registration confirmation, triage result, booking confirmation, booking cancellation/reschedule, and appointment reminder.
- FR-6.2: System shall process queued notifications asynchronously and update delivery status (queued / sent / failed) — "sent" is simulated (e.g., logged/in-app) rather than delivered via real SMS/email provider in v1.0.
- FR-6.3: System shall allow Admin to view notification queue status and retry failed items.
- FR-6.4: Notification interface shall be abstracted (see API-4) so a real provider (e.g., email/SMS API) can later be substituted with minimal changes.

---

## 4.7 Role-Based Operations Matrix
**Description:** Explicit breakdown of which operations each role may perform, to remove ambiguity beyond the dashboard descriptions in 4.4 and to serve as the basis for RBAC enforcement (FR-4.4) and test-case design.

**Legend:** ✅ Full access | ➖ Own records only | ❌ No access

| Operation | Patient | Doctor | Admin |
|---|---|---|---|
| Register own account | ✅ | ❌ (created by Admin) | ❌ (created by Admin/seed) |
| Edit own profile | ➖ | ➖ | ✅ (any user) |
| View own medical/triage history | ➖ | ➖ (assigned patients only) | ✅ (audit purposes only) |
| Submit symptom intake | ✅ | ❌ | ❌ |
| Trigger/view triage result | ➖ (own) | ➖ (assigned patients) | ✅ (all, read-only) |
| Create/edit triage rules | ❌ | ❌ | ✅ |
| Test triage rules against sample input | ❌ | ❌ | ✅ |
| Define/edit doctor availability | ❌ | ➖ (own schedule) | ✅ (any doctor, override) |
| Block/release a slot | ❌ | ➖ (own slots) | ✅ (any doctor's slots) |
| Search & book an appointment slot | ✅ | ❌ | ➖ (on behalf of patient, support cases) |
| Reschedule/cancel appointment | ➖ (own, before cutoff) | ➖ (own schedule, e.g. emergency) | ✅ (any, override cutoff) |
| View doctor's patient queue | ❌ | ➖ (own queue only) | ✅ (all doctors) |
| Initiate simulated payment | ➖ (own booking) | ❌ | ❌ |
| View payment logs | ➖ (own transactions) | ❌ | ✅ (all transactions) |
| Issue refund (simulated) | ❌ | ❌ | ✅ |
| View notification queue/status | ➖ (own notifications) | ❌ | ✅ (all, with retry) |
| Manage user accounts (activate/suspend) | ❌ | ❌ | ✅ |
| View system audit logs | ❌ | ❌ | ✅ |
| Generate usage/reporting views | ❌ | ➖ (own stats only, if enabled) | ✅ |

**Additional Requirements:**
- FR-4.6: Every operation in the matrix above shall be enforced server-side on each API call, independent of client-side UI restrictions (defense against direct API access by an unauthorized role).
- FR-4.7: Attempts by a role to perform an operation outside its permitted scope shall be rejected with an authorization error and logged to the AuditLog (see 5.1).
- FR-4.8: The Admin role shall have read access to patient triage/medical data strictly for audit and support purposes, and all such access shall itself be logged (access-to-PHI audit trail), not just write/config changes.

---

## 5. Data Requirements

### 5.1 Key Entities (Conceptual)
- **User** (id, role, email/phone, password_hash, status, created_at)
- **PatientProfile** (user_id, name, DOB, sex, contact_info, medical_notes[optional])
- **DoctorProfile** (user_id, name, specialty, license_info, bio)
- **Availability** (doctor_id, day/date, start_time, end_time, recurrence_rule)
- **Slot** (doctor_id, start_time, end_time, status: open/booked/blocked)
- **SymptomSubmission** (id, patient_id, symptoms[], severity, duration, timestamp)
- **TriageResult** (id, submission_id, urgency_level, matched_rules[], timestamp)
- **TriageRule** (id, conditions, resulting_urgency, priority_weight, active_flag, created_by, updated_at)
- **Appointment** (id, patient_id, doctor_id, slot_id, triage_result_id, status, created_at)
- **PaymentRecord** (id, appointment_id, amount, status, simulated_flag, timestamp)
- **NotificationEvent** (id, recipient_id, type, payload, status, created_at, sent_at)
- **AuditLog** (id, actor_id, action, target_entity, timestamp)

### 5.2 Data Retention & Privacy (High-Level)
- PHI-adjacent fields (symptoms, medical notes) shall be access-restricted to the owning patient, the assigned doctor, and Admin (for audit only).
- Audit logs shall be retained separately from mutable records to preserve traceability of triage and access decisions.

---

## 6. Appendices

### 6.1 Identified Technical Debt (Intentional, for v1.0)
| Area | Simplification in v1.0 | Future Work |
|---|---|---|
| Payment Gate | Fully simulated authorize/capture/decline; no PCI compliance, no real settlement | Integrate real payment processor (e.g., Stripe) behind existing abstraction (API-3) |
| Notification Queue | In-app/DB-backed queue; no real SMS/email delivery | Integrate real provider (e.g., Twilio/SendGrid) behind existing abstraction (API-4); add retry/backoff policies |
| Rule Engine | Rule storage may start as a simple structured table without a full DSL or ML-based triage | Evolve toward a more expressive rules DSL or clinically-validated decision-support model, with clinician sign-off process |
| Compliance | Compliance-ready design only; no formal HIPAA/GDPR certification | Formal compliance audit, BAA processes, data residency controls |
| Video Consultation | Not implemented; assumed out-of-band (phone/external link) | Integrate WebRTC-based video consultation |

### 6.2 Assumptions Requiring Stakeholder Validation
- Definition of "urgent non-emergency" thresholds and exact rule content must be reviewed/approved by a clinical advisor before production use; this SRS defines the *mechanism*, not the clinical rule content itself.
- Consultation fee simulation values are placeholders pending business/pricing input.

### 6.3 Acceptance Criteria Summary
The system will be considered ready for pilot review when:
1. A patient can register, submit symptoms, receive an urgency classification, and book a slot consistent with that urgency.
2. A doctor can manage availability and see a queue correctly prioritized by urgency.
3. An admin can modify at least one triage rule and see it take effect without redeployment.
4. Simulated payment and notification flows complete end-to-end and are logged/auditable.
5. RBAC prevents cross-role access in manual and automated testing.

---

*End of Document*
