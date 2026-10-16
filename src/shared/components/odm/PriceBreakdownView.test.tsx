import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { setLanguage } from '../../i18n'
import type { ServicePricePreview } from '../../api/checklistPricingApi'
import { PriceBreakdownView } from './PriceBreakdownView'
import { mapService } from '../../../features/admin/lib/catalogMappers'

const base: ServicePricePreview = {
  serviceId: 's',
  serviceName: 'S',
  currency: 'VND',
  policyId: 'p',
  policyVersion: 2,
  draftPolicy: false,
  priceSource: 'CHECKLISTS',
  packageFee: 0,
  checklists: [],
  checklistSubtotal: 470_000,
  total: 470_000,
  complete: true,
  warnings: [],
  quotePending: false,
}
beforeEach(() => setLanguage('vi'))

describe('PriceBreakdownView price source', () => {
  it('shows only the checklists and no legacy package row when checklists carry the price', () => {
    render(<PriceBreakdownView preview={base} />)
    expect(screen.queryByText(/Giá gói cũ/)).toBeNull()
    expect(screen.getByText(/không cộng thêm giá gói cũ/)).toBeInTheDocument()
    expect(screen.getAllByText(/470\.000/).length).toBeGreaterThan(0)
  })

  it('names the legacy catalog price explicitly when no checklist is priced', () => {
    render(
      <PriceBreakdownView
        preview={{
          ...base,
          priceSource: 'LEGACY_BASE_PRICE',
          packageFee: 1_000_000,
          checklistSubtotal: 0,
          total: 1_000_000,
        }}
      />,
    )
    expect(screen.getByText(/Giá gói cũ của danh mục/)).toBeInTheDocument()
    expect(screen.queryByText(/không cộng thêm giá gói cũ/)).toBeNull()
  })

  it('lists warnings for checklists the policy cannot price', () => {
    render(
      <PriceBreakdownView
        preview={{
          ...base,
          complete: false,
          warnings: ['Check roof: add a tier'],
        }}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Check roof: add a tier',
    )
  })

  it('replaces an unpriced checklist table and warns that it is excluded', () => {
    render(
      <PriceBreakdownView
        preview={{
          ...base,
          quotePending: true,
          checklists: [
            {
              checklistId: null,
              content: 'Custom inspection',
              pricingProfile: 'CUSTOM',
              custom: true,
              includedImageCount: 0,
              includedVideoCount: 0,
              requestedImageCount: 0,
              requestedVideoCount: 0,
              extraImageCount: 0,
              extraVideoCount: 0,
              standardVideoDurationSeconds: null,
              lines: [],
              subtotal: 0,
              quotePending: true,
            },
          ],
        }}
      />,
    )

    expect(screen.getByText('Chờ Manager báo giá')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/chưa được tính/)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('service contract mapping', () => {
  it('keeps the legacy basePrice and carries the checklist default price separately', () => {
    const service = mapService({
      id: 's',
      name: 'S',
      basePrice: 3_200_000,
      defaultPrice: 470_000,
      priceSource: 'CHECKLISTS',
      isActive: true,
    })
    expect(service.basePrice).toBe(3_200_000)
    expect(service.defaultPrice).toBe(470_000)
    expect(service.priceSource).toBe('CHECKLISTS')
  })
})
