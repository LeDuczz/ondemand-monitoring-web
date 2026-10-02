import { useEffect, useState } from 'react'

import { useI18n } from '../../../shared/i18n'
import { SystemOperatorLayout } from '../SystemOperatorLayout'
import { SystemOperatorOverview } from '../SystemOperatorOverview'
import { rolePortalPageMessages } from '../../portal/pages/RolePortalPage.messages'
import { OperatorMaintenanceScreen } from '../../drone-operator/pages/OperatorMaintenanceScreen'
import { SystemOperatorDevicesScreen } from './SystemOperatorDevicesScreen'

export function SystemOperatorHomePage() {
  const [hash, setHash] = useState(() => window.location.hash)
  const { t: portal } = useI18n(rolePortalPageMessages)
  const overview = portal.roleContent.SYSTEM_OPERATOR

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (hash === '#portal/system-operator/maintenance') {
    return (
      <SystemOperatorLayout>
        <OperatorMaintenanceScreen />
      </SystemOperatorLayout>
    )
  }

  if (hash === '#portal/system-operator/devices') {
    return (
      <SystemOperatorLayout>
        <SystemOperatorDevicesScreen />
      </SystemOperatorLayout>
    )
  }

  return (
    <SystemOperatorLayout title={overview.title} subtitle={overview.subtitle}>
      <SystemOperatorOverview />
    </SystemOperatorLayout>
  )
}
