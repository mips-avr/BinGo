export type OrganizationType = 'MANAGER' | 'BUSINESS';
export type OrganizationStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED';

export interface OrganizationApplicationSummary {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType;
  status: OrganizationStatus;
  version: number;
  submittedAt: string | null;
  documentCount?: number;
  latestReason?: string | null;
}

export interface RoleDashboard {
  role: string;
  demo: boolean;
  title: string;
  metrics: Array<{ label: string; value: string; hint?: string }>;
  tasks: Array<{ id: string; title: string; detail: string; status: string; href?: string }>;
}

export interface SyncResult {
  deviceEventId: string;
  result: 'accepted' | 'duplicate' | 'rejected';
  reason?: string;
}
