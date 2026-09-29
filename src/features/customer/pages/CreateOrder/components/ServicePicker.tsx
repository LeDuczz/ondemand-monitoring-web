import { Card, EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { ServiceOption } from '../../../api/customerApi'
import { servicePickerMessages } from './ServicePicker.messages'

type Props = {
  services: ServiceOption[]
  loading: boolean
  selectedId: string
  suggested?: ServiceOption
  error?: string
  onSelect: (serviceId: string) => void
}

export function ServicePicker({ services, loading, selectedId, suggested, error, onSelect }: Props) {
  const { t } = useI18n(servicePickerMessages)

  return (
    <Card title={t.cardTitle}>
      {suggested && (
        <div className="co-suggest">
          <strong>{t.aiSuggested}</strong>
          <div className="co-hint">{t.aiSuggestedHint}</div>
          <div className="co-service">
            <div className="co-service-name">{suggested.name}</div>
            <div className="co-service-desc">
              {suggested.description || t.defaultDescription}
            </div>
            <button
              type="button"
              className="odm-btn odm-btn-sm"
              onClick={() => onSelect(suggested.id)}
            >
              {selectedId === suggested.id ? t.selectedNow : t.pickSuggestion}
            </button>
          </div>
        </div>
      )}
      <div className="co-row-between co-mt">
        <strong>{t.allServices}</strong>
        <span className="co-hint">{t.serviceCount(services.length)}</span>
      </div>
      {loading && <p className="co-hint co-mt">{t.loading}</p>}
      {!loading && services.length === 0 && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      <div className="co-service-grid co-mt">
        {services.map((service) => {
          const cls = [
            'co-service',
            selectedId === service.id ? 'is-active' : '',
            suggested?.id === service.id ? 'is-suggested' : '',
          ].join(' ')
          return (
            <button
              key={service.id}
              type="button"
              className={cls}
              aria-pressed={selectedId === service.id}
              onClick={() => onSelect(service.id)}
            >
              <span className="co-service-name">{service.name}</span>
              <span className="co-service-desc">
                {service.description || t.defaultDescription}
              </span>
            </button>
          )
        })}
      </div>
      {error && <div className="ui-field-error">{error}</div>}
    </Card>
  )
}
