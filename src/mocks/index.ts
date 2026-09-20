// Central entry point for the mock API. `httpClient.ts` dynamically imports
// this module the first time it needs `mockFetch`, so importing it pulls in
// every handler module below and registers their routes exactly once.
//
// Later phases add one line per feature, e.g.:
//   import './handlers/managerDashboard'
//   import './handlers/orders'
//
// Drone operator flow handlers
import './handlers/operatorMissions'
import './handlers/operatorAvailability'
import './handlers/operatorFlight'

export { mockFetch } from './mockServer'
