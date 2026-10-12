import type {
  CreateOrderPayload,
  GeoJsonPolygon,
  ServicePricingEstimate,
} from '../../api/customerApi'
import { toNumber, truncateText } from './format'
import type { AiScore, FormState } from './types'

export const ORDER_TITLE_MAX_LENGTH = 255
export const DEFAULT_LATITUDE = 10.6402
export const DEFAULT_LONGITUDE = 106.6912

/**
 * Backend-facing copy (stored in the order requirement / description). It is
 * data sent to the BE and the operator, not UI chrome, so it stays Vietnamese
 * regardless of the UI language.
 */
export const AI_IMAGE_ANALYSIS_DESCRIPTION =
  'Yêu cầu bổ sung: sử dụng AI phân tích hình ảnh để hỗ trợ phát hiện và đánh dấu các dấu hiệu bất thường.'
const AI_IMAGE_ANALYSIS_REQUIREMENT =
  'AI phân tích hình ảnh để hỗ trợ phát hiện và đánh dấu các dấu hiệu bất thường.'

/** Estimated monitored area in hectares (string, 1 decimal). */
export function calcArea(radiusM: number) {
  return ((Math.PI * radiusM * radiusM) / 10000).toFixed(1)
}

export function buildCoverageArea(
  longitude: number,
  latitude: number,
  radiusM: number,
): GeoJsonPolygon {
  const points = 24
  const latDelta = radiusM / 111_320
  const lonDelta = radiusM / (111_320 * Math.cos((latitude * Math.PI) / 180))
  const ring: number[][] = []

  for (let i = 0; i < points; i += 1) {
    const angle = (Math.PI * 2 * i) / points
    ring.push([
      Number((longitude + Math.cos(angle) * lonDelta).toFixed(7)),
      Number((latitude + Math.sin(angle) * latDelta).toFixed(7)),
    ])
  }
  ring.push(ring[0])

  return { type: 'Polygon', coordinates: [ring] }
}

/** Adds or removes the AI-analysis add-on sentence in the description. */
export function syncAiAddonDescription(
  description: string,
  requested: boolean,
): string {
  const hasAddon = description.includes(AI_IMAGE_ANALYSIS_DESCRIPTION)
  if (requested && !hasAddon) {
    return [description.trim(), AI_IMAGE_ANALYSIS_DESCRIPTION]
      .filter(Boolean)
      .join('\n')
  }
  if (!requested && hasAddon) {
    return description
      .replace(AI_IMAGE_ANALYSIS_DESCRIPTION, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
  return description
}

export function aiAddonPrice(estimate: ServicePricingEstimate | null) {
  return (
    estimate?.additionalRequirements.find(
      (item) => item.type === 'AI_IMAGE_ANALYSIS',
    )?.additionalPrice ?? 0
  )
}

/** `POST /api/orders` body (BE `OrderCreateRequest`). */
export function buildOrderPayload(input: {
  form: FormState
  consultationId?: string
  score: AiScore
  aiAnalysisRequested: boolean
  pricingEstimate: ServicePricingEstimate | null
}): CreateOrderPayload {
  const { form, aiAnalysisRequested } = input
  const latitude = toNumber(form.latitude, DEFAULT_LATITUDE)
  const longitude = toNumber(form.longitude, DEFAULT_LONGITUDE)
  const permitStatus = form.permitStatus
  const lengthM = toNumber(form.estimatedLengthM, 0)
  return {
    title: truncateText(form.title, ORDER_TITLE_MAX_LENGTH),
    description: form.description.trim() || undefined,
    serviceId: form.serviceId,
    usagePurpose: form.usagePurpose || undefined,
    flightPurpose: form.flightPurpose,
    priority: form.priority,
    address: form.address.trim(),
    longitude,
    latitude,
    altitudeM: form.altitudeM,
    estimatedLengthM: lengthM > 0 ? lengthM : undefined,
    siteContactName: form.siteContactName.trim() || undefined,
    siteContactPhone: form.siteContactPhone.trim() || undefined,
    accessNotes: form.accessNotes.trim() || undefined,
    permitStatus,
    permitNumber:
      permitStatus === 'HAVE_PERMIT' ? form.permitNumber.trim() || undefined : undefined,
    permitExpiresOn:
      permitStatus === 'HAVE_PERMIT' ? form.permitExpiresOn || undefined : undefined,
    permitDocuments:
      permitStatus === 'HAVE_PERMIT'
        ? form.permitDocuments.map((file) => ({
            id: file.id,
            fileName: file.fileName,
            contentType: file.contentType,
            sizeBytes: file.sizeBytes,
            dataUrl: file.dataUrl,
          }))
        : undefined,
    monitoringRelationship: form.monitoringRelationship || undefined,
    monitoringAuthorizationConfirmed:
      form.monitoringAuthorizationConfirmed,
    monitoringAuthorizationDocuments:
      form.monitoringAuthorizationDocuments.length > 0
        ? form.monitoringAuthorizationDocuments.map((document) => ({
            id: document.id,
            documentType: document.documentType,
            documentName: document.documentName.trim(),
            fileName: document.fileName,
            contentType: document.contentType,
            sizeBytes: document.sizeBytes,
            dataUrl: document.dataUrl,
            notes: document.notes.trim() || undefined,
          }))
        : undefined,
    coverageArea: buildCoverageArea(longitude, latitude, form.radiusM),
    preferredDateFrom: form.preferredDateFrom,
    preferredDateTo: form.preferredDateTo,
    preferredTimeId: form.preferredTimeId,
    recurrenceType: form.recurrenceType,
    recurrenceOccurrences:
      form.recurrenceType === 'NONE' ? undefined : form.recurrenceOccurrences,
    weatherFallback: form.weatherFallback,
    resultDeadline: form.resultDeadline || undefined,
    resultFormats: form.resultFormats,
    deliveryMethods: form.deliveryMethods,
    dataRetentionDays: form.dataRetentionDays,
    termsAccepted: form.termsAccepted,
    deliverables: [
      {
        deliverableTypeId: form.deliverableTypeId,
        requirement: {
          mediaType: form.mediaType,
          quantity: form.quantity,
          resolution: form.resolution,
          radiusM: form.radiusM,
          estimatedAreaHa: Number(calcArea(form.radiusM)),
          areaFiles: form.areaFiles.map((file) => ({
            id: file.id,
            fileName: file.fileName,
            contentType: file.contentType,
            sizeBytes: file.sizeBytes,
            dataUrl: file.dataUrl,
          })),
          customerAttachments: form.attachments.map((attachment) => ({
            id: attachment.id,
            fileName: attachment.fileName,
            contentType: attachment.contentType,
            sizeBytes: attachment.sizeBytes,
            dataUrl: attachment.dataUrl,
          })),
          usagePurpose: form.usagePurpose || undefined,
          priority: form.priority,
          consultationId: input.consultationId,
          readinessScore: input.score.score,
          aiAnalysisRequested,
          additionalRequirements: aiAnalysisRequested
            ? [
                {
                  type: 'AI_IMAGE_ANALYSIS',
                  description: AI_IMAGE_ANALYSIS_REQUIREMENT,
                  additionalPrice: aiAddonPrice(input.pricingEstimate),
                },
              ]
            : [],
        },
      },
    ],
  }
}
