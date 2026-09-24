import { useState, useRef, useEffect } from 'react'

const KB: [RegExp, string][] = [
  [/gi[aá]|ph[ií]|chi ph[ií]|bao nhi[eê]u/i, 'Chi phí phụ thuộc loại dịch vụ, diện tích và thời lượng bay. Bạn sẽ thấy báo giá ngay khi hoàn tất bước chọn khu vực, trước khi gửi duyệt.'],
  [/duy[eệ]t|bao l[aâ]u/i, 'Đơn thường được duyệt trong khoảng 2 giờ làm việc. Đơn có điểm khả thi cao sẽ được xử lý nhanh hơn.'],
  [/th[oờ]i ti[eế]t|m[uư]a|gi[oó]/i, 'Nếu thời tiết không phù hợp, hệ thống sẽ cảnh báo và gợi ý khung giờ khác. Mission bị hoãn vì thời tiết không bị tính phí.'],
  [/c[aấ]m bay|gi[aấ]y ph[eé]p|ph[aá]p/i, 'Hệ thống tự động đối chiếu vị trí của bạn với vùng cấm bay và kiểm tra giấy phép phi công trước khi cho phép gửi yêu cầu.'],
  [/tr[uự]c ti[eế]p|live|xem/i, 'Khi mission ở trạng thái IN_FLIGHT, bạn xem được livestream, vị trí, pin và độ cao của drone trong mục Theo dõi trực tiếp.'],
  [/[aả]nh|video|k[eế]t qu[aả]|t[aả]i/i, 'Ảnh và video được kiểm tra chất lượng rồi mới đưa vào thư viện kết quả. Bạn có thể tải từng tệp hoặc cả mission.'],
  [/t[aạ]o|[dđ][aặ]t|y[eê]u c[aầ]u/i, 'Rất đơn giản: đăng nhập, chọn vị trí và khung giờ trên bản đồ, để AI kiểm tra khả thi rồi gửi duyệt. Bạn muốn mình dẫn đến bước tạo yêu cầu không?'],
]

const CHIPS = ['Cách tạo yêu cầu', 'Bao lâu được duyệt?', 'Chi phí thế nào?', 'Nếu thời tiết xấu?']

const DEFAULT_MSG = 'Mình chưa chắc về câu này. Bạn thử hỏi về chi phí, thời gian duyệt, thời tiết, vùng cấm bay hoặc cách tạo yêu cầu, hoặc liên hệ support@odms.vn nhé.'

type Msg = { text: string; from: 'user' | 'bot' }

export function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { text: 'Xin chào! Mình là trợ lý AI của OnDemand Monitor. Mình có thể giúp bạn tạo yêu cầu, kiểm tra khả thi và theo dõi mission.', from: 'bot' },
  ])
  const [input, setInput] = useState('')
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs])

  function answer(text: string) {
    let reply = DEFAULT_MSG
    for (const [pattern, response] of KB) {
      if (pattern.test(text)) { reply = response; break }
    }
    setMsgs((prev) => [...prev, { text, from: 'user' }])
    setTimeout(() => setMsgs((prev) => [...prev, { text: reply, from: 'bot' }]), 450)
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
            <img src="/images/logo-new.png" alt="" className="lp-bot-header-avatar" />
            <div>
              <b>Trợ lý ODMS</b>
              <small>● Trực tuyến · Trả lời trong giây lát</small>
            </div>
            <button className="lp-bot-close" type="button" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="lp-bot-msgs" ref={msgsRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`lp-bot-msg lp-bot-msg--${m.from}`}>{m.text}</div>
            ))}
          </div>
          <div className="lp-bot-chips">
            {CHIPS.map((s) => (
              <button key={s} type="button" onClick={() => answer(s)}>{s}</button>
            ))}
          </div>
          <form className="lp-bot-form" onSubmit={handleSubmit}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập câu hỏi của bạn..." autoComplete="off" />
            <button type="submit">Gửi</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="lp-bot">
      <div className="lp-bot-hint">Xin chào! Cần mình giúp gì không? 👋</div>
      <button className="lp-bot-fab" type="button" onClick={() => setOpen(true)}>
        <img src="/images/logo-new.png" alt="Trợ lý AI" />
        <span className="lp-bot-dot" />
      </button>
    </div>
  )
}
