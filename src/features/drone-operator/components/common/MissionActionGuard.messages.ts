import { defineMessages } from '../../../../shared/i18n'

export const missionActionGuardMessages = defineMessages({
  vi: {
    checkingEyebrow: 'Đang kiểm tra',
    checkingTitle: 'Đang kiểm tra quyền nhiệm vụ',
    checkingDescription:
      'Hệ thống đang xác nhận phân công của bạn trước khi mở thao tác này.',
    readyEyebrow: 'Sẵn sàng bay',
    readyTitle: 'Đang mở buồng lái',
    readyDescription:
      'Operator đã hoàn tất kiểm tra và bàn giao. Pilot có thể tiếp tục bay trong buồng lái.',
    accessError:
      'Không thể xác nhận quyền Mission. Vui lòng kiểm tra lại hoặc đăng nhập lại.',
    operatorStepNote:
      'Bước này dành cho operator kết nối thiết bị, preflight và bàn giao. Pilot tiếp tục ở buồng lái sau khi operator bàn giao.',
    notPermitted:
      'Bạn chưa được phân công hoặc chưa có quyền thực hiện thao tác này.',
    unavailableEyebrow: 'Chưa thể thao tác',
    unavailableTitle: 'Bạn chưa có quyền mở bước này',
    openCockpit: 'Mở buồng lái',
    backToMission: 'Quay lại mission',
    retry: 'Kiểm tra lại',
  },
  en: {
    checkingEyebrow: 'Checking',
    checkingTitle: 'Checking mission permissions',
    checkingDescription:
      'The system is confirming your assignment before opening this action.',
    readyEyebrow: 'Ready to fly',
    readyTitle: 'Opening the cockpit',
    readyDescription:
      'The operator completed checks and handover. The pilot can continue in the cockpit.',
    accessError: 'Unable to confirm Mission access. Retry or sign in again.',
    operatorStepNote:
      'This step is for the operator to connect the device, run preflight, and hand over. The pilot continues in the cockpit after handover.',
    notPermitted:
      'Your accepted mission assignment does not permit this action.',
    unavailableEyebrow: 'Action unavailable',
    unavailableTitle: 'You cannot open this step yet',
    openCockpit: 'Open cockpit',
    backToMission: 'Back to mission',
    retry: 'Retry',
  },
})
