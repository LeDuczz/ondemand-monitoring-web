import { useI18n } from '../../../../../shared/i18n'
import { customerHref } from '../../../routes'
import { submitBarMessages } from './SubmitBar.messages'

type Props = { error: string | null; disabled: boolean; onSubmit: () => void }

export function SubmitBar({ error, disabled, onSubmit }: Props) {
  const { t } = useI18n(submitBarMessages)
  return (
    <>
      {error && (
        <div className="co-notice is-danger" role="alert">
          {error}
        </div>
      )}
      <div className="co-footer">
        <a className="odm-btn odm-btn-gh" href={customerHref({ screen: 'orders' })}>
          {t.cancel}
        </a>
        <div className="co-footer-spacer" />
        <button type="button" className="odm-btn odm-btn-p" disabled={disabled} onClick={onSubmit}>
          {t.submit}
        </button>
      </div>
    </>
  )
}
