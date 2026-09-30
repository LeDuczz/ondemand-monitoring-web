import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { MediaGrid } from '../../../components/common/media'
import type { CustomerMissionHistory } from '../../../api/customerMissionHistoryApi'
import type { MediaItem } from '../../../lib/media/types'
import { customerHref } from '../../../routes'
import { missionMediaSectionMessages } from './MissionMediaSection.messages'

type Props = {
  mission: CustomerMissionHistory
  items: MediaItem[]
  onOpen: (item: MediaItem) => void
}

export function MissionMediaSection({ mission, items, onOpen }: Props) {
  const { t } = useI18n(missionMediaSectionMessages)
  return (
    <Card
      title={mission.missionCode}
      actions={
        <a href={customerHref({ screen: 'missionHistoryDetail', missionId: mission.id })}>
          {t.missionDetail}
        </a>
      }
    >
      {items.length === 0 ? (
        <p className="om-empty">{t.noFiles}</p>
      ) : (
        <MediaGrid items={items} onOpen={onOpen} />
      )}
    </Card>
  )
}
