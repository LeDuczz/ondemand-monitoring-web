import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { financeApi } from './api'
import { ManagerPricingPanel } from './ManagerPricingPanel'

afterEach(() => vi.restoreAllMocks())

describe('ManagerPricingPanel', () => {
  it('submits package and additional prices as separate backend inputs', async () => {
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue({
      orderId: 'order-1',
      orderCode: 'ORD-1',
      customerName: 'Customer',
      serviceName: 'Site monitoring',
      basePackagePrice: 5_000_000,
      checklistItems: [
        {
          id: 'included-1',
          sourceChecklistId: 'template-1',
          content: 'Default requirement',
          displayOrder: 1,
          sourceType: 'SERVICE_TEMPLATE',
          reviewStatus: 'INCLUDED',
          managerNote: null,
        },
        {
          id: 'additional-1',
          sourceChecklistId: null,
          content: 'Extra requirement',
          displayOrder: 2,
          sourceType: 'CUSTOMER_CUSTOM',
          reviewStatus: 'ADDITIONAL',
          managerNote: null,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    })
    const save = vi.spyOn(financeApi, 'saveDraft').mockResolvedValue({
      id: 'quote-1',
      orderId: 'order-1',
      version: 1,
      status: 'DRAFT',
      packagePrice: 5_000_000,
      additionalAmount: 1_300_000,
      discountAmount: 0,
      adjustmentAmount: 0,
      totalAmount: 6_300_000,
      managerNote: null,
      approvedByName: null,
      approvedAt: null,
      acceptedAt: null,
      items: [],
    })

    render(<ManagerPricingPanel orderId="order-1" />)
    await screen.findByText('Extra requirement')
    expect(screen.getByRole('button', { name: 'Duyệt báo giá' })).toBeEnabled()
    await waitFor(() =>
      expect(screen.getByLabelText('Giá gói (VND)')).toHaveValue('5000000'),
    )
    fireEvent.change(screen.getByLabelText('Đơn giá thêm (VND)'), {
      target: { value: '1300000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('order-1', {
        packagePrice: 5_000_000,
        discountAmount: 0,
        adjustmentAmount: 0,
        managerNote: null,
        additionalUnitPrices: { 'additional-1': 1_300_000 },
      }),
    )
  })

  it('keeps draft saving available but blocks approval until every checklist item is reviewed', async () => {
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue({
      orderId: 'order-1',
      orderCode: 'ORD-1',
      customerName: 'Customer',
      serviceName: 'Site monitoring',
      basePackagePrice: 5_000_000,
      checklistItems: [
        {
          id: 'pending-1',
          sourceChecklistId: 'template-1',
          content: 'Requirement awaiting review',
          displayOrder: 1,
          sourceType: 'SERVICE_TEMPLATE',
          reviewStatus: 'PENDING',
          managerNote: null,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    })
    vi.spyOn(financeApi, 'saveDraft').mockResolvedValue({
      id: 'quote-1',
      orderId: 'order-1',
      version: 1,
      status: 'DRAFT',
      packagePrice: 5_000_000,
      additionalAmount: 0,
      discountAmount: 0,
      adjustmentAmount: 0,
      totalAmount: 5_000_000,
      managerNote: null,
      approvedByName: null,
      approvedAt: null,
      acceptedAt: null,
      items: [],
    })
    const approve = vi.spyOn(financeApi, 'approveQuote')

    render(<ManagerPricingPanel orderId="order-1" />)

    await screen.findByText('Requirement awaiting review')
    expect(screen.getByText('0/1 nội dung đã review')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Còn 1 nội dung cần chọn cách tính giá trước khi duyệt.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Duyệt báo giá' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Lưu nháp' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))
    expect(await screen.findByText('Đã lưu báo giá nháp.')).toBeInTheDocument()
    expect(approve).not.toHaveBeenCalled()
  })
})
