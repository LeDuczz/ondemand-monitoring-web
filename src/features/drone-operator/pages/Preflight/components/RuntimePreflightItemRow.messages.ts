import { defineMessages } from '../../../../../shared/i18n'

export const runtimePreflightItemRowMessages = defineMessages({
  vi: {
    itemFail: 'Không đạt',
    itemPass: 'Đạt',
    itemChecking: 'Đang kiểm',
    itemPending: 'Chờ kiểm',
    statusNoTrigger: 'Chưa trigger precheck',
    statusWarnNoBlock: 'Cảnh báo nhưng không chặn bay',
    statusChecking: 'Đang kiểm tra',
    statusWaiting: 'Đang chờ',
  },
  en: {
    itemFail: 'Failed',
    itemPass: 'Passed',
    itemChecking: 'Checking',
    itemPending: 'Pending',
    statusNoTrigger: 'Precheck not triggered yet',
    statusWarnNoBlock: 'Warning, but does not block the flight',
    statusChecking: 'Checking',
    statusWaiting: 'Waiting',
  },
})
