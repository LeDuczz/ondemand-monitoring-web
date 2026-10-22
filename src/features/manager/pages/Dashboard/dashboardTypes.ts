import type { ActionItem } from '../../types/dashboard'
import { dashboardPageMessages } from './DashboardPage.messages'

export type ActionItemType = ActionItem['type']

export type PageMessages = (typeof dashboardPageMessages)['vi']
