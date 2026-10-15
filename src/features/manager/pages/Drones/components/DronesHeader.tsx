import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { PageResponseDroneResponse } from '../../../types/drones'
import { useI18n } from '../../../../../shared/i18n'
import { dronesHeaderMessages } from './DronesHeader.messages'

export function DronesHeader({
  title,
  query,
  counts,
}: {
  title: string
  query: UseApiQueryState<PageResponseDroneResponse>
  counts: {
    available: number
    flying: number
    maintenance: number
    outOfService: number
  }
}) {
  const { t } = useI18n(dronesHeaderMessages)
  return (
    <div className="odm-mgr-dash-head">
      <div>
        <h1 className="odm-mgr-dash-title">{title}</h1>
        {!query.loading && !query.error && (
          <div className="odm-mgr-dash-date" style={{ fontSize: 13 }}>
            {t.summary(
              counts.available,
              counts.flying,
              counts.maintenance,
              counts.outOfService,
            )}
          </div>
        )}
      </div>
    </div>
  )
}
