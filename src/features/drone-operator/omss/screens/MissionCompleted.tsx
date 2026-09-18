import type { Mission, Drone } from '../types';

interface Props { mission: Mission; drone: Drone; onMedia: () => void; onMissions: () => void }

export default function MissionCompleted({ mission, drone, onMedia, onMissions }: Props) {
  const stats = [
    { l: 'Flight time',   v: '42:18', u: 'mm:ss' },
    { l: 'Distance',      v: '4.1',   u: 'km' },
    { l: 'Max altitude',  v: '48.2',  u: 'm AGL' },
    { l: 'Avg speed',     v: '8.4',   u: 'm/s' },
    { l: 'Battery used',  v: '61%',   u: 'consumed' },
    { l: 'Photos',        v: '847',   u: 'files' },
    { l: 'Video',         v: '42:18', u: 'duration' },
    { l: 'Media size',    v: '4.2',   u: 'GB' },
  ];

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 600 }}>
        {/* Success hero */}
        <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 10, padding: '24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><polyline points="4,11 9,16 18,6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green-text)' }}>Mission completed</div>
            <div style={{ fontSize: 14, color: 'var(--green-text)', opacity: .8, marginTop: 2 }}>{mission.title} · {mission.id}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', marginBottom: 16, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Mission statistics</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {stats.map(s => (
              <div key={s.l}>
                <div style={{ fontSize: 22, fontFamily: 'var(--font-data)', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.u}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Record */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 16, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Mission record</div>
          {[['Mission', mission.id], ['Customer', mission.customer], ['Drone', `${drone.name} (${drone.id})`], ['Operator', 'J. Martinez (OPR-112)'], ['Post-flight', 'All 8 items passed'], ['Media', '847 files · 4.2 GB · pending upload']].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: l === 'Mission' ? 'var(--font-data)' : undefined }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Media prompt */}
        <div style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: 8, padding: '14px', marginBottom: 20, fontSize: 14, color: 'var(--blue-text)' }}>
          <strong>Next step:</strong> Upload 847 files (4.2 GB) to finalise the mission record. Automatic upload will begin on the next screen.
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onMissions} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'var(--surface)', fontSize: 14, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer' }}>Back to missions</button>
          <button onClick={onMedia} style={{ flex: 1, padding: '11px', borderRadius: 8, border: 'none', background: 'var(--accent)', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Upload mission media</button>
        </div>
      </div>
    </div>
  );
}
