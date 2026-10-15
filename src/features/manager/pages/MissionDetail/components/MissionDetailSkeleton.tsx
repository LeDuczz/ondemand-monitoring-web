import { PageHeader } from '../../../../../shared/components/ui'
import { MissionBackLink } from './MissionBackLink'

export function MissionDetailSkeleton() {
  return (
    <div className="odm-or odm-or-review-page" aria-busy="true">
      <PageHeader
        back={<MissionBackLink />}
        title={<span className="odm-sk odm-md-sk-title" />}
      />
      <div className="mng-stats">
        <span className="odm-sk odm-md-sk-stat" />
        <span className="odm-sk odm-md-sk-stat" />
        <span className="odm-sk odm-md-sk-stat" />
      </div>
      <div className="odm-or-layout">
        <div className="odm-or-main">
          <span className="odm-sk odm-or-sk-main" />
          <span className="odm-sk odm-or-sk-sub" />
        </div>
        <div className="odm-or-side">
          <span className="odm-sk odm-or-sk-side" />
          <span className="odm-sk odm-or-sk-side" />
        </div>
      </div>
    </div>
  )
}
