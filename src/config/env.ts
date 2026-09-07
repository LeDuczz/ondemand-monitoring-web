const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export const env = {
  apiBaseUrl: apiBaseUrl ?? 'http://localhost:8080',
} as const
