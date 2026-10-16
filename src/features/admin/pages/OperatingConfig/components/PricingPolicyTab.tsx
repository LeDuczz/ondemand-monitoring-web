import { useEffect, useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import {
  pricingDescription,
  pricingLabel,
  pricingPolicyName,
} from '../../../../../shared/lib/pricingPresentation'
import { adminApi } from '../../../api/adminApi'
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
      await adminApi.createPricingPolicy(
        payload({
          ...active,
          name: `Chính sách giá phiên bản ${active.version + 1}`,
        }),
      )
      query.reload()
    }, 'Đã tạo chính sách giá nháp mới.')
  }
  async function save() {
    if (!draft) return
    await run(async () => {
      await adminApi.updatePricingPolicy(draft.id, payload(draft))
      query.reload()
    }, 'Đã lưu chính sách giá nháp.')
  }
  async function publish() {
    if (!draft) return
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
    } catch {
      setError(
        'Không thể cập nhật chính sách giá. Vui lòng kiểm tra dữ liệu và thử lại.',
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
          <button
            className="odm-btn odm-btn-p"
            disabled={!active || busy}
            onClick={() => void createDraft()}
          >
            Tạo bản nháp từ chính sách đang áp dụng
          </button>
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
            <h3>Quy tắc tính giá</h3>
            {draft.rules.map((rule, index) => (
              <div
                className="pricing-rule-row"
                key={`${rule.category}-${rule.ruleKey}`}
              >
                <b>
                  {pricingLabel(rule.category)} / {pricingLabel(rule.ruleKey)}
                </b>
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
              </div>
            ))}
          </div>
          <div className="finance-actions">
            <button
              className="odm-btn"
              disabled={busy}
              onClick={() => void save()}
            >
              Lưu bản nháp
            </button>
            <button
              className="odm-btn odm-btn-p"
              disabled={busy}
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
      (rule) =>
        Object.fromEntries(
          Object.entries(rule).filter(([key]) => key !== 'id'),
        ) as PricingRule,
    ),
  }
}
