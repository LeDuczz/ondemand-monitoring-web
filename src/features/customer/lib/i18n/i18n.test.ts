import { describe, expect, it } from 'vitest'

import { localizeServiceName } from './serviceNames'
import { localizeTimeslot, timeslotCodeFromName } from './timeslots'

describe('localizeServiceName', () => {
  it('maps by id and by accent-insensitive Vietnamese name in English', () => {
    expect(localizeServiceName('svc-ndvi', 'en')).toBe('Crop monitoring (NDVI)')
    expect(localizeServiceName('Giám sát công trình', 'en')).toBe('Construction site monitoring')
    expect(localizeServiceName('  giam sat cong trinh ', 'en')).toBe('Construction site monitoring')
    expect(localizeServiceName('uuid-x', 'en', 'Dịch vụ lạ')).toBe('Dịch vụ lạ')
  })
  it('keeps the BE name for unknown services and in Vietnamese', () => {
    expect(localizeServiceName('Dịch vụ lạ', 'en')).toBe('Dịch vụ lạ')
    expect(localizeServiceName('Giám sát công trình', 'vi')).toBe('Giám sát công trình')
    expect(localizeServiceName(null, 'en')).toBe('')
  })
})

describe('localizeTimeslot', () => {
  const known = [
    { id: 'pt-2', code: 'AFTERNOON', name: 'Buổi chiều', startTime: '12:00:00', endTime: '17:00:00' },
  ]
  it('resolves id to code and adds the range', () => {
    expect(localizeTimeslot({ id: 'pt-2' }, 'en', known)).toBe('Afternoon 12:00–17:00')
    expect(localizeTimeslot({ id: 'pt-2', name: 'Buổi chiều' }, 'vi', known)).toBe('Buổi chiều 12:00–17:00')
  })
  it('matches by name when the id is missing', () => {
    expect(localizeTimeslot({ name: 'Buổi chiều' }, 'en', known)).toBe('Afternoon 12:00–17:00')
  })
  it('infers the code from the name and keeps a range written in it', () => {
    expect(localizeTimeslot({ name: 'Chiều tối 17:00–19:00' }, 'en')).toBe('Evening 17:00–19:00')
    expect(localizeTimeslot({ name: 'Sáng 07:00–11:00' }, 'en')).toBe('Morning 07:00–11:00')
    expect(localizeTimeslot({ name: 'Sáng 07:00–11:00' }, 'vi')).toBe('Sáng 07:00–11:00')
    expect(timeslotCodeFromName('Đêm')).toBe('NIGHT')
  })
  it('falls back to the BE name', () => {
    expect(localizeTimeslot({ name: 'Giờ lạ' }, 'en')).toBe('Giờ lạ')
  })
})
