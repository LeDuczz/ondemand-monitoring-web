import { useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { EmptyState } from '../../../../../shared/components/ui'
import { TableCard } from '../../../../../shared/components/ui'
import type { OperatingPolicy } from '../../../types/operatingConfig'
import { PolicyRow } from './PolicyRow'
import { policyTableMessages } from './PolicyTable.messages'

export function PolicyTable() {
  const { t } = useI18n(policyTableMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listPolicies(signal),
    [],
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave(policy: OperatingPolicy, value: string) {
    setSaving(policy.id)
    setSaveError(null)
    try {
      await adminApi.updatePolicy(policy.id, { value })
      reload()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setSaving(null)
    }
  }

  if (loading && !data) return <LoadingState />
  if (!data) return <ErrorState error={error} onRetry={reload} />
  if (data.items.length === 0)
    return (
      <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
    )

  return (
    <>
      {saveError && (
        <div role="alert" className="adm-alert is-danger">
          {saveError}
        </div>
      )}
      <TableCard>
        <table className="odm-adm-table">
          <thead>
            <tr>
              <th className="adm-cell-mono">key</th>
              <th className="adm-cell-mono">value</th>
              <th className="adm-cell-mono">unit</th>
              <th className="adm-cell-mono">description</th>
              <th className="adm-cell-mono">effective_from</th>
              <th className="adm-cell-mono">effective_to</th>
              <th className="adm-text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((policy) => (
              <PolicyRow
                key={policy.id}
                policy={policy}
                saving={saving === policy.id}
                onSave={handleSave}
              />
            ))}
          </tbody>
        </table>
      </TableCard>
    </>
  )
}
