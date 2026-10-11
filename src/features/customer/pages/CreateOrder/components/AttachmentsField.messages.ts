import { defineMessages } from '../../../../../shared/i18n'

export const attachmentsFieldMessages = defineMessages({
  vi: {
    label: 'Tệp đính kèm (tùy chọn)',
    drop: 'Kéo thả tệp hoặc',
    choose: 'chọn tệp',
    meta: 'Hỗ trợ: ảnh PNG, JPG. Chọn được nhiều ảnh.',
    hint: 'Gắn ảnh hiện trạng, bản vẽ hoặc ảnh mẫu để staff hiểu rõ khu vực trước khi duyệt.',
    removeNamed: (name: string) => `Xóa ảnh ${name}`,
    remove: 'Xóa ảnh',
    invalidImage: 'Chỉ nhận file hình ảnh.',
  },
  en: {
    label: 'Attachments (optional)',
    drop: 'Drag and drop files or',
    choose: 'choose files',
    meta: 'Supported: PNG, JPG images. Multiple images allowed.',
    hint: 'Attach site photos, drawings or samples so staff understand the area before review.',
    removeNamed: (name: string) => `Remove image ${name}`,
    remove: 'Remove image',
    invalidImage: 'Only image files are accepted.',
  },
})
