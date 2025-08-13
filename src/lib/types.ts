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
  role: "user" | "admin" | "superadmin";
  profilePhoto?: string | null;
  profilePhotoUrl?: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  fullName?: string;
  adminPrivileges?: AdminPrivileges;
  // Additional fields present in backend response
  location?: { city?: string; state?: string; country?: string; coordinates?: { latitude: number; longitude: number } };
  address?: { line1?: string; line2?: string; city?: string; state?: string; zipCode?: string; country?: string };
  profileVisibility?: "public" | "private";
  preferredLanguage?: string;
  lastActive?: string;
  createdAt?: string;
  updatedAt?: string;
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
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

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
  location?: { zone?: string; city?: string; state?: string; area?: string };
  tags?: string[];
  escalated?: boolean;
  slaBreached?: boolean;
  isPublic?: boolean;
  attachments?: unknown[];
  internalNotes?: Array<{ note: string; addedAt?: string; addedBy?: User | string }>;
  adminNotes?: Array<{ note: string; addedAt?: string; addedBy?: User | string }>;
  age?: number;
  isOverdue?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

