import { useState } from 'react'
import type { DeviceStatus } from '../types/mission'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'

interface PostflightModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (status: DeviceStatus, notes: string) => Promise<void>
    isSubmitting: boolean
}

export function PostflightModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
}: PostflightModalProps) {
    const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>('AVAILABLE')
    const [notes, setNotes] = useState('Drone hoàn thành chuyến bay an toàn, không tổn hại cấu trúc.')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(deviceStatus, notes)
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(2, 6, 23, 0.75)',
                backdropFilter: 'blur(6px)',
                zIndex: 100,
                display: 'grid',
                placeItems: 'center',
                padding: '16px',
            }}
        >
            <div
                style={{
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '520px',
                    width: '100%',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--color-border)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                        <p className="eyebrow" style={{ margin: '0 0 4px', fontSize: '0.65rem' }}>F3.4 POST-FLIGHT INSPECTION</p>
                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-foreground)' }}>
                            Kiểm tra Sau Chuyến bay (Post-flight)
                        </h3>
                    </div>
                    <button
                        className="icon-button"
                        onClick={onClose}
                        style={{ width: '32px', height: '32px' }}
                    >
                        <Icon name="x" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '8px' }}>
                            Trạng thái Thiết bị sau Chuyến bay
                        </label>
                        <select
                            value={deviceStatus}
                            onChange={(e) => setDeviceStatus(e.target.value as DeviceStatus)}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.85rem',
                                fontFamily: 'var(--sans)',
                                fontWeight: 600,
                                color: 'var(--color-foreground)',
                                background: 'var(--color-background)',
                            }}
                        >
                            <option value="AVAILABLE">✅ AVAILABLE (Sẵn sàng cho nhiệm vụ tiếp theo)</option>
                            <option value="IDLE_CHARGING">🔋 IDLE_CHARGING (Đưa vào trạm sạc pin)</option>
                            <option value="MAINTENANCE">🔧 MAINTENANCE (Gặp sự cố - Cần bảo trì)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '8px' }}>
                            Ghi chú Kiểm tra Kỹ thuật (Inspection Log Notes)
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Nhập chi tiết ghi chú..."
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.82rem',
                                fontFamily: 'var(--sans)',
                                color: 'var(--color-foreground)',
                                background: 'var(--color-background)',
                                resize: 'vertical',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            icon="check"
                            type="submit"
                            disabled={isSubmitting}
                            style={{ backgroundColor: '#15803d' }}
                        >
                            {isSubmitting ? 'Submitting...' : 'Xác nhận & Hoàn thành Mission'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
