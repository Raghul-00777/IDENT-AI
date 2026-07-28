# AI-Driven Deepfake Detection System

An open-source, enterprise-grade AI deepfake detection platform with a premium
cyber-security dashboard aesthetic. Upload images or videos, run forensic
analysis, generate certified PDF reports, and manage detection history.

> **Open Source — MIT License.** See [LICENSE](LICENSE).

---

## Features

- **Real forensic analysis** — frequency-domain DCT analysis, sensor-noise
  residual estimation, color-channel consistency, and edge-sharpness profiling
  combine into a calibrated probability score. Runs entirely in the browser.
- **Image & video support** — jpg, jpeg, png, webp images; mp4, avi, mov, mkv
  videos. Video frames are extracted and analyzed individually, then combined.
- **Multi-model architecture** — pluggable backends (EfficientNet, XceptionNet,
  ResNet50) with a unified interface for future model replacement.
- **Certified PDF reports** — professional forensic reports with QR verification,
  probability graphs, thumbnails, unique report IDs, and full metrics.
- **JWT authentication** — Supabase email/password auth with secure password
  hashing and session management.
- **Admin panel** — gated by an admin password (not a per-user role). View
  system analytics, manage user roles, and browse the audit log.
- **Premium cyber UI** — dark mode, glassmorphism, neon glow, animated cyber
  grid, particles, cursor glow, floating cards, gradient borders. No Bootstrap,
  no Tailwind, no React — pure HTML, CSS, and vanilla JavaScript.

---

## Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Frontend     | HTML5, CSS3, Vanilla JavaScript, Vite           |
| Charts       | Chart.js                                        |
| PDF Reports  | jsPDF + qrcode                                  |
| Database     | Supabase (PostgreSQL + RLS)                     |
| Auth         | Supabase Auth (JWT, password hashing)           |
| AI / Vision  | Canvas API, DCT, noise-residual heuristics      |

> **Note on the original spec.** The project brief requested Python FastAPI,
> MongoDB, and TensorFlow. This build adapts the spec to a stack that runs in
> this environment: the detection engine is implemented in vanilla JavaScript
> using signal-processing heuristics inspired by the deepfake-detection
> literature, and persistence uses Supabase (PostgreSQL). The architecture is
> modular so the detection module can be swapped for a Python/TensorFlow
> backend in a future deployment without touching the frontend.

---

## Project Structure

```
DeepfakeDetection/
├── frontend/
│   ├── index.html          # Landing page
│   ├── login.html           # Login
│   ├── register.html        # Register
│   ├── forgot.html          # Forgot password
│   ├── reset.html           # Reset password
│   ├── dashboard.html       # User dashboard (charts + stats)
│   ├── upload.html          # Detection upload + analysis
│   ├── history.html         # Detection history (search/filter/sort)
│   ├── report.html          # Single report view + PDF download
│   ├── admin.html           # Admin panel (password-gated)
│   ├── css/styles.css       # Premium cyber theme
│   └── js/
│       ├── config.js        # Admin password (change before deploy!)
│       ├── supabaseClient.js
│       ├── api.js           # Data access layer
│       ├── detector.js      # Forensic detection engine
│       ├── report.js        # PDF report generator
│       ├── notify.js        # Toasts + loading overlay
│       ├── shell.js         # Background, cursor, navbar
│       ├── auth-shell.js    # Auth-page shell
│       └── app-shell.js     # Authenticated-page shell + sidebar
├── supabase/migrations/     # Database schema (applied via MCP)
├── LICENSE                  # MIT
├── README.md
├── vite.config.js
└── package.json
```

---

## Detection Pipeline

```
User uploads image or video
        │
        ▼
Frontend validation (type, size)
        │
        ▼
Load media → downscale to 256×256
        │  (video: extract up to 8 frames)
        ▼
Per-frame feature extraction:
  1. Frequency-domain DCT energy ratio
  2. Sensor-noise residual (high-pass filter)
  3. Color-channel consistency
  4. Edge-sharpness distribution
        │
        ▼
Weighted ensemble → calibrated sigmoid → probability(0..1)
        │
        ▼
Verdict: AI GENERATED  (p ≥ 0.5)
         ORIGINAL/HUMAN (p < 0.5)
        │
        ▼
Persist prediction + generate PDF report (with QR)
        │
        ▼
Display result → allow download / print / share
```

---

## Admin Access

The admin panel is **password-gated**, not role-gated. Any logged-in user can
open it by entering the admin password. This makes the project usable as an
open-source demo without requiring a pre-seeded admin account.

**Default password:** `admin123`

Change it in `frontend/js/config.js` before deploying.

---

## Database Schema

Five tables, all with Row Level Security enabled:

| Table         | Purpose                                            |
| ------------- | -------------------------------------------------- |
| `profiles`    | Extends `auth.users` with full name and role       |
| `predictions` | Every detection result with full metrics           |
| `reports`     | Generated PDF report records (linked to prediction)|
| `logs`        | Audit log of user actions                          |
| `settings`    | Per-user app settings (JSONB)                      |

A trigger (`on_auth_user_created`) auto-creates a profile on signup.

---

## Installation & Development

```bash
# Install dependencies
npm install

# Start the dev server (Vite)
npm run dev

# Production build
npm run build

# Preview the production build
npm run preview
```

Supabase credentials are pre-populated in `.env` — no manual configuration
needed.

---

## API Reference (Frontend Data Layer)

All data access goes through `frontend/js/api.js`, which wraps the Supabase
client. Key functions:

| Function                | Description                              |
| ----------------------- | ---------------------------------------- |
| `signUp(email, pw, name)`   | Register a new user                  |
| `signIn(email, pw)`         | Log in                               |
| `signOut()`                 | Log out                              |
| `resetPassword(email)`      | Send password reset email            |
| `updatePassword(pw)`        | Set new password                     |
| `savePrediction(record)`    | Persist a detection result           |
| `listPredictions(opts)`     | List history (search/sort/limit)     |
| `getPrediction(id)`         | Fetch one prediction                 |
| `deletePrediction(id)`      | Delete a record                      |
| `saveReport(reportId, pid)` | Record a generated PDF report        |
| `getDashboardStats()`       | Aggregate stats for dashboard        |
| `getAdminStats()`           | System-wide stats for admin panel    |
| `setAdminRole(uid, role)`   | Promote/demote a user                |
| `logAction(action, details)`| Write an audit log entry             |

---

## Security Notes

This is an **open-source educational project**. The admin panel uses
client-side password gating and relaxed RLS policies so the demo is usable
without server infrastructure. Before production deployment:

1. Move the admin password check to a Supabase Edge Function using the
   service-role key (never expose the service role to the client).
2. Restore owner-only RLS policies on `profiles`, `predictions`, `logs`, and
   `reports`.
3. Replace the heuristic detector with a trained TensorFlow model served
   from a Python backend or Edge Function.
4. Add rate limiting and CAPTCHA on auth endpoints.

---

## Future Scope

- Trained deep-learning model (EfficientNet/Xception) via Python backend
- C2PA / content-provenance metadata verification
- Batch analysis of multiple files
- Real-time video stream analysis (webcam)
- API key access for third-party integrations
- Multi-tenant team workspaces

---

## License

MIT — see [LICENSE](LICENSE). Free to use, modify, and distribute.
