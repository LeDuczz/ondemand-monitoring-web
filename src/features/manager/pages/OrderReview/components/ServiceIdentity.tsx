import {
  type OrderIconName,
  OrderIcon,
} from '../../../components/common/OrderIcon'

export function ServiceIdentity({
  name,
  description,
  icon,
  eyebrow,
}: {
  name: string
  description: string | null
  icon: OrderIconName
  eyebrow: string
}) {
  return (
    <div className="odm-osb-identity">
      <span className="odm-osb-icon" aria-hidden="true">
        <OrderIcon name={icon} size={30} />
      </span>
      <div className="odm-osb-text">
        <span className="odm-osb-eyebrow">{eyebrow}</span>
        <h2 className="odm-osb-title">{name}</h2>
        {description ? <p className="odm-osb-desc">{description}</p> : null}
      </div>
    </div>
  )
}
