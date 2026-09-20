// Central entry point for the mock API. `httpClient.ts` dynamically imports
// this module the first time it needs `mockFetch`, so importing it pulls in
// every handler module below and registers their routes exactly once.

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
import './handlers/adminRoles'
import './handlers/adminCatalog'
import './handlers/adminConfig'
import './handlers/adminAiKnowledge'
import './handlers/adminAuditLog'

export { mockFetch } from './mockServer'
