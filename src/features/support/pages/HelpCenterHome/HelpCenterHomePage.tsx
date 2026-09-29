import { useState } from 'react'

import { Card, EmptyState, PageHeader } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { authSession } from '../../../auth/api/authApi'
import { CUSTOMER_ROOT } from '../../../customer/routes'
import { supportApi } from '../../api/supportApi'
import { CreateTicketModal } from '../../components/CreateTicketModal'
import { getFaqArticles, getPopularTopics } from '../../data/helpArticles'
import { recordArticleVote } from '../../utils/faqAnalytics'
import '../../support.css'
import { FaqItem } from './components/FaqItem'
import { TopicGrid } from './components/TopicGrid'
import './HelpCenterHome.css'
import { helpCenterHomeMessages } from './HelpCenterHomePage.messages'
import { useHelpArticles } from './hooks/useHelpArticles'

/** Customer help center: search, popular topics and the FAQ list. */
export function HelpCenterHomePage() {
  const { t, lang } = useI18n(helpCenterHomeMessages)
  const { articles, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } =
    useHelpArticles()
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null)
  const [feedbackState, setFeedbackState] = useState<Record<string, 'YES' | 'NO'>>({})
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false)

  const selectedTopic = getPopularTopics(lang).find((topic) => topic.id === selectedCategory)

  function handleFeedback(articleId: string, helpful: boolean) {
    recordArticleVote(articleId, helpful)
    setFeedbackState((prev) => ({ ...prev, [articleId]: helpful ? 'YES' : 'NO' }))

    // Analytics always use the Vietnamese question so staff reports stay consistent.
    const target = getFaqArticles('vi').find((a) => a.id === articleId)
    supportApi
      .recordFaqFeedback({
        articleId,
        articleQuestion: target?.question || articleId,
        articleCategory: target?.category || 'GENERAL',
        customerId: authSession.getUser()?.id,
        isHelpful: helpful,
      })
      .catch((err) => console.error('Error recording backend FAQ feedback:', err))
  }

  return (
    <div className="sp-page">
      <PageHeader
        back={<a href={CUSTOMER_ROOT}>{t.backHome}</a>}
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <>
            <a className="odm-btn odm-btn-gh" href="#help/tickets">
              {t.myTickets}
            </a>
            <button type="button" className="odm-btn odm-btn-p" onClick={() => setShowCreateTicketModal(true)}>
              {t.createTicket}
            </button>
          </>
        }
      />

      <Card>
        <div className="hc-hero">
          <span className="hc-eyebrow">{t.eyebrow}</span>
          <div className="hc-search">
            <input
              className="sp-input"
              type="search"
              aria-label={t.searchLabel}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
            />
            {searchQuery && (
              <button
                type="button"
                className="hc-search-clear"
                aria-label={t.clearSearch}
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </Card>

      <TopicGrid selected={selectedCategory} onSelect={setSelectedCategory} />

      <section>
        <div className="hc-faq-head">
          <h2 className="hc-section-title">
            {selectedTopic ? t.faqTitleFiltered(selectedTopic.title) : t.faqTitle}
          </h2>
          {selectedCategory !== 'ALL' && (
            <button type="button" className="odm-btn odm-btn-gh" onClick={() => setSelectedCategory('ALL')}>
              {t.clearFilter} ✕
            </button>
          )}
        </div>

        {articles.length === 0 ? (
          <Card>
            <EmptyState
              title={t.emptyTitle}
              description={t.emptyDescription(searchQuery)}
              action={
                <button type="button" className="odm-btn odm-btn-p" onClick={() => setShowCreateTicketModal(true)}>
                  {t.contactSupport}
                </button>
              }
            />
          </Card>
        ) : (
          <ul className="hc-faq-list">
            {articles.map((article) => (
              <FaqItem
                key={article.id}
                article={article}
                expanded={expandedArticleId === article.id}
                feedback={feedbackState[article.id]}
                onToggle={() => setExpandedArticleId(expandedArticleId === article.id ? null : article.id)}
                onFeedback={(helpful) => handleFeedback(article.id, helpful)}
                onCreateTicket={() => setShowCreateTicketModal(true)}
              />
            ))}
          </ul>
        )}
      </section>

      {showCreateTicketModal && (
        <CreateTicketModal
          onClose={() => setShowCreateTicketModal(false)}
          onSuccess={() => undefined}
        />
      )}
    </div>
  )
}
