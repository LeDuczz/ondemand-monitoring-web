import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContentStep } from './ContentStep'

describe('ContentStep', () => {
  it('keeps editing, summary, pricing and navigation in accessible regions', () => {
    render(
      <ContentStep
        checklist={<button type="button">Edit monitoring requirement</button>}
        selectedCount={3}
        packageSelectedCount={2}
        packageCount={4}
        additionalChecklists={[]}
        valid
        pricingEstimate={null}
        pricingLoading={false}
        aiAnalysisRequested={false}
        footer={<button type="button">Continue</button>}
      />,
    )

    expect(
      screen.getByRole('region', {
        name: /monitoring content list|danh sách nội dung giám sát/i,
      }),
    ).toHaveTextContent('Edit monitoring requirement')
    expect(
      screen.getByRole('complementary', {
        name: /request summary|tóm tắt yêu cầu/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('2 / 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })
})
