---
title: "User Manual"
subtitle: "PulseTriage — Telehealth Appointment & Urgency Auto-Triage System"
author: "Ernest Nketia Asubonteng (Index No. 22424715)"
date: "12 August 2026"
---

# USER MANUAL

## PulseTriage — Telehealth Appointment & Urgency Auto-Triage System

| Field | Value |
| :--- | :--- |
| **Application** | PulseTriage v1.0 |
| **Live URL** | <https://pulsetriage.vercel.app> |
| **Course** | CSCD 602 — Advanced Software Engineering |
| **Candidate** | Ernest Nketia Asubonteng (Index No. 22424715) |
| **Examiner** | Prof. Solomon Mensah |
| **Date** | 12 August 2026 |

---

> # ⚠ IMPORTANT SAFETY NOTICE — READ FIRST
>
> **PulseTriage is a decision-support aid. It is not a diagnostic instrument and it does not replace a clinician's judgement.**
>
> **If you are experiencing a medical emergency, do not use this application. Call emergency services (112 in Ghana) or go to the nearest emergency department immediately.**
>
> If the system classifies your assessment as **EMERGENCY**, it will deliberately **not** offer you an appointment. This is intended behaviour and is not a fault. It means the correct response to your symptoms is emergency care, not a scheduled consultation.
>
> The clinical rule content in this version is illustrative and has **not** been validated by a qualified clinical advisor. This version is intended for demonstration and assessment only.

---

# 1. Getting Started

## 1.1 What You Need

- A modern web browser — Chrome, Edge, Firefox or Safari (latest two versions).
- An internet connection.
- A camera and microphone, **only** if you intend to open a consultation room.
- No installation of any kind. PulseTriage runs entirely in the browser on desktop, tablet and mobile.

## 1.2 Opening the Application

Go to **<https://pulsetriage.vercel.app>**.

> **📷 FIGURE 1.1 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the PulseTriage landing page as it first appears.
> **Where to get it:** <https://pulsetriage.vercel.app>
> **How (Windows):** press `Win` + `Shift` + `S`, drag to select the area, then paste into this document.
> **Save as:** `docs/images/manual-01-landing.png`

## 1.3 Demonstration Accounts

For assessment and demonstration, the following accounts are pre-loaded. **All of them use the password `password123`.**

| Role | E-mail | What you can do |
| :--- | :--- | :--- |
| **Patient** | `patient@ug.edu.gh` | Symptom triage, doctor search, booking, payment, appointment history |
| **Doctor** | `dr.mensah@ug.edu.gh` (Cardiology) | Urgency-ordered patient queue, consultations, clinical notes |
| **Doctor** | `dr.appiah@ug.edu.gh` (Pulmonology) | As above |
| **Doctor** | `dr.owusu@ug.edu.gh` (General Practice) | As above |
| **Administrator** | `admin@ug.edu.gh` | Metrics, doctor verification, triage rules, audit trail |

## 1.4 Signing In

1. Click **Sign In** in the top navigation bar (or go to `/login`).
2. Enter the e-mail address and password.
3. Click **Sign In**.

You are taken to the dashboard for your role automatically. Your session survives page reloads, so you will not be asked to sign in again until you sign out.

> **📷 FIGURE 1.2 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the sign-in form.
> **Where to get it:** <https://pulsetriage.vercel.app/login>
> **Save as:** `docs/images/manual-02-login.png`

## 1.5 Creating a New Patient Account

1. Click **Register** in the top navigation bar (or go to `/register`).
2. Enter your full name, e-mail address, phone number and a password.
3. Click **Create Account**.

Your account is active immediately and you are signed in.

**Note:** e-mail verification and password reset are **not available in this version**. If you forget the password to an account you created, you will need to register a new account. This is a documented limitation (see the Technical Debt Plan, item TD-05).

## 1.6 Signing Out

Click your name in the top-right corner and choose **Sign Out**. Your session is cleared from the browser.

## 1.7 Finding Your Way Around

The left-hand sidebar changes according to your role.

| Patient | Doctor | Administrator |
| :--- | :--- | :--- |
| Patient Dashboard | Clinical Workspace | Executive Center |
| Start Symptom Triage | Works Pending | Doctor Operations |
| My Appointments | Upcoming Works | Patient Records |
| Book Consultation | Work Done by Doctor | Triage Rules Engine |
| | Already Completed | System Audit Logs |
| | Schedule Slot Manager | |

You can switch between **light** and **dark** display modes using the toggle in the top bar. Light mode is the default.

---

# 2. Patient Guide

## 2.1 Overview of the Patient Journey

```
Sign in  →  Symptom triage  →  Urgency result  →  Book a slot  →  Pay  →  Confirmed
                                     │
                                     └─ if EMERGENCY → redirect to emergency services
                                        (booking is deliberately not offered)
```

## 2.2 Step 1 — Start a Symptom Triage

Click **Start Symptom Triage** in the sidebar, or **Start New Triage** on your dashboard. The wizard has four short steps and shows your progress at the top.

> **📷 FIGURE 2.1 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the triage wizard at Step 1, showing the symptom categories and the progress bar.
> **Where to get it:** <https://pulsetriage.vercel.app/triage> (sign in as `patient@ug.edu.gh` first)
> **Save as:** `docs/images/manual-03-triage-step1.png`

### Step 1 of 4 — Your main symptom

Choose the option that best describes your main problem:

| Option | Typically routed to |
| :--- | :--- |
| Chest Pain / Palpitations | Cardiology |
| Shortness of Breath / Asthma / Cough | Pulmonology |
| Severe Headache / Dizziness / Numbness | Neurology |
| High Fever / Chills / Systemic Illness | General Practice / Internal Medicine |
| Severe Abdominal Pain / Vomiting | Gastroenterology |
| Skin Rash / Allergic Flare-up | Dermatology |
| Routine Checkup / Medical Certificate | General Practice |

**Optional — describe it in your own words.** Step 1 also offers a free-text box where you can type a description such as *"I've had a severe throbbing headache and dizziness for 2 days with pain level 8."* The AI assistant will read it and produce a supporting summary. This is **advisory only** — your official urgency classification always comes from the clinical rule engine, never from the AI.

### Step 2 of 4 — How long, and how bad

**How long have you had this symptom?** Choose one:

- Sudden (< 6 hours)
- 24–48 hours
- 3–7 days
- Over 1 week

Symptoms that started suddenly are weighted as **more urgent**, because rapid onset is itself a clinical signal.

**How severe is the pain or discomfort?** Drag the slider from **1** (very mild) to **10** (worst imaginable). Answer honestly — this is the single largest contributor to your score.

> **📷 FIGURE 2.2 — INSERT SCREENSHOT HERE**
>
> **What to capture:** Step 2, showing the duration options and the pain slider.
> **Save as:** `docs/images/manual-04-triage-step2.png`

### Step 3 of 4 — Safety check (the most important step)

You are shown a checklist of **critical warning signs**. Tick every one that applies to you:

- Chest pain or pressure radiating to arm/jaw
- Severe shortness of breath at rest
- Sudden weakness or numbness on one side of face/body
- High fever (> 39.5 °C) with neck stiffness
- Blue lips, facial discoloration, or hypoxia
- Uncontrolled or heavy bleeding

> **Do not skip this step, and do not leave anything unticked because you are unsure.** These are the indicators that cause the system to stop and send you to emergency care instead of scheduling an appointment. Ticking one is not a commitment — it is a safety check.

You may also add any pre-existing conditions (hypertension, diabetes, asthma, and so on) in the notes box.

### Step 4 of 4 — Evaluate

Click **Evaluate Triage Rules**. The result appears immediately.

## 2.3 Understanding Your Result

You are shown four things: an **urgency level**, a **severity score out of 100**, a **recommended specialty**, and a **recommended action**.

| Urgency level | What it means | What you should do |
| :--- | :--- | :--- |
| 🔴 **EMERGENCY** | Your symptoms may indicate a life-threatening condition | **Call 112 or go to the nearest emergency department now.** No appointment is offered. |
| 🟠 **URGENT** | Needs prompt medical attention | Book a consultation **within 24 hours** |
| 🟡 **SEMI-URGENT** | Should be seen soon, but is not an emergency | Book a consultation **within 48 hours** |
| 🟢 **ROUTINE** | Non-urgent | Book a consultation **within 7 days** |

> **📷 FIGURE 2.3 — INSERT SCREENSHOT HERE**
>
> **What to capture:** an urgency result card for a non-emergency case, showing the score, the urgency badge and the recommended specialty.
> **How to produce it:** run a triage with *Severe Headache / Dizziness / Numbness*, duration *Sudden (< 6 hours)*, pain **7**, no red flags ticked.
> **Save as:** `docs/images/manual-05-urgency-result.png`

### If your result is EMERGENCY

The screen displays a prominent red banner instructing you to seek emergency care, **and no booking button appears anywhere on the page**. This is deliberate. The system will not allow you to schedule a future appointment for symptoms that require care now.

> **📷 FIGURE 2.4 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the emergency redirect banner, clearly showing that **no booking option is offered**.
> **How to produce it:** run a triage with *Chest Pain / Palpitations*, duration *Sudden (< 6 hours)*, pain **9**, and tick **"Chest pain or pressure radiating to arm/jaw"**.
> **Save as:** `docs/images/manual-06-emergency-redirect.png`

## 2.4 Step 2 — Booking a Consultation

If your result is `URGENT`, `SEMI_URGENT` or `ROUTINE`, click **Book Slot with Recommended Specialist**. You may also go to **Book Consultation** in the sidebar at any time.

1. **Choose a doctor.** The list is pre-filtered to your recommended specialty. Each card shows the doctor's name, specialisation, biography, rating, consultation fee in Ghana Cedis, and a **VERIFIED** badge if their licence has been confirmed by an administrator.
2. **Choose a consultation type** — telehealth (online) or in-person.
3. **Choose a date.**
4. **Choose a time slot.** Slots are 30 minutes.
5. Review the summary and click **Continue to Payment**.

> **📷 FIGURE 2.5 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the doctor directory with the specialisation filter, and the booking modal with the date and slot picker.
> **Where to get it:** <https://pulsetriage.vercel.app/doctors>
> **Save as:** `docs/images/manual-07-booking.png`

## 2.5 Step 3 — Payment

> **⚠ This version uses a simulated payment gate. No real money is taken, and no real card or Mobile Money account is charged. Do not enter genuine payment details.**

1. Choose a payment method: **Mobile Money** (MTN / Telecel), **Card** (Visa / Mastercard) or **Health Insurance** (NHIS).
2. Enter an account or card number. **Any number of five characters or more will be accepted.** For example, `0241234567`.
3. Click **Pay & Confirm Slot**.

After a short processing pause you will see a confirmation with a transaction reference of the form `PAY-SIM-123456`. Your appointment status changes to **CONFIRMED** and both you and your doctor receive a notification.

**To see the declined-payment path** (useful for demonstration): enter `00000`, or any number shorter than five characters. The payment is declined with a clear message, your appointment remains in **PENDING_PAYMENT**, and you can retry immediately with a valid number.

> **📷 FIGURE 2.6 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the payment step showing the three payment methods and the fee.
> **Save as:** `docs/images/manual-08-payment.png`

## 2.6 Managing Your Appointments

Click **My Appointments** in the sidebar to see all your bookings with their doctor, date, time, status and payment status.

**Statuses you may see:**

| Status | Meaning |
| :--- | :--- |
| `PENDING_PAYMENT` | Slot reserved; payment not yet completed |
| `CONFIRMED` | Paid and confirmed |
| `COMPLETED` | The consultation has taken place |
| `CANCELLED` | The appointment was cancelled |

> **Limitation:** in this version you **cannot** reschedule or cancel an appointment yourself. You would need to contact the clinic directly. This is a documented limitation (Technical Debt Plan, item TD-07).

## 2.7 Notifications

The bell icon in the top bar shows your unread notification count. Click it to read your notifications and mark them as read. You will receive notifications for triage results, booking confirmations, payment outcomes and appointment reminders.

> **Limitation:** notifications appear **inside the application only**. Nothing is sent to your e-mail address or by SMS in this version, including messages labelled as reminders. Please sign in to check for updates. This is a documented limitation (Technical Debt Plan, item TD-12).

## 2.8 Joining a Consultation

When it is time for a telehealth consultation, open the appointment and click **Join Consultation Room**. Your browser will ask permission to use your camera and microphone; click **Allow**.

> **⚠ Important limitation:** in this version the consultation room shows **your own camera preview only**. It does **not** yet connect you to your doctor — you will not be able to see or hear each other through this screen. Your actual consultation will take place by telephone or another agreed channel. This is a documented limitation (Technical Debt Plan, item TD-10).

## 2.9 Reviewing Your Triage History

Your dashboard lists every triage assessment you have submitted, with its date, symptom, score and urgency. Assessments are never edited or deleted — a re-assessment always creates a new record, so your clinical history stays intact.

---

# 3. Doctor Guide

## 3.1 Signing In

Sign in with a doctor account (for example `dr.mensah@ug.edu.gh` / `password123`). You arrive at the **Clinical Workspace**.

## 3.2 The Clinical Workspace

Your workspace has six views:

| View | Purpose |
| :--- | :--- |
| **Clinical Workspace** | Overview and today's queue |
| **Works Pending** | Appointments awaiting your action |
| **Upcoming Works** | Confirmed future appointments |
| **Work Done by Doctor** | Consultations you have conducted |
| **Already Completed** | Closed consultations |
| **Schedule Slot Manager** | Your availability windows |

## 3.3 Working the Patient Queue

**Your queue is ordered by clinical urgency, not by when the appointment was booked.** The patient with the highest triage severity score appears first, regardless of whether they booked last.

Each entry shows the patient's name, their urgency badge and severity score, their primary symptom, the appointment time, and the consultation type.

> **📷 FIGURE 3.1 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the doctor's queue with the highest-severity patient at the top.
> **Where to get it:** <https://pulsetriage.vercel.app/doctor> (sign in as `dr.mensah@ug.edu.gh` / `password123`)
> **Save as:** `docs/images/manual-09-doctor-queue.png`

## 3.4 Reviewing a Patient Before the Consultation

Click a patient in the queue to open their triage assessment: the primary symptom, symptom duration, reported pain score, any red flags ticked, the computed severity score, the assigned urgency level, and the system's recommended action.

This means you have the patient's structured presentation **before** the consultation begins, rather than spending the first minutes of the appointment establishing it.

## 3.5 Conducting a Consultation

1. Open the appointment from **Upcoming Works**.
2. Click **Join Consultation Room** to open the room and grant camera and microphone permission.
3. Conduct the consultation. *(See the limitation in §2.8 — the room does not yet carry two-way media.)*
4. Record your findings in the **Clinical Notes** field.
5. Optionally click **Generate SOAP Note** to have the AI assistant draft a structured Subjective / Objective / Assessment / Plan note from your notes, including suggested ICD-10 codes. **Always review and correct the draft before saving — it is a drafting aid, not a clinical authority.**
6. Click **Save & Mark Consultation Complete**. The appointment status becomes `COMPLETED`.

> **📷 FIGURE 3.2 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the clinical notes panel with the AI SOAP note tool.
> **Save as:** `docs/images/manual-10-clinical-notes.png`

## 3.6 Managing Your Availability

Open **Schedule Slot Manager** to view and set your recurring weekly availability — the day of the week, start and end times, and slot duration (default 30 minutes). Patients can only book inside these windows.

## 3.7 AI Clinical Tools

Four assistants are available from your workspace:

| Tool | What it does |
| :--- | :--- |
| **SOAP Note Generator** | Turns consultation notes into a structured SOAP note with ICD-10 suggestions |
| **Lab Report Analyser** | Summarises a laboratory report, flags out-of-range values and produces a patient-friendly explanation |
| **No-Show Risk Predictor** | Estimates the likelihood that a patient will miss an appointment |
| **Doctor Match** | Suggests the most appropriate clinician for a given triage result |

**All four are advisory.** They never alter a patient's urgency classification, and their output should be reviewed before being acted upon. If the AI service is unavailable, each tool falls back to a safe default rather than failing.

---

# 4. Administrator Guide

## 4.1 Signing In

Sign in with `admin@ug.edu.gh` / `password123`. You arrive at the **Executive Center**.

## 4.2 Executive Center — System Metrics

The dashboard shows live figures for total triage assessments, the proportion classified as high urgency, registered and verified doctors, total appointments, and total simulated revenue.

> **📷 FIGURE 4.1 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the administrator dashboard with the metrics tiles.
> **Where to get it:** <https://pulsetriage.vercel.app/admin>
> **Save as:** `docs/images/manual-11-admin-dashboard.png`

## 4.3 Doctor Operations

Open **Doctor Operations** to see every registered doctor with their specialisation, licence number, fee, rating and verification status.

**To verify a doctor:** click the verification toggle next to their name. The status flips between **VERIFIED** and **PENDING**, the change is saved immediately, and an entry is written to the audit log. Only verified doctors display the verified badge to patients.

You can also add a new doctor, edit an existing doctor's details, and manage the specialisation catalogue.

## 4.4 Patient Records

Open **Patient Records** to see registered patients and their triage history.

> **Please note:** administrator access to patient clinical data is for audit and support purposes only. In a production deployment every such access would itself be recorded in the audit trail; that read-access logging is **not yet implemented** in this version (Technical Debt Plan, item TD-08).

## 4.5 Triage Rules Engine

Open **Triage Rules Engine** to inspect and experiment with the clinical rules.

**The rule list** shows each rule's identifier, category, symptom, severity threshold, required red flags, urgency output, recommended specialty and priority weight. You can activate or deactivate any rule with its toggle.

**Adding a rule:** fill in the symptom, category, severity threshold, urgency output and recommended action, then click **Add Rule**.

**The rule simulator:** enter a sample symptom, severity, duration and red flags, then run the simulation to see exactly what classification the current rule set would produce — *before* relying on it.

> **⚠ Important limitation:** rule changes made on this page apply **only to your current browser session** and are lost when you reload the page. They do **not** yet affect the rules used by patients, which come from the version compiled into the application. This is a documented limitation (Technical Debt Plan, item TD-04) and is scheduled for the v1.2 release.

> **📷 FIGURE 4.2 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the rule list with active toggles, and the simulator with a result.
> **Where to get it:** <https://pulsetriage.vercel.app/admin/rules>
> **Save as:** `docs/images/manual-12-admin-rules.png`

## 4.6 System Audit Logs

Open **System Audit Logs** to review every significant system event: the actor who performed it, the action, the entity affected, its identifier, any detail, and the timestamp.

Logged events include authentication, triage submission, appointment booking, payment processing, doctor verification and configuration changes. **The audit log is append-only** — there is no way to edit or delete an entry from anywhere in the application, which is what makes it a trustworthy record.

> **📷 FIGURE 4.3 — INSERT SCREENSHOT HERE**
>
> **What to capture:** the audit log table showing actor, action, entity and timestamp columns.
> **Where to get it:** <https://pulsetriage.vercel.app/admin/audit>
> **Save as:** `docs/images/manual-13-audit-log.png`

---

# 5. Troubleshooting

| Problem | Likely cause | What to do |
| :--- | :--- | :--- |
| "Invalid email or password" | Wrong credentials, or the account does not exist | Check the e-mail spelling. All demonstration accounts use `password123`. Passwords are case-sensitive. |
| "Authentication Required" appears | Your session was cleared | Sign in again. If it recurs, check that your browser is not blocking site storage. |
| I forgot my password | Password reset is not available in this version | Register a new account (limitation TD-05). |
| No booking button after triage | Your result was **EMERGENCY** | This is intended. Seek emergency care — do not attempt to book. |
| Payment was declined | Account number shorter than 5 characters, or `00000` | Enter any number of 5 characters or more, e.g. `0241234567`. |
| I cannot see my doctor in the consultation room | Two-way media is not implemented in this version | Expected behaviour (limitation TD-10). Your consultation takes place by telephone or another agreed channel. |
| No e-mail or SMS reminder arrived | External delivery is not implemented | Expected behaviour (limitation TD-12). Sign in and check your notifications. |
| My rule changes disappeared after reload | Rule edits are session-scoped in this version | Expected behaviour (limitation TD-04). |
| The AI assistant returned a generic answer | The inference service was unreachable | Expected behaviour — the system falls back to a safe default rather than failing. Your urgency classification is unaffected. |
| The first page load is slow | Serverless cold start | Subsequent loads are considerably faster. |
| I cannot cancel my appointment | Not implemented in this version | Contact the clinic directly (limitation TD-07). |

---

# 6. Frequently Asked Questions

**Is PulseTriage a substitute for seeing a doctor?**
No. It is a decision-support aid that helps you reach the right clinician sooner. It does not diagnose, and it does not replace clinical judgement.

**How is my urgency score calculated?**
Your reported pain level is multiplied by 8. Symptoms that began within the last two days add 15 points; symptoms lasting more than two weeks add 5. Each additional warning sign adds 10. The total is capped at 100, then banded: 80 or above is `EMERGENCY`, 60–79 is `URGENT`, 35–59 is `SEMI_URGENT`, below 35 is `ROUTINE`. **If you tick a critical warning sign that matches an emergency rule, all of this is bypassed and you are classified `EMERGENCY` immediately.**

**Does the AI decide my urgency?**
No. Your urgency is always determined by the deterministic clinical rule engine. The AI provides supporting narrative only and can never change your classification. This is a deliberate safety decision: a clinical decision must be reproducible and auditable, and an AI model's output is neither.

**Is my payment real?**
No. All payments in this version are simulated. No money is taken and no real account is charged. Please do not enter genuine payment details.

**Who can see my medical information?**
You, the doctor you have an appointment with, and administrators for audit purposes. **However**, this version has a known security limitation: the application's programming interface does not yet verify who is asking before returning data. Because of this, **do not enter any real personal or medical information into this demonstration system.** This is documented as items TD-01 and TD-03 in the Technical Debt Plan and is scheduled for repayment in the first release after this one.

**Can I use this on my phone?**
Yes. The interface is responsive and works on mobile, tablet and desktop browsers. There is no app to install.

**What happens to my triage history?**
Assessments are kept permanently and are never edited. A new assessment always creates a new record, so your clinical history remains complete and reviewable.

---

# 7. Known Limitations at a Glance

For completeness, the limitations referred to throughout this manual:

| Area | Limitation | Reference |
| :--- | :--- | :--- |
| Security | The programming interface does not verify the caller's identity. **Do not enter real personal or medical data.** | TD-01, TD-03 |
| Payments | Fully simulated; no money moves | TD-11 |
| Notifications | In-application only; no e-mail or SMS is sent | TD-12 |
| Consultation room | Local camera preview only; no two-way audio or video | TD-10 |
| Triage rules | Administrator edits are session-scoped and do not affect patients | TD-04 |
| Appointments | Cannot be rescheduled or cancelled by the patient | TD-07 |
| Accounts | No e-mail verification and no password reset | TD-05 |
| Accessibility | Not yet verified against WCAG 2.1 AA | TD-09 |
| Clinical content | The rule thresholds are illustrative and are **not** clinically validated | Limitation L1 |

Every one of these is documented, costed and scheduled in `Technical_Debt_Plan.docx`.

---

# 8. Support

| Purpose | Contact |
| :--- | :--- |
| Technical questions about this submission | Ernest Nketia Asubonteng (Index No. 22424715) |
| Source code and issue tracking | <https://github.com/NketiaAsubontengErnest/pulsetriage> |
| **Medical emergency** | **Call 112 (Ghana) or attend your nearest emergency department. Do not use this application.** |

---

*End of User Manual.*
