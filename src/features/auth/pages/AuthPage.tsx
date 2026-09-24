import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { Icon } from '../../../shared/components/Icon'
import {
  AuthApiError,
  authApi,
  authSession,
  getGoogleAuthorizationUrl,
} from '../api/authApi'
import { redirectToRoleHome } from '../routing'
import '../auth.css'

type AuthMode =
  'login' | 'register' | 'verify' | 'forgot' | 'reset' | 'first-login'
type Notice = {
  type: 'info' | 'error' | 'success'
  message: string
  detail?: string
}

function BrandMark() {
  return (
    <img
      src="/images/logo-new.png"
      alt="OnDemand Monitor"
      className="odm-auth-aside-brand-mark"
    />
  )
}

function AuthLogo() {
  return (
    <a
      className="odm-auth-logo"
      href="#"
      aria-label="Về trang chủ OnDemand Monitor"
    >
      <BrandMark />
      <span className="odm-auth-brand-name">
        <span className="odm-auth-brand-primary">OnDemand</span>
        <span className="odm-auth-brand-accent">Monitor</span>
      </span>
    </a>
  )
}

function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  return (
    <div className="odm-auth-theme-toggle">
      <span>Giao diện</span>
      <button
        type="button"
        aria-label={`Đổi sang giao diện ${dark ? 'sáng' : 'tối'}`}
        onClick={() => setDark((value) => !value)}
      >
        <Icon name={dark ? 'sun' : 'moon'} />
      </button>
    </div>
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
    <div className="odm-auth-field">
      <div className="odm-auth-field-label-row">
        <label htmlFor={htmlFor}>{label}</label>
        {hint ? <span>{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="odm-auth-field-error" role="alert">
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
  label = 'Mật khẩu',
  hint,
  error,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
  hint?: string
  error?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      <div className="odm-auth-input-wrap has-action">
        <Icon name="lock" />
        <input
          id={id}
          name={id}
          className={`odm-inp${error ? ' odm-inp-err' : ''}`}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={id === 'password' ? 'current-password' : 'new-password'}
          minLength={8}
          required
        />
        <button
          type="button"
          className="odm-auth-input-action"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
    <Field label="Email" htmlFor="email" error={error}>
      <div className="odm-auth-input-wrap">
        <Icon name="mail" />
        <input
          id="email"
          name="email"
          className={`odm-inp${error ? ' odm-inp-err' : ''}`}
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="ban@congty.vn"
          autoComplete="email"
          required
        />
      </div>
    </Field>
  )
}

function AuthAside() {
  return (
    <aside className="odm-auth-aside">
      <a
        className="odm-auth-aside-brand"
        href="#"
        aria-label="Về trang chủ OnDemand Monitor"
      >
        <BrandMark />
        <span className="odm-auth-brand-name">
          <span className="odm-auth-brand-primary">OnDemand</span>
          <span className="odm-auth-brand-accent">Monitor</span>
        </span>
      </a>
      <div className="odm-auth-aside-copy">
        <h1>OnDemand Monitor</h1>
        <p>Dịch vụ giám sát bằng drone theo yêu cầu</p>
        <div className="odm-auth-points">
          <span className="odm-auth-point">
            <Icon name="map-pin" />
            Chọn vị trí và bán kính giám sát ngay trên bản đồ
          </span>
          <span className="odm-auth-point">
            <Icon name="sparkle" />
            AI kiểm tra tính khả thi, gợi ý ngày thay thế trước khi gửi duyệt
          </span>
          <span className="odm-auth-point">
            <Icon name="camera" />
            Xem trực tiếp khi drone bay và nhận ảnh, video đã xác thực
          </span>
        </div>
      </div>
      <div className="odm-auth-aside-footer">
        <span>support@odms.vn</span>
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
  if (
    mode === 'verify' ||
    mode === 'forgot' ||
    mode === 'reset' ||
    mode === 'first-login'
  )
    return null
  return (
    <p className="odm-auth-switch">
      {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
      <button
        type="button"
        onClick={() => onChange(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
      </button>
    </p>
  )
}

function getAuthTitle(mode: AuthMode) {
  const titles: Record<AuthMode, string> = {
    login: 'Đăng nhập',
    register: 'Tạo tài khoản khách hàng',
    verify: 'Xác thực email',
    forgot: 'Quên mật khẩu?',
    reset: 'Đặt lại mật khẩu',
    'first-login': 'Đặt mật khẩu',
  }
  return titles[mode]
}

function getAuthSubtitle(mode: AuthMode) {
  const subtitles: Record<AuthMode, string> = {
    login: 'Chào mừng trở lại. Đăng nhập để quản lý yêu cầu giám sát.',
    register:
      'Dành cho khách hàng cá nhân. Phi công và nhân viên do quản trị viên tạo.',
    verify:
      'Nhập mã 6 số chúng tôi đã gửi tới email của bạn để kích hoạt tài khoản.',
    forgot: 'Nhập email của bạn, chúng tôi sẽ giúp bạn lấy lại quyền truy cập.',
    reset: 'Dùng mật khẩu mới có ít nhất 8 ký tự.',
    'first-login':
      'Quản trị viên đã tạo tài khoản này. Đặt mật khẩu cá nhân để tiếp tục.',
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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [challengeSession, setChallengeSession] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<Notice | undefined>()

  const handleApiError = (error: unknown) => {
    if (error instanceof AuthApiError) {
      setFieldErrors(error.errors ?? {})
      if (error.code === 'USER_NOT_CONFIRMED') setMode('verify')
      if (error.code === 'ACCOUNT_DISABLED') {
        // Design state "Tài khoản khoá" (SYS-01). No backend "remaining
        // attempts" field exists, so we do not render the design's
        // "Còn 3 lần thử trước khi tạm khoá." line — see evd report.
        setNotice({
          type: 'error',
          message: 'Tài khoản đã bị khoá.',
          detail: 'Liên hệ quản trị viên qua support@odms.vn để mở lại.',
        })
        return
      }
      if (error.code === 'INVALID_CREDENTIALS') {
        // Design state "Sai thông tin" (SYS-01).
        setNotice({ type: 'error', message: 'Email hoặc mật khẩu không đúng.' })
        return
      }
      setNotice({ type: 'error', message: error.message })
      return
    }
    setNotice({ type: 'error', message: 'Đã có lỗi xảy ra. Vui lòng thử lại.' })
  }

  const submitRegister = async () => {
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Mật khẩu không khớp' })
      return
    }
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
        message: `Chúng tôi đã gửi mã xác thực 6 số tới ${email}.`,
      })
      return
    }
    setMode('login')
    setNotice({
      type: 'success',
      message: 'Đăng ký thành công. Bạn có thể đăng nhập ngay.',
    })
  }

  const submitVerify = async () => {
    await authApi.verifyOtp({ email, otpCode })
    setMode('login')
    setNotice({
      type: 'success',
      message: 'Email đã được xác thực. Bạn có thể đăng nhập.',
    })
  }

  const submitForgot = async () => {
    await authApi.forgotPassword({ email })
    setMode('reset')
    setNotice({
      type: 'success',
      message: 'Mã đặt lại mật khẩu đã được gửi tới email của bạn.',
    })
  }

  const submitReset = async () => {
    await authApi.resetPassword({ email, otpCode, newPassword })
    setMode('login')
    setNotice({
      type: 'success',
      message:
        'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
    })
  }

  const submitLogin = async () => {
    const response = await authApi.login({ email, password })
    if (response.status === 'PASSWORD_CHANGE_REQUIRED' && response.session) {
      setChallengeSession(response.session)
      setMode('first-login')
      setNotice({
        type: 'info',
        message: 'Đặt mật khẩu mới để kích hoạt tài khoản.',
      })
      return
    }
    authSession.save(response, rememberMe)
    const suffix = response.user?.fullName ? `, ${response.user.fullName}` : ''
    setNotice({ type: 'success', message: `Đăng nhập thành công${suffix}.` })
    redirectToRoleHome(response.user?.role)
  }

  const submitFirstLogin = async () => {
    const response = await authApi.completeFirstLogin({
      email,
      session: challengeSession,
      newPassword,
    })
    authSession.save(response, rememberMe)
    setNotice({
      type: 'success',
      message: 'Đặt mật khẩu thành công. Chào mừng tới OnDemand Monitor.',
    })
    redirectToRoleHome(response.user?.role)
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
      'first-login': submitFirstLogin,
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
        message: `Mã xác thực mới đã được gửi tới ${email}.`,
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
    <div className="odm odm-auth">
      <a className="skip-link" href="#auth-form">
        Bỏ qua tới biểu mẫu
      </a>
      <AuthAside />
      <main className="odm-auth-main">
        <div className="odm-auth-topbar">
          <AuthLogo />
          <ThemeToggle />
        </div>
        <div className="odm-auth-content">
          <div className="odm-auth-card">
            <div className="odm-auth-heading">
              <p className="odm-auth-eyebrow">
                {mode === 'register'
                  ? 'Tham gia OnDemand Monitor'
                  : 'Truy cập không gian làm việc an toàn'}
              </p>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {notice ? (
              <output
                className={`odm-auth-notice odm-auth-notice--${notice.type}`}
                aria-live="polite"
              >
                <Icon name={getNoticeIcon(notice.type)} />
                <span>
                  <p>{notice.message}</p>
                  {notice.detail ? <p>{notice.detail}</p> : null}
                </span>
              </output>
            ) : null}
            <form
              id="auth-form"
              className="odm-auth-form"
              onSubmit={handleSubmit}
            >
              {mode === 'login' ? (
                <>
                  <button
                    type="button"
                    className="odm-auth-google"
                    onClick={handleGoogleSignIn}
                  >
                    <Icon name="google" />
                    Tiếp tục với Google
                  </button>
                  <div className="odm-auth-divider" aria-hidden="true">
                    <span>hoặc dùng email công việc</span>
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
                    hint="Tối thiểu 8 ký tự"
                    error={fieldErrors.password}
                  />
                  <div className="odm-auth-row">
                    <label className="odm-auth-checkbox">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) =>
                          setRememberMe(event.target.checked)
                        }
                      />
                      <span>Ghi nhớ đăng nhập</span>
                    </label>
                    <button
                      type="button"
                      className="odm-auth-link-button"
                      onClick={() => {
                        setMode('forgot')
                        setNotice(undefined)
                      }}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="odm-btn odm-btn-p odm-auth-submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                </>
              ) : null}
              {mode === 'register' ? (
                <>
                  <Field
                    label="Họ và tên"
                    htmlFor="fullName"
                    hint="Tối đa 100 ký tự"
                    error={fieldErrors.fullName}
                  >
                    <div className="odm-auth-input-wrap">
                      <Icon name="users" />
                      <input
                        id="fullName"
                        name="fullName"
                        className={`odm-inp${fieldErrors.fullName ? ' odm-inp-err' : ''}`}
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Nguyễn Văn A"
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
                    hint="Tối thiểu 8 ký tự"
                    error={fieldErrors.password}
                  />
                  <PasswordField
                    id="confirmPassword"
                    label="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    error={fieldErrors.confirmPassword}
                  />
                  <label className="odm-auth-checkbox">
                    <input type="checkbox" required />
                    <span>
                      Tôi đồng ý với Điều khoản sử dụng và chính sách bay an
                      toàn.
                    </span>
                  </label>
                  <button
                    type="submit"
                    className="odm-btn odm-btn-p odm-auth-submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                  </button>
                </>
              ) : null}
              {mode === 'verify' ? (
                <>
                  <EmailField
                    value={email}
                    onChange={setEmail}
                    error={fieldErrors.email}
                  />
                  <Field label="Mã xác thực" htmlFor="otpCode" hint="6 chữ số">
                    <div className="odm-auth-input-wrap">
                      <Icon name="ticket" />
                      <input
                        id="otpCode"
                        name="otpCode"
                        className="odm-inp"
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
                  <button
                    type="submit"
                    className="odm-btn odm-btn-p odm-auth-submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? 'Đang xác thực...' : 'Xác thực email'}
                  </button>
                  <button
                    type="button"
                    className="odm-auth-resend"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                  >
                    Chưa nhận được mã? <strong>Gửi lại mã</strong>
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
                  <button
                    type="submit"
                    className="odm-btn odm-btn-p odm-auth-submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi mã đặt lại'}
                  </button>
                  <button
                    type="button"
                    className="odm-auth-back"
                    onClick={backToLogin}
                  >
                    <Icon name="arrow-left" /> Quay lại đăng nhập
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
                    label="Mã đặt lại"
                    htmlFor="otpCode"
                    hint="6 chữ số"
                    error={fieldErrors.otpCode}
                  >
                    <div className="odm-auth-input-wrap">
                      <Icon name="ticket" />
                      <input
                        id="otpCode"
                        name="otpCode"
                        className={`odm-inp${fieldErrors.otpCode ? ' odm-inp-err' : ''}`}
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
                    label="Mật khẩu mới"
                    value={newPassword}
                    onChange={setNewPassword}
                    hint="Tối thiểu 8 ký tự"
                    error={fieldErrors.newPassword}
                  />
                  <button
                    type="submit"
                    className="odm-btn odm-btn-p odm-auth-submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                  </button>
                  <button
                    type="button"
                    className="odm-auth-back"
                    onClick={backToLogin}
                  >
                    <Icon name="arrow-left" /> Quay lại đăng nhập
                  </button>
                </>
              ) : null}
              {mode === 'first-login' ? (
                <>
                  <EmailField
                    value={email}
                    onChange={setEmail}
                    error={fieldErrors.email}
                  />
                  <PasswordField
                    id="newPassword"
                    label="Mật khẩu mới"
                    value={newPassword}
                    onChange={setNewPassword}
                    hint="Tối thiểu 8 ký tự"
                    error={fieldErrors.newPassword}
                  />
                  <button
                    type="submit"
                    className="odm-btn odm-btn-p odm-auth-submit"
                    disabled={isSubmitting || !challengeSession}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Đang lưu mật khẩu...'
                      : 'Tiếp tục vào workspace'}
                  </button>
                </>
              ) : null}
            </form>
            <ModeSwitch
              mode={mode}
              onChange={(nextMode) => {
                setMode(nextMode)
                setNotice(undefined)
                // Keep the URL in sync with the visible form so the back
                // button and a copy-pasted link both land on the right mode.
                window.location.hash =
                  nextMode === 'register' ? '#auth/register' : '#auth/login'
              }}
            />
            {mode === 'verify' ? (
              <button
                type="button"
                className="odm-auth-back odm-auth-bottom-back"
                onClick={backToLogin}
              >
                <Icon name="arrow-left" /> Dùng email khác
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
