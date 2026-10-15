export function CreateMissionSkeleton({ label }: { label: string }) {
  return (
    <div className="odm-or" aria-busy="true" aria-live="polite">
      <div className="odm-or-layout">
        <div className="odm-or-main">
          <span className="odm-sk odm-or-sk-main" />
          <span className="odm-sk odm-or-sk-sub" />
        </div>
        <div className="odm-or-side">
          <span className="odm-sk odm-or-sk-side" />
          <span className="odm-sk odm-or-sk-side" />
        </div>
      </div>
      <span className="odm-visually-hidden">{label}</span>
    </div>
  )
}
