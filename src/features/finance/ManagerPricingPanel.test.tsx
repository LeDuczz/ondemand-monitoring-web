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

  it('keeps draft saving available but blocks approval while a custom item is pending', async () => {
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
          sourceType: 'CUSTOMER_CUSTOM',
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

  it('automatically includes pending package requirements when approving', async () => {
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue({
      orderId: 'order-1',
      orderCode: 'ORD-1',
      customerName: 'Customer',
      serviceName: 'Site monitoring',
      basePackagePrice: 5_000_000,
      checklistItems: [
        {
          id: 'package-1',
          sourceChecklistId: 'template-1',
          content: 'Package requirement',
          displayOrder: 1,
          sourceType: 'SERVICE_TEMPLATE',
          reviewStatus: 'PENDING',
          managerNote: null,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    })
    const reviewItem = vi.spyOn(financeApi, 'reviewChecklist').mockResolvedValue({
      id: 'package-1',
      sourceChecklistId: 'template-1',
      content: 'Package requirement',
      displayOrder: 1,
      sourceType: 'SERVICE_TEMPLATE',
      reviewStatus: 'INCLUDED',
      managerNote: null,
    })
    const draft = {
      id: 'quote-1', orderId: 'order-1', version: 1, status: 'DRAFT' as const,
      packagePrice: 5_000_000, additionalAmount: 0, discountAmount: 0,
      adjustmentAmount: 0, totalAmount: 5_000_000, managerNote: null,
      approvedByName: null, approvedAt: null, acceptedAt: null, items: [],
    }
    vi.spyOn(financeApi, 'saveDraft').mockResolvedValue(draft)
    const approve = vi.spyOn(financeApi, 'approveQuote').mockResolvedValue({
      ...draft,
      status: 'APPROVED',
    })

    render(<ManagerPricingPanel orderId="order-1" />)
    await screen.findByText('Package requirement')
    const button = screen.getByRole('button', { name: 'Duyệt báo giá' })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    await screen.findByText(/Duyệt báo giá thành công/)
    expect(reviewItem).toHaveBeenCalledWith('order-1', 'package-1', {
      status: 'INCLUDED',
      managerNote: null,
    })
    expect(approve).toHaveBeenCalledTimes(1)
  })

  it('shows success and locks the approval button immediately after approval', async () => {
    const review = {
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
          sourceType: 'SERVICE_TEMPLATE' as const,
          reviewStatus: 'INCLUDED' as const,
          managerNote: null,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    }
    const draft = {
      id: 'quote-1',
      orderId: 'order-1',
      version: 1,
      status: 'DRAFT' as const,
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
    }
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue(review)
    vi.spyOn(financeApi, 'saveDraft').mockResolvedValue(draft)
    const approve = vi.spyOn(financeApi, 'approveQuote').mockResolvedValue({
      ...draft,
      status: 'APPROVED',
    })

    render(<ManagerPricingPanel orderId="order-1" />)
    await screen.findByText('Default requirement')
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt báo giá' }))

    expect(
      await screen.findByText(
        'Duyệt báo giá thành công. Báo giá đã sẵn sàng để khách hàng chấp nhận.',
      ),
    ).toBeInTheDocument()
    const approvedButton = screen.getByRole('button', {
      name: 'Đã duyệt thành công',
    })
    expect(approvedButton).toBeDisabled()

    fireEvent.click(approvedButton)
    expect(approve).toHaveBeenCalledTimes(1)
  })
})
