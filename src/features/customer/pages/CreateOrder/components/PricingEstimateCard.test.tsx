import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PricingEstimateCard } from './PricingEstimateCard'

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
})
