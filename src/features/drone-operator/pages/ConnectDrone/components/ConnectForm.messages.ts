import { defineMessages } from '../../../../../shared/i18n'

export const connectFormMessages = defineMessages({
  vi: {
    step1Title: 'Xác thực phiên operator',
    scanQr: 'Quét QR',
    tokenAriaLabel: 'Mã flight token',
    droneCodeHint: 'Mã thiết bị được lấy từ mission đã gán',
    expiredAt: 'Hết hạn lúc 13:24:12',
    tokenAfterPreflight: 'Token cấp sau backend preflight',
    step2Title: 'Kết nối Flight Controller',
    gcsAriaLabel: 'GCS',
    requestNewCode: 'Yêu cầu mã mới',
    connected: 'Đã kết nối',
    connecting: 'Đang kết nối...',
    retry: 'Thử lại',
    connect: 'Kết nối',
    sessionNote:
      'Phiên điều khiển được xác thực bằng tài khoản operator và thiết bị đã gán cho mission.',
  },
  en: {
    step1Title: 'Authenticate operator session',
    scanQr: 'Scan QR',
    tokenAriaLabel: 'Flight token code',
    droneCodeHint: 'Device code comes from the assigned mission',
    expiredAt: 'Expired at 13:24:12',
    tokenAfterPreflight: 'Token issued after backend preflight',
    step2Title: 'Connect Flight Controller',
    gcsAriaLabel: 'GCS',
    requestNewCode: 'Request new code',
    connected: 'Connected',
    connecting: 'Connecting...',
    retry: 'Retry',
    connect: 'Connect',
    sessionNote:
      'The control session is authenticated with the operator account and the device assigned to the mission.',
  },
})
