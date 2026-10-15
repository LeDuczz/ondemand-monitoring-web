export function DispatchLoading({ label }: { label: string }) {
  return (
    <div className="odm-mgr-dash" aria-busy="true" aria-live="polite">
      <span className="odm-sk" style={{ width: '100%', height: 90 }} />
      <div className="odm-mgr-dispatch-grid" style={{ marginTop: 14 }}>
        <span className="odm-sk" style={{ width: '100%', height: 400 }} />
        <span className="odm-sk" style={{ width: '100%', height: 400 }} />
      </div>
      <span className="odm-visually-hidden">{label}</span>
    </div>
  )
}
