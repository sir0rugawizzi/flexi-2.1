# FlexiFit: Build Prompt for Google Antigravity

Open your project folder (e.g. `~/flexifit`) in Antigravity, then give the agent everything below the line.

Before you paste it:
1. Create a `.env` file in that folder (you will create `.env.example` in the project; the real key goes only in `.env`):
   `GEMINI_API_KEY=your-key-here` (a free key from Google AI Studio)
2. Never paste the key into the chat or commit it to Git.

---

## ROLE AND GOAL

You are a senior full-stack engineer. Build **FlexiFit**, a class-demo prototype of a hybrid personal-coaching and local meal-planning platform for urban professionals in Uganda. Work in phases, verify each phase before moving on, and commit to Git after each phase.

## PRODUCT CONTEXT (from our venture proposal)

- **Problem:** Health-conscious urban adults (25 to 45) who prefer home or outdoor workouts over gyms lack affordable nutrition and workout guidance. Gyms and in-person trainers are costly and rigid. Generic fitness apps ignore Ugandan food (matooke, cassava, tilapia, posho, beans, g-nuts) and offer no human accountability.
- **Users:**
  - **Clients** (primary): busy professionals who want flexible, private, home-based coaching.
  - **Trainers** (secondary): independent certified trainers who want to scale from about 8 in-person clients to 60+ remote clients.
- **Value proposition:** personalised, localised coaching at home for about 70% less than in-person gym coaching; trainers can roughly triple monthly revenue.
- **Three parts to build as one system:**
  1. **Trainer Web SaaS**: build workouts and macro-balanced local meal plans, manage clients.
  2. **Client Mobile App (PWA)**: daily workout logging, demo videos, meal plans, form-check submissions.
  3. **Asynchronous Analytics**: weight trends, macro adherence, and automatic flags for non-compliant clients so trainers know who needs a check-in.
- **Assumptions the demo should help us test:** clients stay motivated with weekly asynchronous check-ins; trainers can move from WhatsApp to a web dashboard; users will pay a monthly subscription; local food database macros are accurate enough.

This is a **class demo prototype**. Prioritise a polished, reliable 5-minute walkthrough over production hardening. No real payments, no real medical claims.

## TECH STACK (fixed decisions)

- **Database:** Oracle (target: free `apex.oracle.com` workspace, Oracle APEX / ORDS). The Oracle DB holds all app data and is exposed through **ORDS REST**. Write Oracle SQL / PL/SQL (`NUMBER`, `VARCHAR2`, `GENERATED ALWAYS AS IDENTITY`, `TIMESTAMP`, etc.).
- **Server:** Node.js 20+ with Express. It serves the built PWA, handles auth (bcrypt + JWT), proxies to ORDS, accepts video uploads, and is the **only** place that holds secrets or calls the Gemini API.
- **Front end:** React + Vite + Tailwind CSS, installable **PWA** (manifest, service worker via `vite-plugin-pwa`). Mobile-first for client screens; responsive desktop layout for the trainer dashboard. Charts with Recharts.
- **On-device pose tracking:** MediaPipe Tasks Vision (`@mediapipe/tasks-vision`, PoseLandmarker), running in the browser.
- **AI form feedback:** Google Gemini API called from the Node server only, using a free-tier key from Google AI Studio. Key read from env `GEMINI_API_KEY`; model name read from env `GEMINI_MODEL`. Before coding this, check Google's current Gemini API docs and pick a vision-capable model that is available on the free tier, with JSON-structured output, and note your choice in the README. Handle rate-limit errors (HTTP 429) gracefully by falling back to the sample feedback.
- **Dev machine:** Linux Mint 22 (Ubuntu 24.04 base), VS Code. Give any install commands for that environment (Node via nvm or NodeSource).

### Data adapter layer (important)

I do not have an Oracle workspace yet. Build a **data adapter interface** in the server with two implementations:
1. `oracle` adapter: talks to ORDS over HTTPS using `ORDS_BASE_URL` from `.env`.
2. `local` adapter: SQLite (better-sqlite3) with the same schema and seed data, used when `ORDS_BASE_URL` is empty.

The app must run end to end in `local` mode on day one, and switch to Oracle by changing `.env` only. Keep the SQLite schema and the Oracle schema equivalent.

## FEATURES

### Authentication and roles
- Real sign-up and login for **Trainer** and **Client** (bcrypt-hashed passwords, JWT, role-based routes).
- **Demo mode** on the login screen: "Demo as Trainer" and "Demo as Client" buttons log in instantly as seeded accounts, plus an in-app role switcher visible in demo mode.

### Trainer web dashboard
- **Client list** with status chips (On track / Needs attention / Non-compliant), search, and a flagged-clients queue.
- **Client detail:** weight trend, macro adherence, workout adherence, check-ins, form-check submissions, message thread, assigned plans.
- **Workout plan builder:** exercise library (name, muscle group, demo video URL placeholder, home/no-equipment tag), sets/reps/rest, weekly schedule, assign to one or many clients.
- **Meal plan builder:** pick foods from the local food database, set portions, see live kcal/protein/carb/fat totals versus the client's targets, assign by day.
- **Food database manager:** browse, search, and **add custom foods** (name, local name, kcal/protein/carbs/fat per 100 g, typical serving).
- **Business view:** active clients, monthly recurring revenue in UGX, and a simple "revenue versus in-person training" comparison to illustrate the 8 to 60+ client scaling story. Plan prices are configurable seed values (placeholder assumptions: FlexiFit about UGX 90,000/month versus in-person about UGX 300,000/month).

### Client mobile app (PWA)
- **Today screen:** today's workout, today's meals, macro rings, streak.
- **Workout logging:** sets, reps, weight, completion, with the exercise demo video.
- **Meal logging:** add foods from the local database with portion size; daily macro totals versus targets.
- **Weight logging** and **progress charts** (weight trend, macro adherence, workout adherence).
- **Weekly check-in** form (energy, sleep, adherence, notes) and a **messaging thread** with the trainer.
- **Call button:** "Call my trainer" opens the trainer's preferred channel: Google Meet (`https://meet.google.com/new`), a Zoom link the trainer saved, or a WhatsApp deep link (`https://wa.me/<number>`). Trainer sets the preferred option and number or link in their profile. Clients can also send a "call request" that appears in the trainer's inbox. No custom calling stack.
- **Subscription (mock mobile money):** choose plan, enter MTN MoMo or Airtel Money number, simulated approval screen, receipt. Clearly label it **"Simulation, no real money moves"** and store the result in the DB.

### Visual AI guidance (two modes)
1. **Live pose tracking** (on-device, no video leaves the phone):
   - Camera view with skeleton overlay (MediaPipe PoseLandmarker).
   - Exercises: bodyweight squat, push-up, plank.
   - Rep counting from joint angles (squat: hip/knee; push-up: elbow/body line), plank hold timer with hip-alignment check.
   - Real-time form cues (e.g. "Go lower", "Keep hips level", "Chest up") and a simple form score.
   - Save a session summary (exercise, reps, duration, average form score) to the DB.
2. **Upload / record a form check with AI feedback:**
   - Client records or uploads a short clip. The browser extracts 4 to 6 evenly spaced frames on a canvas (no ffmpeg) and sends the frames plus the exercise name to the Node server.
   - The server calls the Gemini API with the frames and returns **structured JSON**: `overall_score` (1 to 10), `what_looks_good[]`, `fix_these[]`, `safety_note`, `suggested_cue`.
   - Show a consent notice before upload: "Frames from your video will be analysed by AI and shared with your trainer."
   - The trainer sees the clip, the AI feedback, and can add their own comment.
   - Always show: "AI guidance is not medical advice. Stop if you feel pain."
   - If no API key is configured, fall back to clearly labelled **sample feedback** so the demo never breaks.
   - Store video files on the server's local disk (`/uploads`), only metadata in the DB.

### Analytics and flags
A client is flagged when any of these is true (make thresholds configurable constants):
- No workout logged in the last 3 days.
- 7-day macro adherence below 70%.
- No weight logged in the last 7 days.
- Weekly check-in missed.

Compute flags in a SQL view (Oracle) / equivalent query (SQLite). The flag reason must be visible to the trainer.

## DATA

### Food database seed (about 60 foods, per 100 g, plus typical serving)
Use reasonable approximate values from standard food-composition references. Include at least: matooke, cassava, sweet potato, Irish potato, posho (ugali), millet bread (kalo), rice, maize flour porridge, beans, groundnuts / g-nut sauce, peas, tilapia, Nile perch, silverfish (mukene), beef, goat, chicken, eggs, milk, yoghurt, dodo (amaranth), sukuma wiki, cabbage, tomatoes, onions, avocado, banana, pineapple, mango, passion fruit, watermelon, jackfruit, chapati, mandazi, rolex, katogo, oats, peanut butter, cooking oil. Mark the whole table "approximate values, to be validated by a nutritionist" in the UI footer of the food screens (this tests our nutrition-accuracy assumption).

### Demo story seed
- 1 trainer (fictional, e.g. "Coach Brian") with a Google Meet link and WhatsApp number.
- About 6 fictional clients with Ugandan names and varied goals (weight loss, muscle gain, general fitness).
- **4 weeks of history** per client: workouts, meals, weights, check-ins, messages.
- At least 3 clients flagged for **different** reasons, 2 on track, 1 borderline.
- A few form-check submissions with sample AI feedback.
- Assigned workout and meal plans for everyone.
- Print the demo credentials in the README.

## DESIGN

- **Bold and energetic:** primary orange `#FF6A00`, near-black `#0B0B0B`, white, with a light grey for surfaces. High contrast, large tap targets (44 px+), strong headings.
- Short, plain English. Currency in **UGX** with thousands separators. Timezone **Africa/Kampala**.
- Fast on mid-range Android phones and slow connections: lazy-load MediaPipe only on the pose screen, keep bundles small, cache static assets with the service worker.
- Accessible: labels, focus states, colour never the only signal for status.
- App name "FlexiFit", simple wordmark and PWA icons generated as SVG/PNG.

## SECURITY AND PRIVACY (prototype-appropriate)

- Secrets only in `.env`; commit `.env.example`; add `.env` and `/uploads` to `.gitignore`.
- The Gemini API key must never appear in front-end code, logs, or responses.
- Validate all inputs, use parameterised queries, rate-limit auth and AI endpoints, limit upload size and type.
- Add a short privacy note in the app: pose tracking runs on-device; uploaded frames are sent for AI analysis only when the user submits.
- Add a README section "Known prototype limitations" (demo auth, mock payments, local video storage, approximate nutrition data).

## ORACLE SETUP DELIVERABLES

Generate these in `/db/oracle/`, runnable in APEX **SQL Workshop > SQL Scripts**, in order:
1. `01_schema.sql`: tables, constraints, indexes, the flags view.
2. `02_seed_foods.sql` and `03_seed_demo.sql`.
3. `04_ords_rest.sql`: enable the schema for ORDS and define REST modules. Prefer a small number of **custom SQL-based handlers** for joins and aggregates over many AutoREST tables.

Also write `README` steps for a first-time user covering: requesting and verifying a free workspace at apex.oracle.com, creating the workspace, running the scripts, finding the ORDS base URL, setting `ORDS_BASE_URL` in `.env`, and a troubleshooting list (CORS, auth errors, storage limits). Keep Oracle storage small; videos stay on the server disk.

## WORKING METHOD

1. **First, reply with a short build plan** (file tree, data model summary, endpoint list) and wait for my "go". Ask me at most 3 questions if something blocks you.
2. Build in these phases, running the app and tests after each one and committing:
   - Phase 0: scaffolding, lint, env handling, adapter interface.
   - Phase 1: schema (SQLite + Oracle scripts), seed data, local adapter.
   - Phase 2: auth, roles, demo mode.
   - Phase 3: trainer dashboard (clients, plan builders, food manager, business view).
   - Phase 4: client PWA (today, logging, charts, check-ins, messaging, subscription mock, call button).
   - Phase 5: analytics and flag logic.
   - Phase 6: live pose tracking.
   - Phase 7: upload form check with Gemini API feedback and fallback.
   - Phase 8: Oracle adapter against ORDS, PWA polish, README, demo script.
3. Write meaningful tests for flag logic, macro calculations, rep counting angle maths, and auth. Run them.
4. Do not invent features outside this brief. If you must deviate, say so and why.

## DEFINITION OF DONE

- `npm install && npm run dev` starts everything in local mode with seeded data; `npm run build && npm start` serves the production PWA.
- The app installs to a phone home screen and the main screens load offline-tolerantly.
- I can run the full demo: trainer builds a workout and a local meal plan, assigns it, the client logs a workout, a meal, and weight, does a live squat session with rep counting, submits a form-check clip and gets AI feedback, sends a check-in, and the trainer sees the flag queue and business view. The client can tap the call button and complete a simulated mobile-money payment.
- Switching `.env` to a valid `ORDS_BASE_URL` makes the same app run against Oracle.
- README includes setup, Oracle steps, demo credentials, and a **5-minute demo script** matching our proposal's value proposition and assumptions.
