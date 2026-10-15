import { useI18n } from '../../../../../shared/i18n'
import { assessmentProgressMessages } from './AssessmentProgress.messages'

export function AssessmentProgress({
  failCount,
  assessedCount,
  totalCount,
  allAssessed,
  onPassAll,
}: {
  failCount: number
  assessedCount: number
  totalCount: number
  allAssessed: boolean
  onPassAll: () => void
}) {
  const { t } = useI18n(assessmentProgressMessages)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderRadius: 14,
        background:
          failCount > 0 ? 'rgba(239, 68, 68, 0.06)' : 'var(--sf, #f8fafc)',
        border: `1.5px solid ${failCount > 0 ? '#fca5a5' : 'var(--bd, #e2e8f0)'}`,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
            color: 'var(--tx3)',
            fontWeight: 700,
          }}
        >
          {t.assessmentProgress}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            marginTop: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>{t.itemsAssessed(assessedCount, totalCount)}</span>
          {allAssessed && (
            <span
              style={{
                fontSize: 12,
                padding: '2px 10px',
                borderRadius: 12,
                background: failCount > 0 ? '#ef4444' : '#10b981',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {failCount > 0 ? t.someFailed(failCount) : t.allPassed}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="odm-btn"
        onClick={onPassAll}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          fontWeight: 700,
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
          cursor: 'pointer',
        }}
      >
        {t.passAll}
      </button>
    </div>
  )
}
