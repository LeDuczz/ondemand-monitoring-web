import { useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { catalogApi } from '../../../api/catalogApi'
import { EmptyState } from '../../../components/common/EmptyState'
import { TableCard } from '../../../components/common/TableCard'
import { mapTimeslot } from '../../../lib/catalogMappers'
import type { AdminTimeslot } from '../../../types/catalog'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { TimeslotModal } from './TimeslotModal'
import { TimeslotsTable } from './TimeslotsTable'
import { timeslotsTabMessages } from './TimeslotsTab.messages'
import { Toolbar } from './Toolbar'

type Dialog =
  | { type: 'form'; timeslot?: AdminTimeslot }
  | { type: 'delete'; timeslot: AdminTimeslot }
  | null

export function TimeslotsTab() {
  const { t } = useI18n(timeslotsTabMessages)
  const [dialog, setDialog] = useState<Dialog>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) =>
      catalogApi.listPreferredTimes(signal).then((r) => r.map(mapTimeslot)),
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
          <TimeslotsTable
            items={data}
            onEdit={(timeslot) => setDialog({ type: 'form', timeslot })}
            onDelete={(timeslot) => setDialog({ type: 'delete', timeslot })}
          />
        </TableCard>
      )}
      {dialog?.type === 'form' && (
        <TimeslotModal
          timeslot={dialog.timeslot}
          onClose={() => setDialog(null)}
          onSaved={done}
        />
      )}
      {dialog?.type === 'delete' && (
        <DeleteConfirmModal
          title={t.deleteTitle}
          name={dialog.timeslot.name}
          onConfirm={() => catalogApi.deletePreferredTime(dialog.timeslot.id)}
          onClose={() => setDialog(null)}
          onDeleted={done}
        />
      )}
    </div>
  )
}
