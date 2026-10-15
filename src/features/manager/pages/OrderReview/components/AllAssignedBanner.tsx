import { useI18n } from '../../../../../shared/i18n'
import { allAssignedBannerMessages } from './AllAssignedBanner.messages'

export function AllAssignedBanner({ allAssigned }: { allAssigned: boolean }) {
  const { t } = useI18n(allAssignedBannerMessages)

  return (
    <>
      {allAssigned && (
        <div className="odm-planning-complete" role="status">
          <span>{t.allMissionsAreFullyAssigned}</span>
          <a className="odm-btn odm-btn-p" href="#portal/manager/orders">
            {t.finishAssignment}
          </a>
        </div>
      )}
    </>
  )
}
