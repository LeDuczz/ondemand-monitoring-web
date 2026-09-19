const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
const cognitoDomain = import.meta.env.VITE_AWS_COGNITO_DOMAIN
const cognitoClientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID
const cognitoRedirectSignIn = import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN

// VITE_USE_MOCK_API: 'true' forces the mock transport on, 'false' forces it
// off, anything else (unset) defaults to on in dev builds only.
const useMockApiFlag = import.meta.env.VITE_USE_MOCK_API
const useMockApi =
  useMockApiFlag === 'true'
    ? true
    : useMockApiFlag === 'false'
      ? false
      : import.meta.env.DEV

// Simulated network latency for the mock API, in milliseconds. Zero during
// tests so vitest runs stay fast and deterministic.
const mockLatencyMs = import.meta.env.MODE === 'test' ? 0 : 250

export const env = {
  apiBaseUrl: apiBaseUrl ?? 'http://localhost:8080',
  cognitoDomain,
  cognitoClientId,
  cognitoRedirectSignIn,
  useMockApi,
  mockLatencyMs,
} as const
