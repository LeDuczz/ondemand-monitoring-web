import { useEffect, useRef, useState } from 'react'

import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { useConsultation } from '../hooks/useConsultation'
import { consultationChatMessages } from './ConsultationChat.messages'

type Props = { chat: ReturnType<typeof useConsultation> }
const HISTORY_KEY = 'odm.customer.consultation.quickMessages'
const HISTORY_LIMIT = 6

function readHistory() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []
  } catch {
    return []
  }
}

export function ConsultationChat({ chat }: Props) {
  const { t } = useI18n(consultationChatMessages)
  const listRef = useRef<HTMLDivElement | null>(null)
  const [history, setHistory] = useState<string[]>(() => readHistory())

  function saveHistory(message: string) {
    const cleaned = message.trim()
    if (!cleaned) return
    const next = [cleaned, ...history.filter((item) => item !== cleaned)].slice(0, HISTORY_LIMIT)
    setHistory(next)
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    } catch {
      // Ignore storage failures; quick resend is a convenience only.
    }
  }

  async function send(message = chat.text) {
    const body = message.trim()
    if (!body) return
    saveHistory(body)
    await chat.send(body)
  }

  useEffect(() => {
    listRef.current?.scrollTo?.({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [chat.messages, chat.busy])

  const actions = (
    <div className="co-head-actions">
      <button type="button" className="odm-btn odm-btn-gh odm-btn-sm" onClick={chat.clear} disabled={chat.busy}>
        {t.clearAll}
      </button>
      <button type="button" className="odm-btn odm-btn-gh odm-btn-sm" onClick={chat.start} disabled={chat.busy}>
        {chat.consultation ? t.consultAgain : t.askAi}
      </button>
    </div>
  )

  return (
    <details className="co-ai-assist">
      <summary>
        <span>
          <strong>{t.summaryTitle}</strong>
          <small>{t.summaryHint}</small>
        </span>
      </summary>
      <Card title={t.cardTitle} actions={actions} className="co-ai-card">
        <div className="co-chat-list" ref={listRef} aria-live="polite">
          {chat.messages.length === 0 && <p className="co-hint">{t.emptyHint}</p>}
          {chat.messages.map((message) => {
            const mine = message.senderType === 'CUSTOMER'
            return (
              <div key={message.id} className={`co-msg${mine ? ' is-mine' : ''}`}>
                <div className="co-msg-who">{mine ? t.you : t.assistant}</div>
                {message.message}
              </div>
            )
          })}
          {chat.busy && <div className="co-msg">{t.typing}</div>}
        </div>
        <div className="co-chat-form">
          <textarea
            className="co-input"
            rows={2}
            aria-label={t.inputLabel}
            value={chat.text}
            placeholder={t.placeholder}
            onChange={(e) => chat.setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                void send()
              }
            }}
          />
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => void send()}
            disabled={chat.busy || !chat.text.trim()}
          >
            {t.send}
          </button>
        </div>
        {history.length > 0 ? (
          <div className="co-chat-history" aria-label={t.recentTitle}>
            <span>{t.recentTitle}</span>
            <div className="co-chat-history-list">
              {history.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="co-chat-history-chip"
                  disabled={chat.busy}
                  aria-label={t.recentAria(item)}
                  title={item}
                  onClick={() => void send(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </details>
  )
}
