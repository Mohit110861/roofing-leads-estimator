# Northline Roofing & Exteriors — Roofing Lead Estimator

A configuration-driven roofing estimate and lead capture application built for Northline Roofing & Exteriors.

The application has two surfaces:

1. **Public Estimator** — homeowners answer roof questions, provide contact details, and receive an estimated price range.
2. **Owner Dashboard** — authenticated users can view leads, inspect answers and estimates, update lead status/notes, and manage estimator questions.

The public estimator and owner dashboard share the same backend configuration stored in MongoDB.

## Features

### Public Estimator

* Multi-step roofing estimator
* Questions loaded from the backend at runtime
* Questions can be enabled/disabled from the owner dashboard
* Question labels and options come from the database
* Server-side estimate calculation
* Contact information capture
* Lead storage with answers and generated estimate
* Estimate range with low, high, and midpoint values
* Validation and loading/error handling

### Owner Dashboard

* Owner authentication
* View captured leads
* Search leads by name, phone, or email
* Filter leads by status
* View complete lead details
* View roof answers and estimate breakdown
* Update lead status
* Add/update lead notes
* Refresh leads
* Manage estimator questions
* Enable/disable questions
* Reorder questions
* Edit question labels and configuration
* Add new questions
* Edit pricing-related option values

## Tech Stack

* React
* Node.js
* Express
* MongoDB
* Mongoose
* JWT-based authentication

## Project Structure

```text
project/
├── client/                 # React frontend
└── server/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── services/
    └── scripts/
```

## Running Locally

### 1. Clone the repository

```bash
git clone <REPOSITORY_URL>
cd <PROJECT_DIRECTORY>
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the server directory.

```env
MONGO_URI=<YOUR_MONGODB_CONNECTION_STRING>

SEED_OWNER_EMAIL=owner@northlineroofing.com
SEED_OWNER_PASSWORD=<YOUR_TEST_OWNER_PASSWORD>
```

Do not commit the `.env` file to the repository.

### 5. Seed the database

From the server directory:

```bash
node scripts/seed.js
```

The seed script creates:

* the active estimator configuration
* sample leads
* the owner account

The seed script also calculates the sample lead estimates using the same server-side calculator used by real submissions.

### 6. Start the backend

```bash
npm run dev
```

or use the backend start command defined in `server/package.json`.

### 7. Start the frontend

From the client directory:

```bash
npm run dev
```

Use the frontend URL shown by the development server.

> Replace the commands above if the final repository uses different npm scripts.

## Environment Variables

| Variable              | Required | Purpose                                |
| --------------------- | -------- | -------------------------------------- |
| `MONGO_URI`           | Yes      | MongoDB connection string              |
| `SEED_OWNER_EMAIL`    | No       | Owner email used by the seed script    |
| `SEED_OWNER_PASSWORD` | No       | Owner password used by the seed script |

## API Overview

### Public

```text
GET /api/config/public
```

Returns only active estimator questions required by the public UI.

### Owner Configuration

```text
GET /api/config/full
```

Returns the full configuration to the authenticated owner.

```text
PUT /api/config
```

Updates owner-editable configuration.

### Leads

```text
GET /api/leads
GET /api/leads/:id
PATCH /api/leads/:id/status
PATCH /api/leads/:id/notes
```

These endpoints are protected by owner authentication where appropriate.

## Calculation

The estimate is calculated on the server.

The calculation uses:

```text
material cost = roof size × material rate

waste cost = material cost × waste factor

tear-off cost = configured layer cost

base cost = material cost + waste cost + tear-off cost

adjusted cost =
    base cost × pitch multiplier × stories multiplier

midpoint = adjusted cost + permit fee

range =
    midpoint ± configured range spread
```

Pricing values are stored in MongoDB configuration rather than being hardcoded into the public frontend.

## Test Credentials

Use the credentials configured through:

```env
SEED_OWNER_EMAIL
SEED_OWNER_PASSWORD
```

For the submitted build, the actual test credentials should be provided to the reviewer separately or listed here if they are safe to share.

## Important Configuration Rule

The public frontend does not define the estimator questions, labels, options, or pricing values.

The frontend requests configuration from the backend at runtime. This allows the owner to change estimator configuration without redeploying the frontend.

## Repository / Deployment

Repository:



Live Estimator:

http://localhost:5173/

Owner Dashboard:

http://localhost:5173/owner

These values should be replaced with the final deployed URLs before submission.
