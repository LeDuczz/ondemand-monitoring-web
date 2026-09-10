const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
const cognitoDomain = import.meta.env.VITE_AWS_COGNITO_DOMAIN
const cognitoClientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID
const cognitoRedirectSignIn = import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN

export const env = {
  apiBaseUrl: apiBaseUrl ?? 'http://localhost:8080',
  cognitoDomain,
  cognitoClientId,
  cognitoRedirectSignIn,
} as const
