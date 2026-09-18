const REQUESTS = [
  {
    id: 'REQ-8841',
    title: 'Site survey — Building C renovations',
    submitted: '9 Sep 09:12',
    status: 'in_flight',
    scheduled: 'Today 11:00',
  },
  {
    id: 'REQ-8839',
    title: 'Progress photos — Phase 2 works',
    submitted: '8 Sep 14:33',
    status: 'scheduled',
    scheduled: '10 Sep 08:00',
  },
  {
    id: 'REQ-8830',
    title: 'Perimeter security audit',
    submitted: '5 Sep 10:01',
    status: 'completed',
    scheduled: '7 Sep 14:00',
  },
  {
    id: 'REQ-8821',
    title: 'Infrastructure inspection — Zone 3',
    submitted: '1 Sep 08:15',
    status: 'completed',
    scheduled: '3 Sep 10:00',
  },
  {
    id: 'REQ-8809',
    title: 'Aerial mapping — East lot',
    submitted: '27 Aug 16:00',
    status: 'completed',
    scheduled: '28 Aug 09:30',
  },
]

const MEDIA = [
  {
    id: 'REQ-8830',
    title: 'Perimeter security audit',
    date: '7 Sep',
    files: 34,
    sizeGB: '2.1',
    type: 'Photos + video',
  },
  {
    id: 'REQ-8821',
    title: 'Infrastructure inspection — Zone 3',
    date: '3 Sep',
    files: 62,
    sizeGB: '5.8',
    type: 'Photos + telemetry',
  },
  {
    id: 'REQ-8809',
    title: 'Aerial mapping — East lot',
    date: '28 Aug',
    files: 18,
    sizeGB: '8.2',
    type: 'Orthomosaic + video',
  },
]

const STATUS_CFG: Record<
  string,
  { dot: string; label: string; color: string }
> = {
  in_flight: {
    dot: 'var(--blue)',
    label: 'In flight',
    color: 'var(--blue-text)',
  },
  scheduled: {
    dot: 'var(--accent)',
    label: 'Scheduled',
    color: 'var(--accent)',
  },
  completed: {
    dot: 'var(--green)',
    label: 'Completed',
    color: 'var(--green-text)',
  },
  cancelled: {
    dot: 'var(--text-3)',
    label: 'Cancelled',
    color: 'var(--text-3)',
  },
}

export default function CustomerOverview() {
  const active = REQUESTS.filter((r) => r.status === 'in_flight')
  const pending = REQUESTS.filter((r) => r.status === 'scheduled')

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 4px',
            }}
          >
            Client overview
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
            Account: A. Chen · ACC-4421 · Premium tier
          </p>
        </div>

        {/* Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: 'Active flights',
              value: `${active.length}`,
              color: active.length > 0 ? 'var(--blue-text)' : 'var(--text)',
            },
            {
              label: 'Scheduled',
              value: `${pending.length}`,
              color: 'var(--text)',
            },
            {
              label: 'Completed this month',
              value: '11',
              color: 'var(--text)',
            },
            {
              label: 'Media ready to download',
              value: `${MEDIA.length}`,
              color: MEDIA.length > 0 ? 'var(--green-text)' : 'var(--text)',
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px 18px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-2)',
                  marginBottom: 6,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'var(--font-data)',
                  color: s.color,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Active flight highlight */}
        {active.length > 0 && (
          <div
            style={{
              background: 'var(--blue-bg)',
              border: '1px solid var(--blue-border)',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--blue)',
                flexShrink: 0,
                animation: 'pulse 2s infinite',
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--blue-text)',
                }}
              >
                {active[0].title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--blue-text)',
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                {active[0].id} · Flight in progress
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--blue-text)',
                fontWeight: 500,
              }}
            >
              Live tracking available
            </div>
          </div>
        )}

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}
        >
          {/* Job requests table */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              My requests
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  {['Ref', 'Description', 'Scheduled', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '9px 16px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-2)',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REQUESTS.map((r, i) => {
                  const cfg = STATUS_CFG[r.status]
                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom:
                          i < REQUESTS.length - 1
                            ? '1px solid var(--border)'
                            : 'none',
                      }}
                    >
                      <td
                        style={{
                          padding: '11px 16px',
                          fontSize: 12,
                          fontFamily: 'var(--font-data)',
                          color: 'var(--text-2)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.id}
                      </td>
                      <td
                        style={{
                          padding: '11px 16px',
                          fontSize: 13,
                          color: 'var(--text)',
                          maxWidth: 240,
                        }}
                      >
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-3)',
                            marginTop: 2,
                          }}
                        >
                          Submitted {r.submitted}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '11px 16px',
                          fontSize: 12,
                          color: 'var(--text-2)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.scheduled}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            color: cfg.color,
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: cfg.dot,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Media downloads */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                Ready for download
              </div>
              {MEDIA.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    padding: '13px 16px',
                    borderBottom:
                      i < MEDIA.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text)',
                      marginBottom: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 6,
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {m.date} · {m.files} files · {m.sizeGB} GB
                    </div>
                    <button
                      style={{
                        padding: '4px 10px',
                        borderRadius: 5,
                        border: '1px solid var(--accent)',
                        background: 'var(--accent-bg)',
                        color: 'var(--accent)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: 10,
                }}
              >
                Account summary
              </div>
              {[
                { label: 'Contract', value: 'Enterprise Annual' },
                { label: 'Flights remaining', value: '38 / 60' },
                { label: 'Storage used', value: '42.1 GB / 200 GB' },
                { label: 'Account manager', value: 'T. Wright' },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '7px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    {r.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
              <button
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '8px',
                  borderRadius: 7,
                  border: '1px solid var(--border-2)',
                  background: 'var(--surface)',
                  fontSize: 13,
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                View billing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
