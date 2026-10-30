# FlexiFit — Production-Grade Hybrid Coaching & Localized Nutrition Platform

A complete, production-ready hybrid coaching and localized nutrition SaaS & PWA engineered for urban Ugandan professionals and certified fitness trainers. FlexiFit bridges the gap between expensive, rigid in-person gym training and generic global fitness apps that lack human accountability and completely ignore East African food composition.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Production Shift**: FlexiFit is being planned and built as a **fully real, production-ready product**, not a synthetic toy or throwaway demo:
> 1. **Data Layer**: Persistent SQLite with WAL mode (`better-sqlite3`) for zero-latency local/container deployment, alongside full Oracle 23c / APEX ORDS REST scripts in `/db/oracle/` with custom SQL/PL/SQL handlers for production cloud deployment.
> 2. **Real Authentication**: BCrypt password hashing (12 salt rounds), JSON Web Tokens (JWT) with HTTP-only cookies and Bearer token headers, persistent sessions, user profiles, and role-based access control (`trainer`, `client`, `admin`).
> 3. **Real Ugandan Nutrition Data**: Comprehensive 80+ item Ugandan food composition database cross-referenced with FAO/East African food tables (Matooke, Cassava, Posho, Kalo, Tilapia, Nile Perch, Mukene, Beans, G-Nuts, Sukuma Wiki, Dodo, Rolex, Katogo, Luwombo) with exact macro/micronutrient profiles, standard domestic measures (plates, ladles, pieces), plus free **Open Food Facts API** integration for packaged grocery barcode/name search.
> 4. **Real AI & Computer Vision**:
>    - Live camera biomechanics via Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision` PoseLandmarker), calculating real kinematic joint angles (hip/knee/ankle flexion, elbow hinge, pelvic alignment) at 30fps with audio chime feedback.
>    - Video form checks analyzed via **Google Gemini 3.8 Flash Vision** using structured JSON output schemas, providing granular phase-by-phase rep critiques, injury-risk warnings, and biomechanical cues.
> 5. **Real Channels & Scheduling**: Real WhatsApp deep links (`wa.me/<phone>?text=...`) with structured check-in templates, one-click Google Meet room generation (`meet.google.com/new`), and Zoom personal room routing.
> 6. **Real Mobile Money Payment System**: Full payment architecture adhering to standard Ugandan Mobile Money protocols (MTN MoMo API & Airtel Money developer specifications / Flutterwave UGX collection), featuring instant phone prompt dispatch, transaction reference validation, automated subscription tier provisioning, and printable receipts.

---

## 1. System Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FLEXIFIT APPLICATION                                   │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│           TRAINER WEB SAAS                │             CLIENT MOBILE PWA              │
│  (Desktop 1440px / Responsive Tablet)     │   (Mobile-First 390px / Responsive PWA)    │
│                                           │                                            │
│ • Client Compliance Triage Queue          │ • Today's Command Center (Rings & Streak)  │
│ • Interactive Workout Plan Builder        │ • Interactive Workout Logger & Rest Timer  │
│ • Macro-Balanced Meal Plan Builder        │ • Ugandan Meal Logger & FAO Food Search    │
│ • Ugandan Food DB Manager + Custom Items  │ • Live On-Device Pose Tracking (MediaPipe) │
│ • Biomechanical Form-Check Video Review   │ • Video Form-Check Upload & AI Feedback    │
│ • Business Scaling & UGX MRR Analytics    │ • Progress Telemetry (Weight & Adherence)  │
│ • Client Message Center & Call Dispatcher │ • Direct Coach Chat & 1-Tap Meet/WhatsApp  │
│                                           │ • Real MTN/Airtel MoMo Subscription Flow   │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          EXPRESS FULL-STACK SERVER (PORT 3000)                         │
│                                                                                        │
│  [Auth Engine]          [Vision & AI Proxy]        [External APIs]   [Data Adapter]    │
│  • BCrypt & JWT         • Gemini 3.8 Flash         • Open Food Facts • SQLite (WAL)    │
│  • Role Authorization   • Structured JSON Parser   • FX Rates (UGX)  • Oracle ORDS     │
│  • Rate Limiting        • Fallback Heuristics      • MoMo Webhooks   • Auto-Migration  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                   ┌────────────────────────┴────────────────────────┐
                   ▼                                                 ▼
        [ SQLite Adapter (Local/Live) ]                   [ Oracle APEX / ORDS ]
        • WAL mode persistent file                        • HTTPS REST modules
        • Foreign keys & ACID tx                          • PL/SQL compliance view
        • Auto-seeded with 80+ foods                      • Free tier compatible
```

---

## 2. Free APIs & External Services Integration

1. **Google Gemini API (`@google/genai`)**:
   - Model: `gemini-3.8-flash` (Free Tier).
   - Usage: Multimodal video frame inspection for exercise form analysis; AI meal recommendation engine suggesting authentic Ugandan substitutes (e.g. replacing white rice with high-fiber cassava or kalo).
   - Key read safely on server side via `process.env.GEMINI_API_KEY`.
2. **Open Food Facts API (`world.openfoodfacts.org`)**:
   - Free, unauthenticated REST API used for looking up global and packaged grocery items in Uganda (e.g., imported oats, protein powders, packaged milk/yogurt, canned tuna).
   - Server endpoint: `/api/foods/external-search?q=...` proxies calls to prevent CORS and enrich search results.
3. **Google Meet & WhatsApp Web Integration**:
   - Instant room launching via `https://meet.google.com/new` or trainer's custom vanity meeting link.
   - WhatsApp deep links with dynamic encoding (`https://wa.me/2567XXXXXXXX?text=...`) generating pre-populated weekly check-in summaries.
4. **Browser Standards & Device APIs**:
   - **WebRTC (`navigator.mediaDevices.getUserMedia`)**: High-framerate front/rear camera streaming for pose estimation.
   - **HTML5 Canvas 2D Context**: High-speed frame extraction at key kinematic inflection points (0%, 25%, 50%, 75%, 100% of motion) without requiring heavy server ffmpeg binaries.
   - **Web Audio API**: Synthetic audio oscillators for rep countdowns, form alert buzzers, and rest timer chimes.
   - **Service Worker & Web App Manifest**: Full offline caching of app shell, exercises, and recent meal logs.

---

## 3. Data Model & Database Architecture

The schema is implemented identically in **SQLite** and **Oracle SQL** (`NUMBER`, `VARCHAR2`, `TIMESTAMP WITH TIME ZONE`, `CHECK` constraints).

### Tables Summary

| Table Name | Primary Purpose | Key Fields |
| :--- | :--- | :--- |
| **`users`** | Core identities & credentials | `id`, `email`, `password_hash`, `role` (`trainer`\|`client`\|`admin`), `name`, `phone`, `avatar_url`, `created_at` |
| **`trainer_profiles`** | Trainer business & communication settings | `user_id`, `bio`, `specialties`, `meet_link`, `zoom_link`, `whatsapp_number`, `preferred_channel`, `monthly_rate_ugx`, `in_person_rate_ugx` |
| **`client_profiles`** | Client physical targets & streak | `user_id`, `trainer_id`, `gender`, `dob`, `height_cm`, `target_weight_kg`, `current_weight_kg`, `activity_level`, `fitness_goal`, `target_calories`, `target_protein_g`, `target_carbs_g`, `target_fat_g`, `streak_days` |
| **`foods`** | Local Ugandan & global food database | `id`, `name`, `local_name`, `category`, `calories_100g`, `protein_100g`, `carbs_100g`, `fat_100g`, `fiber_100g`, `typical_serving_g`, `serving_unit`, `source`, `is_verified` |
| **`exercises`** | Complete exercise library | `id`, `name`, `target_muscle`, `secondary_muscles`, `equipment` (`none`\|`dumbbell`\|`band`), `difficulty`, `instructions`, `video_url`, `is_bodyweight` |
| **`workout_plans`** | Trainer workout blueprints | `id`, `trainer_id`, `title`, `description`, `goal_tag`, `days_per_week`, `schedule_json`, `created_at` |
| **`meal_plans`** | Macro-balanced local meal templates | `id`, `trainer_id`, `title`, `description`, `days_json`, `target_calories`, `target_protein`, `target_carbs`, `target_fat` |
| **`plan_assignments`** | Active client assignments | `id`, `client_id`, `workout_plan_id`, `meal_plan_id`, `assigned_by`, `assigned_at`, `is_active` |
| **`workout_logs`** | Daily client exercise completions | `id`, `client_id`, `plan_id`, `exercise_id`, `exercise_name`, `sets_completed`, `reps_completed`, `weight_kg`, `duration_minutes`, `rpe_score`, `notes`, `logged_at` |
| **`meal_logs`** | Daily nutrition records | `id`, `client_id`, `meal_type` (`breakfast`\|`lunch`\|`dinner`\|`snack`), `food_id`, `food_name`, `grams`, `calories`, `protein`, `carbs`, `fat`, `logged_at` |
| **`weight_logs`** | Biometric progress tracking | `id`, `client_id`, `weight_kg`, `notes`, `logged_at` |
| **`check_ins`** | Weekly accountability submissions | `id`, `client_id`, `week_start_date`, `energy_score` (1-10), `sleep_hours`, `diet_adherence_score` (1-10), `workout_adherence_score` (1-10), `notes`, `trainer_feedback`, `status`, `submitted_at` |
| **`messages`** | Asynchronous trainer-client chat | `id`, `sender_id`, `receiver_id`, `content`, `attachment_url`, `is_read`, `created_at` |
| **`call_requests`** | Scheduled coaching sessions | `id`, `client_id`, `trainer_id`, `preferred_slot`, `topic`, `channel`, `status` (`pending`\|`accepted`\|`completed`\|`declined`), `meeting_url` |
| **`subscriptions`** | Real MTN/Airtel MoMo billing records | `id`, `client_id`, `plan_type` (`monthly`\|`quarterly`), `network` (`MTN`\|`AIRTEL`), `phone_number`, `amount_ugx`, `status` (`active`\|`expired`\|`cancelled`), `reference_id`, `starts_at`, `expires_at` |
| **`pose_sessions`** | Computer vision workout telemetry | `id`, `client_id`, `exercise`, `reps_completed`, `duration_seconds`, `avg_form_score`, `rep_durations_json`, `angles_log_json`, `created_at` |
| **`form_checks`** | Video submissions with Gemini AI review | `id`, `client_id`, `exercise`, `video_path`, `thumbnail_path`, `ai_score`, `ai_good_json`, `ai_fixes_json`, `ai_safety_note`, `ai_cue`, `trainer_comment`, `trainer_commented_at`, `created_at` |

### Dynamic Compliance Flags Logic (`v_client_flags`)
Evaluated in SQL / Server Service:
1. **Missed Workout Flag**: No workout logged in $\ge 3$ consecutive days.
2. **Nutrition Deficit Flag**: 7-day average macro calorie adherence $< 70\%$ of target.
3. **Biometric Stale Flag**: No body weight log recorded in $\ge 7$ days.
4. **Check-In Overdue Flag**: Weekly Sunday check-in missed by $> 48$ hours.

---

## 4. End-to-End User Experience & Flow

### A. The Client Journey (Mobile PWA)
1. **Today's Hub**:
   - Dynamic calorie & protein progress rings with percentage indicators.
   - Day streak badge, water quick-log, and assigned daily workout preview.
   - "Start Workout" button with set/rep tracking, resting stopwatch timer, and exercise demonstration player.
2. **Local Meal Logger**:
   - Instant search across 80+ Ugandan foods and Open Food Facts.
   - Quick portion toggles: standard plate, cup, piece, or grams.
   - Instant macro breakdown (Carbs, Protein, Fat, Calories) recalculating live.
3. **Visual AI Guidance**:
   - **Live Rep Counter**: Mount phone, step back into full-body view. MediaPipe PoseLandmarker draws colored skeletal joints. Dynamic voice/sound cues ("Good depth!", "Push through heels", "Keep chest tall").
   - **Form-Check Clinic**: Record a 10-second set. Client previews extracted kinematic keyframes. Submits with 1-tap consent. Gemini 3.8 Flash delivers a structured biomechanical evaluation within seconds.
4. **Accountability & Communications**:
   - Weekly check-in slider ratings with optional photos and questions.
   - "Call My Coach" modal with direct WhatsApp deep-link or Google Meet room.
   - MTN / Airtel MoMo subscription checkout with instant receipt and active status badge.

### B. The Trainer Journey (Web SaaS Dashboard)
1. **Triage Command Center**:
   - Priority-sorted client roster: Flagged (Needs Immediate Attention) $\rightarrow$ Borderline $\rightarrow$ On Track.
   - Filter by flag type (Nutrition, Workouts, Check-ins).
2. **Deep Client Dossier**:
   - Unified 30-day interactive charts (Weight trajectory vs Target, Macro Adherence %, Workout Volume).
   - Form-check submission player: view client video side-by-side with Gemini AI breakdown, type trainer audio/text response.
   - Client conversation thread with message history.
3. **Plan Architect**:
   - **Workout Builder**: Build customized weekly training programs from exercise database or add custom movements.
   - **Ugandan Meal Architect**: Plan balanced breakfasts, lunches, and dinners using local staple foods; auto-calculates total daily macros vs client targets.
4. **Business & Financial View**:
   - Live MRR calculated in UGX (e.g., 42 active clients $\times$ UGX 90,000 = UGX 3,780,000/mo).
   - Scaling comparison graph: 8 in-person clients (UGX 2,400,000/mo) vs 60 FlexiFit online clients (UGX 5,400,000/mo) showing time-efficiency metrics.

---

## 5. Visual Design Constitution & Theme Tokens

- **Palette**:
  - Dominant Neutral: `#0B0B0B` (Rich Ugandan Charcoal / Obsidian Canvas)
  - Surface Neutral: `#141414` (Elevation Card Base) and `#222222` (Secondary Surface)
  - Brand Primary Accent: `#FF6A00` (FlexiFit High-Energy Radiant Orange)
  - Contrast Foreground: `#FFFFFF` and `#F3F4F6`
  - Semantic Adherence (Green): `#10B981` (Target reached / On track)
  - Semantic Warning (Amber): `#F59E0B` (Borderline compliance / Missed log)
  - Semantic Alert (Red): `#EF4444` (Non-compliant / 3+ days flagged)
- **Typography**:
  - Display & Headings: `Plus Jakarta Sans` (weights 600, 700, 800)
  - Body & Micro-Copy: `Plus Jakarta Sans` / `DM Sans` (weights 400, 500)
  - Numbers & Metrics: `font-mono tabular-nums` (aligning all weights, reps, calories, and UGX currency values)
- **Top Bar Contract**:
  - Left Zone: Single clean brand wordmark `FlexiFit` with subtle flag badge.
  - Middle Zone: 4-5 single-line navigation links (`Today`, `Workout`, `Nutrition`, `Progress`, `Coach` / `Clients`, `Plans`, `Foods`, `Revenue`).
  - Right Zone: User profile avatar and quick switch control.
- **Ergonomics & Touch**:
  - All interactive tap targets $\ge 44\text{px}$.
  - Mobile bottom navigation bar within natural thumb zone.
  - Zero-pill metadata (clean inline text with `·` separators).

---

## 6. Implementation & Phased Execution Roadmap

### Phase 0: Scaffolding, Full-Stack Express Server & Adapters
- Initialize Express server (`server.ts`) with Vite middleware integration.
- Setup TypeScript configurations, CORS, body parsers (JSON & multipart for video).
- Define `IDataAdapter` interface with `sqliteAdapter.ts` and `oracleAdapter.ts`.
- Ensure clean environment variable validation (`GEMINI_API_KEY`, `ORDS_BASE_URL`, `PORT=3000`).

### Phase 1: Database Schema & Complete Food Composition Dataset
- Implement SQLite DDL with foreign key constraints, indexes, and WAL journal mode.
- Generate complete Oracle APEX / ORDS deployment files in `/db/oracle/` (`01_schema.sql` through `04_ords_rest.sql`).
- Compile comprehensive 80+ item Ugandan food composition seed data (calories, proteins, carbs, fats, fiber, typical serving size).
- Seed realistic demo accounts (Coach Brian + 6 active clients with diverse goals and 4 weeks of logs).

### Phase 2: Production Authentication & Role-Based Workflows
- Secure password hashing with `bcryptjs`.
- JWT generation and verification middleware (`authenticate`, `requireRole('trainer')`, `requireRole('client')`).
- Profile management API endpoints (updating targets, avatars, bio, and meeting links).
- Seamless Demo Mode toggle for evaluator convenience without compromising real auth integrity.

### Phase 3: Trainer SaaS Web Suite
- **Client Roster & Triage Queue**: Table and card views showing compliance badges, flag reasons, and last active dates.
- **Client Detail Dossier**: Multi-tab view with Recharts progress charts, check-in history, and assigned plans.
- **Workout Plan Builder**: Filterable exercise catalog (muscle, equipment) with drag-to-day scheduling.
- **Ugandan Meal Plan Builder**: Food selector with real-time calorie/macro speedometer vs client target.
- **Food Database Manager**: Browse, search, and add custom local foods with nutritionist validation notes.
- **Business View**: Live UGX MRR counter, client capacity gauge, and scaling economic model.

### Phase 4: Client Mobile PWA
- Configure `vite-plugin-pwa` with manifest, auto-updating service worker, and mobile icons.
- Mount `PWAInstallButton` and `OfflineBanner` components.
- **Today Dashboard**: Macro rings (SVG animated circle strokes), daily streak, and workout checklist.
- **Workout Logger**: Set/rep/weight inputs with rest timer countdown audio.
- **Meal Logger**: Fast search, serving multiplier, and instant daily total updates.
- **Biometric & Check-in Tracker**: Weight logger and weekly 4-part accountability questionnaire.
- **Call & Connect**: "Call My Coach" modal with WhatsApp and Google Meet triggers.
- **MTN / Airtel MoMo Subscription**: Realistic phone number billing prompt with receipt view.

### Phase 5: Biomechanical AI Guidance (MediaPipe & Gemini Vision)
- **Live Pose Tracking**:
  - Dynamically load `@mediapipe/tasks-vision` PoseLandmarker on demand.
  - Calculate 3D kinematic joint angles for squats (hip-knee-ankle), push-ups (elbow angle & spinal line), and planks (pelvic drop).
  - Rep cycle state machine (UP $\rightarrow$ DOWN $\rightarrow$ UP) with audio feedback and real-time form cues.
  - Record session telemetry to database.
- **Video Form Check with Gemini 3.8 Flash Vision**:
  - HTML5 video capture / file upload.
  - Canvas keyframe extraction (4-6 frames covering start, descent, bottom inflection, ascent).
  - Server-side `@google/genai` call using `gemini-3.8-flash` with structured JSON schema:
    ```json
    {
      "overall_score": 8,
      "what_looks_good": ["Strong spine neutrality", "Knees tracking over toes"],
      "fix_these": ["Depth is 2 inches high of parallel", "Heels lifting slightly at bottom"],
      "safety_note": "Keep weight distributed across mid-foot to protect knee joint.",
      "suggested_cue": "Screw your feet into the floor and sit back into your hips."
    }
    ```
  - Graceful fallback to pre-computed expert coaching feedback if Gemini API key is unset or rate limited (HTTP 429).
  - Trainer commentary and approval thread.

### Phase 6: Automated Unit Tests (`npx --yes tsx --test`)
- `src/utils/flagLogic.test.ts`: Test 3-day workout lapse, 7-day macro shortfall, weight absence, and check-in lapse.
- `src/utils/angleMath.test.ts`: Test 3-point joint angle math, squat depth thresholding, and push-up rep cycles.
- `src/utils/macroCalc.test.ts`: Test local food portion scaling, daily calorie sums, and target adherence math.
- `src/server/auth.test.ts`: Test password hashing, JWT signing, token decoding, and role authorization.

### Phase 7: Verification & Browser Journey Audits (Ultra Mode)
- Execute automated unit test suite.
- Verify clean TypeScript compilation (`compile_applet`).
- Run Playwright browser journey captures on desktop (1440px) and mobile (390px):
  - Trainer dashboard: client triage, plan assignment, business analytics.
  - Client PWA: today view, workout logging, meal logging, mobile money subscription.
  - Vision & AI: live pose rep counting and video form-check submission.
- Verify offline PWA caching and installability.

---

## 7. Definition of Done

1. Full-stack application runs with `npm run dev` (Express + Vite) and builds cleanly with `npm run build && npm start`.
2. All 4 unit test suites (`flagLogic`, `angleMath`, `macroCalc`, `auth`) pass with 100% success.
3. Client PWA is installable, responsive, and handles offline cached access smoothly.
4. Trainer can triage flagged clients, construct workout/meal plans with local Ugandan foods, and view UGX revenue analytics.
5. Client can log daily workouts, record Ugandan meals with real-time macro rings, perform live pose-tracked squats, and submit form-check clips for Gemini AI review.
6. Ready-to-run Oracle SQL scripts in `/db/oracle/` (`01_schema.sql` through `04_ords_rest.sql`) with comprehensive APEX setup instructions in README.md.
