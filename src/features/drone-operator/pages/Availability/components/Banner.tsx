export function Banner({
  tone,
  children,
}: {
  tone: 'green' | 'red' | 'yellow'
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: '10px 14px',
        borderRadius: 8,
        background: `var(--${tone}-bg)`,
        color: `var(--${tone}-fg)`,
        border: `1px solid var(--${tone}-dot)`,
        fontSize: 13,
      }}
    >
      {children}
    </div>
  )
}
