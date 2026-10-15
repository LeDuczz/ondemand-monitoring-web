import { Card } from '../../../../../shared/components/ui'
import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { reviewLoadErrorMessages } from './ReviewLoadError.messages'

export function ReviewLoadError({ is409 }: { is409: boolean }) {
  const { t } = useI18n(reviewLoadErrorMessages)
  return (
    <Card>
      <div className="odm-or-load-error" role="alert">
        <strong>{t.loadError}</strong>
        <p>{is409 ? t.error409 : t.errorGeneric}</p>
        <a
          className="odm-btn odm-btn-p"
          href={managerHref({ screen: 'orderQueue' })}
        >
          {t.backToQueue}
        </a>
      </div>
    </Card>
  )
}
