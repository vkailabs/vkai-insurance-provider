# vkai-insurance-provider

VK AI Labs Insurance — **provider / ops portal** (React + Vite).

The ops-facing frontend for reviewers and approvers to process policy catalog,
enrollments, claims, premiums, and sync issues. It authenticates ops users with
**Entra ID (Azure AD)** via MSAL and talks to the provider API
(`vkai-insurance-provider-api`) over HTTP.

> This is the **provider** side. There is a separate, fully independent client
> side (GCP) with its own frontend and identity provider — this repo has no
> direct knowledge of it. The provider portal uses a **teal** accent so it's
> obviously a different app when both are on screen during a demo.

## Tech stack

- React + Vite (dev server on **port 5174**, matching the registered redirect URI)
- React Router
- `@azure/msal-browser` + `@azure/msal-react` for Entra ID auth
- Lightweight `fetch`-based API client

## Prerequisites

- Node.js 18+ and npm
- The provider API running locally (Docker Compose) on `http://localhost:4100`
- Access to the "VKAI Insurance Provider Portal" Entra ID app registration
  (client ID, tenant ID, and the Reviewer / Approver security group object IDs)

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your real Entra ID values (this file is gitignored — never
commit real config):

| Variable | Description |
| --- | --- |
| `VITE_VKAI_INSURANCE_PROVIDER_API_BASE_URL` | Provider API base URL (default `http://localhost:4100`) |
| `VITE_ENTRA_CLIENT_ID` | App registration (client) ID |
| `VITE_ENTRA_TENANT_ID` | Directory (tenant) ID |
| `VITE_ENTRA_REVIEWER_GROUP_ID` | Reviewers security group object ID |
| `VITE_ENTRA_APPROVER_GROUP_ID` | Approvers security group object ID |

## Run

```bash
npm run dev
```

Then open <http://localhost:5174>. Sign in with Microsoft (a popup login flow),
and you'll land on the dashboard.

Other scripts:

```bash
npm run build     # production build
npm run preview   # preview the production build
```

## Auth & roles

- On login the app requests the `api://<clientId>/access_as_user` scope, then
  acquires an access token silently (falling back to a popup) before each API
  call. The token is attached as a `Bearer` header automatically.
- Roles are derived on the frontend from the ID token's `groups` claim:
  - In the **Approver** group → **Approver**
  - In the **Reviewer** group only → **Reviewer**
  - In **both** groups → treated as **Approver** (superset of Reviewer here)
- Role gating in the UI (e.g. Approver-only buttons) is a **convenience only**.
  Real authorization is enforced server-side in the provider API.

## Pages

| Route | Description | Roles |
| --- | --- | --- |
| `/login` | Sign in with Microsoft | — |
| `/dashboard` | Summary counts (pending enrollments, claims by status, sync issues) | Reviewer / Approver |
| `/catalog` | Policy catalog; add / edit / deactivate plans | View: both · Edit: Approver |
| `/enrollments` | Pending enrollments; activate | Activate: Approver |
| `/claims` | Claims with status filter and workflow actions | Review: both · Approve/Reject/Pay: Approver |
| `/premiums` | Premium records (read-only) | Reviewer / Approver |
| `/sync-issues` | Sync issue records (read-only) | Reviewer / Approver |

## Project layout

```
src/
  api/         fetch-based client + useApi hook
  auth/        MSAL instance, auth context, role resolution
  components/  NavBar, ProtectedRoute, RoleGate, badges, spinner, errors
  pages/       one component per route
  styles/      global CSS (teal provider theme)
  utils/       formatting helpers
  authConfig.js  MSAL config + scopes
```
