// MNG-12 · Báo cáo

import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { exportCsv } from '../lib/exportCsv'
import { reportsApi } from '../api/reportsApi'
import type { ReportSummary } from '../types/reports'
import '../manager.css'

// ── chart helpers ───────────────────────────────────────────────────────────

type LineChartProps = {
  data: { label: string; value: number }[]
  width: number
  height: number
  minVal?: number
  maxVal?: number
  color?: string
  yLabels?: string[]
  yValues?: number[]
  bottomPadding?: number
  ariaLabel?: string
}

/** Pure-SVG line chart — no external library. */
function LineChart({
  data,
  width,
  height,
  minVal,
  maxVal,
  color = 'var(--green-dot)',
  yLabels,
  yValues,
  bottomPadding = 16,
  ariaLabel,
}: LineChartProps) {
  const LEFT = 30
  const RIGHT = width - 8
  const TOP = 8
  const BOTTOM = height - bottomPadding

  const vals = data.map((d) => d.value)
  const lo = minVal ?? Math.min(...vals)
  const hi = maxVal ?? Math.max(...vals)
  const range = hi - lo || 1

  function px(v: number) {
    return BOTTOM - ((v - lo) / range) * (BOTTOM - TOP)
  }

  const points = data.map((d, i) => {
    const x = LEFT + (i / (data.length - 1)) * (RIGHT - LEFT)
    const y = px(d.value)
    return { x, y, label: d.label, value: d.value }
  })

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      {/* Y grid lines */}
      {(yValues ?? [hi]).map((yv, i) => {
        const y = px(yv)
        return (
          <g key={i}>
            <line x1={LEFT} x2={RIGHT} y1={y} y2={y} style={{ stroke: 'var(--bd)' }} />
            {yLabels && (
              <text
                x={LEFT - 6}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fontFamily="IBM Plex Sans,sans-serif"
                style={{ fill: 'var(--tx3)' }}
              >
                {yLabels[i]}
              </text>
            )}
          </g>
        )
      })}
      <polyline
        points={polyline}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ stroke: color }}
        strokeWidth="2.2"
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r="2.8"
            style={{ fill: 'var(--sf)', stroke: color }}
            strokeWidth="1.8"
          />
          <text
            x={p.x}
            y={height - 2}
            textAnchor="middle"
            fontSize="10.5"
            fontFamily="IBM Plex Sans,sans-serif"
            style={{ fill: 'var(--tx3)' }}
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── stat card ──────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string
  value: string
  sub?: string
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div
      className="odm-card"
      style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', minWidth: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, color: 'var(--tx3)', fontSize: 12, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="odm-tn" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1 }}>
          {value}
        </span>
        {sub && <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{sub}</span>}
      </div>
    </div>
  )
}

// ── bar chart helper ────────────────────────────────────────────────────────

type BarRowProps = {
  label: string
  value: number
  maxValue: number
  color?: string
  unit?: string
}

function BarRow({ label, value, maxValue, color = 'var(--blue-dot)', unit = '%' }: BarRowProps) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '44% 1fr 46px', gap: 10, alignItems: 'center', fontSize: 12.5 }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ height: 10, borderRadius: 5, background: 'var(--sf3)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5 }} />
      </div>
      <span className="odm-tn" style={{ textAlign: 'right', fontWeight: 600 }}>{value}{unit}</span>
    </div>
  )
}

// ── donut chart ─────────────────────────────────────────────────────────────

type DonutProps = {
  items: { label: string; count: number }[]
  total: number
}

function DonutChart({ items, total }: DonutProps) {
  const R = 64
  const CIRC = 2 * Math.PI * R
  const opacities = [1, 0.78, 0.58, 0.42, 0.3, 0.2]

  let offset = 0
  const segments = items.map((item, i) => {
    const frac = total > 0 ? item.count / total : 0
    const dash = frac * CIRC
    const seg = { ...item, dash, offset, opacity: opacities[i] ?? 0.1 }
    offset += dash
    return seg
  })

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 6 }}>
      <span style={{ position: 'relative', display: 'inline-flex', width: 150, height: 150, flex: 'none' }}>
        <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }} role="img" aria-label="Phân bổ đơn theo dịch vụ">
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="75"
              cy="75"
              r={R}
              fill="none"
              style={{ stroke: 'var(--ink)', opacity: seg.opacity }}
              strokeWidth="22"
              strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
              strokeDashoffset={-seg.offset}
            />
          ))}
        </svg>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="odm-tn" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: 11, color: 'var(--tx3)' }}>đơn</span>
        </span>
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12.5, flex: 1 }}>
        {segments.map((seg, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--ink)', opacity: opacities[i] ?? 0.1 }} />
            <span style={{ flex: 1 }}>{seg.label}</span>
            <b className="odm-tn">{seg.count}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── main data view ──────────────────────────────────────────────────────────

function ReportsData({ summary }: { summary: ReportSummary }) {
  function handleExportCsv() {
    const headers = ['Tuần', 'Tỉ lệ thành công (%)', 'TB duyệt đơn (h)']
    const rows = summary.weeklySuccessRate.map((w, i) => [
      w.week,
      String(w.rate),
      String(summary.weeklyApprovalTimeHours[i]?.avgHours ?? ''),
    ])
    exportCsv(headers, rows, `bao-cao-van-hanh-W${summary.weeklySuccessRate[0]?.week?.replace('W', '')}-W${summary.weeklySuccessRate[summary.weeklySuccessRate.length - 1]?.week?.replace('W', '')}`)
  }

  const maxDroneUtil = Math.max(...summary.droneUtilization.map((d) => d.utilizationPct))
  const maxFailReason = Math.max(...summary.topFailureReasons.map((r) => r.count))

  return (
    <>
      {/* Filters row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
        <label style={{ display: 'block', width: 170 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>Khoảng thời gian</span>
          <select className="odm-inp">
            <option>8 tuần gần nhất</option>
            <option>30 ngày qua</option>
            <option>Quý 3/2026</option>
            <option>Tuỳ chọn...</option>
          </select>
        </label>
        <label style={{ display: 'block', width: 250 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>Dịch vụ</span>
          <select className="odm-inp">
            <option>Tất cả dịch vụ</option>
            <option>Giám sát tiến độ công trình</option>
            <option>Kiểm tra nhiệt mái và tấm pin</option>
            <option>Tuần tra an ninh khu vực</option>
            <option>Giám sát cây trồng (NDVI)</option>
            <option>Giám sát giao thông và sự kiện</option>
            <option>Bản đồ 2D/3D (orthomosaic)</option>
          </select>
        </label>
        <label style={{ display: 'block', width: 180 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>Drone</span>
          <select className="odm-inp">
            <option>Tất cả drone</option>
            <option>DRN-01 Đại Bàng</option>
            <option>DRN-02 Hải Âu</option>
            <option>DRN-03 Chim Én</option>
            <option>DRN-04 Sếu Đầu Đỏ</option>
            <option>DRN-05 Diều Hâu</option>
            <option>DRN-06 Cú Mèo</option>
            <option>DRN-07 Vạc</option>
            <option>DRN-08 Cò Trắng</option>
            <option>DRN-09 Sơn Ca</option>
          </select>
        </label>
        <label style={{ display: 'block', width: 190 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>Phi công</span>
          <select className="odm-inp">
            <option>Tất cả phi công</option>
            <option>Hoàng Đức Thắng</option>
            <option>Bùi Anh Tuấn</option>
            <option>Ngô Thị Lan Phương</option>
            <option>Đỗ Minh Quân</option>
            <option>Vũ Hải Đăng</option>
            <option>Lý Thanh Sơn</option>
          </select>
        </label>
        <span style={{ flex: 1 }} />
        <button type="button" className="odm-btn">
          Đặt lại
        </button>
        <button type="button" className="odm-btn odm-btn-p" onClick={handleExportCsv}>
          Xuất CSV
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
        <StatCard
          label="Tỉ lệ mission thành công"
          value={`${summary.successRate}%`}
          sub={`+${summary.successRateDelta} điểm so với kỳ trước`}
        />
        <StatCard
          label="Mission đã bay"
          value={String(summary.totalMissionsFlown)}
          sub={`${summary.completedMissions} COMPLETED · ${summary.failedMissions} FAILED`}
        />
        <StatCard
          label="Thời gian duyệt đơn TB"
          value={`${summary.avgApprovalTimeHours} giờ`}
          sub={`${summary.avgApprovalTimeDeltaHours} giờ so với ${summary.avgApprovalTimeDeltaWeekLabel}`}
        />
        <StatCard
          label="Utilization TB toàn đội"
          value={`${summary.avgFleetUtilizationPct}%`}
        />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 14, marginBottom: 14 }}>
        <div className="odm-card">
          <div className="odm-card-header">Tỉ lệ mission thành công theo tuần</div>
          <div className="odm-card-body">
            <LineChart
              width={680}
              height={230}
              data={summary.weeklySuccessRate.map((w) => ({ label: w.week, value: w.rate }))}
              minVal={70}
              maxVal={100}
              color="var(--green-dot)"
              yLabels={['100%', '93%', '85%', '78%', '70%']}
              yValues={[100, 93, 85, 78, 70]}
              bottomPadding={22}
              ariaLabel="Tỉ lệ mission thành công theo tuần"
            />
            <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
              COMPLETED / (COMPLETED + FAILED) theo mission.scheduled_start
            </div>
          </div>
        </div>
        <div className="odm-card">
          <div className="odm-card-header">Phân bổ đơn theo dịch vụ</div>
          <div className="odm-card-body">
            <DonutChart
          items={summary.serviceDistribution.map((s) => ({ label: s.service, count: s.count }))}
          total={summary.totalOrders}
        />
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
        {/* Drone utilization */}
        <div className="odm-card">
          <div className="odm-card-header">Utilization từng drone</div>
          <div className="odm-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {summary.droneUtilization.map((d) => (
                <BarRow
                  key={d.droneCode}
                  label={`${d.droneCode} ${d.droneName}`}
                  value={d.utilizationPct}
                  maxValue={maxDroneUtil}
                  color={d.utilizationPct > 20 ? 'var(--blue-dot)' : 'var(--gray-dot)'}
                />
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
              Giờ bay / giờ khả dụng trong kỳ
            </div>
          </div>
        </div>

        {/* Avg approval time */}
        <div className="odm-card">
          <div className="odm-card-header">Thời gian duyệt đơn trung bình</div>
          <div className="odm-card-body">
            <LineChart
              width={330}
              height={200}
              data={summary.weeklyApprovalTimeHours.map((w) => ({ label: w.week, value: w.avgHours }))}
              minVal={0}
              maxVal={16}
              color="var(--blue-dot)"
              yLabels={['16h', '12h', '8h', '4h', '0h']}
              yValues={[16, 12, 8, 4, 0]}
              bottomPadding={16}
              ariaLabel="Thời gian duyệt đơn trung bình"
            />
            <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
              order_approval.decided_at − order.submitted_at (giờ)
            </div>
          </div>
        </div>

        {/* Top failure reasons */}
        <div className="odm-card">
          <div className="odm-card-header">Top lý do thất bại</div>
          <div className="odm-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {summary.topFailureReasons.map((r) => (
                <div
                  key={r.reason}
                  style={{ display: 'grid', gridTemplateColumns: '55% 1fr 46px', gap: 10, alignItems: 'center', fontSize: 12.5 }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</span>
                  <div style={{ height: 10, borderRadius: 5, background: 'var(--sf3)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${maxFailReason > 0 ? (r.count / maxFailReason) * 100 : 0}%`,
                        background: 'var(--red-dot)',
                        borderRadius: 5,
                      }}
                    />
                  </div>
                  <span className="odm-tn" style={{ textAlign: 'right', fontWeight: 600 }}>{r.count}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
              mission.failure_reason · {summary.failedMissions} mission FAILED trong kỳ
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

export function ReportsPage() {
  const query = useApiQuery((signal) => reportsApi.getSummary({}, signal), [])

  if (query.loading && !query.data) {
    return (
      <div>
        <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: '-.01em' }}>
          Báo cáo vận hành
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="odm-sk" style={{ width: '100%', height: 70, borderRadius: 8 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          <div className="odm-sk" style={{ width: '100%', height: 290, borderRadius: 8 }} />
          <div className="odm-sk" style={{ width: '100%', height: 290, borderRadius: 8 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 14 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="odm-sk" style={{ width: '100%', height: 270, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    )
  }

  if (query.error) {
    return (
      <div>
        <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: '-.01em' }}>
          Báo cáo vận hành
        </h1>
        <StateView
          state="error"
          title="Không tạo được báo cáo"
          error={query.error}
          onRetry={query.reload}
        />
      </div>
    )
  }

  if (!query.data) {
    return (
      <div>
        <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, letterSpacing: '-.01em' }}>
          Báo cáo vận hành
        </h1>
        <StateView
          state="empty"
          title="Không có dữ liệu trong khoảng đã chọn"
          description="Hãy mở rộng khoảng thời gian hoặc bỏ bớt bộ lọc dịch vụ, drone, phi công."
        />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-.01em', lineHeight: 1.25 }}>
            Báo cáo vận hành
          </h1>
          <div style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 3 }}>
            Số liệu tổng hợp từ mission, đơn hàng và đội drone
          </div>
        </div>
      </div>
      <ReportsData summary={query.data} />
    </div>
  )
}
