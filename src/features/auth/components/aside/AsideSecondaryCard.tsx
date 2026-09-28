/**
 * Smaller glass photo card overlapping the hero card's bottom-right
 * corner: the thermal-scan grid crop, same glass styling as the hero but
 * on an offset float timing so the two never move in sync, plus a small
 * pulsing radar-ring badge at its top-left corner. Purely decorative.
 */
export function AsideSecondaryCard() {
  return (
    <div className="odm-aside-secondary" aria-hidden="true">
      <span className="odm-aside-secondary-radar" />
      <div className="odm-aside-secondary-frame">
        <img
          src="/images/auth-hero-scan.png"
          alt=""
          className="odm-aside-secondary-img"
        />
      </div>
    </div>
  )
}
