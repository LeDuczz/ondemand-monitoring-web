import { useState } from 'react'

import { authSession } from '../../auth/api/authApi'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { customerHref } from '../../customer/routes'
import { supportApi } from '../api/supportApi'
import { CreateTicketModal } from '../components/CreateTicketModal'

export function CustomerTicketsListPage() {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [statusFilter, setStatusFilter] = useState('ALL')

    const currentUser = authSession.getUser()

    const query = useApiQuery(
        (signal) => supportApi.listTickets(currentUser?.id, undefined, signal),
        [currentUser?.id],
    )

    const tickets = query.data || []
    const filtered = tickets.filter((t) => statusFilter === 'ALL' || t.status === statusFilter)

    const statusTone: Record<string, { bg: string; text: string; label: string }> = {
        OPEN: { bg: '#eff6ff', text: '#1d4ed8', label: 'OPEN' },
        ASSIGNED: { bg: '#fefce8', text: '#a16207', label: 'ASSIGNED' },
        IN_PROGRESS: { bg: '#eff6ff', text: '#2563eb', label: 'IN PROGRESS' },
        WAITING_FOR_CUSTOMER: { bg: '#fff7ed', text: '#c2410c', label: 'WAITING FOR YOU' },
        WAITING_FOR_STAFF: { bg: '#fefce8', text: '#a16207', label: 'WAITING FOR SUPPORT' },
        RESOLVED: { bg: '#f0fdf4', text: '#15803d', label: 'RESOLVED' },
        CLOSED: { bg: '#f1f5f9', text: '#475569', label: 'CLOSED' },
    }

    return (
        <div style={{ background: 'transparent', padding: '12px 0 24px 0' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Navigation & Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <a
                            href="#help"
                            className="odm-btn"
                            style={{ fontSize: 13, textDecoration: 'none', padding: '6px 12px', borderRadius: 8 }}
                        >
                            ← Trung tâm hỗ trợ
                        </a>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>/</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Yêu cầu hỗ trợ của tôi</span>
                    </div>

                    <button
                        type="button"
                        className="odm-btn odm-btn-p"
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            padding: '6px 16px',
                            borderRadius: 8,
                            background: '#4f46e5',
                            color: '#ffffff',
                            border: 'none',
                        }}
                    >
                        + Tạo yêu cầu hỗ trợ
                    </button>
                </div>

                {/* Filter Bar */}
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 12,
                        padding: '14px 18px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                        Tổng số phiếu: <b style={{ color: '#0f172a' }}>{filtered.length}</b>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12.5, color: '#64748b' }}>Lọc trạng thái:</span>
                        <select
                            className="odm-input"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ height: 36, borderRadius: 8, fontSize: 13 }}
                        >
                            <option value="ALL">Tất cả</option>
                            <option value="OPEN">Mới mở</option>
                            <option value="IN_PROGRESS">Đang xử lý</option>
                            <option value="WAITING_FOR_CUSTOMER">Chờ khách hàng</option>
                            <option value="RESOLVED">Đã giải quyết</option>
                        </select>
                    </div>
                </div>

                {/* Tickets List */}
                {query.loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="odm-sk" style={{ height: 90, borderRadius: 12 }} />
                        <div className="odm-sk" style={{ height: 90, borderRadius: 12 }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            padding: '48px 24px',
                            textAlign: 'center',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <h4 style={{ margin: '0 0 6px', fontSize: 16, color: '#0f172a' }}>
                            Bạn chưa có yêu cầu hỗ trợ nào
                        </h4>
                        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
                            Nếu bạn gặp bất kỳ sự cố nào với đơn hàng hoặc nhiệm vụ bay, đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ.
                        </p>
                        <button
                            type="button"
                            className="odm-btn odm-btn-p"
                            onClick={() => setShowCreateModal(true)}
                            style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8 }}
                        >
                            Tạo yêu cầu hỗ trợ đầu tiên
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filtered.map((t) => {
                            const tone = statusTone[t.status] || statusTone.OPEN
                            return (
                                <div
                                    key={t.id}
                                    className="odm-hover-glow"
                                    onClick={() => {
                                        window.location.hash = `#help/tickets/${t.id}`
                                    }}
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: 12,
                                        border: '1px solid #e2e8f0',
                                        padding: 18,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span className="odm-mono" style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>
                                                {t.ticketCode}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    padding: '2px 8px',
                                                    borderRadius: 6,
                                                    background: tone.bg,
                                                    color: tone.text,
                                                }}
                                            >
                                                {tone.label}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    padding: '2px 8px',
                                                    borderRadius: 6,
                                                    background: '#f1f5f9',
                                                    color: '#475569',
                                                }}
                                            >
                                                {t.category}
                                            </span>
                                        </div>

                                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{t.subject}</div>

                                        {(t.orderId || t.missionId) && (
                                            <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 10, marginTop: 4 }}>
                                                {t.orderId && (
                                                    <a
                                                        href={customerHref({ screen: 'orderDetail', orderId: t.orderId })}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="odm-action-link"
                                                        style={{
                                                            color: '#2563eb',
                                                            fontWeight: 700,
                                                            textDecoration: 'none',
                                                            background: '#eff6ff',
                                                            border: '1px solid #bfdbfe',
                                                            padding: '3px 10px',
                                                            borderRadius: 6,
                                                            fontSize: 12,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                        }}
                                                        title="Bấm để xem chi tiết Đơn hàng liên kết"
                                                    >
                                                        🔗 Xem Đơn hàng ↗
                                                    </a>
                                                )}
                                                {t.missionId && (
                                                    <a
                                                        href={customerHref({ screen: 'live', orderId: t.orderId || t.missionId })}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="odm-action-link-green"
                                                        style={{
                                                            color: '#059669',
                                                            fontWeight: 700,
                                                            textDecoration: 'none',
                                                            background: '#ecfdf5',
                                                            border: '1px solid #a7f3d0',
                                                            padding: '3px 10px',
                                                            borderRadius: 6,
                                                            fontSize: 12,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                        }}
                                                        title="Bấm để xem Nhiệm vụ liên kết"
                                                    >
                                                        🛸 Xem Nhiệm vụ ↗
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ textAlign: 'right', fontSize: 12.5, color: '#94a3b8' }}>
                                        <div>Tạo lúc {new Date(t.openedAt).toLocaleDateString('vi-VN')}</div>
                                        <div style={{ color: '#4f46e5', fontWeight: 600, marginTop: 4 }}>Xem chi tiết →</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateTicketModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false)
                        query.reload()
                    }}
                />
            )}
        </div>
    )
}
