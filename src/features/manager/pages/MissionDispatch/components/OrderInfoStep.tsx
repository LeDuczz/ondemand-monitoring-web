import { OrderIcon } from '../../../components/common/OrderIcon'
import { env } from '../../../../../config/env'
import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import {
  simulationMapImageStyle,
  worldToViewportPercent,
} from '../../../../../shared/lib/simulationMapProjection'
import {
  SIMULATION_MAP_BOUNDS,
  SIMULATION_MAP_IMAGE_CROP,
  SIMULATION_MAP_TOP_IMAGE,
  SIMULATION_MAP_VERSION,
  fmtRadius,
  requestedWindow,
} from '../liveDispatchHelpers'
import type { Mission } from '../../../../mission/types/mission'
import { useI18n } from '../../../../../shared/i18n'
import { orderInfoStepMessages } from './OrderInfoStep.messages'
import { OrderMapPreview } from './OrderMapPreview'

export function OrderInfoStep({ current }: { current: Mission }) {
  const { t } = useI18n(orderInfoStepMessages)
  const currentOrderCode = displayOrderCode(current.orderCode, current.orderId)
  const hasTarget = current.latitude != null && current.longitude != null
  const target = hasTarget
    ? worldToViewportPercent(
        { simX: current.longitude ?? 0, simY: current.latitude ?? 0 },
        SIMULATION_MAP_BOUNDS,
        SIMULATION_MAP_IMAGE_CROP,
      )
    : null
  const mapImageUrl = `${env.apiBaseUrl}${SIMULATION_MAP_TOP_IMAGE}?v=${SIMULATION_MAP_VERSION}`
  const imageStyle = simulationMapImageStyle(SIMULATION_MAP_IMAGE_CROP)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="doc" size={18} />
          {t.orderInfoTitle}
        </span>
      </header>
      <div
        className={`odm-or-card-body odm-or-order-body${target ? ' has-map' : ''}`}
      >
        <dl className="odm-or-summary-list">
          <div>
            <dt>
              <OrderIcon name="tag" size={16} />
              {t.orderId}
            </dt>
            <dd>{currentOrderCode}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="user" size={16} />
              {t.customer}
            </dt>
            <dd>{current.customerName ?? '—'}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="service" size={16} />
              {t.service}
            </dt>
            <dd>{current.serviceName ?? '—'}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="radius" size={16} />
              {t.areaRadius}
            </dt>
            <dd>{fmtRadius(current.radiusM)}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="calendar" size={16} />
              {t.customerDeadline}
            </dt>
            <dd>{requestedWindow(current)}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="media" size={16} />
              {t.orderTitle}
            </dt>
            <dd>{current.orderTitle ?? '—'}</dd>
          </div>
        </dl>
        {target && (
          <OrderMapPreview
            mapImageUrl={mapImageUrl}
            imageStyle={imageStyle}
            target={target}
            current={current}
          />
        )}
      </div>
    </section>
  )
}
