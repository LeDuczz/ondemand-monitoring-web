import { useI18n } from '../../../../../shared/i18n'
import type { FAQArticle } from '../../../data/helpArticles'
import { helpCenterHomeMessages } from '../HelpCenterHomePage.messages'

type Props = {
  article: FAQArticle
  expanded: boolean
  feedback: 'YES' | 'NO' | undefined
  onToggle: () => void
  onFeedback: (helpful: boolean) => void
  onCreateTicket: () => void
}

export function FaqItem({ article, expanded, feedback, onToggle, onFeedback, onCreateTicket }: Props) {
  const { t } = useI18n(helpCenterHomeMessages)
  return (
    <li className="hc-faq">
      <button type="button" className="hc-faq-q" aria-expanded={expanded} onClick={onToggle}>
        <span>{article.question}</span>
        <span className="hc-faq-meta">
          <span className="sp-chip">{article.categoryLabel}</span>
          <span aria-hidden="true">{expanded ? '▲' : '▼'}</span>
        </span>
      </button>

      {expanded && (
        <div className="hc-faq-body">
          <p>{article.answer}</p>
          <div className="hc-feedback">
            <span>{t.helpful}</span>
            {!feedback ? (
              <div className="hc-feedback-actions">
                <button type="button" className="odm-btn odm-btn-gh" onClick={() => onFeedback(true)}>
                  {t.yes}
                </button>
                <button type="button" className="odm-btn odm-btn-gh" onClick={() => onFeedback(false)}>
                  {t.no}
                </button>
              </div>
            ) : feedback === 'YES' ? (
              <span className="hc-thanks">✓ {t.thanks}</span>
            ) : (
              <div className="hc-feedback-actions">
                <span className="hc-more">{t.needMore}</span>
                <button type="button" className="odm-btn odm-btn-p" onClick={onCreateTicket}>
                  {t.createTicketShort}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
