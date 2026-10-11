import { useRef, useState } from 'react'

import { ApiError } from '../../../../../shared/api/httpClient'
import { useI18n } from '../../../../../shared/i18n'
import { authSession } from '../../../../auth/api/authApi'
import {
  customerApi,
  type ConsultationMessage,
  type CustomerConsultation,
} from '../../../api/customerApi'
import {
  isReusableConsultation,
  parseAiAnalysisAnswer,
} from '../../../lib/createOrder/consultation'
import {
  pollForAssistantReply,
  withConsultationTimeout,
} from '../../../lib/createOrder/consultationRecovery'
import { clearStoredDraft } from '../../../lib/createOrder/draftStorage'
import { consultationHookMessages } from './useConsultation.messages'

type Options = {
  initialConsultation: CustomerConsultation | null
  initialMessages: ConsultationMessage[]
  buildContext: (latestMessage: string) => string
  onReceive: (consultation: CustomerConsultation) => void
  onAiAnswer: (requested: boolean) => void
  onError: (message: string | null) => void
  onReset: () => void
}

/** AI consultation chat: session lifecycle, messages, timeout and recovery. */
export function useConsultation(options: Options) {
  const { t } = useI18n(consultationHookMessages)
  const [consultation, setConsultation] = useState<CustomerConsultation | null>(
    isReusableConsultation(options.initialConsultation)
      ? options.initialConsultation
      : null,
  )
  const [messages, setMessages] = useState<ConsultationMessage[]>(
    isReusableConsultation(options.initialConsultation)
      ? options.initialMessages
      : [],
  )
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const requestInFlight = useRef(false)

  const notice = (message: string) =>
    setMessages((cur) => [
      ...cur,
      { id: `local-error-${Date.now()}`, senderType: 'ASSISTANT', message },
    ])

  function describe(error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return t.timeout
    }
    if (error instanceof ApiError) {
      const status = error.status ? ` · ${error.status}` : ''
      return `${error.message} (${error.method} ${error.path}${status})`
    }
    return error instanceof Error && error.message
      ? error.message
      : t.noBackendResponse
  }

  function receive(next: CustomerConsultation) {
    setConsultation(next)
    if (next.messages?.length) {
      const seen = new Set<string>()
      const cleaned = next.messages.filter((message) => {
        const key = `${message.senderType}:${message.message.trim()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      setMessages(cleaned)
    } else {
      const fallback = next.recommendedServiceName
        ? `Mình gợi ý dịch vụ ${next.recommendedServiceName} vì phù hợp với nhu cầu bạn vừa mô tả. Bạn kiểm tra thông tin bên phải rồi bổ sung mục tiêu hoặc kết quả cần nhận nếu cần.`
        : 'Mình chưa đủ thông tin để chọn đúng dịch vụ. Bạn mô tả thêm đối tượng cần giám sát và mục tiêu chính muốn kiểm tra nhé.'
      setMessages((current) => [
        ...current,
        { id: `local-ai-${Date.now()}`, senderType: 'ASSISTANT', message: fallback },
      ])
    }
    options.onReceive(next)
  }

  async function recover(consultationId: string) {
    try {
      const latest = await pollForAssistantReply(consultationId)
      if (latest) receive(latest)
      return Boolean(latest)
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 404 ||
          error.message.toLowerCase().includes('consultation not found'))
      ) {
        setConsultation(null)
        setMessages([])
        clearStoredDraft()
      }
      throw error
    }
  }

  async function start() {
    if (requestInFlight.current) return
    if (!authSession.getAccessToken()) return notice(t.loginRequired)
    requestInFlight.current = true
    setBusy(true)
    try {
      const session = await withConsultationTimeout((s) => customerApi.startConsultation(s))
      setConsultation(session)
      setMessages(session.messages ?? [])
      options.onError(null)
    } catch (error) {
      const message = t.startFailed(describe(error))
      notice(message)
      options.onError(message)
    } finally {
      setBusy(false)
      requestInFlight.current = false
    }
  }

  async function send(override?: string) {
    if (requestInFlight.current) return
    const body = (override ?? text).trim()
    if (!body) return
    if (!authSession.getAccessToken()) return notice(t.loginRequired)
    requestInFlight.current = true
    const current = isReusableConsultation(consultation) ? consultation : null
    let activeId = current?.id
    setBusy(true)
    setText('')
    setMessages((cur) => [
      ...cur,
      { id: `local-${Date.now()}`, senderType: 'CUSTOMER', message: body },
    ])
    const answer = consultation?.recommendedServiceId
      ? parseAiAnalysisAnswer(body)
      : undefined
    if (answer !== undefined) options.onAiAnswer(answer)
    try {
      const session =
        current ?? (await withConsultationTimeout((s) => customerApi.startConsultation(s)))
      if (!current) setConsultation(session)
      activeId = session.id
      const next = await withConsultationTimeout((signal) =>
        customerApi.sendConsultationMessage(session.id, body, {
          signal,
          requestContext: options.buildContext(body),
        }),
      )
      receive(next)
    } catch (error) {
      const recovered = activeId
        ? await recover(activeId).catch(() => false)
        : false
      if (!recovered) {
        const message = t.replyFailed(describe(error))
        notice(message)
        options.onError(message)
      }
    } finally {
      setBusy(false)
      requestInFlight.current = false
    }
  }

  function clear() {
    setConsultation(null)
    setMessages([])
    setText('')
    clearStoredDraft()
    options.onReset()
  }

  return { consultation, messages, text, setText, busy, start, send, clear }
}
