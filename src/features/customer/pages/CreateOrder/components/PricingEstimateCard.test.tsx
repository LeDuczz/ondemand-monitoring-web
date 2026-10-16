import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PricingEstimateCard } from './PricingEstimateCard'
import { selectionEstimate } from '../../../lib/checklist/selectionEstimate'

describe('PricingEstimateCard', () => {
  it('explains that checklist changes are reflected in the final manager quote', () => {
    render(
      <PricingEstimateCard
        estimate={{
          serviceId: 'service-1',
          servicePrice: 3_200_000,
          additionalRequirements: [],
          totalPrice: 3_200_000,
        }}
        loading={false}
        hasService
        aiAnalysisRequested={false}
      />,
    )

    expect(screen.getByText(/Đây là giá gói dự kiến/)).toBeInTheDocument()
    expect(screen.getByText(/báo giá cuối cùng/)).toBeInTheDocument()
  })

  it('shows that manager-quoted requirements are excluded', () => {
    render(
      <PricingEstimateCard
        estimate={{
          serviceId: 'service-1',
          servicePrice: 500_000,
          additionalRequirements: [],
          totalPrice: 500_000,
          quotePending: true,
        }}
        loading={false}
        hasService
        aiAnalysisRequested={false}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      /chưa được tính trong tổng dự kiến/,
    )
  })

  it('replaces only the service price with the checklist quote', () => {
    expect(
      selectionEstimate(
        {
          serviceId: 'service-1',
          servicePrice: 3_200_000,
          additionalRequirements: [],
          totalPrice: 3_450_000,
        },
        {
          serviceId: 'service-1',
          serviceName: 'Service',
          currency: 'VND',
          policyId: 'policy-1',
          policyVersion: 1,
          draftPolicy: false,
          priceSource: 'CHECKLISTS',
          packageFee: 0,
          checklists: [],
          checklistSubtotal: 900_000,
          total: 900_000,
          complete: false,
          warnings: [],
          quotePending: true,
        },
      ),
    ).toMatchObject({
      servicePrice: 900_000,
      totalPrice: 1_150_000,
      quotePending: true,
    })
  })
})
