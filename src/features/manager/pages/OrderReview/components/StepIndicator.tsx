export function StepIndicator({ stepText }: { stepText: string }) {
  return (
    <div className="odm-osb-status">
      <span className="odm-osb-step">{stepText}</span>
    </div>
  )
}
