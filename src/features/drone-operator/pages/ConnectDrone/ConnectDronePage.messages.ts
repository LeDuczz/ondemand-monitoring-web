import { defineMessages } from '../../../../shared/i18n'

export const connectDronePageMessages = defineMessages({
  vi: {
    gcsOptions: ['Flight Controller hiện tại'],
    tokenPlaceholder: 'Flight token cấp sau preflight',
    noMissionAssigned: 'Mission chưa được gán thiết bị',
    connectFailed: 'Không kết nối được Flight Controller',
    stepTitle: 'Kết nối thiết bị',
    noMissionSelected: 'Chưa chọn mission',
    noDroneAssigned: 'Chưa gán thiết bị',
  },
  en: {
    gcsOptions: ['Current Flight Controller'],
    tokenPlaceholder: 'Flight token issued after preflight',
    noMissionAssigned: 'Mission has no device assigned',
    connectFailed: 'Could not connect to the Flight Controller',
    stepTitle: 'Connect device',
    noMissionSelected: 'No mission selected',
    noDroneAssigned: 'No device assigned',
  },
})
