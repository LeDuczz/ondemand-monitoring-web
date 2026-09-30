import { useI18n } from '../../i18n'
import { defineMessages } from '../../i18n'

const formFooterMessages = defineMessages({
  vi: { cancel: 'Huỷ', save: 'Lưu', saving: 'Đang lưu...' },
  en: { cancel: 'Cancel', save: 'Save', saving: 'Saving...' },
})

export function FormFooter({
  formId,
  busy,
  onClose,
}: {
  formId: string
  busy: boolean
  onClose: () => void
}) {
  const { t } = useI18n(formFooterMessages)
  return (
    <>
      <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>
        {t.cancel}
      </button>
      <button
        type="submit"
        form={formId}
        className="odm-btn odm-btn-p"
        disabled={busy}
      >
        {busy ? t.saving : t.save}
      </button>
    </>
  )
}
