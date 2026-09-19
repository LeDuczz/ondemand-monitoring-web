// Vitest setup: extends `expect` with jest-dom matchers (toBeInTheDocument,
// etc) for every test file, per vite.config.ts `test.setupFiles`.
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// vite.config.ts does not set `test.globals: true`, so @testing-library/react
// cannot auto-detect a global `afterEach` to register its DOM cleanup. Without
// this, multiple `render()` calls across tests in the same file pile up in
// the same document and every query that should match one element starts
// matching N.
afterEach(() => {
  cleanup()
})
