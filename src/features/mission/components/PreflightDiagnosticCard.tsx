import type { PreflightCheck, FlightToken } from '../types/mission'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'

interface PreflightDiagnosticCardProps {
    check?: PreflightCheck | null
    token?: FlightToken | null
    batteryLevel: number
    gpsSatellites: number
    isConnecting: boolean
    onRunPreflight: () => void
    onConnectGcs: () => void
    isGcsConnected: boolean
}

export function PreflightDiagnosticCard({
    check,
    token,
    batteryLevel,
    gpsSatellites,
    isConnecting,
    onRunPreflight,
    onConnectGcs,
    isGcsConnected,
}: PreflightDiagnosticCardProps) {
    return (
        <div
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: 'var(--shadow-panel)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--color-border)',
                }}
            >
                <div>
                    <p className="eyebrow" style={{ margin: '0 0 4px', fontSize: '0.65rem' }}>
                        F3.2 DIGITAL PRE-FLIGHT DIAGNOSTICS GATE
                    </p>
                    <h3
                        style={{
                            margin: 0,
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: 'var(--color-foreground)',
                            letterSpacing: '-0.03em',
                        }}
                    >
                        Kiểm tra Kỹ thuật KTS (Pre-flight Diagnostic Center)
                    </h3>
                </div>

                <Button
                    variant="secondary"
                    icon="radio"
                    onClick={onConnectGcs}
                    style={{ minHeight: '40px', fontSize: '0.78rem' }}
                >
                    {isGcsConnected ? 'GCS Connected (PX4)' : 'Kết nối GCS App'}
                </Button>
            </div>

            {/* Diagnostics Telemetry Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '14px',
                    marginBottom: '24px',
                }}
            >
                {/* Battery Status Meter */}
                <div
                    className="diagnostic-meter"
                    style={{
                        borderColor: batteryLevel >= 80 ? '#bbf7d0' : '#fca5a5',
                        background: batteryLevel >= 80 ? 'color-mix(in srgb, #166534 5%, var(--color-surface))' : 'color-mix(in srgb, #991b1b 5%, var(--color-surface))',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-muted)' }}>MỨC PIN DRONE</span>
                        <Icon name="activity" style={{ width: '16px', color: batteryLevel >= 80 ? '#166534' : '#991b1b' }} />
                    </div>
                    <div
                        style={{
                            fontSize: '1.5rem',
                            fontFamily: 'var(--mono)',
                            fontWeight: 800,
                            color: batteryLevel >= 80 ? '#15803d' : '#b91c1c',
                            margin: '8px 0 4px',
                        }}
                    >
                        {batteryLevel}%
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 600, color: batteryLevel >= 80 ? '#166534' : '#991b1b' }}>
                        {batteryLevel >= 80 ? '✓ Đạt ngưỡng (≥80%)' : '✕ Quá thấp (<80%)'}
                    </span>
                </div>

                {/* GPS Satellites Meter */}
                <div
                    className="diagnostic-meter"
                    style={{
                        borderColor: gpsSatellites >= 8 ? '#bbf7d0' : '#fca5a5',
                        background: gpsSatellites >= 8 ? 'color-mix(in srgb, #166534 5%, var(--color-surface))' : 'color-mix(in srgb, #991b1b 5%, var(--color-surface))',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-muted)' }}>GPS SATELLITES</span>
                        <Icon name="route" style={{ width: '16px', color: gpsSatellites >= 8 ? '#166534' : '#991b1b' }} />
                    </div>
                    <div
                        style={{
                            fontSize: '1.5rem',
                            fontFamily: 'var(--mono)',
                            fontWeight: 800,
                            color: gpsSatellites >= 8 ? '#15803d' : '#b91c1c',
                            margin: '8px 0 4px',
                        }}
                    >
                        {gpsSatellites} <small style={{ fontSize: '0.7rem' }}>Sats</small>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 600, color: gpsSatellites >= 8 ? '#166534' : '#991b1b' }}>
                        {gpsSatellites >= 8 ? '✓ 3D Fix OK (≥8)' : '✕ Định vị không đủ (≥8)'}
                    </span>
                </div>

                {/* Gyro & IMU Sensors Meter */}
                <div className="diagnostic-meter">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-muted)' }}>CẢM BIẾN GYRO/ACCEL</span>
                        <Icon name="shield" style={{ width: '16px', color: '#0369a1' }} />
                    </div>
                    <div
                        style={{
                            fontSize: '1.05rem',
                            fontFamily: 'var(--mono)',
                            fontWeight: 800,
                            color: '#0369a1',
                            margin: '12px 0 4px',
                        }}
                    >
                        CALIBRATED
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#166534' }}>
                        ✓ IMU Normal State
                    </span>
                </div>
            </div>

            {/* Diagnostic Trigger & Status Banner */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '16px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--color-border)',
                }}
            >
                <Button
                    variant="primary"
                    icon="activity"
                    onClick={onRunPreflight}
                    disabled={isConnecting}
                    style={{ minHeight: '46px', padding: '0 28px' }}
                >
                    {isConnecting ? '⏳ Đang quét Diagnostic...' : '⚡ Bắt đầu Kiểm tra Pre-flight'}
                </Button>

                {check && (
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {check.overallPassed ? (
                            <span style={{ color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Icon name="check" /> Kiểm tra Pre-flight PASSED! Đã phát hành mã FlightToken.
                            </span>
                        ) : (
                            <span style={{ color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Icon name="x" /> Pre-flight FAILED ({check.faultType}). Đang chuyển trạng thái tự động...
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Issued FlightToken Access Card */}
            {token && !token.revoked && (
                <div
                    style={{
                        marginTop: '24px',
                        padding: '20px 24px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: 'var(--shadow-xl)',
                    }}
                >
                    <div>
                        <span
                            style={{
                                fontSize: '0.65rem',
                                fontFamily: 'var(--mono)',
                                color: '#93c5fd',
                                letterSpacing: '0.12em',
                                fontWeight: 700,
                            }}
                        >
                            🔑 FLIGHT-ACCESS TOKEN ISSUED
                        </span>
                        <div
                            style={{
                                fontSize: '1.4rem',
                                fontFamily: 'var(--mono)',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                margin: '6px 0 2px',
                            }}
                        >
                            {token.tokenValue}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>
                            Thời hạn hiệu lực 15 phút (Hết hạn lúc: {new Date(token.expiresAt).toLocaleTimeString()})
                        </span>
                    </div>

                    <span
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            background: 'rgba(255, 255, 255, 0.18)',
                            backdropFilter: 'blur(4px)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                    >
                        VALID & READY FOR TAKEOFF
                    </span>
                </div>
            )}
        </div>
    )
}
