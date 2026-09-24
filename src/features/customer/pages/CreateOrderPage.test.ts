import { describe, expect, it } from 'vitest'

import { buildDraftFromConsultation } from './CreateOrderPage'
import type { ConsultationMessage, CustomerConsultation, ServiceOption } from '../api/customerApi'

const service: ServiceOption = {
  id: 'svc-building',
  name: 'Giám sát Tòa nhà / Cơ sở hạ tầng',
  description: 'Giám sát công trình',
}

const consultation: CustomerConsultation = {
  id: 'consultation-1',
  status: 'ACTIVE',
  requirementSummary:
    'giám sát tòa nhà/công trình để kiểm tra nứt vỡ/hư hỏng, phát hiện điểm nóng, rà soát an toàn khu vực, theo dõi tiến độ',
  recommendedServiceId: service.id,
  recommendedServiceName: service.name,
  messages: [],
}

describe('buildDraftFromConsultation', () => {
  it('keeps the customer-selected building safety goal instead of copying every assistant option', () => {
    const messages: ConsultationMessage[] = [
      {
        id: 'assistant-1',
        senderType: 'ASSISTANT',
        message:
          'Mục tiêu chính là kiểm tra nứt vỡ/hư hỏng, phát hiện điểm nóng, rà soát an toàn khu vực hay theo dõi tiến độ?',
      },
      {
        id: 'customer-1',
        senderType: 'CUSTOMER',
        message: 'Rà soát an toàn khu vực.',
      },
      {
        id: 'customer-2',
        senderType: 'CUSTOMER',
        message: 'Ưu tiên mặt đứng và mặt tiền.',
      },
    ]

    const draft = buildDraftFromConsultation(consultation, messages, service)

    expect(draft.title).toBe('Giám sát công trình phát hiện an toàn')
    expect(draft.description).toContain('rà soát an toàn khu vực')
    expect(draft.description).toContain('Ưu tiên mặt đứng và mặt tiền.')
    expect(draft.description).not.toContain('phát hiện điểm nóng')
    expect(draft.description).not.toContain('theo dõi tiến độ')
  })

  it('ignores a polluted start-consultation seed once the customer gives direct answers', () => {
    const messages: ConsultationMessage[] = [
      {
        id: 'customer-seed',
        senderType: 'CUSTOMER',
        message:
          'Tôi muốn tạo yêu cầu giám sát: Giám sát công trình phát hiện nứt vỡ/hư hỏng và điểm nóng.',
      },
      {
        id: 'customer-1',
        senderType: 'CUSTOMER',
        message: 'Rà soát an toàn khu vực.',
      },
    ]

    const draft = buildDraftFromConsultation(consultation, messages, service)

    expect(draft.description).toContain('rà soát an toàn khu vực')
    expect(draft.description).not.toContain('nứt vỡ/hư hỏng')
    expect(draft.description).not.toContain('điểm nóng')
  })
})
