import { useEffect, useState } from 'react'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { Button } from '../../../shared/components/Button'
import { missionApi } from '../../mission/api/missionApi'
import type { Mission } from '../../mission/types/mission'

export function StaffAssignmentPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Demo hardcoded operators and drones for assignment dropdown
  const operators = [
    { id: 'OPR-112', name: 'Seed Operator (OPR-112)' },
    { id: 'OPR-105', name: 'Backup Operator (OPR-105)' },
  ]
  const drones = [
    { id: '30000000-0000-0000-0000-000000000006', name: 'Eagle-48 X500 (SIM)' },
    { id: '30000000-0000-0000-0000-000000000005', name: 'Eagle-47 X500 (active demo)' },
  ]

  const [selectedDrone, setSelectedDrone] = useState<Record<string, string>>({})
  const [selectedOperator, setSelectedOperator] = useState<Record<string, string>>({})

  const fetchMissions = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await missionApi.getPendingAssignmentMissions()
      setMissions(data || [])
    } catch (e: any) {
      setError(e.message || 'Failed to fetch pending missions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMissions()
  }, [])

  const handleAssign = async (missionId: string) => {
    const droneId = selectedDrone[missionId]
    const operatorId = selectedOperator[missionId]
    
    if (!droneId || !operatorId) {
      alert('Please choose both a drone and an operator before assigning.')
      return
    }
    
    try {
      // Must assign drone first as per backend validation
      await missionApi.assignDrone(missionId, droneId)
      await missionApi.assignOperator(missionId, operatorId)
      alert('Assigned successfully. The mission is now visible to the operator.')
      fetchMissions()
    } catch (e: any) {
      alert(e.message || 'Assignment failed')
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
          <Button onClick={fetchMissions}>Refresh</Button>
        </div>

        {loading ? (
          <p>Loading missions...</p>
        ) : error ? (
          <p style={{ color: 'var(--red-text)' }}>{error}</p>
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
                      {drones.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <select 
                      value={selectedOperator[m.id] || ''}
                      onChange={(e) => setSelectedOperator({...selectedOperator, [m.id]: e.target.value})}
                      style={{ padding: 6, borderRadius: 4, width: '100%' }}
                    >
                      <option value="">-- Choose Operator --</option>
                      {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <Button onClick={() => handleAssign(m.id)}>Assign</Button>
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

