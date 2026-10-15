import { useI18n } from '../../../../../shared/i18n'
import type { ReactNode } from 'react'
import type { BatteryTone, CockpitLayout } from './cockpitTypes'
import { Ico } from './CockpitIcon'
import { cockpitCameraPanelMessages } from './CockpitCameraPanel.messages'

export function CockpitCameraPanel({
  camera,
  battery,
  batteryTone,
  layout,
  onLayoutChange,
}: {
  camera: ReactNode
  battery: number | null
  batteryTone: BatteryTone
  layout: CockpitLayout
  onLayoutChange: (layout: CockpitLayout) => void
}) {
  const { t } = useI18n(cockpitCameraPanelMessages)

  return (
    <section className="fc-panel fc-camera">
      <header className="fc-panel__head">
        <span className="fc-panel__title">
          <i className="fc-dot is-live" />
          {t.camera}
        </span>
        <span className="fc-panel__tools">
          <span className={`fc-badge is-${batteryTone}`}>
            <Ico name="battery" size={14} />{' '}
            {battery === null ? '--' : `${Math.round(battery)}%`}
          </span>
          <button
            type="button"
            className="fc-icon-btn is-sm"
            onClick={() =>
              onLayoutChange(layout === 'camera' ? 'split' : 'camera')
            }
            aria-label={layout === 'camera' ? t.shrink : t.enlarge}
            title={layout === 'camera' ? t.shrink : t.enlarge}
          >
            <Ico name="expand" size={15} />
          </button>
        </span>
      </header>
      <div className="fc-camera__body">{camera}</div>
    </section>
  )
}
