# Drone Operator Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder the drone-operator flight stepper so Preflight comes before Handover, simplify the Handover screen to a read + popup confirmation with a "Vào buồng lái" button, and add a draggable AI chatbot to every portal layout.

**Architecture:** Extract `CustomerChatbot` into a shared `AiChatWidget` component with drag support, then mount it in every portal's layout. Reorder stepper steps and rewire navigation so Connect → Preflight → Handover → Flight. Simplify HandoverScreen to a read-only text + modal pattern.

**Tech Stack:** React 19, TypeScript, CSS (inline styles + shared CSS classes already in codebase)

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/shared/components/AiChatWidget.tsx` | Draggable floating AI chatbot (extracted from CustomerChatbot) |
| Create | `src/shared/components/AiChatWidget.css` | Styles for draggable chatbot (moved from customer.css) |
| Modify | `src/features/drone-operator/pages/FlightStepper.tsx` | Swap steps 4 & 5 (Preflight before Handover) |
| Modify | `src/features/drone-operator/pages/HandoverScreen.tsx` | Rewrite: read text + popup + "Vào buồng lái" button |
| Modify | `src/features/drone-operator/pages/HandoverBanners.tsx` | Update ConfirmedBanner: link to flight instead of preflight |
| Modify | `src/features/drone-operator/pages/PreflightScreen.tsx` | Change step index from 4→3, navigation back to connect |
| Modify | `src/features/drone-operator/pages/ConnectStatusPanel.tsx` | "Tiếp theo" links to preflight instead of handover |
| Modify | `src/features/drone-operator/OperatorLayout.tsx` | Add AiChatWidget |
| Modify | `src/features/manager/components/ManagerLayout.tsx` | Add AiChatWidget |
| Modify | `src/features/admin/AdminLayout.tsx` | Add AiChatWidget |
| Modify | `src/features/customer/CustomerLayout.tsx` | Replace CustomerChatbot with AiChatWidget |
| Modify | `src/features/customer/components/CustomerChatbot.tsx` | Re-export from AiChatWidget for backward compat |

---

### Task 1: Create shared AiChatWidget component

**Files:**
- Create: `src/shared/components/AiChatWidget.css`
- Create: `src/shared/components/AiChatWidget.tsx`

- [ ] **Step 1: Create CSS file**

Copy the chatbot CSS from `src/features/customer/customer.css` lines 400–582, replacing the `.odm-cus-chatbot` prefix with `.odm-ai-chat`. Add drag cursor and transition styles:

```css
/* src/shared/components/AiChatWidget.css */

.odm-ai-chat {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 240;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  pointer-events: none;
  transition: left 0.05s, top 0.05s;
}

.odm-ai-chat * {
  pointer-events: auto;
}

.odm-ai-chat-fab {
  width: 86px;
  height: 86px;
  border: 0;
  border-radius: 50%;
  padding: 0;
  background: transparent;
  cursor: grab;
  filter: drop-shadow(0 18px 24px rgba(15, 23, 42, 0.24));
  animation: odm-ai-chat-float 2.8s ease-in-out infinite;
}

.odm-ai-chat-fab:active {
  cursor: grabbing;
  animation: none;
}

.odm-ai-chat-fab img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.odm-ai-chat-bubble {
  margin-bottom: 16px;
  max-width: 150px;
  border: 1px solid var(--bd);
  border-radius: 999px;
  background: var(--sf);
  box-shadow: var(--shadow);
  color: var(--tx);
  font-size: 13px;
  font-weight: 700;
  padding: 9px 13px;
  animation: odm-ai-chat-float 2.8s ease-in-out infinite;
}

.odm-ai-chat-panel {
  width: min(360px, calc(100vw - 28px));
  border: 1px solid var(--bd);
  border-radius: 16px;
  overflow: hidden;
  background: var(--sf);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.25);
}

.odm-ai-chat-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--bd);
  background: linear-gradient(135deg, #e0f2fe, #dcfce7);
  cursor: grab;
}

.odm-ai-chat-head:active {
  cursor: grabbing;
}

.odm-ai-chat-head img {
  width: 46px;
  height: 46px;
  object-fit: contain;
  flex: none;
}

.odm-ai-chat-head span {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.odm-ai-chat-head b { font-size: 15px; }
.odm-ai-chat-head small { color: var(--tx3); font-size: 12px; }

.odm-ai-chat-head button {
  width: 30px;
  height: 30px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}

.odm-ai-chat-msgs {
  height: 260px;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.odm-ai-chat-msg {
  max-width: 85%;
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 13.5px;
  line-height: 1.45;
}

.odm-ai-chat-msg.is-bot {
  align-self: flex-start;
  background: var(--sf3);
  color: var(--tx);
}

.odm-ai-chat-msg.is-user {
  align-self: flex-end;
  background: var(--ink);
  color: var(--inkfg);
}

.odm-ai-chat-chips {
  display: flex;
  gap: 6px;
  padding: 0 14px 10px;
  flex-wrap: wrap;
}

.odm-ai-chat-chips button {
  border: 1px solid var(--bd);
  border-radius: 999px;
  background: var(--sf);
  color: var(--tx);
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
}

.odm-ai-chat-form {
  display: flex;
  border-top: 1px solid var(--bd);
  padding: 10px;
  gap: 8px;
}

.odm-ai-chat-form input {
  flex: 1;
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  background: var(--sf);
  color: var(--tx);
}

.odm-ai-chat-form button {
  border: 0;
  border-radius: 8px;
  background: var(--ink);
  color: var(--inkfg);
  padding: 8px 16px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

@keyframes odm-ai-chat-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
```

- [ ] **Step 2: Create AiChatWidget component**

```tsx
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/shared/components/AiChatWidget.tsx src/shared/components/AiChatWidget.css
git commit -m "feat: create shared draggable AiChatWidget component"
```

---

### Task 2: Add AiChatWidget to all portal layouts

**Files:**
- Modify: `src/features/drone-operator/OperatorLayout.tsx`
- Modify: `src/features/manager/components/ManagerLayout.tsx`
- Modify: `src/features/admin/AdminLayout.tsx`
- Modify: `src/features/customer/CustomerLayout.tsx`

- [ ] **Step 1: Add to OperatorLayout**

In `src/features/drone-operator/OperatorLayout.tsx`, add import and render:

```tsx
import { AiChatWidget } from '../../shared/components/AiChatWidget'
```

Inside the return, add `<AiChatWidget />` just before the closing `</div>` of `.odm-opr-shell`:

```tsx
      </div>{/* end odm-opr-body */}
      <AiChatWidget />
    </div>{/* end odm-opr-shell */}
```

- [ ] **Step 2: Add to ManagerLayout**

In `src/features/manager/components/ManagerLayout.tsx`, add import:

```tsx
import { AiChatWidget } from '../../../shared/components/AiChatWidget'
```

Add `<AiChatWidget />` inside the layout's outermost wrapper, at the end.

- [ ] **Step 3: Add to AdminLayout**

In `src/features/admin/AdminLayout.tsx`, add import:

```tsx
import { AiChatWidget } from '../../shared/components/AiChatWidget'
```

Add `<AiChatWidget />` inside the layout's outermost wrapper, at the end.

- [ ] **Step 4: Replace in CustomerLayout**

In `src/features/customer/CustomerLayout.tsx`, replace `CustomerChatbot` import with `AiChatWidget`:

```tsx
// Remove: import { CustomerChatbot } from './components/CustomerChatbot'
import { AiChatWidget } from '../../shared/components/AiChatWidget'
```

Replace `<CustomerChatbot />` with `<AiChatWidget />`.

- [ ] **Step 5: Update CustomerChatbot as re-export**

Replace `src/features/customer/components/CustomerChatbot.tsx` content with:

```tsx
export { AiChatWidget as CustomerChatbot } from '../../../shared/components/AiChatWidget'
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add src/features/drone-operator/OperatorLayout.tsx \
  src/features/manager/components/ManagerLayout.tsx \
  src/features/admin/AdminLayout.tsx \
  src/features/customer/CustomerLayout.tsx \
  src/features/customer/components/CustomerChatbot.tsx
git commit -m "feat: add AI chatbot to all portal layouts"
```

---

### Task 3: Reorder stepper — Preflight before Handover

**Files:**
- Modify: `src/features/drone-operator/pages/FlightStepper.tsx`

- [ ] **Step 1: Swap step order**

In `FlightStepper.tsx`, change the STEPS array from:

```tsx
const STEPS: { key: string; label: string }[] = [
  { key: 'accept', label: 'Nhận' },
  { key: 'ready', label: 'Sẵn sàng' },
  { key: 'connect', label: 'Kết nối' },
  { key: 'handover', label: 'Bàn giao' },
  { key: 'preflight', label: 'Preflight' },
  { key: 'flight', label: 'Bay' },
  { key: 'upload', label: 'Upload' },
  { key: 'postflight', label: 'Postflight' },
]
```

To:

```tsx
const STEPS: { key: string; label: string }[] = [
  { key: 'accept', label: 'Nhận' },
  { key: 'ready', label: 'Sẵn sàng' },
  { key: 'connect', label: 'Kết nối' },
  { key: 'preflight', label: 'Preflight' },
  { key: 'handover', label: 'Bàn giao' },
  { key: 'flight', label: 'Bay' },
  { key: 'upload', label: 'Upload' },
  { key: 'postflight', label: 'Postflight' },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/features/drone-operator/pages/FlightStepper.tsx
git commit -m "feat: reorder stepper — preflight before handover"
```

---

### Task 4: Update step indices and navigation links

**Files:**
- Modify: `src/features/drone-operator/pages/PreflightScreen.tsx`
- Modify: `src/features/drone-operator/pages/HandoverScreen.tsx`
- Modify: `src/features/drone-operator/pages/ConnectStatusPanel.tsx`
- Modify: `src/features/drone-operator/pages/HandoverBanners.tsx`

- [ ] **Step 1: PreflightScreen — change step index 4→3**

In `PreflightScreen.tsx`, in the `PreflightChecklistPanel` component, find:

```tsx
<FlightStepHeader
  title="Preflight checklist"
  missionId={missionId}
  active={4}
```

Change `active={4}` to `active={3}`.

- [ ] **Step 2: PreflightScreen — change "Tiếp tục tới buồng lái" to navigate to handover**

In `PreflightScreen.tsx`, in the `SummaryBanner` component, find the ready-state link:

```tsx
<a
  className="odm-btn odm-btn-ok"
  href={operatorHref({ screen: 'flight' })}
  style={{ minWidth: 220 }}
>
  Tiếp tục tới buồng lái
</a>
```

Change to:

```tsx
<a
  className="odm-btn odm-btn-ok"
  href={operatorHref({ screen: 'handover' })}
  style={{ minWidth: 220 }}
>
  Tiếp tục tới Bàn giao
</a>
```

Also change the `onReady` button text from "Tiếp tục tới buồng lái" to "Tiếp tục tới Bàn giao", and update the disabled button text similarly.

- [ ] **Step 3: PreflightScreen — remove handover check in handleEnterSimulation**

In `PreflightScreen.tsx`, in `handleEnterSimulation`, remove or comment out the handover acknowledgement check:

```tsx
// Remove these lines:
if (window.sessionStorage.getItem(`fieldwise.operator.handoverAcknowledged.${mission.missionId}`) !== 'true') {
  setStartError('Vui lòng xác nhận cam kết bàn giao trước khi bay')
  return
}
```

The handover now happens AFTER preflight, so preflight should not check for it.

- [ ] **Step 4: ConnectStatusPanel — "next" link to preflight**

In `src/features/drone-operator/pages/ConnectStatusPanel.tsx`, find any navigation to handover and change to preflight:

```tsx
// Change: href={operatorHref({ screen: 'handover' })}
// To:     href={operatorHref({ screen: 'preflight' })}
```

- [ ] **Step 5: HandoverBanners — ConfirmedBanner links to flight**

In `HandoverBanners.tsx`, in `ConfirmedBanner`, change:

```tsx
href={operatorHref({ screen: 'preflight' })}
```

To:

```tsx
href={operatorHref({ screen: 'flight' })}
```

And change the button text from "Tiếp tục tới Preflight" to "Vào buồng lái".

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add src/features/drone-operator/pages/PreflightScreen.tsx \
  src/features/drone-operator/pages/ConnectStatusPanel.tsx \
  src/features/drone-operator/pages/HandoverBanners.tsx
git commit -m "feat: update step indices and navigation for new order"
```

---

### Task 5: Rewrite HandoverScreen — simple read + popup

**Files:**
- Modify: `src/features/drone-operator/pages/HandoverScreen.tsx`

- [ ] **Step 1: Rewrite HandoverScreen**

Replace the entire content of `HandoverScreen.tsx` with:

```tsx
import { useState } from 'react'

import { useActiveMission } from '../api/useActiveMission'
import { operatorHref } from '../routes'
import { FlightStepHeader } from './FlightStepper'

const COMMITMENT_TEXT =
  'Tôi xác nhận đã kiểm tra toàn bộ điều kiện bay, đảm bảo an toàn khu vực, ' +
  'tuân thủ quy định vùng cấm, giữ drone trong tầm nhìn và sẵn sàng xử lý ' +
  'mọi tình huống khẩn cấp. Tôi chịu trách nhiệm hoàn toàn về vận hành drone ' +
  'từ lúc xác nhận cho tới khi drone hạ cánh và tắt động cơ.'

export function HandoverScreen() {
  const mission = useActiveMission()
  const missionLabel = mission.data?.missionCode ?? mission.missionId ?? 'Chưa chọn mission'
  const droneLabel = mission.data?.droneCode ?? 'Chưa gán drone'
  const [showPopup, setShowPopup] = useState(false)
  const [confirmed, setConfirmed] = useState(() => {
    if (!mission.missionId) return false
    return window.sessionStorage.getItem(`fieldwise.operator.handoverAcknowledged.${mission.missionId}`) === 'true'
  })

  function handleConfirm() {
    if (mission.missionId) {
      window.sessionStorage.setItem(`fieldwise.operator.handoverAcknowledged.${mission.missionId}`, 'true')
    }
    setConfirmed(true)
    setShowPopup(false)
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader title="Bàn giao quyền điều khiển" missionId={missionLabel} active={4} />
      <div style={{ padding: '18px 22px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DroneStrip missionLabel={missionLabel} droneLabel={droneLabel} />

          <div className="odm-card">
            <div className="odm-card-body" style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                Cam kết an toàn trước khi nhận quyền điều khiển
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--tx2)', margin: 0 }}>
                Trước khi tiếp nhận quyền điều khiển drone, bạn cần đọc và xác nhận cam kết an toàn vận hành.
                Cam kết bao gồm: kiểm tra khu vực bay, tuân thủ vùng cấm, giữ drone trong tầm nhìn,
                sẵn sàng xử lý khẩn cấp, và chịu trách nhiệm toàn bộ quá trình bay.
              </p>
            </div>
          </div>

          {confirmed ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, padding: '10px 14px', borderRadius: 8,
                background: 'var(--green-bg)', color: 'var(--green-fg)', border: '1px solid var(--green-dot)',
              }}>
                <span>Bạn đã xác nhận bàn giao quyền điều khiển.</span>
              </div>
              <a className="odm-btn odm-btn-p" href={operatorHref({ screen: 'flight' })} style={{ textAlign: 'center' }}>
                Vào buồng lái
              </a>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <a className="odm-btn" href={operatorHref({ screen: 'preflight' })} style={{ minWidth: 150 }}>
                Quay lại
              </a>
              <button type="button" className="odm-btn odm-btn-p" onClick={() => setShowPopup(true)} style={{ flex: 1 }}>
                Tôi đã đọc
              </button>
            </div>
          )}
        </div>
      </div>

      {showPopup && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
          }}
          onClick={() => setShowPopup(false)}
        >
          <div
            style={{
              background: 'var(--sf)', borderRadius: 16, padding: '24px 28px',
              maxWidth: 480, width: '90%', boxShadow: '0 24px 70px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
              Xác nhận cam kết an toàn
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--tx2)', margin: '0 0 20px' }}>
              {COMMITMENT_TEXT}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="odm-btn" onClick={() => setShowPopup(false)} style={{ flex: 1 }}>
                Hủy
              </button>
              <button type="button" className="odm-btn odm-btn-p" onClick={handleConfirm} style={{ flex: 1 }}>
                Tôi đã xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DroneStrip({ missionLabel, droneLabel }: { missionLabel: string; droneLabel: string }) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'center', padding: '10px 14px',
      background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 12,
    }}>
      <span style={{
        width: 40, height: 40, borderRadius: 10, background: 'var(--sf3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
      }}>
        🔗
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{droneLabel} · {missionLabel}</div>
        <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>Preflight đã PASS · Sẵn sàng bay</div>
      </div>
      <span className="odm-badge odm-badge-green odm-badge-lg">
        <span className="odm-badge-dot" aria-hidden="true" />
        Sẵn sàng
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/features/drone-operator/pages/HandoverScreen.tsx
git commit -m "feat: rewrite handover screen — read + popup confirmation + enter cockpit button"
```

---

### Task 6: Verify in browser and final cleanup

- [ ] **Step 1: Start dev server and test flow**

Navigate to `http://localhost:5173/#portal/drone-operator/missions`, pick a mission, walk through:
1. Connect screen (step 3) → next goes to Preflight
2. Preflight screen (step 4 in old, now step 3 in stepper)
3. After preflight pass → "Tiếp tục tới Bàn giao"
4. Handover screen → read text → "Tôi đã đọc" → popup appears
5. Click "Tôi đã xác nhận" → confirmed → "Vào buồng lái" button visible
6. AI chatbot floating in bottom-right, draggable

- [ ] **Step 2: Check AI chatbot appears on all portals**

- `/#portal/drone-operator` — chatbot visible
- `/#manager` — chatbot visible
- `/#admin` — chatbot visible
- `/#customer` — chatbot visible (replaced old CustomerChatbot)

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: All existing tests pass (608+)

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for drone-operator redesign"
```
