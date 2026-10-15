import { formatVnd } from '../../../../shared/lib/formatVnd'

/** One `<dt>/<dd>` money row of a quote summary list. */
export function SummaryRow({
  label,
  value,
  total = false,
}: {
  label: string
  value: number
  total?: boolean
}) {
  return (
    <div className={total ? 'is-total' : ''}>
      <dt>{label}</dt>
      <dd>{formatVnd(value)}</dd>
    </div>
  )
}
