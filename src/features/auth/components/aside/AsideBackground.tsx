/**
 * Decorative background layers for the animated aside scene: navy→brand-blue
 * gradient, drifting "aurora" blobs, a faint perspective map grid that pans
 * slowly and fades in toward the bottom of the scene, and a handful of
 * twinkling particles. Pure CSS animation (see auth-aside.css) — no JS.
 */
const PARTICLES = [
  { left: '12%', top: '18%', delay: '0s', duration: '3.4s' },
  { left: '28%', top: '62%', delay: '0.6s', duration: '4.1s' },
  { left: '52%', top: '22%', delay: '1.2s', duration: '3.8s' },
  { left: '72%', top: '48%', delay: '0.3s', duration: '4.6s' },
  { left: '85%', top: '20%', delay: '1.8s', duration: '3.2s' },
  { left: '38%', top: '78%', delay: '2.1s', duration: '4.3s' },
]

export function AsideBackground() {
  return (
    <div className="odm-aside-bg" aria-hidden="true">
      <div className="odm-aside-gradient" />
      <div className="odm-aside-aurora odm-aside-aurora--a" />
      <div className="odm-aside-aurora odm-aside-aurora--b" />
      <div className="odm-aside-aurora odm-aside-aurora--c" />
      <div className="odm-aside-grid" />
      <div className="odm-aside-particles">
        {PARTICLES.map((particle, index) => (
          <span
            key={index}
            className="odm-aside-particle"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>
    </div>
  )
}
