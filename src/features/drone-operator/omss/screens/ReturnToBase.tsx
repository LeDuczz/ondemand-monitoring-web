import { useState, useEffect } from 'react'
import type { Drone } from '../types'

interface Props {
  drone: Drone
  onLanded: () => void
}

export default function ReturnToBase({ drone: init, onLanded }: Props) {
  const [drone, setDrone] = useState({
    ...init,
    altitude: 45.2,
    groundSpeed: 8.7,
  })
  const [distM, setDistM] = useState(2200)
  const [phase, setPhase] = useState<'rth' | 'descend' | 'land' | 'landed'>(
    'rth',
  )

  useEffect(() => {
    const id = setInterval(() => {
      setDistM((d) => {
        const next = Math.max(0, d - 18)
        if (next < 1000 && d >= 1000) setPhase('descend')
        if (next < 200 && d >= 200) setPhase('land')
        if (next === 0) {
          setPhase('landed')
          setTimeout(onLanded, 1600)
        }
        return next
      })
      setDrone((d) => ({
        ...d,
        altitude: phase === 'rth' ? d.altitude : Math.max(0, d.altitude - 0.6),
        groundSpeed:
          phase === 'land'
            ? Math.max(0.3, d.groundSpeed - 0.2)
            : phase === 'descend'
              ? 4.2
              : 8.5,
        battery: Math.max(0, d.battery - 0.003),
      }))
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  const pct = Math.round(((2200 - distM) / 2200) * 100)
  const phaseLabel = {
    rth: 'Returning to home',
    descend: 'Descending',
    land: 'Landing sequence',
    landed: 'Landed',
  }[phase]
  const phaseColor = {
    rth: 'var(--amber)',
    descend: 'var(--blue)',
    land: 'var(--green)',
    landed: 'var(--green)',
  }[phase]

  const PHASES = ['Returning', 'Descending', 'Landing', 'Landed']
  const phaseIdx = { rth: 0, descend: 1, land: 2, landed: 3 }[phase]

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 560 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: phaseColor,
            }}
            className={phase !== 'landed' ? 'blink' : ''}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: phaseColor }}>
            {phaseLabel}
          </span>
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 6px',
          }}
        >
          Return to base
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 28px' }}>
          Drone is executing autonomous return-to-home sequence.
        </p>

        {/* Phase steps */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '20px',
            marginBottom: 16,
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}
          >
            {PHASES.map((p, i) => (
              <div
                key={p}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: i < PHASES.length - 1 ? 1 : undefined,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background:
                        i < phaseIdx
                          ? 'var(--green)'
                          : i === phaseIdx
                            ? phaseColor
                            : 'var(--surface-2)',
                      border: `1.5px solid ${i < phaseIdx ? 'var(--green)' : i === phaseIdx ? phaseColor : 'var(--border-2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: i <= phaseIdx ? '#fff' : 'var(--text-3)',
                    }}
                  >
                    {i < phaseIdx ? '✓' : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color:
                        i < phaseIdx
                          ? 'var(--green-text)'
                          : i === phaseIdx
                            ? 'var(--text)'
                            : 'var(--text-3)',
                    }}
                  >
                    {p}
                  </span>
                </div>
                {i < PHASES.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background:
                        i < phaseIdx ? 'var(--green)' : 'var(--border)',
                      margin: '0 6px',
                      marginBottom: 18,
                      opacity: 0.6,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              <span style={{ color: 'var(--text-2)' }}>Distance to home</span>
              <span
                style={{
                  fontFamily: 'var(--font-data)',
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                {distM} m
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: 'var(--border)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: phaseColor,
                  borderRadius: 3,
                  transition: 'width .8s, background .3s',
                }}
              />
            </div>
          </div>
        </div>

        {/* Telemetry */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            {
              l: 'Altitude AGL',
              v: `${drone.altitude.toFixed(1)} m`,
              warn: false,
            },
            {
              l: 'Ground speed',
              v: `${drone.groundSpeed.toFixed(1)} m/s`,
              warn: false,
            },
            {
              l: 'Battery',
              v: `${drone.battery.toFixed(0)}%`,
              warn: drone.battery < 25,
            },
            { l: 'GPS satellites', v: `${drone.gpsCount}`, warn: false },
            { l: 'Signal (RSSI)', v: `${drone.rssi}%`, warn: drone.rssi < 40 },
            {
              l: 'ETA home',
              v: distM > 0 ? `~${Math.ceil(distM / 18)}s` : 'Landed',
              warn: false,
            },
          ].map((t) => (
            <div
              key={t.l}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-3)',
                  marginBottom: 4,
                }}
              >
                {t.l}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontFamily: 'var(--font-data)',
                  fontWeight: 600,
                  color: t.warn ? 'var(--red)' : 'var(--text)',
                }}
              >
                {t.v}
              </div>
            </div>
          ))}
        </div>

        {phase === 'landed' && (
          <div
            style={{
              background: 'var(--green-bg)',
              border: '1px solid var(--green-border)',
              borderRadius: 10,
              padding: '18px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--green-text)',
              }}
            >
              ✓ Drone landed successfully
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--green-text)',
                opacity: 0.8,
                marginTop: 4,
              }}
            >
              Proceeding to post-flight inspection…
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
