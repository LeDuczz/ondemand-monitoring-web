import { useCallback, useEffect, useRef, useState } from 'react'

import {
  customerApi,
  type FlightAreaAssessment,
} from '../../../customer/api/customerApi'
import type { OrderReviewMessages } from '../../pages/OrderReviewPage.messages'
import type { OrderDetail } from '../../types/orders'
import { OrderLocationCard } from './OrderLocationCard'
import { resolveOrderGpsCenter } from './orderGps'

const assessmentCache = new Map<string, FlightAreaAssessment>()

export function OrderAreaCheck({
  order,
  t,
}: {
  order: OrderDetail
  t: OrderReviewMessages
}) {
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
    <section className="odm-or-area-check" aria-label="Kiểm tra vùng giám sát">
      <div className="odm-or-area-check-head">
        <div>
          <h2>Kiểm tra vùng giám sát</h2>
          <p>
            Giúp xác định khu vực có cần kiểm tra thêm trước khi duyệt đơn hay
            không. Kết quả này chỉ là cảnh báo sơ bộ, không tự động từ chối đơn.
          </p>
        </div>
        {data ? (
          <span
            className={`odm-or-area-risk is-${data.assessment.level.toLowerCase()}`}
          >
            {riskLabel(data.assessment.level)}
          </span>
        ) : null}
      </div>

      <div className="odm-or-area-check-grid">
        <OrderLocationCard order={order} t={t} showAreaAddress />
        <section className="odm-or-card">
          <header className="odm-or-card-head">
            <span className="odm-or-card-title">Kết luận về khu vực bay</span>
            <button
              type="button"
              className="odm-or-btn-outline"
              onClick={assessment.reload}
              disabled={assessment.loading}
            >
              {assessment.loading ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
            </button>
          </header>
          <div className="odm-or-card-body odm-or-area-results">
            {!resolved || radiusM <= 0 ? (
              <p className="odm-or-empty">
                Đơn chưa có đủ tọa độ hoặc bán kính để kiểm tra vùng.
              </p>
            ) : assessment.error ? (
              <p className="odm-or-area-error" role="alert">
                Không tải được kết quả kiểm tra vùng. Vui lòng thử lại.
              </p>
            ) : assessment.loading && !data ? (
              <p className="odm-or-empty">Đang phân tích vùng giám sát…</p>
            ) : data ? (
              <>
                <AreaDecisionSummary data={data} />
                <details className="odm-or-area-details">
                  <summary>Xem dữ liệu kiểm tra chi tiết</summary>
                  <dl className="odm-or-area-facts">
                    <Fact
                      label="Đối chiếu bản đồ Bộ Quốc phòng"
                      value={ministryLabel(data.ministryFlightBan)}
                    />
                    <Fact
                      label="Dữ liệu vùng cấm nội bộ"
                      value={restrictedLabel(data.restrictedZones)}
                    />
                    <Fact
                      label="Khoảng cách tới vùng cấm gần nhất"
                      value={distanceLabel(
                        data.restrictedZones
                          .nearestRestrictedZoneDistanceMeters,
                      )}
                    />
                    <Fact
                      label="Độ cao mặt đất tại vị trí"
                      value={metersLabel(data.elevation.terrainElevationMeters)}
                    />
                    <Fact
                      label="Công trình trong khu vực"
                      value={String(data.osmContext.buildingCount ?? 0)}
                    />
                    <Fact
                      label="Có sân bay gần khu vực"
                      value={data.osmContext.aerodromeNearby ? 'Có' : 'Không'}
                    />
                    <Fact
                      label="Có bãi đáp trực thăng gần khu vực"
                      value={data.osmContext.helipadNearby ? 'Có' : 'Không'}
                    />
                  </dl>
                </details>
                {hasMinistryViolations ? (
                  <div className="odm-or-area-findings">
                    <strong>Mã vùng vi phạm theo cambay.mod.gov.vn</strong>
                    <ul>
                      {ministryViolatedZones.map((zone) => (
                        <li key={zone} className="is-high odm-or-area-zone-row">
                          <code>{zone}</code>
                          <button
                            type="button"
                            className="odm-or-area-zone-link"
                            title={`Mở cambay.mod.gov.vn và sao chép mã ${zone}`}
                            onClick={() => openMinistryMap(zone)}
                          >
                            Xem trên bản đồ
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {findings && findings.length > 0 ? (
                  <div className="odm-or-area-findings">
                    <strong>Cảnh báo cần xem xét</strong>
                    <ul>
                      {findings.map((finding) => (
                        <li
                          key={finding.code}
                          className={`is-${finding.severity.toLowerCase()}`}
                        >
                          {finding.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : !hasMinistryViolations ? (
                  <p className="odm-or-area-clear">
                    Không ghi nhận cảnh báo vùng cần chú ý.
                  </p>
                ) : null}
                <p className="odm-or-area-disclaimer">
                  {data.assessment.disclaimer}
                </p>
                <a
                  className="odm-or-area-source"
                  href={
                    data.ministryFlightBan?.sourceUrl ??
                    'https://cambay.mod.gov.vn/'
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở bản đồ cấm bay của Bộ Quốc phòng
                </a>
              </>
            ) : null}
          </div>
        </section>
      </div>
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function AreaDecisionSummary({ data }: { data: FlightAreaAssessment }) {
  const level = data.assessment.level
  const hasMinistryConflict =
    Boolean(data.ministryFlightBan?.violatedZones.length) ||
    (data.ministryFlightBan?.violatedAreaSquareMeters ?? 0) > 0
  const title =
    level === 'HIGH_RISK'
      ? 'Chưa nên duyệt khu vực này'
      : level === 'NEEDS_REVIEW'
        ? 'Cần kiểm tra thêm trước khi duyệt'
        : 'Chưa phát hiện trở ngại đáng kể'
  const guidance = hasMinistryConflict
    ? 'Bản đồ của Bộ Quốc phòng ghi nhận khu vực giao vùng cấm hoặc hạn chế bay. Hãy mở bản đồ, đối chiếu mã vùng bên dưới và xác nhận điều kiện trước khi duyệt.'
    : level === 'HIGH_RISK' || level === 'NEEDS_REVIEW'
      ? 'Hãy xem các cảnh báo bên dưới và xác nhận điều kiện thực tế trước khi duyệt.'
      : 'Bạn có thể tiếp tục xem các điều kiện duyệt khác. Điều kiện bay cuối cùng vẫn cần được xác nhận khi lập kế hoạch.'

  return (
    <div className={`odm-or-area-decision is-${level.toLowerCase()}`}>
      <strong>{title}</strong>
      <p>{guidance}</p>
    </div>
  )
}

function openMinistryMap(zoneCode: string) {
  window.open('https://cambay.mod.gov.vn/', '_blank', 'noopener,noreferrer')
  void navigator.clipboard?.writeText(zoneCode).catch(() => undefined)
}

function riskLabel(level: string) {
  if (level === 'HIGH_RISK') return 'Rủi ro cao'
  if (level === 'NEEDS_REVIEW') return 'Cần xem xét'
  return 'Thuận lợi'
}

function restrictedLabel(value: {
  dataAvailable: boolean
  pointInsideRestrictedZone: boolean
  monitoringAreaIntersectsRestrictedZone: boolean
}) {
  if (!value.dataAvailable) return 'Chưa có dữ liệu'
  if (value.pointInsideRestrictedZone) return 'Tâm vùng nằm trong vùng cấm'
  if (value.monitoringAreaIntersectsRestrictedZone)
    return 'Vùng giám sát giao vùng cấm'
  return 'Không giao vùng cấm'
}

function distanceLabel(value: number | null | undefined) {
  return value == null
    ? 'Chưa xác định'
    : `${Math.round(value).toLocaleString('vi-VN')} m`
}

function metersLabel(value: number | null | undefined) {
  return value == null ? 'Chưa xác định' : `${Math.round(value)} m AMSL`
}

function ministryLabel(
  value:
    | {
        available: boolean
        violatedAreaSquareMeters?: number | null
        violatedZones: string[]
      }
    | undefined,
) {
  if (!value?.available) return 'Không kết nối được'
  if (
    (value.violatedAreaSquareMeters ?? 0) > 0 ||
    value.violatedZones.length > 0
  ) {
    return 'Có giao vùng cấm/hạn chế bay'
  }
  return 'Không ghi nhận giao vùng cấm'
}
