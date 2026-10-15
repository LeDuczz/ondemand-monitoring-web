import { useEffect, useRef } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../../../media/api/operatorMediaApi'
import { previewLightboxMessages } from './PreviewLightbox.messages'

/** Modal dialog showing an enlarged image preview. */
export function PreviewLightbox({
  preview,
  onClose,
}: {
  preview: LocalMedia
  onClose: () => void
}) {
  const { t } = useI18n(previewLightboxMessages)
  const previewDialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    previewDialog.current?.showModal()
  }, [preview])
  return (
    <dialog
      ref={previewDialog}
      className="upload-media-lightbox"
      aria-label={t.enlargePreview}
      onClose={onClose}
    >
      <button
        type="button"
        className="odm-btn"
        onClick={() => previewDialog.current?.close()}
      >
        {t.closePreview}
      </button>
      <img
        src={operatorMediaApi.previewUrl(preview.localMediaId)}
        alt={preview.fileName}
      />
    </dialog>
  )
}
