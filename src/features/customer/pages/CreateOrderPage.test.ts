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
  it('does not turn consultation messages into request title or description', () => {
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

    expect(draft.title).toBe('')
    expect(draft.description).toBe('')
  })

  it('does not concatenate customer input, requirement summary, and recommendation', () => {
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

    expect(draft.description).not.toContain('Nội dung khách nhập:')
    expect(draft.description).not.toContain('Tóm tắt:')
    expect(draft.description).not.toContain('Dịch vụ đề xuất:')
  })
})
