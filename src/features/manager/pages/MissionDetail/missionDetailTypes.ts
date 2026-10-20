export type MissionDetailTab = 'overview' | 'order' | 'checks'

export type NextStep = {
  tone: 'wait' | 'go' | 'done' | 'bad'
  title: string
  detail: string
}
