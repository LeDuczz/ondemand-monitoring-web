import { useEffect, useRef, useState } from 'react'

const CHIPS = ['Tạo yêu cầu', 'Kiểm tra vùng bay', 'Chi phí', 'Thời tiết']

const KB: [RegExp, string][] = [
  [/t[aạ]o|[dđ][aặ]t|y[eê]u c[aầ]u/i, 'Bạn chọn vị trí trên bản đồ, nhập bán kính giám sát, dùng AI tư vấn mục tiêu rồi gửi yêu cầu để quản lý duyệt.'],
  [/v[uù]ng|c[aấ]m bay|b[aả]n [dđ][oồ]/i, 'Khi bạn kéo vị trí hoặc đổi bán kính, hệ thống sẽ kiểm tra vùng cấm bay và báo hợp lệ ngay trên bản đồ.'],
  [/gi[aá]|ph[ií]|chi ph[ií]|bao nhi[eê]u/i, 'Chi phí phụ thuộc diện tích, thời lượng, loại payload và độ phức tạp mission. Báo giá sẽ hiện trước khi bạn gửi duyệt.'],
  [/th[oờ]i ti[eế]t|m[uư]a|gi[oó]/i, 'Nếu thời tiết xấu, hệ thống sẽ cảnh báo và có thể gợi ý đổi lịch bay để đảm bảo an toàn.'],
  [/duy[eệ]t|tr[aạ]ng th[aá]i/i, 'Sau khi gửi yêu cầu, bạn theo dõi trạng thái ở mục Đơn của tôi và nhận thông báo khi đơn được duyệt.'],
]

type ChatMessage = {
  text: string
  from: 'user' | 'bot'
}

function getReply(text: string) {
  for (const [pattern, reply] of KB) {
    if (pattern.test(text)) return reply
  }
  return 'Mình có thể hỗ trợ về tạo yêu cầu, vùng bay, chi phí, thời tiết và trạng thái đơn. Bạn hỏi ngắn hơn một chút nhé.'
}

export function CustomerChatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: 'bot',
      text: 'Xin chào! Mình có thể hỗ trợ bạn tạo yêu cầu giám sát và kiểm tra thông tin mission.',
    },
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
      setMessages((current) => [...current, { from: 'bot', text: getReply(trimmed) }])
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
        <section className="odm-cus-chatbot-panel" aria-label="Trợ lý khách hàng">
          <header className="odm-cus-chatbot-head">
            <img src="/images/chatbot-avatar.png" alt="" />
            <span>
              <b>Trợ lý ODMS</b>
              <small>Đang trực tuyến</small>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng chatbot">
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
            {CHIPS.map((chip) => (
              <button key={chip} type="button" onClick={() => ask(chip)}>
                {chip}
              </button>
            ))}
          </div>

          <form className="odm-cus-chatbot-form" onSubmit={submit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Nhập câu hỏi..."
              autoComplete="off"
            />
            <button type="submit">Gửi</button>
          </form>
        </section>
      ) : (
        <>
          <div className="odm-cus-chatbot-bubble">Cần hỗ trợ?</div>
          <button
            type="button"
            className="odm-cus-chatbot-fab"
            onClick={() => setOpen(true)}
            aria-label="Mở chatbot"
          >
            <img src="/images/chatbot-avatar.png" alt="" />
          </button>
        </>
      )}
    </div>
  )
}
