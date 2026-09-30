import { useState, useRef, useEffect } from 'react'

import { useI18n } from '../../../shared/i18n'
import { chatbotWidgetMessages, kbPatterns } from './ChatbotWidget.messages'

type Msg = { text: string; from: 'user' | 'bot' }

export function ChatbotWidget() {
  const { t } = useI18n(chatbotWidgetMessages)
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ text: t.greeting, from: 'bot' }])
  const [input, setInput] = useState('')
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (msgsRef.current)
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs])

  function answer(text: string) {
    let reply = t.defaultMessage
    for (let i = 0; i < kbPatterns.length; i++) {
      if (kbPatterns[i].test(text)) {
        reply = t.responses[i]
        break
      }
    }
    setMsgs((prev) => [...prev, { text, from: 'user' }])
    setTimeout(
      () => setMsgs((prev) => [...prev, { text: reply, from: 'bot' }]),
      450,
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    answer(input.trim())
    setInput('')
  }

  if (open) {
    return (
      <div className="lp-bot">
        <div className="lp-bot-win">
          <div className="lp-bot-header">
            <img
              src="/images/logo-new.png"
              alt=""
              className="lp-bot-header-avatar"
            />
            <div>
              <b>{t.assistantName}</b>
              <small>{t.onlineStatus}</small>
            </div>
            <button
              className="lp-bot-close"
              type="button"
              aria-label={t.close}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="lp-bot-msgs" ref={msgsRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`lp-bot-msg lp-bot-msg--${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="lp-bot-chips">
            {t.chips.map((s) => (
              <button key={s} type="button" onClick={() => answer(s)}>
                {s}
              </button>
            ))}
          </div>
          <form className="lp-bot-form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              autoComplete="off"
            />
            <button type="submit">{t.send}</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="lp-bot">
      <div className="lp-bot-hint">{t.hint}</div>
      <button
        className="lp-bot-fab"
        type="button"
        onClick={() => setOpen(true)}
      >
        <img src="/images/logo-new.png" alt={t.fabAriaLabel} />
        <span className="lp-bot-dot" />
      </button>
    </div>
  )
}
