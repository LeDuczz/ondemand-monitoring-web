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

  it('takes the service price and add-ons from the checklist quote', () => {
    expect(
      selectionEstimate(
        {
          serviceId: 'service-1',
          servicePrice: 3_200_000,
          additionalRequirements: [],
          totalPrice: 3_200_000,
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
          total: 1_400_000,
          complete: false,
          warnings: [],
          quotePending: true,
          addOns: [
            { key: 'AI_IMAGE_ANALYSIS', description: 'AI', amount: 500_000 },
          ],
        },
      ),
    ).toMatchObject({
      servicePrice: 900_000,
      totalPrice: 1_400_000,
      quotePending: true,
      additionalRequirements: [
        { type: 'AI_IMAGE_ANALYSIS', additionalPrice: 500_000 },
      ],
    })
  })
})
