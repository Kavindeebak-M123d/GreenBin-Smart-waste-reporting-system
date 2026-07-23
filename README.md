# WasteWatch — Civic Cleanliness Reporting Platform

A single-file web platform that lets people report overflowing bins, illegal
dumping, and other cleanliness issues on a campus or in a locality, track the
status of what they reported, and get notified automatically when it's
resolved.

---

## 1. Problem Statement

Overflowing dustbins and unclean areas within a campus or locality often go
unnoticed until they become a serious problem. There is no simple mechanism
for people to report such issues to the concerned authorities, track what
happens next, or know whether anything is actually being done.

## 2. Solution Overview

WasteWatch is a self-contained web app (one HTML file — no server, no
database, no build step) that gives a locality or campus:

- A **public reporting form** anyone can use in under a minute
- A **ticketing system** so every report gets a trackable ID
- A **status tracker** anyone can search by ticket ID or location
- A **dashboard** showing open vs. resolved issues and trends by category
- An **admin console** for the caretaking team to update ticket status
- **Automatic email notifications** to the reporter whenever their ticket's
  status changes

---

## 3. Complete Workflow

```
 ┌─────────────┐      ┌───────────────┐      ┌────────────────────┐
 │   REPORTER   │      │  WASTEWATCH   │      │   ADMIN / STAFF     │
 └──────┬──────┘      └───────┬───────┘      └──────────┬─────────┘
        │                     │                          │
        │ 1. Fills report     │                          │
        │    (category,       │                          │
        │    location, photo, │                          │
        │    severity, email) │                          │
        ├────────────────────►│                          │
        │                     │ 2. Generates ticket ID   │
        │                     │    (e.g. WW-00001),      │
        │                     │    status = "Reported"   │
        │                     │    saves to storage      │
        │ 3. Receives ticket  │                          │
        │◄────────────────────┤                          │
        │                     │                          │
        │                     │  4. Ticket appears in    │
        │                     │     admin queue          │
        │                     ├─────────────────────────►│
        │                     │                          │
        │                     │                          │ 5. Admin reviews
        │                     │                          │    full details
        │                     │                          │    (photo, severity,
        │                     │                          │    description, email)
        │                     │                          │
        │                     │  6. Admin changes status │
        │                     │     (Reported → In       │
        │                     │     Progress → Resolved) │
        │                     │◄─────────────────────────┤
        │                     │                          │
        │                     │ 7. Sends automatic email │
        │                     │    notification to the   │
        │                     │    reporter               │
        │ 8. Gets notified    │                          │
        │◄────────────────────┤                          │
        │                     │                          │
        │ 9. Can re-check     │                          │
        │    status anytime   │                          │
        │    via Track tab    │                          │
        ├────────────────────►│                          │
        │                     │                          │
```

### Reporter journey
1. Open the site → **Report** tab.
2. Fill in category, location (or tap "Use GPS"), description, severity, an
   optional photo, optional name, and a required email.
3. Submit → a ticket ID is issued immediately on screen (e.g. `WW-00001`).
4. Anytime after, go to the **Track** tab and search that ticket ID (or
   filter by location/status/category) to see current status and full
   history.
5. Receive an email automatically whenever the admin updates the ticket's
   status, so there's no need to keep checking manually.

### Admin journey
1. Open the **Admin** tab and enter the staff passcode (demo: `sweep2026`).
2. See every ticket, newest first, with a stamped status badge.
3. Expand **"View full details"** on any ticket to see the photo, severity,
   reporter name, email, and every timestamp.
4. Change the status dropdown (Reported / In Progress / Resolved /
   Rejected), optionally add a note, and click **Apply**.
5. WasteWatch automatically emails the reporter about the change (or, if
   automatic email isn't configured yet, opens a ready-to-send email draft
   instead — see Section 6).
6. Check the **Board** tab for an overview: open vs. resolved counts,
   breakdown by category, and average time-to-resolve.

---

## 4. Features

| Feature | Description |
|---|---|
| Report form | Category, location (manual or GPS), description, severity gauge, optional photo, optional name, required email |
| Ticketing | Auto-generated sequential ticket IDs (`WW-00001`, `WW-00002`, …) |
| Tracking | Search by ticket ID or location; filter by status/category |
| Dashboard | Live counts by status, category breakdown bars, average resolution time |
| Admin console | Passcode-gated; full ticket detail view; status + note updates; status history log |
| Email notifications | Automatic email to the reporter on every status change, via EmailJS (see Section 6) |
| Accessibility | Skip link, keyboard-navigable tabs (arrow keys/Home/End), ARIA roles and live regions, alt text on photos, visible focus states, reduced-motion support |
| Works standalone | Falls back to the browser's local storage automatically if opened outside Claude's own preview, so it still works as a plain downloaded file |

---

## 5. Tech Stack

- **HTML, CSS, vanilla JavaScript** — no framework, no build step, no
  dependencies beyond one optional CDN script
- **EmailJS** (`@emailjs/browser`, loaded from CDN) — optional, for real
  automatic email sending without a backend server
- **Storage** — Claude's artifact storage API when available, otherwise the
  browser's `localStorage`, handled automatically

No backend, no database server, and no build tools are required to run this
project.

---

## 6. Setup & Installation

### Option A — Just open it
1. Clone this repository.
2. Open `wastewatch.html` directly in any browser.
3. That's it — the app works immediately (reports save to that browser only
   in this mode; see Section 7).

```bash
git clone <this-repo-url>
cd <this-repo>
open wastewatch.html      # macOS
# or just double-click the file on Windows/Linux
```

### Option B — Host it for free on GitHub Pages
1. Push this repository to GitHub.
2. Repository **Settings → Pages**.
3. Under "Build and deployment", set **Source** to your default branch,
   root folder.
4. Rename `wastewatch.html` to `index.html` (or keep the name and visit
   `yourusername.github.io/repo-name/wastewatch.html`).
5. Visit the URL GitHub gives you — the platform is now live for anyone to
   use.

### Enabling automatic email notifications
1. Create a free account at [emailjs.com](https://www.emailjs.com).
2. Add an **Email Service** (e.g. connect your Gmail).
3. Add an **Email Template** with these variables: `to_email`, `to_name`,
   `ticket_id`, `category`, `location`, `status`, `note`.
4. Open `wastewatch.html`, find the `EMAILJS_CONFIG` block near the top of
   the `<script>` section, and fill in:
   ```js
   const EMAILJS_CONFIG = {
     enabled: true,
     publicKey: "YOUR_PUBLIC_KEY",
     serviceId: "YOUR_SERVICE_ID",
     templateId: "YOUR_TEMPLATE_ID"
   };
   ```
5. Save and redeploy. Status updates will now email reporters automatically.
   Until this is filled in, every status change is still logged on the
   ticket with a one-click "open email draft" fallback, so nothing is lost.

---

## 7. Data & Storage Notes

- Inside Claude's own artifact preview, report data is stored in **shared**
  storage — visible to everyone using that preview.
- Opened as a plain file (or hosted on GitHub Pages, Netlify, etc.), the app
  automatically switches to the browser's own **local storage** — data
  persists only on that browser/device and is not shared with other
  visitors.
- For a real multi-user deployment where everyone sees the same live data,
  this local storage would need to be replaced with an actual backend (e.g.
  Firebase, Supabase, or a small Node.js + database API). This is the
  natural next step beyond the current prototype.

---

## 8. Project Structure

```
.
├── wastewatch.html   # the entire application — HTML, CSS, and JS in one file
└── README.md         # this file
```

---

## 9. Roadmap / Possible Next Steps

- Replace local-storage fallback with a real backend for true multi-device,
  multi-user sharing
- Real authentication for the admin console (current passcode is a demo
  gate only)
- Map view of reports using their GPS coordinates
- SMS notifications as an alternative to email
- Role-based access for multiple staff members with individual logins

---

## 10. License

Add your preferred license here (e.g. MIT) before publishing.
