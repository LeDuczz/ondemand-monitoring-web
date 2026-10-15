import { useI18n } from '../../../../../shared/i18n'
import { droneStatusTone } from '../../../../../shared/lib/statusTone'
import type { StatusTone } from '../../../../../shared/types/domain'
import { droneStatusDonutMessages } from './DroneStatusDonut.messages'
import type { DroneStatusBreakdown } from '../../../types/dashboard'

const TONE_COLOR: Record<StatusTone, string> = {
  gray: 'var(--ui-text-3)',
  yellow: 'var(--ui-warning)',
  blue: 'var(--ui-primary)',
  green: 'var(--ui-success)',
  orange: 'var(--ui-warning-text)',
  red: 'var(--ui-danger)',
}

/** Drone fleet status donut; colours come from `droneStatusTone`. */
export function DroneStatusDonut({ data }: { data: DroneStatusBreakdown[] }) {
  const { t } = useI18n(droneStatusDonutMessages)
  const total = data.reduce((sum, entry) => sum + entry.count, 0)
  const size = 120
  const stroke = 18
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  let cumulative = 0
  const arcs = data
    .filter((entry) => entry.count > 0)
    .map((entry) => {
      const fraction = entry.count / Math.max(total, 1)
      const dash = fraction * circumference
      const offset = cumulative
      cumulative += dash
      return { ...entry, dash, offset }
    })

  const summary = data
    .map((entry) => `${t.status[entry.status]} ${entry.count}`)
    .join(', ')

  return (
    <div className="mng-donut">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={t.ariaLabel(total, summary)}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="mng-donut-track"
          strokeWidth={stroke}
        />
        {arcs.map((arc) => (
          <circle
            key={arc.status}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={TONE_COLOR[droneStatusTone[arc.status]]}
            strokeWidth={stroke}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
        <text
          x={size / 2}
          y={size / 2 - 3}
          textAnchor="middle"
          className="mng-donut-total"
        >
          {total}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 13}
          textAnchor="middle"
          className="mng-donut-unit"
        >
          {t.unit}
        </text>
      </svg>
      <ul className="mng-donut-legend">
        {data.map((entry) => (
          <li key={entry.status}>
            <span
              className="mng-legend-dot"
              style={{ background: TONE_COLOR[droneStatusTone[entry.status]] }}
            />
            <span className="mng-donut-legend-label">
              {t.status[entry.status]}
            </span>
            <b>{entry.count}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}
