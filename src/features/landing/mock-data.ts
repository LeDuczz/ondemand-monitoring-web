import type {
  DashboardActivity,
  Feature,
  RequestStep,
  TelemetryMetric,
} from './types'

export const features: Feature[] = [
  {
    title: 'Live telemetry',
    description:
      'Watch signal, power, temperature, and location change as it happens.',
    icon: 'activity',
    accent: 'blue',
  },
  {
    title: 'Media capture',
    description:
      'Request photos and video from any connected device with one clear audit trail.',
    icon: 'camera',
    accent: 'mint',
  },
  {
    title: 'Mission control',
    description:
      'Turn field requests into accountable missions with owners, status, and context.',
    icon: 'route',
    accent: 'amber',
  },
  {
    title: 'Access that scales',
    description:
      'Give every team the right view, from administrator to field operator.',
    icon: 'users',
    accent: 'blue',
  },
]

export const telemetryMetrics: TelemetryMetric[] = [
  { label: 'Open requests', value: '12', unit: '', trend: '+3 this week' },
  { label: 'In progress', value: '04', unit: '', trend: 'On track' },
  { label: 'Reports ready', value: '08', unit: '', trend: 'Review now' },
]

export const requestSteps: RequestStep[] = [
  {
    label: 'Create a request',
    detail: 'Tell us what needs inspecting and where.',
    icon: 'plus',
  },
  {
    label: 'We coordinate the work',
    detail: 'Our team reviews scope, access, and timing.',
    icon: 'users',
  },
  {
    label: 'Inspection is performed',
    detail: 'Remote specialists collect the evidence needed.',
    icon: 'radio',
  },
  {
    label: 'Track the ticket',
    detail: 'Follow progress without chasing updates.',
    icon: 'ticket',
  },
  {
    label: 'Review the report',
    detail: 'Receive findings, evidence, and next steps.',
    icon: 'file-text',
  },
  {
    label: 'Take action',
    detail: 'Move from insight to an informed decision.',
    icon: 'check',
  },
]

export const dashboardActivities: DashboardActivity[] = [
  {
    label: 'Request reviewed',
    detail: 'North Ridge · 12 min ago',
    status: 'complete',
    icon: 'check',
  },
  {
    label: 'Inspection in progress',
    detail: 'Cooling tower B · Today, 09:30',
    status: 'active',
    icon: 'radio',
  },
  {
    label: 'Report ready for review',
    detail: 'Substation 04 · Yesterday',
    status: 'pending',
    icon: 'file-text',
  },
]
