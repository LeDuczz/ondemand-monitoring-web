import { apiRequest } from '../../../shared/api/httpClient'

export type ConsultationResponse = {
  id: string
  customerId: string
  status: string
  createdAt: string
  updatedAt: string
}

export type ConsultationMessage = {
  id: string
  consultationId: string
  role: string
  content: string
  createdAt: string
}

export const consultationApi = {
  /** `GET /api/customer/consultations/{consultationId}` [BE]. */
  getConsultation(consultationId: string, signal?: AbortSignal): Promise<ConsultationResponse> {
    return apiRequest<ConsultationResponse>(`/api/customer/consultations/${consultationId}`, { signal })
  },
  /** `POST /api/customer/consultations/{consultationId}/messages` [BE]. */
  sendMessage(consultationId: string, content: string): Promise<ConsultationMessage> {
    return apiRequest<ConsultationMessage>(`/api/customer/consultations/${consultationId}/messages`, {
      method: 'POST',
      body: { content },
    })
  },
}
