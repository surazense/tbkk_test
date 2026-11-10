# tbkk-frontend

Next.js (App Router, Turbopack) dashboard for the Surazense vibration-sensor system.
It talks to the Rust backend in the separate `be-suratech-sensor` repo.

## Run locally

Needs Node.js 20+ and the backend running (default `http://localhost:3000`).

```bash
npm install
cp .env.example .env.local     # points the app at http://localhost:3000
npm run dev                    # http://localhost:1223
```

How the backend URL is used:
- Browser requests go to `/api/*` on this app; `next.config.ts` rewrites them to `SERVER_API_URL`
  (falls back to `NEXT_PUBLIC_API_BASE_URL`).
- Some hooks call `NEXT_PUBLIC_API_BASE_URL` directly, so keep both variables equal for local work.
- `.env.local` is git-ignored. Restart `npm run dev` after changing it.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server on port 1223 |
| `npm run build` / `npm start` | production build and run |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Pages worth knowing

`/machines` (machine health), `/settings/thresholds` (bulk threshold manager), `/sensors/[id]`,
`/history`, `/reports`, `/settings`. The machine pages need a backend that has the `/machines/health`
endpoints (the one in `be-suratech-sensor`) and its `20261030_add_health_state_events.sql` migration applied.
