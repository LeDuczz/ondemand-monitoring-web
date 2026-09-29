import { useEffect } from 'react'

import { writeStoredDraft } from '../../../lib/createOrder/draftStorage'
import type { StoredCreateOrderDraft } from '../../../lib/createOrder/types'

/** Mirrors the wizard into localStorage so a refresh keeps the user's work. */
export function useDraftPersistence(draft: StoredCreateOrderDraft, enabled: boolean) {
  const {
    step,
    form,
    mapPoint,
    consultation,
    chatMessages,
    autoDraft,
    aiAnalysisRequested,
  } = draft
  useEffect(() => {
    if (!enabled) return
    writeStoredDraft({
      step,
      form,
      mapPoint,
      consultation,
      chatMessages,
      autoDraft,
      aiAnalysisRequested,
    })
  }, [enabled, step, form, mapPoint, consultation, chatMessages, autoDraft, aiAnalysisRequested])
}
