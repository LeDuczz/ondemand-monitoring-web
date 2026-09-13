const USERS = [
  { id: 'USR-0042', name: 'J. Martinez', email: 'j.martinez@omss.io', role: 'Drone Operator', status: 'active',   last: 'Today, 09:12' },
  { id: 'USR-0019', name: 'S. Kim',      email: 's.kim@omss.io',      role: 'Manager',        status: 'active',   last: 'Today, 08:55' },
  { id: 'USR-0031', name: 'R. Patel',    email: 'r.patel@omss.io',    role: 'System Operator',status: 'active',   last: 'Today, 13:41' },
  { id: 'USR-0055', name: 'A. Chen',     email: 'a.chen@acme.co',     role: 'Customer',       status: 'active',   last: 'Today, 11:20' },
  { id: 'USR-0061', name: 'T. Nguyen',   email: 't.nguyen@omss.io',   role: 'Drone Operator', status: 'active',   last: 'Today, 14:01' },
  { id: 'USR-0038', name: 'B. Cole',     email: 'b.cole@omss.io',     role: 'Drone Operator', status: 'inactive', last: '1 Sep 2026' },
];

const AUDIT = [
  { actor: 'L. Torres',   action: 'Modified system config — flight altitude limits', time: '09:04', type: 'config' },
  { actor: 'R. Patel',    action: 'Added new drone DR-GAMMA-3 to fleet registry',  time: '08:30', type: 'fleet' },
  { actor: 'S. Kim',      action: 'Approved control handover for MSN-9011',         time: '08:17', type: 'approval' },
  { actor: 'J. Martinez', action: 'Signed in from 192.168.1.44',                    time: '09:12', type: 'auth' },
  { actor: 'A. Chen',     action: 'Downloaded media package REQ-8830',              time: 'Yesterday 17:05', type: 'download' },
];

const TYPE_CFG: Record<string, string> = {
  config:   'var(--red-text)',
  fleet:    'var(--blue-text)',
  approval: 'var(--amber-text)',
  auth:     'var(--text-3)',
  download: 'var(--green-text)',
};

const CONFIG_ITEMS = [
  { label: 'Max flight altitude', value: '120 m AGL' },
  { label: 'Default flight radius', value: '500 m' },
  { label: 'Token TTL', value: '15 min' },
  { label: 'Auto RTB battery threshold', value: '20%' },
  { label: 'GCS heartbeat interval', value: '5 s' },
  { label: 'Media retention period', value: '90 days' },
];

export default function AdminOverview() {
  const activeUsers = USERS.filter(u => u.status === 'active').length;

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 980 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>Administration</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>L. Torres · ADM-001 · Platform Administrator · OMSS v2.4.1</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total users', value: `${USERS.length}`, sub: `${activeUsers} active` },
            { label: 'Platform uptime', value: '99.97%', sub: 'Last 30 days' },
            { label: 'API calls today', value: '14,821', sub: '↑ 8% vs yesterday' },
            { label: 'Storage used', value: '1.2 TB', sub: 'of 10 TB capacity' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-data)', color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Users table */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>User accounts</span>
                <button style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add user</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Role', 'Status', 'Last active'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {USERS.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < USERS.length - 1 ? '1px solid var(--border)' : 'none', opacity: u.status === 'inactive' ? .55 : 1 }}>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{u.name}</div>
                        <div style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--text-3)' }}>{u.id}</div>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-2)' }}>{u.email}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-2)' }}>{u.role}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: u.status === 'active' ? 'var(--green-text)' : 'var(--text-3)', background: u.status === 'active' ? 'var(--green-bg)' : 'var(--surface-2)', border: `1px solid ${u.status === 'active' ? 'var(--green-border)' : 'var(--border)'}`, padding: '2px 8px', borderRadius: 4 }}>
                          {u.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-3)' }}>{u.last}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Audit log */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Audit log</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Last 24 h</span>
              </div>
              {AUDIT.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '11px 20px', borderBottom: i < AUDIT.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 3, borderRadius: 2, height: 32, background: TYPE_CFG[a.type], flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{a.actor}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}> — {a.action}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0, fontFamily: 'var(--font-data)' }}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System config panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>System configuration</span>
                <button style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border-2)', background: 'var(--surface)', fontSize: 11, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer' }}>Edit</button>
              </div>
              {CONFIG_ITEMS.map((c, i) => (
                <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < CONFIG_ITEMS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.label}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-data)', fontWeight: 600, color: 'var(--text)' }}>{c.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Quick actions</div>
              {['Export audit log', 'Manage integrations', 'View system health', 'Backup configuration'].map((label, i) => (
                <button key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 0', background: 'none', border: 'none', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)', textAlign: 'left' }}>
                  {label}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 2l5 5-5 5"/></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
