# gurukela.lk — Learning Management System

A tutoring marketplace where students find instructors, book their free time
slots one-to-one, or join pre-scheduled group classes.

## Status

| Part                 | State                                                     |
| -------------------- | --------------------------------------------------------- |
| `frontend/src/site/` | Built — public gurukela.lk website (React, no API calls)   |
| `frontend/`          | Built — React + Vite LMS, gated behind real login (JWT)    |
| `backend/`           | Built — Node.js + Express + MySQL API                      |

## The public website

`frontend/src/site/` is the marketing site visitors see before signing in. It
is a fixed green-and-white brand (its own tokens, scoped under `.gk`, separate
from the LMS's themeable palette) and **makes no API calls at all** — every
page reads from `src/site/siteData.js`.

| Route                    | Page                                          |
| ------------------------ | --------------------------------------------- |
| `/`                      | Home — banner carousel, streams, stats, offers, panel, results, reviews, channels, FAQ |
| `/lecturers`             | Our Lecturers — search + stream/subject/medium filters |
| `/lecturers/:id`         | Lecturer profile — bio, qualifications, classes and fees |
| `/campaign`              | Campaign — flyer spotlight, poster rail, all offers |
| `/about`                 | About Us — founder, vision, mission, values, timeline |
| `/contact`               | Contact Us — all published lines, map plate, enquiry form |
| `/checkout`              | Cart and payment options                       |
| `/login`, `/register`    | Brand-facing auth screens (not yet posting anywhere) |
| `/gurukela/login`        | The real API-backed system login                |
| `/terms`, `/privacy`, `/refund`, `/guidelines` | Policy pages          |

Every image is drawn as SVG in `src/site/art/` — the brand mark, the icon set,
three hero scenes, six campaign flyers, illustrated lecturer portraits, medals,
the map plate and the payment marks. Nothing loads an external image.

### Opening it in a browser without a dev server

`npm --prefix frontend run build:xampp` builds straight into XAMPP's htdocs, so
the site opens at **http://localhost/gurukela/** with only Apache running.

```bash
npm --prefix frontend run build:xampp                # -> /gurukela/
npm --prefix frontend run build:xampp -- some-name   # -> /some-name/
```

The script sets Vite's `base` to the sub-folder (main.jsx feeds the same value
to the router's `basename`) and writes a matching SPA-fallback `.htaccess`, so
a deep link such as `/gurukela/lecturers` still serves `index.html` on
refresh. It refuses to write into a folder it did not create, so it cannot
clobber another site already sitting in htdocs.

**Connecting the backend later:** the API-backed auth screens are untouched and
still mounted at `/gurukela/login`, `/gurukela/register`, `/gurukela/verify` and
`/gurukela/forgot`.
Signing in through them renders the LMS exactly as before.

## Quick start

Requires **MySQL running** (XAMPP defaults work out of the box).

```bash
cp backend/.env.example backend/.env   # DB creds, JWT secret, SMS gateway
npm run install:all                    # root + backend + frontend deps
npm run db:reset                       # create schema + load demo data
npm run dev                            # backend :4000 + frontend :5173
```

Open http://localhost:5173 — the app **opens on a login screen**; you cannot
reach any page without authenticating. Data is protected by a JWT bearer token.

`npm run dev` runs both servers under one command (via `concurrently`) and
`Ctrl+C` stops both. The Vite dev server proxies `/api` to the backend, so the
browser only ever talks to one origin and there is no CORS step to configure —
leave `VITE_API_URL` unset in development. Port 5173 is pinned: if something
else already holds it, the frontend fails with a clear error instead of
drifting to another port the backend would reject.

### Seeded logins

- **Admin:** `admin@gurukela.lk` / `admin123`
- **Any seeded instructor/student email** / `password123`
  (e.g. `tharindu@example.lk`, `dr.nimal.perera@teach.gurukela.lk`)

Or register a new student/instructor — an SMS OTP verifies the phone (shown in
the backend console / returned as `devCode` in dev mode). See
[backend/README.md](backend/README.md) for the API and SMS gateway wiring.

## Features

**Instructor discovery** — search and filter by subject, module, minimum rating,
teaching hours and verification status; sort by rating, hours, student count or
price.

**Free time slots** — an instructor publishes availability (e.g. 7:00 PM –
10:00 PM split into hourly sessions). A student requests a slot for a specific
module, the instructor accepts or rejects, and **the first accepted student to
pay secures the slot** — every other request on it closes automatically.

**Group classes** — fixed batches with a set schedule and seat count. Students
pay and join directly, with no approval step.

**Verified reviews** — only a student who has paid for classes with an
instructor *and* completed 30 days of learning can leave a review. Everyone else
sees the countdown instead.

**Admin catalogue** — subjects and modules are defined by the administrator.
Instructors register against that list and cannot invent modules of their own,
which keeps search and filtering coherent.

**Dynamic theming** — light / dark / auto, a full hue wheel plus intensity,
corner radius and density. Every surface derives from CSS custom properties, so
the whole interface re-themes instantly. Preferences persist per browser.

## Tech

- React 18, React Router 6, Vite 5
- Plain CSS design system driven by custom properties — no UI framework
- State in a single reducer (`frontend/src/store/AppContext.jsx`), persisted to
  `localStorage`

## Wiring the backend later

`frontend/src/store/AppContext.jsx` is the only file that owns data. Each
reducer action maps to one endpoint — `request/accept` →
`POST /api/slot-requests/:id/accept`, and so on. Replacing those dispatches with
`fetch` calls in that one file leaves every page working unchanged.

The demo dataset in `frontend/src/data/seed.js` is shaped like the intended
tables: `subjects`, `modules`, `instructors`, `students`, `reviews`, `slots`,
`slot_requests`, `group_classes`, `enrollments`, `payments`.
