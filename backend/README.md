# Backend — gurukela.lk API

Node.js + Express + MySQL API for the LMS. Data model mirrors
`frontend/src/data/seed.js`; reducer actions in
`frontend/src/store/AppContext.jsx` map onto these endpoints.

## Stack

- Express 4 (ESM)
- MySQL via `mysql2` (connection pool + transactions)
- Auth: JWT (`Authorization: Bearer <token>`) + bcrypt password hashing
- SMS OTP for phone verification and password reset (pluggable gateway)

## Setup

```bash
cd backend
cp .env.example .env        # then edit DB creds / secrets
npm install

npm run db:reset            # create DB, apply schema, seed demo data
npm run dev                 # http://localhost:4000  (health: /api/health)
```

`db:reset` = `db:migrate --fresh` + `db:seed`. Use `npm run db:migrate` to
apply the schema without dropping, and `npm run db:seed` to reload demo data.

Requires MySQL running (XAMPP defaults: host `127.0.0.1`, user `root`, no
password). Change these in `.env`.

### Seeded logins

- **Admin:** `admin@gurukela.lk` / `admin123`
- **Any seeded instructor/student email** / `password123`

## SMS gateway

OTP delivery goes through `src/utils/sms.js`. Until you provide gateway
details it runs in `dev` mode — the OTP is printed to the server console (and,
when `OTP_DEV_LOG=true`, returned in the API response as `devCode` for testing).

### OzoneSender (configured)

```
SMS_PROVIDER=ozonesender
SMS_API_URL=https://api.ozonesender.com/v1/send/
SMS_USER_ID=110560
SMS_API_KEY=...
SMS_SENDER_ID=Solidrow
```

Sends a GET with `user_id, api_key, sender_id, recipient_contact_no, message`.
Numbers are normalised to `94XXXXXXXXX`. Success is HTTP **204** (or `200` /
a `status: "success"` body). Note: the `Solidrow` sender ID is account-bound —
use your own registered sender ID for a different project.

### Generic HTTP provider

```
SMS_PROVIDER=http
SMS_API_URL=https://gateway.example.lk/send?api_key={apikey}&to={to}&sender={sender}&message={text}
SMS_API_KEY=...
SMS_HTTP_METHOD=GET
```

Placeholders `{to} {text} {sender} {apikey}` are substituted per message.

## API overview

All routes are under `/api`. Auth-required routes need a Bearer token.

### Auth (`/api/auth`)
| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/register/student` | email, phone, password, confirmPassword, name, birthday, grade, subjectIds[] | Sends verify OTP |
| POST | `/register/instructor` | email, phone, password, confirmPassword, name, title, moduleIds[] | Sends verify OTP |
| POST | `/verify-phone/request` | phone | Resend OTP |
| POST | `/verify-phone/confirm` | phone, code | Marks verified, returns token |
| POST | `/login` | email \| phone, password | 403 + resend OTP if unverified |
| POST | `/forgot-password` | phone | Sends reset OTP |
| POST | `/reset-password` | phone, code, password, confirmPassword | |
| GET | `/me` | — | Current user + profile |

### Catalogue (`/api`)
`GET /subjects`, `GET /modules?subjectId=` are public. `POST/PUT/DELETE` on
`/subjects` and `/modules` are **admin only**.

### Instructors (`/api/instructors`)
- `GET /` , `GET /:id` — public discovery (active only, contact hidden)
- `PUT /:id`, `PUT /:id/modules` — instructor self-service
- `POST /:id/verification-video` — submit the ≥5 min video (advanced stage)

### Slots & requests
- `GET/POST /api/slots`, `DELETE /api/slots/:id`
- `GET/POST /api/slot-requests`, `DELETE /api/slot-requests/:id`
- `POST /api/slot-requests/:id/accept` `/reject` `/pay` — first paid wins the slot

### Group classes (`/api/group-classes`)
CRUD for the owning instructor; `POST /:id/join` for a student (pay + enroll).

### Reviews (`/api/reviews`)
`GET /?instructorId=`, `GET /eligibility/:instructorId`, `POST /` — gated by
"paid + 30 days studied".

### Admin (`/api/admin`) — admin only
- `GET /instructors`, `GET /students`
- `PATCH /instructors/:id/active` — active/inactive toggle
- `PATCH /instructors/:id/verification` — `{ action: 'basic' | 'advanced' | 'reject' }`
- `POST /instructors` — manually enter a teacher (returns a temp password)
- `PATCH /instructors/:id/ban`, `PATCH /students/:id/ban` — `{ banned }`
- `GET/PUT /commission-rate` — default from `DEFAULT_COMMISSION_RATE`, overridable

### Reports (`/api/reports`) — admin only
- `GET /revenue?from=&to=` — gross / commission / instructor earnings, by month & type
- `GET /teacher-payments` — per-teacher earned, paid out, balance owed
- `GET /commission?from=&to=` — commission collected over time
- `GET/POST /payouts` — record money paid out to a teacher

## Verification flow (two stage)

1. Instructor registers → `pending_basic`.
2. Admin runs **basic** verification → `basic_verified`.
3. Instructor submits a ≥ 5-minute video → `pending_advanced`.
4. Admin runs **advanced** verification → `verified` (publicly "verified").

`is_active` (active/inactive) and `banned` are independent of this flow.
