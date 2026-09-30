import { StatusBadge, toUiTone } from '../../../../shared/components/ui'
import { useLanguage } from '../../../../shared/i18n'
import type { MissionStatus } from '../../../../shared/types/domain'
import { getMissionStatusMeta } from '../../lib/orderStatus'

/** Mission status pill: label (vi/en) and tone come from lib/orderStatus. */
export function MissionStatusBadge({ status }: { status: MissionStatus }) {
  const { lang } = useLanguage()
  const meta = getMissionStatusMeta(status, lang)
  return <StatusBadge tone={toUiTone(meta.tone)}>{meta.label}</StatusBadge>
}
