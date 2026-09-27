// Static marketing copy for the landing page, copied verbatim from
// evd/design/Landing.dc.html. This is page copy, not API data: it is not
// fetched, so it is not modeled as a mock endpoint per evd/AGENT-RULES.md
// rule 3/5 (mock data is only for resources the app actually fetches).
//
// i18n Phase 2: wrapped in `defineMessages` so every string has a Vietnamese
// (unchanged) and English side. Consume with
// `const { t: content } = useI18n(landingMessages)` in LandingPage.tsx.
import { defineMessages } from '../../shared/i18n'
import type {
  FaqItem,
  FeasibilityCheck,
  FeatureHighlight,
  FooterLinkGroup,
  HeroStat,
  IndustryCard,
  ResultFile,
  WorkflowStep,
} from './types'

type LandingContent = {
  brandName: string
  heroChip: string
  heroTitleLines: string[]
  heroLede: string
  heroChecklist: string[]
  heroAiCard: { score: number; label: string; status: string }
  heroMissionCard: {
    code: string
    status: string
    title: string
    drone: string
    battery: string
    altitude: string
  }
  heroStats: HeroStat[]
  workflowSection: { eyebrow: string; title: string }
  workflowSteps: WorkflowStep[]
  aiFeatureSection: { eyebrow: string; title: string; copy: string }
  aiFeatureHighlights: FeatureHighlight[]
  aiResultPanel: {
    title: string
    verdictLabel: string
    score: number
    verdictTitle: string
    verdictDetail: string
    altSuggestion: string
  }
  aiFeasibilityChecks: FeasibilityCheck[]
  liveFeatureSection: { eyebrow: string; title: string; copy: string }
  liveFeatureHighlights: FeatureHighlight[]
  livePanel: {
    title: string
    status: string
    battery: string
    altitude: string
    resultsTitle: string
    fileCount: string
  }
  liveResultFiles: ResultFile[]
  industriesSection: { eyebrow: string; title: string; copy: string }
  industries: IndustryCard[]
  faqSection: { eyebrow: string; title: string; copy: string }
  faqItems: FaqItem[]
  ctaSection: { eyebrow: string; title: string }
  footerTagline: string
  footerLinkGroups: FooterLinkGroup[]
  footerCopyright: string
  footerLegal: string
  footerBrandDescription: string
  navLinks: { label: string; href: string }[]
}

const vi: LandingContent = {
  brandName: 'OnDemand Monitor',
  heroChip: '🚁 Dịch vụ giám sát bằng drone theo yêu cầu',
  heroTitleLines: [
    'Giám sát hiện trường bằng drone,',
    'đặt lịch trong vài phút',
  ],
  heroLede:
    'Chọn vị trí trên bản đồ, AI kiểm tra tính khả thi, phi công được cấp phép thực hiện. Bạn theo dõi trực tiếp và nhận ảnh, video đã xác thực ngay trên hệ thống.',
  heroChecklist: [
    'Phi công có giấy phép',
    'Tự động kiểm tra vùng cấm bay',
    'Ảnh và video được xác thực',
  ],
  heroAiCard: {
    score: 92,
    label: 'AI kiểm tra khả thi',
    status: 'Có thể bay hôm nay',
  },
  heroMissionCard: {
    code: 'MSN-2609-0142-1',
    status: 'IN_FLIGHT',
    title: 'Khảo sát công trình · Thủ Thiêm, TP.HCM',
    drone: 'DRN-02',
    battery: '78%',
    altitude: 'Độ cao 60 m',
  },
  heroStats: [
    { value: '96', label: 'chuyến bay trong tháng 9/2026' },
    { value: '87/96', label: 'mission hoàn thành, 9 mission cần bay lại' },
    { value: '9', label: 'drone trong đội bay' },
    { value: '24/7', label: 'theo dõi trạng thái mission' },
  ],
  workflowSection: {
    eyebrow: 'Cách hoạt động',
    title: 'Từ yêu cầu đến kết quả trong bốn bước',
  },
  workflowSteps: [
    {
      no: '01',
      title: 'Chọn vị trí và thời gian',
      detail:
        'Đánh dấu khu vực trên bản đồ, chọn bán kính, dịch vụ và khung giờ mong muốn.',
      icon: 'map-pin',
      emoji: '📍',
    },
    {
      no: '02',
      title: 'AI kiểm tra khả thi',
      detail:
        'Hệ thống rà vùng cấm bay, thời tiết, giấy phép và gợi ý ngày thay thế nếu cần.',
      icon: 'cpu',
      emoji: '✨',
    },
    {
      no: '03',
      title: 'Duyệt và phân công',
      detail:
        'Nhân viên điều phối duyệt đơn, chọn drone, phi công và trạm phù hợp nhất.',
      icon: 'users',
      emoji: '🛡️',
    },
    {
      no: '04',
      title: 'Bay, xem trực tiếp, nhận kết quả',
      detail:
        'Xem livestream khi drone bay, sau đó tải ảnh và video đã qua kiểm tra.',
      icon: 'radio',
      emoji: '🎥',
    },
  ],
  aiFeatureSection: {
    eyebrow: 'Tính năng · AI phân tích',
    title: 'Biết trước bay được hay không, trước khi gửi duyệt',
    copy: 'Mỗi yêu cầu được kiểm tra tự động và chấm điểm, để đơn gửi đi ít bị trả lại và không mất thời gian chờ đợi.',
  },
  aiFeatureHighlights: [
    {
      title: 'Kiểm tra vùng cấm bay và bán kính',
      detail: 'Đối chiếu vị trí với danh sách vùng cấm bay đang hiệu lực.',
      icon: 'map-pin',
      emoji: '🗺️',
    },
    {
      title: 'Điểm khả thi rõ ràng',
      detail:
        'Mỗi tiêu chí có kết quả PASS, WARNING hoặc BLOCKER để bạn xử lý ngay.',
      icon: 'clipboard',
      emoji: '📊',
    },
    {
      title: 'Gợi ý ngày và giờ thay thế',
      detail: 'Đề xuất khung giờ phù hợp khi ngày bạn chọn có rủi ro.',
      icon: 'clock',
      emoji: '📅',
    },
  ],
  aiResultPanel: {
    title: 'Kết quả phân tích AI',
    verdictLabel: 'RISKY',
    score: 74,
    verdictTitle: 'Khả thi có điều kiện',
    verdictDetail: 'Nên chọn khung giờ sáng để an toàn hơn.',
    altSuggestion: 'Chủ nhật 20/09/2026 · 08:00 – 10:00',
  },
  aiFeasibilityChecks: [
    { label: 'Vùng cấm bay quanh khu vực', result: 'PASS' },
    { label: 'Giấy phép phi công còn hiệu lực', result: 'PASS' },
    { label: 'Gió giật 26 km/h lúc 15:00', result: 'WARNING' },
    { label: 'Drone và pin sẵn sàng', result: 'PASS' },
  ],
  liveFeatureSection: {
    eyebrow: 'Tính năng · Giám sát và kết quả',
    title: 'Xem drone bay trực tiếp, nhận media đã xác thực',
    copy: 'Theo dõi vị trí, pin và độ cao theo thời gian thực. Sau chuyến bay, ảnh và video được kiểm tra trước khi giao cho bạn.',
  },
  liveFeatureHighlights: [
    {
      title: 'Livestream và bản đồ realtime',
      detail:
        'Xem hình ảnh trực tiếp cùng lộ trình và các điểm bay của mission.',
      icon: 'radio',
      emoji: '📡',
    },
    {
      title: 'Kiểm tra media trước khi giao',
      detail:
        'Tệp lỗi được xử lý lại, chỉ tệp đạt mới xuất hiện trong thư viện của bạn.',
      icon: 'camera',
      emoji: '✅',
    },
    {
      title: 'Thư viện kết quả luôn sẵn sàng',
      detail:
        'Tải từng tệp hoặc cả mission, xem lại lịch sử đơn bất cứ lúc nào.',
      icon: 'file-text',
      emoji: '⬇️',
    },
  ],
  livePanel: {
    title: 'Theo dõi trực tiếp · MSN-2609-0142-1',
    status: 'LIVE',
    battery: '78%',
    altitude: '60 m',
    resultsTitle: 'Kết quả nhận được',
    fileCount: '20 tệp',
  },
  liveResultFiles: [
    { name: 'IMG_0417', status: 'PASS' },
    { name: 'VID_0009', status: 'PASS' },
    { name: 'IMG_0418', status: 'UPLOADING' },
  ],
  industriesSection: {
    eyebrow: 'Ứng dụng',
    title: 'Dành cho mọi nhu cầu quan sát từ trên cao',
    copy: 'Một quy trình chung, nhiều loại dịch vụ. Chọn đúng dịch vụ khi tạo yêu cầu.',
  },
  industries: [
    {
      title: 'Công trình xây dựng',
      detail:
        'Theo dõi tiến độ, đo đạc khối lượng và chụp toàn cảnh công trường.',
      location: 'Thủ Thiêm, TP.HCM',
      icon: 'building',
      emoji: '🏗️',
    },
    {
      title: 'Nông nghiệp',
      detail: 'Đánh giá cây trồng và tình trạng đất trên diện tích lớn.',
      location: 'Đắk Lắk',
      icon: 'leaf',
      emoji: '🌾',
    },
    {
      title: 'Điện và viễn thông',
      detail: 'Kiểm tra trụ, đường dây và trạm ở nơi khó tiếp cận.',
      location: 'Bình Dương',
      icon: 'zap',
      emoji: '📶',
    },
    {
      title: 'Giao thông và đô thị',
      detail: 'Quan sát lưu lượng, nút giao và hiện trạng hạ tầng.',
      location: 'Đà Nẵng',
      icon: 'route',
      emoji: '🚦',
    },
    {
      title: 'Bất động sản',
      detail: 'Ghi hình dự án, mặt bằng và quy hoạch khu đất.',
      location: 'Nhà Bè, TP.HCM',
      icon: 'home',
      emoji: '🏘️',
    },
    {
      title: 'Sự kiện và an ninh',
      detail: 'Giám sát khu vực đông người trong thời gian diễn ra sự kiện.',
      location: 'Hà Nội',
      icon: 'shield',
      emoji: '🎪',
    },
  ],
  faqSection: {
    eyebrow: 'Câu hỏi thường gặp',
    title: 'Giải đáp nhanh',
    copy: 'Cần hỗ trợ thêm? Liên hệ support@odms.vn hoặc hỏi trợ lý AI ở góc phải màn hình.',
  },
  faqItems: [
    {
      question: 'Tôi cần chuẩn bị gì để tạo một yêu cầu giám sát?',
      answer:
        'Bạn chỉ cần tài khoản khách hàng, vị trí và bán kính trên bản đồ, loại dịch vụ và khung giờ mong muốn. Hệ thống sẽ kiểm tra khả thi ngay khi bạn hoàn tất bước cuối.',
    },
    {
      question: 'Bao lâu thì đơn được duyệt?',
      answer:
        'Thông thường trong vòng 2 giờ làm việc. Đơn có điểm khả thi cao thường được duyệt nhanh hơn.',
    },
    {
      question: 'Nếu thời tiết xấu thì sao?',
      answer:
        'Hệ thống sẽ thông báo và gợi ý khung giờ thay thế. Bạn không bị tính phí khi mission bị hoãn vì thời tiết.',
    },
    {
      question: 'Tôi có xem được drone bay trực tiếp không?',
      answer:
        'Có. Khi mission ở trạng thái IN_FLIGHT, bạn xem được livestream, vị trí, pin và độ cao theo thời gian thực.',
    },
    {
      question: 'Ảnh và video được giao ở đâu?',
      answer:
        'Trong thư viện kết quả của tài khoản, sau khi tệp đã được kiểm tra chất lượng.',
    },
  ],
  ctaSection: {
    eyebrow: 'Sẵn sàng giám sát khu vực của bạn?',
    title: 'Tạo tài khoản và gửi yêu cầu đầu tiên trong vài phút.',
  },
  footerTagline:
    'Dịch vụ giám sát bằng drone theo yêu cầu. Thành phố Hồ Chí Minh, Việt Nam.',
  footerLinkGroups: [
    {
      title: 'Sản phẩm',
      links: ['Tạo yêu cầu', 'Theo dõi trực tiếp', 'Thư viện kết quả'],
    },
    {
      title: 'Dịch vụ',
      links: ['Công trình xây dựng', 'Nông nghiệp', 'Hạ tầng và đô thị'],
    },
    {
      title: 'Hỗ trợ',
      links: [
        'Câu hỏi thường gặp',
        'support@odms.vn',
        'Chính sách bay an toàn',
      ],
    },
  ],
  footerCopyright: '© 2026 OnDemand Monitor. Đồ án FA26SE039.',
  footerLegal: 'Điều khoản sử dụng · Quyền riêng tư',
  footerBrandDescription:
    'Dịch vụ giám sát bằng drone theo yêu cầu.\nThành phố Hồ Chí Minh, Việt Nam.',
  navLinks: [
    { label: 'Cách hoạt động', href: '#how-it-works' },
    { label: 'Tính năng', href: '#features' },
    { label: 'Ứng dụng', href: '#industries' },
    { label: 'Câu hỏi thường gặp', href: '#faq' },
  ],
}

const en: LandingContent = {
  brandName: 'OnDemand Monitor',
  heroChip: '🚁 On-demand drone monitoring service',
  heroTitleLines: ['Monitor your site with drones,', 'book it in minutes'],
  heroLede:
    'Pick a location on the map, AI checks feasibility, a licensed pilot flies it. Watch live and get verified photos and video straight in the system.',
  heroChecklist: [
    'Licensed pilots',
    'Automatic no-fly zone checks',
    'Verified photos and video',
  ],
  heroAiCard: {
    score: 92,
    label: 'AI feasibility check',
    status: 'Can fly today',
  },
  heroMissionCard: {
    code: 'MSN-2609-0142-1',
    status: 'IN_FLIGHT',
    title: 'Construction site survey · Thu Thiem, HCMC',
    drone: 'DRN-02',
    battery: '78%',
    altitude: 'Altitude 60 m',
  },
  heroStats: [
    { value: '96', label: 'flights in September 2026' },
    { value: '87/96', label: 'missions completed, 9 need a re-flight' },
    { value: '9', label: 'drones in the fleet' },
    { value: '24/7', label: 'mission status tracking' },
  ],
  workflowSection: {
    eyebrow: 'How it works',
    title: 'From request to results in four steps',
  },
  workflowSteps: [
    {
      no: '01',
      title: 'Pick location and time',
      detail:
        'Mark the area on the map, choose a radius, service and preferred time slot.',
      icon: 'map-pin',
      emoji: '📍',
    },
    {
      no: '02',
      title: 'AI checks feasibility',
      detail:
        'The system checks no-fly zones, weather and permits, and suggests an alternative date if needed.',
      icon: 'cpu',
      emoji: '✨',
    },
    {
      no: '03',
      title: 'Review and dispatch',
      detail:
        'A dispatcher reviews the order and assigns the best-fit drone, pilot and station.',
      icon: 'users',
      emoji: '🛡️',
    },
    {
      no: '04',
      title: 'Fly, watch live, get results',
      detail:
        'Watch the livestream while the drone flies, then download verified photos and video.',
      icon: 'radio',
      emoji: '🎥',
    },
  ],
  aiFeatureSection: {
    eyebrow: 'Feature · AI analysis',
    title: 'Know if it can fly before you submit',
    copy: 'Every request is checked and scored automatically, so fewer orders bounce back and you spend less time waiting.',
  },
  aiFeatureHighlights: [
    {
      title: 'No-fly zone and radius check',
      detail: 'Cross-checks the location against the active no-fly zone list.',
      icon: 'map-pin',
      emoji: '🗺️',
    },
    {
      title: 'A clear feasibility score',
      detail:
        'Every criterion returns PASS, WARNING or BLOCKER so you can act on it right away.',
      icon: 'clipboard',
      emoji: '📊',
    },
    {
      title: 'Alternative date and time suggestions',
      detail: 'Suggests a better time slot when your chosen date is risky.',
      icon: 'clock',
      emoji: '📅',
    },
  ],
  aiResultPanel: {
    title: 'AI analysis result',
    verdictLabel: 'RISKY',
    score: 74,
    verdictTitle: 'Feasible with conditions',
    verdictDetail: 'A morning slot is safer.',
    altSuggestion: 'Sunday 20/09/2026 · 08:00 – 10:00',
  },
  aiFeasibilityChecks: [
    { label: 'No-fly zone around the area', result: 'PASS' },
    { label: 'Pilot license still valid', result: 'PASS' },
    { label: 'Wind gusts 26 km/h at 15:00', result: 'WARNING' },
    { label: 'Drone and battery ready', result: 'PASS' },
  ],
  liveFeatureSection: {
    eyebrow: 'Feature · Monitoring and results',
    title: 'Watch the drone fly live, get verified media',
    copy: 'Track position, battery and altitude in real time. After the flight, photos and video are checked before they reach you.',
  },
  liveFeatureHighlights: [
    {
      title: 'Live stream and real-time map',
      detail: 'Watch the live feed alongside the mission route and waypoints.',
      icon: 'radio',
      emoji: '📡',
    },
    {
      title: 'Media checked before delivery',
      detail:
        'Failed files are reprocessed — only files that pass show up in your library.',
      icon: 'camera',
      emoji: '✅',
    },
    {
      title: 'A results library that is always ready',
      detail:
        'Download individual files or an entire mission, and revisit order history any time.',
      icon: 'file-text',
      emoji: '⬇️',
    },
  ],
  livePanel: {
    title: 'Live tracking · MSN-2609-0142-1',
    status: 'LIVE',
    battery: '78%',
    altitude: '60 m',
    resultsTitle: 'Results received',
    fileCount: '20 files',
  },
  liveResultFiles: [
    { name: 'IMG_0417', status: 'PASS' },
    { name: 'VID_0009', status: 'PASS' },
    { name: 'IMG_0418', status: 'UPLOADING' },
  ],
  industriesSection: {
    eyebrow: 'Use cases',
    title: 'For every aerial monitoring need',
    copy: 'One workflow, many services. Pick the right service when you create a request.',
  },
  industries: [
    {
      title: 'Construction',
      detail:
        'Track progress, measure volumes and capture full-site overviews.',
      location: 'Thu Thiem, HCMC',
      icon: 'building',
      emoji: '🏗️',
    },
    {
      title: 'Agriculture',
      detail: 'Assess crop and soil condition across large areas.',
      location: 'Dak Lak',
      icon: 'leaf',
      emoji: '🌾',
    },
    {
      title: 'Power and telecom',
      detail: 'Inspect poles, lines and stations in hard-to-reach places.',
      location: 'Binh Duong',
      icon: 'zap',
      emoji: '📶',
    },
    {
      title: 'Traffic and urban infrastructure',
      detail:
        'Observe traffic flow, intersections and infrastructure condition.',
      location: 'Da Nang',
      icon: 'route',
      emoji: '🚦',
    },
    {
      title: 'Real estate',
      detail: 'Film projects, sites and land-use plans.',
      location: 'Nha Be, HCMC',
      icon: 'home',
      emoji: '🏘️',
    },
    {
      title: 'Events and security',
      detail: 'Monitor crowded areas for the duration of an event.',
      location: 'Hanoi',
      icon: 'shield',
      emoji: '🎪',
    },
  ],
  faqSection: {
    eyebrow: 'FAQ',
    title: 'Quick answers',
    copy: 'Need more help? Contact support@odms.vn or ask the AI assistant in the bottom-right corner.',
  },
  faqItems: [
    {
      question: 'What do I need to create a monitoring request?',
      answer:
        'Just a customer account, a location and radius on the map, a service type and a preferred time slot. The system checks feasibility as soon as you finish the last step.',
    },
    {
      question: 'How long does approval take?',
      answer:
        'Usually within 2 business hours. Requests with a high feasibility score are typically approved faster.',
    },
    {
      question: 'What if the weather is bad?',
      answer:
        'The system will notify you and suggest an alternative time slot. You are not charged when a mission is postponed due to weather.',
    },
    {
      question: 'Can I watch the drone fly live?',
      answer:
        'Yes. While a mission is IN_FLIGHT, you can watch the livestream, position, battery and altitude in real time.',
    },
    {
      question: 'Where are my photos and video delivered?',
      answer:
        "In your account's results library, once the files have passed quality review.",
    },
  ],
  ctaSection: {
    eyebrow: 'Ready to monitor your site?',
    title: 'Create an account and send your first request in minutes.',
  },
  footerTagline:
    'On-demand drone monitoring service. Ho Chi Minh City, Vietnam.',
  footerLinkGroups: [
    {
      title: 'Product',
      links: ['Create request', 'Live tracking', 'Results library'],
    },
    {
      title: 'Services',
      links: ['Construction', 'Agriculture', 'Infrastructure and urban'],
    },
    {
      title: 'Support',
      links: ['FAQ', 'support@odms.vn', 'Safe flight policy'],
    },
  ],
  footerCopyright: '© 2026 OnDemand Monitor. FA26SE039 capstone project.',
  footerLegal: 'Terms of use · Privacy',
  footerBrandDescription:
    'On-demand drone monitoring service.\nHo Chi Minh City, Vietnam.',
  navLinks: [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Use cases', href: '#industries' },
    { label: 'FAQ', href: '#faq' },
  ],
}

export const landingMessages = defineMessages({ vi, en })
