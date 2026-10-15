import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { reviewLoadErrorMessages } from './ReviewLoadError.messages'

export function ReviewLoadError({ is409 }: { is409: boolean }) {
  const { t } = useI18n(reviewLoadErrorMessages)
  return (
    <div className="odm-card">
      <div className="odm-mgr-review-error">
        <div className="odm-mgr-review-error-icon" aria-hidden="true">
          !
        </div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{t.loadError}</div>
        <div style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}>
          {is409 ? t.error409 : t.errorGeneric}
        </div>
        <a
          className="odm-btn odm-btn-p"
          href={managerHref({ screen: 'orderQueue' })}
        >
          {t.backToQueue}
        </a>
      </div>
    </div>
  )
}
