import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import type { OperatingPolicy } from '../../../types/operatingConfig'
import { policyTableMessages } from './PolicyTable.messages'

type Props = {
  policy: OperatingPolicy
  saving: boolean
  onSave: (policy: OperatingPolicy, value: string) => void
}

export function PolicyRow({ policy, saving, onSave }: Props) {
  const { t, locale } = useI18n(policyTableMessages)
  const [draft, setDraft] = useState<string | null>(null)
  const value = draft ?? policy.value
  const dirty = draft !== null && draft !== policy.value
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(locale) : ''

  return (
    <tr>
      <td className="adm-cell-mono adm-wrap">{policy.key}</td>
      <td>
        <input
          className="odm-inp adm-inline-input"
          aria-label={policy.key}
          value={value}
          onChange={(e) => setDraft(e.target.value)}
        />
      </td>
      <td className="adm-muted">{policy.unit}</td>
      <td className="adm-muted adm-wrap adm-col-desc">{policy.description}</td>
      <td>{fmt(policy.effectiveFrom)}</td>
      <td className="adm-muted">{fmt(policy.effectiveTo)}</td>
      <td className="adm-text-right">
        {dirty && (
          <button
            type="button"
            className="odm-btn odm-btn-p odm-btn-sm"
            disabled={saving}
            onClick={() => onSave(policy, value)}
          >
            {saving ? '...' : t.save}
          </button>
        )}
      </td>
    </tr>
  )
}
