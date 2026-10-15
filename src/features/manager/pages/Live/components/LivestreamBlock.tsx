import { Card, StatusBadge } from '../../../../../shared/components/ui'
import type { LiveTelemetry } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { livestreamBlockMessages } from './LivestreamBlock.messages'

export function LivestreamBlock({
  telemetry,
}: {
  telemetry: LiveTelemetry | null
}) {
  const { t } = useI18n(livestreamBlockMessages)
  const isLive = Boolean(telemetry?.livestream?.isLive)
  return (
    <Card
      title={t.livestream.title}
      actions={
        isLive ? <StatusBadge tone="danger">{t.live}</StatusBadge> : null
      }
    >
      <div className="odm-live-video">
        {isLive ? (
          <>
            {/* PROPOSED: video element placeholder — no real WebRTC [evd/00-PLAN.md §8] */}
            <video poster="" aria-label={t.livestream.videoPlaceholder} />
            <span>{t.livestream.noConnection}</span>
          </>
        ) : (
          <span>{t.livestream.noSession}</span>
        )}
      </div>
    </Card>
  )
}
