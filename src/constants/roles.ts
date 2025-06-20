import { TrusteeRole } from '@/types';

export const TRUSTEE_ROLES: { role: TrusteeRole; description: string; order: number }[] = [
  { role: 'President', description: 'Leads the trust and oversees all operations', order: 1 },
  { role: 'Vice President', description: 'Assists the president and acts in their absence', order: 2 },
  { role: 'Secretary', description: 'Manages documentation, meetings, and member records', order: 3 },
  { role: 'Treasurer', description: 'Manages financial records, donations, and expenses', order: 4 },
  { role: 'Managing Trustee', description: 'Handles day-to-day trust operations', order: 5 },
  { role: 'Program Director', description: 'Oversees and coordinates trust programs', order: 6 },
  { role: 'Impact Analyzer', description: 'Analyzes and reports on program effectiveness and social impact', order: 7 },
  { role: 'Logistics Coordinator', description: 'Manages event logistics and resources', order: 8 },
  { role: 'Digital Engagement Coordinator', description: 'Oversees digital presence and technology', order: 9 },
  { role: 'Volunteer Coordinator', description: 'Manages volunteer recruitment and coordination', order: 10 },
  { role: 'IT Team', description: 'Manages technical infrastructure', order: 11 },
  { role: 'Social Media Team', description: 'Handles social media presence', order: 12 },
  { role: 'Volunteer', description: 'Actively participates in trust activities', order: 13 },
  { role: 'General Trustee', description: 'Core member of the trust', order: 14 }
];

export const getRoleDescription = (role: TrusteeRole): string => {
  const roleInfo = TRUSTEE_ROLES.find(r => r.role === role);
  return roleInfo?.description || 'Member of the trust';
};

export const getRoleOrder = (role: TrusteeRole): number => {
  const roleInfo = TRUSTEE_ROLES.find(r => r.role === role);
  return roleInfo?.order || 999;
}; 