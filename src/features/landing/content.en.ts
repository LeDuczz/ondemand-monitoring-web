// English copy for the landing page. Mirrors the shape of the Vietnamese
// content in ./content.ts; non-text fields (icons, scores, codes) are reused
// from the Vietnamese source by the caller via `overlay`.

const overlay = <T extends object>(base: readonly T[], texts: Partial<T>[]): T[] =>
  base.map((item, index) => ({ ...item, ...texts[index] }))

export const enText = {
  heroChip: '🚁 On-demand drone monitoring service',
  heroTitleLines: ['Monitor your site with drones,', 'book in minutes'],
  heroLede:
    'Pick a location on the map, AI checks feasibility, and a licensed pilot flies the mission. Follow it live and receive verified photos and videos right in the system.',
  heroChecklist: [
    'Licensed pilots',
    'Automatic no-fly zone checks',
    'Verified photos and videos',
  ],
  heroAiCard: { label: 'AI feasibility check', status: 'Can fly today' },
  heroMissionCard: {
    title: 'Site survey · Thu Thiem, Ho Chi Minh City',
    altitude: 'Altitude 60 m',
  },
  heroStats: [
    { label: 'flights in September 2026' },
    { label: 'missions completed, 9 missions need a re-flight' },
    { label: 'drones in the fleet' },
    { label: 'mission status tracking' },
  ],
  workflowSection: {
    eyebrow: 'How it works',
    title: 'From request to results in four steps',
  },
  workflowSteps: [
    {
      title: 'Choose location and time',
      detail:
        'Mark the area on the map, then pick the radius, service, and preferred time slot.',
    },
    {
      title: 'AI checks feasibility',
      detail:
        'The system reviews no-fly zones, weather, and permits, and suggests alternative dates if needed.',
    },
    {
      title: 'Review and assign',
      detail:
        'Dispatch staff approve the order and choose the best drone, pilot, and station.',
    },
    {
      title: 'Fly, watch live, get results',
      detail:
        'Watch the livestream while the drone flies, then download verified photos and videos.',
    },
  ],
  aiFeatureSection: {
    eyebrow: 'Features · AI analysis',
    title: 'Know whether it can fly before you submit for review',
    copy: 'Every request is checked and scored automatically, so fewer orders are sent back and you spend less time waiting.',
  },
  aiFeatureHighlights: [
    {
      title: 'No-fly zone and radius check',
      detail: 'Compares the location against the active no-fly zone list.',
    },
    {
      title: 'Clear feasibility score',
      detail:
        'Each criterion returns PASS, WARNING, or BLOCKER so you can act right away.',
    },
    {
      title: 'Alternative date and time suggestions',
      detail: 'Suggests suitable time slots when your chosen date is risky.',
    },
  ],
  aiResultPanel: {
    title: 'AI analysis result',
    verdictTitle: 'Conditionally feasible',
    verdictDetail: 'A morning time slot is safer.',
    altSuggestion: 'Sunday 20/09/2026 · 08:00 – 10:00',
  },
  aiFeasibilityChecks: [
    { label: 'No-fly zones around the area' },
    { label: 'Pilot license is valid' },
    { label: 'Wind gusts of 26 km/h at 15:00' },
    { label: 'Drone and battery ready' },
  ],
  liveFeatureSection: {
    eyebrow: 'Features · Monitoring and results',
    title: 'Watch the drone live, receive verified media',
    copy: 'Track position, battery, and altitude in real time. After the flight, photos and videos are checked before delivery.',
  },
  liveFeatureHighlights: [
    {
      title: 'Livestream and realtime map',
      detail: 'Watch live footage along with the mission route and waypoints.',
    },
    {
      title: 'Media checked before delivery',
      detail:
        'Faulty files are reprocessed; only passing files appear in your library.',
    },
    {
      title: 'Results library always ready',
      detail:
        'Download single files or whole missions and review order history anytime.',
    },
  ],
  livePanel: {
    title: 'Live tracking · MSN-2609-0142-1',
    resultsTitle: 'Results received',
    fileCount: '20 files',
  },
  industriesSection: {
    eyebrow: 'Use cases',
    title: 'For every aerial monitoring need',
    copy: 'One common workflow, many service types. Pick the right service when creating a request.',
  },
  industries: [
    {
      title: 'Construction',
      detail:
        'Track progress, measure volumes, and capture full site overviews.',
      location: 'Thu Thiem, Ho Chi Minh City',
    },
    {
      title: 'Agriculture',
      detail: 'Assess crops and soil condition across large areas.',
      location: 'Dak Lak',
    },
    {
      title: 'Power and telecom',
      detail: 'Inspect poles, lines, and stations in hard-to-reach places.',
      location: 'Binh Duong',
    },
    {
      title: 'Traffic and urban areas',
      detail: 'Observe traffic flow, intersections, and infrastructure condition.',
      location: 'Da Nang',
    },
    {
      title: 'Real estate',
      detail: 'Record projects, sites, and land-use planning.',
      location: 'Nha Be, Ho Chi Minh City',
    },
    {
      title: 'Events and security',
      detail: 'Monitor crowded areas while an event takes place.',
      location: 'Hanoi',
    },
  ],
  faqSection: {
    eyebrow: 'Frequently asked questions',
    title: 'Quick answers',
    copy: 'Need more help? Contact support@odms.vn or ask the AI assistant at the bottom right of the screen.',
  },
  faqItems: [
    {
      question: 'What do I need to create a monitoring request?',
      answer:
        'You only need a customer account, a location and radius on the map, a service type, and a preferred time slot. The system checks feasibility as soon as you finish the last step.',
    },
    {
      question: 'How long until my order is approved?',
      answer:
        'Usually within 2 working hours. Orders with a high feasibility score are typically approved faster.',
    },
    {
      question: 'What if the weather is bad?',
      answer:
        'The system notifies you and suggests alternative time slots. You are not charged when a mission is postponed because of weather.',
    },
    {
      question: 'Can I watch the drone fly live?',
      answer:
        'Yes. While the mission is IN_FLIGHT, you can watch the livestream, position, battery, and altitude in real time.',
    },
    {
      question: 'Where are photos and videos delivered?',
      answer:
        'In your account results library, once the files have passed the quality check.',
    },
  ],
  ctaSection: {
    eyebrow: 'Ready to monitor your area?',
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
  footerCopyright: '© 2026 OnDemand Monitor. Capstone project FA26SE039.',
  footerLegal: 'Terms of use · Privacy',
  footerBrandDescription:
    'On-demand drone monitoring service.\nHo Chi Minh City, Vietnam.',
  navLinks: [
    { label: 'How it works' },
    { label: 'Features' },
    { label: 'Use cases' },
    { label: 'FAQ' },
    { label: 'Help Center' },
  ],
}

export { overlay }
