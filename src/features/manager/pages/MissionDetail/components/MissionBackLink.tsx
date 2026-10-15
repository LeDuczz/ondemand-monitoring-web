import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { missionBackLinkMessages } from './MissionBackLink.messages'

export function MissionBackLink() {
  const { t } = useI18n(missionBackLinkMessages)
  return <a href={managerHref({ screen: 'missions' })}>{t.back}</a>
}
