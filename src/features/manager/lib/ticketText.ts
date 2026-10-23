import { getLanguage } from '../../../shared/i18n'
import { managerLibMessages } from './lib.messages'

/** Short Vietnamese title for auto-generated post-flight maintenance tickets. */
export function formatTicketTitle(title: string): string {
  const match = title.match(/post-?flight\b[^.]*?\bfor device\s+([^\s.]+)/i)
  if (match) return managerLibMessages[getLanguage()].ticket.title(match[1])
  return title
}

/** Turns the raw backend text into short, readable Vietnamese lines. */
export function formatTicketDescription(text: string): string {
  const t = managerLibMessages[getLanguage()].ticket
  const device = text.match(/post-?flight\b[^.]*?\bfor device\s+([^\s.]+)/i)?.[1]
  const results = [...text.matchAll(/\b([ape]\d|d\d)\s*=\s*(PASS|FAIL)\b/gi)]
  const failed: string[] = []
  const passed: string[] = []
  for (const [, key, result] of results) {
    const label = t.inspection[key.toLowerCase()] ?? key
    const bucket = result.toUpperCase() === 'FAIL' ? failed : passed
    if (!bucket.includes(label)) bucket.push(label)
  }
  const note = text
    .replace(/^.*?Notes:\s*/is, '')
    .replace(/Inspection:.*$/is, '')
    .trim()
  const hasNote = /Notes:/i.test(text) && note && !/^post-?flight/i.test(note)

  if (!device && results.length === 0) return text

  const lines: string[] = []
  lines.push(device ? t.deviceNeeds(device) : t.needs)
  if (failed.length) lines.push(t.failed(failed.join(', ')))
  if (passed.length) lines.push(t.passed(passed.join(', ')))
  if (hasNote) lines.push(t.note(note))
  return lines.join('\n')
}
