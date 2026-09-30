import { useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { catalogApi } from '../../../api/catalogApi'
import { EmptyState } from '../../../../../shared/components/ui'
import { TableCard } from '../../../../../shared/components/ui'
import { mapService } from '../../../lib/catalogMappers'
import type { AdminService } from '../../../types/catalog'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { ServiceModal } from './ServiceModal'
import { ServicesTable } from './ServicesTable'
import { servicesTabMessages } from './ServicesTab.messages'
import { Toolbar } from './Toolbar'

type Dialog =
  | { type: 'form'; service?: AdminService }
  | { type: 'delete'; service: AdminService }
  | null

export function ServicesTab() {
  const { t } = useI18n(servicesTabMessages)
  const [dialog, setDialog] = useState<Dialog>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => catalogApi.listServices(signal).then((r) => r.map(mapService)),
    [],
  )

  function done() {
    setDialog(null)
    reload()
  }

  return (
    <div>
      <Toolbar createLabel={t.add} onCreate={() => setDialog({ type: 'form' })} />
      {loading && !data && <LoadingState />}
      {!loading && (error !== undefined || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {data && data.length === 0 && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {data && data.length > 0 && (
        <TableCard>
          <ServicesTable
            items={data}
            onEdit={(service) => setDialog({ type: 'form', service })}
            onDelete={(service) => setDialog({ type: 'delete', service })}
          />
        </TableCard>
      )}
      {dialog?.type === 'form' && (
        <ServiceModal
          service={dialog.service}
          onClose={() => setDialog(null)}
          onSaved={done}
        />
      )}
      {dialog?.type === 'delete' && (
        <DeleteConfirmModal
          title={t.deleteTitle}
          name={dialog.service.name}
          onConfirm={() => catalogApi.deleteService(dialog.service.id)}
          onClose={() => setDialog(null)}
          onDeleted={done}
        />
      )}
    </div>
  )
}
