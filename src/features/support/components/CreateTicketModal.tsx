import { useState } from 'react'

import { authSession } from '../../auth/api/authApi'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { customerApi } from '../../customer/api/customerApi'
import { supportApi, type CreateSupportTicketRequest, type SupportTicketDto } from '../api/supportApi'

type CreateTicketModalProps = {
    initialOrderId?: string
    initialMissionId?: string
    initialCategory?: string
    initialSubject?: string
    onClose: () => void
    onSuccess: (ticket: SupportTicketDto) => void
}

export function CreateTicketModal({
    initialOrderId,
    initialMissionId,
    initialCategory = 'ORDERS',
    initialSubject = '',
    onClose,
    onSuccess,
}: CreateTicketModalProps) {
    const [category, setCategory] = useState(initialCategory)
    const [orderId, setOrderId] = useState(initialOrderId || '')
    const [missionId, setMissionId] = useState(initialMissionId || '')
    const [subject, setSubject] = useState(initialSubject)
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL')
    const [attachmentUrl, setAttachmentUrl] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [createdTicket, setCreatedTicket] = useState<SupportTicketDto | null>(null)

    const ordersQuery = useApiQuery(
        (signal) => customerApi.listOrders({ signal }),
        [],
    )
    const userOrders = ordersQuery.data?.items || []

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!subject.trim()) {
            setError('Vui lòng nhập tiêu đề yêu cầu hỗ trợ.')
            return
        }

        setSubmitting(true)
        setError(null)

        const currentUser = authSession.getUser()

        try {
            const payload: CreateSupportTicketRequest = {
                customerId: currentUser?.id,
                customerName: currentUser?.fullName || currentUser?.email || 'Customer',
                orderId: orderId.trim() || undefined,
                missionId: missionId.trim() || undefined,
                category,
                subject,
                description,
                priority,
                attachmentUrl: attachmentUrl.trim() || undefined,
            }

            const ticket = await supportApi.createTicket(payload)
            setCreatedTicket(ticket)
            onSuccess(ticket)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi tạo ticket hỗ trợ. Vui lòng thử lại.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1100,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#ffffff',
                    width: 540,
                    borderRadius: 16,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    padding: 24,
                    border: '1px solid #e2e8f0',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {!createdTicket ? (
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                                    Tạo yêu cầu hỗ trợ
                                </h3>
                                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
                                    Đội hỗ trợ kỹ thuật thường phản hồi trong vòng 15–30 phút.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="odm-btn"
                                onClick={onClose}
                                style={{ padding: '4px 10px', borderRadius: '50%', border: 'none', background: '#f1f5f9' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Context Badge if attached */}
                        {(initialOrderId || initialMissionId) && (
                            <div
                                style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 10,
                                    padding: '10px 14px',
                                    marginBottom: 16,
                                    display: 'flex',
                                    gap: 16,
                                    fontSize: 12.5,
                                }}
                            >
                                {initialOrderId && (
                                    <div>
                                        <span style={{ color: '#64748b' }}>Đơn hàng liên quan: </span>
                                        <span style={{ fontWeight: 700, color: '#2563eb' }}>
                                            📦 {initialOrderId.includes('-') && initialOrderId.length > 20 ? 'Đơn hàng đang chọn' : `#${initialOrderId}`}
                                        </span>
                                    </div>
                                )}
                                {initialMissionId && (
                                    <div>
                                        <span style={{ color: '#64748b' }}>Nhiệm vụ liên quan: </span>
                                        <span style={{ fontWeight: 700, color: '#059669' }}>
                                            🛸 {initialMissionId.includes('-') && initialMissionId.length > 20 ? 'Nhiệm vụ đang chọn' : `#${initialMissionId}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                                    Danh mục *
                                </label>
                                <select
                                    className="odm-input"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    style={{ width: '100%', height: 40, borderRadius: 8, fontSize: 13 }}
                                >
                                    <option value="ORDERS">Đơn hàng & Yêu cầu</option>
                                    <option value="MISSIONS">Nhiệm vụ bay & Lịch bay</option>
                                    <option value="RESULTS">Kết quả giám sát & Dữ liệu</option>
                                    <option value="MEDIA">Livestream & Telemetry</option>
                                    <option value="SCHEDULING">Lên lịch & Đổi lịch bay</option>
                                    <option value="ACCOUNT">Tài khoản & Quyền truy cập</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                                        Đơn hàng liên quan (Tùy chọn)
                                    </label>
                                    {userOrders.length > 0 ? (
                                        <select
                                            className="odm-input"
                                            value={orderId}
                                            onChange={(e) => setOrderId(e.target.value)}
                                            style={{ width: '100%', height: 40, borderRadius: 8, fontSize: 13 }}
                                        >
                                            <option value="">-- Không chọn Đơn hàng --</option>
                                            {initialOrderId && !userOrders.some((o) => o.id === initialOrderId || o.orderCode === initialOrderId) && (
                                                <option value={initialOrderId}>
                                                    📦 {initialOrderId.includes('-') && initialOrderId.length > 20 ? 'Đơn hàng đang chọn' : `#${initialOrderId}`} (Hiện tại)
                                                </option>
                                            )}
                                            {userOrders.map((ord) => (
                                                <option key={ord.id} value={ord.id}>
                                                    📦 #{ord.orderCode || (ord.id.includes('-') && ord.id.length > 20 ? `ORD-${ord.id.slice(0, 6).toUpperCase()}` : ord.id)} - {ord.title} ({ord.status})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            className="odm-input"
                                            value={orderId}
                                            onChange={(e) => setOrderId(e.target.value)}
                                            placeholder="Mã đơn hàng (ví dụ: ORD-2026-0001)"
                                            style={{ width: '100%', height: 40, borderRadius: 8, fontSize: 13 }}
                                        />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                                        Mã Nhiệm vụ liên quan (Tùy chọn)
                                    </label>
                                    <input
                                        className="odm-input"
                                        value={missionId}
                                        onChange={(e) => setMissionId(e.target.value)}
                                        placeholder="Mã nhiệm vụ (ví dụ: MSN-2026-0005)"
                                        style={{ width: '100%', height: 40, borderRadius: 8, fontSize: 13 }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                                    Tiêu đề *
                                </label>
                                <input
                                    className="odm-input"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Mô tả ngắn gọn vấn đề của bạn..."
                                    style={{ width: '100%', height: 40, borderRadius: 8, fontSize: 13 }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                                    Nội dung / Chi tiết
                                </label>
                                <textarea
                                    className="odm-input"
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Mô tả điều đã xảy ra hoặc bạn cần hỗ trợ về vấn đề gì..."
                                    style={{ width: '100%', borderRadius: 8, fontSize: 13, resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                                        Mức ưu tiên
                                    </label>
                                    <select
                                        className="odm-input"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as 'NORMAL' | 'HIGH' | 'URGENT')}
                                        style={{ width: '100%', height: 40, borderRadius: 8, fontSize: 13 }}
                                    >
                                        <option value="NORMAL">Bình thường</option>
                                        <option value="HIGH">Cao</option>
                                        <option value="URGENT">Khẩn cấp</option>
                                    </select>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                                        Đường dẫn đính kèm (Tùy chọn)
                                    </label>
                                    <input
                                        className="odm-input"
                                        value={attachmentUrl}
                                        onChange={(e) => setAttachmentUrl(e.target.value)}
                                        placeholder="https://... (screenshot / video link)"
                                        style={{ width: '100%', height: 40, borderRadius: 8, fontSize: 13 }}
                                    />
                                </div>
                            </div>

                            {error && <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>{error}</div>}

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" className="odm-btn" onClick={onClose} disabled={submitting}>
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="odm-btn odm-btn-p"
                                    disabled={submitting}
                                    style={{
                                        background: '#4f46e5',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        height: 40,
                                        padding: '0 20px',
                                        borderRadius: 8,
                                        border: 'none',
                                    }}
                                >
                                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu hỗ trợ'}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: '#f0fdf4',
                                color: '#166534',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 24,
                                margin: '0 auto 14px',
                                fontWeight: 700,
                            }}
                        >
                            ✓
                        </div>
                        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                            Yêu cầu hỗ trợ của bạn đã được tạo thành công
                        </h3>
                        <p style={{ margin: '0 0 16px', fontSize: 13.5, color: '#64748b' }}>
                            Mã Ticket: <b className="odm-mono" style={{ color: '#4f46e5' }}>{createdTicket.ticketCode}</b> · Trạng thái: <b>{createdTicket.status}</b>
                        </p>

                        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 12.5, color: '#475569', marginBottom: 20 }}>
                            Thời gian phản hồi dự kiến: <b>15 – 30 phút</b>. Bạn sẽ nhận được cập nhật trực tiếp trong trung tâm thông báo.
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button
                                type="button"
                                className="odm-btn"
                                onClick={onClose}
                            >
                                Đóng
                            </button>
                            <a
                                href={`#help/tickets/${createdTicket.id}`}
                                className="odm-btn odm-btn-p"
                                onClick={onClose}
                                style={{
                                    background: '#4f46e5',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    padding: '8px 18px',
                                    borderRadius: 8,
                                    textDecoration: 'none',
                                }}
                            >
                                Xem chi tiết Ticket →
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
