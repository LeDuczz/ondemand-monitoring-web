import { useMemo, useState } from 'react'

import { authSession } from '../../auth/api/authApi'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { CreateTicketModal } from '../components/CreateTicketModal'
import { FAQ_ARTICLES, POPULAR_TOPICS, searchHelpArticles } from '../data/helpArticles'
import { recordArticleVote } from '../utils/faqAnalytics'
import { supportApi } from '../api/supportApi'

export function HelpCenterHomePage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
    const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null)
    const [feedbackState, setFeedbackState] = useState<Record<string, 'YES' | 'NO'>>({})
    const [showCreateTicketModal, setShowCreateTicketModal] = useState(false)

    const faqQuery = useApiQuery(
        (signal) => supportApi.getFaqArticles(selectedCategory, searchQuery, signal),
        [selectedCategory, searchQuery],
    )

    const articles = useMemo(() => {
        if (faqQuery.data && faqQuery.data.length > 0) {
            return faqQuery.data.map((a) => ({
                id: a.articleId || a.id,
                category: a.category,
                categoryLabel: a.categoryLabel || a.category,
                question: a.question,
                answer: a.answer,
                keywords: a.keywords || [],
            }))
        }

        let result = searchHelpArticles(searchQuery)
        if (selectedCategory !== 'ALL') {
            result = result.filter((a) => a.category === selectedCategory)
        }
        return result
    }, [faqQuery.data, searchQuery, selectedCategory])

    function handleFeedback(articleId: string, helpful: boolean) {
        recordArticleVote(articleId, helpful)
        setFeedbackState((prev) => ({
            ...prev,
            [articleId]: helpful ? 'YES' : 'NO',
        }))

        const targetArt = FAQ_ARTICLES.find((a) => a.id === articleId)
        const currentUser = authSession.getUser()

        supportApi.recordFaqFeedback({
            articleId,
            articleQuestion: targetArt?.question || articleId,
            articleCategory: targetArt?.category || 'GENERAL',
            customerId: currentUser?.id,
            isHelpful: helpful,
        }).catch((err) => console.error('Error recording backend FAQ feedback:', err))
    }

    return (
        <div style={{ background: 'transparent', padding: '12px 0 24px 0' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Navigation & Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <a
                            href="#portal/customer"
                            className="odm-btn"
                            style={{ fontSize: 13, textDecoration: 'none', padding: '6px 12px', borderRadius: 8 }}
                        >
                            ← Về trang chính
                        </a>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>/</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Trung tâm Hỗ trợ</span>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <a
                            href="#help/tickets"
                            className="odm-btn"
                            style={{ fontSize: 13, textDecoration: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 600 }}
                        >
                            Yêu cầu hỗ trợ của tôi
                        </a>
                        <button
                            type="button"
                            className="odm-btn odm-btn-p"
                            onClick={() => setShowCreateTicketModal(true)}
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
                </div>

                {/* Hero Section */}
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: '36px 32px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                        textAlign: 'center',
                        marginBottom: 32,
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            color: '#4f46e5',
                            background: '#eff6ff',
                            padding: '4px 12px',
                            borderRadius: 20,
                            display: 'inline-block',
                            marginBottom: 12,
                        }}
                    >
                        Thông tin & Hướng dẫn sử dụng
                    </span>
                    <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
                        Chúng tôi có thể hỗ trợ bạn như thế nào?
                    </h1>
                    <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b' }}>
                        Tìm câu trả lời về đơn hàng giám sát, lịch bay, kết quả và cài đặt tài khoản của bạn.
                    </p>

                    {/* Natural Language Search */}
                    <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
                        <input
                            className="odm-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm câu trả lời (vd: 'Tại sao đơn hàng chưa được duyệt?', 'Video bị thiếu')..."
                            style={{
                                width: '100%',
                                height: 48,
                                borderRadius: 12,
                                fontSize: 14,
                                paddingLeft: 16,
                                paddingRight: 40,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                border: '1.5px solid #cbd5e1',
                            }}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: 16,
                                    cursor: 'pointer',
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Popular Topics Cards */}
                <div style={{ marginBottom: 36 }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                        Chủ đề phổ biến
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {POPULAR_TOPICS.map((topic) => {
                            const isSelected = selectedCategory === topic.id
                            return (
                                <div
                                    key={topic.id}
                                    onClick={() => setSelectedCategory(isSelected ? 'ALL' : topic.id)}
                                    style={{
                                        background: isSelected ? '#eff6ff' : '#ffffff',
                                        border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                                        borderRadius: 12,
                                        padding: 18,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{topic.title}</div>
                                        <span
                                            style={{
                                                fontSize: 11.5,
                                                fontWeight: 600,
                                                padding: '2px 8px',
                                                borderRadius: 10,
                                                background: '#f1f5f9',
                                                color: '#475569',
                                            }}
                                        >
                                            {topic.articleCount} bài viết
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                                        {topic.description}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* FAQ Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                            Câu hỏi thường gặp {selectedCategory !== 'ALL' && `(${selectedCategory})`}
                        </h3>
                        {selectedCategory !== 'ALL' && (
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('ALL')}
                                style={{ fontSize: 12.5, color: '#4f46e5', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Xóa bộ lọc ✕
                            </button>
                        )}
                    </div>

                    {articles.length === 0 ? (
                        <div
                            style={{
                                background: '#ffffff',
                                borderRadius: 12,
                                padding: '40px 24px',
                                textAlign: 'center',
                                border: '1px solid #e2e8f0',
                            }}
                        >
                            <h4 style={{ margin: '0 0 6px', fontSize: 15, color: '#0f172a' }}>Không tìm thấy bài viết nào</h4>
                            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                                Không tìm thấy câu hỏi phù hợp với "{searchQuery}". Bạn có thể tạo yêu cầu hỗ trợ trực tiếp.
                            </p>
                            <button
                                type="button"
                                className="odm-btn odm-btn-p"
                                onClick={() => setShowCreateTicketModal(true)}
                                style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8 }}
                            >
                                Liên hệ đội hỗ trợ
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {articles.map((article) => {
                                const isExpanded = expandedArticleId === article.id
                                const feedback = feedbackState[article.id]
                                return (
                                    <div
                                        key={article.id}
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0',
                                            overflow: 'hidden',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
                                            style={{
                                                width: '100%',
                                                padding: '16px 20px',
                                                background: 'none',
                                                border: 'none',
                                                textAlign: 'left',
                                                fontSize: 14.5,
                                                fontWeight: 700,
                                                color: '#0f172a',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <span>{article.question}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span
                                                    style={{
                                                        fontSize: 11.5,
                                                        fontWeight: 600,
                                                        padding: '2px 8px',
                                                        borderRadius: 6,
                                                        background: '#f1f5f9',
                                                        color: '#64748b',
                                                    }}
                                                >
                                                    {article.categoryLabel}
                                                </span>
                                                <span style={{ fontSize: 12, color: '#94a3b8' }}>{isExpanded ? '▲' : '▼'}</span>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div
                                                style={{
                                                    padding: '0 20px 20px',
                                                    borderTop: '1px solid #f1f5f9',
                                                    fontSize: 13.5,
                                                    color: '#334155',
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                <p style={{ marginTop: 14, marginBottom: 16 }}>{article.answer}</p>

                                                {/* Was this helpful? */}
                                                <div
                                                    style={{
                                                        background: '#f8fafc',
                                                        padding: '12px 16px',
                                                        borderRadius: 10,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        border: '1px solid #e2e8f0',
                                                    }}
                                                >
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                                                        Bài viết này có hữu ích không?
                                                    </span>

                                                    {!feedback ? (
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <button
                                                                type="button"
                                                                className="odm-btn"
                                                                onClick={() => handleFeedback(article.id, true)}
                                                                style={{ padding: '4px 12px', fontSize: 12.5 }}
                                                            >
                                                                Có
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="odm-btn"
                                                                onClick={() => handleFeedback(article.id, false)}
                                                                style={{ padding: '4px 12px', fontSize: 12.5 }}
                                                            >
                                                                Không
                                                            </button>
                                                        </div>
                                                    ) : feedback === 'YES' ? (
                                                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#059669' }}>
                                                            ✓ Cảm ơn phản hồi của bạn!
                                                        </span>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <span style={{ fontSize: 12.5, color: '#dc2626', fontWeight: 600 }}>
                                                                Vẫn cần hỗ trợ thêm?
                                                            </span>
                                                            <button
                                                                type="button"
                                                                className="odm-btn odm-btn-p"
                                                                onClick={() => setShowCreateTicketModal(true)}
                                                                style={{
                                                                    fontSize: 12,
                                                                    fontWeight: 600,
                                                                    padding: '4px 12px',
                                                                    background: '#4f46e5',
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                }}
                                                            >
                                                                Tạo yêu cầu hỗ trợ
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showCreateTicketModal && (
                <CreateTicketModal
                    onClose={() => setShowCreateTicketModal(false)}
                    onSuccess={() => setShowCreateTicketModal(false)}
                />
            )}
        </div>
    )
}
