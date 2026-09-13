export default function SimulationZones() {
  return (
    <div
      className="fade-in"
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            margin: '0 0 4px',
            fontSize: 20,
            lineHeight: 1.2,
            color: 'var(--text)',
            fontWeight: 700,
          }}
        >
          Zone map
        </h1>
        <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 13 }}>
          Read-only simulation zones for mission awareness. Editing is available to manager workspaces only.
        </p>
      </div>
      <iframe
        title="Read-only simulation zone map"
        src="http://localhost:8080/simulation-viewer/index.html?readonly=1"
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          border: 'none',
          background: '#eef2f6',
        }}
      />
    </div>
  );
}
