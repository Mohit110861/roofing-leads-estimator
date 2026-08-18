# Wantace Roof Estimator — Backend

Node.js + Express + MongoDB API. All pricing logic and question config live
in the database — nothing is hardcoded in the frontend.

## Setup

```bash
cd server
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, etc.
npm run seed            # loads Northline Roofing config + 3 sample leads + owner login
npm run dev              # starts on http://localhost:5000
```

Seeded owner login (change immediately in production):
```
email: owner@northlineroofing.com
password: ChangeMe123!
```
Override via `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` env vars before running `npm run seed`.

## API

| Method | Route                | Auth   | Purpose                                   |
|--------|-----------------------|--------|--------------------------------------------|
| GET    | /api/health            | none   | Health check                               |
| GET    | /api/config/public      | none   | Active questions for the public estimator  |
| POST   | /api/estimate           | none   | Preview an estimate without saving a lead  |
| POST   | /api/leads              | none   | Submit answers + contact info -> saves lead, returns estimate |
| POST   | /api/auth/login         | none   | Owner login -> returns JWT                 |
| GET    | /api/auth/me             | owner  | Current logged-in owner                    |
| GET    | /api/config              | owner  | Full config incl. rates/multipliers        |
| PUT    | /api/config              | owner  | Edit rates/labels/active flags (bumps config version) |
| GET    | /api/leads               | owner  | List all leads                             |
| GET    | /api/leads/:id            | owner  | Single lead detail with full answer snapshot |

Owner routes require `Authorization: Bearer <token>` from `/api/auth/login`.

## Calculation formula

See `services/calculator.js` (pure, unit-testable) and `DECISIONS.md` at the
project root for the reasoning behind it:

```
materialCost = roofSize * materialRate
wasteCost     = materialCost * wasteFactorPct
tearOffCost    = flat add-on based on old layers (0 / 1 / 2+)
baseCost        = materialCost + wasteCost + tearOffCost
adjustedCost     = baseCost * pitchMultiplier * storiesMultiplier
midpoint          = adjustedCost + permitFee
low / high          = midpoint -/+ (rangeSpreadPct / 2)
```

## Notes on the "no hardcoding" requirement

- The public estimator only ever calls `GET /api/config/public`, which reads
  live from MongoDB — editing a question label or rate via `PUT /api/config`
  changes the public form immediately, no redeploy needed.
- `PUT /api/config` currently only edits *existing* question/option keys
  (label, active, order, rate, multiplier, extraFlat). Creating brand-new
  questions from the owner panel is listed as a stretch goal, not core.
- Every `Config` save bumps `version`, and every `Lead` stores the
  `configVersion` that produced its estimate, so historical leads stay
  traceable even after rates change later.
