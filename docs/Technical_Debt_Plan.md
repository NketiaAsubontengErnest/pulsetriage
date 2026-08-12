# TECHNICAL DEBT IDENTIFICATION & MANAGEMENT PLAN
## CSCD 602 Advanced Software Engineering Examination Project

**Author**: Software Engineering Student  
**Examiner**: Prof. Solomon Mensah  

---

## 1. Executive Summary
Technical debt was explicitly introduced into the Telehealth Appointment & Triage System (*PulseTriage*) to balance complete lifecycle delivery within the strict **48-hour examination deadline** against system architectural elegance. This document categorizes each technical debt item using the standard format:
`Debt → Cause → Impact → Priority → Proposed Resolution`

---

## 2. Technical Debt Matrix

### Debt Item #1: Simulated Payment Gateway (Synchronous State Flip)
- **Debt**: Immediate status flip to `CONFIRMED` upon local validation instead of asynchronous payment gateway API integration.
- **Cause**: 48-Hour Exam Constraint preventing merchant account activation, API credential provisioning, and public webhook listener setup.
- **Impact**: Enables end-to-end user checkout demonstration and transaction logging without financial API keys or network latency.
- **Priority**: **HIGH** (Acceptable for Capstone Exam / Critical for Production).
- **Proposed Resolution (Payback Plan)**: Integrate Paystack REST API v2 and Hubtel Mobile Money checkout with HMAC SHA256 webhook signature verification in V2.0.

### Debt Item #2: Simplified In-App Notification Queue
- **Debt**: In-memory and local database push notification store instead of a distributed background message queue.
- **Cause**: Time constraint avoided introducing external Redis/BullMQ broker dependencies and paid Twilio SMS gateway infrastructure.
- **Impact**: Provides instant, zero-latency UI notifications across role-based dashboards without background daemon processes.
- **Priority**: **MEDIUM** (Acceptable Temporarily).
- **Proposed Resolution (Payback Plan)**: Deploy a Redis-backed BullMQ job queue coupled with SMS and Email notification workers in V2.0.

### Debt Item #3: Client-Side Rule Engine Fallback
- **Debt**: Rule engine logic executed within client JavaScript with server-side validation fallback.
- **Cause**: Prioritized real-time UI interactivity for patients filling out emergency symptom questionnaires.
- **Impact**: Instant feedback to patients, though updating triage rules requires an application redeployment.
- **Priority**: **LOW** (Scheduled for Future Resolution).
- **Proposed Resolution (Payback Plan)**: Extract rule engine into a standalone microservice backed by dynamic database-stored clinical decision tables in V2.0.

---

## 3. Technical Debt Repayment Roadmap (12-Month Timeline)

| Milestone | Month | Action Item / Payback Deliverable | Target Refactoring Scope |
| :--- | :---: | :--- | :--- |
| **Phase I** | Months 1–3 | Paystack / Hubtel Payment Gateway Webhook Integration | Replace `src/lib/simulated-payment.ts` |
| **Phase II** | Months 4–6 | Redis / BullMQ Messaging Queue & Twilio SMS Service | Replace `src/lib/notifications.ts` |
| **Phase III** | Months 7–9 | Microservice Decoupling of Rule Engine | Create standalone `/api/v1/triage` REST API |
| **Phase IV** | Months 10–12 | End-to-End Penetration Test & Security Audit | Full RLS security & audit log verification |
