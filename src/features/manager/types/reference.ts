export type ServiceResponse = {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PreferredTimeResponse = {
  id: string
  code: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'
  name: string
  startTime: string
  endTime: string
}
