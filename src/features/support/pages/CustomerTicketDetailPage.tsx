import { useState } from 'react'

import { authSession } from '../../auth/api/authApi'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { customerHref } from '../../customer/routes'
import { supportApi } from '../api/supportApi'

export function CustomerTicketDetailPage({ ticketId }: { ticketId: string }) {
    const [replyContent, setReplyContent] = useState('')
    const [replyAttachment, setReplyAttachment] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const query = useApiQuery(
        (signal) => supportApi.getTicketById(ticketId, signal),
        [ticketId],
    )

    const ticket = query.data

    async function handleSendReply(e: React.FormEvent) {
        e.preventDefault()
        if (!replyContent.trim()) return

        setSending(true)
        setError(null)

        const currentUser = authSession.getUser()

        try {
            await supportApi.addMessage(ticketId, {
                senderId: currentUser?.id,
                senderName: currentUser?.fullName || currentUser?.email || 'User',
                senderRole: currentUser?.role === 'STAFF' ? 'STAFF' : 'CUSTOMER',
                content: replyContent,
                attachmentUrl: replyAttachment.trim() || undefined,
            })

            setReplyContent('')
            setReplyAttachment('')
            query.reload()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể gửi phản hồi.')
        } finally {
            setSending(false)
        }
    }

    const statusTone: Record<string, { bg: string; text: string; label: string }> = {
        OPEN: { bg: '#eff6ff', text: '#1d4ed8', label: 'MỚI MỞ' },
        ASSIGNED: { bg: '#fefce8', text: '#a16207', label: 'ĐÃ PHÂN CÔNG' },
        IN_PROGRESS: { bg: '#eff6ff', text: '#2563eb', label: 'ĐANG XỬ LÝ' },
        WAITING_FOR_CUSTOMER: { bg: '#fff7ed', text: '#c2410c', label: 'CHờ BẠN PHẢN HỒI' },
        WAITING_FOR_STAFF: { bg: '#fefce8', text: '#a16207', label: 'CHờ HỖ TRỢ' },
        RESOLVED: { bg: '#f0fdf4', text: '#15803d', label: 'ĐÃ GIẢI QUYẾT' },
        CLOSED: { bg: '#f1f5f9', text: '#475569', label: 'ĐÃ ĐÓNG' },
    }

    if (query.loading) {
        return (
            <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }} aria-busy="true">
                <div className="odm-sk" style={{ height: 200, borderRadius: 12, marginBottom: 16 }} />
                <div className="odm-sk" style={{ height: 300, borderRadius: 12 }} />
            </div>
        )
    }

    if (!ticket) {
        return (
            <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, textAlign: 'center' }}>
                <h3>Ticket không tồn tại hoặc đã bị xóa.</h3>
                <a href="#help/tickets" className="odm-btn" style={{ textDecoration: 'none' }}>
                    ← Trở lại danh sách Ticket
                </a>
            </div>
        )
    }

    const tone = statusTone[ticket.status] || statusTone.OPEN

    return (
        <div style={{ background: 'transparent', padding: '12px 0 24px 0' }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
                {/* Navigation Top Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <a
                        href="#help/tickets"
                        className="odm-btn"
                        style={{ fontSize: 13, textDecoration: 'none', padding: '6px 14px', borderRadius: 8 }}
                    >
                        ← Danh sách yêu cầu hỗ trợ
                    </a>
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                        Mã Ticket: <b className="odm-mono" style={{ color: '#0f172a' }}>{ticket.ticketCode}</b>
                    </span>
                </div>

                {/* Ticket Overview Card */}
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 14,
                        padding: 24,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        marginBottom: 20,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                                <span
                                    style={{
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        padding: '3px 10px',
                                        borderRadius: 6,
                                        background: tone.bg,
                                        color: tone.text,
                                    }}
                                >
                                    {tone.label}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11.5,
                                        fontWeight: 600,
                                        padding: '3px 8px',
                                        borderRadius: 6,
                                        background: '#f1f5f9',
                                        color: '#475569',
                                    }}
                                >
                                    {ticket.category}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11.5,
                                        fontWeight: 600,
                                        padding: '3px 8px',
                                        borderRadius: 6,
                                        background: ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? '#fef2f2' : '#f8fafc',
                                        color: ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? '#ef4444' : '#64748b',
                                    }}
                                >
                                    Ưu tiên: {ticket.priority}
                                </span>
                            </div>
                            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                                {ticket.subject}
                            </h1>
                        </div>

                        <div style={{ fontSize: 12.5, color: '#94a3b8', textAlign: 'right' }}>
                            Tạo lúc: {new Date(ticket.openedAt).toLocaleString('vi-VN')}
                        </div>
                    </div>

                    {/* Context Ribbon if attached */}
                    {(ticket.orderId || ticket.missionId) && (
                        <div
                            style={{
                                background: '#f8fafc',
                                borderRadius: 10,
                                padding: '10px 14px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                gap: 20,
                                fontSize: 13,
                                marginTop: 12,
                            }}
                        >
                            {ticket.orderId && (
                                <div>
                                    <span style={{ color: '#64748b' }}>Đơn hàng liên quan: </span>
                                    <a
                                        href={customerHref({ screen: 'orderDetail', orderId: ticket.orderId })}
                                        className="odm-action-link"
                                        style={{ fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}
                                    >
                                        🔗 Xem chi tiết Đơn hàng ↗
                                    </a>
                                </div>
                            )}
                            {ticket.missionId && (
                                <div>
                                    <span style={{ color: '#64748b' }}>Nhiệm vụ liên quan: </span>
                                    <a
                                        href={customerHref({ screen: 'live', orderId: ticket.orderId || ticket.missionId })}
                                        className="odm-action-link-green"
                                        style={{ fontWeight: 700, color: '#059669', textDecoration: 'none' }}
                                    >
                                        🛸 Xem trực tiếp Nhiệm vụ ↗
                                    </a>
                                </div>
                            )}
                            {ticket.assignedStaffName && (
                                <div>
                                    <span style={{ color: '#64748b' }}>Nhân viên phụ trách: </span>
                                    <b style={{ color: '#059669' }}>{ticket.assignedStaffName}</b>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Conversation Timeline */}
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 14,
                        padding: 24,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        marginBottom: 20,
                    }}
                >
                    <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                        Lịch sử hồ thoại
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                        {(!ticket.messages || ticket.messages.length === 0) && (
                            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>
                                {ticket.description || 'Chưa có tin nhắn trong cuộc trò chuyện này.'}
                            </div>
                        )}

                        {ticket.messages?.map((msg) => {
                            const isCustomer = msg.senderRole === 'CUSTOMER'
                            return (
                                <div
                                    key={msg.id}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: isCustomer ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 12 }}>
                                        <span style={{ fontWeight: 700, color: isCustomer ? '#4f46e5' : '#059669' }}>
                                            {msg.senderName} ({msg.senderRole})
                                        </span>
                                        <span style={{ color: '#94a3b8' }}>
                                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            maxWidth: '80%',
                                            background: isCustomer ? '#eff6ff' : '#f8fafc',
                                            border: isCustomer ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                            borderRadius: 12,
                                            padding: '12px 16px',
                                            color: '#1e293b',
                                            fontSize: 13.5,
                                            lineHeight: 1.5,
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {msg.content}

                                        {msg.attachmentUrl && (
                                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                                <a
                                                    href={msg.attachmentUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}
                                                >
                                                    📎 Xem đính kèm
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Reply Form */}
                    {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' ? (
                        <form onSubmit={handleSendReply} style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                            <div style={{ marginBottom: 10 }}>
                                <textarea
                                    className="odm-input"
                                    rows={3}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Nhập phản hồi của bạn tại đây..."
                                    style={{ width: '100%', borderRadius: 10, fontSize: 13, resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <input
                                    className="odm-input"
                                    value={replyAttachment}
                                    onChange={(e) => setReplyAttachment(e.target.value)}
                                    placeholder="Đường dẫn đính kèm (tùy chọn)"
                                    style={{ width: '60%', height: 36, borderRadius: 8, fontSize: 12.5 }}
                                />

                                <button
                                    type="submit"
                                    className="odm-btn odm-btn-p"
                                    disabled={sending || !replyContent.trim()}
                                    style={{
                                        background: '#4f46e5',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        height: 38,
                                        padding: '0 20px',
                                        borderRadius: 8,
                                        border: 'none',
                                    }}
                                >
                                    {sending ? 'Đang gửi...' : 'Gửi phản hồi'}
                                </button>
                            </div>

                            {error && <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, marginTop: 8 }}>{error}</div>}
                        </form>
                    ) : (
                        <div
                            style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                padding: 12,
                                borderRadius: 10,
                                textAlign: 'center',
                                color: '#15803d',
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            Phiếu hỗ trợ này đã được đánh dấu là ĐÃ GIẢI QUYẾT. Nếu bạn vẫn còn thắc mắc, vui lòng tạo yêu cầu hỗ trợ mới.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
