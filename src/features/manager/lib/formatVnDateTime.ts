// Vietnamese date/time line for the Manager top bar, e.g.
// "Thứ Bảy, 19/09/2026 · 14:32" [TK MNG-01]. Pure so it can be unit-tested
// without mocking the system clock; callers pass the current `Date`.

const VN_WEEKDAY_NAMES = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
] as const

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

/** Formats `date` (using its local getters) as "Thứ Bảy, 19/09/2026 · 14:32". */
export function formatVnDateTime(date: Date): string {
  const weekday = VN_WEEKDAY_NAMES[date.getDay()]
  const day = pad2(date.getDate())
  const month = pad2(date.getMonth() + 1)
  const year = date.getFullYear()
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())
  return `${weekday}, ${day}/${month}/${year} · ${hours}:${minutes}`
}
