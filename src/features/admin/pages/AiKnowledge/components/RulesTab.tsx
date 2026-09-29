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
import type { UpdateRulePayload } from '../../../types/aiKnowledge'
import { RulesTable } from './RulesTable'
import { rulesTabMessages } from './RulesTab.messages'

export function RulesTab() {
  const { t } = useI18n(rulesTabMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listRules(signal),
    [],
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleUpdate(ruleId: string, payload: UpdateRulePayload) {
    setBusyId(ruleId)
    setActionError(null)
    try {
      await adminApi.updateRule(ruleId, payload)
      reload()
    } catch {
      setActionError(t.saveError)
    } finally {
      setBusyId(null)
    }
  }

  if (loading && !data) return <LoadingState />
  if (!data) return <ErrorState error={error} onRetry={reload} />
  if (data.items.length === 0)
    return <EmptyState title={t.emptyTitle} description={t.emptyDescription} />

  return (
    <>
      {actionError && (
        <div role="alert" className="adm-alert is-danger">
          {actionError}
        </div>
      )}
      <TableCard>
        <RulesTable items={data.items} busyId={busyId} onUpdate={handleUpdate} />
      </TableCard>
    </>
  )
}
