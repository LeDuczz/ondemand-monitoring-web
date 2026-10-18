import {
  newMediaRule,
  validateMediaRules,
} from '../../../lib/mediaPricingRules'
import type { MediaPricingComponent, PricingRule } from '../../../types/pricing'

type Kind = {
  component: Extract<MediaPricingComponent, 'EXTRA_IMAGE' | 'EXTRA_VIDEO'>
  title: string
  noun: string
}

const KINDS: Kind[] = [
  { component: 'EXTRA_IMAGE', title: 'Ảnh vượt định mức', noun: 'ảnh' },
  { component: 'EXTRA_VIDEO', title: 'Video vượt định mức', noun: 'video' },
]

const SHARED_PROFILE = 'DEFAULT'

const isShared = (rule: PricingRule, component: MediaPricingComponent) =>
  rule.category === 'MEDIA' &&
  (rule.pricingProfile ?? '').toUpperCase() === SHARED_PROFILE &&
  !rule.checklistDefinitionId &&
  rule.mediaComponent === component

export const ISSUES: Record<string, string> = {
  PROFILE: 'Hồ sơ giá chỉ gồm chữ, số, gạch dưới.',
  COMPONENT: 'Thiếu thành phần giá.',
  ALLOWANCE:
    'Định mức đã bao gồm không hợp lệ (số nguyên 0–500, chỉ cho yêu cầu bổ sung).',
  PRICE: 'Nhập giá là số nguyên.',
  NEGATIVE: 'Không được âm.',
  BLOCK_SIZE: 'Kích thước khối phải là số nguyên từ 1.',
  RANGE: '"Đến" phải lớn hơn "Từ".',
  OVERLAP: 'Các bậc chồng lên nhau.',
  GAP: 'Các bậc phải liền nhau, bắt đầu từ 0.',
  OPEN_ENDED: 'Chỉ bậc cuối được để trống "Đến".',
}

/**
 * The price list for images and videos above the allowance, shared by every checklist and by customer-added work.
 * Only this one list is shown here; per-profile and per-checklist lists live in the advanced tab.
 */
export function SharedMediaTiers({
  rules,
  onChange,
}: {
  rules: PricingRule[]
  onChange: (rules: PricingRule[]) => void
}) {
  const problems = validateMediaRules(rules)
  const patch = (index: number, changes: Partial<PricingRule>) =>
    onChange(
      rules.map((rule, i) => (i === index ? { ...rule, ...changes } : rule)),
    )
  const num = (value: string): number | null =>
    value.trim() === '' ? null : Number(value)

  return (
    <div className="ppd-media">
      {KINDS.map((kind) => {
        const rows = rules
          .map((rule, index) => ({ rule, index }))
          .filter((entry) => isShared(entry.rule, kind.component))
          .sort((a, b) => (a.rule.minValue ?? 0) - (b.rule.minValue ?? 0))
        return (
          <fieldset key={kind.component} className="ppd-tier-group">
            <legend>{kind.title}</legend>
            {rows.length === 0 && (
              <p className="ppo-empty">
                Chưa có bậc giá. Ảnh/video vượt định mức sẽ không tính được cho
                đến khi thêm.
              </p>
            )}
            {rows.map(({ rule, index }) => {
              const own = problems.filter((p) => p.index === index)
              return (
                <div
                  className="ppd-tier"
                  key={rule.ruleKey}
                  data-testid="shared-tier"
                >
                  <label>
                    <span>Từ ({kind.noun})</span>
                    <input
                      type="number"
                      min={0}
                      value={rule.minValue ?? 0}
                      aria-label={`${kind.title}: từ`}
                      onChange={(e) =>
                        patch(index, { minValue: num(e.target.value) ?? 0 })
                      }
                    />
                  </label>
                  <label>
                    <span>Đến ({kind.noun})</span>
                    <input
                      type="number"
                      min={1}
                      placeholder="Không giới hạn"
                      value={rule.maxValue ?? ''}
                      aria-label={`${kind.title}: đến`}
                      onChange={(e) =>
                        patch(index, { maxValue: num(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    <span>Mỗi khối ({kind.noun})</span>
                    <input
                      type="number"
                      min={1}
                      value={rule.unitSize ?? ''}
                      aria-label={`${kind.title}: kích thước khối`}
                      onChange={(e) =>
                        patch(index, { unitSize: num(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    <span>Giá mỗi khối (VND)</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={rule.fixedAmount ?? ''}
                      aria-label={`${kind.title}: giá mỗi khối`}
                      onChange={(e) =>
                        patch(index, { fixedAmount: num(e.target.value) })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="odm-btn odm-btn-sm"
                    aria-label={`Xóa bậc ${kind.noun} từ ${rule.minValue ?? 0}`}
                    onClick={() =>
                      onChange(rules.filter((_, i) => i !== index))
                    }
                  >
                    Xóa
                  </button>
                  {own.length > 0 && (
                    <ul role="alert" className="ppd-issues">
                      {own.map((p) => (
                        <li key={p.issue}>{ISSUES[p.issue] ?? p.issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
            <button
              type="button"
              className="odm-btn odm-btn-sm"
              onClick={() =>
                onChange([
                  ...rules,
                  newMediaRule(SHARED_PROFILE, kind.component, rules),
                ])
              }
            >
              + Thêm bậc {kind.noun}
            </button>
          </fieldset>
        )
      })}
    </div>
  )
}
