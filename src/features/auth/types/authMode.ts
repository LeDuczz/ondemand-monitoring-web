export type AuthMode =
  'login' | 'register' | 'verify' | 'forgot' | 'reset' | 'first-login'

export type Notice = {
  type: 'info' | 'error' | 'success'
  message: string
  detail?: string
}
