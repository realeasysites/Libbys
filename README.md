# Libby Septic Service Excavation & Trucking: Website

High-converting site + lead system for **Libby Septic Service Excavation & Trucking** (Southern Maine).
The company purchased **GC Libby Sanitary Septic Services** (formerly George Libby Septic Tank Service, 101 Spurwink Rd, Scarborough) and kept the same number, **(207) 767-2614**.

Built on the Real Easy Sites / TBLC pattern: Node 20 + Express + SQLite, with a password-protected lead dashboard.

## Structure
```
server.js            thin entry point
db/index.js          SQLite schema + queries (leads table, status tracking)
lib/                 auth.js · mailer.js · rateLimit.js
routes/              quote.js (POST /api/quote) · admin.js (login, dashboard API, CSV export)
views/               login.html · admin.html (served only to logged-in admin)
public/              index.html · 404.html · css/ · js/ · images/
```

## Run locally
```bash
cp .env.example .env    # then edit the values
npm install
npm start               # http://localhost:3000   ·   dashboard: /admin
```
Node **20.x** is required (`.node-version` + `engines`). better-sqlite3 has no prebuilt binary for newer Node.

## Deploy (Render)
- New Web Service → connect repo → Build: `npm install` · Start: `npm start`
- Add env vars from `.env.example` (ADMIN_PASSWORD, SESSION_SECRET, SMTP_*, NOTIFY_EMAIL)
- Add a **Persistent Disk** mounted at `/var/data` and set `DB_PATH=/var/data/leads.sqlite` so leads survive redeploys.

## Photos (in `public/images/`)
- `logo.png`: client's logo (cleaned from a phone screenshot, Lens icon removed), shown on a black chip in header/footer
- `hero.jpg`: excavator + dump truck (hero background)
- `og-image.jpg`: 1200×630 share preview (logo + pump truck)
- `work/*.jpg`: 9 job photos listed in `public/js/gallery-data.js` (add more there)
All photos resized to ≤1600px and EXIF/GPS metadata stripped.
**Nice-to-have from client:** a high-res/vector logo file, and a photo of Mike and the crew.

## Before launch (open items)
- [ ] Confirm NOTIFY_EMAIL inbox (default: libbysepticservice@yahoo.com) + SMTP sender
- [ ] Change ADMIN_PASSWORD and SESSION_SECRET
- [ ] Confirm the service-area town list (Contact section + JSON-LD)
- [ ] Confirm the "Nights & Weekends emergency" stat and the owner's preferred name/role on the site
- [ ] Update `<link rel="canonical">` once the client's domain is live
- [ ] Footer "Site by Real Easy Sites" link → your URL
