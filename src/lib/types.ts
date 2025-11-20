export type AdminPrivileges = {
  canManageUsers: boolean;
  canManageContent: boolean;
  canManageSettings: boolean;
  canUploadDocs: boolean;
  canEditPhoneNumbers: boolean;
};

export type User = {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: "user" | "admin" | "superadmin" | "staff";
  profilePhoto?: string | null;
  profilePhotoUrl?: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  fullName?: string;
  adminPrivileges?: AdminPrivileges;
  // Additional fields from backend response (api.md)
  location?: { city?: string; state?: string; country?: string; coordinates?: { latitude: number; longitude: number } };
  address?: { line1?: string; line2?: string; city?: string; state?: string; zipCode?: string; country?: string };
  businessDetails?: { businessType?: string };
  profileVisibility?: "public" | "private";
  preferredLanguage?: "en" | "hi" | "mr";
  lastActive?: string;
  createdAt?: string;
  updatedAt?: string;
  // Profile fields
  education?: string;
  occupation?: string;
  aadhaarNumber?: string;
  dateOfBirth?: string;
  description?: string;
  plainTextPassword?: string; // Only in create responses
  // Team information (from /api/users/me response)
  teams?: Array<{
    id: string;
    _id?: string;
    name: string;
    leaderId?: string;
    isLeader: boolean;
    isMember?: boolean;
    leaderName?: string;
  }>;
};

export type ChangedBy = {
  id: string;
  name?: string;
  role?: string;
  isTeamLeader?: boolean;
  displayRole?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type AgencyContact = {
  _id: string;
  name: string;
  designation: string;
  phoneNumbers: Array<{ number: string; type: string; _id?: string }>;
  agencyName: string;
  agencyType: "police" | "fire" | "medical" | "municipal" | "government" | "other";
  zone: string;
  area?: string;
  isEmergencyContact?: boolean;
  priority?: number;
  addedBy?: string | User;
  lastUpdatedBy?: string | User;
  isActive?: boolean;
};

// Align pagination with backend shape provided in API
export type Pagination = {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type ComplaintComment = {
  _id?: string;
  text: string;
  author: User | string;
  createdAt?: string;
};

export type Complaint = {
  _id: string;
  subject?: string;
  title?: string;
  description?: string;
  status: "open" | "in_progress" | "resolved" | "rejected";
  user?: User | string;
  assignedTo?: User | string | null;
  createdAt?: string;
  updatedAt?: string;
  comments?: ComplaintComment[];
  [key: string]: unknown;
};

// Tickets (new API)
export type TicketCategory =
  // Legacy/previous categories (still allowed from backend)
  | "complaint"
  | "support"
  | "bug"
  | "feature_request"
  | "general"
  | "technical"
  | "billing"
  // New municipal categories
  | "sanitation"
  | "water_supply"
  | "electricity"
  | "roads"
  | "streetlights"
  | "drainage"
  | "public_safety"
  | "healthcare"
  | "education"
  | "transport"
  | "municipal_services"
  | "pollution"
  | "encroachment"
  | "property_tax_billing"
  | "other";

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "pending_user"
  | "pending_admin"
  | "resolved"
  | "closed";

export type Ticket = {
  _id: string;
  id?: string;
  ticketNumber?: string;
  title: string;
  description: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status: TicketStatus;
  createdBy?: User | string;
  reportedBy?: User;
  coordinates?: { latitude: number; longitude: number }; // Direct coordinates for team tickets
  location?: { 
    zone?: string; 
    city?: string; 
    state?: string; 
    area?: string;
    coordinates?: { latitude: number; longitude: number };
  };
  tags?: string[];
  escalated?: boolean;
  slaBreached?: boolean;
  isPublic?: boolean;
  attachments?: Array<{
    filename: string;
    url: string;
    publicId: string;
    size: number;
    mimeType: string;
    _id: string;
  }>;
  internalNotes?: Array<{ note: string; addedAt?: string; addedBy?: User | string }>;
  adminNotes?: Array<{ note: string; addedAt?: string; addedBy?: User | string; _id?: string }>;
  assignedTeams?: Array<{
    _id: string;
    name: string;
    areas: Array<{
      zone: string;
      area: string;
      city: string;
      state: string;
    }>;
    isActive: boolean;
  }>;
  // Single member owning the ticket (team-level workflow)
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "user" | "admin" | "superadmin" | "staff";
    isLeader?: boolean;
  } | User | null;
  changeHistory?: Array<{
    _id: string;
    field?: string;
    oldValue?: unknown;
    newValue?: unknown;
    changedBy?: User | string | {
      id: string;
      name: string;
      role: string;
      isTeamLeader?: boolean;
      displayRole?: string;
    };
    changeType?: string;
    description?: string;
    changedAt?: string;
  }>;
  age?: number;
  isOverdue?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

// Team type (based on api.md)
export type Team = {
  _id: string;
  name: string;
  description: string;
  employees: Array<User & { isLeader: boolean }>;
  areas: Array<{
    zone: string;
    area: string;
    city: string;
    state: string;
  }>;
  isActive: boolean;
  addedBy: User | string;
  lastUpdatedBy: User | string;
  leaderId?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

export type TicketStatusTotals = {
  open: number;
  assigned: number;
  in_progress: number;
  pending_user: number;
  pending_admin: number;
  resolved: number;
  closed: number;
  total: number;
};

export type TeamMemberStat = {
  member: {
    id: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    role?: string;
    isLeader?: boolean;
  };
  stats: TicketStatusTotals;
};

export type TeamStatsResponse = {
  team?: {
    id: string;
    name: string;
    description?: string;
  };
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  teamTotals: TicketStatusTotals;
  members: TeamMemberStat[];
};

export type AdminTeamStatsResponse = {
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  overallTotals: TicketStatusTotals;
  totalTeams: number;
  teams: Array<{
    team: {
      id: string;
      name: string;
      description?: string;
      areas?: Array<{
        zone: string;
        area: string;
        city: string;
        state: string;
      }>;
    };
    teamStats: TicketStatusTotals;
    members: TeamMemberStat[];
  }>;
};

// Category type
export type Category = {
  id: string;
  name: string;
  description: string;
  team?: {
    _id: string;
    name: string;
  } | null;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    fullName: string;
    id: string;
  };
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

// SubCategory type
export type SubCategory = {
  id: string;
  name: string;
  description: string;
  category: {
    _id: string;
    name: string;
    team: string;
    id: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    fullName: string;
    id: string;
  };
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

