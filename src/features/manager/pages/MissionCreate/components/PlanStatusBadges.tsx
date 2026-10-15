import { StatusBadge } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { planningPresentationMessages } from '../../../components/common/planningPresentation.messages'

/** Execution-plan status badge plus revision, shared by header and card. */
export function PlanStatusBadges({
  status,
  revision,
  loading,
}: {
  status?: 'DRAFT' | 'FINALIZED'
  revision: number
  loading: boolean
}) {
  const { t } = useI18n(planningPresentationMessages)
  if (loading) return <span role="status">{t.loading}</span>
  return (
    <span className="odm-plan-badges" aria-live="polite">
      <StatusBadge
        tone={
          status === 'FINALIZED'
            ? 'success'
            : status === 'DRAFT'
              ? 'warning'
              : 'neutral'
        }
      >
        {status === 'FINALIZED'
          ? t.finalizedBadge
          : status === 'DRAFT'
            ? t.draftBadge
            : t.unverified}
      </StatusBadge>
      {status ? (
        <span className="odm-plan-version">{t.version(revision)}</span>
      ) : null}
    </span>
  )
}
