import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../../auth/api/authApi'
import { Icon, type IconName } from '../../../shared/components/Icon'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import {
  aiVerdictTone,
  findingSeverityTone,
  missionStatusTone,
} from '../../../shared/lib/statusTone'
import type { StatusTone } from '../../../shared/types/domain'
import * as content from '../content'
import { resolveCreateRequestTarget } from '../resolveCreateRequestTarget'
import type { FeasibilityCheck } from '../types'
import '../landing.css'

function BrandMark() {
  return (
    <span className="lp-brand-mark" aria-hidden="true">
      <Icon name="cpu" />
    </span>
  )
}

function Logo() {
  return (
    <a
      className="lp-logo"
      href="#top"
      aria-label={`${content.brandName} - trang chủ`}
    >
      <BrandMark />
      <span>{content.brandName}</span>
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

function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  return (
    <div className="lp-theme-toggle">
      <span>Giao diện</span>
      <button
        className="lp-theme-toggle-btn"
        type="button"
        aria-label={`Đổi sang giao diện ${dark ? 'sáng' : 'tối'}`}
        onClick={() => setDark((value) => !value)}
      >
        <Icon name={dark ? 'sun' : 'moon'} />
      </button>
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
            <a className="odm-btn odm-btn-gh odm-btn-lg" href="#auth/login">
              Đăng nhập
            </a>
            <a
              className="odm-btn odm-btn-p odm-btn-lg"
              href={createRequestTarget}
            >
              Tạo yêu cầu
            </a>
          </div>
        </nav>
        <div className="lp-header-actions">
          <ThemeToggle />
          <a
            className="odm-btn odm-btn-gh odm-btn-lg lp-header-actions-login"
            href="#auth/login"
          >
            Đăng nhập
          </a>
          <a
            className="odm-btn odm-btn-p odm-btn-lg lp-header-actions-cta"
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
    <div
      className="lp-hero-art"
      role="img"
      aria-label="Minh hoạ bản đồ giám sát với thẻ AI kiểm tra khả thi và thẻ mission đang bay"
    >
      <svg viewBox="0 0 480 400" className="lp-hero-map" aria-hidden="true">
        <rect width="480" height="400" rx="20" fill="var(--map-bg)" />
        <rect
          x="36"
          y="36"
          width="110"
          height="84"
          rx="8"
          fill="var(--map-block)"
        />
        <rect
          x="190"
          y="76"
          width="84"
          height="130"
          rx="8"
          fill="var(--map-block)"
        />
        <rect
          x="310"
          y="28"
          width="140"
          height="64"
          rx="8"
          fill="var(--map-block)"
        />
        <rect x="0" y="206" width="480" height="16" fill="var(--map-road)" />
        <rect x="0" y="211" width="480" height="2" fill="var(--map-road2)" />
        <circle cx="336" cy="284" r="66" fill="var(--map-water)" />
        <circle cx="112" cy="300" r="46" fill="var(--map-park)" />
        <circle cx="280" cy="168" r="6" fill="var(--blue-solid)" />
        <circle
          cx="280"
          cy="168"
          r="15"
          fill="none"
          stroke="var(--blue-solid)"
          strokeWidth="2"
          opacity="0.45"
        />
      </svg>
      <div className="odm-card lp-ai-card">
        <div className="lp-ai-card-top">
          <span className="lp-ai-card-score">{heroAiCard.score}</span>
          <StatusBadge tone="green">PASS</StatusBadge>
        </div>
        <div className="lp-ai-card-body">
          <strong>{heroAiCard.label}</strong>
          <span>{heroAiCard.status}</span>
        </div>
      </div>
      <div className="odm-card lp-mission-card">
        <div className="lp-mission-card-top">
          <span className="odm-mono">{heroMissionCard.code}</span>
          <StatusBadge tone={missionStatusTone.IN_FLIGHT}>
            {heroMissionCard.status}
          </StatusBadge>
        </div>
        <p>{heroMissionCard.title}</p>
        <div className="lp-mission-card-meta">
          <span className="odm-mono">{heroMissionCard.drone}</span>
          <span>{heroMissionCard.battery}</span>
          <span>{heroMissionCard.altitude}</span>
        </div>
      </div>
    </div>
  )
}

function FeatureList({
  items,
}: {
  items: { title: string; detail: string; icon: IconName }[]
}) {
  return (
    <ul className="lp-feature-list">
      {items.map((item) => (
        <li key={item.title}>
          <span className="lp-feature-list-icon" aria-hidden="true">
            <Icon name={item.icon} />
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
        <div className="lp-panel-verdict">
          <strong>{aiResultPanel.verdictTitle}</strong>
          <p>{aiResultPanel.verdictDetail}</p>
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
          <button className="odm-btn odm-btn-p odm-btn-sm" type="button">
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
        <ul className="lp-results-list">
          {liveResultFiles.map((file) => (
            <li key={file.name}>
              <span className="odm-mono">{file.name}</span>
              <StatusBadge tone={file.status === 'PASS' ? 'green' : 'yellow'}>
                {file.status}
              </StatusBadge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function FaqAccordion() {
  // Only the design's first FAQ item has answer copy (see content.ts / the
  // FaqItem.answer doc comment in ../types); the other four are shown as
  // static rows instead of accordion buttons that would expand into an
  // empty panel. Once the team supplies answers for them, adding `answer`
  // in content.ts is enough to turn them into accordion items too.
  const firstExpandableIndex = content.faqItems.findIndex((item) => item.answer)
  const [openIndex, setOpenIndex] = useState<number | null>(
    firstExpandableIndex,
  )

  return (
    <div className="lp-faq-list">
      {content.faqItems.map((item, index) => {
        if (!item.answer) {
          return (
            <div
              className="lp-faq-item lp-faq-item--static"
              key={item.question}
            >
              <span className="lp-faq-question lp-faq-question--static">
                {item.question}
              </span>
            </div>
          )
        }

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
              <span className="lp-chip">
                <Icon name="sparkle" />
                {content.heroChip}
              </span>
              <h1>
                {content.heroTitleLines[0]}
                <br />
                <span>{content.heroTitleLines[1]}</span>
              </h1>
              <p className="lp-hero-lede">{content.heroLede}</p>
              <ul className="lp-hero-checklist">
                {content.heroChecklist.map((item) => (
                  <li key={item}>
                    <Icon name="check" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="lp-hero-actions">
                <a
                  className="odm-btn odm-btn-p odm-btn-xl"
                  href={createRequestTarget}
                >
                  Tạo yêu cầu giám sát
                </a>
                <a className="odm-btn odm-btn-gh odm-btn-xl" href="#auth/login">
                  Đăng nhập
                </a>
              </div>
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
                    <Icon name={step.icon} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="lp-section">
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

        <section id="industries" className="lp-section">
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
                  <span className="lp-industry-icon" aria-hidden="true">
                    <Icon name={card.icon} />
                  </span>
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
            <SectionIntro
              eyebrow={content.faqSection.eyebrow}
              title={content.faqSection.title}
              copy={content.faqSection.copy}
              align="center"
            />
            <FaqAccordion />
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-container lp-cta-inner">
            <p className="lp-eyebrow">{content.ctaSection.eyebrow}</p>
            <h2>{content.ctaSection.title}</h2>
            <div className="lp-cta-actions">
              <a
                className="odm-btn odm-btn-p odm-btn-xl"
                href={createRequestTarget}
              >
                Tạo yêu cầu giám sát
              </a>
              <a className="odm-btn odm-btn-gh odm-btn-xl" href="#auth/login">
                Đăng nhập
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand">
            <Logo />
            <p>{content.footerTagline}</p>
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
    </div>
  )
}
