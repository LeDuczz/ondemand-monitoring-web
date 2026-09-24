import { useEffect, useState } from 'react'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { Button } from '../../../shared/components/Button'
import { missionApi } from '../../mission/api/missionApi'
import type { Mission } from '../../mission/types/mission'
import { droneApi, type AvailableDrone } from '../api/droneApi'
import { operatorApi, type AvailableOperator } from '../api/operatorApi'

export function StaffAssignmentPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [drones, setDrones] = useState<AvailableDrone[]>([])
  const [operators, setOperators] = useState<AvailableOperator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigningMissionId, setAssigningMissionId] = useState<string | null>(null)

  const [selectedDrone, setSelectedDrone] = useState<Record<string, string>>({})
  const [selectedOperator, setSelectedOperator] = useState<Record<string, string>>({})

  const fetchAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      const [missionData, availableDrones, availableOperators] = await Promise.all([
        missionApi.getPendingAssignmentMissions(),
        droneApi.getAvailable(),
        operatorApi.getAvailable(),
      ])
      setMissions(missionData || [])
      setDrones(availableDrones)
      setOperators(availableOperators)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const handleAssign = async (missionId: string) => {
    const droneId = selectedDrone[missionId]
    const operatorId = selectedOperator[missionId]
    
    if (!droneId || !operatorId) {
      setError('Please choose both a drone and an operator before assigning.')
      return
    }
    setAssigningMissionId(missionId)
    setError(null)
    try {
      await missionApi.assignResources(missionId, droneId, operatorId)
      await fetchAssignments()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Assignment failed')
    } finally {
      setAssigningMissionId(null)
    }
  }

  return (
    <PortalLayout
      role="STAFF"
      title="Assignments"
      subtitle="Assign drones and operators to newly approved missions."
    >
      <section className="portal-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2>Pending Assignments</h2>
          <Button onClick={fetchAssignments}>Refresh</Button>
        </div>

        {error && <p role="alert" style={{ color: 'var(--red-text)' }}>{error}</p>}
        {loading ? (
          <p>Loading missions...</p>
        ) : missions.length === 0 ? (
          <p>No missions waiting for assignment.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-3)' }}>
                <th style={{ padding: '12px 8px' }}>Mission ID</th>
                <th style={{ padding: '12px 8px' }}>Title</th>
                <th style={{ padding: '12px 8px' }}>Customer</th>
                <th style={{ padding: '12px 8px' }}>Select Drone</th>
                <th style={{ padding: '12px 8px' }}>Select Operator</th>
                <th style={{ padding: '12px 8px', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{m.id}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <strong>{m.orderTitle ?? m.id}</strong>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{m.customerName}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <select 
                      value={selectedDrone[m.id] || ''}
                      onChange={(e) => setSelectedDrone({...selectedDrone, [m.id]: e.target.value})}
                      style={{ padding: 6, borderRadius: 4, width: '100%' }}
                    >
                      <option value="">-- Choose Drone --</option>
                      {drones.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <select 
                      value={selectedOperator[m.id] || ''}
                      onChange={(e) => setSelectedOperator({...selectedOperator, [m.id]: e.target.value})}
                      style={{ padding: 6, borderRadius: 4, width: '100%' }}
                    >
                      <option value="">-- Choose Operator --</option>
                      {operators.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.fullName} ({o.email})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <Button disabled={assigningMissionId !== null} onClick={() => void handleAssign(m.id)}>
                      {assigningMissionId === m.id ? 'Assigning…' : 'Assign'}
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

