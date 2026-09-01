# EduLink LMS — Frontend

React + Vite front end for the LMS. It runs entirely on mock data, so there is no
backend or database to set up.

## Run it

```bash
cd c:/xampp/htdocs/lms/frontend
npm install      # first time only
npm run dev      # opens http://localhost:5173
```

`npm run build` produces a static bundle in `dist/`.

## Demo accounts

There is no login yet. Use the switcher at the top of the sidebar to move between
the three roles:

| Role       | Signed in as             | Lands on   |
| ---------- | ------------------------ | ---------- |
| Student    | Tharindu Vishwa          | `/discover`|
| Instructor | Dr. Nimal Perera         | `/teach`   |
| Admin      | Platform Admin           | `/admin`   |

All data lives in `localStorage`, so bookings and edits survive a refresh.
**Reset demo data** at the bottom of the sidebar restores the seed.

## The flows worth trying

1. **Free-slot booking, first payment wins**
   As the student, open an instructor → *Free time slots* → request a slot.
   Switch to the instructor → *Slot requests* → accept two students on the same
   slot. Switch back to a student → *My bookings* → pay. The slot closes and the
   other accepted request flips to *Slot taken*.
2. **Group classes** — pay and join directly, no approval step.
3. **Review gate** — a review button only unlocks after a paid enrolment plus 30
   days. Before that the profile shows the countdown instead.
4. **Module catalogue** — admin defines subjects and modules; the instructor's
   *My modules* page can only tick items from that list.
5. **Theming** — the palette icon in the header opens a drawer with mode, accent
   hue, intensity, corner radius and density. Every surface re-derives from it.

## Layout

```
src/
  theme/ThemeContext.jsx   dynamic palette -> CSS custom properties on <html>
  store/AppContext.jsx     reducer standing in for the API + derived lookups
  data/seed.js             demo dataset, shaped like the eventual DB tables
  components/              layout, theme drawer, payment sheet, UI primitives
  pages/student|instructor|admin
  styles/global.css        design system, all colours via var(--…)
```

## Wiring a real backend later

`src/store/AppContext.jsx` is the only file that owns data. Each reducer action
matches one endpoint (`request/accept` → `POST /api/slot-requests/:id/accept`,
and so on). Replace the reducer calls with `fetch` in that file and the pages
keep working unchanged.

Field names in `src/data/seed.js` mirror the intended tables: `subjects`,
`modules`, `instructors`, `students`, `reviews`, `slots`, `slot_requests`,
`group_classes`, `enrollments`, `payments`.
