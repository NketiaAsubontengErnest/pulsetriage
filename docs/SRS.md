# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Telehealth Appointment & Urgency Auto-Triage System
**Course**: CSCD 602 Advanced Software Engineering  
**Institution**: Department of Computer Science, University of Ghana  
**Examiner**: Prof. Solomon Mensah  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the Telehealth Appointment & Urgency Auto-Triage System (*PulseTriage*). It provides a complete description of the system's functions, performance expectations, constraints, and interface requirements.

### 1.2 Scope
PulseTriage is a web-based telehealth platform designed to eliminate manual appointment scheduling delays and improper urgency triage. It automates symptom risk evaluation using a medical rule engine, enables real-time doctor slot booking, provides role-based access for Patients, Doctors, and Administrators, and manages intentional technical debt (simulated payment gate and simplified notification queue).

### 1.3 Definitions and Acronyms
- **SRS**: Software Requirements Specification
- **RBAC**: Role-Based Access Control
- **RLS**: Row-Level Security (Supabase PostgreSQL)
- **UCP**: Use Case Points
- **Rule Engine**: Deterministic algorithm evaluating clinical symptoms into urgency levels

---

## 2. Overall Description

### 2.1 Product Perspective
PulseTriage operates as a cloud-native web application deployed on **Vercel** with a **Supabase PostgreSQL** cloud backend.

### 2.2 User Classes and Characteristics
1. **Patient**: Submits symptoms, receives urgency scoring, searches doctors, books consultation slots, and completes simulated payments.
2. **Doctor**: Views clinical queue sorted by urgency score, accesses triage details, records consultation notes, and marks appointments complete.
3. **Administrator**: Oversees system metrics, verifies doctor licenses, and audits technical debt items.

---

## 3. Specific Requirements (MoSCoW Prioritization)

### 3.1 Functional Requirements (MUST HAVE)
- **FR-01 (Auto-Triage Rule Engine)**: The system MUST calculate symptom severity scores (0–100) and assign urgency levels (`EMERGENCY`, `URGENT`, `SEMI_URGENT`, `ROUTINE`).
- **FR-02 (Red-Flag Safety Screening)**: The system MUST flag critical safety indicators (e.g. chest pain radiating to jaw, severe shortness of breath) and immediately output EMERGENCY status.
- **FR-03 (Specialty Recommendation)**: The system MUST recommend appropriate doctor specialties based on symptom category (Cardiology, Pulmonology, Neurology, General Practice, Dermatology).
- **FR-04 (Doctor Slot Booking)**: Patients MUST be able to select available date and 30-minute consultation time slots.
- **FR-05 (Simulated Payment Gate)**: Patients MUST be able to complete consultation payments via simulated Mobile Money (MTN/Telecel) or Credit Card.
- **FR-06 (Role-Based Dashboards)**: The system MUST enforce distinct dashboards for Patient, Doctor, and Admin.
- **FR-07 (Doctor Queue Sorting)**: The Doctor workspace MUST display patient appointments sorted by triage severity score (highest urgency first).

### 3.2 Non-Functional Requirements (MUST HAVE)
- **NFR-01 (Performance)**: Rule engine evaluation MUST respond within 200 milliseconds.
- **NFR-[02] (Security)**: All database queries MUST enforce Supabase Row-Level Security (RLS) policies based on user authentication tokens.
- **NFR-03 (Availability & Responsiveness)**: The web UI MUST be fully responsive across mobile, tablet, and desktop viewports using Tailwind CSS.
- **NFR-04 (Maintainability & Debt Transparency)**: All intentional technical debt MUST be explicitly documented with cause, impact, priority, and resolution roadmap.
