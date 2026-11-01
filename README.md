# Career Orchestrator Backend

A standalone Express + MongoDB API for the Career Orchestrator. It is designed to be a separate GitHub repository and later connect to the AcademiaConnect frontend and the existing SAP CAP / MeritLens service.

## What is implemented

- Employee context storage keyed by an external employee ID (keeps AcademiaConnect IDs separate from this service's Mongo IDs).
- Curated job-role catalogue.
- Skills Discovery: combines self-declared skills, completed assessments and project evidence; verified projects can support a `demonstrated` classification.
- Market Intelligence: compares employee skills with role requirements. Current data is a curated demo catalogue, not a live labour-market feed.
- Learning Pathways: recommends a learning sequence for missing skills.
- Inclusive Matching: skill-overlap explanation and explicit excluded protected attributes.
- Employer Readiness: evidence-coverage indicator, not a hiring score.
- Bias Audit: lightweight rule checks for potentially irrelevant criteria; it does not certify absence of bias.
- Human-in-the-Loop: manager review endpoint and persisted decision/comment.
- JWT verification, role guard for manager review, request validation, rate limiting, Helmet and CORS.

All agents currently use deterministic rules. The API does not claim that an LLM or SAP Generative AI Hub is connected. Add an AI provider behind the service layer only after credentials, endpoint and output validation are available.

## Requirements

- Node.js 20+
- MongoDB local or Atlas connection string

## Run locally

```bash
npm install
cp .env.example .env
# Edit .env: set MONGODB_URI and JWT_SECRET
npm run seed
npm run dev
```

API: `http://localhost:5100`
Health: `GET http://localhost:5100/health`

The seed script creates:
- Demo employee ID: `demo-anika-001`
- Roles: `junior-fullstack`, `data-analyst`, `ml-intern`

The seed employee is only demo data. Do not use the demo ID as an authenticated user ID unless you deliberately issue a matching test JWT.

## Authentication integration

Protected routes expect `Authorization: Bearer <JWT>`.

For the first integration with AcademiaConnect:
1. Set `JWT_SECRET` to the same secret used to sign AcademiaConnect's JWTs (only if it uses a symmetric HS256/HS384/HS512 token).
2. Ensure the AcademiaConnect token contains a stable user identifier in `sub`, `id`, `userId`, `_id`, or `user.id` / `user._id`.
3. Ensure the token contains a `role` claim (`employee` or `manager`) if role-based access is needed.
4. Never commit `.env` or expose the signing secret in the frontend.

The verifier first checks configured issuer/audience and then retries signature/expiry verification without those claims if the token does not contain them. For production, align issuer and audience claims across both services instead of relying on fallback verification. If AcademiaConnect uses an asymmetric JWT or a different token format, replace `src/middleware/auth.js` with the correct JWKS/public-key verifier; do not disable authentication.

## API

All application routes are under `/api/v1/orchestrator` and require a bearer token.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/roles` | Authenticated | List active curated roles |
| GET | `/employees/me/context` | Employee | Get own synced employee context |
| PUT | `/employees/me/context` | Employee | Create/update own employee context |
| GET | `/employees/:employeeId/context` | Self or manager | Get employee context |
| POST | `/runs` | Employee | Run all orchestrator capabilities for own context |
| GET | `/runs/:runId` | Owner or manager | Read a run |
| POST | `/runs/:runId/review` | Manager/admin/industry | Approve, reject or request changes |

### 1. Sync employee context

`PUT /api/v1/orchestrator/employees/me/context`

```json
{
  "name": "Anika Sharma",
  "headline": "Returning software developer",
  "careerGoal": "Junior Full-Stack Developer",
  "skills": [
    { "name": "JavaScript", "level": "intermediate", "evidenceLevel": "assessed", "sourceIds": ["ASSESS-JS-01"] }
  ],
  "assessments": [
    { "title": "JavaScript Fundamentals", "skills": ["JavaScript"], "score": 82, "status": "completed" }
  ],
  "projects": [
    { "title": "Task Management App", "skills": ["React"], "evidenceId": "PROJECT-01", "verificationStatus": "verified" }
  ],
  "learningRecords": []
}
```

The external employee ID is taken from the verified JWT, not accepted from the request body. This prevents a user from writing another employee's context.

### 2. List roles

`GET /api/v1/orchestrator/roles`

### 3. Run the orchestrator

`POST /api/v1/orchestrator/runs`

```json
{ "roleId": "junior-fullstack" }
```

Response contains `agents.skillsDiscovery`, `marketIntelligence`, `learningPathway`, `inclusiveMatching`, `employerReadiness`, `biasAudit` and `humanInTheLoop`. The run is saved with `pending_review` status.

### 4. Human review

`POST /api/v1/orchestrator/runs/:runId/review`

```json
{ "decision": "approve", "comment": "Reviewed the skill evidence and recommendations." }
```

Allowed decisions: `approve`, `reject`, `request_changes`. This endpoint requires a manager/admin/industry role claim.

## AcademiaConnect integration options

**Option A — API sync (recommended once the existing backend exposes a protected employee-context endpoint):**

- Set `ACADEMIA_API_BASE_URL` to the AcademiaConnect backend base URL.
- Set `ACADEMIA_SERVICE_TOKEN` to a server-side service token.
- Implement/confirm `GET /api/orchestrator/employees/:id/context` in AcademiaConnect to return a normalised context payload.
- The integration adapter in `src/services/integrations/academiaConnect.js` calls that endpoint.

**Option B — push context into this service:**

- AcademiaConnect backend calls `PUT /api/v1/orchestrator/employees/me/context` using a user JWT, or a dedicated authenticated service-sync endpoint can be added for server-to-server syncing.
- Keep the employee's original AcademiaConnect ID as `externalEmployeeId`.

Do not expose a service token in React. Do not pass arbitrary employee IDs from the browser without server-side authorisation.

## Suggested project structure

```text
src/
  config/                 # environment and MongoDB
  controllers/            # request/response handling
  middleware/             # JWT, role checks, errors
  models/                  # employee context, roles, runs
  routes/                  # versioned API routes
  services/agents/         # the seven orchestrator capabilities
  services/integrations/   # AcademiaConnect and future SAP adapters
  utils/
scripts/seed.js
 tests/
```

## Current limitations / honest demo claims

- Market Intelligence uses three curated example roles; it is not live job-market intelligence.
- Learning recommendations are a small curated mapping; add vetted course URLs and SAP Learning links before claiming catalogue integration.
- Bias Audit is a basic screening rule set, not a fairness certification or legal assessment.
- Employer Readiness is a transparent evidence-coverage indicator, not a validated employability score.
- The agents are deterministic, not LLM agents. SAP Generative AI Hub is not connected in this starter.
- Employee context is stored locally in this service unless the AcademiaConnect adapter is configured. A production deployment should use service-to-service authentication, audit logging, stricter data minimisation and appropriate retention controls.

## Tests

```bash
npm test
```

The tests exercise the deterministic agent logic without requiring MongoDB.
