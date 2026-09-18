import { useEffect, useRef, useState } from 'react'

import { Icon } from '../../../shared/components/Icon'
import { AuthApiError, authApi, authSession } from '../api/authApi'
import { redirectToRoleHome } from '../routing'

const CALLBACK_PATH = '/social/callback'
const processedSocialCodes = new Set<string>()

const getProviderErrorMessage = (value: string | null) => {
  if (!value) return undefined
  if (value.includes('SourceUser is already linked to DestinationUser')) {
    return 'This Google account is already linked to another Cognito account. Ask an administrator to remove the duplicate link or make the Cognito Pre Sign-up linking step idempotent, then try again.'
  }
  return value
}

export function SocialCallbackPage() {
  const [error, setError] = useState<string>()
  const [isSlow, setIsSlow] = useState(false)
  const [userName, setUserName] = useState<string>()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const providerError = getProviderErrorMessage(
      params.get('error_description') ?? params.get('error'),
    )
    const redirectUri = `${window.location.origin}${CALLBACK_PATH}`
    const storageKey = code ? `fieldwise.google.code.${code}` : undefined
    const slowTimer = window.setTimeout(() => setIsSlow(true), 8000)

    if (!code) {
      setError(
        providerError ??
          'Google did not return an authorization code. Check the Cognito callback URL and code flow configuration.',
      )
      window.clearTimeout(slowTimer)
      return
    }

    const codeState = storageKey ? sessionStorage.getItem(storageKey) : null
    const alreadyAuthenticated = Boolean(authSession.getAccessToken())

    if (
      processedSocialCodes.has(code) ||
      codeState === 'processing' ||
      codeState === 'done'
    ) {
      window.clearTimeout(slowTimer)
      if (alreadyAuthenticated || codeState === 'done') {
        window.location.replace(`${window.location.origin}/#top`)
      }
      return
    }
    processedSocialCodes.add(code)
    if (storageKey) sessionStorage.setItem(storageKey, 'processing')

    authApi
      .socialSync({
        code,
        redirectUri,
        intent: 'LOGIN_OR_REGISTER',
        provider: 'GOOGLE',
      })
      .then((response) => {
        authSession.save(response, true)
        if (storageKey) sessionStorage.setItem(storageKey, 'done')
        setUserName(response.user?.fullName)
        window.setTimeout(() => redirectToRoleHome(response.user?.role), 700)
      })
      .catch((requestError: unknown) => {
        processedSocialCodes.delete(code)
        if (storageKey) sessionStorage.removeItem(storageKey)
        setError(
          requestError instanceof AuthApiError
            ? requestError.message
            : 'Google sign-in could not be completed. Please try again.',
        )
      })
      .finally(() => window.clearTimeout(slowTimer))

    return () => window.clearTimeout(slowTimer)
  }, [])

  if (error) {
    return (
      <div className="auth-callback-page">
        <div className="auth-callback-card">
          <div className="auth-callback-icon auth-callback-icon--error">
            <Icon name="x" />
          </div>
          <p className="eyebrow">Secure workspace access</p>
          <h1>Google sign-in failed</h1>
          <p>{error}</p>
          <a className="button button--primary" href="#auth/login">
            <span>Back to sign in</span>
            <Icon name="arrow-left" />
          </a>
        </div>
      </div>
    )
  }

  if (userName) {
    return (
      <div className="auth-callback-page">
        <div className="auth-callback-card">
          <div className="auth-callback-icon auth-callback-icon--success">
            <Icon name="check" />
          </div>
          <p className="eyebrow">Google account connected</p>
          <h1>Welcome{userName ? `, ${userName}` : ''}</h1>
          <p>
            Your customer account is ready. Continue to Fieldwise to manage
            monitoring requests.
          </p>
          <a className="button button--primary" href="#top">
            <span>Continue to Fieldwise</span>
            <Icon name="arrow-right" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-callback-page">
      <div
        className="auth-callback-card auth-callback-card--loading"
        role="status"
        aria-live="polite"
      >
        <div className="auth-callback-spinner" aria-hidden="true" />
        <p className="eyebrow">Google account</p>
        <h1>Finishing sign-in</h1>
        <p>
          {isSlow
            ? 'This is taking longer than usual. Please keep this window open.'
            : 'Verifying your account securely…'}
        </p>
      </div>
    </div>
  )
}
