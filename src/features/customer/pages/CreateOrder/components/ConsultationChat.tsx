import { useEffect, useRef } from 'react'

import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { useConsultation } from '../hooks/useConsultation'
import { consultationChatMessages } from './ConsultationChat.messages'

type Props = { chat: ReturnType<typeof useConsultation> }

export function ConsultationChat({ chat }: Props) {
  const { t } = useI18n(consultationChatMessages)
  const listRef = useRef<HTMLDivElement | null>(null)

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
    <Card title={t.cardTitle} actions={actions}>
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
              void chat.send()
            }
          }}
        />
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={() => void chat.send()}
          disabled={chat.busy || !chat.text.trim()}
        >
          {t.send}
        </button>
      </div>
    </Card>
  )
}
