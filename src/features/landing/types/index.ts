import type { IconName } from '../../../shared/components/Icon'
import type { StatusTone } from '../../../shared/types/domain'

export type HeroStat = {
  value: string
  label: string
}

export type WorkflowStep = {
  no: string
  title: string
  detail: string
  icon: IconName
  emoji?: string
}

export type FeasibilityCheck = {
  label: string
  detail?: string
  result: 'PASS' | 'WARNING' | 'BLOCKER'
}

export type FeatureHighlight = {
  title: string
  detail: string
  icon: IconName
  emoji?: string
}

export type ResultFile = {
  name: string
  status: 'PASS' | 'UPLOADING'
}

export type IndustryCard = {
  title: string
  detail: string
  location: string
  icon: IconName
  emoji?: string
}

export type FaqItem = {
  question: string
  answer?: string
}

export type FooterLinkGroup = {
  title: string
  links: string[]
}

export type StatusTag = {
  label: string
  tone: StatusTone
}
