import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { Card, EmptyState, PageHeader } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { isTicketFinished } from '../../lib/ticketStatus'
import '../../support.css'
import { MessageList } from './components/MessageList'
import { ReplyForm } from './components/ReplyForm'
import { TicketOverview } from './components/TicketOverview'
import './CustomerTicketDetail.css'
import { customerTicketDetailMessages } from './CustomerTicketDetailPage.messages'
import { useTicketDetail } from './hooks/useTicketDetail'

export function CustomerTicketDetailPage({ ticketId }: { ticketId: string }) {
  const { t } = useI18n(customerTicketDetailMessages)
  const detail = useTicketDetail(ticketId)
  const { ticket } = detail

  if (detail.loading && !ticket) return <LoadingState />

  if (!ticket) {
    return detail.error ? (
      <ErrorState title={t.errorTitle} error={detail.error} onRetry={detail.reload} />
    ) : (
      <EmptyState
        title={t.notFoundTitle}
        action={
          <a className="odm-btn odm-btn-gh" href="#help/tickets">
            {t.notFoundAction}
          </a>
        }
      />
    )
  }

  return (
    <div className="sp-page">
      <PageHeader
        back={<a href="#help/tickets">{t.back}</a>}
        title={
          <>
            {t.ticketCode}: <span className="sp-mono">{ticket.ticketCode}</span>
          </>
        }
      />

      <TicketOverview ticket={ticket} />

      <Card title={t.conversation}>
        <MessageList messages={ticket.messages} description={ticket.description} />
        {isTicketFinished(ticket.status) ? (
          <div className="sp-notice is-success">{t.finished}</div>
        ) : (
          <ReplyForm
            content={detail.replyContent}
            attachment={detail.replyAttachment}
            sending={detail.sending}
            error={detail.sendError}
            onContent={detail.setReplyContent}
            onAttachment={detail.setReplyAttachment}
            onSubmit={detail.sendReply}
          />
        )}
      </Card>
    </div>
  )
}
