import { useState } from 'react'
import { managerHref } from '../../../routes'
import { formatOrderCode } from '../../../components/common/format'
import type { OrderCreateResponse } from '../../../types/orders'
import { Card } from '../../../../../shared/components/ui'
import { useI18n, type Language } from '../../../../../shared/i18n'
import { localizeTimeslot } from '../../../../customer/lib/i18n/timeslots'
import { approvedOrdersSectionMessages } from './ApprovedOrdersSection.messages'

const PREVIEW_COUNT = 5

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(locale)
}

/** BE slot names are Vietnamese; localize for EN, keep VI untouched. */
function slotText(name: string | null | undefined, lang: Language) {
  if (!name || lang === 'vi') return name
  return localizeTimeslot({ name }, lang)
}

function scheduleText(
  order: OrderCreateResponse,
  locale: string,
  lang: Language,
) {
  const from = formatDate(order.preferredDateFrom, locale)
  const to = formatDate(order.preferredDateTo, locale)
  const range = from && to && from !== to ? `${from} – ${to}` : from || to
  return [range, slotText(order.preferredTimeName, lang)].filter(Boolean).join(' · ')
}

export function ApprovedOrdersSection({
  showApprovedOrders,
  setupOrders,
}: {
  showApprovedOrders: boolean
  setupOrders: OrderCreateResponse[]
}) {
  const { t, locale, lang } = useI18n(approvedOrdersSectionMessages)
  const [expanded, setExpanded] = useState(false)
  if (!showApprovedOrders || setupOrders.length === 0) return null
  const visible = expanded ? setupOrders : setupOrders.slice(0, PREVIEW_COUNT)
  return (
    <Card title={t.title(setupOrders.length)}>
      <ul className="mng-order-list">
        {visible.map((order) => {
          const code = formatOrderCode(order.orderCode ?? order.id)
          const meta = [order.serviceName, order.customerName]
            .filter(Boolean)
            .join(' · ')
          return (
            <li key={order.id} className="mng-order-item">
              <div className="mng-order-text">
                <div className="mng-cell-main odm-mono">{code}</div>
                {meta && <div className="mng-cell-sub">{meta}</div>}
                <div className="mng-cell-sub">{scheduleText(order, locale, lang)}</div>
              </div>
              <a
                className="odm-btn odm-btn-sm odm-btn-p"
                href={managerHref({ screen: 'orderReview', orderId: order.id })}
                aria-label={t.actionAria(code)}
              >
                {t.action}
              </a>
            </li>
          )
        })}
      </ul>
      {setupOrders.length > PREVIEW_COUNT && (
        <button
          type="button"
          className="mng-link-btn"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? t.showLess : t.showAll(setupOrders.length)}
        </button>
      )}
    </Card>
  )
}
