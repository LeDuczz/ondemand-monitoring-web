import { Modal } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { ServiceOption, ServicePricingEstimate } from '../../../api/customerApi'
import { formatMoney } from '../../../lib/createOrder/format'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import type { FormState } from '../../../lib/createOrder/types'
import { confirmSubmitModalMessages } from './ConfirmSubmitModal.messages'

type Props = {
  form: FormState
  service?: ServiceOption
  pricingEstimate: ServicePricingEstimate | null
  submitting: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
}

/** Prominent final confirmation before `POST /api/orders`. */
export function ConfirmSubmitModal(p: Props) {
  const { t, locale, lang } = useI18n(confirmSubmitModalMessages)
  const { form } = p

  const footer = (
    <>
      <button type="button" className="odm-btn odm-btn-gh" onClick={p.onClose} disabled={p.submitting}>
        {t.back}
      </button>
      <button type="button" className="odm-btn odm-btn-p" onClick={p.onConfirm} disabled={p.submitting}>
        {p.submitting ? t.submitting : t.confirm}
      </button>
    </>
  )

  return (
    <Modal
      title={t.title}
      subtitle={t.subtitle}
      icon="check"
      tone="primary"
      width={560}
      onClose={p.onClose}
      footer={footer}
    >
      <p className="co-hint"><strong>{form.title}</strong></p>
      <dl className="co-rows co-mt">
        <dt>{t.service}</dt>
        <dd>{p.service ? localizeServiceName(p.service.id, lang, p.service.name) : '—'}</dd>
        <dt>{t.location}</dt>
        <dd>{form.address || '—'}</dd>
        <dt>{t.dates}</dt>
        <dd className="co-mono">{`${form.preferredDateFrom} → ${form.preferredDateTo}`}</dd>
      </dl>
      <div className="co-confirm-total co-row-between">
        <span>{t.total}</span>
        <span>
          {p.pricingEstimate ? formatMoney(p.pricingEstimate.totalPrice, locale) : t.totalUnknown}
        </span>
      </div>
      <p className="co-hint co-mt">{t.note}</p>
      {p.error && <div className="co-notice is-danger co-mt" role="alert">{p.error}</div>}
    </Modal>
  )
}
