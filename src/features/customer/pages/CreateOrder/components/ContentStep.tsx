import type { ReactNode } from 'react'

import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { ServiceOption, ServicePricingEstimate } from '../../../api/customerApi'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { contentStepMessages } from './ContentStep.messages'
import { Metric } from './Metric'
import { PricingEstimateCard } from './PricingEstimateCard'

type Props = {
  selected?: ServiceOption
  /** Monitoring-content editor. */
  checklist: ReactNode
  selectedCount: number
  /** False while the list is loading or has invalid items; shows a short reason. */
  valid: boolean
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
  aiAnalysisRequested: boolean
  /** Wizard actions, rendered at the bottom of the sticky summary panel. */
  footer?: ReactNode
}

/** Step 2: review and edit the monitoring content; the sidebar keeps the context visible. */
export function ContentStep(p: Props) {
  const { t, lang } = useI18n(contentStepMessages)
  return (
    <>
      <div className="co-grid is-service">
        <div className="co-stack">{p.checklist}</div>
        <aside className="co-stack co-summary">
          <Card title={t.summaryTitle}>
            <div className="co-two">
              <Metric
                label={t.service}
                value={
                  p.selected
                    ? localizeServiceName(p.selected.id, lang, p.selected.name)
                    : t.notSelected
                }
              />
              <Metric label={t.selectedCount} value={t.count(p.selectedCount)} />
            </div>
            <p className="co-hint co-mt">{p.valid ? t.hint : t.invalid}</p>
          </Card>
          <PricingEstimateCard
            estimate={p.pricingEstimate}
            loading={p.pricingLoading}
            hasService={Boolean(p.selected)}
            aiAnalysisRequested={p.aiAnalysisRequested}
          />
        </aside>
      </div>
      {p.footer && <div className="co-bottom-bar">{p.footer}</div>}
    </>
  )
}
