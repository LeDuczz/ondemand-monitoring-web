import { useI18n } from '../../../../shared/i18n'
import { dronesPageMessages } from './DronesPage.messages'
// MNG-09: Drone fleet management page
import { useMemo, useState } from 'react'
import { PageHeader } from '../../../../shared/components/ui'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { dronesApi } from '../../api/dronesApi'
import type { DroneResponse } from '../../types/drones'
import '../../manager.css'
import { matchesFilter, type FilterChip } from './droneHelpers'
import { StatusChangeModal } from './components/StatusChangeModal'
import { DronesStats } from './components/DronesStats'
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
  const [search, setSearch] = useState('')
  const [changingDrone, setChangingDrone] = useState<DroneResponse | null>(null)
  const [drones, setDrones] = useState<DroneResponse[] | null>(null)

  const query = useApiQuery((signal) => dronesApi.listDrones({ signal }), [])

  const allDrones = useMemo(
    () => drones ?? query.data?.items ?? [],
    [drones, query.data?.items],
  )
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return allDrones.filter((d) => {
      if (!matchesFilter(d, filter)) return false
      if (!needle) return true
      return [
        d.serialNumber,
        d.droneModel?.modelCode,
        d.droneModel?.manufacturer,
        d.dronePayload?.modelName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [allDrones, filter, search])

  function handleChanged(updated: DroneResponse) {
    const base = drones ?? query.data?.items ?? []
    setDrones(base.map((d) => (d.id === updated.id ? updated : d)))
    setChangingDrone(null)
  }

  const ready = !query.loading && !query.error

  return (
    <div className="odm-or">
      <PageHeader
        title={t.title}
        subtitle={ready ? t.droneCount(allDrones.length) : undefined}
      />

      {ready && allDrones.length > 0 && <DronesStats drones={allDrones} />}

      <DroneFilterChips
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
      />

      {query.loading && (
        <div aria-busy="true">
          <span className="odm-sk mng-dash-sk" />
        </div>
      )}

      <DronesLoadError query={query} />

      <DronesEmptyState query={query} visible={visible} />

      <DronesTable
        query={query}
        visible={visible}
        setChangingDrone={setChangingDrone}
      />

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
