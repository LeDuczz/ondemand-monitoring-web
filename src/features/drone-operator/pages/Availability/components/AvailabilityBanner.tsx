import { useI18n } from '../../../../../shared/i18n'
import { Banner } from './Banner'
import { availabilityBannerMessages } from './AvailabilityBanner.messages'

export function AvailabilityBanner({
  saveState,
  dirty,
  isEmpty,
}: {
  saveState: 'idle' | 'saved' | 'error'
  dirty: boolean
  isEmpty: boolean
}) {
  const { t } = useI18n(availabilityBannerMessages)

  return (
    <>
      {saveState === 'saved' ? (
        <Banner tone="green">{t.savedBanner}</Banner>
      ) : saveState === 'error' ? (
        <Banner tone="red">{t.saveErrorBanner}</Banner>
      ) : !dirty && isEmpty ? (
        <Banner tone="yellow">{t.emptyWeekBanner}</Banner>
      ) : null}
    </>
  )
}
