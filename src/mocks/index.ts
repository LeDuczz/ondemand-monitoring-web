// Central entry point for the mock API. `httpClient.ts` dynamically imports
// this module the first time it needs `mockFetch`, so importing it pulls in
// every handler module below and registers their routes exactly once.
//
// Later phases add one line per feature, e.g.:
//   import './handlers/managerDashboard'
//   import './handlers/orders'

import './handlers/auth'
import './handlers/managerDashboard'
import './handlers/managerOrders'
import './handlers/managerMissions'
import './handlers/managerDrones'
import './handlers/managerMaintenance'
import './handlers/managerMedia'
import './handlers/managerReports'
import './handlers/customerOrders'
import './handlers/adminAccounts'

export { mockFetch } from './mockServer'
