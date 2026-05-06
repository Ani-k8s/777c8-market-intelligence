# 777c8 Market Intelligence

Private premium SaaS terminal for live NIFTY/BANKNIFTY market intelligence, operator-vs-retail interpretation, probability-led decisions, strike planning, social copy, reports, and branded image exports.

## Stack

- Frontend: React, Vite, TailwindCSS, Framer Motion, React Router, Axios, Lucide, Recharts, shadcn-style UI primitives, html2canvas
- Backend: Django, Django Rest Framework, Simple JWT
- Database: PostgreSQL through `DATABASE_URL`, SQLite fallback locally
- Deployment: Vercel frontend, Render backend, Supabase PostgreSQL
- DevOps: Dockerfiles, `docker-compose.yml`, GitHub Actions CI

## Core Features

- No public signup; admin-controlled access only
- Default admin seeded from env: `Admin` / `Admin@123`
- JWT protected APIs and role-based admin routes
- User create, enable/disable, delete, expiry date, reset password, admin analytics
- Live data flow: NSE first, Yahoo Finance fallback, in-memory cache, stale/offline fallback marking
- Market analysis: structure, range, momentum, expiry decay, fake-breakout risk, risk meter
- Operator vs retail engine and final interpretation
- Historical probability mock engine using rule-based state conditions
- Strike recommendations: conservative, balanced, aggressive
- Social/Telegram/WhatsApp copy generation
- Instagram square `1080x1080` and story `1080x1920` image export
- Downloadable JSON reports

## Local Backend

Requires Python 3.12+.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_admin
python manage.py runserver
```

Backend URL: `http://localhost:8000`

## Local Frontend

Requires Node.js 22+.

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend URL: `http://localhost:5173`

## Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`

## API Endpoints

Auth:

- `POST /api/auth/login`
- `POST /api/auth/create-user`
- `POST /api/auth/toggle-user`
- `POST /api/auth/delete-user`
- `POST /api/auth/set-expiry`
- `POST /api/auth/reset-password`
- `GET /api/auth/users`
- `GET /api/auth/stats`

Market:

- `GET /api/market/live-data`
- `POST /api/market/analyze`
- `POST /api/market/strike-suggestions`
- `POST /api/market/generate-copy`
- `POST /api/market/generate-image`

Example market payload:

```json
{
  "index": "NIFTY",
  "budget": 5000,
  "risk": "Medium"
}
```

`current_price` is optional. If omitted, the backend uses the live/fallback price snapshot.

## Live Data Notes

The backend tries NSE public data first, including the option-chain endpoint exposed through the NSE option-chain experience. If NSE blocks or fails, it falls back to Yahoo Finance chart data for `^NSEI` and `^NSEBANK`, then derives deterministic nearby option premiums when a live option chain is unavailable. Offline fallback responses are marked with `is_live: false`.

## Render Backend

Use the root `render.yaml` blueprint. Set:

- `ADMIN_PASSWORD`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`

For Supabase, set `DATABASE_URL` to the Supabase PostgreSQL connection string and keep `DATABASE_SSL_REQUIRE=True`.

## Vercel Frontend

Set project root to `frontend`.

```bash
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

Build command: `npm run build`

Output directory: `dist`

## CI

GitHub Actions runs:

- Backend dependency install and Django tests
- Frontend dependency install and production build

Local checks:

```bash
cd backend
python manage.py test

cd ../frontend
npm run lint
npm run build
```

## Risk Warning

This application uses deterministic, rule-based logic. It does not provide guaranteed predictions or financial advice. Always use position sizing, stop losses, and independent judgment.
