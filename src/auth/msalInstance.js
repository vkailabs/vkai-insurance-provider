import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from '../authConfig';

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
  if (
    event.eventType === EventType.LOGIN_SUCCESS &&
    event.payload?.account
  ) {
    msalInstance.setActiveAccount(event.payload.account);
  }
});
