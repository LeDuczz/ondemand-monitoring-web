import { useEffect, useState } from 'react'

import { useI18n } from '../../../shared/i18n'
import { RolePortalPage } from '../../portal/pages/RolePortalPage'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { OperatorMaintenanceScreen } from '../../drone-operator/pages/OperatorMaintenanceScreen'
import { SystemOperatorDevicesScreen } from './SystemOperatorDevicesScreen'
import { systemOperatorHomePageMessages } from './SystemOperatorHomePage.messages'

export function SystemOperatorHomePage() {
  const [hash, setHash] = useState(() => window.location.hash)
  const { t } = useI18n(systemOperatorHomePageMessages)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (hash === '#portal/system-operator/maintenance') {
    return (
      <PortalLayout
        role="SYSTEM_OPERATOR"
        title={t.maintenanceTitle}
        subtitle={t.maintenanceSubtitle}
      >
        <OperatorMaintenanceScreen />
      </PortalLayout>
    )
  }

  if (hash === '#portal/system-operator/devices') {
    return (
      <PortalLayout
        role="SYSTEM_OPERATOR"
        title={t.devicesTitle}
        subtitle={t.devicesSubtitle}
      >
        <SystemOperatorDevicesScreen />
      </PortalLayout>
    )
  }

  return <RolePortalPage role="SYSTEM_OPERATOR" />
}
