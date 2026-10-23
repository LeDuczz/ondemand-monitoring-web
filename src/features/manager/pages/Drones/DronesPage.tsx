// MNG-09: Drone fleet management page
import { useMemo, useState } from 'react'
import { StateView } from '../../../../shared/components/odm/StateView'
import { PageHeader, Skeleton } from '../../../../shared/components/ui'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { dronesApi } from '../../api/dronesApi'
import type { DeviceResponse } from '../../types/drones'
import { dronesPageMessages } from './DronesPage.messages'
import '../../manager.css'
import {
  type FilterChip,
  groupCounts,
  matchesFilter,
  matchesSearch,
} from './droneHelpers'
import { StatusChangeModal } from './components/StatusChangeModal'
import { DronesStats } from './components/DronesStats'
import { DronesToolbar } from './components/DronesToolbar'
import { DronesLoadError } from './components/DronesLoadError'
import { DronesTable } from './components/DronesTable'

type DronesPageProps = {
  droneId?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DronesPage({ droneId: _droneId }: DronesPageProps) {
  const { t } = useI18n(dronesPageMessages)
  const [filter, setFilter] = useState<FilterChip>('ALL')
  const [search, setSearch] = useState('')
  const [changingDrone, setChangingDrone] = useState<DeviceResponse | null>(null)
  const [drones, setDrones] = useState<DeviceResponse[] | null>(null)

  const query = useApiQuery((signal) => dronesApi.listDrones({ signal }), [])

  const allDrones = useMemo(
    () => drones ?? query.data?.items ?? [],
    [drones, query.data?.items],
  )
  const searched = useMemo(
    () => allDrones.filter((d) => matchesSearch(d, search)),
    [allDrones, search],
  )
  const visible = useMemo(
    () => searched.filter((d) => matchesFilter(d, filter)),
    [searched, filter],
  )
  const counts = useMemo(() => groupCounts(allDrones), [allDrones])
  const statusCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: searched.length }
    for (const d of searched) map[d.status] = (map[d.status] ?? 0) + 1
    return map
  }, [searched])

  function handleChanged(updated: DeviceResponse) {
    const base = drones ?? query.data?.items ?? []
    setDrones(base.map((d) => (d.id === updated.id ? updated : d)))
    setChangingDrone(null)
  }

  const ready = !query.loading && !query.error

  return (
    <div className="odm-or">
      <PageHeader
        title={t.title}
        subtitle={ready ? t.subtitle(allDrones.length) : undefined}
      />

      <DronesStats counts={counts} />

      <DronesToolbar
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        counts={statusCounts}
      />

      {query.loading && (
        <div aria-busy="true">
          <Skeleton variant="block" height={300} />
        </div>
      )}

      {!query.loading && !!query.error && <DronesLoadError query={query} />}

      {ready && visible.length === 0 && (
        <section className="odm-or-card">
          <StateView
            state="empty"
            title={t.emptyTitle}
            description={t.emptyDescription}
          />
        </section>
      )}

      {ready && visible.length > 0 && (
        <DronesTable
          visible={visible}
          total={allDrones.length}
          onChangeStatus={setChangingDrone}
        />
      )}

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
