// Fixed demo clock for the drone-operator portal so KPI counts, countdowns and
// the "Hôm nay" grouping in OPR-01W always match the design's snapshot.
const DEMO_NOW_ISO = '2026-09-19T14:32:00+07:00'

export function demoNow(): Date {
  return new Date(DEMO_NOW_ISO)
}
