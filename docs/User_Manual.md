# SYSTEM USER MANUAL
## Telehealth Appointment & Urgency Auto-Triage System (PulseTriage)

---

## 1. Getting Started & Role Switcher
PulseTriage features a quick-switch role control in the top navigation bar, allowing examiners and users to test all three system portals effortlessly:
- **Patient Portal**: Test symptom auto-triage and slot booking.
- **Doctor Workspace**: Test clinical queue management sorted by urgency score.
- **Admin & Technical Debt**: Test system governance and audit matrices.

---

## 2. Patient Guide

### Step 1: Performing Symptom Auto-Triage
1. Navigate to the top bar and click **"Start Symptom Triage"** or click **"Start New Triage"** on the Patient Portal.
2. **Select Primary Symptom**: Choose from options such as Chest Pain, Breathing Difficulty, Severe Headache, Fever, Abdominal Pain, or Routine Checkup.
3. **Set Duration & Pain Scale**: Select symptom duration and slide the pain intensity score from 1 to 10.
4. **Safety Screening**: Check any critical red flags (e.g. chest pain radiating to arm/jaw, severe shortness of breath).
5. **Evaluate Rules**: Click **"Evaluate Triage Rules"**.
6. **Review Result**: The system displays your Urgency Level (`EMERGENCY`, `URGENT`, `SEMI_URGENT`, or `ROUTINE`), Severity Score out of 100, and recommended doctor specialty.

### Step 2: Booking a Doctor Consultation & Payment
1. Click **"Book Slot with Recommended Specialist"**.
2. Select your preferred Doctor, Date, and 30-minute Time Slot.
3. Choose Mobile Money or Card payment option in the Simulated Checkout modal.
4. Click **"Pay & Confirm Slot"**. Your appointment is instantly reserved, and a receipt notification is dispatched to your dashboard.

---

## 3. Doctor Guide

1. Click **"Doctor Queue"** on the top navigation bar.
2. Review **"Today's Patient Queue"**, which is automatically sorted by triage urgency (highest severity score at the top).
3. Click **"Review & Clinical Notes"** to open a patient's triage assessment breakdown.
4. Enter diagnostic observations and prescribed treatment in the **Doctor Clinical Notes** field.
5. Click **"Save & Mark Consultation Complete"**.

---

## 4. Administrator & Examiner Guide

1. Click **"Admin & Technical Debt"** on the top navigation bar.
2. **System Analytics**: View live metrics for Total Triage Cases, High Urgency Ratio, Registered Doctors, and Simulated Revenue.
3. **Doctor Verification**: Toggle verification status for listed doctors (`VERIFIED` vs `PENDING`).
4. **Technical Debt Matrix**: Inspect explicit technical debt items (`Debt → Cause → Impact → Priority → Proposed Resolution`).
