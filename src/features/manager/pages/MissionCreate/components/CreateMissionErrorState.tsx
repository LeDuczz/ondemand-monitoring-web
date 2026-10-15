import { ApiError } from '../../../../../shared/api/httpClient'
import { Card } from '../../../../../shared/components/ui'
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
    <div className="odm-or">
      <Card>
        <div className="odm-or-load-error" role="alert">
          <strong>{title}</strong>
          <code className="odm-plan-code">{debugLine}</code>
          <a
            className="odm-btn odm-btn-p"
            href={managerHref({ screen: 'orderQueue' })}
          >
            {backLabel}
          </a>
        </div>
      </Card>
    </div>
  )
}
