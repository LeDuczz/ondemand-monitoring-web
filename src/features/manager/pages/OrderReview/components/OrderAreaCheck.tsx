import { useCallback, useEffect, useRef, useState } from 'react'

import {
  customerApi,
  type FlightAreaAssessment,
} from '../../../../customer/api/customerApi'
import type { FlightAreaReviewStatus, OrderDetail } from '../../../types/orders'
import { OrderLocationCard } from './OrderLocationCard'
import { resolveOrderGpsCenter } from '../../../components/common/orderGps'
import { AreaCheckHead } from './AreaCheckHead'
import { AreaResultsCard } from './AreaResultsCard'
import { AreaManagerReview } from './AreaManagerReview'
import { AreaReviewDialog } from './AreaReviewDialog'
import { areaReviewFromOrder } from './areaReview'
import { useI18n } from '../../../../../shared/i18n'
import { orderAreaCheckMessages } from './OrderAreaCheck.messages'

const assessmentCache = new Map<string, FlightAreaAssessment>()

export function OrderAreaCheck({
  order,
  onReviewSaved,
}: {
  order: OrderDetail
  onReviewSaved?: (status: FlightAreaReviewStatus) => void
}) {
  const { t } = useI18n(orderAreaCheckMessages)
  const [review, setReview] = useState(() => areaReviewFromOrder(order))
  const [reviewOpen, setReviewOpen] = useState(false)

  const resolved = resolveOrderGpsCenter(order.center)
  const latitude = resolved?.center.lat
  const longitude = resolved?.center.lon
  const radiusM = order.radiusM ?? 0
  const altitudeM = order.altitudeM ?? undefined
  const assessment = useCachedAreaAssessment({
    latitude,
    longitude,
    radiusM,
    altitudeM,
  })

  const data = assessment.data
  const findings = data?.assessment.findings.filter(
    (item) =>
      !item.code.includes('UNAVAILABLE') &&
      item.code !== 'RESTRICTED_ZONE_DATA_MISSING',
  )
  const ministryViolatedZones = data?.ministryFlightBan?.available
    ? data.ministryFlightBan.violatedZones
    : []
  const hasMinistryViolations = ministryViolatedZones.length > 0

  return (
    <section className="odm-or-area-check" aria-label={t.monitoringAreaCheck}>
      <AreaCheckHead data={data} />

      <div className="odm-or-area-check-grid">
        <OrderLocationCard order={order} showAreaAddress />
        <AreaResultsCard
          assessment={assessment}
          resolved={resolved}
          radiusM={radiusM}
          data={data}
          hasMinistryViolations={hasMinistryViolations}
          ministryViolatedZones={ministryViolatedZones}
          findings={findings}
          managerReview={
            <AreaManagerReview
              order={order}
              review={review}
              onEdit={() => setReviewOpen(true)}
            />
          }
        />
      </div>
      {reviewOpen ? (
        <AreaReviewDialog
          order={order}
          initial={review}
          zoneCount={ministryViolatedZones.length}
          onClose={() => setReviewOpen(false)}
          onSaved={(next) => {
            setReview(next)
            setReviewOpen(false)
            onReviewSaved?.(next.status)
          }}
        />
      ) : null}
    </section>
  )
}

function useCachedAreaAssessment({
  latitude,
  longitude,
  radiusM,
  altitudeM,
}: {
  latitude?: number
  longitude?: number
  radiusM: number
  altitudeM?: number
}) {
  const cacheKey =
    latitude == null || longitude == null || radiusM <= 0
      ? null
      : `${latitude}:${longitude}:${radiusM}:${altitudeM ?? ''}`
  const cached = cacheKey ? assessmentCache.get(cacheKey) : undefined
  const [data, setData] = useState<FlightAreaAssessment | null | undefined>(
    cached,
  )
  const [error, setError] = useState<unknown>()
  const [loading, setLoading] = useState(Boolean(cacheKey && !cached))
  const [reloadToken, setReloadToken] = useState(0)
  const requestId = useRef(0)
  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    if (!cacheKey || latitude == null || longitude == null || radiusM <= 0) {
      setData(null)
      setError(undefined)
      setLoading(false)
      return
    }

    const saved = assessmentCache.get(cacheKey)
    if (saved && reloadToken === 0) {
      setData(saved)
      setError(undefined)
      setLoading(false)
      return
    }

    const id = ++requestId.current
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)
    customerApi
      .getFlightAreaAssessment(
        {
          latitude,
          longitude,
          radiusMeters: radiusM,
          requestedAltitudeAgl: altitudeM,
          includeOsm: false,
        },
        controller.signal,
      )
      .then((result) => {
        if (requestId.current !== id) return
        assessmentCache.set(cacheKey, result)
        setData(result)
      })
      .catch((reason: unknown) => {
        if (requestId.current !== id) return
        if (reason instanceof DOMException && reason.name === 'AbortError')
          return
        setError(reason)
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false)
      })

    return () => controller.abort()
  }, [cacheKey, latitude, longitude, radiusM, altitudeM, reloadToken])

  return { data, error, loading, reload }
}
