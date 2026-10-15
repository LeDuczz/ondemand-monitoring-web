import { useI18n } from '../../../../../shared/i18n'
import type { ReactNode } from 'react'
import type { CockpitLayout } from './cockpitTypes'
import { Ico } from './CockpitIcon'
import { cockpitMapPanelMessages } from './CockpitMapPanel.messages'

export function CockpitMapPanel({
  map,
  missionLabel,
  statusMessage,
  layout,
  onLayoutChange,
}: {
  map: ReactNode
  missionLabel: string
  statusMessage: string
  layout: CockpitLayout
  onLayoutChange: (layout: CockpitLayout) => void
}) {
  const { t } = useI18n(cockpitMapPanelMessages)

  return (
    <section className="fc-panel fc-map">
      <header className="fc-panel__head">
        <span className="fc-panel__title">
          <Ico name="pin" size={15} />
          {t.map}
        </span>
        <span className="fc-panel__tools">
          {statusMessage ? (
            <span className="fc-status-msg" title={statusMessage}>
              {statusMessage}
            </span>
          ) : null}
          <button
            type="button"
            className="fc-icon-btn is-sm"
            onClick={() => onLayoutChange(layout === 'map' ? 'split' : 'map')}
            aria-label={layout === 'map' ? t.shrink : t.enlarge}
            title={layout === 'map' ? t.shrink : t.enlarge}
          >
            <Ico name="expand" size={15} />
          </button>
        </span>
      </header>
      <div className="fc-map__body">
        {map}
        <div className="fc-legend">
          <strong>{missionLabel}</strong>
          <span>
            <i className="fc-legend__line is-route" />
            {t.route}
          </span>
          <span>
            <i className="fc-legend__line is-zone" />
            {t.zone}
          </span>
          <span>
            <i className="fc-legend__dot is-drone" />
            {t.drone}
          </span>
          <span>
            <i className="fc-legend__dot is-target" />
            {t.target}
          </span>
        </div>
      </div>
    </section>
  )
}
