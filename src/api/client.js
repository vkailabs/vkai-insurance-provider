import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance } from '../auth/msalInstance';
import { loginRequest } from '../authConfig';

const baseUrl = import.meta.env.VITE_VKAI_INSURANCE_PROVIDER_API_BASE_URL;

// Acquire an access token for the provider API. Try silently first, then fall
// back to an interactive popup if MSAL needs user interaction.
async function getAccessToken() {
  const account =
    msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];

  if (!account) {
    throw new Error('No signed-in account; cannot acquire a token.');
  }

  const request = { ...loginRequest, account };

  try {
    const result = await msalInstance.acquireTokenSilent(request);
    return result.accessToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      const result = await msalInstance.acquireTokenPopup(request);
      return result.accessToken;
    }
    throw err;
  }
}

// Core request helper: attaches the Bearer token, parses JSON, and routes 401s
// back to the login page.
async function request(path, { method = 'GET', body } = {}) {
  const token = await getAccessToken();

  const headers = { Authorization: `Bearer ${token}` };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Token rejected by the API — bounce to login.
    if (window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
    throw new Error('Unauthorized (401). Redirecting to login.');
  }

  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      detail = data?.message || data?.error || JSON.stringify(data);
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(
      `Request failed (${res.status})${detail ? `: ${detail}` : ''}`
    );
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

// ---- API surface (matches provider API routes) ----

// Policy catalog
export const getPolicyCatalog = () => request('/v1/policy-catalog');
export const createPolicy = (data) =>
  request('/v1/policy-catalog', { method: 'POST', body: data });
export const updatePolicy = (id, data) =>
  request(`/v1/policy-catalog/${id}`, { method: 'PATCH', body: data });

// Enrollments (policies)
export const getPendingEnrollments = () =>
  request('/v1/policies?status=pending');
export const activatePolicy = (id) =>
  request(`/v1/policies/${id}/activate`, { method: 'POST' });

// Premiums
export const getPremiums = () => request('/v1/premiums');

// Claims
export const getClaims = (statusFilter) => {
  const qs =
    statusFilter && statusFilter !== 'All'
      ? `?status=${encodeURIComponent(statusFilter)}`
      : '';
  return request(`/v1/claims${qs}`);
};
export const reviewClaim = (id) =>
  request(`/v1/claims/${id}/review`, { method: 'POST' });
export const approveClaim = (id) =>
  request(`/v1/claims/${id}/approve`, { method: 'POST' });
export const rejectClaim = (id) =>
  request(`/v1/claims/${id}/reject`, { method: 'POST' });
export const markClaimPaid = (id) =>
  request(`/v1/claims/${id}/mark-paid`, { method: 'POST' });

// Sync issues
export const getSyncIssues = () => request('/v1/sync-issues');
