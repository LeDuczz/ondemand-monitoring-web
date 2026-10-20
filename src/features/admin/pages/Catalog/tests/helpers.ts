import { afterEach, beforeEach } from 'vitest'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../../../shared/api/httpClient'
import { mockFetch } from '../../../../../mocks'
import '../../../../../mocks/index'
import { resetMockDb } from '../../../../../mocks/db'

export function useMockTransport() {
  beforeEach(() => {
    resetMockDb()
    setHttpTransport(mockFetch)
  })
  afterEach(() => {
    resetMockDb()
    resetHttpTransport()
  })
}
