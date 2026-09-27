/**
 * Big glass-framed photo card — the standout visual of the aside scene.
 * Shows a real drone photograph (cropped from the shared hero source
 * image), with a gradient border, layered shadow + outer glow, a slight
 * 3D tilt that reacts to the pointer-follow parallax vars, a gentle float,
 * and a diagonal shine sweep animated in from auth-aside.css. Purely
 * decorative — the photo carries no information beyond what the value-prop
 * chips already state as real text, so it is marked aria-hidden with an
 * empty alt.
 */
export function AsideHeroCard() {
  return (
    <div className="odm-aside-hero" aria-hidden="true">
      <div className="odm-aside-hero-frame">
        <img
          src="/images/auth-hero-drone.png"
          alt=""
          className="odm-aside-hero-img"
        />
        <span className="odm-aside-hero-shine" />
      </div>
    </div>
  )
}
