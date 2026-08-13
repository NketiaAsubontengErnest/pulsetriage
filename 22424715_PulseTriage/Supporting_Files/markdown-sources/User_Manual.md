---
title: "User Manual"
subtitle: "PulseTriage — Telehealth Appointment & Urgency Auto-Triage System"
author: "Ernest Nketia Asubonteng (22424715)"
date: "CSCD 602 Advanced Software Engineering · University of Ghana"
lang: en-GB
---

# USER MANUAL

**PulseTriage — Telehealth Appointment & Urgency Auto-Triage System**

Application address: <https://pulsetriage.vercel.app>

> ### Before you begin — please read
>
> **PulseTriage does not handle medical emergencies.** If you or someone with
> you has chest pain, difficulty breathing, signs of a stroke, severe bleeding
> or any other emergency, **call your local emergency number immediately**. Do
> not wait for an appointment.
>
> **This is a demonstration system.** Please do not enter real personal or
> medical information. It has not been cleared to hold real patient data.
>
> **It does not give you a diagnosis.** It estimates how urgently you should be
> seen and helps you book with the right kind of doctor. Only a clinician can
> diagnose you.

---

> ### A note on illustrations
>
> This manual is written to be followed without pictures: every instruction
> names the exact control you should look for and what you will see after using
> it. Screenshots have not been embedded because none were captured before
> submission, and inventing them would misrepresent the interface.
>
> Where a screenshot would help most, the text carries a marked placeholder such
> as **[Screenshot: patient dashboard]** describing precisely what should be
> captured. To complete the manual, take each named screenshot at a browser
> width of about 1280 px, save it into `Supporting_Files/images/` using the name
> given in the placeholder, and replace the placeholder line with a standard
> Markdown image reference.

---

# 1. Getting Started

## 1.1 What you need

| Requirement | Detail |
|---|---|
| A device | Computer, tablet or phone |
| A browser | A current version of Chrome, Edge, Firefox or Safari |
| Internet | Any reasonable connection; the system works on mobile data |
| Camera and microphone | Only if you will join a video consultation |

## 1.2 Opening the application

Type **pulsetriage.vercel.app** into your browser's address bar and press Enter.
You will arrive at the welcome page, which explains what the system does and
offers **Create an account** and **Sign in**.

**[Screenshot: landing page — the full welcome page at 1280 px width, showing the headline and both buttons. Save as `screenshot-01-landing.png`.]**

## 1.3 Demonstration accounts

For assessment, three accounts already exist. **Every one uses the password
`password123`.**

| Role | E-mail | What you will see |
|---|---|---|
| Patient | `patient@ug.edu.gh` | The patient portal |
| Doctor | `dr.mensah@ug.edu.gh` | The clinical workspace |
| Administrator | `admin@ug.edu.gh` | The operations centre |

The sign-in page also has a one-click button for each of these, so you do not
need to type them.

## 1.4 Signing in

1. Click **Sign in**.
2. Enter your e-mail address and password.
3. Click **Sign in**.

If you prefer, click one of the demonstration buttons instead.

You are taken straight to the portal for your role. If your details are not
recognised, a message appears above the form explaining what to check — your
details are never partially accepted.

**[Screenshot: sign-in page — showing the form, the password visibility toggle and the three demonstration buttons. Save as `screenshot-02-signin.png`.]**

## 1.5 Creating a patient account

1. Click **Create an account**.
2. Enter your full name, e-mail address and phone number.
3. Choose a password. It must be at least 8 characters and include a capital
   letter, a small letter, a number and a symbol such as `!` or `@`. The form
   tells you which of these is still missing as you type.
4. Re-enter the same password to confirm it.
5. Click **Create account**.

You are signed in immediately and taken to your dashboard.

## 1.6 Finding your way around

| Element | Where | What it does |
|---|---|---|
| Sidebar | Left (a menu button on phones) | Moves between the sections of your portal |
| Bell icon | Top right | Your notifications; a red number means unread |
| Your name | Top right | Opens a menu with **My Profile** and **Sign out** |
| Light/dark toggle | Top right | Switches between light and dark appearance |

## 1.7 Signing out

Click your name in the top-right corner and choose **Sign out**. On a shared
computer, always sign out when you finish.

---

# 2. Patient Guide

## 2.1 Your journey

```
Describe symptoms  →  Receive urgency  →  Choose a doctor and time
      →  Pay  →  Attend the consultation  →  Receive your notes
```

## 2.2 Step 1 — Describe your symptoms

From your dashboard, click **Start Symptom Triage**. You will answer four short
groups of questions. It takes about three minutes.

**Choose your main symptom.** Pick the option closest to what is troubling you
most. If several apply, choose the one that worries you most.

**Say how long it has lasted.** Choose from the options offered — for example
*Sudden (under 6 hours)* or *Over a week*. Something that began suddenly is
treated as more urgent than something long-standing.

**Rate your pain or discomfort from 1 to 10.** Be honest. Understating it may
mean you are seen later than you should be.

| If you would say… | Choose roughly |
|---|---|
| I barely notice it | 1–2 |
| It is annoying but I can carry on | 3–4 |
| It is distracting and hard to ignore | 5–6 |
| It is difficult to do anything else | 7–8 |
| It is the worst pain I have felt | 9–10 |

**Tick any warning signs that apply.** This is the most important question in
the assessment. Read the list carefully and tick everything that is true. These
are the findings that mean you may need care immediately rather than at an
appointment. **If you are unsure whether one applies, tick it.**

Then click **Evaluate my symptoms**.

**[Screenshot: triage step 4 — the warning-signs checklist with two items ticked. Save as `screenshot-03-redflags.png`.]**

## 2.3 Understanding your result

You will see a score out of 100 and one of four urgency levels.

| Level | What it means | What happens next |
|---|---|---|
| **EMERGENCY** | You may need care immediately | You are directed to emergency services. **No appointment is offered.** |
| **URGENT** | You should be seen very soon | Book the earliest slot, usually the same day |
| **SEMI-URGENT** | You should be seen soon, but it can wait a little | Book within a day or two |
| **ROUTINE** | Not urgent | Book whenever suits you |

You will also see the type of specialist suggested for you, and a short
explanation of why you were given this level.

> **If your result is EMERGENCY, the system will not let you book an
> appointment.** This is deliberate and it is not a fault. It means your symptoms
> should be assessed now, not at a future appointment. Call your local emergency
> number or go to the nearest emergency department.

**[Screenshot: an EMERGENCY result — showing the score, the emergency guidance, and the absence of any booking button. Save as `screenshot-04-emergency.png`.]**

## 2.4 Step 2 — Book your consultation

If your result allows booking, click **Book with recommended specialist**.

1. **Choose a doctor.** You will see the suggested specialty first. Each doctor
   shows their fee and rating.
2. **Choose a date.** Use the date picker.
3. **Choose a time.** Only the times that doctor actually works are shown.
   A time already taken appears greyed out with a small padlock and cannot be
   chosen.

If a doctor does not work on the day you picked, the system tells you so and
invites you to try another date. If you see no times at all, that doctor has not
published hours for that day.

**[Screenshot: the booking step — showing the slot grid with several available times and at least one locked, taken slot. Save as `screenshot-05-booking.png`.]**

## 2.5 Step 3 — Pay

> **No real money is involved.** Payment in this system is simulated for
> demonstration. Nothing is charged and no card or wallet is contacted.

1. Choose **Mobile Money** or **Card**.
2. Enter the account number. For the demonstration, `0241234567` succeeds.
3. Click **Confirm and pay**.

You will see a reference beginning `PAY-SIM-` and your appointment becomes
**CONFIRMED**.

*To see what a declined payment looks like,* enter `00000` instead. The
appointment stays as **PENDING PAYMENT** and you can try again — nothing is lost.

## 2.6 Managing your appointments

Open **My Appointments** in the sidebar. Each appointment shows the doctor, date,
time and status.

| Status | Meaning |
|---|---|
| **PENDING PAYMENT** | Booked but not yet paid; the slot is held for you |
| **CONFIRMED** | Paid and scheduled |
| **COMPLETED** | The consultation has happened and your notes are ready |
| **CANCELLED** | No longer going ahead |

**To reschedule**, click **Reschedule** and pick a new date and time. You are not
charged again. The system checks the new time is genuinely free.

**To cancel**, click **Cancel**. The slot is released for someone else.

## 2.7 Step 4 — Joining your consultation

When it is time, open **My Appointments** and click **Join consultation** on the
confirmed appointment.

Your browser will ask for permission to use your camera and microphone. Choose
**Allow**. Without this the doctor cannot see or hear you.

Inside the room you will see the doctor's video filling most of the screen, with
your own picture in a small tile. Along the bottom are:

| Control | What it does |
|---|---|
| Microphone | Mutes or unmutes you |
| Camera | Turns your video off or on |
| Speaker | Mutes or unmutes the doctor's sound on your device |
| Screen (desktop only) | Shares your screen |
| **Leave consultation** | Ends the call for you |

**On a phone**, tap the blue chat button to open the chat; a number on it shows
unread messages.

**[Screenshot: the consultation room on a phone — showing the doctor's video, your own tile, the control bar and the floating chat button. Save as `screenshot-06-consultation.png`.]**

### If something is not working

| Problem | What to do |
|---|---|
| You cannot hear the doctor | Tap the speaker button. If a yellow bar says *Tap to hear*, tap it — your phone is blocking sound until you ask for it |
| The doctor cannot hear you | Check the microphone button is not red. Open **Info** to see whether your microphone was detected |
| No picture from the doctor | Wait a few seconds while the connection is made. The screen tells you what stage it has reached |
| Your camera will not start | Close other applications using the camera and reload. The consultation continues by voice if the camera stays unavailable |

## 2.8 After the consultation

When the doctor signs off, you receive a notification and the appointment becomes
**COMPLETED**. Open it to read your notes, which include what was discussed, the
doctor's assessment, any prescription and when to follow up.

Your previous assessments stay under **Triage History**.

---

# 3. Doctor Guide

## 3.1 Your workspace

Sign in with your clinician account. You arrive at the clinical workspace.

| Section | Purpose |
|---|---|
| Clinical Workspace | Today's queue and shortcuts |
| Works Pending | Cases triaged but not yet consulted |
| Upcoming Works | Your scheduled consultations |
| Work Done / Already Completed | Your signed records |
| Clinical AI Suite | AI documentation and decision support |
| Schedule Slot Manager | The hours you consult |

## 3.2 Working the queue

**Your queue is ordered by clinical urgency, not by booking time.** The most
unwell patient is at the top regardless of when they booked. Each entry shows the
urgency tier and severity score.

**[Screenshot: the clinical workspace — the queue with an EMERGENCY case at the top and its urgency badge visible. Save as `screenshot-07-queue.png`.]**

## 3.3 Publishing your consulting hours

This controls what patients can book, so it matters.

1. Open **Schedule Slot Manager**.
2. For each weekday you consult, tick the day and set a start time, an end time
   and a slot length.
3. Click **Save availability**.

The panel on the right shows exactly the slots a patient will see for any date
you choose, including which are already booked. If a day shows no slots, no
patient can book you on that weekday.

## 3.4 Conducting a consultation

Click **Join consultation** on a confirmed appointment. Alongside the video you
have four tabs:

| Tab | Contents |
|---|---|
| **Chat** | Live messages with the patient |
| **Patient** | Their intake record: contact details, reason for visit, triage tier, severity, pain score, warning signs, and notes from previous consultations |
| **Notes** | A notepad that saves as you type and carries into your write-up |
| **AI** | Clinical decision support scoped to this patient |

On a phone these are behind the clipboard button.

The **Notes** tab is the one to use during the call. It saves automatically, it
survives a reload, and whatever you write appears in the wrap-up form when you
end the call — so nothing is lost if the connection drops.

## 3.5 Using the AI assistant

The AI panel can suggest differential diagnoses, list red flags to exclude, draft
a treatment plan, or answer a typed question. The patient's triage record, the
in-call chat and your working notes are supplied as context automatically.

Every answer is labelled with the model that produced it and how strongly the
models agreed. A low agreement score means they disagreed — read that suggestion
more carefully.

> **The AI does not make clinical decisions.** Nothing it produces reaches the
> patient's record until you have reviewed, edited and submitted it. If the
> models cannot be reached, the panel says so plainly. It will never substitute
> invented content that looks like a generated answer.

Use **Insert into notes** to move a useful answer into your notepad, where you
can edit it.

## 3.6 Completing the consultation

Click **End call and write notes**. The wrap-up form opens, pre-filled with your
in-call notes and the patient's intake record.

Complete the sections — history, examination findings, assessment and diagnosis,
plan and prescriptions, follow-up. **Draft SOAP note with AI** will populate them
for you to review and correct.

Check every line, then click **Submit notes and mark consultation completed**.
The patient is notified and can read the record. Nothing is written to their file
until you press this button.

---

# 4. Administrator Guide

## 4.1 Operations centre

Sign in with the administrator account for platform metrics: registered patients,
verified clinicians, assessments run and consultations completed.

## 4.2 Managing clinicians

Open **Doctor Operations** to list clinicians and their verification status.

**A clinician who is not verified is not offered to patients.** Verification is
the control that decides who may practise on the platform. Review the licence
number before verifying.

You can also add a clinician and maintain the list of specialties.

## 4.3 Reviewing the triage rules

**Triage Rules Engine** shows the active rules with their conditions, weights and
priorities, and lets you evaluate a hypothetical case to see what the engine
would return. This affects nothing real — it is a simulator.

> **Please note:** changes made on this screen are not saved and do not affect
> what patients experience. This is a known limitation, recorded as TD-04 in the
> Technical Debt Plan.

## 4.4 The audit trail

**System Audit Logs** shows an append-only record of registrations, assessments,
bookings, payments, profile changes and administrative actions, each with who did
it, what they did and when. Records cannot be edited or deleted.

---

# 5. Managing Your Account

Open **My Profile** from the sidebar or the menu under your name. Available to
every role.

**To change your photograph**, click **Choose photo** and select an image. It is
resized in your browser before it is saved. Click **Save changes** to apply it.
**Remove** clears it.

**To change your details**, edit your name or phone number and click **Save
changes**. Your e-mail cannot be changed here because it is your sign-in name.
Doctors can also edit their specialty and biography.

**To change your password**, enter your current password, then your new one
twice, and click **Change password**. Your current password is required — this
is what stops someone using an unattended screen to take over your account.

---

# 6. Troubleshooting

| Problem | What to do |
|---|---|
| Cannot sign in | Check the e-mail address for typing errors. Demonstration accounts all use `password123`. There is no password reset in this version |
| Page will not load | Reload. If it persists, the hosting platform may be briefly unavailable |
| No time slots when booking | That doctor does not consult on that day. Try another date or another doctor |
| Slot rejected when confirming | Someone booked it in the meantime. Choose another; the system prevents two people holding one slot |
| Camera or microphone not working | Check the browser's address bar for a blocked-permission icon, close other applications using the device, and reload |
| AI panel shows a red banner | Inference is unreachable. Every other function is unaffected — this is by design |
| No notifications arriving | Notifications appear inside the application only. No e-mail or SMS is sent in this version |

---

# 7. Getting Help

Use the **Contact** page to send a message. It reaches the platform
administrators and is recorded. Give your name, an e-mail address they can reply
to, and a clear description.

**Do not use the contact form for anything medical or urgent.** It is for
questions about using the system. For medical concerns, book a consultation. For
emergencies, call your local emergency number.

---

*End of User Manual.*
