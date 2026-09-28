import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { env } from '../../../config/env'
import { authSession } from '../../auth/api/authApi'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { useI18n } from '../../../shared/i18n'
import {
  OrderApiError,
  orderApi,
  type CategoryService,
  type OrderCreatePayload,
  type PreferredTime,
} from '../api/orderApi'
import { customerCreateRequestPageMessages } from './CustomerCreateRequestPage.messages'

const SIMULATION_MAP_TOP_IMAGE = '/simulation-viewer/simulation_map_top.png'

type MapMeta = {
  image?: string
  imageVersion?: string
  minX: number
  maxX: number
  minY: number
  maxY: number
  width?: number
  height?: number
}

type SelectedTarget = {
  x: number
  y: number
  imageX: number
  imageY: number
  markerX: number
  markerY: number
  zone?: SimulationZone
}

type ZonePayload = {
  id?: string
  code?: string
  name?: string
  zoneType?: string
  restricted?: boolean
  coordinates?: number[][]
}

type SimulationZone = {
  id: string
  code: string
  name: string
  zoneType: string
  restricted: boolean
  coordinates: [number, number][]
}

type FormState = {
  serviceId: string
  title: string
  purpose: string
  description: string
  address: string
  preferredDate: string
  preferredTimeId: string
  mediaType: 'IMAGE' | 'VIDEO'
  numberOfPhoto: number
  durationOfVideo: number
}

const today = new Date().toISOString().slice(0, 10)
const summaryMapZoom = 2.35
const summaryMapPixelSize = 2048

const initialForm: FormState = {
  serviceId: '',
  title: '',
  purpose: '',
  description: '',
  address: 'Local simulation target',
  preferredDate: today,
  preferredTimeId: '',
  mediaType: 'IMAGE',
  numberOfPhoto: 10,
  durationOfVideo: 120,
}

function formatCoord(value: number | undefined, notSelectedText: string) {
  return typeof value === 'number' ? `${value.toFixed(2)} m` : notSelectedText
}

function useSimulationMapMeta(unavailableMessage: string) {
  const [meta, setMeta] = useState<MapMeta | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function loadMeta() {
      try {
        const response = await fetch(
          `${env.apiBaseUrl}/simulation-viewer/simulation-map.json`,
          { cache: 'no-store' },
        )
        const payload = (await response.json()) as MapMeta
        if (alive) setMeta(payload)
      } catch {
        if (alive) setError(unavailableMessage)
      }
    }

    void loadMeta()
    return () => {
      alive = false
    }
  }, [unavailableMessage])

  return { meta, error }
}

function normalizeRing(
  coordinates: number[][] | undefined,
): [number, number][] {
  if (!coordinates) return []
  const ring = coordinates
    .map((point) => [Number(point[0]), Number(point[1])] as [number, number])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))

  if (ring.length < 3) return []
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first)
  return ring
}

function pointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax)
  if (Math.abs(cross) > 1e-9) return false
  return (px - ax) * (px - bx) + (py - ay) * (py - by) <= 1e-9
}

function polygonContainsPoint(
  ring: [number, number][],
  point: [number, number],
) {
  const [px, py] = point
  let inside = false

  for (let index = 0; index < ring.length - 1; index += 1) {
    const [ax, ay] = ring[index]
    const [bx, by] = ring[index + 1]
    if (pointOnSegment(px, py, ax, ay, bx, by)) return true
    if (ay > py !== by > py) {
      const xAtY = ax + ((py - ay) * (bx - ax)) / (by - ay)
      if (px < xAtY) inside = !inside
    }
  }

  return inside
}

function findContainingZone(point: [number, number], zones: SimulationZone[]) {
  return zones.find((zone) => polygonContainsPoint(zone.coordinates, point))
}

function useSimulationZones() {
  const [zones, setZones] = useState<SimulationZone[]>([])

  useEffect(() => {
    let alive = true

    async function loadZones() {
      try {
        const response = await fetch(`${env.apiBaseUrl}/api/zones`, {
          cache: 'no-store',
        })
        const payload = await response.json()
        const items = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []
        const normalized = (items as ZonePayload[])
          .map((zone) => ({
            id: String(zone.id ?? zone.code ?? zone.name ?? 'zone'),
            code: String(zone.code ?? ''),
            name: String(zone.name ?? zone.code ?? 'Monitoring zone'),
            zoneType: String(zone.zoneType ?? ''),
            restricted: Boolean(zone.restricted),
            coordinates: normalizeRing(zone.coordinates),
          }))
          .filter((zone) => zone.coordinates.length >= 4)
        if (alive) setZones(normalized)
      } catch {
        if (alive) setZones([])
      }
    }

    void loadZones()
    return () => {
      alive = false
    }
  }, [])

  return zones
}

export function CustomerCreateRequestPage() {
  const { t } = useI18n(customerCreateRequestPageMessages)
  const user = authSession.getUser()
  const { meta, error: mapError } = useSimulationMapMeta(t.mapMetaUnavailable)
  const mapImageUrl = meta
    ? `${env.apiBaseUrl}${SIMULATION_MAP_TOP_IMAGE}${meta.imageVersion ? `?v=${encodeURIComponent(meta.imageVersion)}` : ''}`
    : ''
  const zones = useSimulationZones()
  const [form, setForm] = useState<FormState>(initialForm)
  const [services, setServices] = useState<CategoryService[]>([])
  const [preferredTimes, setPreferredTimes] = useState<PreferredTime[]>([])
  const [target, setTarget] = useState<SelectedTarget | null>(null)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState('')

  useEffect(() => {
    let alive = true

    async function loadOptions() {
      setLoadingOptions(true)
      try {
        const [serviceItems, timeItems] = await Promise.all([
          orderApi.getCategoryServices(),
          orderApi.getPreferredTimes(),
        ])
        if (!alive) return
        setServices(serviceItems)
        setPreferredTimes(timeItems)
        setForm((current) => ({
          ...current,
          serviceId: current.serviceId || serviceItems[0]?.id || '',
          preferredTimeId: current.preferredTimeId || timeItems[0]?.id || '',
        }))
      } catch (exception) {
        if (!alive) return
        setError(
          exception instanceof Error
            ? exception.message
            : t.unableToLoadOptions,
        )
      } finally {
        if (alive) setLoadingOptions(false)
      }
    }

    void loadOptions()
    return () => {
      alive = false
    }
  }, [t.unableToLoadOptions])

  const selectedService = services.find((item) => item.id === form.serviceId)
  const selectedTime = preferredTimes.find(
    (item) => item.id === form.preferredTimeId,
  )
  const summaryMapImagePosition = useMemo(() => {
    if (!meta || !target) return null
    const mapAspect = (meta.maxX - meta.minX) / (meta.maxY - meta.minY)
    const mapPixelWidth = summaryMapPixelSize * mapAspect
    const mapOffsetX = (summaryMapPixelSize - mapPixelWidth) / 2
    const imagePixelX = mapOffsetX + (target.imageX / 100) * mapPixelWidth
    const imagePixelY = (target.imageY / 100) * summaryMapPixelSize

    return {
      xPercent: (imagePixelX / summaryMapPixelSize) * 100,
      yPercent: (imagePixelY / summaryMapPixelSize) * 100,
    }
  }, [meta, target])

  const payload = useMemo<OrderCreatePayload | null>(() => {
    if (!target) return null
    return {
      title: form.title.trim(),
      purpose: form.purpose.trim() || undefined,
      serviceId: form.serviceId,
      description: form.description.trim() || undefined,
      address: form.address.trim() || 'Local simulation target',
      point: {
        type: 'Point',
        coordinates: [target.x, target.y],
      },
      preferredDate: form.preferredDate,
      preferredTimeId: form.preferredTimeId,
      mediaType: form.mediaType,
      numberOfPhoto:
        form.mediaType === 'IMAGE' ? Number(form.numberOfPhoto) : undefined,
      durationOfVideo:
        form.mediaType === 'VIDEO' ? Number(form.durationOfVideo) : undefined,
    }
  }, [form, target])

  const canSubmit =
    Boolean(payload) &&
    Boolean(form.title.trim()) &&
    Boolean(form.serviceId) &&
    Boolean(form.preferredDate) &&
    Boolean(form.preferredTimeId) &&
    (form.mediaType === 'IMAGE'
      ? Number(form.numberOfPhoto) > 0
      : Number(form.durationOfVideo) > 0) &&
    !createdOrderId &&
    !submitting

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
    setNotice('')
    setError('')
    setCreatedOrderId('')
  }

  const selectMapPoint = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!meta) return
    const rect = event.currentTarget.getBoundingClientRect()
    const mapAspect = (meta.maxX - meta.minX) / (meta.maxY - meta.minY)
    const boxAspect = rect.width / rect.height
    const renderedWidth =
      boxAspect > mapAspect ? rect.height * mapAspect : rect.width
    const renderedHeight =
      boxAspect > mapAspect ? rect.height : rect.width / mapAspect
    const offsetX = (rect.width - renderedWidth) / 2
    const offsetY = (rect.height - renderedHeight) / 2
    const localX = Math.max(
      0,
      Math.min(renderedWidth, event.clientX - rect.left - offsetX),
    )
    const localY = Math.max(
      0,
      Math.min(renderedHeight, event.clientY - rect.top - offsetY),
    )
    const imageX = (localX / renderedWidth) * 100
    const imageY = (localY / renderedHeight) * 100
    const markerX = ((offsetX + localX) / rect.width) * 100
    const markerY = ((offsetY + localY) / rect.height) * 100
    const x = meta.minX + (imageX / 100) * (meta.maxX - meta.minX)
    const y = meta.maxY - (imageY / 100) * (meta.maxY - meta.minY)
    const zone = findContainingZone([x, y], zones)
    setTarget({ x, y, imageX, imageY, markerX, markerY, zone })
    setForm((current) => ({
      ...current,
      address: zone?.name ?? 'Outside configured monitoring zones',
    }))
    setNotice('')
    setCreatedOrderId('')
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!payload) {
      setError(t.selectTargetFirst)
      return
    }

    setSubmitting(true)
    try {
      const response = await orderApi.createOrder(payload)
      setCreatedOrderId(response.id)
      setNotice(t.orderCreatedNotice(response.id))
    } catch (exception) {
      if (exception instanceof OrderApiError) {
        setError(exception.message)
      } else {
        setError(t.unableToCreate)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PortalLayout role="CUSTOMER" title={t.pageTitle} subtitle={t.pageSubtitle}>
      <form className="customer-request-page" onSubmit={submit}>
        <aside className="request-stepper" aria-label={t.stepsAriaLabel}>
          {t.steps.map(([label, help], index) => (
            <div className="request-step" key={label}>
              <span>{index + 1}</span>
              <div>
                <strong>{label}</strong>
                <small>{help}</small>
              </div>
            </div>
          ))}
        </aside>

        <main className="request-form-stack">
          {(error || notice || mapError) && (
            <div
              className={`request-alert ${notice ? 'request-alert--success' : ''}`}
            >
              {notice || error || mapError}
            </div>
          )}

          <section className="request-card-panel">
            <div className="request-section-title">
              <Icon name="file-text" />
              <h2>{t.section1Title}</h2>
            </div>
            <div className="request-grid-2">
              <label className="request-field">
                <span>{t.serviceCategory}</span>
                <select
                  disabled={loadingOptions}
                  value={form.serviceId}
                  onChange={(event) =>
                    updateField('serviceId', event.target.value)
                  }
                >
                  {services.length === 0 ? (
                    <option value="">{t.noServiceCategory}</option>
                  ) : null}
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="request-field">
                <span>{t.requestTitle}</span>
                <input
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder={t.requestTitlePlaceholder}
                  required
                />
              </label>
            </div>
            <label className="request-field">
              <span>{t.purpose}</span>
              <input
                value={form.purpose}
                onChange={(event) => updateField('purpose', event.target.value)}
                placeholder={t.purposePlaceholder}
              />
            </label>
            <label className="request-field">
              <span>{t.description}</span>
              <textarea
                maxLength={1000}
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                placeholder={t.descriptionPlaceholder}
              />
              <small>{form.description.length}/1000</small>
            </label>
          </section>

          <section className="request-card-panel">
            <div className="request-section-title">
              <Icon name="route" />
              <h2>{t.section2Title}</h2>
            </div>
            <div className="simulation-picker-grid">
              <button
                className="simulation-map-picker"
                type="button"
                onClick={selectMapPoint}
                disabled={!meta}
              >
                <img alt={t.simulationMapAlt} src={mapImageUrl} />
                {target ? (
                  <span
                    className="simulation-target-marker"
                    style={{
                      left: `${target.markerX}%`,
                      top: `${target.markerY}%`,
                    }}
                  />
                ) : null}
              </button>
              <div className="selected-target-card">
                <strong>{t.selectedTarget}</strong>
                <span>{t.coordX(formatCoord(target?.x, t.notSelected))}</span>
                <span>{t.coordY(formatCoord(target?.y, t.notSelected))}</span>
                <div
                  className={`zone-label-pill ${target?.zone?.restricted ? 'zone-label-pill--restricted' : ''}`}
                >
                  {target?.zone
                    ? `${target.zone.name}${target.zone.restricted ? t.restrictedSuffix : ''}`
                    : target
                      ? t.outsideZones
                      : t.noZoneSelected}
                </div>
                <label className="request-field">
                  <span>{t.locationLabel}</span>
                  <input
                    value={form.address}
                    onChange={(event) =>
                      updateField('address', event.target.value)
                    }
                  />
                </label>
                <small>{t.gazeboNote}</small>
              </div>
            </div>
          </section>

          <section className="request-card-panel">
            <div className="request-section-title">
              <Icon name="clock" />
              <h2>{t.section3Title}</h2>
            </div>
            <div
              className={`request-grid-2 ${preferredTimes.length > 0 ? 'request-grid-3' : ''}`}
            >
              <label className="request-field">
                <span>{t.preferredDate}</span>
                <input
                  min={today}
                  type="date"
                  value={form.preferredDate}
                  onChange={(event) =>
                    updateField('preferredDate', event.target.value)
                  }
                  required
                />
              </label>
              {preferredTimes.length > 0 ? (
                <label className="request-field">
                  <span>{t.preferredTimeWindow}</span>
                  <select
                    disabled={loadingOptions}
                    value={form.preferredTimeId}
                    onChange={(event) =>
                      updateField('preferredTimeId', event.target.value)
                    }
                  >
                    {preferredTimes.map((time) => (
                      <option key={time.id} value={time.id}>
                        {time.name}
                        {time.startTime && time.endTime
                          ? ` (${time.startTime.slice(0, 5)} - ${time.endTime.slice(0, 5)})`
                          : ''}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="request-field">
                <span>{t.mediaOutput}</span>
                <select
                  value={form.mediaType}
                  onChange={(event) =>
                    updateField(
                      'mediaType',
                      event.target.value as FormState['mediaType'],
                    )
                  }
                >
                  <option value="IMAGE">{t.photoOption}</option>
                  <option value="VIDEO">{t.videoOption}</option>
                </select>
              </label>
            </div>
          </section>

          <section className="request-card-panel">
            <div className="request-section-title">
              <Icon name="camera" />
              <h2>{t.section4Title}</h2>
            </div>
            <div className="request-grid-2">
              {form.mediaType === 'IMAGE' ? (
                <label className="request-field">
                  <span>{t.numberOfPhotos}</span>
                  <input
                    min={1}
                    type="number"
                    value={form.numberOfPhoto}
                    onChange={(event) =>
                      updateField('numberOfPhoto', Number(event.target.value))
                    }
                  />
                </label>
              ) : (
                <label className="request-field">
                  <span>{t.videoDuration}</span>
                  <input
                    min={10}
                    type="number"
                    value={form.durationOfVideo}
                    onChange={(event) =>
                      updateField('durationOfVideo', Number(event.target.value))
                    }
                  />
                </label>
              )}
            </div>
          </section>

          <section className="request-card-panel">
            <div className="request-section-title">
              <Icon name="users" />
              <h2>{t.section5Title}</h2>
            </div>
            <div className="request-readonly-grid">
              <div className="request-readonly-item">
                <span>{t.customer}</span>
                <strong>{user?.fullName ?? t.currentCustomer}</strong>
                <small>{user?.email ?? t.signedInAccount}</small>
              </div>
              <div className="request-readonly-item">
                <span>{t.orderStatus}</span>
                <strong>PENDING</strong>
                <small>{t.createdAutomatically}</small>
              </div>
            </div>
          </section>
        </main>

        <aside className="request-summary-card">
          <div className="request-summary-head">
            <Icon name="clipboard" />
            <strong>{t.requestSummary}</strong>
          </div>
          <SummaryBlock title={t.serviceInformationLabel}>
            <strong>{selectedService?.name ?? t.selectService}</strong>
            <span>{form.title || t.untitledRequest}</span>
            <small>{form.description || t.noInspectionNotes}</small>
          </SummaryBlock>
          <SummaryBlock title={t.location}>
            <span>{form.address || 'Local simulation target'}</span>
            <small>
              {t.coordX(formatCoord(target?.x, t.notSelected))} ·{' '}
              {t.coordY(formatCoord(target?.y, t.notSelected))}
            </small>
            <small>
              {t.zone(
                target?.zone?.name ?? (target ? t.outsideZones : t.notSelected),
              )}
            </small>
            <div className="request-summary-map-preview">
              <img
                alt={t.selectedTarget}
                className={target ? 'request-summary-map-zoom' : undefined}
                src={mapImageUrl}
                style={
                  summaryMapImagePosition
                    ? {
                        height: `${summaryMapZoom * 100}%`,
                        left: `${50 - summaryMapImagePosition.xPercent * summaryMapZoom}%`,
                        top: `${50 - summaryMapImagePosition.yPercent * summaryMapZoom}%`,
                        width: `${summaryMapZoom * 100}%`,
                      }
                    : undefined
                }
              />
              {target ? (
                <span className="simulation-target-marker request-summary-target-marker" />
              ) : (
                <span className="request-summary-map-empty">
                  {t.selectTargetOnMap}
                </span>
              )}
            </div>
          </SummaryBlock>
          <SummaryBlock title={t.schedule}>
            <span>{form.preferredDate || t.noDateSelected}</span>
            <small>{selectedTime?.name ?? t.noTimeWindowSelected}</small>
          </SummaryBlock>
          <SummaryBlock title={t.mediaRequirements}>
            <span>
              {form.mediaType === 'IMAGE' ? t.photoOption : t.videoOption}
            </span>
            <small>
              {form.mediaType === 'IMAGE'
                ? t.photosCount(form.numberOfPhoto)
                : t.secondsCount(form.durationOfVideo)}
            </small>
          </SummaryBlock>
          <SummaryBlock title={t.contactInformation}>
            <span>{user?.fullName ?? t.currentCustomer}</span>
            <small>{user?.email ?? t.signedInAccount}</small>
          </SummaryBlock>
          <SummaryBlock title={t.orderStatus}>
            <span>{createdOrderId ? 'CREATED' : 'PENDING'}</span>
            <small>
              {createdOrderId
                ? t.requestCreatedSuccessfully
                : t.backendSetsStatus}
            </small>
          </SummaryBlock>
          {createdOrderId ? (
            <div className="request-summary-success">
              <strong>{t.requestCreatedTitle}</strong>
              <small>{t.waitingForReview}</small>
            </div>
          ) : null}
          <Button
            className="request-submit-button"
            disabled={!canSubmit}
            icon="arrow-right"
            type="submit"
          >
            {createdOrderId
              ? t.requestCreatedButton
              : submitting
                ? t.creating
                : t.createRequestButton}
          </Button>
        </aside>
      </form>
    </PortalLayout>
  )
}

function SummaryBlock({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="request-summary-block">
      <p>{title}</p>
      {children}
    </div>
  )
}
