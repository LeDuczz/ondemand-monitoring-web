import type { ReactNode } from 'react'

import { OrderIcon, type OrderIconName } from './OrderIcon'

export type InfoTile = {
  icon: OrderIconName
  label: string
  value: ReactNode
  copyText?: string
}

export function InfoTileCard({
  tile,
  copyLabel,
}: {
  tile: InfoTile
  copyLabel: string
}) {
  const { copyText } = tile
  return (
    <div className="odm-or-svc-tile">
      <span className="odm-or-svc-ico" aria-hidden="true">
        <OrderIcon name={tile.icon} size={20} />
      </span>
      <div className="odm-or-svc-tile-text">
        <dt>{tile.label}</dt>
        <dd>{tile.value}</dd>
      </div>
      {copyText ? (
        <button
          type="button"
          className="odm-or-svc-copy"
          aria-label={`${copyLabel}: ${tile.label}`}
          onClick={() => void navigator.clipboard?.writeText(copyText)}
        >
          <OrderIcon name="copy" size={15} />
        </button>
      ) : null}
    </div>
  )
}
