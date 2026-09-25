// Dedicated Fleet Devices view for System Operator
import { useState } from 'react'

type DeviceItem = {
    id: string
    code: string
    name: string
    model: string
    status: 'AVAILABLE' | 'MAINTENANCE' | 'IDLE_CHARGING' | 'IN_FLIGHT'
    batteryPercent: number
    signalPercent: number
    lastCheckAt: string
}

const INITIAL_DEVICES: DeviceItem[] = [
    {
        id: 'd0000000-0000-0000-0000-000000000001',
        code: 'DRONE-ALPHA-01',
        name: 'Matrice 300 RTK',
        model: 'DJI Enterprise M300',
        status: 'AVAILABLE',
        batteryPercent: 100,
        signalPercent: 98,
        lastCheckAt: 'Vừa xong',
    },
    {
        id: 'd0000000-0000-0000-0000-000000000002',
        code: 'DRONE-BETA-02',
        name: 'Mavic 3 Enterprise',
        model: 'DJI M3E Thermal',
        status: 'IDLE_CHARGING',
        batteryPercent: 78,
        signalPercent: 95,
        lastCheckAt: '5 phút trước',
    },
    {
        id: 'd0000000-0000-0000-0000-000000000003',
        code: 'DRONE-GAMMA-03',
        name: 'Skydio X2E',
        model: 'Skydio Autonomous',
        status: 'MAINTENANCE',
        batteryPercent: 45,
        signalPercent: 88,
        lastCheckAt: '12 phút trước',
    },
]

export function SystemOperatorDevicesScreen() {
    const [devices] = useState<DeviceItem[]>(INITIAL_DEVICES)
    const [filterStatus, setFilterStatus] = useState<string>('ALL')

    const filtered = devices.filter((d) => filterStatus === 'ALL' || d.status === filterStatus)

    const statusTone: Record<string, { bg: string; text: string; label: string }> = {
        AVAILABLE: { bg: '#f0fdf4', text: '#166534', label: 'AVAILABLE — Sẵn sàng bay' },
        IDLE_CHARGING: { bg: '#fefce8', text: '#854d0e', label: 'IDLE_CHARGING — Đang sạc pin' },
        MAINTENANCE: { bg: '#fef2f2', text: '#991b1b', label: 'MAINTENANCE — Đang bảo trì' },
        IN_FLIGHT: { bg: '#eff6ff', text: '#1e40af', label: 'IN_FLIGHT — Đang thực hiện sứ mệnh' },
    }

    return (
        <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
            {/* Banner */}
            <div
                style={{
                    padding: '20px 24px',
                    borderRadius: 14,
                    background: '#0f172a',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
                        Quản lý Trạng thái Fleet & Thiết bị Drone
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
                        Theo dõi tình trạng dung lượng pin, chất lượng sóng kết nối và lịch sử kiểm tra kỹ thuật.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <select
                        className="odm-input"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ height: 38, borderRadius: 8, fontSize: 13, background: '#ffffff' }}
                    >
                        <option value="ALL">Tất cả trạng thái ({devices.length})</option>
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="IDLE_CHARGING">IDLE_CHARGING</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filtered.map((device) => {
                    const tone = statusTone[device.status] || statusTone.AVAILABLE
                    return (
                        <div
                            key={device.id}
                            className="odm-card"
                            style={{
                                padding: 18,
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                background: '#ffffff',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className="odm-mono" style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                    {device.code}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11.5,
                                        fontWeight: 600,
                                        padding: '3px 8px',
                                        borderRadius: 6,
                                        background: tone.bg,
                                        color: tone.text,
                                    }}
                                >
                                    {tone.label}
                                </span>
                            </div>

                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{device.name}</div>
                                <div style={{ fontSize: 12.5, color: '#64748b' }}>Model: {device.model}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 4 }}>
                                        <span>Dung lượng Pin</span>
                                        <span style={{ fontWeight: 700, color: device.batteryPercent < 50 ? '#ef4444' : '#059669' }}>
                                            {device.batteryPercent}%
                                        </span>
                                    </div>
                                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${device.batteryPercent}%`,
                                                background: device.batteryPercent < 50 ? '#ef4444' : '#10b981',
                                                borderRadius: 4,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 4 }}>
                                        <span>Sóng Telemetry</span>
                                        <span style={{ fontWeight: 700, color: '#2563eb' }}>{device.signalPercent}%</span>
                                    </div>
                                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${device.signalPercent}%`,
                                                background: '#2563eb',
                                                borderRadius: 4,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 10, fontSize: 12, color: '#94a3b8' }}>
                                <span>Cập nhật: {device.lastCheckAt}</span>
                                {device.status === 'MAINTENANCE' && (
                                    <a
                                        href="#portal/system-operator/maintenance"
                                        style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                                    >
                                        Xem ticket bảo trì →
                                    </a>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
