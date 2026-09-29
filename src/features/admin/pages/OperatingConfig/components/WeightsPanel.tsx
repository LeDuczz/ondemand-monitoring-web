import {
  ErrorState,
  LoadingState,
} from '../../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { EmptyState } from '../../../components/common/EmptyState'
import { WeightGroup } from './WeightGroup'
import { weightsPanelMessages } from './WeightsPanel.messages'

export function WeightsPanel() {
  const { t } = useI18n(weightsPanelMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listWeights(signal),
    [],
  )

  if (loading && !data) return <LoadingState />
  if (!data) return <ErrorState error={error} onRetry={reload} />
  if (data.items.length === 0)
    return <EmptyState title={t.emptyTitle} description={t.emptyDescription} />

  async function saveGroup(
    group: 'DRONE' | 'OPERATOR',
    weights: Array<{ key: string; value: number }>,
  ) {
    await adminApi.updateWeights({ group, weights })
    reload()
  }

  return (
    <div className="adm-stack is-tight">
      <WeightGroup
        group="DRONE"
        label={t.droneSuggestion}
        items={data.items.filter((w) => w.group === 'DRONE')}
        onSave={(w) => saveGroup('DRONE', w)}
      />
      <WeightGroup
        group="OPERATOR"
        label={t.pilotSuggestion}
        items={data.items.filter((w) => w.group === 'OPERATOR')}
        onSave={(w) => saveGroup('OPERATOR', w)}
      />
    </div>
  )
}
