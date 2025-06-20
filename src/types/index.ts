export type TrusteeRole = 
  | 'President'
  | 'Vice President'
  | 'Secretary'
  | 'Treasurer'
  | 'Managing Trustee'
  | 'Program Director'
  | 'Impact Analyzer'
  | 'Logistics Coordinator'
  | 'Digital Engagement Coordinator'
  | 'Volunteer Coordinator'
  | 'Volunteer'
  | 'IT Team'
  | 'Social Media Team'
  | 'General Trustee';

export type AccountStatus = 'pending' | 'active' | 'inactive';

export type Permission = 'read' | 'write' | 'admin';

export type ResourceType = 'finances' | 'members' | 'activities' | 'meetings' | 'donations';

export interface RolePermissions {
  finances?: Permission;
  members?: Permission;
  activities?: Permission;
  meetings?: Permission;
  donations?: Permission;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: Date;
  photo?: string | null;
  trusteeRole?: TrusteeRole | null;
  roleStartDate?: Date | null;
  roleEndDate?: Date | null;
  accountStatus: string;
  permissions: Record<string, boolean>;
  password: string;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  date: Date;
  month: string;
  year: number;
}

export interface Donation {
  id: string;
  donor: string;
  amount: number;
  date: Date;
  purpose: string;
  notes?: string | null;
  type?: string | null;
  memberId?: string | null;
  member?: {
    name: string;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  paymentMethod: string;
  paidTo: string;
  billNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  status: string;
  organizer: string;
  maxParticipants: number | null;
  currentParticipants: number | null;
  budget: number | null;
  actualAmount: number | null;
  contributionDate: Date | null;
  contributionNotes: string | null;
  expenses: number | null;
  notes: string | null;
  participants?: ActivityParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityParticipant {
  activityId: string;
  memberId: string;
  activity: Activity;
  member: Member;
  role?: string;
  status?: string;
  notes?: string;
}

export interface WorkshopResource {
  id?: string;
  name: string;
  specialization: string;
  type: 'member' | 'external';
  expertise: string[];
  reference: {
    name: string;
    relationship: string;
    contactDetails: {
      email: string;
      phone: string;
    };
  };
  contactDetails: {
    email: string;
    phone: string;
    address: string;
  };
  availability: string;
  previousWorkshops: string;
  notes: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MeetingAttendee {
  id: string;
  memberId: string;
  meetingId: string;
  role?: string;
  present: boolean;
  member: Member;
}

export interface MeetingDecision {
  id: string;
  meetingId: string;
  decision: string;
}

export interface MeetingAttachment {
  id: string;
  meetingId: string;
  name: string;
  url: string;
  type: string;
}

export interface Meeting {
  id?: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  agenda: string;
  minutes: string;
  attendees: MeetingAttendee[];
  decisions: MeetingDecision[];
  attachments: MeetingAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
} 