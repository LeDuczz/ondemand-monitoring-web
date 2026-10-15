import { managerHref } from '../../../routes'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { useI18n } from '../../../../../shared/i18n'
import { missionBackLinkMessages } from './MissionBackLink.messages'

export function MissionBackLink() {
  const { t } = useI18n(missionBackLinkMessages)
  return (
    <a className="odm-or-back" href={managerHref({ screen: 'missions' })}>
      <OrderIcon name="arrow-right" size={14} />
      {t.back}
    </a>
  )
}
