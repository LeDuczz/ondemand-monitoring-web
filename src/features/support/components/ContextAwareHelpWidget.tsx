import { useState } from 'react'

import { useI18n } from '../../../shared/i18n'
import { getFaqArticles, type ArticleId } from '../data/helpArticles'
import { contextAwareHelpWidgetMessages } from './ContextAwareHelpWidget.messages'
import './ContextAwareHelpWidget.css'
import { CreateTicketModal } from './CreateTicketModal'

type ContextAwareHelpWidgetProps = {
    type: 'ORDER' | 'MISSION'
    id: string
    status?: string
    scheduledTime?: string
    description?: string
    orderId?: string
}

const ORDER_QUESTIONS: ArticleId[] = ['ord-1', 'ord-3', 'ord-4']
const MISSION_QUESTIONS: ArticleId[] = ['msn-3', 'msn-2', 'msn-1']

/** Ids that are full uuids are too long to show; the widget then says "this order". */
const isLongId = (id: string) => Boolean(id) && id.includes('-') && id.length > 20

export function ContextAwareHelpWidget({
    type,
    id,
    status = 'PENDING_APPROVAL',
    orderId,
}: ContextAwareHelpWidgetProps) {
    const { t, lang } = useI18n(contextAwareHelpWidgetMessages)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null)

    const isOrder = type === 'ORDER'
    const articles = getFaqArticles(lang)
    const suggestedQuestions = (isOrder ? ORDER_QUESTIONS : MISSION_QUESTIONS).map((articleId) => ({
        id: articleId,
        question: t.questions[articleId as keyof typeof t.questions],
        answer: articles.find((a) => a.id === articleId)?.answer ?? '',
    }))

    const showBanner = type === 'MISSION' && status === 'FAILED_PREFLIGHT'
    const long = isLongId(id)
    const refText = long
        ? isOrder ? t.currentOrder : t.currentMission
        : isOrder ? t.orderRef(id) : t.missionRef(id)
    const displayLabel = long ? (isOrder ? t.thisOrder : t.thisMission) : `#${id}`
    const subjectLabel = long ? (isOrder ? t.thisOrder : t.thisMission) : `#${id}`

    return (
        <div className="hw-card">
            <div className="hw-head">
                <h4 className="hw-title">{t.heading(isOrder)}</h4>
                <span className="hw-ref odm-mono">{refText}</span>
            </div>

            {showBanner && <div className="hw-banner">{t.preflightFailedBanner}</div>}

            <div className="hw-hint">{t.suggestedFor(status)}</div>

            <ul className="hw-list">
                {suggestedQuestions.map((item) => {
                    const isExpanded = expandedFaqId === item.id
                    return (
                        <li key={item.id} className="hw-item">
                            <button
                                type="button"
                                className="hw-question"
                                aria-expanded={isExpanded}
                                onClick={() => setExpandedFaqId(isExpanded ? null : item.id)}
                            >
                                <span>{item.question}</span>
                                <span className="hw-chevron" aria-hidden="true">
                                    {isExpanded ? '▲' : '▼'}
                                </span>
                            </button>
                            {isExpanded && <div className="hw-answer">{item.answer}</div>}
                        </li>
                    )
                })}
            </ul>

            <div className="hw-foot">
                <span className="hw-foot-text">
                    {t.needHelpFor} <b>{displayLabel}</b>? {t.autoAttach}
                </span>
                <button
                    type="button"
                    className="odm-btn odm-btn-p"
                    onClick={() => setShowCreateModal(true)}
                >
                    {t.createTicketFor(displayLabel)}
                </button>
            </div>

            {showCreateModal && (
                <CreateTicketModal
                    initialOrderId={isOrder ? id : orderId}
                    initialMissionId={type === 'MISSION' ? id : undefined}
                    initialCategory={isOrder ? 'ORDERS' : 'MISSIONS'}
                    initialSubject={t.subject(isOrder, subjectLabel)}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => undefined}
                />
            )}
        </div>
    )
}
