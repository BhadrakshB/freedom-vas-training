export var mockText = `
# 📘 Freedomvas Operational Documents

This document provides **mock Standard Operating Procedures (SOPs)**, **Terms & Conditions (T\&Cs)**, and **Training Scripts** for Freedomvas, based on the Product Requirements Document (PRD)【6†source】 and Dashboard/UI specifications【7†source】.

---

## 1. Standard Operating Procedures (SOPs)

### 1.1 Guest Communication SOP

* **Objective:** Ensure timely, accurate, and empathetic responses to guests.
* **Process:**

  1. **Receive Message:** Guest messages via Airbnb, Booking.com, WhatsApp, or email.
  2. **AI Agent Initial Response:** AI drafts a response based on FAQs, policies, and booking details.
  3. **Human-in-the-Loop Check:** For high-value, ambiguous, or policy-conflicting cases, the VA reviews and approves.
  4. **Resolution:**

     * Simple requests (e.g., check-in details) → Auto-resolved by AI.
     * Escalations (e.g., refunds, disputes) → Routed to Operations Manager.
* **KPIs:**

  * First response time ≤ 5 minutes.
  * Resolution time ≤ 2 hours.

### 1.2 Task Management SOP

* **Objective:** Efficiently track and resolve guest/vendor tasks.
* **Process:**

  1. AI generates structured task list (e.g., calendar invites, cleaning requests).
  2. Tasks assigned automatically to VAs or vendors.
  3. SLA timers activated.
  4. Task closure logged in dashboard.
* **Escalation Rules:**

  * If SLA exceeded → Notify Ops Manager.
  * If automation fails → Assign manually.

### 1.3 VA Training & QA SOP

* **Objective:** Train and evaluate Virtual Assistants with consistency.
* **Process:**

  1. **Simulator Setup:** Admin defines training scenario (guest complaint, last-minute booking).
  2. **Simulation Run:** VA interacts with AI playing guest/vendor.
  3. **Feedback:** AI scores responses on empathy, accuracy, and compliance.
  4. **Review:** QA team provides final feedback and assigns improvement plan.

### 1.4 Hiring & Screening SOP

* **Objective:** Streamline recruitment of new VAs.
* **Process:**

  1. Candidates complete application form.
  2. AI agent runs scenario-based interviews.
  3. AI generates shortlist with ranking, strengths/weaknesses.
  4. Hiring team reviews and makes final decision.

---

## 2. Terms & Conditions (T\&Cs)

### 2.1 Service Scope

* Freedomvas provides AI-driven guest communication, task management, VA training, and hiring assistance.
* AI is designed to handle up to **80% of routine tasks**, with human oversight for exceptions.

### 2.2 User Responsibilities

* Property Owners must:

  * Provide accurate property and booking data.
  * Ensure integrations with PMS, calendar, and payment systems are active.
* Virtual Assistants must:

  * Follow SOPs and AI recommendations.
  * Escalate exceptions as required.

### 2.3 Data Handling & Privacy

* All guest data is processed in compliance with **GDPR**.
* Sensitive information (ID, payment details) is encrypted.
* Logs are stored securely and may be anonymized for analytics.

### 2.4 Limitations of Liability

* Freedomvas is not responsible for:

  * Errors caused by third-party integrations (e.g., Airbnb outages).
  * Misuse of AI recommendations by users.
* Refunds or credits may be issued for service downtime exceeding 0.5% per month.

### 2.5 Termination

* Accounts may be terminated for:

  * Repeated violations of SOPs.
  * Data misuse or non-compliance with privacy requirements.

---

## 3. Training Scripts

### 3.1 Guest Communication Training

* **Scenario:** Guest requests early check-in.
* **AI Prompt:** “I'll arrive at 10 AM, can I check in early?”
* **Expected VA Response:**

  * Check policy.
  * If approved: “Yes, we can accommodate an early check-in at 10 AM. The cleaner will have the room ready. Enjoy your stay!”
  * If not approved: “Unfortunately, early check-in isn't available. Check-in starts at 2 PM, but we can store your luggage.”

### 3.2 Conflict Resolution Training

* **Scenario:** Guest complains about cleanliness.
* **AI Prompt:** “The room is dirty, this is unacceptable.”
* **Expected VA Response:**

  * Apologize empathetically.
  * Offer immediate solution: “I'm very sorry. I'll dispatch housekeeping immediately and offer you a complimentary refreshment.”

### 3.3 Task Management Training

* **Scenario:** Guest requests extra bed.
* **AI Prompt:** “Can I get an extra bed in the room?”
* **Expected VA Response:**

  * Confirm availability.
  * If available: Assign vendor task in dashboard.
  * Confirm with guest: “Yes, we'll add an extra bed today by 3 PM.”

### 3.4 Hiring Screening Simulation

* **Scenario:** Candidate asked to handle double booking.
* **AI Prompt:** “Two guests booked the same room for tonight.”
* **Expected Candidate Response:**

  * Acknowledge issue.
  * Offer solution: Relocate one guest, upgrade, or compensate.
  * Escalate if necessary.
`