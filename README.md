# FlexiFit: Hybrid Personal Coaching & Indigenous Nutrition (Uganda)

FlexiFit is a full-stack, production-grade hybrid fitness coaching platform specifically tailored for urban professionals and personal trainers in Uganda. It bridges high-touch human coaching with localized indigenous nutrition (Matooke, Posho, Groundnut Sauce, Mukene, Luwombo, Rolex, etc.), on-device kinematic computer vision (MediaPipe), and multimodal biomechanical evaluation via Google Gemini 3.8 Flash Vision.

---

## 🌟 Key Features

### 1. Trainer Web SaaS Dashboard
- **Client Triage Roster:** Instant compliance status flags:
  - 🔴 **Missed Workouts:** 3+ consecutive days of inactivity
  - 🟠 **Nutrition Deficit:** 7-day average macro adherence below 70%
  - 🟡 **Stale Weight:** Weight unlogged for >7 days
  - 🔵 **Overdue Check-in:** Weekly biofeedback form pending
- **Interactive Builders:**
  - **Workout Builder:** Create multi-day plans, assign sets/reps/target RPE, and filter by bodyweight or gym equipment.
  - **Meal Plan Builder:** Compose authentic Ugandan meal regimens with instant macro calculations (Protein, Carbs, Fat, Kcal) and portion scaling.
- **Ugandan Food Composition Database:**
  - 60+ pre-seeded indigenous foods with verified local nutrient profiles.
  - Free Open Food Facts barcode/API search proxy.
  - "Approximate values, to be validated by a nutritionist" regulatory safety banner.
- **Business Economics & MRR:**
  - Live revenue metrics in Uganda Shillings (**UGX**).
  - Monthly Recurring Revenue (MRR), active client counts, tier distribution (Standard vs Pro), and cohort health.

### 2. Client Progressive Web App (PWA)
- **Today's Command Center:**
  - Animated SVG macro adherence rings (Calories, Protein, Carbs, Fats).
  - One-tap daily workout and meal logger shortcuts.
  - Current streak counter and daily motivational greetings in Luganda/English.
- **Ugandan Meal Logger:**
  - Local portion scaling units (1 fist, 1 cup, 1 piece, 1 scoop).
  - Instant nutritional calculation against daily targets.
- **Workout Logger with Rest Stopwatch:**
  - Log completed sets, reps, load in kg, and RPE.
  - Interactive rest timer (30s, 60s, 90s, 120s) with Web Audio synthesized chime when rest ends.
- **Progress Tracking & Analytics:**
  - Weight trend curve vs goal weight.
  - 7-day and 30-day macro compliance percentage bars.
  - Workout completion frequency chart.
- **Weekly Biofeedback Check-in:**
  - Multi-factor self-reported metrics (Sleep quality, Digestion, Energy, Stress, Diet compliance).
- **Direct Coach Communication & "Call My Trainer":**
  - Real-time coach messaging.
  - Instant direct call, pre-populated WhatsApp message (`+256 772 123456`), and Google Meet / Zoom one-tap links.
- **Uganda Mobile Money (MTN & Airtel MoMo) Billing:**
  - Full simulated USSD push prompt flow (`*165#` / `*185#`).
  - Transaction reference generation, instant digital receipt, and subscription tier activation.

### 3. Computer Vision & Biomechanics
- **Real-Time On-Device Pose Tracking (`@mediapipe/tasks-vision`):**
  - Evaluates joint angles (Hip, Knee, Ankle, Elbow, Shoulder) in real time at 30+ FPS directly in the browser using WebGL/WASM.
  - Live rep counting with state hysteresis (eccentric vs concentric transitions).
  - Immediate audio/visual form cues (e.g. "Hit 90° parallel depth!", "Keep hips up!").
- **AI Video Form Check (Google Gemini 3.8 Flash Vision):**
  - Clients upload 5–15 second video clips of complex lifts (Squat, Deadlift, Push-up).
  - Canvas extracts 5 keyframes (start, apex, bottom, lockout) and sends them to Gemini 3.8 Flash.
  - Returns structured biomechanical scorecards:
    - Overall score (0–100)
    - "What looks solid" positive reinforcements
    - "Opportunities to refine" technical cues
    - Safety & injury-prevention warnings
    - Immediate 1-sentence coach cue

---

## 🏗️ Architecture & Dual Database Adapters

FlexiFit features an interchangeable repository architecture (`IDataAdapter`):

```
                   ┌──────────────────────────────────┐
                   │    Express API + React Frontend  │
                   └────────────────┬─────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   IDataAdapter API   │
                         └──────────┬───────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
   ┌───────────────────────┐                 ┌───────────────────────┐
   │ SQLite Adapter        │                 │ Oracle ORDS Adapter   │
   │ (Local Zero-Config)   │                 │ (Enterprise Cloud)    │
   │ better-sqlite3 + WAL  │                 │ REST to Oracle 23c    │
   └───────────────────────┘                 └───────────────────────┘
```

1. **Default Mode (SQLite):** Runs out of the box with zero external dependencies using `better-sqlite3` in WAL mode. Seeds 4 weeks of rich historical data for Coach Brian and 6 Ugandan clients.
2. **Enterprise Mode (Oracle Database / APEX):** Switch simply by setting `ORDS_BASE_URL` in your environment. The application will immediately route all queries through Oracle REST Data Services (ORDS).

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Start development server (serves both API and Vite on http://localhost:3000)
npm run dev
```

---

## 🗄️ Oracle Database & APEX Deployment Guide

All necessary Oracle SQL scripts are provided in `/db/oracle/`:

1. `/db/oracle/01_schema.sql`: Full DDL script creating tables (`ff_users`, `ff_trainer_profiles`, `ff_client_profiles`, `ff_foods`, `ff_exercises`, `ff_workout_plans`, `ff_meal_plans`, `ff_plan_assignments`, `ff_workout_logs`, `ff_workout_sets`, `ff_meal_logs`, `ff_weight_logs`, `ff_check_ins`, `ff_messages`, `ff_call_requests`, `ff_subscriptions`, `ff_pose_sessions`, `ff_form_checks`), check constraints, foreign keys, and the compliance triage view `v_client_flags`.
2. `/db/oracle/02_seed_foods.sql`: Inserts 60+ authentic Ugandan foods with exact macronutrient profiles into `ff_foods`.
3. `/db/oracle/03_seed_demo.sql`: Seeds Coach Brian Mukasa and 6 client personas with 4 weeks of workout logs, meal logs, weights, and check-ins.
4. `/db/oracle/04_ords_rest.sql`: Enables the `flexifit` ORDS REST module with full GET/POST endpoints.

### Step-by-Step Oracle Deployment:
1. Log in to your Oracle Cloud Infrastructure (OCI) Autonomous Database or Oracle APEX Workspace.
2. Open **SQL Workshop -> SQL Scripts**.
3. Upload and run the scripts in order:
   - `01_schema.sql`
   - `02_seed_foods.sql`
   - `03_seed_demo.sql`
   - `04_ords_rest.sql`
4. Copy your ORDS Base URL (e.g. `https://<tenant>-<db>.adb.<region>.oraclecloudapps.com/ords/<workspace>/flexifit/`).
5. Configure your environment variable:
   ```bash
   ORDS_BASE_URL="https://your-tenant.adb.us-ashburn-1.oraclecloudapps.com/ords/flexifit/flexifit"
   ```
6. Start FlexiFit. It will automatically detect `ORDS_BASE_URL` and connect to your Oracle Database.

---

## 👥 Demo Accounts & Pre-Seeded Personas

FlexiFit comes pre-configured with instant 1-click role switcher buttons in the navbar and login modal:

| Name | Role | Email | Password | Persona & Status |
|---|---|---|---|---|
| **Coach Brian Mukasa** | Trainer | `brian@flexifit.ug` | `password123` | Lead Coach at FlexiFit Kampala; manages 6 clients |
| **Namubiru Sarah** | Client | `sarah@flexifit.ug` | `password123` | 29, Kololo corporate analyst; 18-day streak; On Track |
| **Kato Ronald** | Client | `kato@flexifit.ug` | `password123` | 34, Nakasero banker; 🔴 Missed 4 consecutive workout days |
| **Babirye Joan** | Client | `joan@flexifit.ug` | `password123` | 27, Bukoto marketing specialist; 🟠 Nutrition deficit (62% adherence) |
| **Okello Patrick** | Client | `patrick@flexifit.ug` | `password123` | 38, Ntinda engineer; 🟡 Stale weight (>8 days unlogged) |
| **Auma Grace** | Client | `grace@flexifit.ug` | `password123` | 31, Bugolobi lawyer; 🔵 Overdue weekly check-in |
| **Mugisha David** | Client | `david@flexifit.ug` | `password123` | 25, Kyambogo athlete; Perfect compliance, hyper-focused |

---

## 🎬 5-Minute Demo Walkthrough Script

Use this narrative script during client presentations, investor pitches, or stakeholder reviews:

### Minute 1: The Ugandan Problem & The Triage Dashboard
- **Presenter:** *"Personal trainers in Kampala face a unique challenge: urban professionals work long hours, navigate Kampala traffic, and consume rich indigenous foods that Western apps like MyFitnessPal simply do not represent accurately. FlexiFit solves this by uniting human coaching, Ugandan nutritional science, and edge AI."*
- **Action:** Open FlexiFit. Coach Brian's dashboard loads immediately.
- **Point out:** The **Client Roster & Triage Queue**. Note how Ronald Kato is flagged with a red badge (🔴 Missed 4 days of workouts), Joan Babirye is flagged orange (🟠 62% macro adherence), Patrick Okello is flagged yellow (🟡 9 days without a weight check), and Grace Auma is flagged blue (🔵 Missed weekly check-in).
- **Click:** Kato Ronald's card to open his full client dossier, recent set logs, and quick coach intervention notes.

### Minute 2: Localized Meal Planning & Ugandan Foods Database
- **Presenter:** *"Instead of telling an athlete to eat oatmeal and kale, Coach Brian builds regimens using what Ugandans actually eat."*
- **Action:** Click **Ugandan Foods DB** in the top navigation.
- **Showcase:** Show **Matooke**, **Posho**, **Katogo**, **Groundnut sauce**, **Rolex**, and **Mukene**.
- **Action:** Click **Meal Plan Builder**. Compose a day's meal plan by adding 200g of Matooke and 100g of Beef Stew. Notice how the macro progress bars dynamically update in real time.
- **Showcase:** The Open Food Facts search tab for packaged goods and the regulatory disclaimer: *"Approximate values, to be validated by a nutritionist."*

### Minute 3: Switching to Client View & Today's Command Center
- **Action:** Click **Demo Role -> Client (Sarah)** in the top right navbar.
- **Presenter:** *"Now we are Sarah Namubiru, a corporate analyst in Kololo opening the FlexiFit PWA on her phone."*
- **Showcase:**
  - The animated SVG macro rings (Calories, Protein, Carbs, Fat) reflecting her meals today.
  - The 18-day streak fire icon.
  - Her scheduled workout: *"Kampala Strength: Lower Body Power"*.
  - Her assigned meal plan for today.

### Minute 4: Kinematic CV & Gemini 3.8 Flash Vision Form Checks
- **Action:** Click **Live Pose (MediaPipe)** in the client tabs.
- **Presenter:** *"FlexiFit includes real-time on-device biomechanical tracking powered by MediaPipe. It runs 100% locally in the browser with zero video sent to any server."*
- **Showcase:** The kinematic skeleton overlay, joint angle math (Knee angle, Hip angle), and rep counter with audio feedback.
- **Action:** Click **AI Vision Form Check**.
- **Presenter:** *"For heavy lifts, Sarah can upload a short video. Google Gemini 3.8 Flash Vision analyzes keyframes extracted on an HTML5 canvas to produce instant biomechanical scorecards."*
- **Showcase:** The scorecard showing form rating (84/100), positive cues, safety warnings, and the specific coach cue: *"Drive knees outward over your toes on the ascent."*

### Minute 5: Mobile Money Billing (MTN / Airtel MoMo) & Call My Trainer
- **Action:** Click **Call Trainer Brian**.
- **Showcase:** Direct phone call, instant WhatsApp chat with pre-written message, and Google Meet integration.
- **Action:** Click the **MTN / Airtel MoMo** subscription badge.
- **Presenter:** *"Subscription billing in East Africa happens through Mobile Money, not credit cards."*
- **Action:** Select MTN Mobile Money, enter `0772 111222`, and click **Simulate MoMo Payment**.
- **Showcase:** The simulated USSD prompt (`*165# Enter PIN`), digital payment receipt with transaction ID and UGX 90,000 charge, and instant Pro tier renewal.

---

## 🧪 Testing

FlexiFit maintains a test suite covering pure domain logic:
```bash
npm test
```
Tests run using Node's native test runner (`tsx --test`) verifying:
- Joint angle trigonometry and coordinate math (`angleMath.test.ts`)
- Squat depth, push-up hip alignment, and plank kinematics
- Client triage compliance flag algorithms (`flagLogic.test.ts`)
- Ugandan portion scaling and 7-day adherence calculations (`macroCalc.test.ts`)
- Authentication hashing and JWT validation (`authService.test.ts`)

---

## 📄 License
Apache-2.0
