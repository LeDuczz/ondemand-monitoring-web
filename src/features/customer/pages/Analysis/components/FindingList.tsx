import { Card, EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { FindingView } from '../../../lib/analysis/types'
import type { FindingAction } from '../hooks/useAnalysis'
import { FindingCard } from './FindingCard'
import { findingListMessages } from './FindingList.messages'

type Props = {
  findings: FindingView[]
  busyId: string | null
  actionError: string | null
  onDecide: (findingId: string, action: FindingAction) => void
}

export function FindingList({ findings, busyId, actionError, onDecide }: Props) {
  const { t } = useI18n(findingListMessages)
  if (findings.length === 0) {
    return <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
  }
  return (
    <Card title={t.title}>
      {actionError && (
        <p role="alert" className="an-error">
          {t.actionFailed}
        </p>
      )}
      <ul className="an-findings">
        {findings.map((finding) => (
          <FindingCard
            key={finding.id}
            finding={finding}
            busy={busyId === finding.id}
            onDecide={onDecide}
          />
        ))}
      </ul>
    </Card>
  )
}
