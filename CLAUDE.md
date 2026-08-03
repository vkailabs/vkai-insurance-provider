# CLAUDE.md — Project context for `vkai-insurance-provider`

Ops-facing frontend of **VK AI Labs Insurance** (a personal portfolio project). React +
Vite SPA, Entra ID (Azure AD) auth via MSAL, talks to `vkai-insurance-provider-api`.
See [BUSINESS_REQUIREMENTS.md](BUSINESS_REQUIREMENTS.md) for domain/roles and
[README.md](README.md) for setup.

## Documentation

- **Keep documentation current.** If a change is significant (new field, new business rule,
  new architectural decision, new infrastructure/pipeline, or a newly discovered gotcha),
  update this repo's own [BUSINESS_REQUIREMENTS.md](BUSINESS_REQUIREMENTS.md) and/or
  [README.md](README.md) as part of the **same commit**, not as a separate afterthought.
  Minor or purely cosmetic changes don't need a doc update.

## Naming conventions

- Env vars are prefixed:
  - `VITE_ENTRA_*` — Entra ID config (`VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_TENANT_ID`,
    `VITE_ENTRA_REVIEWER_GROUP_ID`, `VITE_ENTRA_APPROVER_GROUP_ID`).
  - `VITE_VKAI_INSURANCE_PROVIDER_API_*` — provider API config
    (`VITE_VKAI_INSURANCE_PROVIDER_API_BASE_URL`).
- kebab-case for CSS class names, camelCase for JS. See `.env.example` for the full env list.

## Authentication — CRITICAL, do not "simplify"

Auth uses MSAL **`loginRedirect`, NOT `loginPopup`**, with a **dedicated redirect route
`/auth/callback`**. This structure is a hard-won fix — **do not revert to popup-based login
or a bare-origin redirect URI.**

Root-cause history (why it is the way it is):

1. **`loginPopup` broke on mobile Safari** — React Router stripped the auth response hash
   inside the popup window before MSAL could read it (`hash_empty_error`). Fixed by
   switching to `loginRedirect` everywhere (login, token-refresh fallback, logout).
2. **A bare-origin `redirectUri` then broke on desktop** — Microsoft redirected back to
   `/`, and the root route (`<Navigate to="/dashboard">`) immediately navigated away,
   stripping the `#code=...` hash before `handleRedirectPromise` could read it → silent,
   errorless failure back to `/login`. Fixed with a **dedicated `/auth/callback` route** that
   nothing else navigates away from.
3. **Routing races** were fixed by making routing decisions **`inProgress`-aware**:
   `ProtectedRoute`, `LoginPage`, and `AuthCallbackPage` all wait for
   `inProgress === InteractionStatus.None` (from `@azure/msal-browser`) before deciding
   authenticated vs. not — never act on a transient `isAuthenticated === false` mid-redirect.

If you touch auth/routing, understand all three points above first. Do not collapse
`/auth/callback` or the `inProgress` gating.

### redirectUri

- `redirectUri` and `postLogoutRedirectUri` are built from **`window.location.origin`** at
  runtime (`redirectUri` = origin + `/auth/callback`; logout = bare origin). **Never
  hardcode a specific domain** — this is what lets the same build work on localhost and the
  deployed domain. Each origin's `/auth/callback` must be registered in the Entra ID app
  registration.

## Roles / authorization

- Role detection reads the Entra ID **groups claim client-side for UI purposes only**
  (show/hide buttons). **Actual authorization is enforced server-side by the API.** Treat
  the frontend role check as a UX convenience, not a security boundary. A user in both
  Reviewer and Approver groups is treated as Approver.

## UI

- The **nav bar is already responsive**: below 768px the links collapse into a hamburger
  menu (`.navbar__toggle` / `.navbar__menu`; desktop uses `display: contents` so its layout
  is unchanged). **Preserve this** when touching NavBar or its CSS — don't regress the
  mobile menu or alter the desktop layout.

## Catalog plan "key"

- The `key` on a catalog plan is generated and made **unique server-side by the provider
  API**. The frontend **never generates or edits it** — it only displays what the API
  returns. The Key field is rendered **read-only/locked**.
- Because the key only exists **after save**, the **Add Plan form stays open on save**,
  reveals the returned `key` in the locked field, and swaps the **Save** button for
  **"Done"** (a placeholder text is shown in the Key field pre-save). **Preserve this flow**
  if the form is refactored.
- The catalog list renders `key` as a **prefix to the name** (`PG2 - Premium Gold 2024`),
  falling back to just the name if `key` is absent.

## Deployment

- Deployed to **Vercel**. `vercel.json` contains an **SPA rewrite rule** (serves
  `index.html` for all non-asset paths) so client-side routes and refreshes work. **Do not
  remove it** — without it, direct navigation to any route (e.g. `/auth/callback`,
  `/dashboard`) 404s.

## Git workflow — CRITICAL

- Always work on the **`dev`** branch. **Never commit directly to `main`.**
- Commit and push to **`dev` only**. **Never open or merge a PR** — the human handles all
  PR review/merges.
- Confirm the branch (`git branch`) and pull latest before starting.

## Related repos

- **`vkai-insurance-provider-api`** — this frontend's own backend (Azure). Treat as an
  external HTTP service; don't assume access to modify it.
- **`vkai-insurance-client`** and **`vkai-insurance-client-api`** — the **fully independent
  GCP client side**. **Never assume knowledge of, or make changes to, those repos from
  here.** Integration is HTTPS sync only; no shared database.
