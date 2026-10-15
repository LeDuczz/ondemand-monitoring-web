import { ApiError } from '../../../../../shared/api/httpClient'
import { managerHref } from '../../../routes'

export function CreateMissionErrorState({
  error,
  title,
  backLabel,
}: {
  error: unknown
  title: string
  backLabel: string
}) {
  const debugLine =
    error instanceof ApiError
      ? `${error.method} ${error.path}${error.status ? ` · ${error.status}` : ''}`
      : 'GET /orders/{id}/mission-brief'
  return (
    <div className="odm-mgr-dash">
      <div className="odm-card">
        <div className="odm-mgr-review-error">
          <div className="odm-mgr-review-error-icon" aria-hidden="true">
            !
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
          <div
            className="odm-mono"
            style={{ fontSize: 11.5, color: 'var(--tx3)' }}
          >
            {debugLine}
          </div>
          <a
            className="odm-btn odm-btn-p"
            href={managerHref({ screen: 'orderQueue' })}
          >
            {backLabel}
          </a>
        </div>
      </div>
    </div>
  )
}
