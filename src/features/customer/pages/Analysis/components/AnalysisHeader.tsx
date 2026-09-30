import { PageHeader, StatusBadge, type UiTone } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { AiVerdict } from '../../../../../shared/types/domain'
import { fmtDateTime } from '../../../lib/orderStatus'
import type { AnalysisView } from '../../../lib/analysis/types'
import { customerHref } from '../../../routes'
import { analysisHeaderMessages } from './AnalysisHeader.messages'

const VERDICT_TONE: Record<AiVerdict, UiTone> = {
  FEASIBLE: 'success',
  RISKY: 'warning',
  INFEASIBLE: 'danger',
}

type Props = { orderId: string; analysis: AnalysisView | null }

export function AnalysisHeader({ orderId, analysis }: Props) {
  const { t, locale } = useI18n(analysisHeaderMessages)
  return (
    <PageHeader
      back={
        <a href={customerHref({ screen: 'orderDetail', orderId })}>{t.backToOrder}</a>
      }
      title={t.title}
      subtitle={
        analysis?.analyzedAt ? t.analyzedAt(fmtDateTime(analysis.analyzedAt, locale)) : t.subtitle
      }
      actions={
        analysis ? (
          <StatusBadge tone={VERDICT_TONE[analysis.verdict]}>
            {t.verdict[analysis.verdict]}
          </StatusBadge>
        ) : null
      }
    />
  )
}
