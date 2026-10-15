import { formatOrderCode } from '../../../components/common/format'
import type { OrderMissionBrief } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { missionCreateHeaderMessages } from './MissionCreateHeader.messages'

export function MissionCreateHeader({
  onCreated,
  brief,
}: {
  onCreated: ((missionId: string) => void) | undefined
  brief: OrderMissionBrief
}) {
  const { t } = useI18n(missionCreateHeaderMessages)
  return (
    <>
      {!onCreated && (
        <div className="odm-or-pagehead">
          <h1 className="odm-or-title">{t.title}</h1>
          <p className="odm-or-subtitle">
            {t.fromOrder(
              formatOrderCode(brief.code),
              brief.serviceName,
              brief.customerFullName,
            )}
          </p>
        </div>
      )}
    </>
  )
}
