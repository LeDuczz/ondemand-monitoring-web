import { useI18n } from '../../../../../shared/i18n'
import { viewportPercentToWorld } from '../../../../../shared/lib/simulationMapProjection'
import { findContainingZone, MAP_IMAGE_CROP } from '../../../lib/createOrder/geometry'
import type {
  FormErrors,
  FormState,
  MapPoint,
  UpdateField,
} from '../../../lib/createOrder/types'
import type { useSimulationMap } from '../hooks/useSimulationMap'
import { LocationPanel } from './LocationPanel'
import { locationStepMessages } from './LocationStep.messages'
import { SimulationMap } from './SimulationMap'
import { simulationMapMessages } from './SimulationMap.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  mapPoint: MapPoint
  setMapPoint: (point: MapPoint) => void
  map: ReturnType<typeof useSimulationMap>
}

const DEFAULT_LAT = 10.6402
const DEFAULT_LNG = 106.6912

/** Step 1: pick the monitoring point on the simulation map. */
export function LocationStep({ form, errors, update, mapPoint, setMapPoint, map }: Props) {
  const { t } = useI18n(locationStepMessages)
  const { t: mapT } = useI18n(simulationMapMessages)
  const { meta, zones, restricted, monitoring } = map

  function pick(percent: MapPoint) {
    setMapPoint(percent)
    if (!meta) {
      update('latitude', (DEFAULT_LAT + (50 - percent.y) * 0.00035).toFixed(6))
      update('longitude', (DEFAULT_LNG + (percent.x - 50) * 0.00042).toFixed(6))
      return
    }
    const { simX, simY } = viewportPercentToWorld(percent, meta, MAP_IMAGE_CROP)
    update('latitude', simY.toFixed(3))
    update('longitude', simX.toFixed(3))
    update('address', findContainingZone([simX, simY], zones)?.name ?? t.outsideZoneAddress)
  }

  return (
    <div className="co-stack">
      {map.metaFailed && <div className="co-notice is-danger">{mapT.metaUnavailable}</div>}
      <div className="co-grid">
        <SimulationMap
          imageUrl={map.imageUrl}
          meta={meta}
          zones={zones}
          blockedZoneIds={new Set(restricted.blockedZones.map((z) => z.id))}
          point={mapPoint}
          radiusM={form.radiusM}
          hasError={!restricted.valid || (monitoring.checked && !monitoring.valid)}
          onPick={pick}
        />
        <LocationPanel
          form={form}
          errors={errors}
          update={update}
          monitoring={monitoring}
          restricted={restricted}
        />
      </div>
    </div>
  )
}
