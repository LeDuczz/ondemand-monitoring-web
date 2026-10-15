import { useI18n } from '../../../../shared/i18n'
import { dronesPageMessages } from './DronesPage.messages'
// MNG-09: Drone fleet management page
import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { dronesApi } from '../../api/dronesApi'
import type { DroneResponse } from '../../types/drones'
import '../../manager.css'
import { matchesFilter, type FilterChip } from './droneHelpers'
import { StatusChangeModal } from './components/StatusChangeModal'
import { DronesHeader } from './components/DronesHeader'
import { DroneFilterChips } from './components/DroneFilterChips'
import { DronesLoadError } from './components/DronesLoadError'
import { DronesEmptyState } from './components/DronesEmptyState'
import { DronesTable } from './components/DronesTable'

type DronesPageProps = {
  droneId?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DronesPage({ droneId: _droneId }: DronesPageProps) {
  const { t } = useI18n(dronesPageMessages)
  const [filter, setFilter] = useState<FilterChip>('ALL')
  const [changingDrone, setChangingDrone] = useState<DroneResponse | null>(null)
  const [drones, setDrones] = useState<DroneResponse[] | null>(null)

  const query = useApiQuery((signal) => dronesApi.listDrones({ signal }), [])

  const allDrones = drones ?? query.data?.items ?? []
  const visible = allDrones.filter((d) => matchesFilter(d, filter))

  const counts = {
    available: allDrones.filter((d) => d.status === 'AVAILABLE').length,
    flying: allDrones.filter(
      (d) =>
        d.status === 'IN_MISSION' ||
        d.status === 'RESERVED' ||
        d.status === 'RETURNING',
    ).length,
    maintenance: allDrones.filter((d) => d.status === 'MAINTENANCE').length,
    outOfService: allDrones.filter((d) => d.status === 'OUT_OF_SERVICE').length,
  }

  function handleChanged(updated: DroneResponse) {
    const base = drones ?? query.data?.items ?? []
    setDrones(base.map((d) => (d.id === updated.id ? updated : d)))
    setChangingDrone(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <DronesHeader title={t.title} query={query} counts={counts} />

      {/* Filter chips */}
      <DroneFilterChips filter={filter} setFilter={setFilter} />

      {/* Content */}
      {query.loading && (
        <div style={{ padding: 40, textAlign: 'center' }} aria-busy="true">
          <div className="odm-sk" style={{ height: 300, borderRadius: 8 }} />
        </div>
      )}

      <DronesLoadError query={query} />

      <DronesEmptyState query={query} visible={visible} />

      <DronesTable
        query={query}
        visible={visible}
        setChangingDrone={setChangingDrone}
      />

      {/* Status change modal */}
      {changingDrone && (
        <StatusChangeModal
          drone={changingDrone}
          onClose={() => setChangingDrone(null)}
          onChanged={handleChanged}
        />
      )}
    </div>
  )
}
