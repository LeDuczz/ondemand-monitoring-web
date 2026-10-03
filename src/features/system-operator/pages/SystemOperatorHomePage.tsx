import { useEffect, useState } from 'react'

import { useLanguage } from '../../../shared/i18n'
import { SystemOperatorLayout } from '../SystemOperatorLayout'
import { SystemOperatorOverview } from '../SystemOperatorOverview'
import { OperatorMaintenanceScreen } from '../../drone-operator/pages/OperatorMaintenanceScreen'
import { SystemOperatorDevicesScreen } from './SystemOperatorDevicesScreen'

export function SystemOperatorHomePage() {
  const [hash, setHash] = useState(() => window.location.hash)
  const { lang } = useLanguage()
  const overview =
    lang === 'vi'
      ? {
          title: 'Kỹ thuật & bảo trì',
          subtitle:
            'Theo dõi thiết bị và xử lý công việc bảo trì theo profile nhân viên.',
        }
      : {
          title: 'Technical & maintenance',
          subtitle:
            'Monitor devices and handle maintenance according to staff profiles.',
        }

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (hash === '#portal/staff/technical/maintenance') {
    return (
      <SystemOperatorLayout>
        <OperatorMaintenanceScreen />
      </SystemOperatorLayout>
    )
  }

  if (hash === '#portal/staff/technical/devices') {
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
