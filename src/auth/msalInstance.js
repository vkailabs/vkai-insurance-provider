import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from '../authConfig';

// ---------------------------------------------------------------------------
// TEMP DIAGNOSTIC (remove once redirect login is fixed): tiny timestamped logger
// so a live test produces actual signal in the console.
const diag = (...args) =>
  // eslint-disable-next-line no-console
  console.log(`[MSAL-DIAG ${new Date().toISOString()}]`, ...args);

diag('msalInstance module load', {
  href: window.location.href,
  hash: window.location.hash,
  search: window.location.search,
});
// ---------------------------------------------------------------------------

// Single shared MSAL instance. Exported so both the React tree (MsalProvider)
// and the plain fetch-based API client can acquire tokens from the same cache.
export const msalInstance = new PublicClientApplication(msalConfig);

// Keep the active account in sync so acquireTokenSilent has an account to use.
if (!msalInstance.getActiveAccount()) {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }
}

msalInstance.addEventCallback((event) => {
  // TEMP DIAGNOSTIC (remove once fixed): log EVERY event MSAL fires. This is how
  // we observe handleRedirectPromise's outcome without calling it ourselves:
  //   HANDLE_REDIRECT_START/END with no LOGIN_SUCCESS/FAILURE => resolved null
  //   LOGIN_SUCCESS / ACQUIRE_TOKEN_SUCCESS                    => got an account
  //   *_FAILURE                                                => threw an error
  diag('event', {
    type: event.eventType,
    interactionType: event.interactionType,
    hasAccount: !!event.payload?.account,
    account: event.payload?.account?.username,
    error: event.error?.errorCode || event.error?.message,
    hashNow: window.location.hash,
  });

  if (
    event.eventType === EventType.LOGIN_SUCCESS &&
    event.payload?.account
  ) {
    msalInstance.setActiveAccount(event.payload.account);
  }
});
