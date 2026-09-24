import { afterEach, describe, expect, it } from 'vitest'

import {
  ApiError,
  apiRequest,
  resetHttpTransport,
  setHttpTransport,
} from './httpClient'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  resetHttpTransport()
})

describe('apiRequest', () => {
  it('returns the envelope data on success', async () => {
    setHttpTransport(async () =>
      jsonResponse({ success: true, code: 'OK', data: { id: '1' } }),
    )

    const result = await apiRequest<{ id: string }>('/api/orders/1')
    expect(result).toEqual({ id: '1' })
  })

  it('throws ApiError with the backend code when success is false', async () => {
    setHttpTransport(async () =>
      jsonResponse({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: { email: 'Required' },
      }),
    )

    await expect(apiRequest('/api/orders')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      errors: { email: 'Required' },
    })
  })

  it('throws ApiError with status/method/path on an HTTP error', async () => {
    setHttpTransport(async () =>
      jsonResponse(
        { success: false, code: 'INTERNAL_ERROR', message: 'Boom' },
        500,
      ),
    )

    try {
      await apiRequest('/manager/dashboard', { method: 'GET' })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      const apiError = error as ApiError
      expect(apiError.status).toBe(500)
      expect(apiError.method).toBe('GET')
      expect(apiError.path).toBe('/manager/dashboard')
    }
  })

  it('throws a generic ApiError when the transport rejects (network error)', async () => {
    setHttpTransport(async () => {
      throw new TypeError('Failed to fetch')
    })

    try {
      await apiRequest('/api/orders', { method: 'POST', body: { a: 1 } })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      const apiError = error as ApiError
      expect(apiError.status).toBeUndefined()
      expect(apiError.method).toBe('POST')
      expect(apiError.path).toBe('/api/orders')
    }
  })

  it('builds the query string, skipping undefined values', async () => {
    let capturedUrl = ''
    setHttpTransport(async (url) => {
      capturedUrl = url
      return jsonResponse({ success: true, data: [] })
    })

    await apiRequest('/api/orders', {
      query: { status: 'PENDING', page: 2, urgent: true, cursor: undefined },
    })

    expect(capturedUrl).toContain('/api/orders?')
    const query = new URL(capturedUrl).searchParams
    expect(query.get('status')).toBe('PENDING')
    expect(query.get('page')).toBe('2')
    expect(query.get('urgent')).toBe('true')
    expect(query.has('cursor')).toBe(false)
  })
})
