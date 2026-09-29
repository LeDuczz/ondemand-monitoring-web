import { useI18n } from '../../../../../shared/i18n'
import { aiAnalysisOptionMessages } from './AiAnalysisOption.messages'

type Props = { checked: boolean; onChange: (checked: boolean) => void }

export function AiAnalysisOption({ checked, onChange }: Props) {
  const { t } = useI18n(aiAnalysisOptionMessages)
  return (
    <div className="co-block">
      <div className="co-block-title">{t.title}</div>
      <label className="co-check">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>
          {t.label}
          <small>{t.hint}</small>
        </span>
      </label>
    </div>
  )
}
