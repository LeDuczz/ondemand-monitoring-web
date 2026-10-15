import { MissionBackLink } from './MissionBackLink'

export function MissionDetailSkeleton() {
  return (
    <div className="odm-or" aria-busy="true">
      <MissionBackLink />
      <span className="odm-sk" style={{ width: '100%', height: 320 }} />
    </div>
  )
}
