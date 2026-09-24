// Single source of truth for "log the current user out": call the backend,
// but always clear the local session and send the user back to the login
// screen even if the API call fails (expired token, offline, etc).

import { authApi, authSession } from './authApi'

export async function logout() {
  const token = authSession.getAccessToken()
  try {
    if (token) await authApi.logout(token)
  } catch {
    // Ignore: the user is signing out either way — see finally below.
  } finally {
    authSession.clear()
    window.location.hash = '#auth/login'
  }
}
