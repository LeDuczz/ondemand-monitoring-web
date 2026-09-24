// src/shared/components/AiChatWidget.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import './AiChatWidget.css'

const CHIPS = ['Hỏi về hệ thống', 'Hướng dẫn sử dụng', 'Báo lỗi', 'Hỗ trợ']

const KB: [RegExp, string][] = [
  [/h[eệ] th[oố]ng|t[ií]nh n[aă]ng/i, 'Hệ thống OnDemand Monitor hỗ trợ giám sát hiện trường bằng drone theo yêu cầu. Bạn cần hỗ trợ gì thêm?'],
  [/h[uư][oớ]ng d[aẫ]n|s[uử] d[uụ]ng|c[aá]ch/i, 'Bạn muốn hướng dẫn về chức năng nào? Tạo đơn, quản lý drone, giám sát mission hay báo cáo?'],
  [/l[oỗ]i|bug|kh[oô]ng ho[aạ]t|s[uự] c[oố]/i, 'Vui lòng mô tả lỗi chi tiết hơn: trang nào, thao tác gì, thông báo lỗi hiển thị gì?'],
  [/h[oỗ] tr[oợ]|gi[uú]p|li[eê]n h[eệ]/i, 'Bạn có thể liên hệ đội ngũ hỗ trợ qua email support@odms.vn hoặc hotline 1900-ODMS.'],
  [/drone|bay|mission/i, 'Hệ thống quản lý drone bay tự động và có người điều khiển. Bạn cần biết thêm về phần nào?'],
  [/preflight|ki[eể]m tra/i, 'Preflight kiểm tra tình trạng drone trước khi bay: kết nối, pin, cảm biến, thời tiết. Tất cả phải đạt mới được cất cánh.'],
]

type ChatMessage = { text: string; from: 'user' | 'bot' }

function getReply(text: string) {
  for (const [pattern, reply] of KB) {
    if (pattern.test(text)) return reply
  }
  return 'Mình có thể hỗ trợ về hệ thống, hướng dẫn sử dụng, báo lỗi và liên hệ. Bạn hỏi cụ thể hơn nhé.'
}

export function AiChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: 'Xin chào! Mình là trợ lý AI của OnDemand Monitor. Bạn cần hỗ trợ gì?' },
  ])
  const messagesRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; dragging: boolean }>({
    startX: 0, startY: 0, origX: 0, origY: 0, dragging: false,
  })

  useEffect(() => {
    if (!messagesRef.current) return
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages, open])

  function ask(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((cur) => [...cur, { from: 'user', text: trimmed }])
    setTimeout(() => {
      setMessages((cur) => [...cur, { from: 'bot', text: getReply(trimmed) }])
    }, 350)
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    ask(input)
    setInput('')
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top, dragging: false }
    el.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    const el = containerRef.current
    if (!el || !el.hasPointerCapture(e.pointerId)) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.dragging && Math.abs(dx) + Math.abs(dy) < 5) return
    d.dragging = true
    const x = Math.max(0, Math.min(window.innerWidth - 100, d.origX + dx))
    const y = Math.max(0, Math.min(window.innerHeight - 100, d.origY + dy))
    el.style.right = 'auto'
    el.style.bottom = 'auto'
    el.style.left = `${x}px`
    el.style.top = `${y}px`
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const el = containerRef.current
    if (!el) return
    el.releasePointerCapture(e.pointerId)
    if (!dragRef.current.dragging) {
      if (!open) setOpen(true)
    }
    dragRef.current.dragging = false
  }, [open])

  return (
    <div className="odm-ai-chat" ref={containerRef}>
      {open ? (
        <section className="odm-ai-chat-panel" aria-label="Trợ lý AI">
          <header
            className="odm-ai-chat-head"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <img src="/images/chatbot-avatar.png" alt="" />
            <span>
              <b>Trợ lý ODMS</b>
              <small>Đang trực tuyến</small>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng chatbot">×</button>
          </header>
          <div className="odm-ai-chat-msgs" ref={messagesRef}>
            {messages.map((m, i) => (
              <div key={`${m.from}-${i}`} className={`odm-ai-chat-msg is-${m.from}`}>{m.text}</div>
            ))}
          </div>
          <div className="odm-ai-chat-chips">
            {CHIPS.map((c) => (
              <button key={c} type="button" onClick={() => ask(c)}>{c}</button>
            ))}
          </div>
          <form className="odm-ai-chat-form" onSubmit={submit}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập câu hỏi..." autoComplete="off" />
            <button type="submit">Gửi</button>
          </form>
        </section>
      ) : (
        <div
          style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="odm-ai-chat-bubble">Cần hỗ trợ?</div>
          <button type="button" className="odm-ai-chat-fab" aria-label="Mở chatbot">
            <img src="/images/chatbot-avatar.png" alt="" />
          </button>
        </div>
      )}
    </div>
  )
}
