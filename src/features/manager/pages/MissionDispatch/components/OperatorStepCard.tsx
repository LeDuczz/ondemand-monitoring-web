import { OperatorCard } from './OperatorCard'
import type { ResourceSuggestions } from '../../../types/missions'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { operatorStepCardMessages } from './OperatorStepCard.messages'

export function OperatorStepCard({
  suggestions,
  selectedOperator,
  setSelectedOperator,
}: {
  suggestions: ResourceSuggestions
  selectedOperator: string | null
  setSelectedOperator: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(operatorStepCardMessages)
  return (
    <div className="odm-card" style={{ marginBottom: 14 }}>
      <div className="odm-card-header">
        {t.step2Choose}
        <span
          style={{
            fontWeight: 500,
            color: 'var(--tx3)',
            fontSize: 11.5,
          }}
        >
          {t.topOf(
            suggestions.topOperators.length,
            suggestions.eligibleOperatorCount,
          )}
        </span>
      </div>
      {suggestions.topOperators.map((o, i) => (
        <OperatorCard
          key={o.code}
          rank={i + 1}
          operator={o}
          selected={selectedOperator === o.code}
          onSelect={() => setSelectedOperator(o.code)}
        />
      ))}
    </div>
  )
}
