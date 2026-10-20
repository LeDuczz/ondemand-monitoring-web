import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { amount, digits } from '../pricingInput'
import { itemPriceMessages } from './ItemPrice.messages'

export type PriceRange = { min: number; max: number }

/** System price, the manager's approved price input and how it differs from the system price. */
export function ItemPrice({
  systemPrice,
  price,
  range,
  managerPriced,
  disabled,
  onChange,
}: {
  systemPrice: number
  price: string
  /** Prices the Manager may approve; null when the policy limits are unknown. */
  range: PriceRange | null
  managerPriced: boolean
  disabled: boolean
  onChange: (value: string) => void
}) {
  const { t, locale } = useI18n(itemPriceMessages)
  const proposed = amount(price)
  const difference = proposed - systemPrice
  const percent = systemPrice === 0 ? null : (difference / systemPrice) * 100
  const sign = difference > 0 ? '+' : ''
  const outside =
    range !== null &&
    difference !== 0 &&
    (proposed < range.min || proposed > range.max)

  return (
    <div className="finance-item-price">
      <small>
        {t.systemPrice}: {formatVnd(systemPrice)}
      </small>
      {managerPriced ? (
        <>
          <label className="finance-price">
            <span>{`${t.approvedPrice} (${t.vnd})`}</span>
            <input
              inputMode="numeric"
              value={price}
              disabled={disabled}
              onChange={(event) => onChange(digits(event.target.value))}
            />
          </label>
          <small className={difference === 0 ? '' : 'finance-price-difference'}>
            {t.difference}: {sign}
            {formatVnd(difference)}
            {percent == null
              ? ''
              : ` (${percent > 0 ? '+' : ''}${percent.toLocaleString(locale, {
                  maximumFractionDigits: 4,
                })}%)`}
          </small>
          {range && (
            <small
              className={outside ? 'finance-range is-out' : 'finance-range'}
              role={outside ? 'alert' : undefined}
            >
              {outside ? t.outsideRange : t.allowedRange}
              {': '}
              {formatVnd(range.min)} – {formatVnd(range.max)}
            </small>
          )}
        </>
      ) : null}
    </div>
  )
}
