import { useI18n } from '../../../../../shared/i18n'
import type {
  PostflightItemKey,
  PreflightItemResult,
} from '../../../types/mission'
import { inspectionItemRowMessages } from './InspectionItemRow.messages'

export function InspectionItemRow({
  itemKey,
  label,
  detail,
  status,
  onSetResult,
}: {
  itemKey: PostflightItemKey
  label: string
  detail: string
  status: PreflightItemResult | null
  onSetResult: (key: PostflightItemKey, result: PreflightItemResult) => void
}) {
  const { t } = useI18n(inspectionItemRowMessages)
  const isOk = status === 'ok'
  const isFail = status === 'fail'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: 10,
        background: isFail
          ? 'rgba(239, 68, 68, 0.08)'
          : isOk
            ? 'rgba(16, 185, 129, 0.05)'
            : 'var(--sf3, #f8fafc)',
        border: `1.5px solid ${
          isFail ? '#fca5a5' : isOk ? '#a7f3d0' : 'var(--bd, #e2e8f0)'
        }`,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14.5,
            color: 'var(--tx, #0f172a)',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--tx3, #64748b)',
            marginTop: 2,
          }}
        >
          {detail}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
        <button
          type="button"
          onClick={() => onSetResult(itemKey, 'ok')}
          style={{
            padding: '7px 18px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            border: '1.5px solid',
            borderColor: isOk ? '#10b981' : '#cbd5e1',
            background: isOk ? '#10b981' : '#fff',
            color: isOk ? '#fff' : '#475569',
            cursor: 'pointer',
            boxShadow: isOk ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          {t.pass}
        </button>
        <button
          type="button"
          onClick={() => onSetResult(itemKey, 'fail')}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            border: '1.5px solid',
            borderColor: isFail ? '#ef4444' : '#cbd5e1',
            background: isFail ? '#ef4444' : '#fff',
            color: isFail ? '#fff' : '#475569',
            cursor: 'pointer',
            boxShadow: isFail ? '0 2px 6px rgba(239, 68, 68, 0.3)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          {t.fail}
        </button>
      </div>
    </div>
  )
}
