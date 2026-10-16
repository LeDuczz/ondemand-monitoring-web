import { defineMessages, useI18n } from '../../i18n'
import { formatVnd } from '../../lib/formatVnd'
import type {
  ChecklistPriceBreakdown,
  ServicePricePreview,
} from '../../api/checklistPricingApi'
import './priceBreakdown.css'

const messages = defineMessages({
  vi: {
    packageFee: 'Giá gói cũ của danh mục (chưa có checklist nào có giá)',
    fromChecklists:
      'Giá mặc định của dịch vụ chỉ gồm giá các checklist; không cộng thêm giá gói cũ.',
    checklists: 'Checklist',
    total: 'Tổng (chưa gồm các yếu tố theo đơn như quãng đường, diện tích)',
    policy: 'Chính sách giá',
    draft: 'bản nháp',
    included: 'Đã bao gồm',
    requested: 'Yêu cầu',
    extra: 'Bổ sung',
    images: 'ảnh',
    videos: 'video',
    subtotal: 'Tạm tính checklist',
    custom: 'Ngoài danh mục',
    profile: 'Hồ sơ giá',
    qty: 'SL',
    unit: 'Đơn giá',
    amount: 'Thành tiền',
    none: 'Chưa có checklist trong cấu hình này.',
    warnings: 'Chưa tính được giá cho một số checklist',
    includedHint:
      'Giá của phần media đã bao gồm và giá media bổ sung là hai khoản riêng, mỗi khoản chỉ tính một lần.',
    block: 'khối',
    awaitingManagerQuote: 'Chờ Manager báo giá',
    quotePending:
      'Các yêu cầu đang chờ Manager báo giá chưa được tính vào tổng này.',
  },
  en: {
    packageFee: 'Legacy catalog price (no checklist is priced yet)',
    fromChecklists:
      'The default service price is only the sum of its checklists; no legacy package price is added.',
    checklists: 'Checklists',
    total: 'Total (excludes order-specific factors such as distance and area)',
    policy: 'Pricing policy',
    draft: 'draft',
    included: 'Included',
    requested: 'Requested',
    extra: 'Extra',
    images: 'images',
    videos: 'videos',
    subtotal: 'Checklist subtotal',
    custom: 'Custom',
    profile: 'Pricing profile',
    qty: 'Qty',
    unit: 'Unit price',
    amount: 'Amount',
    none: 'No checklist in this configuration.',
    warnings: 'Some checklists cannot be priced yet',
    includedHint:
      'Included media and extra media are separate charges; each is billed exactly once.',
    block: 'block',
    awaitingManagerQuote: 'Awaiting manager quote',
    quotePending:
      'Requirements awaiting a manager quote are excluded from this total.',
  },
})

export function ChecklistBreakdown({ row }: { row: ChecklistPriceBreakdown }) {
  const { t } = useI18n(messages)
  return (
    <section className="price-bd-checklist" aria-label={row.content}>
      <header>
        <strong>{row.content}</strong>
        {row.custom && <span className="price-bd-tag">{t.custom}</span>}
        <span className="price-bd-profile">
          {t.profile}: {row.pricingProfile}
        </span>
      </header>
      <p className="price-bd-media">
        {t.included}: {row.includedImageCount} {t.images} ·{' '}
        {row.includedVideoCount} {t.videos} — {t.requested}:{' '}
        {row.requestedImageCount} {t.images} · {row.requestedVideoCount}{' '}
        {t.videos} — {t.extra}: {row.extraImageCount} {t.images} ·{' '}
        {row.extraVideoCount} {t.videos}
      </p>
      {row.quotePending ? (
        <p className="price-bd-warning">{t.awaitingManagerQuote}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">{t.qty}</th>
              <th scope="col">{t.unit}</th>
              <th scope="col">{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {row.lines.map((line, index) => (
              <tr key={`${line.component}-${index}`}>
                <td>{line.description}</td>
                <td>
                  {line.quantity}
                  {line.blockSize ? ` ${t.block}` : ''}
                </td>
                <td>{formatVnd(line.unitPrice)}</td>
                <td>{formatVnd(line.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>
                {t.subtotal}
              </th>
              <td>{formatVnd(row.subtotal)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  )
}

/** Read-only price breakdown shared by the Admin service page and the customer quote. */
export function PriceBreakdownView({
  preview,
  showPackageFee = true,
}: {
  preview: ServicePricePreview
  showPackageFee?: boolean
}) {
  const { t } = useI18n(messages)
  return (
    <div className="price-bd">
      <p className="price-bd-policy">
        {t.policy} v{preview.policyVersion}
        {preview.draftPolicy ? ` (${t.draft})` : ''}
      </p>
      {preview.warnings.length > 0 && (
        <div role="alert" className="price-bd-warning">
          <strong>{t.warnings}</strong>
          <ul>
            {preview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      {preview.quotePending && (
        <p role="status" className="price-bd-warning">
          {t.quotePending}
        </p>
      )}
      {preview.priceSource === 'CHECKLISTS' && (
        <p className="price-bd-hint">{t.fromChecklists}</p>
      )}
      {showPackageFee && preview.priceSource === 'LEGACY_BASE_PRICE' && (
        <div className="price-bd-row">
          <span>{t.packageFee}</span>
          <strong>{formatVnd(preview.packageFee)}</strong>
        </div>
      )}
      {preview.checklists.length === 0 ? (
        <p className="price-bd-empty">{t.none}</p>
      ) : (
        preview.checklists.map((row, index) => (
          <ChecklistBreakdown
            key={`${row.checklistId ?? 'custom'}-${index}`}
            row={row}
          />
        ))
      )}
      <div className="price-bd-row">
        <span>{t.checklists}</span>
        <strong>{formatVnd(preview.checklistSubtotal)}</strong>
      </div>
      <div className="price-bd-row price-bd-total">
        <span>{t.total}</span>
        <strong>{formatVnd(preview.total)}</strong>
      </div>
      <p className="price-bd-hint">{t.includedHint}</p>
    </div>
  )
}
