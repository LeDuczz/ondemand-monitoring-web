import { useEffect, useState } from 'react'

import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import {
  dashboardActivities,
  requestSteps,
  telemetryMetrics,
} from '../mock-data'

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
    </span>
  )
}

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="Fieldwise home">
      <BrandMark />
      <span>FIELDWISE</span>
    </a>
  )
}

function SectionIntro({
  eyebrow,
  title,
  copy,
  align = 'left',
}: {
  eyebrow: string
  title: string
  copy: string
  align?: 'left' | 'center'
}) {
  return (
    <div className={`section-intro section-intro--${align}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="section-copy">{copy}</p>
    </div>
  )
}

function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  return (
    <button
      className="icon-button"
      type="button"
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      onClick={() => setDark(!dark)}
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Logo />
        <nav
          className={`site-nav ${menuOpen ? 'site-nav--open' : ''}`}
          aria-label="Primary navigation"
        >
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#tracking" onClick={() => setMenuOpen(false)}>
            Tracking
          </a>
          <a href="#reports" onClick={() => setMenuOpen(false)}>
            Reports
          </a>
          <a href="#security" onClick={() => setMenuOpen(false)}>
            Safety
          </a>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <Button variant="secondary">Sign in</Button>
          <Button icon="arrow-up-right">Create a request</Button>
        </div>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? 'x' : 'menu'} />
        </button>
      </div>
    </header>
  )
}

function DashboardPreview() {
  return (
    <div
      className="dashboard-preview"
      aria-label="Mock customer dashboard showing request tracking and report status"
    >
      <div className="dashboard-header">
        <div>
          <span className="dashboard-kicker">CUSTOMER DASHBOARD</span>
          <h3>Good morning, Alex</h3>
        </div>
        <span className="workspace-pill">
          Northstar Energy <Icon name="chevron-down" />
        </span>
      </div>
      <div className="dashboard-tabs">
        <span className="active">Overview</span>
        <span>
          Requests <b>12</b>
        </span>
        <span>
          Reports <b>08</b>
        </span>
      </div>
      <div className="dashboard-stats">
        {telemetryMetrics.map((metric) => (
          <div className="dashboard-stat" key={metric.label}>
            <span>{metric.label}</span>
            <strong>
              {metric.value}
              <small>{metric.unit}</small>
            </strong>
            <em>{metric.trend}</em>
          </div>
        ))}
      </div>
      <div className="dashboard-body">
        <div className="request-card">
          <div className="card-heading">
            <span>Active request</span>
            <span className="status-badge status-badge--blue">In progress</span>
          </div>
          <h4>Cooling tower B · thermal inspection</h4>
          <p>Ticket #MON-2481 · East site</p>
          <div className="progress-track">
            <span />
          </div>
          <div className="request-meta">
            <span>Inspection scheduled</span>
            <strong>65% complete</strong>
          </div>
        </div>
        <div className="activity-card">
          <div className="card-heading">
            <span>Recent activity</span>
            <Icon name="arrow-up-right" />
          </div>
          {dashboardActivities.map((activity) => (
            <div className="activity-item" key={activity.label}>
              <span
                className={`activity-icon activity-icon--${activity.status}`}
              >
                <Icon name={activity.icon} />
              </span>
              <span>
                <strong>{activity.label}</strong>
                <small>{activity.detail}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="dashboard-footer">
        <span>
          <span className="live-dot" /> Service team online
        </span>
        <span>Updated just now</span>
      </div>
    </div>
  )
}

function RequestFormPreview() {
  return (
    <div className="request-form-preview">
      <div className="form-window-top">
        <span className="window-dots">
          <i />
          <i />
          <i />
        </span>
        <span>New monitoring request</span>
        <Icon name="x" />
      </div>
      <div className="form-window-body">
        <span className="form-kicker">STEP 1 OF 3</span>
        <h3>What would you like us to inspect?</h3>
        <label>
          Request type
          <span className="fake-input">
            Thermal inspection <Icon name="chevron-down" />
          </span>
        </label>
        <label>
          Site or asset
          <span className="fake-input">
            East site · Cooling tower B <Icon name="chevron-down" />
          </span>
        </label>
        <div className="form-row">
          <label>
            Priority
            <span className="fake-input">
              Standard <Icon name="chevron-down" />
            </span>
          </label>
          <label>
            Preferred date
            <span className="fake-input">
              24 Sep 2026 <Icon name="clock" />
            </span>
          </label>
        </div>
        <Button icon="arrow-right">Continue request</Button>
      </div>
    </div>
  )
}

function TicketPreview() {
  return (
    <div className="ticket-preview">
      <div className="ticket-head">
        <div>
          <span className="dashboard-kicker">TICKET #MON-2481</span>
          <h3>Cooling tower B · thermal inspection</h3>
        </div>
        <span className="status-badge status-badge--blue">In progress</span>
      </div>
      <div className="ticket-line">
        <div className="ticket-node ticket-node--done">
          <Icon name="check" />
        </div>
        <div className="ticket-copy">
          <strong>Request reviewed and assigned</strong>
          <small>
            Our operations team confirmed the scope and scheduled the
            inspection.
          </small>
          <span>Today, 08:42</span>
        </div>
      </div>
      <div className="ticket-line">
        <div className="ticket-node ticket-node--active">
          <Icon name="radio" />
        </div>
        <div className="ticket-copy">
          <strong>Remote inspection in progress</strong>
          <small>Specialist is collecting thermal evidence at East site.</small>
          <span>Today, 09:30 · Current step</span>
        </div>
      </div>
      <div className="ticket-line ticket-line--pending">
        <div className="ticket-node">
          <Icon name="file-text" />
        </div>
        <div className="ticket-copy">
          <strong>Results and report delivered</strong>
          <small>
            Findings will appear here when the inspection is complete.
          </small>
        </div>
      </div>
      <div className="ticket-footer">
        <span>
          <Icon name="users" /> Assigned service team
        </span>
        <span>
          <Icon name="clock" /> Est. completion 14:00
        </span>
      </div>
    </div>
  )
}

function ReportPreview() {
  return (
    <div className="report-preview">
      <div className="report-cover">
        <div className="report-brand">
          <BrandMark />
          <span>FIELDWISE REPORT</span>
        </div>
        <span className="report-label">INSPECTION RESULT</span>
        <h3>
          East site
          <br />
          <strong>Cooling tower B</strong>
        </h3>
        <div className="report-cover-bottom">
          <span>24 September 2026</span>
          <span>Report #RPT-1048</span>
        </div>
      </div>
      <div className="report-summary">
        <div className="summary-head">
          <span>Executive summary</span>
          <span className="status-badge status-badge--green">
            No critical findings
          </span>
        </div>
        <p>
          Thermal scan completed across 18 inspection points. One area requires
          planned maintenance within 30 days.
        </p>
        <div className="summary-grid">
          <div>
            <strong>18</strong>
            <span>Points inspected</span>
          </div>
          <div>
            <strong>01</strong>
            <span>Action to plan</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>Evidence attached</span>
          </div>
        </div>
        <div className="evidence-row">
          <span>
            <Icon name="camera" /> 18 images
          </span>
          <span>
            <Icon name="chart" /> Thermal data
          </span>
          <span>
            <Icon name="file-text" /> PDF report
          </span>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div id="top" className="landing-page">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <section className="hero section-pad">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Remote inspection, made customer-first</p>
              <h1>
                Get the insight.
                <br />
                <span>Skip the risk.</span>
              </h1>
              <p className="hero-lede">
                Fieldwise helps enterprise teams request monitoring, track every
                step, and receive clear inspection results—without sending
                people into dangerous or hard-to-reach places.
              </p>
              <div className="hero-actions">
                <Button icon="arrow-up-right">
                  Create a monitoring request
                </Button>
                <a className="text-link" href="#how-it-works">
                  See how it works <Icon name="arrow-right" />
                </a>
              </div>
              <div className="hero-proof">
                <span className="proof-mark">
                  <Icon name="shield" />
                </span>
                <span>
                  Safer operations · Faster decisions · Full transparency
                </span>
              </div>
            </div>
            <DashboardPreview />
          </div>
          <div className="container hero-foot">
            <span>Customer-led inspection services</span>
            <div className="hero-line" />
            <span className="mono">REQUEST / TRACK / ACT</span>
          </div>
        </section>
        <section className="value-strip">
          <div className="container value-grid">
            <div>
              <p className="eyebrow">A better way to inspect</p>
              <h2>
                Put the request
                <br />
                at the center.
              </h2>
            </div>
            <p className="value-copy">
              You bring the operational question. Fieldwise coordinates the
              technical work behind it, then gives your team one clear place to
              follow progress, review evidence, and decide what happens next.
            </p>
            <div className="value-stat">
              <strong>2.4×</strong>
              <span>
                faster turnaround
                <br />
                from request to result
              </span>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="request-section section-pad">
          <div className="container request-grid">
            <RequestFormPreview />
            <div className="request-copy">
              <p className="eyebrow">Start with what you need to know</p>
              <h2>
                Create a request.
                <br />
                <span>We handle the complexity.</span>
              </h2>
              <p className="section-copy">
                Submit a monitoring or inspection request in a few simple steps.
                Describe the asset, the concern, and the outcome you need. Our
                service team takes it from there.
              </p>
              <div className="check-list">
                <span>
                  <Icon name="check" /> No drone operation or technical setup
                  required
                </span>
                <span>
                  <Icon name="check" /> Scope, timing, and access coordinated
                  for you
                </span>
                <span>
                  <Icon name="check" /> One request, one accountable service
                  team
                </span>
              </div>
              <a className="text-link" href="#workflow">
                Learn about the request process <Icon name="arrow-right" />
              </a>
            </div>
          </div>
        </section>
        <section id="workflow" className="workflow section-pad">
          <div className="container">
            <SectionIntro
              eyebrow="A transparent service workflow"
              title="Know what is happening at every step."
              copy="From your first request to the final report, every handoff is visible and every next step has an owner."
              align="center"
            />
            <div className="workflow-grid">
              {requestSteps.map((step, index) => (
                <div className="workflow-card" key={step.label}>
                  <div className="workflow-card-top">
                    <span>0{index + 1}</span>
                    <Icon name={step.icon} />
                  </div>
                  <h3>{step.label}</h3>
                  <p>{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="tracking" className="tracking section-pad">
          <div className="container tracking-grid">
            <div className="tracking-copy">
              <p className="eyebrow">Ticket-based progress tracking</p>
              <h2>
                No black boxes.
                <br />
                <span>No status chasing.</span>
              </h2>
              <p className="section-copy">
                Each request becomes a ticket your team can follow. See what has
                been completed, what is happening now, and when to expect your
                result—all in one shared view.
              </p>
              <div className="ticket-highlights">
                <span>
                  <Icon name="ticket" />
                  <strong>One source of truth</strong>
                  <small>Keep the request, updates, and owner together.</small>
                </span>
                <span>
                  <Icon name="clock" />
                  <strong>Clear expectations</strong>
                  <small>See timing and progress without extra calls.</small>
                </span>
              </div>
            </div>
            <TicketPreview />
          </div>
        </section>
        <section id="reports" className="reports section-pad">
          <div className="container reports-grid">
            <ReportPreview />
            <div className="reports-copy">
              <p className="eyebrow">Evidence you can use</p>
              <h2>
                Results that move
                <br />
                <span>work forward.</span>
              </h2>
              <p className="section-copy">
                When the inspection is complete, your team receives a concise
                result summary with evidence, findings, and recommended next
                steps—not a folder of files to interpret alone.
              </p>
              <div className="result-list">
                <span>
                  <Icon name="file-text" />
                  <strong>Review the executive summary</strong>
                </span>
                <span>
                  <Icon name="camera" />
                  <strong>Open supporting evidence</strong>
                </span>
                <span>
                  <Icon name="chart" />
                  <strong>Share and act on the findings</strong>
                </span>
              </div>
              <a className="text-link" href="#contact">
                See what a report includes <Icon name="arrow-right" />
              </a>
            </div>
          </div>
        </section>
        <section id="security" className="security section-pad">
          <div className="container security-panel">
            <div className="security-copy">
              <p className="eyebrow">The value for your operation</p>
              <h2>
                Safer work.
                <br />
                Faster answers.
              </h2>
              <p className="section-copy">
                Fieldwise keeps people out of avoidable risk and gives
                decision-makers the evidence they need while the situation is
                still actionable.
              </p>
              <Button variant="secondary" icon="arrow-right">
                Talk to our team
              </Button>
            </div>
            <div className="benefit-grid">
              <div>
                <Icon name="shield" />
                <strong>Reduce exposure</strong>
                <p>
                  Use remote inspection for hazardous, elevated, or
                  difficult-to-access areas.
                </p>
              </div>
              <div>
                <Icon name="clock" />
                <strong>Shorten turnaround</strong>
                <p>
                  Move from request to useful findings without coordinating
                  every technical detail.
                </p>
              </div>
              <div>
                <Icon name="chart" />
                <strong>Decide with confidence</strong>
                <p>
                  Give operations and maintenance teams a shared view of
                  evidence and next steps.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="cta section-pad" id="contact">
          <div className="container cta-inner">
            <p className="eyebrow">Ready when you are</p>
            <h2>
              Make your next inspection
              <br />
              <span>a clearer decision.</span>
            </h2>
            <p>
              Create a request and let our service team take care of the
              operational details.
            </p>
            <Button icon="arrow-up-right">Create a monitoring request</Button>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <Logo />
          <p>Customer-first monitoring and inspection services.</p>
          <div className="footer-links">
            <a href="#how-it-works">How it works</a>
            <a href="#tracking">Tracking</a>
            <a href="#reports">Reports</a>
            <a href="#security">Safety</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 Fieldwise Systems</span>
          <span>Built for safer, faster decisions.</span>
        </div>
      </footer>
    </div>
  )
}
