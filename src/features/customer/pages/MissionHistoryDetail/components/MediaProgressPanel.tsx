import { StatCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionMediaProgress } from '../../../lib/missionHistory/types'
import { mediaProgressPanelMessages } from './MediaProgressPanel.messages'

/** Result availability from `GET /api/customer/missions/{id}/media-status`. */
export function MediaProgressPanel({ progress }: { progress: MissionMediaProgress }) {
  const { t } = useI18n(mediaProgressPanelMessages)
  return (
    <div className="mhd-progress">
      <div className="mhd-stats">
        <StatCard label={t.available} value={progress.available} tone="success" />
        <StatCard
          label={t.processing}
          value={progress.processing}
          tone={progress.processing > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label={t.rejected}
          value={progress.rejected}
          tone={progress.rejected > 0 ? 'danger' : 'default'}
        />
      </div>
      {progress.phase === 'processing' && (
        <p className="mhd-note" role="status">
          {t.processingNote(progress.processing)}
        </p>
      )}
      {progress.rejected > 0 && <p className="mhd-note">{t.rejectedNote(progress.rejected)}</p>}
    </div>
  )
}
