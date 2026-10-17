import { useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { defineMessages, useI18n } from '../../../../../shared/i18n'
import { PriceBreakdownView } from '../../../../../shared/components/odm/PriceBreakdownView'
import {
  checklistPricingApi,
  type ServicePricePreview,
} from '../../../../../shared/api/checklistPricingApi'
import { catalogApi } from '../../../api/catalogApi'
import {
  CUSTOM_PROFILE,
  MEDIA_COMPONENTS,
  ROUNDING_MODES,
  isMediaRule,
  isTier,
  newMediaRule,
  validateMediaRules,
  type MediaRuleIssue,
} from '../../../lib/mediaPricingRules'
import type { MediaPricingComponent, PricingRule } from '../../../types/pricing'

const messages = defineMessages({
  vi: {
    title: 'Giá ảnh và video theo hồ sơ giá',
    intro:
      'Mỗi hồ sơ giá (pricing profile) gồm: giá phần media đã bao gồm trong checklist và bảng giá bậc thang cho phần media bổ sung. Phần bổ sung = max(0, số yêu cầu − số đã bao gồm). Hai khoản này tách biệt và mỗi khoản chỉ tính một lần.',
    includedSection: 'Media đã bao gồm (giá trọn gói của phần định mức)',
    extraSection: 'Media bổ sung (theo bậc, tính trên số lượng vượt định mức)',
    profile: 'Hồ sơ giá',
    component: 'Thành phần',
    price: 'Giá (VND)',
    pricePerBlock: 'Giá mỗi khối (VND)',
    from: 'Từ (vượt định mức)',
    to: 'Đến (trống = không giới hạn)',
    block: 'Kích thước khối',
    rounding: 'Làm tròn khối lẻ',
    allowance: 'Định mức mặc định (chỉ hồ sơ GENERIC_CUSTOMER_ADDED)',
    enabled: 'Bật',
    remove: 'Xóa',
    add: 'Thêm quy tắc',
    newProfile: 'Tên hồ sơ giá mới',
    empty: 'Chưa có quy tắc media.',
    CHECKLIST_BASE: 'Giá checklist khách thêm (GENERIC_CUSTOMER_ADDED)',
    INCLUDED_IMAGE: 'Ảnh đã bao gồm',
    INCLUDED_VIDEO: 'Video đã bao gồm',
    EXTRA_IMAGE: 'Ảnh bổ sung',
    EXTRA_VIDEO: 'Video bổ sung',
    CEILING: 'Làm tròn lên (tính trọn khối đã bắt đầu)',
    FLOOR: 'Làm tròn xuống (chỉ khối đầy đủ)',
    HALF_UP: 'Làm tròn gần nhất',
    customHint:
      'Hồ sơ GENERIC_CUSTOMER_ADDED áp dụng cho checklist khách hàng tự thêm ngoài danh mục. Nếu thiếu giá CHECKLIST_BASE, đơn sẽ bị từ chối thay vì tính 0 đồng.',
    problems: 'Cần sửa trước khi lưu',
    PROFILE: 'Hồ sơ giá chỉ gồm chữ, số, gạch dưới.',
    COMPONENT: 'Thiếu thành phần.',
    PRICE: 'Giá phải là số nguyên VND.',
    NEGATIVE: 'Không được âm.',
    BLOCK_SIZE: 'Kích thước khối là số nguyên từ 1.',
    RANGE: '"Đến" phải lớn hơn "Từ".',
    OVERLAP: 'Các bậc giá chồng lấn.',
    GAP: 'Các bậc giá phải liền nhau và bắt đầu từ 0.',
    OPEN_ENDED: 'Chỉ bậc cuối được để trống "Đến".',
    ALLOWANCE:
      'Định mức chỉ áp dụng cho ảnh/video đã bao gồm của hồ sơ GENERIC_CUSTOMER_ADDED (0–500).',
    previewTitle: 'Xem thử giá theo bản nháp đã lưu',
    previewService: 'Dịch vụ',
    previewButton: 'Xem thử',
    previewHint: 'Lưu bản nháp trước; bản xem thử dùng đúng bản nháp đã lưu.',
    previewError: 'Không thể xem thử giá.',
  },
  en: {
    title: 'Image and video prices per pricing profile',
    intro:
      'A pricing profile holds the price of the media allowance included in a checklist and a tiered price list for extra media. Extra = max(0, requested − included). The two are separate charges and each is billed exactly once.',
    includedSection: 'Included media (flat price of the allowance)',
    extraSection: 'Extra media (tiers over the quantity beyond the allowance)',
    profile: 'Pricing profile',
    component: 'Component',
    price: 'Price (VND)',
    pricePerBlock: 'Price per block (VND)',
    from: 'From (beyond allowance)',
    to: 'To (empty = unlimited)',
    block: 'Block size',
    rounding: 'Partial block rounding',
    allowance: 'Default allowance (GENERIC_CUSTOMER_ADDED profile only)',
    enabled: 'Enabled',
    remove: 'Remove',
    add: 'Add rule',
    newProfile: 'New pricing profile name',
    empty: 'No media rules yet.',
    CHECKLIST_BASE: 'Customer-added checklist price (GENERIC_CUSTOMER_ADDED)',
    INCLUDED_IMAGE: 'Included images',
    INCLUDED_VIDEO: 'Included videos',
    EXTRA_IMAGE: 'Extra images',
    EXTRA_VIDEO: 'Extra videos',
    CEILING: 'Round up (a started block is billed)',
    FLOOR: 'Round down (complete blocks only)',
    HALF_UP: 'Round to nearest',
    customHint:
      'The GENERIC_CUSTOMER_ADDED profile prices checklists a customer adds outside the catalog. Without a CHECKLIST_BASE price, such orders are rejected rather than priced at zero.',
    problems: 'Fix before saving',
    PROFILE: 'Profile may contain letters, digits and underscore only.',
    COMPONENT: 'Component is missing.',
    PRICE: 'Price must be a whole VND amount.',
    NEGATIVE: 'Must not be negative.',
    BLOCK_SIZE: 'Block size must be a whole number of at least 1.',
    RANGE: '"To" must be greater than "From".',
    OVERLAP: 'Price tiers overlap.',
    GAP: 'Price tiers must be contiguous and start at 0.',
    OPEN_ENDED: 'Only the last tier may leave "To" empty.',
    ALLOWANCE:
      'An allowance only applies to included images/videos of the GENERIC_CUSTOMER_ADDED profile (0-500).',
    previewTitle: 'Preview a price with the saved draft',
    previewService: 'Service',
    previewButton: 'Preview',
    previewHint: 'Save the draft first; the preview uses the saved draft.',
    previewError: 'Unable to preview the price.',
  },
})

export function MediaPricingEditor({
  rules,
  draftId,
  onChange,
}: {
  rules: PricingRule[]
  draftId: string
  onChange: (rules: PricingRule[]) => void
}) {
  const { t } = useI18n(messages)
  const [profile, setProfile] = useState('')
  const [component, setComponent] =
    useState<MediaPricingComponent>('INCLUDED_IMAGE')
  const problems = validateMediaRules(rules)
  const indexed = rules
    .map((rule, index) => ({ rule, index }))
    .filter((entry) => isMediaRule(entry.rule))
  const problemsFor = (index: number): MediaRuleIssue[] =>
    problems.filter((p) => p.index === index).map((p) => p.issue)
  const patch = (index: number, changes: Partial<PricingRule>) =>
    onChange(
      rules.map((rule, i) => (i === index ? { ...rule, ...changes } : rule)),
    )
  const num = (value: string): number | null =>
    value.trim() === '' ? null : Number(value)

  function row(rule: PricingRule, index: number) {
    const tier = isTier(rule)
    const issues = problemsFor(index)
    return (
      <div
        className="pricing-rule-row"
        key={rule.ruleKey}
        data-testid="media-rule"
      >
        <b>
          {rule.pricingProfile} · {t[rule.mediaComponent ?? 'INCLUDED_IMAGE']}
        </b>
        {tier && (
          <>
            <label>
              <span>{t.from}</span>
              <input
                type="number"
                min={0}
                value={rule.minValue ?? 0}
                onChange={(e) =>
                  patch(index, { minValue: num(e.target.value) ?? 0 })
                }
              />
            </label>
            <label>
              <span>{t.to}</span>
              <input
                type="number"
                min={1}
                value={rule.maxValue ?? ''}
                onChange={(e) =>
                  patch(index, { maxValue: num(e.target.value) })
                }
              />
            </label>
            <label>
              <span>{t.block}</span>
              <input
                type="number"
                min={1}
                value={rule.unitSize ?? ''}
                onChange={(e) =>
                  patch(index, { unitSize: num(e.target.value) })
                }
              />
            </label>
            <label>
              <span>{t.rounding}</span>
              <select
                value={rule.roundingMode ?? 'CEILING'}
                onChange={(e) =>
                  patch(index, {
                    roundingMode: e.target.value as PricingRule['roundingMode'],
                  })
                }
              >
                {ROUNDING_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {t[mode]}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <label>
          <span>{tier ? t.pricePerBlock : t.price}</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={rule.fixedAmount ?? ''}
            onChange={(e) => patch(index, { fixedAmount: num(e.target.value) })}
          />
        </label>
        {(rule.mediaComponent === 'INCLUDED_IMAGE' ||
          rule.mediaComponent === 'INCLUDED_VIDEO') &&
          rule.pricingProfile === CUSTOM_PROFILE && (
            <label>
              <span>{t.allowance}</span>
              <input
                type="number"
                min={0}
                max={500}
                value={rule.includedQuantity ?? ''}
                onChange={(e) =>
                  patch(index, { includedQuantity: num(e.target.value) })
                }
              />
            </label>
          )}
        <label>
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={(e) => patch(index, { enabled: e.target.checked })}
          />{' '}
          {t.enabled}
        </label>
        <button
          type="button"
          className="odm-btn odm-btn-sm"
          onClick={() => onChange(rules.filter((_, i) => i !== index))}
        >
          {t.remove}
        </button>
        {issues.length > 0 && (
          <ul role="alert" className="pricing-rule-issues">
            {issues.map((issue) => (
              <li key={issue}>{t[issue]}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const included = indexed.filter((e) => !isTier(e.rule))
  const extra = indexed.filter((e) => isTier(e.rule))
  return (
    <div className="pricing-rules" aria-label={t.title}>
      <h3>{t.title}</h3>
      <p>{t.intro}</p>
      <p>{t.customHint}</p>
      {indexed.length === 0 && <p>{t.empty}</p>}
      {included.length > 0 && <h4>{t.includedSection}</h4>}
      {included.map((e) => row(e.rule, e.index))}
      {extra.length > 0 && <h4>{t.extraSection}</h4>}
      {extra.map((e) => row(e.rule, e.index))}
      <div className="pricing-rule-row">
        <label>
          <span>{t.profile}</span>
          <input
            value={profile}
            placeholder={t.newProfile}
            onChange={(e) => setProfile(e.target.value)}
          />
        </label>
        <label>
          <span>{t.component}</span>
          <select
            value={component}
            onChange={(e) =>
              setComponent(e.target.value as MediaPricingComponent)
            }
          >
            {MEDIA_COMPONENTS.map((c) => (
              <option key={c} value={c}>
                {t[c]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="odm-btn"
          disabled={!/^[A-Za-z0-9_]{1,60}$/.test(profile.trim())}
          onClick={() => {
            onChange([...rules, newMediaRule(profile, component, rules)])
          }}
        >
          {t.add}
        </button>
      </div>
      {problems.length > 0 && (
        <p role="alert" className="pricing-rule-issues">
          {t.problems}: {problems.length}
        </p>
      )}
      <DraftPreview draftId={draftId} />
    </div>
  )
}

function DraftPreview({ draftId }: { draftId: string }) {
  const { t } = useI18n(messages)
  const services = useApiQuery((signal) => catalogApi.listServices(signal), [])
  const [serviceId, setServiceId] = useState('')
  const [preview, setPreview] = useState<ServicePricePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const selected = serviceId || services.data?.[0]?.id || ''
  async function run() {
    if (!selected) return
    setError(null)
    try {
      setPreview(
        await checklistPricingApi.adminPreview({
          serviceId: selected,
          policyId: draftId,
        }),
      )
    } catch {
      setPreview(null)
      setError(t.previewError)
    }
  }
  return (
    <section aria-label={t.previewTitle}>
      <h4>{t.previewTitle}</h4>
      <p>{t.previewHint}</p>
      <label>
        <span>{t.previewService}</span>
        <select value={selected} onChange={(e) => setServiceId(e.target.value)}>
          {(services.data ?? []).map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </label>{' '}
      <button type="button" className="odm-btn" onClick={() => void run()}>
        {t.previewButton}
      </button>
      {error && <p role="alert">{error}</p>}
      {preview && <PriceBreakdownView preview={preview} />}
    </section>
  )
}
