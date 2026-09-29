import { useState, type FormEvent } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { authSession } from '../../../../auth/api/authApi'
import { supportApi } from '../../../api/supportApi'

/** Loads one ticket and owns the reply form state. `sendError` is the BE message, or '' when the page should show its generic one. */
export function useTicketDetail(ticketId: string) {
  const [replyContent, setReplyContent] = useState('')
  const [replyAttachment, setReplyAttachment] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const query = useApiQuery((signal) => supportApi.getTicketById(ticketId, signal), [ticketId])

  async function sendReply(e: FormEvent) {
    e.preventDefault()
    if (!replyContent.trim()) return

    setSending(true)
    setSendError(null)
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
      setSendError(err instanceof Error ? err.message : '')
    } finally {
      setSending(false)
    }
  }

  return {
    ticket: query.data,
    loading: query.loading,
    error: query.error,
    reload: query.reload,
    replyContent,
    setReplyContent,
    replyAttachment,
    setReplyAttachment,
    sending,
    sendError,
    sendReply,
  }
}
