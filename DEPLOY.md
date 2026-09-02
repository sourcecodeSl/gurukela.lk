# Deploying gurukela.lk to cPanel

Two parts deploy separately:

| Part      | Where                         | How                                   |
| --------- | ----------------------------- | ------------------------------------- |
| Frontend  | `gurukela.sourcecode.lk`      | GitHub Action → FTP to `public_html/` |
| Backend   | `api.gurukela.sourcecode.lk`  | cPanel **Setup Node.js App** + MySQL  |

The frontend (a static build) talks to the backend over HTTPS at
`https://api.gurukela.sourcecode.lk/api`. That URL is baked into the build by
the GitHub Action, so the backend must live at that address (or you change the
`VITE_API_URL` repo variable — see step 4).

---

## 1. Create the API subdomain

cPanel → **Domains** → **Create A New Domain**

- Domain: `api.gurukela.sourcecode.lk`
- Uncheck "share document root"; use a fresh folder, e.g. `/home/USER/api.gurukela`

Then cPanel → **SSL/TLS Status** → run **AutoSSL** on the subdomain so it is
reachable over `https://` (required — the frontend is https and browsers block
http calls from an https page).

## 2. Get the backend code onto the server

Easiest is cPanel → **Git™ Version Control** → **Create**:

- Clone URL: your GitHub repo URL
- Repository Path: `/home/USER/gurukela-repo`

(Or upload the `backend/` folder via File Manager / FTP.)

## 3. Create the database

cPanel → **MySQL® Databases**:

1. Create database → name it `gurukela_lms` (cPanel prefixes it, so the real
   name becomes e.g. `USER_gurukela_lms`).
2. Create a MySQL user + password.
3. Add the user to the database with **All Privileges**.

Load the schema: cPanel → **phpMyAdmin** → select the DB → **Import** →
upload `backend/src/db/schema.sql` → Go. (On cPanel we import the schema by
hand instead of `npm run db:migrate`, because DB users can't `CREATE DATABASE`.)

## 4. Set up the Node.js app

cPanel → **Setup Node.js App** → **Create Application**:

- Node.js version: 20 (or the latest available)
- Application mode: **Production**
- Application root: `gurukela-repo/backend` (from step 2)
- Application URL: `api.gurukela.sourcecode.lk`
- Application startup file: `src/server.js`

Create it. Then in the app panel:

1. **Run NPM Install** (installs backend dependencies).
2. Create the environment file. In File Manager, make
   `gurukela-repo/backend/.env` from `.env.example` and fill in:

   ```
   NODE_ENV=production
   PORT=  (leave blank — Passenger sets it)
   CORS_ORIGIN=https://gurukela.sourcecode.lk

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=USER_gkuser
   DB_PASSWORD=your-db-password
   DB_NAME=USER_gurukela_lms

   JWT_SECRET=<paste a long random string>
   JWT_EXPIRES_IN=7d

   OTP_DEV_LOG=false          # don't return OTP codes in production

   SMS_PROVIDER=ozonesender
   SMS_API_URL=https://api.ozonesender.com/v1/send/
   SMS_USER_ID=110560
   SMS_API_KEY=your-key
   SMS_SENDER_ID=YourSenderID

   DEFAULT_COMMISSION_RATE=0.15
   ```

3. Create the admin login. In the app panel use **"Run JS script"** →
   `src/db/create-admin.js` (or open the virtualenv terminal and run
   `node src/db/create-admin.js`). Default login: `admin@gurukela.lk` /
   `admin123` — override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars.
4. **Restart** the app.

Verify: open `https://api.gurukela.sourcecode.lk/api/health` → should return
`{"ok":true,...}`.

## 5. Deploy the frontend

The GitHub Action (`.github/workflows/deploy.yml`) already builds and FTPs the
frontend on every push to `main`. It builds with
`VITE_API_URL=https://api.gurukela.sourcecode.lk/api` by default.

- If your API lives somewhere else, set a repo **variable** `VITE_API_URL`
  (Settings → Secrets and variables → Actions → **Variables**) to the correct
  base URL and re-run the workflow.
- Ensure the `FTP_PASSWORD` secret is set (already used by the workflow).

Push to `main` (or re-run the last workflow) so the frontend rebuilds against
the live API, then open `https://gurukela.sourcecode.lk` and sign in.

---

## Updating later

- **Frontend change:** push to `main` → Action redeploys automatically.
- **Backend change:** in cPanel **Git Version Control** → **Pull**, then in
  **Setup Node.js App** → **Restart** (run NPM Install first if dependencies
  changed).

## Troubleshooting

- **"Cannot reach the server"** on the live site → the API URL baked into the
  build is wrong or the backend/subdomain is down. Check
  `https://api.gurukela.sourcecode.lk/api/health` and the `VITE_API_URL` value.
- **CORS error in the browser console** → `CORS_ORIGIN` in the backend `.env`
  must exactly match `https://gurukela.sourcecode.lk` (no trailing slash);
  restart the app after changing it.
- **500 on every request** → usually DB credentials in `.env`. Check the app's
  stderr log in the Node.js App panel.
- **Route 404 on refresh** (e.g. `/login`) → the `.htaccess` SPA fallback is
  missing from `public_html/`; it ships in `frontend/public/.htaccess` and is
  copied into the build.
