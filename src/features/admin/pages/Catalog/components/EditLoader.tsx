import type { ReactNode } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { Modal } from '../../../components/common/Modal'
import { editLoaderMessages } from './EditLoader.messages'

type Props<T> = {
  title: string
  /** Fetches the record from the BE; omit for the create flow. */
  load?: (signal: AbortSignal) => Promise<T>
  onClose: () => void
  children: (initial: T | undefined) => ReactNode
}

/** Loads the record for an edit modal, then renders the form modal. */
export function EditLoader<T>({ title, load, onClose, children }: Props<T>) {
  const { t } = useI18n(editLoaderMessages)
  const { data, error, reload } = useApiQuery<T | undefined>(
    (signal) => (load ? load(signal) : Promise.resolve(undefined)),
    [],
  )
  if (!load || data !== undefined) return <>{children(data)}</>
  return (
    <Modal title={title} icon="plus" onClose={onClose}>
      {error === undefined ? (
        <div className="adm-muted" aria-busy="true">
          {t.loading}
        </div>
      ) : (
        <div role="alert" className="adm-alert is-danger">
          {error instanceof Error ? error.message : String(error)}{' '}
          <button type="button" className="odm-btn odm-btn-gh odm-btn-sm" onClick={reload}>
            {t.retry}
          </button>
        </div>
      )}
    </Modal>
  )
}
