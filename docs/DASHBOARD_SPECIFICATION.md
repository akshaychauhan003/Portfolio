# Akshay Console (Portfolio Dashboard & APK)
## Comprehensive Architecture, Control Specifications & Operational Manual

> **Document Version:** 3.0  
> **Target Systems:** Live Portfolio Website (`akshaychauhan003.github.io/Portfolio/`), Web Dashboard (`/dashboard/index.html`), and Native Android App (`AkshayConsole.apk`).

---

## 1. Executive Overview

The **Akshay Console** (also referred to as the **Architect Console**) is the unified mission-control interface engineered to remotely govern, moderate, and update every dynamic element of Akshay Singh Chauhan's portfolio in real-time.

It exists in two synchronized deployment form factors:
1. **Web Dashboard:** A Progressive Web App (PWA) hosted at `/dashboard/index.html` (accessible locally at `http://127.0.0.1:3000/dashboard/index.html` or deployed alongside the portfolio).
2. **Native Android APK:** A hardware-installed APK binary (`AkshayConsole.apk`) built with Capacitor and Android SDK, running directly on mobile devices with native status bar styling, safe-area insets, and full-screen controls.

### Core Architectural Principle
**No hardcoded content on the frontend; zero redeployment required for content updates.**  
Any milestone added, project edited, review moderated, or order rearranged in the Dashboard or APK must synchronize instantly via **Supabase Cloud PostgreSQL** and reflect immediately on the live portfolio website across all devices.

---

## 2. What Needs to Be in the Dashboard

The Dashboard interface is divided into a **Persistent Header Bar**, an **Authentication Security Lock**, and **Four Core Control Panes**.

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Avatar] Akshay Console  ● Cloud Sync Ready    [Live Site] [APK] [⚙] [🔒] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [ TAB 1: INBOX ]   [ TAB 2: REVIEWS ]   [ TAB 3: JOURNEY ]   [ TAB 4: PROJECTS ]  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                                                                  │  │
│  │                    ACTIVE PANE CONTENT WORKSPACE                 │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│   [📥 Inbox]        [★ Reviews]        [🏢 Journey]        [🚀 Projects] │  <- Mobile Nav
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Persistent Top App Bar
* **Branding & Avatar:** Shows the system logo with a real-time **Cloud Sync Status Pulse**:
  * 🟢 **Green Pulse:** Cloud synchronized and Supabase Realtime WebSocket active.
  * 🟡 **Amber:** Local cache mode / syncing in background.
  * 🔴 **Red:** Cloud connection offline.
* **Direct Live Portfolio Launcher (`#live-portfolio-link`):** Opens `https://akshaychauhan003.github.io/Portfolio/` in a new tab to immediately verify live changes.
* **Direct APK Download (`#apk-download-btn`):** Downloads the compiled `AkshayConsole.apk` directly to mobile devices without requiring Google Play Store.
* **Notification Bell (`#notif-btn`):** Audio/visual alert toggle for incoming contact inquiries and new client reviews.
* **Settings Gear (`#settings-btn`):** Opens modal for Security PIN management and Email service keys.
* **Console Lock (`#lock-btn`):** Instantly locks the console and requires PIN verification.

### 2.2. Authentication & Security Lock (`#auth-lock-overlay`)
* **Security Shield:** Restricts dashboard access to authorized administrators only.
* **Quick PIN Entry:** 4-digit PIN verification (Default: `0000`, customizable in Settings).
* **Storage Protection:** Session is retained in memory with configurable auto-lock timeout.

---

### 2.3. Primary Control Panes

#### PANE 1: Project Portfolio Control (`#pane-projects`)
Controls the **`03 — Work`** showcase on the portfolio.

* **Top Toolbar:**
  * `+ Add Project` button (opens wide project creation modal).
  * `🔄 Refresh Cloud` button (forces fresh pull from Supabase Cloud PostgreSQL).
* **Projects List View:**
  * Displays each project card with:
    * Order sequence badge (`#1`, `#2`, etc.).
    * Accent color swatch pill (showing hex or gradient).
    * Project title and category.
    * Tech stack badge pills.
    * Media indicator (`[Video Preview]` or `[Interactive Surface]`).
    * Direct hyperlinks to Live URL and GitHub repository.
  * **Controls per item:**
    * ⬆️ **Move Up / ⬇️ Move Down:** Instantly reorders the carousel sequence.
    * ✏️ **Edit:** Opens the project editor modal.
    * 🗑️ **Delete:** Opens modal confirmation with permanent cloud deletion.
* **Project Form Modal (`#proj-modal`):**
  * `Title` (e.g., *TITAN — Smart Inventory & Sales System*).
  * `Category` (e.g., *Desktop Systems · Security*).
  * `Carousel Position / Order Index` (Numeric 1-N).
  * `Tech Stack Selector` (Predefined chips + custom "+ Add Stack" input with tag removal).
  * `Live Website URL` (e.g., `https://...`).
  * `GitHub Repository URL`.
  * `Video Source / File Picker`:
    * Paste remote/local video path (e.g., `assets/videos/demo.mp4`), OR
    * Direct file upload picker with local storage binding.
  * `Card Accent Color Engine`:
    * Hex color input with visual palette picker.
    * **Repetition Detector:** Flags if another project already uses the selected color.
    * **Confirmation Checkbox:** Requires explicit confirmation (*"I want this colour to be repeated"*) to prevent accidental theme collisions.
  * `Description` (Multi-line overview of architecture, impact, and engineering decisions).

---

#### PANE 2: Journey & Career Experience (`#pane-experience`)
Controls the **`04 — Journey`** section on the portfolio.

* **Top Toolbar:**
  * `+ Add Experience` button.
  * `🔄 Sync Journey` button.
* **Dual-Track Classification:**
  * **🏢 In-Office & Institutional:** For corporate, enterprise, and government roles (e.g., CodSoft, Sunbuzz Media, DeGS). Rendered as detailed horizontal timeline nodes.
  * **🌐 Independent & Freelance:** For client engineering contracts (e.g., Travoqix, Krisha Events). Rendered in the luxury Split-Stage Dossier with motion video reel.
* **Milestone Form Modal (`#exp-modal`):**
  * `Role Title` (e.g., *AI/ML & API Developer Intern*, *Freelance Web Developer*).
  * `Company / Organization` (e.g., *Delhi e-Governance Society*, *Travoqix*).
  * `Engagement Category / Type`: Select dropdown (`office` or `freelance`).
  * `Location` (e.g., *Delhi, India*, *Remote*).
  * `Duration` (e.g., *August 2025 — Present*).
  * `Video URL / Showcase Reel`: Video path or URL (for freelance split-stage reel).
  * `Live Client URL`: Website domain or link (for live dossier button).
  * `Order Index`: Sequence position in the career progression.
  * `Detailed Description`: Architectural summary, tech stack, and achievements.
* **Controls per item:**
  * ⬆️ **Move Up / ⬇️ Move Down:** Rearranges timeline chronology.
  * ✏️ **Edit:** Full inline updating.
  * 🗑️ **Delete:** Permanent removal from cloud and local storage.

---

#### PANE 3: Reviews & Moderation (`#pane-reviews`)
Controls the **`07 — Reviews`** section on the portfolio.

* **Status Filter Tabs:**
  * `Pending` (Highlighted with count badge): Unmoderated reviews submitted by visitors.
  * `Approved`: Currently displayed on the public portfolio.
  * `Rejected`: Hidden reviews kept for record.
* **Review Item Card:**
  * Client Name, Title, and Company.
  * Star Rating visualization (1 to 5 stars ★★★★★).
  * Company Website Link (clickable verification).
  * Full testimonial quote text.
  * Verified Client Badge toggle.
* **Moderation Actions:**
  * ✅ **Approve:** Instantly publishes to the portfolio testimonial carousel.
  * ❌ **Reject:** Hides the review from the public portfolio.
  * ⭐ **Feature Toggle:** Flags as a priority quote in the Split-Stage Dossier.
  * 🗑️ **Delete:** Removes record permanently.

---

#### PANE 4: Contact Inquiries / Inbox (`#pane-messages`)
Receives submissions from the **`08 — Contact`** form and *"Hire Now"* click events.

* **Filter Controls:** `All Inquiries`, `Unread`, `Read`.
* **Inquiry Item Card:**
  * Sender Name, Company, and Email.
  * Website link (if provided).
  * Source indicator (`[Contact Form]` or `[Hire Now CTA]`).
  * Submission timestamp.
  * Message body.
* **Actions:**
  * ✉️ **Reply:** Opens default email client (`mailto:`) with pre-populated recipient and subject line.
  * 👁️ **Mark as Read / Unread:** Clears unread badge counter.
  * 🗑️ **Delete:** Permanently removes message from cloud database.

---

## 3. What the Dashboard Controls in the Portfolio

The table below details the exact mapping between Dashboard actions and their visual representation on the live website:

| Dashboard Pane / Action | Portfolio Mount Point | Visual & Functional Effect on Live Site |
| :--- | :--- | :--- |
| **Add / Edit Project** | `#project-portfolio-mount` (`#projects`) | Creates or updates a 3D card in the continuous flow carousel. Updates title, category eyebrow, tech pills, and description. |
| **Project Reorder (Up/Down)** | `#projects-stage` | Rearranges the physical 3D slide position in the carousel. The card at `order_index: 1` becomes the default center card. |
| **Project Card Color** | `.project-card` | Dynamically overrides `--accent-color`, card border glow, backdrop tint, and modal header glow. |
| **Project Video / Surface** | `.project-card-media` | Switches card preview between HTML5 video loop or interactive code surface. |
| **Project Delete** | `#projects-stage` | Instantly removes the card from the carousel, adjusts pagination dots, and centers adjacent card. |
| **Add / Edit In-Office Experience** | `#experience-track-office` | Adds/updates horizontal timeline card with expandable "View Details" accordion, dot indicator, and role metadata. |
| **Add / Edit Freelance Experience** | `#f-dossier-track` | Adds tab to the left navigation deck with company monogram. Right stage loads company domain header, video reel, and quote callout. |
| **Experience Reorder** | Both `#experience` tracks | Restructures the chronological flow of career milestones from earliest to latest. |
| **Experience Delete** | Both `#experience` tracks | Removes the milestone node or dossier tab. |
| **Approve Review** | `#client-review-mount` | Review immediately appears in the public testimonials carousel with star ratings and client credentials. |
| **Reject / Delete Review** | `#client-review-mount` | Review is immediately removed from the public testimonials carousel. |
| **Contact Form Submission** | Form in `#contact-mount` | Form submission dispatches row to Supabase `contact_messages` table; dashboard receives instant sound and counter badge increment. |

---

## 4. How the Dashboard Controls It (Technical Architecture)

```
                       ┌───────────────────────────────┐
                       │     AKSHAY CONSOLE (DASHBOARD) │
                       │    (Web Browser / Android APK)│
                       └───────────────┬───────────────┘
                                       │
                      0ms Optimistic Local State Update
                      BroadcastChannel('portfolio_sync')
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │    SUPABASE CLOUD POSTGRESQL  │
                       │  • projects                   │
                       │  • experiences                │
                       │  • client_reviews             │
                       │  • contact_messages           │
                       └───────────────┬───────────────┘
                                       │
                         Supabase Realtime WebSockets
                         HTTPS REST API with Anon Key
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │     LIVE PORTFOLIO WEBSITE    │
                       │(akshaychauhan003.github.io/...)│
                       │  • Reactive DOM Re-render     │
                       │  • 3D Carousel Auto-update    │
                       │  • Timeline & Dossier Redraw  │
                       └───────────────────────────────┘
```

### 4.1. The Data Layer: Supabase PostgreSQL Schema
The database requires four primary tables configured in Supabase:

1. **`projects`**:
   * `id` (UUID, Primary Key, default `uuid_generate_v4()`).
   * `slug` (TEXT, UNIQUE, Human-readable identifier).
   * `title` (TEXT), `category` (TEXT), `description` (TEXT).
   * `tech_stack` (TEXT[], array of technologies).
   * `live_url` (TEXT), `github_url` (TEXT), `video_url` (TEXT).
   * `preview_type` (TEXT, `'video'` or `'surface'`).
   * `card_color` (TEXT, Hex or gradient string).
   * `order_index` (INTEGER, display sort order).
   * `is_active` (BOOLEAN, default `TRUE`).

2. **`experiences`**:
   * `id` (UUID, Primary Key, default `uuid_generate_v4()`).
   * `role` (TEXT), `company` (TEXT), `location` (TEXT), `duration` (TEXT), `description` (TEXT).
   * `category` (TEXT, `'office'` or `'freelance'`).
   * `video_url` (TEXT, optional motion showcase video).
   * `live_url` (TEXT, optional client portal link).
   * `order_index` (INTEGER, chronological order).

3. **`client_reviews`**:
   * `id` (UUID, Primary Key, default `uuid_generate_v4()`).
   * `client_name` (TEXT), `client_title` (TEXT), `client_company` (TEXT), `company_website` (TEXT).
   * `rating` (INTEGER, 1 to 5).
   * `review_text` (TEXT).
   * `status` (TEXT, `'pending'`, `'approved'`, or `'rejected'`).
   * `is_featured` (BOOLEAN, default `FALSE`).

4. **`contact_messages`**:
   * `id` (UUID, Primary Key, default `uuid_generate_v4()`).
   * `name` (TEXT), `company` (TEXT), `email` (TEXT), `message` (TEXT), `website` (TEXT).
   * `is_read` (BOOLEAN, default `FALSE`).
   * `source` (TEXT, `'contact_form'` or `'hire_now_click'`).

### 4.2. Security & Row-Level Security (RLS) Policies
Because the portfolio and APK operate as client applications using the publishable public key, clean RLS policies must grant `ALL` permissions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) to the `anon` and `authenticated` roles on all four tables:

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE projects TO anon, authenticated;
GRANT ALL ON TABLE experiences TO anon, authenticated;
GRANT ALL ON TABLE client_reviews TO anon, authenticated;
GRANT ALL ON TABLE contact_messages TO anon, authenticated;

CREATE POLICY "Allow full access on projects" ON projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on experiences" ON experiences FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on client_reviews" ON client_reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on contact_messages" ON contact_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
```

### 4.3. The 3-Tier Synchronization Engine
To guarantee sub-second updates without network delay, the system employs a 3-tier sync protocol:

1. **Tier 1 — Zero-Latency Optimistic UI (0ms):**
   * When an administrator submits an edit, the dashboard immediately updates its internal state and re-renders the list before the network request finishes.
   * Changes are saved into `localStorage` cache immediately.

2. **Tier 2 — Inter-Tab & Local Network Broadcast:**
   * Uses `BroadcastChannel('portfolio_sync')` to instantly notify any other open browser tabs (e.g., viewing portfolio and dashboard side-by-side).
   * Dispatches window `StorageEvent` for cross-tab event listeners.

3. **Tier 3 — Non-Blocking Cloud Push & Realtime WebSockets:**
   * Pushes payload to Supabase PostgreSQL using `@supabase/supabase-js`.
   * The live portfolio listens to Supabase Realtime channel (`postgres_changes` on schema `public`).
   * When a change occurs in Supabase, the portfolio dynamically updates the DOM without requiring a full page refresh.

---

## 5. APK Architecture & Native Synchronization

```
┌────────────────────────────────────────────────────────┐
│               Android Mobile Device                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Capacitor Native Container                      │  │
│  │  App ID: com.akshay.architectconsole             │  │
│  │  Permissions: android.permission.INTERNET        │  │
│  │  Cleartext Traffic: Enabled                      │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Local Web Assets (android/.../public/)    │  │  │
│  │  │  • index.html                              │  │  │
│  │  │  • dashboard.js                            │  │  │
│  │  │  • supabase-config.js                      │  │  │
│  │  │  • dashboard.css                           │  │  │
│  │  └──────────────────────┬─────────────────────┘  │  │
│  └─────────────────────────┼────────────────────────┘  │
└────────────────────────────┼───────────────────────────┘
                             │ HTTPS API
                             ▼
                 [Supabase Cloud Database]
```

### 5.1. How the APK Operates
* The APK wraps the exact same web console code inside a high-performance Android WebView via **Capacitor** (`@capacitor/android`, `@capacitor/core`).
* Native settings are defined in `android-app/capacitor.config.json`:
  ```json
  {
    "appId": "com.akshay.architectconsole",
    "appName": "Akshay Console",
    "webDir": "www",
    "bundledWebRuntime": false,
    "server": { "androidScheme": "https" }
  }
  ```
* When an update is made in the APK on an Android device:
  1. The APK makes an HTTPS request to Supabase Cloud PostgreSQL.
  2. Supabase receives the write and broadcasts the change.
  3. The live portfolio website picks up the update in real time.

### 5.2. How to Rebuild the APK When Dashboard Code Changes
Whenever changes are made to `dashboard/index.html`, `dashboard/dashboard.js`, or `dashboard/supabase-config.js`, synchronize and rebuild the APK with these steps:

1. **Copy updated dashboard assets into the Capacitor web folder:**
   ```bash
   cp -R dashboard/* android-app/www/
   ```
2. **Synchronize native Android bridge assets:**
   ```bash
   cd android-app && npx cap sync android && cd ..
   ```
3. **Compile the debug APK with Gradle:**
   ```bash
   cd android-app/android && ./gradlew assembleDebug && cd ../..
   ```
4. **Deploy the binary to the root and dashboard download paths:**
   ```bash
   cp android-app/android/app/build/outputs/apk/debug/app-debug.apk AkshayConsole.apk
   cp AkshayConsole.apk dashboard/AkshayConsole.apk
   ```

---

## 6. Known Failure Points & Troubleshooting Guide

| Issue Observed | Root Cause | Permanent Remedy |
| :--- | :--- | :--- |
| **New experiences do not save to database** | Client generated `'exp-Date.now()'` string instead of valid UUID, causing PostgREST upsert to fail. | Use `crypto.randomUUID()` for new records and call `.insert()` instead of `.upsert()` without conflict key. |
| **Deleted experiences reappear on reload** | Fallback logic in `experience.js` forcefully restored `DEFAULT_FALLBACK_DATA` if array was empty. | Allow user deletions to persist without triggering fallback re-injection. |
| **Changes made in APK don't appear on deployed site** | Either: (1) Supabase write failed so data stayed trapped in mobile `localStorage`, or (2) Stale APK binary from Oct 27 was running. | Ensure Supabase connection succeeds and rebuild APK with latest `supabase-config.js`. |
| **Cloud requests fail with `ERR_SSL_PACKET_LENGTH_TOO_LONG`** | Local network (e.g., NIC / restricted Wi-Fi) intercepts `*.supabase.co` domains to `10.40.124.9`. | Switch device to standard Wi-Fi or mobile hotspot to establish direct HTTPS connection to Supabase. |
| **Portfolio doesn't update until refresh** | Cloud fetch was running in background without dispatching a re-render event upon arrival. | Portfolio controllers must listen for cloud fetch resolution and invoke `renderProjectCards()` and `renderTimeline()` dynamically. |
| **Video preview missing for new freelance role** | The database `experiences` table lacked `video_url` and `live_url` columns. | Execute schema migration to add `video_url` and `live_url` to the `experiences` table. |

---

## 7. Master Operational Summary

By following this specification:
1. **The Administrator** manages projects, milestones, reviews, and messages through either `http://localhost:3000/dashboard/index.html` or the `AkshayConsole.apk` installed on Android.
2. **The Cloud Database** acts as the single source of truth, storing structured records in Supabase PostgreSQL.
3. **The Portfolio Website** (`akshaychauhan003.github.io/Portfolio/`) renders purely from dynamic database records with seamless real-time reactivity and zero dependence on hardcoded static files.
