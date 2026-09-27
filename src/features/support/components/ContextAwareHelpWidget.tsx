import { useState } from 'react'

import { FAQ_ARTICLES } from '../data/helpArticles'
import { CreateTicketModal } from './CreateTicketModal'

type ContextAwareHelpWidgetProps = {
    type: 'ORDER' | 'MISSION'
    id: string
    status?: string
    scheduledTime?: string
    description?: string
    orderId?: string
}

export function ContextAwareHelpWidget({
    type,
    id,
    status = 'PENDING_APPROVAL',
    orderId,
}: ContextAwareHelpWidgetProps) {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null)

    // Dynamically derive contextual suggested questions based on type and status
    const suggestedQuestions = type === 'ORDER'
        ? [
            {
                id: 'ord-1',
                question: 'Tại sao đơn hàng của tôi vẫn đang chờ phê duyệt?',
                answer: FAQ_ARTICLES.find((a) => a.id === 'ord-1')?.answer || '',
            },
            {
                id: 'ord-3',
                question: 'Tôi có thể thay đổi lịch bay đã chọn không?',
                answer: FAQ_ARTICLES.find((a) => a.id === 'ord-3')?.answer || '',
            },
            {
                id: 'ord-4',
                question: 'Chính sách hủy đơn và hoàn tiền như thế nào?',
                answer: FAQ_ARTICLES.find((a) => a.id === 'ord-4')?.answer || '',
            },
        ]
        : [
            {
                id: 'msn-3',
                question: 'Tại sao lần bay của tôi bị thất bại kiểm tra an toàn?',
                answer: FAQ_ARTICLES.find((a) => a.id === 'msn-3')?.answer || '',
            },
            {
                id: 'msn-2',
                question: 'Hệ thống có tự động điều drone thay thế không?',
                answer: FAQ_ARTICLES.find((a) => a.id === 'msn-2')?.answer || '',
            },
            {
                id: 'msn-1',
                question: 'Khi nào lịch bay lại của tôi sẽ được xếp?',
                answer: FAQ_ARTICLES.find((a) => a.id === 'msn-1')?.answer || '',
            },
        ]

    const explanationBanner = type === 'MISSION' && status === 'FAILED_PREFLIGHT'
        ? 'Lần bay này không thể khởi hành do drone không vượt qua kiểm tra an toàn tự động trước chuyến bay.'
        : null

    return (
        <div
            style={{
                background: 'var(--sf, #ffffff)',
                border: '1px solid var(--bd, #e2e8f0)',
                borderRadius: 12,
                padding: 18,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                marginTop: 16,
                marginBottom: 16,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--tx, #0f172a)' }}>
                    ❓ Bạn cần trợ giúp cho {type === 'ORDER' ? 'đơn hàng' : 'nhiệm vụ bay'} này?
                </h4>
                <span
                    className="odm-mono"
                    style={{
                        fontSize: 11.5,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'var(--sf2, #f1f5f9)',
                        color: 'var(--brand-primary, #4f46e5)',
                        fontWeight: 700,
                    }}
                >
                    📌 {id && id.includes('-') && id.length > 20 ? (type === 'ORDER' ? 'Đơn hàng hiện tại' : 'Nhiệm vụ hiện tại') : (type === 'ORDER' ? `Đơn hàng #${id}` : `Nhiệm vụ #${id}`)}
                </span>
            </div>

            {explanationBanner && (
                <div
                    style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontSize: 12.5,
                        padding: '10px 12px',
                        borderRadius: 8,
                        marginBottom: 12,
                        lineHeight: 1.45,
                    }}
                >
                    {explanationBanner}
                </div>
            )}

            <div style={{ fontSize: 12.5, color: 'var(--tx2, #64748b)', marginBottom: 8, fontWeight: 500 }}>
                Câu hỏi thường gặp gợi ý cho trạng thái ({status}):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {suggestedQuestions.map((item) => {
                    const isExpanded = expandedFaqId === item.id
                    return (
                        <div
                            key={item.id}
                            style={{
                                border: '1px solid var(--bd, #f1f5f9)',
                                borderRadius: 8,
                                background: 'var(--sf2, #f8fafc)',
                                overflow: 'hidden',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setExpandedFaqId(isExpanded ? null : item.id)}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--blue-solid, #2563eb)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span>• {item.question}</span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>{isExpanded ? '▲' : '▼'}</span>
                            </button>

                            {isExpanded && (
                                <div
                                    style={{
                                        padding: '10px 14px 14px',
                                        fontSize: 12.5,
                                        color: 'var(--tx2, #334155)',
                                        borderTop: '1px solid var(--bd, #e2e8f0)',
                                        lineHeight: 1.55,
                                        background: 'var(--sf, #ffffff)',
                                    }}
                                >
                                    {item.answer}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {(() => {
                const displayLabel = id && id.includes('-') && id.length > 20 ? (type === 'ORDER' ? 'Đơn hàng này' : 'Nhiệm vụ này') : `#${id}`
                return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--bd, #f1f5f9)' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--tx2, #64748b)' }}>
                            Cần hỗ trợ riêng cho <b>{displayLabel}</b>? Tạo ticket đính kèm tự động:
                        </span>
                        <button
                            type="button"
                            className="odm-btn odm-btn-p odm-hover-glow"
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                padding: '7px 16px',
                                borderRadius: 8,
                                background: 'var(--brand-primary, #4f46e5)',
                                color: '#ffffff',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            🎫 Tạo Ticket cho {displayLabel}
                        </button>
                    </div>
                )
            })()}

            {showCreateModal && (
                <CreateTicketModal
                    initialOrderId={type === 'ORDER' ? id : orderId}
                    initialMissionId={type === 'MISSION' ? id : undefined}
                    initialCategory={type === 'ORDER' ? 'ORDERS' : 'MISSIONS'}
                    initialSubject={`Cần hỗ trợ cho ${type === 'ORDER' ? 'Đơn hàng' : 'Nhiệm vụ'} ${id && id.includes('-') && id.length > 20 ? (type === 'ORDER' ? 'này' : 'này') : `#${id}`}`}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => setShowCreateModal(false)}
                />
            )}
        </div>
    )
}
