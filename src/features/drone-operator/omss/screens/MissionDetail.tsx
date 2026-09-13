import type { Mission, Drone, Screen } from '../types';
import { MissionBadge, DroneBadge, PriorityBadge } from '../components/StatusBadge';

interface Props { mission: Mission; drone: Drone; onScreen: (s: Screen) => void; onBack: () => void }

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)', minWidth: 140 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textAlign: 'right', fontFamily: mono ? 'var(--font-data)' : undefined }}>{value}</span>
    </div>
  );
}

export default function MissionDetail({ mission, drone, onScreen, onBack }: Props) {
  const isAcceptable = mission.state === 'WAITING_OPERATOR_ACCEPTANCE';

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
      {/* Breadcrumb */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2L4 7l5 5"/></svg>
        My missions
      </button>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{mission.title}</h1>
            <PriorityBadge priority={mission.priority} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-data)', color: 'var(--text-3)' }}>{mission.id}</span>
            <MissionBadge state={mission.state} />
          </div>
        </div>
        {isAcceptable && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onScreen('accept-reject')} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'var(--surface)', fontSize: 14, fontWeight: 500, color: 'var(--text)', cursor: 'pointer' }}>
              Reject
            </button>
            <button onClick={() => onScreen('accept-reject')} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              Accept mission
            </button>
          </div>
        )}
      </div>

      {/* Three-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: 20 }}>
        {/* Mission details */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>Mission details</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>Assignment and operational parameters</p>
          <KV label="Customer"          value={mission.customer} />
          <KV label="Mission type"      value="Infrastructure survey" />
          <KV label="Target location"   value={mission.location} />
          <KV label="Scheduled"         value={new Date(mission.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} />
          <KV label="Duration estimate" value={`${mission.estimatedMinutes} min`} />
          <KV label="Max altitude"      value={`${mission.maxAltitudeM} m AGL`} />
          <KV label="Distance"          value={`${mission.distanceKm} km`} />
          <KV label="Flight plan"       value={mission.flightPlanId} mono />
          {mission.notes && (
            <div style={{ marginTop: 14, padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{mission.notes}</div>
          )}
        </div>

        {/* Map */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>Location map</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{mission.location}</p>
          </div>
          <svg width="100%" height="300" viewBox="0 0 400 300" style={{ display: 'block' }}>
            <rect width="400" height="300" fill="#eef0f3"/>
            {/* Grid */}
            {[0,1,2,3,4,5].map(i => <line key={`h${i}`} x1="0" y1={i*60} x2="400" y2={i*60} stroke="#dde0e4" strokeWidth=".5"/>)}
            {[0,1,2,3,4,5,6,7].map(i => <line key={`v${i}`} x1={i*60} y1="0" x2={i*60} y2="300" stroke="#dde0e4" strokeWidth=".5"/>)}
            {/* Route */}
            <polyline points="80,220 140,160 200,130 260,110 320,120 360,140" fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="5,4" opacity=".7"/>
            {/* Waypoints */}
            {[[80,220],[140,160],[200,130],[260,110],[320,120],[360,140]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="5" fill="#4f46e5" opacity=".8"/>
            ))}
            {/* Target */}
            <circle cx="200" cy="130" r="14" fill="none" stroke="#4f46e5" strokeWidth="2" opacity=".4"/>
            <circle cx="200" cy="130" r="5" fill="#4f46e5"/>
            {/* Label */}
            <text x="200" y="112" textAnchor="middle" fill="#4f46e5" fontSize="10" fontWeight="600">Mission area</text>
            {/* Compass */}
            <text x="370" y="26" fill="#6b7280" fontSize="11" fontWeight="600">N</text>
            <line x1="374" y1="30" x2="374" y2="42" stroke="#6b7280" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Drone */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>Assigned drone</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>Current status and readiness</p>

          <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '14px', marginBottom: 16, textAlign: 'center' }}>
            <svg width="64" height="48" viewBox="0 0 64 48" fill="none" style={{ display: 'block', margin: '0 auto 10px' }}>
              <rect x="26" y="20" width="12" height="8" rx="2" fill="#4f46e5" opacity=".15" stroke="#4f46e5" strokeWidth="1.2"/>
              {[[8,8],[48,8],[8,32],[48,32]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="5" fill="none" stroke="#4f46e5" strokeWidth="1.2" opacity=".5"/>)}
              {[[8,8],[48,8],[8,32],[48,32]].map(([x,y],i)=><line key={i} x1={x} y1={y} x2={[27,37,27,37][i]} y2={[22,22,26,26][i]} stroke="#6b7280" strokeWidth="1"/>)}
              <circle cx="32" cy="24" r="3" fill="#4f46e5"/>
            </svg>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{drone.name}</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-data)', color: 'var(--text-3)', marginTop: 2 }}>{drone.id}</div>
            <div style={{ marginTop: 8 }}><DroneBadge state={drone.state} /></div>
          </div>

          {[
            { label: 'Model',   value: drone.model },
            { label: 'Serial',  value: drone.serialNumber },
            { label: 'Battery', value: `${drone.battery}%` },
            { label: 'GPS',     value: `${drone.gpsCount} satellites` },
            { label: 'Storage', value: `${(drone.storageMB/1024).toFixed(1)} GB free` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.label}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', fontFamily: r.label === 'Serial' ? 'var(--font-data)' : undefined }}>{r.value}</span>
            </div>
          ))}

          {/* Weather */}
          <div style={{ marginTop: 16, padding: '12px', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-text)', marginBottom: 4 }}>Weather — Good to fly</div>
            <div style={{ fontSize: 12, color: 'var(--green-text)', opacity: .8 }}>Wind 8 km/h · Visibility 14 km · Partly cloudy</div>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      {isAcceptable && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={() => onScreen('accept-reject')} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'var(--surface)', fontSize: 14, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer' }}>Reject mission</button>
          <button onClick={() => onScreen('accept-reject')} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Accept mission</button>
        </div>
      )}
    </div>
  );
}
