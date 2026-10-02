const INSPECTION_LABELS: Record<string, string> = {
  a1: 'Thân máy',
  a2: 'Càng/khung',
  p1: 'Động cơ',
  p2: 'Cánh quạt',
  e1: 'Pin',
  e2: 'Camera',
  e3: 'GPS',
  e4: 'Pin hạ cánh',
  d1: 'Liên lạc',
}

/** Short Vietnamese title for auto-generated post-flight maintenance tickets. */
export function formatTicketTitle(title: string): string {
  const match = title.match(/post-?flight\b[^.]*?\bfor device\s+([^\s.]+)/i)
  if (match) return `Bảo trì sau bay – ${match[1]}`
  return title
}

/** Turns the raw backend text into short, readable Vietnamese lines. */
export function formatTicketDescription(text: string): string {
  const device = text.match(/post-?flight\b[^.]*?\bfor device\s+([^\s.]+)/i)?.[1]
  const results = [...text.matchAll(/\b([ape]\d|d\d)\s*=\s*(PASS|FAIL)\b/gi)]
  const failed: string[] = []
  const passed: string[] = []
  for (const [, key, result] of results) {
    const label = INSPECTION_LABELS[key.toLowerCase()] ?? key
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
  lines.push(device ? `Thiết bị ${device} cần được bảo trì sau chuyến bay.` : 'Cần bảo trì sau chuyến bay.')
  if (failed.length) lines.push(`Hạng mục không đạt: ${failed.join(', ')}.`)
  if (passed.length) lines.push(`Hạng mục đạt: ${passed.join(', ')}.`)
  if (hasNote) lines.push(`Ghi chú: ${note}`)
  return lines.join('\n')
}
