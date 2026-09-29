import { useEffect, useState } from 'react'

import { useLanguage } from '../../../shared/i18n'
import { customerApi, type PreferredTimeOption } from '../api/customerApi'
import { localizeTimeslot, type TimeslotRef } from '../lib/i18n/timeslots'

let cache: Promise<PreferredTimeOption[]> | null = null

/** Fetches `/api/preferred-times` once per session; failures are not cached. */
function loadPreferredTimes(): Promise<PreferredTimeOption[]> {
  if (!cache) {
    cache = customerApi.listPreferredTimes().catch(() => {
      cache = null
      return []
    })
  }
  return cache
}

export function resetPreferredTimesCache() {
  cache = null
}

/** Returns `(slot) => localized label`, using the cached BE list to map id -> code. */
export function useTimeslotLabel(): (slot: TimeslotRef) => string {
  const { lang } = useLanguage()
  const [known, setKnown] = useState<PreferredTimeOption[]>([])
  useEffect(() => {
    let alive = true
    loadPreferredTimes().then((list) => alive && setKnown(list))
    return () => {
      alive = false
    }
  }, [])
  return (slot) => localizeTimeslot(slot, lang, known)
}
