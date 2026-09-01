# gurukela.lk — Learning Management System

A tutoring marketplace where students find instructors, book their free time
slots one-to-one, or join pre-scheduled group classes.

## Status

| Part        | State                                                        |
| ----------- | ------------------------------------------------------------ |
| `frontend/` | Built — React + Vite, running on mock data                    |
| `backend/`  | Not started — Node.js API + MySQL                             |

## Quick start

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

There is no login yet. Use the role switcher at the top of the sidebar to move
between **Student**, **Instructor** and **Admin**. See
[frontend/README.md](frontend/README.md) for the full walkthrough.

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
