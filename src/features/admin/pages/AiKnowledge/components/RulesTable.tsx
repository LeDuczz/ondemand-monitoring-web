import { useI18n } from '../../../../../shared/i18n'
import type {
  FeasibilityRule,
  UpdateRulePayload,
} from '../../../types/aiKnowledge'
import { RuleRow } from './RuleRow'
import { rulesTableMessages } from './RulesTable.messages'

type Props = {
  items: FeasibilityRule[]
  busyId: string | null
  onUpdate: (ruleId: string, payload: UpdateRulePayload) => void
}

export function RulesTable({ items, busyId, onUpdate }: Props) {
  const { t } = useI18n(rulesTableMessages)
  return (
    <table className="odm-adm-table">
      <thead>
        <tr>
          <th>{t.code}</th>
          <th>{t.ruleName}</th>
          <th>{t.type}</th>
          <th>{t.severity}</th>
          <th>{t.weight}</th>
          <th>{t.status}</th>
          <th className="adm-text-right">{t.actions}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            busy={busyId === rule.id}
            onUpdate={onUpdate}
          />
        ))}
      </tbody>
    </table>
  )
}
