import { useI18n } from '../../../../../shared/i18n'
import { customerHref } from '../../../routes'
import { newMediaNoticeMessages } from './NewMediaNotice.messages'

export function NewMediaNotice({ count }: { count: number }) {
  const { t } = useI18n(newMediaNoticeMessages)
  if (count <= 0) return null
  return (
    <div className="ml-notice" role="status">
      <span>{t.text(count)}</span>
      <a href={customerHref({ screen: 'notifications' })}>{t.view}</a>
    </div>
  )
}
