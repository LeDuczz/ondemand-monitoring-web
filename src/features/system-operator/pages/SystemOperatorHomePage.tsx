import { useEffect, useState } from 'react'

import { RolePortalPage } from '../../portal/pages/RolePortalPage'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { OperatorMaintenanceScreen } from '../../drone-operator/pages/OperatorMaintenanceScreen'
import { SystemOperatorDevicesScreen } from './SystemOperatorDevicesScreen'

export function SystemOperatorHomePage() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (hash === '#portal/system-operator/maintenance') {
    return (
      <PortalLayout
        role="SYSTEM_OPERATOR"
        title="Quản lý Bảo trì & Sự cố Fleet"
        subtitle="Theo dõi Ticket sự cố được phân công, cập nhật báo cáo kỹ thuật và khôi phục Drone về trạng thái AVAILABLE."
      >
        <OperatorMaintenanceScreen />
      </PortalLayout>
    )
  }

  if (hash === '#portal/system-operator/devices') {
    return (
      <PortalLayout
        role="SYSTEM_OPERATOR"
        title="Quản lý Trạng thái Thiết bị"
        subtitle="Theo dõi dung lượng pin, kết quả kiểm tra kỹ thuật và trạng thái khả dụng của các Drone trong hệ thống."
      >
        <SystemOperatorDevicesScreen />
      </PortalLayout>
    )
  }

  return <RolePortalPage role="SYSTEM_OPERATOR" />
}
