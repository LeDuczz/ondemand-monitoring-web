import { ReviewHeader } from './ReviewHeader'
import { useI18n } from '../../../../../shared/i18n'
import { reviewSkeletonMessages } from './ReviewSkeleton.messages'

export function ReviewSkeleton({ orderId }: { orderId: string }) {
  const { t } = useI18n(reviewSkeletonMessages)

  return (
    <div className="odm-or" aria-busy="true" aria-live="polite">
      <ReviewHeader orderId={orderId} />
      <div className="odm-or-layout">
        <div className="odm-or-main">
          <span className="odm-sk odm-or-sk-main" />
          <span className="odm-sk odm-or-sk-sub" />
        </div>
        <div className="odm-or-side">
          <span className="odm-sk odm-or-sk-side" />
          <span className="odm-sk odm-or-sk-side" />
        </div>
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
