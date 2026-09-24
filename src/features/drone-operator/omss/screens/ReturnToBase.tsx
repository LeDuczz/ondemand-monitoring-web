import { useEffect, useRef, useState } from 'react'
import { flightControlApi, type FlightControlStatus } from '../api/flightControlApi'
import type { Drone } from '../types'

interface Props {
  drone: Drone
  missionId: string
  onLanded: () => void
}

export default function ReturnToBase({ drone, missionId, onLanded }: Props) {
  const [telemetry, setTelemetry] = useState<FlightControlStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'rth' | 'descend' | 'land' | 'landed'>('rth')
  const stableLandingSamples = useRef(0)
  const completed = useRef(false)
  const onLandedRef = useRef(onLanded)
  onLandedRef.current = onLanded

  useEffect(() => {
    let mounted = true
    stableLandingSamples.current = 0
    completed.current = false
    async function poll() {
      try {
        const status = await flightControlApi.status()
        if (!mounted) return
        setTelemetry(status)
        setError(null)
        const sessionMatches = status.missionId === missionId && status.deviceCode === drone.id
        const landed = sessionMatches && status.connection?.px4Connected === true &&
          status.positionReady === true && status.inAir === false &&
          typeof status.altitudeM === 'number' && status.altitudeM <= 1.2 &&
          typeof status.speedMps === 'number' && status.speedMps <= 0.5
        stableLandingSamples.current = landed ? stableLandingSamples.current + 1 : 0
        if (stableLandingSamples.current >= 2 && !completed.current) {
          completed.current = true
          setPhase('landed')
          onLandedRef.current()
        } else if (sessionMatches && status.inAir && typeof status.altitudeM === 'number') {
          setPhase(status.altitudeM <= 1.2 ? 'land' : status.altitudeM <= 5 ? 'descend' : 'rth')
        }
      } catch (cause) {
        if (mounted) {
          stableLandingSamples.current = 0
          setError(cause instanceof Error ? cause.message : 'Telemetry unavailable')
        }
      }
    }
    void poll()
    const timer = window.setInterval(() => void poll(), 2000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [drone.id, missionId])

  const distM: number | null = null // Flight Controller does not expose distance-to-home.
  const pct = 0
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
        {error && <p role="alert" style={{ color: 'var(--red)' }}>{error}</p>}

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
                {distM === null ? 'Unavailable' : `${distM} m`}
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
              v: typeof telemetry?.altitudeM === 'number' ? `${telemetry.altitudeM.toFixed(1)} m` : '—',
              warn: false,
            },
            {
              l: 'Ground speed',
              v: typeof telemetry?.speedMps === 'number' ? `${telemetry.speedMps.toFixed(1)} m/s` : '—',
              warn: false,
            },
            {
              l: 'Battery',
              v: typeof telemetry?.batteryPercent === 'number' ? `${telemetry.batteryPercent.toFixed(0)}%` : '—',
              warn: typeof telemetry?.batteryPercent === 'number' && telemetry.batteryPercent < 25,
            },
            { l: 'GPS satellites', v: '—', warn: false },
            { l: 'Signal (RSSI)', v: '—', warn: false },
            {
              l: 'ETA home',
              v: phase === 'landed' ? 'Landed' : '—',
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
