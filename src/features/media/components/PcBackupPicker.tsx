import { useId } from 'react'

export function PcBackupPicker({ contentType, disabled, onSelect }: {
  contentType: string
  disabled: boolean
  onSelect: (file: File) => void
}) {
  const id = useId()
  return (
    <div style={{ marginTop: 10 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
        Khôi phục bằng bản sao từ PC (phải khớp SHA-256 bản gốc)
      </label>
      <input id={id} type="file" accept={contentType} disabled={disabled}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) onSelect(file)
        }} />
    </div>
  )
}
