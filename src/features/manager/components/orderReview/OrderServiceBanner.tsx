import type { OrderDetail } from '../../types/orders'
import { OrderIcon, type OrderIconName } from './OrderIcon'
import './OrderServiceBanner.css'

export type OrderServiceBannerProps = {
  serviceName: string
  serviceDescription?: string | null
  serviceIcon?: OrderIconName | null
  currentStep: number
  totalSteps: number
  /** Real deliverable / result-format labels of the order. */
  deliverables?: string[] | null
  /** Label for the small "SERVICE" eyebrow, e.g. "DỊCH VỤ". */
  eyebrow: string
  /** Formats the step indicator, e.g. (1, 7) => "Bước 1/7". */
  stepLabel: (current: number, total: number) => string
}

function clean(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const VI_TERMS: Record<string, string> = {
  PHOTO: 'Ảnh',
  PHOTOS: 'Ảnh',
  IMAGE: 'Ảnh',
  IMAGES: 'Ảnh',
  VIDEO: 'Video',
  VIDEOS: 'Video',
  REPORT: 'Báo cáo',
  STREAMING: 'Phát trực tiếp',
  LIVESTREAM: 'Phát trực tiếp',
  ORTHOMOSAIC: 'Bản đồ trực giao',
  MODEL3D: 'Mô hình 3D',
  THERMAL: 'Ảnh nhiệt',
}

/** Backend deliverable names can be raw enum-like tokens (e.g. "PHOTO"). */
function localizeLabel(label: string, locale: 'vi-VN' | 'en-US') {
  if (locale !== 'vi-VN') return label
  return label.replace(
    /[A-Za-z0-9]+/g,
    (word) => VI_TERMS[word.toUpperCase()] ?? word,
  )
}

/** Unique, non-empty labels of what the order actually delivers. */
export function orderDeliverableLabels(
  order: OrderDetail,
  locale: 'vi-VN' | 'en-US' = 'vi-VN',
): string[] {
  const raw = [
    ...(order.deliverables ?? []).map((d) => d.deliverableTypeName),
    ...(order.resultFormats ?? []),
  ]
  const seen = new Set<string>()
  const labels: string[] = []
  for (const item of raw) {
    const raw = clean(item)
    const label = raw ? localizeLabel(raw, locale) : null
    const key = label?.toLowerCase()
    if (!label || !key || seen.has(key)) continue
    seen.add(key)
    labels.push(label)
  }
  return labels
}

function BannerBackground() {
  return <span className="odm-osb-bg" aria-hidden="true" />
}

function ServiceIdentity({
  name,
  description,
  icon,
  eyebrow,
}: {
  name: string
  description: string | null
  icon: OrderIconName
  eyebrow: string
}) {
  return (
    <div className="odm-osb-identity">
      <span className="odm-osb-icon" aria-hidden="true">
        <OrderIcon name={icon} size={30} />
      </span>
      <div className="odm-osb-text">
        <span className="odm-osb-eyebrow">{eyebrow}</span>
        <h2 className="odm-osb-title">{name}</h2>
        {description ? <p className="odm-osb-desc">{description}</p> : null}
      </div>
    </div>
  )
}

function ServiceDeliverableTags({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null
  return (
    <ul className="odm-osb-tags">
      {labels.map((label) => (
        <li key={label} className="odm-osb-tag">
          {label}
        </li>
      ))}
    </ul>
  )
}

function StepIndicator({ stepText }: { stepText: string }) {
  return (
    <div className="odm-osb-status">
      <span className="odm-osb-step">{stepText}</span>
    </div>
  )
}

export function OrderServiceBanner({
  serviceName,
  serviceDescription,
  serviceIcon,
  currentStep,
  totalSteps,
  deliverables,
  eyebrow,
  stepLabel,
}: OrderServiceBannerProps) {
  const name = clean(serviceName)
  const labels = deliverables ?? []
  return (
    <section className="odm-osb" aria-label={name ?? eyebrow}>
      <BannerBackground />
      <div className="odm-osb-main">
        {name ? (
          <ServiceIdentity
            name={name}
            description={clean(serviceDescription)}
            icon={serviceIcon ?? 'service'}
            eyebrow={eyebrow}
          />
        ) : null}
        <ServiceDeliverableTags labels={labels} />
      </div>
      <StepIndicator stepText={stepLabel(currentStep, totalSteps)} />
    </section>
  )
}
