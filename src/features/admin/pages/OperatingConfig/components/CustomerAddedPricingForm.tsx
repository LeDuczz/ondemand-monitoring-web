import { defineMessages, useI18n } from '../../../../../shared/i18n'
import { CUSTOM_PROFILE, newMediaRule } from '../../../lib/mediaPricingRules'
import type { MediaPricingComponent, PricingRule } from '../../../types/pricing'

const messages = defineMessages({
  vi: {
    title: 'Giá yêu cầu bổ sung',
    hint: 'Nội dung khách tự thêm ngoài danh mục. Giá = giá nền + diện tích vượt định mức + ảnh vượt định mức + video vượt định mức. Ảnh/video vượt định mức dùng chung Bảng giá media bên dưới.',
    basePrice: 'Giá nền (VND)',
    includedImages: 'Số ảnh đã bao gồm',
    includedVideos: 'Số video đã bao gồm',
    includedArea: 'Diện tích đã bao gồm (ha)',
    extraArea: 'Phụ thu mỗi ha vượt định mức (VND)',
    formula:
      'Ví dụ: đơn 8,5 ha với định mức 5 ha tính phụ thu cho 3,5 ha. Đơn lặp N lần tính giá N lần.',
    invalid: 'Nhập số nguyên không âm.',
  },
  en: {
    title: 'Customer-added requirement price',
    hint: 'Work a customer adds outside the catalog. Price = base price + area above the allowance + images above the allowance + videos above the allowance. Extra images and videos use the shared media price list below.',
    basePrice: 'Base price (VND)',
    includedImages: 'Included images',
    includedVideos: 'Included videos',
    includedArea: 'Included area (ha)',
    extraArea: 'Surcharge per extra hectare (VND)',
    formula:
      'Example: an 8.5 ha order with a 5 ha allowance is charged for 3.5 ha. An order repeated N times is priced N times.',
    invalid: 'Enter a non-negative whole number.',
  },
})

type Field = {
  key: string
  component: MediaPricingComponent
  /** Whether the number lives in the price or in the rule's included quantity. */
  target: 'price' | 'allowance'
  label:
    | 'basePrice'
    | 'includedImages'
    | 'includedVideos'
    | 'includedArea'
    | 'extraArea'
  step: number
}

const FIELDS: Field[] = [
  {
    key: 'base',
    component: 'CHECKLIST_BASE',
    target: 'price',
    label: 'basePrice',
    step: 1000,
  },
  {
    key: 'images',
    component: 'INCLUDED_IMAGE',
    target: 'allowance',
    label: 'includedImages',
    step: 1,
  },
  {
    key: 'videos',
    component: 'INCLUDED_VIDEO',
    target: 'allowance',
    label: 'includedVideos',
    step: 1,
  },
  {
    key: 'area',
    component: 'INCLUDED_AREA',
    target: 'allowance',
    label: 'includedArea',
    step: 1,
  },
  {
    key: 'rate',
    component: 'EXTRA_AREA',
    target: 'price',
    label: 'extraArea',
    step: 1000,
  },
]

export const isCustomerAddedRule = (rule: PricingRule) =>
  rule.category === 'MEDIA' &&
  (rule.pricingProfile ?? '').toUpperCase() === CUSTOM_PROFILE &&
  FIELDS.some((field) => field.component === rule.mediaComponent)

const find = (rules: PricingRule[], component: MediaPricingComponent) =>
  rules.findIndex(
    (rule) =>
      rule.category === 'MEDIA' &&
      (rule.pricingProfile ?? '').toUpperCase() === CUSTOM_PROFILE &&
      rule.mediaComponent === component &&
      !rule.checklistDefinitionId,
  )

/**
 * The few numbers that price customer-added work, in plain words. They are ordinary rules of the customer-added profile
 * in the draft policy, so saving, publishing and versioning work exactly as for every other rule.
 */
export function CustomerAddedPricingForm({
  rules,
  onChange,
  disabled = false,
}: {
  rules: PricingRule[]
  onChange: (rules: PricingRule[]) => void
  disabled?: boolean
}) {
  const { t } = useI18n(messages)

  function valueOf(field: Field): string {
    const index = find(rules, field.component)
    if (index < 0) return ''
    const rule = rules[index]
    const value =
      field.target === 'price' ? rule.fixedAmount : rule.includedQuantity
    return value == null ? '' : String(value)
  }

  function update(field: Field, raw: string) {
    const number = raw.trim() === '' ? null : Number(raw)
    const index = find(rules, field.component)
    if (index < 0) {
      if (number == null) return
      const created = newMediaRule(CUSTOM_PROFILE, field.component, rules)
      onChange([
        ...rules,
        field.target === 'price'
          ? { ...created, fixedAmount: number }
          : { ...created, fixedAmount: 0, includedQuantity: number },
      ])
      return
    }
    onChange(
      rules.map((rule, i) =>
        i !== index
          ? rule
          : field.target === 'price'
            ? { ...rule, fixedAmount: number }
            : { ...rule, includedQuantity: number },
      ),
    )
  }

  const invalid = (raw: string) =>
    raw !== '' && (!/^\d+$/.test(raw) || Number(raw) < 0)

  return (
    <section className="pricing-customer-added" aria-label={t.title}>
      <h4>{t.title}</h4>
      <p>{t.hint}</p>
      <div className="pricing-customer-added-grid">
        {FIELDS.map((field) => {
          const raw = valueOf(field)
          const id = `customer-added-${field.key}`
          return (
            <label key={field.key} htmlFor={id}>
              <span>{t[field.label]}</span>
              <input
                id={id}
                type="number"
                min={0}
                step={field.step}
                inputMode="numeric"
                disabled={disabled}
                value={raw}
                aria-invalid={invalid(raw)}
                onChange={(event) => update(field, event.target.value)}
              />
              {invalid(raw) && <small role="alert">{t.invalid}</small>}
            </label>
          )
        })}
      </div>
      <p className="pricing-customer-added-note">{t.formula}</p>
    </section>
  )
}
