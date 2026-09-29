import { useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { EmptyState } from '../../../components/common/EmptyState'
import { TableCard } from '../../../components/common/TableCard'
import type { NoFlyZone } from '../../../types/operatingConfig'
import { NoFlyZonesTable } from './NoFlyZonesTable'
import { noFlyZonesTabMessages } from './NoFlyZonesTab.messages'
import { ZoneModal } from './ZoneModal'

export function NoFlyZonesTab() {
  const { t } = useI18n(noFlyZonesTabMessages)
  const [dialog, setDialog] = useState<{ zone?: NoFlyZone } | null>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listNoFlyZones(signal),
    [],
  )

  async function handleToggle(zone: NoFlyZone) {
    await adminApi.updateNoFlyZone(zone.id, { isActive: !zone.isActive })
    reload()
  }

  return (
    <div>
      <div className="adm-toolbar">
        <span />
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={() => setDialog({})}
        >
          {t.addZone}
        </button>
      </div>
      {loading && !data && <LoadingState />}
      {!loading && !data && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {data && data.items.length > 0 && (
        <TableCard>
          <NoFlyZonesTable
            items={data.items}
            onEdit={(zone) => setDialog({ zone })}
            onToggle={handleToggle}
          />
        </TableCard>
      )}
      {dialog && (
        <ZoneModal
          zone={dialog.zone}
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
