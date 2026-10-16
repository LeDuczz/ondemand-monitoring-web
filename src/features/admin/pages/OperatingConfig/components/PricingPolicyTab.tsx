import { useEffect, useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { ApiError } from '../../../../../shared/api/httpClient'
import {
  pricingDescription,
  pricingLabel,
  pricingPolicyName,
} from '../../../../../shared/lib/pricingPresentation'
import { adminApi } from '../../../api/adminApi'
import { MediaPricingEditor } from './MediaPricingEditor'
import { isMediaRule, validateMediaRules } from '../../../lib/mediaPricingRules'
import type {
  PricingPolicy,
  PricingPolicyPayload,
  PricingRule,
} from '../../../types/pricing'

export function PricingPolicyTab() {
  const query = useApiQuery(
    (signal) => adminApi.listPricingPolicies(signal),
    [],
  )
  const [draft, setDraft] = useState<PricingPolicy | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () => setDraft(query.data?.find((p) => p.status === 'DRAFT') ?? null),
    [query.data],
  )
  const active = query.data?.find((p) => p.status === 'ACTIVE')

  async function createDraft() {
    if (!active) return
    await run(async () => {
      await adminApi.clonePricingPolicy(active.id)
      query.reload()
    }, 'Đã nhân bản chính sách đang áp dụng thành bản nháp mới.')
  }
  const mediaValid = !draft || validateMediaRules(draft.rules).length === 0
  async function save() {
    if (!draft || !mediaValid) return
    await run(async () => {
      await adminApi.updatePricingPolicy(draft.id, payload(draft))
      query.reload()
    }, 'Đã lưu chính sách giá nháp.')
  }
  async function publish() {
    if (!draft || !mediaValid) return
    await run(async () => {
      await adminApi.publishPricingPolicy(draft.id)
      query.reload()
    }, 'Đã phát hành chính sách giá. Chính sách cũ đã được thay thế.')
  }
  async function run(action: () => Promise<void>, success: string) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await action()
      setMessage(success)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Không thể cập nhật chính sách giá. Vui lòng kiểm tra dữ liệu và thử lại.',
      )
    } finally {
      setBusy(false)
    }
  }
  function updateRule(index: number, changes: Partial<PricingRule>) {
    setDraft((current) =>
      current
        ? {
            ...current,
            rules: current.rules.map((rule, i) =>
              i === index ? { ...rule, ...changes } : rule,
            ),
          }
        : current,
    )
  }
  function addRule() {
    setDraft((current) =>
      current
        ? {
            ...current,
            rules: [
              ...current.rules,
              {
                category: 'AREA',
                calculationType: 'PER_BLOCK',
                ruleKey: `NEW_RULE_${current.rules.length + 1}`,
                description: 'Quy tắc mới',
                minValue: 0,
                maxValue: null,
                fixedAmount: 0,
                baseAmount: null,
                percentage: null,
                unitSize: 1,
                multiplier: null,
                priority: current.rules.length,
                enabled: true,
                roundingMode: 'CEILING',
              },
            ],
          }
        : current,
    )
  }
  function removeRule(index: number) {
    setDraft((current) =>
      current
        ? {
            ...current,
            rules: current.rules
              .filter((_, i) => i !== index)
              .map((rule, priority) => ({ ...rule, priority })),
          }
        : current,
    )
  }

  return (
    <section className="adm-card pricing-policy-admin">
      <div className="adm-card-head">
        <div>
          <h2>Chính sách giá</h2>
          <p>
            Mỗi lần phát hành sẽ tạo một phiên bản mới; chính sách đã phát hành
            không thể chỉnh sửa.
          </p>
        </div>
        {!draft && (
          <div>
            {active ? (
              <p role="note">
                Chính sách đang áp dụng không thể chỉnh sửa. Hãy nhân bản để tạo
                một phiên bản DRAFT rồi chỉnh sửa và phát hành.
              </p>
            ) : null}
            <button
              className="odm-btn odm-btn-p"
              disabled={!active || busy}
              onClick={() => void createDraft()}
            >
              Nhân bản thành DRAFT
            </button>
          </div>
        )}
      </div>
      {(query.data ?? []).map((policy) => (
        <p key={policy.id}>
          <b>
            Phiên bản {policy.version} · {pricingPolicyName(policy.name)}
          </b>{' '}
          — {pricingLabel(policy.status)}
        </p>
      ))}
      {draft && (
        <div className="pricing-policy-form">
          <label>
            Tên chính sách
            <input
              value={pricingPolicyName(draft.name)}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <div className="pricing-policy-guardrails">
            <NumberField
              label="Giảm giá tối đa (%)"
              value={draft.managerMaxDiscountPercent}
              onChange={(v) =>
                setDraft({ ...draft, managerMaxDiscountPercent: v })
              }
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
              label="Tỷ lệ giá sàn"
              value={draft.minimumPriceRatio}
              onChange={(v) => setDraft({ ...draft, minimumPriceRatio: v })}
            />
            <NumberField
              label="Giá sàn (VND)"
              value={draft.minimumPrice}
              onChange={(v) => setDraft({ ...draft, minimumPrice: v })}
            />
          </div>
          <div className="pricing-rules">
            <div className="adm-card-head">
              <h3>Quy tắc tính giá</h3>
              <button className="odm-btn" type="button" onClick={addRule}>
                Thêm quy tắc
              </button>
            </div>
            {draft.rules.map((rule, index) =>
              isMediaRule(rule) ? null : (
                <div
                  className="pricing-rule-row"
                  key={`${rule.category}-${rule.ruleKey}`}
                >
                  <label>
                    <span>Nhóm giá</span>
                    <select
                      value={rule.category}
                      onChange={(event) =>
                        updateRule(index, {
                          category: event.target
                            .value as PricingRule['category'],
                          roundingMode: [
                            'AREA',
                            'DISTANCE',
                            'ALTITUDE',
                          ].includes(event.target.value)
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
                    onChange={(e) =>
                      updateRule(index, { description: e.target.value })
                    }
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
              ),
            )}
          </div>
          <MediaPricingEditor
            rules={draft.rules}
            draftId={draft.id}
            onChange={(rules) => setDraft({ ...draft, rules })}
          />
          <div className="finance-actions">
            <button
              className="odm-btn"
              disabled={busy || !mediaValid}
              onClick={() => void save()}
            >
              Lưu bản nháp
            </button>
            <button
              className="odm-btn odm-btn-p"
              disabled={busy || !mediaValid}
              onClick={() => void publish()}
            >
              Phát hành
            </button>
          </div>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
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
function payload(policy: PricingPolicy): PricingPolicyPayload {
  return {
    name: policy.name,
    effectiveFrom: null,
    effectiveTo: null,
    managerMaxDiscountPercent: policy.managerMaxDiscountPercent,
    managerMaxMarkupPercent: policy.managerMaxMarkupPercent,
    highRiskDiscountPercent: policy.highRiskDiscountPercent,
    minimumPriceRatio: policy.minimumPriceRatio,
    minimumPrice: policy.minimumPrice,
    rules: policy.rules.map(
      (rule, priority) =>
        Object.fromEntries(
          Object.entries({ ...rule, priority }).filter(([key]) => key !== 'id'),
        ) as PricingRule,
    ),
  }
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
