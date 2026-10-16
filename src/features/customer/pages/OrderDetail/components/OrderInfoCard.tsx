import { useState, type ReactNode } from 'react'

import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { OrderIcon, type OrderIconName } from '../../../../manager/components/orderReview/OrderIcon'
import { useTimeslotLabel } from '../../../hooks/usePreferredTimes'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { fmtDate, fmtDateTime } from '../../../lib/orderStatus'
import { formatDateRange } from '../../../lib/orders/format'
import type { OrderDetailView } from '../../../lib/orders/types'
import { CardTitle } from './CardTitle'
import { orderInfoCardMessages } from './OrderInfoCard.messages'
import { OrderSectionEditor, type EditableOrderSection } from './OrderSectionEditor'

const DASH = '—'

const LABELS: Record<string, string> = {
  INTERNAL: 'Nội bộ', LEGAL: 'Pháp lý', PARTNER_REPORT: 'Báo cáo cho đối tác', OTHER: 'Khác',
  SURVEY_MONITORING: 'Đo đạc, khảo sát, giám sát từ trên cao', AGRICULTURE: 'Phục vụ nông nghiệp',
  CONSTRUCTION_MONITORING: 'Giám sát tiến độ công trình', INDUSTRIAL_INSPECTION: 'Kiểm tra nhà xưởng',
  AREA_MONITORING: 'Giám sát khu vực', FOREST_MONITORING: 'Giám sát tài nguyên rừng',
  NORMAL: 'Bình thường', HIGH: 'Cao', URGENT: 'Khẩn cấp', NONE: 'Không có',
  HAVE_PERMIT: 'Đã có giấy phép', NEED_SUPPORT: 'Cần hỗ trợ xin phép',
  WEEKLY: 'Hằng tuần', MONTHLY: 'Hằng tháng', AUTO_RESCHEDULE: 'Tự dời lịch',
  CONTACT_CUSTOMER: 'Liên hệ khách trước', CANCEL_ORDER: 'Huỷ yêu cầu',
  OWNER: 'Chủ sở hữu / Chủ đầu tư', AUTHORIZED_PERSON: 'Người được ủy quyền',
  CONTRACTOR: 'Nhà thầu / Đơn vị thi công', MANAGER_OR_SUPERVISOR: 'Đơn vị quản lý / Tư vấn giám sát',
  PHOTO: 'Ảnh', IMAGE: 'Ảnh', VIDEO: 'Video', PDF_REPORT: 'Báo cáo PDF', DOWNLOAD: 'Tải về', EMAIL: 'Email', API: 'API',
}
const label = (value: string | null) => value ? (LABELS[value] ?? value) : DASH
const join = (values: string[]) => values.length ? values.map((value) => LABELS[value] ?? value).join(', ') : DASH

function Field({
  icon,
  label,
  value,
  num,
  wide,
}: {
  icon: OrderIconName
  label: string
  value: string
  num?: boolean
  wide?: boolean
}) {
  return (
    <div className={wide ? 'od-field is-wide' : 'od-field'}>
      <span className="od-field-icon">
        <OrderIcon name={icon} size={16} />
      </span>
      <div className="od-field-body">
        <dt>{label}</dt>
        <dd className={num ? 'od-num' : undefined}>{value}</dd>
      </div>
    </div>
  )
}

function Section({
  icon,
  title,
  wide,
  onSupplement,
  editor,
  children,
}: {
  icon: OrderIconName
  title: string
  wide?: boolean
  onSupplement?: () => void
  editor?: ReactNode
  children: ReactNode
}) {
  return (
    <section className={wide ? 'od-info-section is-wide' : 'od-info-section'}>
      <div className="od-info-section-heading">
        <h3 className="od-info-section-title">
          <span className="od-card-icon">
            <OrderIcon name={icon} size={16} />
          </span>
          {title}
        </h3>
        {onSupplement ? (
          <button type="button" className="od-info-edit" onClick={onSupplement}>
            Chỉnh sửa
          </button>
        ) : null}
      </div>
      <dl className="od-info-list">{children}</dl>
      {editor}
    </section>
  )
}

export function OrderInfoCard({
  order,
  canEdit,
  onUpdated,
}: {
  order: OrderDetailView
  canEdit?: boolean
  onUpdated?: () => void
}) {
  const [editing, setEditing] = useState<EditableOrderSection | null>(null)
  const { t, locale, lang } = useI18n(orderInfoCardMessages)
  const timeLabel = useTimeslotLabel()
  const time =
    order.timeName || order.timeId ? timeLabel({ id: order.timeId, name: order.timeName }) : null
  const schedule = formatDateRange(order.dateFrom, order.dateTo, locale)
  const coordinates =
    order.latitude != null && order.longitude != null
      ? `${order.latitude}, ${order.longitude}`
      : DASH
  const editable = canEdit ?? ['PENDING', 'NEEDS_INFO', 'APPROVED'].includes(order.status)

  return (
    <Card title={<CardTitle icon="doc">{t.title}</CardTitle>}>
      <p className="od-info-subtitle">{t.subtitle}</p>
      <div className="od-info-sections">
        <Section icon="doc" title={t.sectionGeneral} wide onSupplement={editable ? () => setEditing('general') : undefined} editor={editing === 'general' ? <OrderSectionEditor section="general" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
          <Field
            icon="stack"
            label={t.service}
            value={
              order.serviceName
                ? localizeServiceName(order.serviceId ?? order.serviceName, lang, order.serviceName)
                : DASH
            }
          />
          <Field icon="calendar" label={t.createdAt} value={order.createdAt ? fmtDateTime(order.createdAt, locale) : DASH} />
          <Field icon="calendar" label={t.schedule} value={[schedule, time].filter(Boolean).join(' · ') || DASH} />
          <Field icon="clock" label={t.resultDeadline} value={order.resultDeadline ? fmtDate(order.resultDeadline, locale) : DASH} />
          <Field icon="pin" label={t.address} value={order.address ?? DASH} />
          <Field icon="info" label={t.priority} value={label(order.priority)} />
        </Section>
        <Section icon="drone" title={t.sectionScope} onSupplement={editable ? () => setEditing('scope') : undefined} editor={editing === 'scope' ? <OrderSectionEditor section="scope" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
          <Field icon="target" label={t.flightPurpose} value={label(order.flightPurpose)} />
          <Field icon="tag" label={t.usagePurpose} value={label(order.usagePurpose)} />
          <Field icon="locate" label={t.coordinates} value={coordinates} num />
          <Field icon="target" label={t.radius} value={order.radiusM != null ? `${order.radiusM} m` : DASH} num />
          <Field icon="altitude" label={t.altitude} value={order.altitudeM != null ? `${order.altitudeM} m` : DASH} num />
          <Field icon="radius" label={t.estimatedLength} value={order.estimatedLengthM != null ? `${order.estimatedLengthM} m` : DASH} num />
          <Field icon="refresh" label={t.recurrence} value={order.recurrenceType && order.recurrenceType !== 'NONE' ? `${label(order.recurrenceType)}${order.recurrenceOccurrences ? ` · ${t.times(order.recurrenceOccurrences)}` : ''}` : label(order.recurrenceType)} />
        </Section>
        <Section icon="pin" title={t.sectionSite} onSupplement={editable ? () => setEditing('site') : undefined} editor={editing === 'site' ? <OrderSectionEditor section="site" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
          <Field icon="user" label={t.siteContact} value={[order.siteContactName, order.siteContactPhone].filter(Boolean).join(' · ') || DASH} />
          <Field icon="info" label={t.accessNotes} value={order.accessNotes ?? DASH} />
          <Field icon="shield" label={t.relationship} value={label(order.monitoringRelationship)} />
          <Field icon="cloud" label={t.weatherFallback} value={label(order.weatherFallback)} />
        </Section>
        <Section icon="shield" title={t.sectionPermit} onSupplement={editable ? () => setEditing('permit') : undefined} editor={editing === 'permit' ? <OrderSectionEditor section="permit" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
          <Field icon="check" label={t.authorization} value={order.monitoringAuthorizationConfirmed ? t.yes : t.no} />
          <Field icon="shield" label={t.permitRequired} value={order.permitRequired == null ? DASH : order.permitRequired ? t.yes : t.no} />
          <Field icon="doc" label={t.permit} value={[label(order.permitStatus), order.permitNumber, order.permitZoneName].filter((value) => value && value !== DASH).join(' · ') || DASH} />
          <Field icon="calendar" label={t.permitExpiry} value={order.permitExpiresOn ? fmtDate(order.permitExpiresOn, locale) : DASH} />
          <Field icon="file" label={t.permitFiles} value={order.permitDocuments.map((file) => file.fileName).join(', ') || DASH} />
          <Field icon="file" label={t.authorizationFiles} value={order.monitoringAuthorizationDocuments.map((file) => file.documentName || file.fileName).join(', ') || DASH} />
        </Section>
        <Section icon="database" title={t.sectionResult} onSupplement={editable ? () => setEditing('result') : undefined} editor={editing === 'result' ? <OrderSectionEditor section="result" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
          <Field icon="media" label={t.resultFormats} value={join(order.resultFormats)} />
          <Field icon="download" label={t.deliveryMethods} value={join(order.deliveryMethods)} />
          <Field icon="clock" label={t.retention} value={order.dataRetentionDays != null ? t.days(order.dataRetentionDays) : DASH} />
          <Field icon="check" label={t.terms} value={order.termsAcceptedAt ? `${fmtDateTime(order.termsAcceptedAt, locale)}${order.termsVersion ? ` · ${t.termsVersion(order.termsVersion)}` : ''}` : DASH} />
        </Section>
        {order.description && (
          <Section icon="file" title={t.description} onSupplement={editable ? () => setEditing('description') : undefined} editor={editing === 'description' ? <OrderSectionEditor section="description" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
            <p className="od-desc-text">{order.description}</p>
          </Section>
        )}
      </div>
    </Card>
  )
}
