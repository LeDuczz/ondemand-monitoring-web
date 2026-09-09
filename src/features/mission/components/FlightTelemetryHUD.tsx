import { useState, useRef } from 'react'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'

interface FlightTelemetryHUDProps {
    deviceCode: string
    missionId: string
    onUploadMedia: (file: File) => Promise<void>
    onReturnToBase: () => void
    isUploading: boolean
}

export function FlightTelemetryHUD({
    deviceCode,
    missionId,
    onUploadMedia,
    onReturnToBase,
    isUploading,
}: FlightTelemetryHUDProps) {
    const [file, setFile] = useState<File | null>(null)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return
        try {
            await onUploadMedia(file)
            setUploadSuccess(true)
            setFile(null)
            setTimeout(() => setUploadSuccess(false), 4000)
        } catch (err) {
            alert(`Lỗi upload ảnh: ${(err as Error).message}`)
        }
    }

    return (
        <div className="hud-glass-panel">
            {/* HUD Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '28px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid #1e293b',
                }}
            >
                <div>
                    <span
                        style={{
                            fontSize: '0.65rem',
                            fontFamily: 'var(--mono)',
                            color: '#38bdf8',
                            letterSpacing: '0.12em',
                            fontWeight: 700,
                        }}
                    >
                        F3.3 LIVE FLIGHT CONTROL CENTER
                    </span>
                    <h3
                        style={{
                            margin: '4px 0 0',
                            fontSize: '1.4rem',
                            fontWeight: 800,
                            color: '#f8fafc',
                            letterSpacing: '-0.03em',
                        }}
                    >
                        Trạm Điều Khiển Chuyến Bay — {deviceCode} (Mission {missionId})
                    </h3>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 14px',
                        background: 'rgba(30, 41, 59, 0.8)',
                        borderRadius: '20px',
                        border: '1px solid #334155',
                    }}
                >
                    <span className="live-dot" />
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--mono)', color: '#4ade80', fontWeight: 700 }}>
                        PX4 MAVSDK LIVE STREAM
                    </span>
                </div>
            </div>

            {/* Telemetry Metric Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px',
                }}
            >
                <div className="hud-metric-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>ĐỘ CAO (ALTITUDE)</span>
                        <Icon name="route" style={{ width: '16px', color: '#38bdf8' }} />
                    </div>
                    <strong
                        style={{
                            display: 'block',
                            fontSize: '1.6rem',
                            fontFamily: 'var(--mono)',
                            color: '#38bdf8',
                            margin: '8px 0 2px',
                        }}
                    >
                        54.2 <small style={{ fontSize: '0.8rem' }}>m</small>
                    </strong>
                    <span style={{ fontSize: '0.62rem', color: '#cbd5e1' }}>Relative Alt (AGL)</span>
                </div>

                <div className="hud-metric-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>VẬN TỐC (GROUND SPEED)</span>
                        <Icon name="activity" style={{ width: '16px', color: '#38bdf8' }} />
                    </div>
                    <strong
                        style={{
                            display: 'block',
                            fontSize: '1.6rem',
                            fontFamily: 'var(--mono)',
                            color: '#38bdf8',
                            margin: '8px 0 2px',
                        }}
                    >
                        12.8 <small style={{ fontSize: '0.8rem' }}>m/s</small>
                    </strong>
                    <span style={{ fontSize: '0.62rem', color: '#cbd5e1' }}>46.0 km/h</span>
                </div>

                <div className="hud-metric-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>MỨC PIN DRONE</span>
                        <Icon name="check" style={{ width: '16px', color: '#4ade80' }} />
                    </div>
                    <strong
                        style={{
                            display: 'block',
                            fontSize: '1.6rem',
                            fontFamily: 'var(--mono)',
                            color: '#4ade80',
                            margin: '8px 0 2px',
                        }}
                    >
                        88 %
                    </strong>
                    <span style={{ fontSize: '0.62rem', color: '#cbd5e1' }}>22.4 V / 6S Lipo</span>
                </div>

                <div className="hud-metric-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>FLIGHT MODE</span>
                        <Icon name="radio" style={{ width: '16px', color: '#f59e0b' }} />
                    </div>
                    <strong
                        style={{
                            display: 'block',
                            fontSize: '1.1rem',
                            fontFamily: 'var(--mono)',
                            color: '#f59e0b',
                            margin: '10px 0 2px',
                        }}
                    >
                        AUTO MISSION
                    </strong>
                    <span style={{ fontSize: '0.62rem', color: '#cbd5e1' }}>Waypoint 4 / 12</span>
                </div>
            </div>

            {/* Media Upload Box */}
            <div
                style={{
                    padding: '24px',
                    background: 'rgba(22, 36, 58, 0.9)',
                    borderRadius: '14px',
                    border: '1px dashed #334155',
                    marginBottom: '28px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginBottom: '16px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon name="camera" style={{ color: '#38bdf8' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                            Upload Hình ảnh / Video Chụp từ Drone (Amazon S3 Direct)
                        </span>
                    </div>
                    {uploadSuccess && (
                        <span
                            style={{
                                fontSize: '0.75rem',
                                color: '#4ade80',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <Icon name="check" /> Đã lưu tập tin lên S3 thành công!
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,video/*"
                        style={{ display: 'none' }}
                    />
                    <Button
                        variant="secondary"
                        icon="camera"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: '#1e293b', color: '#ffffff', borderColor: '#475569', minHeight: '44px' }}
                    >
                        {file ? file.name : 'Chọn ảnh/video...'}
                    </Button>

                    <Button
                        variant="primary"
                        icon="arrow-up-right"
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        style={{ minHeight: '44px', padding: '0 24px', opacity: !file || isUploading ? 0.6 : 1 }}
                    >
                        {isUploading ? '⏳ Uploading...' : 'Tải lên S3 Cloud'}
                    </Button>
                </div>
            </div>

            {/* Return to Base Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    className="button"
                    onClick={onReturnToBase}
                    style={{
                        minHeight: '48px',
                        padding: '0 32px',
                        backgroundColor: '#ea580c',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        borderRadius: '10px',
                        boxShadow: '0 10px 20px rgba(234, 88, 12, 0.3)',
                    }}
                >
                    🚁 HẠ CÁNH / BAY VỀ TRẠM (RETURN TO BASE)
                </button>
            </div>
        </div>
    )
}
