import { useState } from 'react'

import {
  pricingDescription,
  pricingLabel,
  pricingPolicyName,
} from '../../../../../shared/lib/pricingPresentation'
import { MediaPricingEditor } from './MediaPricingEditor'
import { CustomerAddedPricingForm } from './CustomerAddedPricingForm'
import { ISSUES, SharedMediaTiers } from './SharedMediaTiers'
import { isMediaRule, validateMediaRules } from '../../../lib/mediaPricingRules'
import type { PricingPolicy, PricingRule } from '../../../types/pricing'
import './pricingPolicyOverview.css'
import './pricingDraftEditor.css'

type Tab = 'common' | 'advanced'

/**
 * Edits a draft policy. What admins change most (limits, customer-added prices, the shared media price list) is on the
 * first page; the full rule list, grouped and folded, and per-profile media prices are on the second.
 */
export function PricingDraftEditor({
  draft,
  setDraft,
  busy,
  dirty,
  onSave,
  onPublish,
  onCancel,
}: {
  draft: PricingPolicy
  setDraft: (policy: PricingPolicy) => void
  busy: boolean
  /** Edits not yet saved on the server. */
  dirty: boolean
  onSave: () => void
  onPublish: () => void
  onCancel: () => void
}) {
  const [tab, setTab] = useState<Tab>('common')
  const [opened, setOpened] = useState<string[]>([])
  const problems = validateMediaRules(draft.rules)
  const mediaValid = problems.length === 0
  const guardrailsValid =
    draft.highRiskDiscountPercent <= draft.managerMaxDiscountPercent
  const canSubmit = mediaValid && guardrailsValid
  const rules = draft.rules
  const ordinary = rules.filter((rule) => !isMediaRule(rule))

  function updateRule(index: number, changes: Partial<PricingRule>) {
    setDraft({
      ...draft,
      rules: draft.rules.map((rule, i) =>
        i === index ? { ...rule, ...changes } : rule,
      ),
    })
  }
  function addRule() {
    setOpened((current) =>
      current.includes('AREA') ? current : [...current, 'AREA'],
    )
    setDraft({
      ...draft,
      rules: [
        ...draft.rules,
        {
          category: 'AREA',
          calculationType: 'PER_BLOCK',
          ruleKey: `NEW_RULE_${draft.rules.length + 1}`,
          description: 'Quy tắc mới',
          minValue: 0,
          maxValue: null,
          fixedAmount: 0,
          baseAmount: null,
          percentage: null,
          unitSize: 1,
          multiplier: null,
          priority: draft.rules.length,
          enabled: true,
          roundingMode: 'CEILING',
        },
      ],
    })
  }
  function removeRule(index: number) {
    setDraft({
      ...draft,
      rules: draft.rules
        .filter((_, i) => i !== index)
        .map((rule, priority) => ({ ...rule, priority })),
    })
  }

  const renderRule = (rule: PricingRule, index: number) => (
    <div className="pricing-rule-row" key={`${rule.category}-${rule.ruleKey}`}>
      <label>
        <span>Nhóm giá</span>
        <select
          value={rule.category}
          onChange={(event) =>
            updateRule(index, {
              category: event.target.value as PricingRule['category'],
              roundingMode: ['AREA', 'DISTANCE', 'ALTITUDE'].includes(
                event.target.value,
              )
                ? rule.roundingMode
                : null,
            })
          }
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {pricingLabel(category)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Cách tính</span>
        <select
          value={rule.calculationType}
          onChange={(event) => {
            const calculationType = event.target
              .value as PricingRule['calculationType']
            const block = ['PER_BLOCK', 'TIERED_BLOCK'].includes(
              calculationType,
            )
            updateRule(index, {
              calculationType,
              unitSize: block ? (rule.unitSize ?? 1) : null,
              roundingMode: block ? rule.roundingMode : null,
            })
          }}
        >
          {calculationTypes.map((calculationType) => (
            <option key={calculationType} value={calculationType}>
              {pricingLabel(calculationType)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Mã quy tắc</span>
        <input
          value={rule.ruleKey}
          onChange={(event) =>
            updateRule(index, { ruleKey: event.target.value })
          }
        />
      </label>
      <input
        aria-label={`Mô tả ${pricingLabel(rule.ruleKey)}`}
        value={pricingDescription(rule.description)}
        onChange={(e) => updateRule(index, { description: e.target.value })}
      />
      <NumberField
        label="Giá trị tối thiểu"
        value={rule.minValue ?? 0}
        onChange={(v) => updateRule(index, { minValue: v })}
      />
      {isDimensionBlockRule(rule) ? (
        <label>
          <span>Làm tròn</span>
          <select
            value={rule.roundingMode ?? 'CEILING'}
            onChange={(event) =>
              updateRule(index, {
                roundingMode: event.target.value as NonNullable<
                  PricingRule['roundingMode']
                >,
              })
            }
          >
            <option value="CEILING">Làm tròn lên</option>
            <option value="FLOOR">Làm tròn xuống</option>
            <option value="HALF_UP">Làm tròn gần nhất</option>
          </select>
        </label>
      ) : null}
      <NumberField
        label="Giá trị tối đa"
        value={rule.maxValue ?? 0}
        onChange={(v) => updateRule(index, { maxValue: v || null })}
      />
      <NumberField
        label="Kích thước mỗi đơn vị"
        value={rule.unitSize ?? 0}
        onChange={(v) => updateRule(index, { unitSize: v || null })}
      />
      <NumberField
        label="Số tiền cố định"
        value={rule.fixedAmount ?? 0}
        onChange={(v) => updateRule(index, { fixedAmount: v })}
      />
      <NumberField
        label="Mức giá cơ sở"
        value={rule.baseAmount ?? 0}
        onChange={(v) => updateRule(index, { baseAmount: v })}
      />
      <NumberField
        label="Tỷ lệ phần trăm"
        value={rule.percentage ?? 0}
        onChange={(v) => updateRule(index, { percentage: v })}
      />
      <NumberField
        label="Hệ số"
        value={rule.multiplier ?? 0}
        onChange={(v) => updateRule(index, { multiplier: v })}
      />
      <label>
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={(event) =>
            updateRule(index, { enabled: event.target.checked })
          }
        />
        Đang bật
      </label>
      <button
        className="odm-btn"
        type="button"
        onClick={() => removeRule(index)}
      >
        Xóa quy tắc
      </button>
    </div>
  )

  const groups = categories
    .map((category) => ({
      category,
      items: rules
        .map((rule, index) => ({ rule, index }))
        .filter(
          (entry) =>
            !isMediaRule(entry.rule) && entry.rule.category === category,
        ),
    }))
    .filter((group) => group.items.length > 0)

  const actions = (
    <div className="ppd-actions">
      <button className="odm-btn" disabled={busy} onClick={onCancel}>
        {dirty ? 'Hủy thay đổi' : 'Đóng'}
      </button>
      <button
        className="odm-btn"
        disabled={busy || !canSubmit}
        onClick={onSave}
      >
        Lưu bản nháp
      </button>
      <button
        className="odm-btn odm-btn-p"
        disabled={busy || !canSubmit}
        onClick={onPublish}
      >
        Phát hành
      </button>
    </div>
  )

  return (
    <div className="ppd">
      <div className="ppd-bar">
        <div>
          <span className="ppo-eyebrow is-draft">Bản nháp</span>
          <h3>Phiên bản {draft.version}</h3>
        </div>
        {actions}
      </div>
      {!mediaValid && (
        <div role="alert" className="ppd-warning">
          <p>
            Có bậc giá media chưa hợp lệ. Sửa các lỗi dưới đây trước khi lưu
            hoặc phát hành:
          </p>
          <ul>
            {problems.map((problem) => {
              const rule = draft.rules[problem.index]
              return (
                <li key={`${problem.index}-${problem.issue}`}>
                  <b>
                    {rule.pricingProfile ?? '?'} · {rule.mediaComponent ?? '?'}
                    {rule.checklistDefinitionName
                      ? ` · ${rule.checklistDefinitionName}`
                      : ''}{' '}
                    ({rule.minValue ?? 0}–{rule.maxValue ?? '∞'})
                  </b>
                  : {ISSUES[problem.issue] ?? problem.issue}
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            onClick={() => setTab('advanced')}
          >
            Mở Quy tắc nâng cao để sửa
          </button>
        </div>
      )}

      <div className="adm-tabs" role="tablist">
        {(
          [
            ['common', 'Giá thường dùng'],
            ['advanced', `Quy tắc nâng cao (${ordinary.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`adm-tab${tab === key ? ' is-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'common' && (
        <div className="ppd-page" role="tabpanel">
          <label className="ppd-name">
            Tên chính sách
            <input
              value={pricingPolicyName(draft.name)}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>

          <section className="ppo-card" aria-label="Giới hạn điều chỉnh giá">
            <h3>Giới hạn điều chỉnh giá</h3>
            <p className="ppo-hint">
              Mức Manager được phép giảm hoặc tăng so với giá hệ thống.
            </p>
            <div className="pricing-policy-guardrails">
              <NumberField
                label="Giảm giá tối đa (%)"
                value={draft.managerMaxDiscountPercent}
                onChange={(v) => {
                  const percent = Math.min(100, Math.max(0, v))
                  // The lowest price a Manager may reach is the system price less this discount, so the ratio follows it.
                  setDraft({
                    ...draft,
                    managerMaxDiscountPercent: percent,
                    minimumPriceRatio:
                      Math.round((100 - percent) * 100) / 10000,
                  })
                }}
              />
              <NumberField
                label="Mức tăng giá tối đa (%)"
                value={draft.managerMaxMarkupPercent}
                onChange={(v) =>
                  setDraft({ ...draft, managerMaxMarkupPercent: v })
                }
              />
              <NumberField
                label="Ngưỡng rủi ro cao (%)"
                value={draft.highRiskDiscountPercent}
                onChange={(v) =>
                  setDraft({ ...draft, highRiskDiscountPercent: v })
                }
              />
              <NumberField
                label="Giá sàn (VND)"
                value={draft.minimumPrice}
                onChange={(v) => setDraft({ ...draft, minimumPrice: v })}
              />
            </div>
            <p className="ppo-hint">
              Giá sau điều chỉnh không được thấp hơn{' '}
              {Math.round(draft.minimumPriceRatio * 10000) / 100}% giá hệ thống
              (tính từ mức giảm tối đa) và không thấp hơn giá sàn tuyệt đối.
              Giảm từ ngưỡng rủi ro cao trở lên sẽ được gắn cờ.
            </p>
            {!guardrailsValid && (
              <p role="alert" className="ppd-issues">
                Ngưỡng rủi ro cao không được lớn hơn mức giảm giá tối đa.
              </p>
            )}
          </section>

          <CustomerAddedPricingForm
            rules={draft.rules}
            onChange={(next) => setDraft({ ...draft, rules: next })}
          />

          <section className="ppo-card" aria-label="Bảng giá media dùng chung">
            <h3>Bảng giá media dùng chung</h3>
            <p className="ppo-hint">
              Giá ảnh/video vượt định mức, áp dụng cho mọi checklist kể cả yêu
              cầu bổ sung. Số lượng vượt = max(0, số yêu cầu − số đã bao gồm).
            </p>
            <SharedMediaTiers
              rules={draft.rules}
              onChange={(next) => setDraft({ ...draft, rules: next })}
            />
          </section>
        </div>
      )}

      {tab === 'advanced' && (
        <div className="ppd-page" role="tabpanel">
          <p className="ppo-hint">
            Dành cho người quản trị chính sách. Các giá ở trang "Giá thường
            dùng" đã đủ cho vận hành thông thường.
          </p>
          <div className="adm-card-head">
            <h3>Quy tắc tính giá</h3>
            <button className="odm-btn" type="button" onClick={addRule}>
              Thêm quy tắc
            </button>
          </div>
          {groups.length === 0 && (
            <p className="ppo-empty">Chưa có quy tắc nào.</p>
          )}
          {groups.map((group) => (
            <details
              key={group.category}
              className="ppd-group"
              open={opened.includes(group.category)}
              onToggle={(event) => {
                const isOpen = (event.currentTarget as HTMLDetailsElement).open
                setOpened((current) =>
                  isOpen
                    ? current.includes(group.category)
                      ? current
                      : [...current, group.category]
                    : current.filter((key) => key !== group.category),
                )
              }}
            >
              <summary>
                {pricingLabel(group.category)}{' '}
                <span className="ppd-count">{group.items.length}</span>
              </summary>
              <div className="ppd-group-body pricing-rules">
                {group.items.map((entry) =>
                  renderRule(entry.rule, entry.index),
                )}
              </div>
            </details>
          ))}
          <details className="ppd-group">
            <summary>
              Giá media nâng cao (hồ sơ giá, giá riêng cho từng checklist)
            </summary>
            <div className="ppd-group-body">
              <MediaPricingEditor
                rules={draft.rules}
                draftId={draft.id}
                onChange={(next) => setDraft({ ...draft, rules: next })}
                showCustomerForm={false}
              />
            </div>
          </details>
        </div>
      )}
      <div className="ppd-foot">{actions}</div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

const categories: PricingRule['category'][] = [
  'PACKAGE',
  'DISTANCE',
  'AREA',
  'ALTITUDE',
  'CHECKLIST',
  'OUTPUT',
  'RESOURCE',
  'TERRAIN',
  'CONDITION',
  'PERMIT',
  'DISCOUNT',
  'MANAGER_ADJUSTMENT',
]

const calculationTypes: PricingRule['calculationType'][] = [
  'FIXED',
  'PERCENT_OF_BASE',
  'PER_UNIT',
  'PER_BLOCK',
  'TIERED_BLOCK',
  'MULTIPLIER',
  'RESOURCE_BASED',
  'ACTUAL_COST',
  'MANUAL_QUOTE',
]

function isDimensionBlockRule(rule: PricingRule) {
  return (
    ['AREA', 'DISTANCE', 'ALTITUDE'].includes(rule.category) &&
    ['PER_BLOCK', 'TIERED_BLOCK'].includes(rule.calculationType)
  )
}
