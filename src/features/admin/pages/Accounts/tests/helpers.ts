import { afterEach, beforeEach } from 'vitest'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../../../shared/api/httpClient'
import { mockFetch } from '../../../../../mocks'
import '../../../../../mocks/index'
import { resetMockDb } from '../../../../../mocks/db'

export const requestedUrls: string[] = []

/** Installs the mock transport (recording request URLs) for each test. */
export function useMockTransport() {
  beforeEach(() => {
    resetMockDb()
    requestedUrls.length = 0
    setHttpTransport((input, init) => {
      requestedUrls.push(String(input))
      return mockFetch(input, init)
    })
  })
  afterEach(() => {
    resetMockDb()
    resetHttpTransport()
  })
}
