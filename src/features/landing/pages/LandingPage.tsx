import { useState, type ReactNode } from 'react'

import { authSession } from '../../auth/api/authApi'
import { Icon, type IconName } from '../../../shared/components/Icon'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import {
  aiVerdictTone,
  findingSeverityTone,
} from '../../../shared/lib/statusTone'
import type { StatusTone } from '../../../shared/types/domain'
import * as content from '../content'
import { HeroMap, LiveMap } from '../components/LeafletMap'
import { resolveCreateRequestTarget } from '../resolveCreateRequestTarget'
import { ChatbotWidget } from '../components/ChatbotWidget'
import type { FeasibilityCheck } from '../types'
import '../landing.css'

function Logo() {
  return (
    <a
      className="lp-logo"
      href="#top"
      aria-label={`${content.brandName} - trang chủ`}
    >
      <img
        src="/images/logo-new.png"
        alt={content.brandName}
        className="lp-logo-img"
      />
      <span className="lp-logo-text">
        <span className="lp-logo-primary">OnDemand</span>
        <span className="lp-logo-accent">Monitor</span>
      </span>
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
  copy?: string
  align?: 'left' | 'center'
}) {
  return (
    <div className={`lp-section-intro lp-section-intro--${align}`}>
      <p className="lp-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {copy ? <p className="lp-section-copy">{copy}</p> : null}
    </div>
  )
}

function Header({ createRequestTarget }: { createRequestTarget: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="lp-header">
      <div className="lp-container lp-header-inner">
        <Logo />
        <nav
          className={`lp-nav ${menuOpen ? 'lp-nav--open' : ''}`}
          aria-label="Điều hướng chính"
        >
          {content.navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="lp-nav-actions">
            <a className="lp-btn-o" href="#auth/login">
              Đăng nhập
            </a>
            <a className="lp-btn-p" href={createRequestTarget}>
              Tạo yêu cầu
            </a>
          </div>
        </nav>
        <span className="lp-spacer" />
        <div className="lp-header-actions">
          <a
            className="lp-btn-o lp-header-actions-login"
            href="#auth/login"
          >
            Đăng nhập
          </a>
          <a
            className="lp-btn-p lp-header-actions-cta"
            href={createRequestTarget}
          >
            Tạo yêu cầu
          </a>
        </div>
        <button
          className="lp-menu-btn"
          type="button"
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <Icon name={menuOpen ? 'x' : 'menu'} />
        </button>
      </div>
    </header>
  )
}

function HeroIllustration() {
  const { heroAiCard, heroMissionCard } = content
  return (
    <div className="lp-mapcard">
      <HeroMap id="lp-hero-map" />
      <div className="lp-float" style={{ left: 14, top: 14 }}>
        <div className="lp-score-wrap">
          <div
            className="lp-score-ring"
            style={{
              background: `conic-gradient(var(--lp-green, #1FA971) 92%, #DDEBE4 0)`,
            }}
          >
            <span className="lp-score-ring-inner">{heroAiCard.score}</span>
          </div>
          <div>
            <small style={{ color: 'var(--lp-mute)' }}>{heroAiCard.label}</small>
            <br />
            <b>{heroAiCard.status}</b>{' '}
            <span className="lp-pill lp-pill-g">PASS</span>
          </div>
        </div>
      </div>
      <div className="lp-float" style={{ left: 14, right: 14, bottom: 14 }}>
        <span className="lp-pill lp-pill-b">IN_FLIGHT</span>{' '}
        <b style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {heroMissionCard.code}
        </b>
        <br />
        {heroMissionCard.title}{' '}
        <span style={{ float: 'right', color: 'var(--lp-mute)' }}>
          {heroMissionCard.drone} · Pin {heroMissionCard.battery} ·{' '}
          {heroMissionCard.altitude}
        </span>
      </div>
    </div>
  )
}

function FeatureList({
  items,
}: {
  items: { title: string; detail: string; icon: IconName; emoji?: string }[]
}) {
  return (
    <ul className="lp-feature-list">
      {items.map((item) => (
        <li key={item.title}>
          <span className="lp-feature-list-icon" aria-hidden="true">
            {item.emoji || <Icon name={item.icon} />}
          </span>
          <span>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </span>
        </li>
      ))}
    </ul>
  )
}

const checkTone: Record<FeasibilityCheck['result'], StatusTone> = {
  PASS: 'green',
  WARNING: findingSeverityTone.WARNING,
  BLOCKER: findingSeverityTone.BLOCKER,
}

function AiResultPanel() {
  const { aiResultPanel, aiFeasibilityChecks } = content
  return (
    <div className="odm-card lp-panel">
      <div className="odm-card-header">
        <span>{aiResultPanel.title}</span>
        <StatusBadge tone={aiVerdictTone.RISKY}>
          {aiResultPanel.verdictLabel} {aiResultPanel.score}
        </StatusBadge>
      </div>
      <div className="odm-card-body lp-panel-body">
        <div
          className="lp-score-ring-wrap"
          style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}
        >
          <div
            className="lp-score-ring"
            style={{
              background: `conic-gradient(var(--lp-amber) ${aiResultPanel.score}%, #F4E6C7 0)`,
            }}
          >
            <span className="lp-score-ring-inner">{aiResultPanel.score}</span>
          </div>
          <div>
            <strong>{aiResultPanel.verdictTitle}</strong>
            <br />
            <small style={{ color: 'var(--lp-mute)' }}>
              {aiResultPanel.verdictDetail}
            </small>
          </div>
        </div>
        <ul className="lp-check-list">
          {aiFeasibilityChecks.map((check) => (
            <li key={check.label}>
              <span>{check.label}</span>
              <StatusBadge tone={checkTone[check.result]}>
                {check.result}
              </StatusBadge>
            </li>
          ))}
        </ul>
        <div className="lp-alt-suggestion">
          <div>
            <span>Gợi ý ngày thay thế</span>
            <strong>{aiResultPanel.altSuggestion}</strong>
          </div>
          <button className="lp-btn-p" type="button">
            Chọn
          </button>
        </div>
      </div>
    </div>
  )
}

function LivePanel() {
  const { livePanel, liveResultFiles } = content
  return (
    <div className="odm-card lp-panel">
      <div className="odm-card-header">
        <span>{livePanel.title}</span>
        <StatusBadge tone="green">{livePanel.status}</StatusBadge>
      </div>
      <div className="odm-card-body lp-panel-body">
        <LiveMap id="lp-live-map" />
        <div className="lp-live-meta">
          <span>
            <Icon name="activity" /> {livePanel.battery}
          </span>
          <span>
            <Icon name="chart" /> {livePanel.altitude}
          </span>
        </div>
        <div className="lp-live-results-head">
          <strong>{livePanel.resultsTitle}</strong>
          <span className="odm-mono">{livePanel.fileCount}</span>
        </div>
        <div className="lp-file-cards">
          {liveResultFiles.map((file) => (
            <div className="lp-file-card" key={file.name}>
              <div style={{ fontSize: 22 }}>
                {file.name.startsWith('VID') ? '🎬' : '🖼️'}
              </div>
              <div>{file.name}</div>
              <span
                className={`lp-pill lp-pill-${file.status === 'PASS' ? 'g' : 'b'}`}
              >
                {file.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="lp-faq-list">
      {content.faqItems.map((item, index) => {
        const open = openIndex === index
        const buttonId = `lp-faq-button-${index}`
        const panelId = `lp-faq-panel-${index}`
        return (
          <div className="lp-faq-item" key={item.question}>
            <h3 className="lp-faq-question-wrap">
              <button
                id={buttonId}
                className="lp-faq-question"
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span>{item.question}</span>
                <Icon name={open ? 'minus' : 'plus'} />
              </button>
            </h3>
            {open ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="lp-faq-answer"
              >
                {item.answer}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function TwoColumnFeature({
  copy,
  panel,
  reverse,
}: {
  copy: ReactNode
  panel: ReactNode
  reverse?: boolean
}) {
  return (
    <div
      className={`lp-container lp-feature-grid${reverse ? ' lp-feature-grid--reverse' : ''}`}
    >
      {reverse ? (
        <>
          <div className="lp-feature-panel">{panel}</div>
          <div className="lp-feature-copy">{copy}</div>
        </>
      ) : (
        <>
          <div className="lp-feature-copy">{copy}</div>
          <div className="lp-feature-panel">{panel}</div>
        </>
      )}
    </div>
  )
}

export function LandingPage() {
  const createRequestTarget = resolveCreateRequestTarget(authSession.getUser())

  return (
    <div id="top" className="odm odm-landing">
      <a className="lp-skip-link" href="#main-content">
        Bỏ qua tới nội dung
      </a>
      <Header createRequestTarget={createRequestTarget} />
      <main id="main-content">
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-chip">{content.heroChip}</span>
              <h1>
                {content.heroTitleLines[0]}
                <br />
                <span>{content.heroTitleLines[1]}</span>
              </h1>
              <p className="lp-hero-lede">{content.heroLede}</p>
              <div className="lp-hero-actions">
                <a className="lp-btn-p" href={createRequestTarget}>
                  Tạo yêu cầu giám sát →
                </a>
                <a className="lp-btn-o" href="#auth/login">
                  Đăng nhập
                </a>
              </div>
              <ul className="lp-hero-checklist">
                {content.heroChecklist.map((item) => (
                  <li key={item}>
                    <Icon name="check" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <HeroIllustration />
          </div>
        </section>

        <section className="lp-stats">
          <div className="lp-container lp-stats-grid">
            {content.heroStats.map((stat) => (
              <div className="lp-stat" key={stat.label}>
                <strong className="odm-mono">{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="lp-section">
          <div className="lp-container">
            <SectionIntro
              eyebrow={content.workflowSection.eyebrow}
              title={content.workflowSection.title}
              align="center"
            />
            <div className="lp-workflow-grid">
              {content.workflowSteps.map((step) => (
                <div className="odm-card lp-workflow-card" key={step.no}>
                  <div className="lp-workflow-card-top">
                    <span className="odm-mono">{step.no}</span>
                    <div className="lp-step-icon">
                      {step.emoji || <Icon name={step.icon} />}
                    </div>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="lp-section lp-section-alt">
          <TwoColumnFeature
            copy={
              <>
                <SectionIntro
                  eyebrow={content.aiFeatureSection.eyebrow}
                  title={content.aiFeatureSection.title}
                  copy={content.aiFeatureSection.copy}
                />
                <FeatureList items={content.aiFeatureHighlights} />
              </>
            }
            panel={<AiResultPanel />}
          />
        </section>

        <section className="lp-section">
          <TwoColumnFeature
            reverse
            copy={
              <>
                <SectionIntro
                  eyebrow={content.liveFeatureSection.eyebrow}
                  title={content.liveFeatureSection.title}
                  copy={content.liveFeatureSection.copy}
                />
                <FeatureList items={content.liveFeatureHighlights} />
              </>
            }
            panel={<LivePanel />}
          />
        </section>

        <section id="industries" className="lp-section lp-section-alt">
          <div className="lp-container">
            <SectionIntro
              eyebrow={content.industriesSection.eyebrow}
              title={content.industriesSection.title}
              copy={content.industriesSection.copy}
              align="center"
            />
            <div className="lp-industries-grid">
              {content.industries.map((card) => (
                <div className="odm-card lp-industry-card" key={card.title}>
                  <div className="lp-step-icon" aria-hidden="true">
                    {card.emoji || <Icon name={card.icon} />}
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.detail}</p>
                  <span className="lp-industry-location">
                    <Icon name="map-pin" />
                    {card.location}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="lp-section">
          <div className="lp-container lp-faq">
            <div>
              <SectionIntro
                eyebrow={content.faqSection.eyebrow}
                title={content.faqSection.title}
                copy={content.faqSection.copy}
              />
            </div>
            <div>
              <FaqAccordion />
            </div>
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-container lp-cta-inner">
            <p className="lp-eyebrow">{content.ctaSection.eyebrow}</p>
            <h2>{content.ctaSection.title}</h2>
            <div className="lp-cta-actions">
              <a
                className="lp-btn-p"
                style={{ background: '#fff', color: 'var(--lp-blue)', borderColor: '#fff' }}
                href={createRequestTarget}
              >
                Tạo yêu cầu giám sát
              </a>
              <a
                className="lp-btn-o"
                style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.6)' }}
                href="#auth/login"
              >
                Đăng nhập
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo-wrap">
              <img
                src="/images/logo-new.png"
                alt="OnDemand Monitor"
                className="lp-footer-logo-img"
              />
            </div>
            <p>{content.footerBrandDescription}</p>
          </div>
          {content.footerLinkGroups.map((group) => (
            <div key={group.title}>
              <h4>{group.title}</h4>
              <ul>
                {group.links.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="lp-container lp-footer-bottom">
          <span>{content.footerCopyright}</span>
          <span>{content.footerLegal}</span>
        </div>
      </footer>
      <ChatbotWidget />
    </div>
  )
}
