import type { CSSProperties, ReactNode } from 'react'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { useI18n } from '../../../../../shared/i18n'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { statusLabel } from '../dashboardHelpers'

const COLORS = ['var(--blue-solid)', 'var(--green-solid)', 'var(--yellow-solid)', 'var(--orange-solid)', 'var(--red-solid)', 'var(--gray-solid)']

function dateLabel(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T00:00:00`)) }
export function AnalyticsCharts({ data }: { data: ManagerDashboardData }) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const c = t.charts
  const label = (key: string) => c.statusLabels[key] ?? statusLabel(key)
  const pipeline = data.pricingPipeline
  const adjustment = data.priceAdjustmentSummary
  return <div className="odm-mgr-analytics">
    <div className="odm-mgr-chart-grid">
      <ChartCard title={c.orderStatusTitle} subtitle={c.orderStatusSubtitle}>
        <DonutChart points={data.orderStatusDistribution.map(p => ({ label: label(p.key), value: p.count }))} empty={c.orderStatusEmpty} />
      </ChartCard>
      <ChartCard title={c.servicesTitle} subtitle={c.servicesSubtitle}>
        <BarChart points={data.serviceDistribution.map(p => ({ label: p.serviceName, value: p.count }))} empty={c.servicesEmpty} />
      </ChartCard>
    </div>

    <div className="odm-mgr-chart-grid">
      <ChartCard title={c.additionalTitle} subtitle={c.additionalSubtitle}>
        <DonutChart points={data.additionalServiceDistribution.map(p => ({ label: label(p.key), value: p.count }))} empty={c.additionalEmpty} />
        {(adjustment.approvedAtSystemPrice + adjustment.adjustedByManager) > 0 && <div className="odm-mgr-adjustment-note">
          <strong>{Math.round(adjustment.adjustedByManager * 100 / (adjustment.approvedAtSystemPrice + adjustment.adjustedByManager))}%</strong>
          <span>{c.adjustmentNote}</span>
        </div>}
      </ChartCard>
      <ChartCard title={c.pipelineTitle} subtitle={c.pipelineSubtitle}>
        <BarChart points={[
          { label: c.pipelineReview, value: pipeline.pricingReviewCount },
          { label: c.pipelineQuoteReady, value: pipeline.quoteReadyCount },
          { label: c.pipelineWaitingCustomer, value: pipeline.waitingCustomerCount },
          { label: c.pipelineWaitingDeposit, value: pipeline.waitingDepositCount },
          { label: c.pipelineDepositPaid, value: pipeline.depositPaidCount },
        ]} empty={c.pipelineEmpty} />
      </ChartCard>
    </div>

    <div className="odm-mgr-chart-grid">
      <ChartCard title={c.missionStatusTitle} subtitle={c.missionStatusSubtitle}>
        <DonutChart points={data.missionStatusDistribution.map(p => ({ label: label(p.key), value: p.count }))} empty={c.missionStatusEmpty} />
      </ChartCard>
      <ChartCard title={c.trendTitle} subtitle={c.trendSubtitle}>
        <LineChart points={data.missionTrend.map(p => ({ x: p.periodStart, primary: p.completed, secondary: p.failed }))} primaryLabel={c.trendCompleted} secondaryLabel={c.trendFailed} valueFormat={String} empty={c.trendEmpty} locale={locale} overTime={c.overTime} />
      </ChartCard>
    </div>
  </div>
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <section className="odm-card odm-mgr-chart-card"><header><div><h2>{title}</h2><p>{subtitle}</p></div></header>{children}</section>
}

type LinePoint = { x: string; primary: number; secondary?: number }
function LineChart({ points, primaryLabel, secondaryLabel, valueFormat, empty, locale, overTime }: {
  points: LinePoint[]; primaryLabel: string; secondaryLabel?: string; valueFormat: (v: number) => string; empty: string; locale: string; overTime: (label: string) => string
}) {
  if (!points.length) return <Empty text={empty} />
  const width = 760, height = 230, left = 48, right = 18, top = 18, bottom = 38
  const max = Math.max(1, ...points.flatMap(p => [p.primary, p.secondary ?? 0]))
  const x = (i: number) => left + (points.length === 1 ? (width-left-right)/2 : i * (width-left-right)/(points.length-1))
  const y = (v: number) => top + (height-top-bottom) * (1-v/max)
  const path = (pick: (p: LinePoint) => number) => points.map((p,i) => `${i ? 'L':'M'}${x(i)},${y(pick(p))}`).join(' ')
  return <div className="odm-mgr-line-chart">
    <div className="odm-mgr-chart-legend"><span><i className="is-primary" />{primaryLabel}</span>{secondaryLabel && <span><i className="is-secondary" />{secondaryLabel}</span>}</div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={overTime(primaryLabel)}>
      {[0,.25,.5,.75,1].map(t => <g key={t}><line x1={left} x2={width-right} y1={y(max*t)} y2={y(max*t)} className="grid"/><text x={left-8} y={y(max*t)+4} textAnchor="end">{valueFormat(max*t)}</text></g>)}
      <path d={path(p=>p.primary)} className="line primary" />
      {secondaryLabel && <path d={path(p=>p.secondary ?? 0)} className="line secondary" />}
      {points.map((p,i) => <g key={p.x}>
        <circle cx={x(i)} cy={y(p.primary)} r="5" className="point primary"><title>{`${dateLabel(p.x, locale)} · ${primaryLabel}: ${valueFormat(p.primary)}${secondaryLabel ? ` · ${secondaryLabel}: ${valueFormat(p.secondary ?? 0)}` : ''}`}</title></circle>
        {secondaryLabel && <circle cx={x(i)} cy={y(p.secondary ?? 0)} r="4" className="point secondary"><title>{`${dateLabel(p.x, locale)} · ${secondaryLabel}: ${valueFormat(p.secondary ?? 0)}`}</title></circle>}
        {(i === 0 || i === points.length-1 || i % Math.ceil(points.length/6) === 0) && <text x={x(i)} y={height-12} textAnchor="middle">{dateLabel(p.x, locale)}</text>}
      </g>)}
    </svg>
  </div>
}

function DonutChart({ points, empty }: { points: {label:string;value:number}[]; empty:string }) {
  const { t } = useI18n(dashboardPageMessages)
  const filtered = points.filter(p=>p.value > 0), total = filtered.reduce((s,p)=>s+p.value,0)
  if (!total) return <Empty text={empty}/>
  let offset = 0
  return <div className="odm-mgr-donut-layout"><svg viewBox="0 0 180 180" role="img" aria-label={t.charts.totalAria(total)}>
    <circle cx="90" cy="90" r="62" className="track" />
    {filtered.map((p,i) => { const length=p.value/total*389.56; const current=offset; offset+=length; return <circle key={p.label} cx="90" cy="90" r="62" className="segment" style={{'--chart-color':COLORS[i%COLORS.length], strokeDasharray:`${length} ${389.56-length}`, strokeDashoffset:-current} as CSSProperties}><title>{`${p.label}: ${p.value} (${Math.round(p.value*100/total)}%)`}</title></circle> })}
    <text x="90" y="87" textAnchor="middle" className="total">{total}</text><text x="90" y="106" textAnchor="middle">{t.charts.total}</text>
  </svg><div className="odm-mgr-donut-items">{filtered.map((p,i)=><div key={p.label}><i style={{background:COLORS[i%COLORS.length]}}/><span>{p.label}</span><strong>{p.value}</strong></div>)}</div></div>
}

function BarChart({ points, empty }: { points:{label:string;value:number}[]; empty:string }) {
  const { t } = useI18n(dashboardPageMessages)
  const max = Math.max(0,...points.map(p=>p.value)); if (!max) return <Empty text={empty}/>
  return <div className="odm-mgr-bars" role="img" aria-label={t.charts.barAria}>{points.map(p=><div className="odm-mgr-bar" key={p.label}><div><span>{p.label}</span><strong>{p.value}</strong></div><div className="track"><span style={{width:`${p.value/max*100}%`}} title={`${p.label}: ${p.value}`} /></div></div>)}</div>
}

function Empty({text}:{text:string}) { return <div className="odm-mgr-chart-empty">{text}</div> }
