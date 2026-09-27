import { defineMessages } from '../../../shared/i18n'

export const landingPageMessages = defineMessages({
  vi: {
    logoHomeAriaLabel: (brandName: string) => `${brandName} - trang chủ`,
    skipLink: 'Bỏ qua tới nội dung',
    mainNavAriaLabel: 'Điều hướng chính',
    login: 'Đăng nhập',
    createRequest: 'Tạo yêu cầu',
    createRequestCta: 'Tạo yêu cầu giám sát →',
    createRequestCtaShort: 'Tạo yêu cầu giám sát',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    altSuggestionLabel: 'Gợi ý ngày thay thế',
    choose: 'Chọn',
  },
  en: {
    logoHomeAriaLabel: (brandName: string) => `${brandName} - home`,
    skipLink: 'Skip to content',
    mainNavAriaLabel: 'Main navigation',
    login: 'Log in',
    createRequest: 'Create request',
    createRequestCta: 'Create monitoring request →',
    createRequestCtaShort: 'Create monitoring request',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    altSuggestionLabel: 'Alternative date suggestion',
    choose: 'Choose',
  },
})
