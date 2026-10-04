# FixIt AI ⚡☀️🔌🏠

> **See it. Describe it. Diagnose it. Fix it.**  
> *“Don’t just ask AI what’s wrong. Let AI help you find out.”*

**FixIt AI** is a mobile-first web application that helps users diagnose common technical problems with electrical, electronic, solar, and household equipment using **open-weight AI models** (Google Gemma).

Instead of dumping an overwhelming wall of text, FixIt AI acts as a **technical pair-troubleshooter**: assessing safety, formulating ranked hypotheses, conducting dynamic diagnostic checks **one step at a time**, taking multimeter measurements, and distinguishing between safe DIY resolutions and qualified technician handovers.

---

## 🚀 Key Features

* **Mobile-First Technical UI (320px &ndash; 480px optimized + Responsive Desktop)**:
  * Bottom navigation (`Home`, `Diagnose`, `History`, `Settings`)
  * High-contrast technical aesthetic with dark slate & clean light modes
  * Tactile touch targets (44px+), diagnostic badges, and LCD multimeter displays
* **Priority Safety Layer**:
  * Evaluates electrical, thermal, and chemical hazards before presenting any test instructions
  * Halts DIY steps if arcing, smoke, swollen lithium cells, or dangerous mains voltages are present
  * Prioritizes qualified technician referrals for hazardous work
* **Interactive Troubleshooting Mode (The Core Differentiator)**:
  * Delivers targeted diagnostic tests **one test at a time**
  * Dynamic decision tree that updates hypotheses and confidence based on each observation
  * Measurement support (digital multimeter voltage, current, and resistance inputs)
* **Four Primary Equipment Categories**:
  * ⚡ **Electrical**: Sockets, switches, breakers, wiring, junction boxes
  * ☀️ **Solar**: Solar panels, portable power stations, charge controllers, inverters, DC breakers
  * 🔌 **Electronics**: AC/DC power adapters, USB-C chargers, power supply units
  * 🏠 **Appliances**: Standing fans, desk lamps, electric heaters, kitchen mixers
* **Three Resolution States**:
  * 🟢 **Solved**: Identifies root cause and provides safe verification steps
  * 🟡 **Continue**: Gathers additional evidence when symptoms are ambiguous
  * 🔴 **Technician Required**: Provides a structured handover brief for a licensed technician
* **Session Persistence & History**:
  * Saves complete diagnostic logs, evidence checklists, and test timestamps in LocalStorage
  * Pre-loaded with realistic benchmark sessions (Solar Generator, Standing Fan, Overheating Adapter)
  * Print & clipboard sharing for field use or technician handoffs
* **Open-Weight AI Model Support**:
  * Configurable in Settings: Google Gemma-2 (9B / 27B) instruction models, Meta Llama 3, or deterministic local offline engine
  * Structured JSON schema response generation for consistent state transitions

---

## ⚡ 2-Minute Hackathon Demo Scenario

To experience the flagship demo in under 2 minutes:

1. Open `http://localhost:3000`
2. Click **"Run Demo"** on the hero banner (*Solar Generator Charging Problem*)
3. Review pre-populated description and reference diagram
4. Click **"Begin AI Diagnostic Process"**
5. **Step 1**: *"Check the solar input indicator on the display"* &rarr; Click **"No (Display is blank/zero input)"**
6. **Step 2**: *"Inspect the DC breaker or inline disconnect switch"* &rarr; Click **"No (It was OFF or tripped)"**
7. **Resolution**: System reaches **🟢 Problem Solved!**
   * Root Cause: *Inline DC breaker was switched off*
   * Displays safe user verification checklist and technician notes
   * Completed in ~2 minutes with audit log and exportable report

---

## 🛠️ Tech Stack

* **Framework**: Next.js (App Router, Turbopack, React 19, TypeScript)
* **Styling**: Vanilla CSS design system with CSS custom properties, grid layouts, and micro-interactions
* **Icons**: Lucide Icons
* **AI Architecture**: Open-weight diagnostic engine (Gemma-2-9B compatible structured JSON schema)

---

## 💻 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
