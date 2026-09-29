import {
  ErrorState,
  LoadingState,
} from '../../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { EmptyState } from '../../../components/common/EmptyState'
import { TableCard } from '../../../components/common/TableCard'
import { AnalysisLogTable } from './AnalysisLogTable'
import { analysisLogTabMessages } from './AnalysisLogTab.messages'

export function AnalysisLogTab() {
  const { t } = useI18n(analysisLogTabMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listAnalysisLogs(signal),
    [],
  )

  if (loading && !data) return <LoadingState />
  if (!data) return <ErrorState error={error} onRetry={reload} />
  if (data.items.length === 0)
    return <EmptyState title={t.emptyTitle} description={t.emptyDescription} />

  return (
    <TableCard>
      <AnalysisLogTable items={data.items} />
    </TableCard>
  )
}
