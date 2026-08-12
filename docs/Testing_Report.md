# TESTING & QUALITY ASSURANCE REPORT
## Telehealth Appointment & Urgency Auto-Triage System

**Course**: CSCD 602 Advanced Software Engineering  
**Examiner**: Prof. Solomon Mensah  

---

## 1. Testing Strategy Overview
The testing strategy combines **Automated Unit Testing** for the Rule Engine algorithm, **Integration Testing** for the appointment booking and simulated payment checkout flow, and **User Acceptance Testing (UAT)** across Patient, Doctor, and Admin roles.

---

## 2. Automated Unit Testing Results (`npm test`)

Command executed: `node --test tests/**/*.test.js`

| Test Case ID | Description / Scenario | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-UNIT-01** | Chest pain with red flag "Radiating pain to arm/jaw" | `EMERGENCY` status (Score >= 80) | `EMERGENCY` (Score: 88) | **PASS** |
| **TC-UNIT-02** | Severe headache + sudden onset (24h duration) | `URGENT` status (Score 60-79) | `URGENT` (Score: 68) | **PASS** |
| **TC-UNIT-03** | Routine medical certificate checkup (mild pain) | `ROUTINE` status (Score < 35) | `ROUTINE` (Score: 18) | **PASS** |

**Summary**: 3 of 3 automated unit test cases passed with 100% success rate.

---

## 3. Integration & System Test Suite

| Test Case ID | Component Under Test | Action / Step | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| **TC-INT-01** | Auto-Triage Wizard | Submit 3-step questionnaire | Severity score calculated, recommended specialty generated | **PASS** |
| **TC-INT-02** | Doctor Booking Modal | Select doctor, date & time slot | Slot locked, payment summary displayed | **PASS** |
| **TC-INT-03** | Simulated Payment Gate | Submit Mobile Money payment (0241234567) | Transaction ref generated (`PAY-SIM-*`), status set to `CONFIRMED` | **PASS** |
| **TC-INT-04** | Notification Queue | Booking completion | In-app notification badge updated in navbar | **PASS** |
| **TC-INT-05** | Doctor Workspace Queue | Log in as Doctor | Queue sorted with higher urgency score patient at top | **PASS** |
| **TC-INT-06** | Admin Tech Debt Audit | Open Admin portal | Technical debt matrix rendered with Cause, Impact, Resolution | **PASS** |

---

## 4. Defect Tracking Log
No critical defects remain. All edge cases handled cleanly.
