import type { IconName } from '../../../shared/components/Icon'

export type Feature = {
  title: string
  description: string
  icon: IconName
  accent: 'blue' | 'mint' | 'amber'
}

export type TelemetryMetric = {
  label: string
  value: string
  unit: string
  trend?: string
}

export type RequestStep = {
  label: string
  detail: string
  icon: IconName
}

export type DashboardActivity = {
  label: string
  detail: string
  status: 'complete' | 'active' | 'pending'
  icon: IconName
}
