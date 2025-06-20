import { TrusteeRole } from './index';

export type Permission =
  // Member permissions
  | 'members.view'
  | 'members.create'
  | 'members.edit'
  | 'members.delete'
  // Meeting permissions
  | 'meetings.view'
  | 'meetings.create'
  | 'meetings.edit'
  | 'meetings.delete'
  // Donation permissions
  | 'donations.view'
  | 'donations.create'
  | 'donations.edit'
  | 'donations.delete'
  // Activity permissions
  | 'activities.view'
  | 'activities.create'
  | 'activities.edit'
  | 'activities.delete'
  // Workshop permissions
  | 'workshops.view'
  | 'workshops.create'
  | 'workshops.edit'
  | 'workshops.delete'
  // Expense permissions
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.edit'
  | 'expenses.delete'
  | 'expenses.approve'
  // Report permissions
  | 'reports.view'
  | 'reports.generate'
  // Settings permissions
  | 'settings.view'
  | 'settings.edit'
  // Links permissions
  | 'links.view'
  | 'links.create'
  | 'links.edit'
  | 'links.delete';

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<TrusteeRole, Permission[]> = {
  'President': [
    'members.view', 'members.create', 'members.edit', 'members.delete',
    'meetings.view', 'meetings.create', 'meetings.edit', 'meetings.delete',
    'donations.view', 'donations.create', 'donations.edit', 'donations.delete',
    'activities.view', 'activities.create', 'activities.edit', 'activities.delete',
    'workshops.view', 'workshops.create', 'workshops.edit', 'workshops.delete',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete', 'expenses.approve',
    'reports.view', 'reports.generate',
    'settings.view', 'settings.edit',
    'links.view', 'links.create', 'links.edit', 'links.delete'
  ],
  'Vice President': [
    'members.view', 'members.create', 'members.edit', 'members.delete',
    'meetings.view', 'meetings.create', 'meetings.edit', 'meetings.delete',
    'donations.view', 'donations.create', 'donations.edit', 'donations.delete',
    'activities.view', 'activities.create', 'activities.edit', 'activities.delete',
    'workshops.view', 'workshops.create', 'workshops.edit', 'workshops.delete',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.approve',
    'reports.view', 'reports.generate',
    'settings.view', 'settings.edit',
    'links.view', 'links.create', 'links.edit', 'links.delete'
  ],
  'Secretary': [
    'members.view', 'members.create', 'members.edit', 'members.delete',
    'meetings.view', 'meetings.create', 'meetings.edit', 'meetings.delete',
    'activities.view', 'activities.create', 'activities.edit', 'activities.delete',
    'workshops.view', 'workshops.create', 'workshops.edit', 'workshops.delete',
    'reports.view', 'reports.generate',
    'links.view', 'links.create', 'links.edit', 'links.delete'
  ],
  'Treasurer': [
    'donations.view', 'donations.create', 'donations.edit', 'donations.delete',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete', 'expenses.approve',
    'reports.view', 'reports.generate',
    'links.view'
  ],
  'Managing Trustee': [
    'members.view', 'members.create', 'members.edit', 'members.delete',
    'meetings.view', 'meetings.create', 'meetings.edit', 'meetings.delete',
    'activities.view', 'activities.create', 'activities.edit', 'activities.delete',
    'workshops.view', 'workshops.create', 'workshops.edit', 'workshops.delete',
    'expenses.view', 'expenses.create', 'expenses.edit',
    'reports.view', 'reports.generate',
    'links.view', 'links.create', 'links.edit', 'links.delete'
  ],
  'Program Director': [
    'activities.view', 'activities.create', 'activities.edit', 'activities.delete',
    'workshops.view', 'workshops.create', 'workshops.edit', 'workshops.delete',
    'expenses.view', 'expenses.create', 'expenses.edit',
    'reports.view', 'reports.generate',
    'links.view', 'links.create', 'links.edit', 'links.delete'
  ],
  'Impact Analyzer': [
    'members.view',
    'meetings.view',
    'donations.view',
    'activities.view', 'activities.edit', 'activities.delete',
    'workshops.view', 'workshops.edit', 'workshops.delete',
    'expenses.view',
    'reports.view', 'reports.generate',
    'links.view'
  ],
  'Logistics Coordinator': [
    'activities.view', 'activities.create', 'activities.edit', 'activities.delete',
    'workshops.view', 'workshops.create', 'workshops.edit', 'workshops.delete',
    'expenses.view', 'expenses.create', 'expenses.edit',
    'links.view', 'links.create', 'links.edit'
  ],
  'Digital Engagement Coordinator': [
    'activities.view', 'activities.create', 'activities.edit', 'activities.delete',
    'workshops.view', 'workshops.create', 'workshops.edit', 'workshops.delete',
    'reports.view', 'reports.generate',
    'links.view', 'links.create', 'links.edit', 'links.delete'
  ],
  'Volunteer Coordinator': [
    'members.view', 'members.create', 'members.edit', 'members.delete',
    'activities.view', 'activities.create', 'activities.edit', 'activities.delete',
    'workshops.view', 'workshops.create', 'workshops.edit', 'workshops.delete',
    'links.view'
  ],
  'IT Team': [
    'members.view', 'members.edit', 'members.delete',
    'settings.view', 'settings.edit',
    'links.view', 'links.create', 'links.edit', 'links.delete'
  ],
  'Social Media Team': [
    'activities.view', 'activities.create', 'activities.edit', 'activities.delete',
    'workshops.view', 'workshops.create', 'workshops.edit', 'workshops.delete',
    'links.view', 'links.create', 'links.edit'
  ],
  'Volunteer': [
    'members.view',
    'meetings.view',
    'donations.view',
    'activities.view',
    'workshops.view',
    'expenses.view',
    'reports.view',
    'links.view'
  ],
  'General Trustee': [
    'members.view',
    'meetings.view',
    'donations.view',
    'activities.view',
    'workshops.view',
    'expenses.view',
    'reports.view',
    'links.view'
  ]
}; 