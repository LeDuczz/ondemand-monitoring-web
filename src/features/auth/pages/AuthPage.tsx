import { useState, type FormEvent, type ReactNode } from 'react'

import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import {
  AuthApiError,
  authApi,
  authSession,
  getGoogleAuthorizationUrl,
} from '../api/authApi'

type AuthMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset'
type Notice = { type: 'info' | 'error' | 'success'; message: string }

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
    </span>
  )
}

function AuthLogo() {
  return (
    <a
      className="auth-logo"
      href="#top"
      aria-label="Return to Fieldwise landing page"
    >
      <BrandMark />
      <span>FIELDWISE</span>
    </a>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="auth-field">
      <div className="auth-label-row">
        <label htmlFor={htmlFor}>{label}</label>
        {hint ? <span>{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function PasswordField({
  id,
  value,
  onChange,
  label = 'Password',
  error,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={id === 'password' ? 'At least 8 characters' : undefined}
      error={error}
    >
      <div className="input-with-icon">
        <Icon name="lock" />
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={id === 'password' ? 'current-password' : 'new-password'}
          minLength={8}
          required
        />
        <button
          type="button"
          className="input-action"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible(!visible)}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} />
        </button>
      </div>
    </Field>
  )
}

function EmailField({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <Field label="Work email" htmlFor="email" error={error}>
      <div className="input-with-icon">
        <Icon name="mail" />
        <input
          id="email"
          name="email"
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
      </div>
    </Field>
  )
}

function AuthAside({ mode }: { mode: AuthMode }) {
  return (
    <aside className={`auth-aside auth-aside--${mode}`}>
      <div className="auth-aside-art" aria-hidden="true">
        <span className="art-ring art-ring--one" />
        <span className="art-ring art-ring--two" />
        <span className="art-grid" />
        <div className="art-ticket">
          <div>
            <Icon name="ticket" />
            <span>TICKET #MON-2481</span>
          </div>
          <strong>Inspection in progress</strong>
          <small>East site · Cooling tower B</small>
          <span className="art-progress">
            <i />
          </span>
        </div>
        <div className="art-report">
          <Icon name="file-text" />
          <span>
            <strong>Report ready</strong>
            <small>3 findings · 18 evidence items</small>
          </span>
        </div>
      </div>
      <div className="auth-aside-copy">
        <p className="eyebrow">Customer-first inspection services</p>
        <h2>
          Keep the work moving.
          <br />
          <span>Keep the risk away.</span>
        </h2>
        <p>
          One place to submit requests, follow progress, and make confident
          decisions from the results.
        </p>
        <div className="auth-aside-points">
          <span>
            <Icon name="shield" /> Safer access to difficult areas
          </span>
          <span>
            <Icon name="ticket" /> Transparent request tracking
          </span>
          <span>
            <Icon name="file-text" /> Action-ready inspection reports
          </span>
        </div>
      </div>
      <div className="auth-aside-footer">
        <span>Fieldwise</span>
        <span>Remote monitoring & inspection</span>
      </div>
    </aside>
  )
}

function ModeSwitch({
  mode,
  onChange,
}: {
  mode: AuthMode
  onChange: (mode: 'login' | 'register') => void
}) {
  if (mode === 'verify' || mode === 'forgot' || mode === 'reset') return null
  return (
    <p className="mode-switch">
      {mode === 'login' ? 'New to Fieldwise?' : 'Already have an account?'}{' '}
      <button
        type="button"
        onClick={() => onChange(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'Create an account' : 'Sign in'}
      </button>
    </p>
  )
}

function getAuthTitle(mode: AuthMode) {
  const titles: Record<AuthMode, string> = {
    login: 'Welcome back',
    register: 'Create your account',
    verify: 'Verify your email',
    forgot: 'Reset your password',
    reset: 'Set a new password',
  }
  return titles[mode]
}

function getAuthSubtitle(mode: AuthMode) {
  const subtitles: Record<AuthMode, string> = {
    login: 'Sign in to follow requests, tickets, and reports.',
    register:
      'Start managing monitoring requests with a clear customer workspace.',
    verify: 'One more step before your Fieldwise workspace is ready.',
    forgot: 'Enter your work email and we’ll help you get back in.',
    reset: 'Use a new password with at least 8 characters.',
  }
  return subtitles[mode]
}

function getNoticeIcon(type: Notice['type']) {
  if (type === 'success') return 'check' as const
  if (type === 'error') return 'x' as const
  return 'activity' as const
}

export function AuthPage({
  initialMode = 'login',
}: {
  initialMode?: 'login' | 'register'
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<Notice | undefined>()

  const handleApiError = (error: unknown) => {
    if (error instanceof AuthApiError) {
      setFieldErrors(error.errors ?? {})
      if (error.code === 'USER_NOT_CONFIRMED') setMode('verify')
      setNotice({ type: 'error', message: error.message })
      return
    }
    setNotice({
      type: 'error',
      message: 'Something went wrong. Please try again.',
    })
  }

  const submitRegister = async () => {
    const response = await authApi.register({
      email,
      password,
      fullName,
      role: 'CUSTOMER',
    })
    if (response?.otpRequired) {
      setMode('verify')
      setNotice({
        type: 'success',
        message: `We sent a 6-digit verification code to ${email}.`,
      })
      return
    }
    setMode('login')
    setNotice({
      type: 'success',
      message: 'Registration complete. You can sign in now.',
    })
  }

  const submitVerify = async () => {
    await authApi.verifyOtp({ email, otpCode })
    setMode('login')
    setNotice({
      type: 'success',
      message: 'Email verified. You can sign in to your workspace.',
    })
  }

  const submitForgot = async () => {
    await authApi.forgotPassword({ email })
    setMode('reset')
    setNotice({
      type: 'success',
      message: 'A password reset code has been sent to your email.',
    })
  }

  const submitReset = async () => {
    await authApi.resetPassword({ email, otpCode, newPassword })
    setMode('login')
    setNotice({
      type: 'success',
      message:
        'Password reset complete. You can sign in with your new password.',
    })
  }

  const submitLogin = async () => {
    const response = await authApi.login({ email, password })
    authSession.save(response, rememberMe)
    const suffix = response.user?.fullName
      ? ` as ${response.user.fullName}`
      : ''
    setNotice({ type: 'success', message: `Signed in${suffix}.` })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(undefined)
    setFieldErrors({})
    setIsSubmitting(true)
    const submitters: Partial<Record<AuthMode, () => Promise<void>>> = {
      register: submitRegister,
      verify: submitVerify,
      forgot: submitForgot,
      reset: submitReset,
      login: submitLogin,
    }
    try {
      await submitters[mode]?.()
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setNotice(undefined)
    setIsSubmitting(true)
    try {
      await authApi.resendOtp({ email })
      setNotice({
        type: 'success',
        message: `A new verification code was sent to ${email}.`,
      })
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = () => {
    setNotice(undefined)
    setFieldErrors({})
    try {
      window.location.assign(getGoogleAuthorizationUrl())
    } catch (error) {
      handleApiError(error)
    }
  }

  const backToLogin = () => {
    setMode('login')
    setNotice(undefined)
    setFieldErrors({})
  }
  const title = getAuthTitle(mode)
  const subtitle = getAuthSubtitle(mode)

  return (
    <div className="auth-page">
      <a className="skip-link" href="#auth-form">
        Skip to authentication form
      </a>
      <AuthAside mode={mode} />
      <main className="auth-main">
        <div className="auth-topbar">
          <AuthLogo />
          <a className="back-landing" href="#top">
            Back to site <Icon name="arrow-up-right" />
          </a>
        </div>
        <div className="auth-content">
          <div className="auth-heading">
            <p className="eyebrow">
              {mode === 'register'
                ? 'Join Fieldwise'
                : 'Secure workspace access'}
            </p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {notice ? (
            <output
              className={`auth-notice auth-notice--${notice.type}`}
              aria-live="polite"
            >
              <Icon name={getNoticeIcon(notice.type)} />
              <span>{notice.message}</span>
            </output>
          ) : null}
          <form id="auth-form" className="auth-form" onSubmit={handleSubmit}>
            {mode === 'login' ? (
              <>
                <button
                  type="button"
                  className="auth-google-button"
                  onClick={handleGoogleSignIn}
                >
                  <Icon name="google" />
                  Continue with Google
                </button>
                <div className="auth-divider" aria-hidden="true">
                  <span>or use your work email</span>
                </div>
                <EmailField
                  value={email}
                  onChange={setEmail}
                  error={fieldErrors.email}
                />
                <PasswordField
                  id="password"
                  value={password}
                  onChange={setPassword}
                  error={fieldErrors.password}
                />
                <div className="form-row-inline">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />{' '}
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() => {
                      setMode('forgot')
                      setNotice(undefined)
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <Button
                  type="submit"
                  className="auth-submit"
                  icon="arrow-right"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </>
            ) : null}
            {mode === 'register' ? (
              <>
                <Field
                  label="Full name"
                  htmlFor="fullName"
                  hint="Max 100 characters"
                  error={fieldErrors.fullName}
                >
                  <div className="input-with-icon">
                    <Icon name="users" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Alex Morgan"
                      maxLength={100}
                      autoComplete="name"
                      required
                    />
                  </div>
                </Field>
                <EmailField
                  value={email}
                  onChange={setEmail}
                  error={fieldErrors.email}
                />
                <PasswordField
                  id="password"
                  value={password}
                  onChange={setPassword}
                  error={fieldErrors.password}
                />
                <label className="checkbox-label terms-label">
                  <input type="checkbox" required />{' '}
                  <span>
                    I agree to the Fieldwise terms and privacy policy.
                  </span>
                </label>
                <Button
                  type="submit"
                  className="auth-submit"
                  icon="arrow-right"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>
              </>
            ) : null}
            {mode === 'verify' ? (
              <>
                <EmailField
                  value={email}
                  onChange={setEmail}
                  error={fieldErrors.email}
                />
                <Field
                  label="Verification code"
                  htmlFor="otpCode"
                  hint="6 digits"
                >
                  <div className="input-with-icon">
                    <Icon name="ticket" />
                    <input
                      id="otpCode"
                      name="otpCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={otpCode}
                      onChange={(event) =>
                        setOtpCode(event.target.value.replace(/\D/g, ''))
                      }
                      placeholder="000000"
                      autoComplete="one-time-code"
                      required
                    />
                  </div>
                </Field>
                <Button
                  type="submit"
                  className="auth-submit"
                  icon="arrow-right"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Verifying…' : 'Verify email'}
                </Button>
                <button
                  type="button"
                  className="resend-button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                >
                  Didn’t receive a code? <strong>Resend code</strong>
                </button>
              </>
            ) : null}
            {mode === 'forgot' ? (
              <>
                <EmailField
                  value={email}
                  onChange={setEmail}
                  error={fieldErrors.email}
                />
                <Button
                  type="submit"
                  className="auth-submit"
                  icon="arrow-right"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending…' : 'Send reset code'}
                </Button>
                <button
                  type="button"
                  className="text-back"
                  onClick={backToLogin}
                >
                  <Icon name="arrow-left" /> Back to sign in
                </button>
              </>
            ) : null}
            {mode === 'reset' ? (
              <>
                <EmailField
                  value={email}
                  onChange={setEmail}
                  error={fieldErrors.email}
                />
                <Field
                  label="Reset code"
                  htmlFor="otpCode"
                  hint="6 digits"
                  error={fieldErrors.otpCode}
                >
                  <div className="input-with-icon">
                    <Icon name="ticket" />
                    <input
                      id="otpCode"
                      name="otpCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={otpCode}
                      onChange={(event) =>
                        setOtpCode(event.target.value.replace(/\D/g, ''))
                      }
                      placeholder="000000"
                      required
                    />
                  </div>
                </Field>
                <PasswordField
                  id="newPassword"
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  error={fieldErrors.newPassword}
                />
                <Button
                  type="submit"
                  className="auth-submit"
                  icon="arrow-right"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting…' : 'Reset password'}
                </Button>
                <button
                  type="button"
                  className="text-back"
                  onClick={backToLogin}
                >
                  <Icon name="arrow-left" /> Back to sign in
                </button>
              </>
            ) : null}
          </form>
          <ModeSwitch
            mode={mode}
            onChange={(nextMode) => {
              setMode(nextMode)
              setNotice(undefined)
            }}
          />
          {mode === 'verify' ? (
            <button
              type="button"
              className="text-back auth-bottom-back"
              onClick={backToLogin}
            >
              <Icon name="arrow-left" /> Use a different email
            </button>
          ) : null}
        </div>
      </main>
    </div>
  )
}
