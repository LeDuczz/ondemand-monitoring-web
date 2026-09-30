import { useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { EmptyState } from '../../../../../shared/components/ui'
import { MockDataBadge } from '../../../../../shared/components/ui'
import { TableCard } from '../../../../../shared/components/ui'
import type { AdminStation } from '../../../types/catalog'
import { StationModal } from './StationModal'
import { StationsTable } from './StationsTable'
import { stationsTabMessages } from './StationsTab.messages'
import { Toolbar } from './Toolbar'

export function StationsTab() {
  const { t } = useI18n(stationsTabMessages)
  const [dialog, setDialog] = useState<{ station?: AdminStation } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listStations(signal),
    [],
  )

  async function handleToggle(station: AdminStation) {
    setTogglingId(station.id)
    try {
      await adminApi.toggleStationActive(station.id, !station.isActive)
      reload()
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <Toolbar
        badge={<MockDataBadge />}
        createLabel={t.add}
        onCreate={() => setDialog({})}
      />
      {loading && !data && <LoadingState />}
      {!loading && (error !== undefined || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {data && data.items.length === 0 && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {data && data.items.length > 0 && (
        <TableCard>
          <StationsTable
            items={data.items}
            togglingId={togglingId}
            onEdit={(station) => setDialog({ station })}
            onToggle={handleToggle}
          />
        </TableCard>
      )}
      {dialog && (
        <StationModal
          station={dialog.station}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            reload()
          }}
        />
      )}
    </div>
  )
}
