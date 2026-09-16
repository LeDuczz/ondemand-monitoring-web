const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
const controlApiBaseUrl = import.meta.env.VITE_CONTROL_API_BASE_URL
const mediaClientMode = import.meta.env.VITE_MEDIA_CLIENT_MODE
const cognitoDomain = import.meta.env.VITE_AWS_COGNITO_DOMAIN
const cognitoClientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID
const cognitoRedirectSignIn = import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN

export const env = {
  apiBaseUrl: apiBaseUrl ?? 'http://localhost:8080',
  controlApiBaseUrl: controlApiBaseUrl ?? 'http://localhost:8081',
  mediaClientMode: mediaClientMode === 'fake' ? 'fake' : 'real',
  cognitoDomain,
  cognitoClientId,
  cognitoRedirectSignIn,
} as const
