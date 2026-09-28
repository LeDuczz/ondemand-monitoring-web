import { useEffect, useRef, useState } from 'react'

import { useI18n } from '../../../shared/i18n'
import { customerChatbotMessages } from './CustomerChatbot.messages'

type ReplyKey = keyof (typeof customerChatbotMessages.vi)['replies']
type ChipKey = keyof (typeof customerChatbotMessages.vi)['chips']

const CHIP_KEYS: ChipKey[] = ['createRequest', 'flightZone', 'cost', 'weather']

// Keyword matching stays Vietnamese-only (matches the customer's typed
// question, independent of the current UI language) — only the reply text
// shown to the customer is bilingual.
const KB: [RegExp, ReplyKey][] = [
  [/t[aạ]o|[dđ][aặ]t|y[eê]u c[aầ]u/i, 'createRequest'],
  [/v[uù]ng|c[aấ]m bay|b[aả]n [dđ][oồ]/i, 'flightZone'],
  [/gi[aá]|ph[ií]|chi ph[ií]|bao nhi[eê]u/i, 'cost'],
  [/th[oờ]i ti[eế]t|m[uư]a|gi[oó]/i, 'weather'],
  [/duy[eệ]t|tr[aạ]ng th[aá]i/i, 'status'],
]

type ChatMessage = {
  text: string
  from: 'user' | 'bot'
}

function getReplyKey(text: string): ReplyKey {
  for (const [pattern, key] of KB) {
    if (pattern.test(text)) return key
  }
  return 'fallback'
}

export function CustomerChatbot() {
  const { t } = useI18n(customerChatbotMessages)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: t.greeting },
  ])
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!messagesRef.current) return
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages, open])

  function ask(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((current) => [...current, { from: 'user', text: trimmed }])
    setTimeout(() => {
      setMessages((current) => [
        ...current,
        { from: 'bot', text: t.replies[getReplyKey(trimmed)] },
      ])
    }, 350)
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    ask(input)
    setInput('')
  }

  return (
    <div className={`odm-cus-chatbot ${open ? 'is-open' : ''}`}>
      {open ? (
        <section
          className="odm-cus-chatbot-panel"
          aria-label={t.assistantLabel}
        >
          <header className="odm-cus-chatbot-head">
            <img src="/images/chatbot-avatar.png" alt="" />
            <span>
              <b>{t.assistantName}</b>
              <small>{t.online}</small>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.closeChatbot}
            >
              ×
            </button>
          </header>

          <div className="odm-cus-chatbot-msgs" ref={messagesRef}>
            {messages.map((message, index) => (
              <div
                key={`${message.from}-${index}`}
                className={`odm-cus-chatbot-msg is-${message.from}`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="odm-cus-chatbot-chips">
            {CHIP_KEYS.map((key) => (
              <button key={key} type="button" onClick={() => ask(t.chips[key])}>
                {t.chips[key]}
              </button>
            ))}
          </div>

          <form className="odm-cus-chatbot-form" onSubmit={submit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.inputPlaceholder}
              autoComplete="off"
            />
            <button type="submit">{t.send}</button>
          </form>
        </section>
      ) : (
        <>
          <div className="odm-cus-chatbot-bubble">{t.bubble}</div>
          <button
            type="button"
            className="odm-cus-chatbot-fab"
            onClick={() => setOpen(true)}
            aria-label={t.openChatbot}
          >
            <img src="/images/chatbot-avatar.png" alt="" />
          </button>
        </>
      )}
    </div>
  )
}
