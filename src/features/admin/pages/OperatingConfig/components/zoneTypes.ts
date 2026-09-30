import { defineMessages } from '../../../../../shared/i18n'
import type { UiTone } from '../../../../../shared/components/ui'
import type { ZoneType } from '../../../types/operatingConfig'

export const ZONE_TYPES: ZoneType[] = [
  'AIRPORT',
  'MILITARY',
  'RESTRICTED',
  'TEMPORARY',
]

export const ZONE_TYPE_TONE: Record<ZoneType, UiTone> = {
  AIRPORT: 'danger',
  MILITARY: 'danger',
  RESTRICTED: 'warning',
  TEMPORARY: 'warning',
}

export const zoneTypeMessages = defineMessages({
  vi: {
    AIRPORT: 'Sân bay',
    MILITARY: 'Quân sự',
    RESTRICTED: 'Hạn chế',
    TEMPORARY: 'Tạm thời',
  },
  en: {
    AIRPORT: 'Airport',
    MILITARY: 'Military',
    RESTRICTED: 'Restricted',
    TEMPORARY: 'Temporary',
  },
})
