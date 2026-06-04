export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  status: 'ACTIVE' | 'INACTIVE';
  roles: string[];
  userRoles?: UserRole[];
}

export interface Role {
  id: string;
  name: string;
}

export interface UserRole {
  id: string;
  role: Role;
}

export interface TeamMembership {
  id: string;
  user_id: string;
  shirt_number?: number;
  user: User;
}

export type EventType = 'TRAINING' | 'MATCH' | 'OTHER';
export type ParticipationStatus = 'ACCEPTED' | 'DECLINED' | 'PENDING';

export interface Event {
  id: string;
  type: EventType;
  title: string;
  location?: string;
  starts_at: string;
  response_deadline?: string;
  notes?: string;
  is_cancelled: boolean;
  created_at: string;
  my_participation?: Participation | null;
}

export interface Participation {
  id: string;
  event_id: string;
  user_id: string;
  status: ParticipationStatus;
  decline_reason?: string;
  responded_at: string;
  user?: User;
}

export type FineStatus = 'OPEN' | 'PAID' | 'CANCELLED';

export interface FineCategory {
  id: string;
  name: string;
  default_amount: number;
  is_active: boolean;
}

export interface Fine {
  id: string;
  user_id: string;
  fine_category_id: string;
  amount: number;
  status: FineStatus;
  notes?: string;
  assigned_at: string;
  user?: User;
  fine_category?: FineCategory;
}

export type PaymentProvider = 'MANUAL' | 'PAYPAL_LINK';
export type LedgerEntryType = 'INCOME' | 'EXPENSE';

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  provider: PaymentProvider;
  notes?: string;
  paid_at: string;
  user?: User;
  fine_payment_links?: FinePaymentLink[];
}

export interface FinePaymentLink {
  id: string;
  fine_id: string;
  payment_id: string;
  allocated_amount: number;
  fine?: Fine;
}

export interface CashLedgerEntry {
  id: string;
  type: LedgerEntryType;
  category?: string;
  amount: number;
  note?: string;
  occurred_at: string;
  recorded_by?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  is_read: boolean;
  created_at: string;
}

export interface AttendanceReport {
  user_id: string;
  name: string;
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  acceptance_rate: number;
}

export interface FinesReport {
  user_id: string;
  name: string;
  count: number;
  total_amount: number;
  open_amount: number;
  paid_amount: number;
}
