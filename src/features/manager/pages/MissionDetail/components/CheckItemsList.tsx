import { StatusBadge } from '../../../../../shared/components/ui'
import {
  checkLabel,
  checkTone,
} from '../../../components/common/missionDetailHelpers'
import type {
  PreflightCheckItem,
  PostDeviceCheckItem,
} from '../../../types/missions'
import {
  viCheckName,
  viCheckMessage,
} from '../../../../../shared/lib/checkText'
import { useI18n } from '../../../../../shared/i18n'
import { checkItemsListMessages } from './CheckItemsList.messages'

export function CheckItemsList({
  items,
}: {
  items: Array<PreflightCheckItem | PostDeviceCheckItem>
}) {
  const { t, lang } = useI18n(checkItemsListMessages)

  if (items.length === 0) {
    return <p className="odm-or-empty">{t.noCheckItemsYet}</p>
  }
  // Backend check text is English; the Vietnamese table only applies to vi.
  const name = (value: string) => (lang === 'vi' ? viCheckName(value) : value)
  const message = (value: string) =>
    lang === 'vi' ? viCheckMessage(value) : value
  return (
    <ul className="odm-md-checks">
      {items.map((item) => (
        <li key={`${item.checkType}-${item.checkName}`}>
          <span className="odm-md-check-text">
            <strong>{name(item.checkName)}</strong>
            {item.message ? <small>{message(item.message)}</small> : null}
          </span>
          <StatusBadge tone={checkTone(item.status)}>
            {checkLabel(item.status, lang)}
          </StatusBadge>
        </li>
      ))}
    </ul>
  )
}
