// MSAL / Entra ID configuration for "VKAI Insurance Provider Portal".
// All values come from Vite env vars (see .env.example). Real values live in
// a gitignored .env — never commit them.

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID;

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    // Resolve at runtime so login works on any origin — http://localhost:5174
    // locally and the deployed domain in production — with no per-env config.
    // (Each origin must still be registered as a redirect URI in Entra ID.)
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    // sessionStorage keeps tokens per-tab, which is fine for a local demo.
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Scope this SPA exposes on its own API registration.
export const apiScope = `api://${clientId}/access_as_user`;

// Request the custom API scope at login and on token acquisition.
export const loginRequest = {
  scopes: [apiScope],
};

// Group object IDs used for (UI-only) role detection.
export const reviewerGroupId = import.meta.env.VITE_ENTRA_REVIEWER_GROUP_ID;
export const approverGroupId = import.meta.env.VITE_ENTRA_APPROVER_GROUP_ID;
