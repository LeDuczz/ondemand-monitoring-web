import type { HelpContent } from './helpArticles'

/** English help center copy, written for English readers (not a line-by-line translation). */
export const helpContentEn: HelpContent = {
  topics: {
    ORDERS: {
      title: 'Orders',
      description: 'Manage monitoring requests, approval status and the scope of your area',
    },
    MISSIONS: {
      title: 'Flight missions',
      description: 'Flight scheduling, drone assignment, preflight checks and mission execution',
    },
    RESULTS: {
      title: 'Monitoring results',
      description: 'High-resolution photos, heat maps, video reports and download options',
    },
    MEDIA: {
      title: 'Media & live view',
      description: 'Real-time telemetry, camera feeds and video playback',
    },
    SCHEDULING: {
      title: 'Flight scheduling',
      description: 'Rescheduling, cancellations and operator availability',
    },
    ACCOUNT: {
      title: 'Account & access',
      description: 'Profile updates, notifications, organization roles and API access',
    },
  },
  articles: {
    'ord-1': {
      question: 'Why is my monitoring request still pending approval?',
      answer:
        'A request stays in PENDING APPROVAL while an operations manager checks the airspace, reviews the weather forecast and assigns a suitable drone and a certified pilot. Approval usually takes 15 to 30 minutes during business hours.',
      keywords: ['pending', 'approval', 'waiting', 'why', 'delay', 'request', 'status'],
    },
    'ord-2': {
      question: 'Why was my monitoring request rejected?',
      answer:
        'A request can be rejected because of a temporary airspace restriction (NOTAM), a severe weather warning or invalid GPS coordinates. You will get a notification stating the exact reason, along with guidance on how to adjust and resubmit.',
      keywords: ['rejected', 'declined', 'airspace', 'weather', 'why', 'denied'],
    },
    'ord-3': {
      question: 'Can I change the schedule after submitting a request?',
      answer:
        'Yes. You can ask to change the flight time up to 2 hours before the planned departure. Open the order details page and choose "Change flight schedule". If the mission is already in PREFLIGHT or IN FLIGHT, contact Support directly.',
      keywords: ['change', 'edit', 'reschedule', 'flight time', 'date', 'schedule'],
    },
    'ord-4': {
      question: 'Can I cancel a monitoring request?',
      answer:
        'You can cancel a request that is PENDING APPROVAL or APPROVED at no charge. Once the mission is IN FLIGHT, cancelling has to follow the flight safety procedure.',
      keywords: ['cancel', 'stop', 'abort', 'withdraw', 'delete', 'refund'],
    },
    'msn-1': {
      question: 'Why has my drone mission not started yet?',
      answer:
        'A mission starts at its scheduled time once the automated preflight checks pass in full. If the drone is calibrating its battery or waiting for a telemetry lock, departure can slip by 2 to 5 minutes.',
      keywords: ['not started', 'delay', 'late', 'takeoff', 'mission', 'waiting'],
    },
    'msn-2': {
      question: 'Why was the drone assigned to me replaced?',
      answer:
        'The fleet system swaps a drone automatically when preflight telemetry shows a battery imbalance, a motor temperature deviation or a sensor calibration warning. A backup drone is assigned immediately so the mission does not fail.',
      keywords: ['drone swap', 'replacement', 'different drone', 'hardware', 'preflight'],
    },
    'msn-3': {
      question: 'What happens if a mission fails its preflight check?',
      answer:
        'When the preflight check fails (FAILED_PREFLIGHT), the affected drone is sent to maintenance. A system operator then assigns another available drone within 10 minutes, or reschedules the flight at no extra cost.',
      keywords: ['preflight failed', 'check failed', 'maintenance', 'failure', 'reschedule'],
    },
    'msn-4': {
      question: 'Why did the operator pause or reschedule my flight?',
      answer:
        'Operators can pause or stop a flight when wind gusts exceed the safe limit (over 12 m/s), visibility drops, or an emergency airspace restriction is issued. Safety always comes first.',
      keywords: ['paused', 'stopped', 'rescheduled', 'wind', 'operator', 'weather'],
    },
    'res-1': {
      question: 'Where can I view and download my monitoring results?',
      answer:
        'Once post-flight processing finishes, go to Order details and open the Results tab. You can browse the 4K orthomosaic images and heat maps, and download the full-resolution GeoTIFF or ZIP package directly.',
      keywords: ['view', 'download', 'results', 'images', 'photos', 'report'],
    },
    'res-2': {
      question: 'Why are my results still processing or missing video?',
      answer:
        'Post-flight media goes through automatic AI stitching and quality control. 4K video rendering and heat map generation normally finish within 15 to 20 minutes after landing.',
      keywords: ['processing', 'missing', 'video', 'stitching', 'waiting', 'upload'],
    },
    'res-3': {
      question: 'How long is my monitoring data kept in the cloud?',
      answer:
        'By default, raw video is kept for 90 days and processed orthomosaic images for 365 days. You can extend retention indefinitely in your account settings.',
      keywords: ['storage', 'retention', 'how long', 'expire', 'cloud'],
    },
    'res-4': {
      question: 'Why are my monitoring results incomplete?',
      answer:
        'If the drone returned early because of low battery or bad weather, the results only cover part of the monitored area. The system automatically schedules a follow-up mission for the remaining area.',
      keywords: ['incomplete', 'partial', 'coverage', 'cut short', 'missing area'],
    },
    'med-1': {
      question: 'Why is the live stream unavailable during the flight?',
      answer:
        'Live streaming needs an active 5G/LTE telemetry link. On remote flight corridors with weak cellular signal, the stream falls back to buffered mode, and the full HD video uploads automatically after landing.',
      keywords: ['livestream', 'live', 'black screen', 'unavailable', '5g', 'telemetry'],
    },
    'med-2': {
      question: 'Why did my video upload fail?',
      answer:
        'Video uploads retry automatically up to 3 times over the ground station Wi-Fi. If the network was interrupted, select "Retry upload" on the Media management screen.',
      keywords: ['upload failed', 'video error', 'retry', 'upload'],
    },
    'med-3': {
      question: 'How do I share the live stream with my field team?',
      answer:
        'In the live player, select "Share viewing link". You can create a temporary secure URL, optionally protected by a passcode, for stakeholders on site.',
      keywords: ['share', 'link', 'access', 'team', 'invite'],
    },
    'sch-1': {
      question: 'What are the standard flight operating hours?',
      answer:
        'Standard flights run daily from 06:00 to 18:00 (daylight hours). Night monitoring needs a special thermal certification and must be booked in advance with a coordinator.',
      keywords: ['flight hours', 'time window', 'night', 'schedule', 'when'],
    },
    'acc-1': {
      question: 'How do I add a team member to my organization?',
      answer:
        'Go to Organization settings, open Team members and select "Invite member". Assign a role such as Viewer, Manager or Billing admin.',
      keywords: ['invite', 'team', 'member', 'user', 'role', 'permission'],
    },
  },
}
