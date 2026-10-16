import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import { MediaPricingEditor } from './MediaPricingEditor'
import { PricingPolicyTab } from './PricingPolicyTab'
import { adminApi } from '../../../api/adminApi'
import { catalogApi } from '../../../api/catalogApi'
import { newMediaRule } from '../../../lib/mediaPricingRules'
import { checklistPricingApi } from '../../../../../shared/api/checklistPricingApi'
import { setLanguage } from '../../../../../shared/i18n'
import type { PricingPolicy, PricingRule } from '../../../types/pricing'

beforeEach(() => {
  setLanguage('vi')
  vi.spyOn(catalogApi, 'listServices').mockResolvedValue([
    { id: 's', name: 'Dịch vụ test', basePrice: 1_000_000, isActive: true },
  ])
})
afterEach(() => vi.restoreAllMocks())

const tier = (from: number, to: number | null, price: number): PricingRule => ({
  ...newMediaRule('STANDARD', 'EXTRA_IMAGE', []),
  ruleKey: `STANDARD:EXTRA_IMAGE:${from}`,
  minValue: from,
  maxValue: to,
  unitSize: 10,
  fixedAmount: price,
})

function Harness({
  initial,
  onRules,
}: {
  initial: PricingRule[]
  onRules?: (r: PricingRule[]) => void
}) {
  const [rules, setRules] = useState(initial)
  return (
    <MediaPricingEditor
      rules={rules}
      draftId="draft-1"
      onChange={(next) => {
        setRules(next)
        onRules?.(next)
      }}
    />
  )
}

describe('MediaPricingEditor', () => {
  it('separates included media from extra media tiers', () => {
    render(
      <Harness
        initial={[
          {
            ...newMediaRule('STANDARD', 'INCLUDED_IMAGE', []),
            fixedAmount: 50_000,
          },
          tier(0, 10, 50_000),
          tier(10, null, 40_000),
        ]}
      />,
    )
    expect(screen.getByText(/Media đã bao gồm/)).toBeInTheDocument()
    expect(screen.getByText(/Media bổ sung/)).toBeInTheDocument()
    expect(screen.getAllByTestId('media-rule')).toHaveLength(3)
  })

  it('edits a tier price and block size through the rule list', () => {
    const seen: PricingRule[][] = []
    render(
      <Harness
        initial={[tier(0, null, 50_000)]}
        onRules={(r) => seen.push(r)}
      />,
    )
    const row = screen.getByTestId('media-rule')
    fireEvent.change(within(row).getByLabelText('Giá mỗi khối (VND)'), {
      target: { value: '45000' },
    })
    fireEvent.change(within(row).getByLabelText('Kích thước khối'), {
      target: { value: '5' },
    })
    expect(seen.at(-1)![0]).toMatchObject({ fixedAmount: 45_000, unitSize: 5 })
  })

  it('adds a continuing tier for a profile and removes a rule', () => {
    const seen: PricingRule[][] = []
    render(
      <Harness initial={[tier(0, 10, 50_000)]} onRules={(r) => seen.push(r)} />,
    )
    fireEvent.change(screen.getByPlaceholderText('Tên hồ sơ giá mới'), {
      target: { value: 'standard' },
    })
    fireEvent.change(screen.getByLabelText('Thành phần'), {
      target: { value: 'EXTRA_IMAGE' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm quy tắc' }))
    expect(seen.at(-1)).toHaveLength(2)
    expect(seen.at(-1)![1]).toMatchObject({
      pricingProfile: 'STANDARD',
      minValue: 10,
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa' })[0])
    expect(seen.at(-1)).toHaveLength(1)
  })

  it('reports overlapping tiers next to the rows', () => {
    render(<Harness initial={[tier(0, 10, 50_000), tier(5, null, 40_000)]} />)
    expect(
      screen.getAllByText('Các bậc giá chồng lấn.').length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(/Cần sửa trước khi lưu: 1/)).toBeInTheDocument()
  })

  it('previews a price with the saved draft policy', async () => {
    const adminPreview = vi
      .spyOn(checklistPricingApi, 'adminPreview')
      .mockResolvedValue({
        serviceId: 's',
        serviceName: 'Dịch vụ test',
        currency: 'VND',
        policyId: 'draft-1',
        policyVersion: 5,
        draftPolicy: true,
        priceSource: 'LEGACY_BASE_PRICE',
        packageFee: 1_000_000,
        checklists: [],
        checklistSubtotal: 0,
        total: 1_000_000,
        complete: true,
        warnings: [],
        quotePending: false,
      })
    render(<Harness initial={[tier(0, null, 50_000)]} />)
    await screen.findByRole('option', { name: 'Dịch vụ test' })
    fireEvent.click(screen.getByRole('button', { name: 'Xem thử' }))
    await waitFor(() =>
      expect(adminPreview).toHaveBeenCalledWith({
        serviceId: 's',
        policyId: 'draft-1',
      }),
    )
    expect(
      await screen.findByText('Chính sách giá v5 (bản nháp)'),
    ).toBeInTheDocument()
  })
})

describe('PricingPolicyTab with MEDIA rules', () => {
  const draft: PricingPolicy = {
    id: 'draft-1',
    name: 'Draft',
    version: 2,
    status: 'DRAFT',
    currency: 'VND',
    effectiveFrom: null,
    effectiveTo: null,
    managerMaxDiscountPercent: 25,
    managerMaxMarkupPercent: 25,
    highRiskDiscountPercent: 10,
    minimumPriceRatio: 0.75,
    minimumPrice: 100_000,
    rules: [tier(0, 10, 50_000), tier(5, null, 40_000)],
  }

  it('does not save or publish a draft whose tiers overlap', async () => {
    vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([draft])
    const update = vi
      .spyOn(adminApi, 'updatePricingPolicy')
      .mockResolvedValue(draft)
    const publish = vi
      .spyOn(adminApi, 'publishPricingPolicy')
      .mockResolvedValue(draft)
    render(<PricingPolicyTab />)
    const save = await screen.findByRole('button', { name: 'Lưu bản nháp' })
    expect(save).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Phát hành' })).toBeDisabled()
    fireEvent.click(save)
    expect(update).not.toHaveBeenCalled()
    expect(publish).not.toHaveBeenCalled()
  })

  it('saves the media fields of a valid draft', async () => {
    const valid = {
      ...draft,
      rules: [tier(0, 10, 50_000), tier(10, null, 40_000)],
    }
    vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([valid])
    const update = vi
      .spyOn(adminApi, 'updatePricingPolicy')
      .mockResolvedValue(valid)
    render(<PricingPolicyTab />)
    fireEvent.click(await screen.findByRole('button', { name: 'Lưu bản nháp' }))
    await waitFor(() => expect(update).toHaveBeenCalled())
    const body = update.mock.calls[0][1]
    expect(body.rules).toHaveLength(2)
    expect(body.rules[1]).toMatchObject({
      category: 'MEDIA',
      pricingProfile: 'STANDARD',
      mediaComponent: 'EXTRA_IMAGE',
      minValue: 10,
      maxValue: null,
      unitSize: 10,
      fixedAmount: 40_000,
      roundingMode: 'CEILING',
    })
    expect(body.rules[0]).not.toHaveProperty('id')
  })
})
