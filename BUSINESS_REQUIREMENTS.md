# Business Requirements — VK AI Labs Insurance (Provider Portal)

## Overview

The **Provider Portal** is the ops-facing frontend of **VK AI Labs Insurance**, a personal
portfolio project. It is used by insurance **provider staff** — not by customers — to
review and act on the insurance records that flow in from the customer-facing side of the
platform.

The portal is built entirely on **Azure** and is paired with its own backend,
`vkai-insurance-provider-api`. It is **fully independent** from the customer-facing "client
side," which runs on **GCP** with its own frontend, backend, and database. The two sides
**share no database**; they exchange data only over **HTTPS** (cross-cloud sync). This
portal has no direct knowledge of the GCP side beyond the records that sync in.

## Users & authentication

All ops users sign in with **Entra ID (Azure AD)** using their **own individual login** —
there is **never a shared password**. Individual logins are a hard requirement so that
every action (activating an enrollment, approving a claim, etc.) is attributable to a
specific person for **audit-trail** purposes.

Authorization is enforced **server-side by the API**. The frontend reads the Entra ID
**groups claim** to tailor the UI (show/hide buttons) as a convenience only — it is not the
security boundary.

## Roles

There are two ops roles, defined by Entra ID security-group membership. A user in **both**
groups is treated as an **Approver** (Approver is a superset of Reviewer).

### Reviewer

- View all records (dashboard, catalog, enrollments, claims, premiums, sync issues).
- Move a claim from **Submitted → Under Review**.

### Approver

Everything a Reviewer can do, **plus**:

- **Approve** / **reject** claims.
- **Mark** approved claims **as paid**.
- **Manage the policy catalog** — create, edit, and deactivate plans.
- **Activate** pending enrollments.

## Core pages

### Dashboard

At-a-glance **summary counts**: pending enrollments, claims broken down by status, and the
number of outstanding sync issues. Entry point after sign-in.

### Catalog

Where the provider **defines the insurance plans** (name, description, premium amount,
coverage amount). The catalog is the **source of truth** for plans: the client (GCP) side
**caches a read-only copy** of it, and customers enroll in those plans over there.

- **Both roles:** view plans.
- **Approver only:** add, edit, and deactivate plans.

### Enrollments

The **pending-enrollment queue** — enrollment requests that have synced in from the client
side and are awaiting provider action.

- **Both roles:** view the queue.
- **Approver only:** **activate** an enrollment (the activation is then synced back to the
  client side).

### Claims

Claims move through a status workflow:

```
Submitted → Under Review → Approved  → Paid
                         ↘ Rejected
```

- **Move to Under Review** (Submitted → Under Review): Reviewer **or** Approver.
- **Approve** / **Reject**: Approver only.
- **Mark as Paid** (from Approved): Approver only.

The gating is **flexible**: an Approver may approve or reject a claim directly without a
Reviewer having moved it to Under Review first — there is no strict Reviewer-first
requirement. Each transition is synced back to the client side.

### Premiums

**View-only** payment history. No actions — ops staff can see premium payments that have
been recorded but do not modify them here.

### Sync Issues

Visibility into cross-cloud syncs that have **permanently failed**. Because the provider and
client sides share no database and rely on HTTPS sync, this page surfaces records
(policies, premiums, claims) whose sync to the client side ultimately failed, so ops staff
are aware of them. Read-only — it is a visibility screen, not a retry console.

## Out of scope

- No customer-facing functionality (that lives entirely on the independent GCP client side).
- No shared database with the client side — integration is HTTPS sync only.
- No payment-gateway integration; premiums are recorded history, not processed here.
