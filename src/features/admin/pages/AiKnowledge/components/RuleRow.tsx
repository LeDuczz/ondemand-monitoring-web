import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { StatusBadge, type UiTone } from '../../../../../shared/components/ui'
import type {
  FeasibilityRule,
  RuleCategory,
  RuleSeverity,
  UpdateRulePayload,
} from '../../../types/aiKnowledge'
import { rulesTableMessages } from './RulesTable.messages'

const CATEGORY_TONE: Record<RuleCategory, UiTone> = {
  SCHEDULE: 'info',
  GEO: 'warning',
  CAPABILITY: 'warning',
  SAFETY: 'danger',
}

const SEVERITIES: RuleSeverity[] = ['BLOCKER', 'WARNING', 'INFO']

type Props = {
  rule: FeasibilityRule
  busy: boolean
  onUpdate: (ruleId: string, payload: UpdateRulePayload) => void
}

export function RuleRow({ rule, busy, onUpdate }: Props) {
  const { t } = useI18n(rulesTableMessages)
  const [draft, setDraft] = useState<UpdateRulePayload>({})
  const changed: UpdateRulePayload = {}
  if (draft.severity && draft.severity !== rule.severity)
    changed.severity = draft.severity
  if (draft.weight !== undefined && draft.weight !== rule.weight)
    changed.weight = draft.weight
  const dirty = Object.keys(changed).length > 0
  const severity = draft.severity ?? rule.severity
  const weight = draft.weight ?? rule.weight

  return (
    <tr>
      <td className="adm-cell-mono adm-wrap">{rule.code}</td>
      <td className="adm-strong adm-wrap">{rule.name}</td>
      <td>
        <StatusBadge tone={CATEGORY_TONE[rule.category]}>
          {t.categories[rule.category]}
        </StatusBadge>
      </td>
      <td>
        <select
          className="odm-inp adm-inline-select"
          aria-label={`${t.severity} ${rule.code}`}
          value={severity}
          onChange={(e) =>
            setDraft({ ...draft, severity: e.target.value as RuleSeverity })
          }
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {t.severities[s]}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="number"
          min={0}
          max={100}
          className="odm-inp adm-inline-input"
          aria-label={`${t.weight} ${rule.code}`}
          value={weight}
          onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })}
        />
      </td>
      <td>
        <StatusBadge tone={rule.isActive ? 'success' : 'neutral'}>
          {rule.isActive ? t.on : t.off}
        </StatusBadge>
      </td>
      <td>
        <div className="adm-row-actions">
          {dirty && (
            <button
              type="button"
              className="odm-btn odm-btn-p odm-btn-sm"
              disabled={busy}
              onClick={() => onUpdate(rule.id, changed)}
            >
              {busy ? '...' : t.save}
            </button>
          )}
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm"
            aria-label={`${rule.isActive ? t.off : t.on} ${rule.code}`}
            disabled={busy}
            onClick={() => onUpdate(rule.id, { isActive: !rule.isActive })}
          >
            {rule.isActive ? t.off : t.on}
          </button>
        </div>
      </td>
    </tr>
  )
}
