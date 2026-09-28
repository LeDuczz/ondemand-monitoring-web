import { useEffect, useState } from 'react'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { Button } from '../../../shared/components/Button'
import { useI18n } from '../../../shared/i18n'
import { missionApi } from '../../mission/api/missionApi'
import type { Mission } from '../../mission/types/mission'
import { droneApi, type AvailableDrone } from '../api/droneApi'
import { operatorApi, type AvailableOperator } from '../api/operatorApi'
import { staffAssignmentPageMessages } from './StaffAssignmentPage.messages'

export function StaffAssignmentPage() {
  const { t } = useI18n(staffAssignmentPageMessages)
  const [missions, setMissions] = useState<Mission[]>([])
  const [drones, setDrones] = useState<AvailableDrone[]>([])
  const [operators, setOperators] = useState<AvailableOperator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigningMissionId, setAssigningMissionId] = useState<string | null>(
    null,
  )

  const [selectedDrone, setSelectedDrone] = useState<Record<string, string>>({})
  const [selectedOperator, setSelectedOperator] = useState<
    Record<string, string>
  >({})

  const fetchAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      const [missionData, availableDrones, availableOperators] =
        await Promise.all([
          missionApi.getPendingAssignmentMissions(),
          droneApi.getAvailable(),
          operatorApi.getAvailable(),
        ])
      setMissions(missionData || [])
      setDrones(availableDrones)
      setOperators(availableOperators)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAssign = async (missionId: string) => {
    const droneId = selectedDrone[missionId]
    const operatorId = selectedOperator[missionId]

    if (!droneId || !operatorId) {
      setError(t.chooseBoth)
      return
    }
    setAssigningMissionId(missionId)
    setError(null)
    try {
      await missionApi.assignResources(missionId, droneId, operatorId)
      await fetchAssignments()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.assignFailed)
    } finally {
      setAssigningMissionId(null)
    }
  }

  return (
    <PortalLayout role="STAFF" title={t.title} subtitle={t.subtitle}>
      <section className="portal-panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2>{t.pendingAssignments}</h2>
          <Button onClick={fetchAssignments}>{t.refresh}</Button>
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--red-text)' }}>
            {error}
          </p>
        )}
        {loading ? (
          <p>{t.loadingMissions}</p>
        ) : missions.length === 0 ? (
          <p>{t.noMissions}</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid var(--border)',
                  color: 'var(--text-3)',
                }}
              >
                <th style={{ padding: '12px 8px' }}>{t.missionId}</th>
                <th style={{ padding: '12px 8px' }}>{t.missionTitle}</th>
                <th style={{ padding: '12px 8px' }}>{t.customer}</th>
                <th style={{ padding: '12px 8px' }}>{t.selectDrone}</th>
                <th style={{ padding: '12px 8px' }}>{t.selectOperator}</th>
                <th style={{ padding: '12px 8px', width: '120px' }}>
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => (
                <tr
                  key={m.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{m.id}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <strong>{m.orderTitle ?? m.id}</strong>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>
                    {m.customerName}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <select
                      value={selectedDrone[m.id] || ''}
                      onChange={(e) =>
                        setSelectedDrone({
                          ...selectedDrone,
                          [m.id]: e.target.value,
                        })
                      }
                      style={{ padding: 6, borderRadius: 4, width: '100%' }}
                    >
                      <option value="">{t.chooseDronePlaceholder}</option>
                      {drones.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <select
                      value={selectedOperator[m.id] || ''}
                      onChange={(e) =>
                        setSelectedOperator({
                          ...selectedOperator,
                          [m.id]: e.target.value,
                        })
                      }
                      style={{ padding: 6, borderRadius: 4, width: '100%' }}
                    >
                      <option value="">{t.chooseOperatorPlaceholder}</option>
                      {operators.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.fullName} ({o.email})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <Button
                      disabled={assigningMissionId !== null}
                      onClick={() => void handleAssign(m.id)}
                    >
                      {assigningMissionId === m.id ? t.assigning : t.assign}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </PortalLayout>
  )
}
