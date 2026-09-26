import { describe, expect, it } from 'vitest'

import { buildDraftFromConsultation, findRecommendedService } from './CreateOrderPage'
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
  it('does not fill request title or description while consultation still needs more info', () => {
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

  it('fills request title and description from ready consultation draft fields', () => {
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
    const readyConsultation: CustomerConsultation = {
      ...consultation,
      status: 'READY_FOR_CONFIRMATION',
      requestTitle: 'Kiểm tra nứt và hư hỏng mặt ngoài công trình',
      requestSummary:
        'Giám sát mặt ngoài công trình bằng drone, tập trung phát hiện vết nứt, bong tróc và khu vực hư hỏng.',
    }

    const draft = buildDraftFromConsultation(readyConsultation, messages, service)

    expect(draft.title).toBe('Kiểm tra nứt và hư hỏng mặt ngoài công trình')
    expect(draft.description).toBe(
      'Giám sát mặt ngoài công trình bằng drone, tập trung phát hiện vết nứt, bong tróc và khu vực hư hỏng.',
    )
  })
})

describe('findRecommendedService', () => {
  it('matches AI recommendation by service id', () => {
    const services: ServiceOption[] = [
      service,
      {
        id: 'svc-progress',
        name: 'Giám sát Tiến độ Xây dựng',
        description: 'Theo dõi tiến độ thi công',
      },
    ]

    const match = findRecommendedService(
      {
        ...consultation,
        recommendedServiceId: 'svc-progress',
        recommendedServiceName: service.name,
      },
      services,
    )

    expect(match?.id).toBe('svc-progress')
  })

  it('does not infer AI recommendation from service name without id', () => {
    const match = findRecommendedService(
      {
        ...consultation,
        recommendedServiceId: undefined,
        recommendedServiceName: service.name,
      },
      [service],
    )

    expect(match).toBeUndefined()
  })
})
