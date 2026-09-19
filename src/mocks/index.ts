// Central entry point for the mock API. `httpClient.ts` dynamically imports
// this module the first time it needs `mockFetch`, so importing it pulls in
// every handler module below and registers their routes exactly once.
//
// Later phases add one line per feature, e.g.:
//   import './handlers/managerDashboard'
//   import './handlers/orders'
//
// No manager/customer endpoints exist yet (P0 only ships the mock
// infrastructure), so there is nothing to import here yet.

export { mockFetch } from './mockServer'
