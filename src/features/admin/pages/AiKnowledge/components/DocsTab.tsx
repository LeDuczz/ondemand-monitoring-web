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
import { DocsTable } from './DocsTable'
import { docsTabMessages } from './DocsTab.messages'

export function DocsTab() {
  const { t } = useI18n(docsTabMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listDocs(signal),
    [],
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleReindex(docId: string) {
    setBusyId(docId)
    setActionError(null)
    try {
      await adminApi.reindexDoc(docId)
      reload()
    } catch {
      setActionError(t.reindexError)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="adm-upload-hint">{t.uploadHint}</div>
      {actionError && (
        <div role="alert" className="adm-alert is-danger">
          {actionError}
        </div>
      )}
      {loading && !data && <LoadingState />}
      {!loading && !data && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {data && data.items.length > 0 && (
        <TableCard>
          <DocsTable
            items={data.items}
            busyId={busyId}
            onReindex={handleReindex}
          />
        </TableCard>
      )}
    </div>
  )
}
