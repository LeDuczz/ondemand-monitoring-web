const STEPS: { key: string; label: string }[] = [
  { key: 'accept', label: 'Nhận' },
  { key: 'ready', label: 'Sẵn sàng' },
  { key: 'connect', label: 'Kết nối' },
  { key: 'preflight', label: 'Preflight' },
  { key: 'handover', label: 'Bàn giao' },
  { key: 'flight', label: 'Bay' },
  { key: 'upload', label: 'Review' },
  { key: 'postflight', label: 'Postflight check' },
]

/** Stepper header shared by the flight-prep screens (OPR-04/05/06). `active` is the current step index (0-based). */
export function FlightStepper({ active }: { active: number }) {
  return (
    <ol
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        listStyle: 'none',
        margin: 0,
        padding: 0,
        flex: 1,
        justifyContent: 'center',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {STEPS.map((step, i) => {
        const done = i < active
        const current = i === active
        const bg = done
          ? 'var(--green-bg)'
          : current
            ? 'var(--ink)'
            : 'var(--sf3)'
        const fg = done
          ? 'var(--green-fg)'
          : current
            ? 'var(--inkfg)'
            : 'var(--tx3)'
        const dotBg = done
          ? 'var(--green-solid)'
          : current
            ? 'var(--inkfg)'
            : 'var(--bd)'
        const dotFg = done
          ? 'var(--green-on)'
          : current
            ? 'var(--ink)'
            : 'var(--tx2)'
        return (
          <li
            key={step.key}
            style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 'none' }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                height: 28,
                padding: current ? '0 10px 0 5px' : '0 7px 0 5px',
                borderRadius: 14,
                fontSize: 12,
                fontWeight: 700,
                background: bg,
                color: fg,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 19,
                  height: 19,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10.5,
                  background: dotBg,
                  color: dotFg,
                }}
              >
                {done ? '✓' : i + 1}
              </span>
              {current ? step.label : null}
            </span>
            {i < STEPS.length - 1 ? (
              <span
                style={{
                  width: 8,
                  height: 2,
                  background: done ? 'var(--green-dot)' : 'var(--bd2)',
                  borderRadius: 1,
                }}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

/** Sub-header bar used by OPR-04/05/06: title, mono mission id, centered stepper, right-side slot. */
export function FlightStepHeader({
  title,
  missionId,
  active,
  right,
}: {
  title: string
  missionId: string
  active: number
  right?: React.ReactNode
}) {
  return (
    <header
      style={{
        height: 64,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        background: 'var(--sf)',
        borderBottom: '2px solid var(--bd)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{ minWidth: 170, flex: '0 1 260px', maxWidth: 280, lineHeight: 1.2 }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '-.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        <div
          className="odm-mono"
          style={{
            fontSize: 12,
            color: 'var(--tx3)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {missionId}
        </div>
      </div>
      <FlightStepper active={active} />
      <div style={{ flex: '0 0 auto', minWidth: 0 }}>{right ?? <span style={{ width: 1 }} />}</div>
    </header>
  )
}
