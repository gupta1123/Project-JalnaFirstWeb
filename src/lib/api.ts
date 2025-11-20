"use client";

import axios from "axios";
import Cookies from "js-cookie";
import type { User, AgencyContact, Pagination, Complaint, Ticket, TicketStatus, Team, Category, SubCategory, TeamStatsResponse } from "./types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://jalnafirst-d1c348495722.herokuapp.com";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable cookies for secure auth
});

// Add request interceptor for Bearer token (fallback for current implementation)
api.interceptors.request.use((config) => {
  const token = Cookies.get("ss_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      // Clear any existing token
      try { 
        Cookies.remove("ss_token"); 
      } catch {}
      
      // Redirect to login with current path as next parameter
      const next = window.location.pathname || "/";
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null) {
  if (token) Cookies.set("ss_token", token, { sameSite: "lax" });
  else Cookies.remove("ss_token");
}

export function clearAuthToken() {
  Cookies.remove("ss_token");
}

export type LoginPayload = { email: string; password: string };
export async function login(payload: LoginPayload): Promise<{ message: string; token: string; user: User }>{
  const res = await api.post("/api/auth/login", payload);
  return res.data as { message: string; token: string; user: User };
}

// Register (from docs #1)
export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  // Optional location coordinates during registration (docs #7)
  location?: {
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
};
export async function register(payload: RegisterPayload) {
  const res = await api.post("/api/auth/register", payload);
  return res.data as { message: string; token: string; user: User };
}

export async function getCurrentUser(): Promise<User> {
  const res = await api.get("/api/users/me");
  return res.data.user as User;
}

// Admins
export async function getAdmins(): Promise<User[]> {
  const res = await api.get("/api/admin/admins");
  return res.data.admins as User[];
}

export async function createAdmin(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "admin" | "superadmin";
}) {
  // Based on api.md - Create Admin endpoint (Only for Super admin)
  const res = await api.post("/api/admin/create", payload);
  return res.data as {
    message: string;
    admin: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      privileges: {
        canManageUsers: boolean;
        canManageContent: boolean;
        canManageSettings: boolean;
        canUploadDocs: boolean;
        canEditPhoneNumbers: boolean;
      };
    };
  };
}

// Setup & Superadmin (from docs #4-#9)
export async function checkAdminExists(): Promise<{ exists: boolean; admin?: { id: string; email: string; role: string } }>{
  const res = await api.get("/api/setup/check-admin");
  return res.data;
}

export async function resetAdminPassword(payload: { email: string; newPassword: string }) {
  const res = await api.post("/api/setup/reset-admin-password", payload);
  return res.data as { message: string; admin: { id: string; email: string; role: string } };
}

export async function checkSuperadmin(): Promise<{ exists: boolean; superadmin?: { id: string; email: string; firstName?: string; lastName?: string } }>{
  const res = await api.get("/api/setup/check-superadmin");
  return res.data;
}

export async function createSuperadmin(payload: { email: string; password: string; firstName: string; lastName: string }) {
  const res = await api.post("/api/setup/create-superadmin", payload);
  return res.data as { message: string; superadmin: { id: string; email: string; role: string } };
}

export async function deleteUserByEmail(email: string) {
  const res = await api.delete(`/api/setup/delete-user/${encodeURIComponent(email)}`);
  return res.data as { message: string; deletedUser?: { id: string; email: string; role: string } };
}

// Users (assumed list/detail endpoints)
export async function getUsers(params?: { search?: string; page?: number; limit?: number; role?: string; isActive?: boolean }) {
  try {
    const res = await api.get("/api/users", { params });
    return res.data as { users: User[]; pagination?: Pagination };
  } catch (err: unknown) {
    // Graceful fallback if endpoint not present yet
    return { users: [], pagination: undefined } as { users: User[]; pagination?: Pagination };
  }
}

export async function getUserById(id: string): Promise<User> {
  const res = await api.get(`/api/users/${id}`);
  return res.data.user as User;
}

// User Stats (based on api.md)
export async function getUserStats(): Promise<{
  totalUsers: number;
  usersThisWeek: number;
  usersThisMonth: number;
}> {
  const res = await api.get("/api/admin/user-stats");
  return res.data;
}

// Agency Contacts
export type AgencyContactPayload = {
  name: string;
  designation: string;
  phoneNumbers: Array<{ number: string; type: string }>;
  agencyName: string;
  agencyType: "police" | "fire" | "medical" | "municipal" | "government" | "other";
  zone: string;
  area?: string;
};

export async function getAgencyContacts(params?: {
  agencyType?: string;
  zone?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ contacts: AgencyContact[]; pagination: Pagination }> {
  const res = await api.get("/api/agency-contacts", { params });
  return res.data as { contacts: AgencyContact[]; pagination: Pagination };
}

export async function createAgencyContact(payload: AgencyContactPayload) {
  const res = await api.post("/api/agency-contacts", payload);
  return res.data;
}

export async function updateAgencyContact(id: string, payload: Partial<AgencyContactPayload>) {
  const res = await api.put(`/api/agency-contacts/${id}`, payload);
  return res.data;
}

export async function deleteAgencyContact(id: string) {
  const res = await api.delete(`/api/agency-contacts/${id}`);
  return res.data;
}

// Profile (based on api.md)
export async function updateProfile(payload: {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  description?: string;
  education?: string;
  dateOfBirth?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: { latitude: number; longitude: number };
  };
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  profileVisibility?: "public" | "private";
  preferredLanguage?: "en" | "hi" | "mr";
  aadhaarNumber?: string | number;
  occupation?: string;
  businessDetails?: { businessType?: string };
}) {
  const res = await api.put("/api/users/me", payload);
  return res.data as { message: string; user: User };
}

export async function uploadProfilePhoto(file: File) {
  const form = new FormData();
  form.append("photo", file);
  const res = await api.post("/api/profile/photo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteProfilePhoto() {
  const res = await api.delete("/api/profile/photo");
  return res.data;
}

// Complaints (assumed endpoints)
export async function getComplaints(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  const res = await api.get("/api/complaints", { params });
  return res.data as { complaints: Complaint[]; pagination?: Pagination };
}

export async function getComplaintById(id: string): Promise<Complaint> {
  const res = await api.get(`/api/complaints/${id}`);
  return res.data.complaint as Complaint;
}

export async function updateComplaintStatus(id: string, status: Complaint["status"]) {
  const res = await api.post(`/api/complaints/${id}/status`, { status });
  return res.data;
}

export async function assignComplaint(id: string, userId: string) {
  const res = await api.post(`/api/complaints/${id}/assign`, { userId });
  return res.data;
}

export async function addComplaintComment(id: string, text: string) {
  const res = await api.post(`/api/complaints/${id}/comment`, { text });
  return res.data;
}

// Tickets API
export async function createTicket(payload: {
  title: string;
  description: string;
  category?: string;
  priority?: string;
  location?: { zone?: string; city?: string; state?: string; area?: string };
  tags?: string[];
}): Promise<{ message: string; ticket: Ticket }> {
  const res = await api.post("/api/tickets", payload);
  return res.data as { message: string; ticket: Ticket };
}

type AdminPagination = { currentPage: number; totalPages: number; totalTickets: number; hasNextPage: boolean; hasPrevPage: boolean };

export async function getMyTickets(params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}): Promise<{ tickets: Ticket[]; pagination?: AdminPagination }> {
  const res = await api.get("/api/tickets/my-tickets", { params });
  return res.data as { tickets: Ticket[]; pagination?: AdminPagination };
}

export async function getTicketById(id: string): Promise<Ticket> {
  const res = await api.get(`/api/tickets/${id}`);
  return res.data.ticket as Ticket;
}

export async function adminGetTickets(params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  userId?: string;
}): Promise<{ tickets: Ticket[]; pagination?: AdminPagination }> {
  const res = await api.get("/api/tickets/admin/all", { params });
  return res.data as { tickets: Ticket[]; pagination?: AdminPagination };
}

export async function adminGetTicketById(id: string): Promise<Ticket> {
  const res = await api.get(`/api/tickets/admin/${id}`);
  return res.data.ticket as Ticket;
}

export async function adminUpdateTicketStatus(id: string, payload: { status?: TicketStatus; resolutionNote?: string; slaDueDate?: string }) {
  const res = await api.put(`/api/tickets/admin/${id}`, payload);
  return res.data as { message: string; ticket: Ticket };
}

export async function adminAddNote(id: string, note: string) {
  const res = await api.post(`/api/tickets/admin/${id}/notes`, { note });
  return res.data as { message: string; adminNotes: Ticket["adminNotes"] };
}

// Ticket change history (admin)
export async function adminGetTicketHistory(id: string) {
  const res = await api.get(`/api/tickets/${id}/history`);
  return res.data;
}

// Staff Management (based on api.md)
export async function createStaff(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}) {
  const res = await api.post("/api/staff", payload);
  return res.data as {
    message: string;
    staff: User;
  };
}

export async function getStaff(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const res = await api.get("/api/staff", { params });
  return res.data as {
    staff: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
  };
}

export async function getTeamsWithSearch(params?: {
  page?: number;
  limit?: number;
  search?: string;
  zone?: string;
  isActive?: boolean;
}) {
  const res = await api.get("/api/teams", { params });
  return res.data as { teams: Team[]; pagination?: { currentPage: number; totalPages: number; total: number } };
}

export async function getStaffById(id: string) {
  const res = await api.get(`/api/staff/${id}`);
  return res.data.staff as User;
}

export async function updateStaff(id: string, payload: Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}>) {
  const res = await api.put(`/api/staff/${id}`, payload);
  return res.data;
}


export async function createTeam(payload: {
  name: string;
  description: string;
  areas: Array<{
    zone: string;
    area: string;
    city: string;
    state: string;
  }>;
}) {
  const res = await api.post("/api/teams", payload);
  return res.data as {
    message: string;
    team: Team;
  };
}

export async function getTeams(params?: {
  page?: number;
  limit?: number;
  search?: string;
  zone?: string;
  isActive?: boolean;
}) {
  const res = await api.get("/api/teams", { params });
  return res.data as {
    teams: Team[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
  };
}

export async function getTeamById(id: string): Promise<Team | null> {
  try {
    const res = await api.get(`/api/teams/${id}`);
    // Prefer res.data.team, but fall back to res.data if shape differs
    return (res.data?.team ?? res.data) as Team;
  } catch (e) {
    return null;
  }
}

export async function addEmployeesToTeam(teamId: string, employees: string[]) {
  const res = await api.post(`/api/teams/${teamId}/employees`, { employees });
  return res.data as {
    message: string;
    team: Team;
  };
}

export async function removeEmployeeFromTeam(teamId: string, employeeId: string) {
  const res = await api.delete(`/api/teams/${teamId}/employees/${employeeId}`);
  return res.data;
}

export async function updateTeamLeader(teamId: string, leaderId: string) {
  const res = await api.put(`/api/teams/${teamId}/leader`, { leaderId });
  return res.data as {
    message: string;
    team: Team;
  };
}

// Fetch team leader details
export async function getTeamLeader(teamId: string): Promise<User | null> {
  try {
    const res = await api.get(`/api/teams/${teamId}/leader`);
    const data = res.data as { leader?: User; user?: User; staff?: User; data?: User };
    const leader = data?.leader ?? data?.user ?? data?.staff ?? data?.data ?? null;
    return leader ?? null;
  } catch (e) {
    return null;
  }
}

// Get current user's team info from user object
export async function getCurrentUserTeamInfo(): Promise<{ isTeamLead: boolean; team?: Team } | null> {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser.role !== 'staff' || !currentUser.teams?.length) {
      return { isTeamLead: false };
    }

    // Find the team where user is a leader
    const leaderTeam = currentUser.teams.find(team => team.isLeader);
    
    if (!leaderTeam) {
      return { isTeamLead: false };
    }

    // Get full team details
    const fullTeam = await getTeamById(leaderTeam.id);
    
    return {
      isTeamLead: true,
      team: fullTeam || undefined
    };
  } catch (e) {
    return null;
  }
}

// Get team data for team lead view (supports { teams: Team[] } or { team: Team })
export async function getMyTeam(): Promise<{ team?: Team; teams?: Team[] }> {
  const res = await api.get("/api/teams/my");
  return res.data as { team?: Team; teams?: Team[] };
}

export async function assignTeamsToTicket(ticketId: string, teamIds: string[], mode: "add" | "replace" = "add") {
  const res = await api.post(`/api/tickets/admin/${ticketId}/assign-teams`, { teamIds, mode });
  return res.data as {
    message: string;
    ticket: Ticket;
  };
}

export async function getTeamTicketsMinimal(params?: {
  page?: number;
  limit?: number;
  status?: string;
  zone?: string;
  city?: string;
  state?: string;
  search?: string;
  category?: string; // id or name
  subCategory?: string; // id or name
}) {
  const res = await api.get("/api/tickets/team/minimal", { params });
  return res.data as {
    tickets: Array<{
      id: string;
      ticketNumber?: string;
      description: string;
      coordinates?: { latitude: number; longitude: number };
      attachments: unknown[];
      status: string;
      createdAt: string;
      assignedUser?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
      } | null;
      assignedTo?: {
        id: string;
        name: string;
      } | null;
      category?: {
        id: string;
        name: string;
        description?: string;
        isActive?: boolean;
      } | null;
      subCategory?: {
        id: string;
        name: string;
        description?: string;
        isActive?: boolean;
      } | null;
      assignedTeams?: Array<{
        id: string;
        name: string;
        isActive: boolean;
      }>;
      adminNotes?: unknown[];
      changeHistory?: unknown[];
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
  };
}

// Get a specific team ticket by ID using the team minimal feed.
// We iterate through pages so that:
// - Team leaders can open ANY ticket for their teams
// - Staff can open only tickets they are allowed to see
// - We still rely on the team-minimal shape (which includes status, assignedUser, etc.)
export async function getTeamTicketById(ticketId: string) {
  const pageSize = 50;
  let page = 1;

  // Loop through pages until we either find the ticket or exhaust all pages.
  // This avoids relying on the first page only (which caused some tickets
  // to appear as "not found" or with missing data).
  // The backend enforces access control on /tickets/team/minimal, so we
  // still respect visibility rules for staff vs. leaders.
  // NOTE: We intentionally do NOT add extra filters here so we don't
  // accidentally exclude the ticket.
  while (true) {
    const { tickets, pagination } = await getTeamTicketsMinimal({
      page,
      limit: pageSize,
    });

    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      return { ticket };
    }

    if (!pagination || page >= pagination.totalPages) {
      break;
    }

    page += 1;
  }

  return null;
}

export async function markTicketComplete(ticketId: string) {
  const res = await api.post(`/api/tickets/${ticketId}/complete`);
  return res.data as {
    message: string;
    ticket: Ticket;
  };
}

// Update ticket status (for staff) - using team endpoint
export async function updateTicketStatusTeam(ticketId: string, payload: {
  status: "in_progress" | "pending_user" | "pending_admin" | "resolved";
}) {
  const res = await api.put(`/api/tickets/team/${ticketId}/status`, payload);
  return res.data as { message: string; ticket?: Ticket };
}

// Update ticket status (for admin)
export async function updateTicketStatus(ticketId: string, payload: {
  status?: string;
  resolutionNote?: string;
  slaDueDate?: string;
}) {
  const res = await api.put(`/api/tickets/admin/${ticketId}`, payload);
  return res.data as { message: string; ticket: Ticket };
}


export async function uploadTicketAttachments(ticketId: string, files: File[], mode: "add" | "replace" = "add") {
  const form = new FormData();
  files.forEach(file => form.append("attachments", file));
  const res = await api.post(`/api/tickets/${ticketId}/attachments?mode=${mode}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as {
    message: string;
    attachments: Array<{
      filename: string;
      url: string;
      publicId: string;
      size: number;
      mimeType: string;
      _id: string;
    }>;
  };
}

export async function getTicketAttachments(ticketId: string) {
  const res = await api.get(`/api/tickets/${ticketId}/attachments`);
  return res.data as {
    attachments: Array<{
      filename: string;
      url: string;
      publicId: string;
      size: number;
      mimeType: string;
      _id: string;
      uploadedByRole?: string;
      uploadedBy?: {
        _id?: string;
        id?: string;
        role?: string;
        firstName?: string;
        lastName?: string;
        fullName?: string;
        email?: string;
      };
      uploadedByName?: string;
      uploadedAt?: string;
    }>;
  };
}

export async function deleteTicketAttachment(ticketId: string, attachmentId: string) {
  const res = await api.delete(`/api/tickets/${ticketId}/attachments/${attachmentId}`);
  return res.data as {
    message: string;
    attachments: unknown[];
  };
}


export async function getTicketCategories() {
  const res = await api.get("/api/tickets/categories");
  return res.data as {
    categories: string[];
  };
}


export type TicketStats = {
  overall?: { total?: number; open?: number; inProgress?: number; resolved?: number; closed?: number };
  byCategory?: Array<{ _id: string; count: number }>;
  byPriority?: Array<{ _id: string; count: number }>;
};
export async function adminGetTicketStats(): Promise<TicketStats> {
  const res = await api.get("/api/tickets/admin/stats");
  return res.data as TicketStats;
}

// Assign a specific staff/leader to a ticket (team endpoint)
export async function assignTicketMember(ticketId: string, userId: string) {
  const res = await api.put(`/api/tickets/team/${ticketId}/assign-member`, { userId });
  return res.data as {
    message: string;
    assignedUser: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    };
  };
}

// Bulk member assignment for multiple tickets (team endpoint)
export async function bulkAssignTicketMember(ticketIds: string[], userId: string) {
  const res = await api.post(`/api/tickets/team/bulk-assign-member`, { ticketIds, userId });
  return res.data as {
    message: string;
    total: number;
    successful: number;
    failed: number;
    results: Array<{
      ticketId: string;
      success: boolean;
      assignedUser?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
      };
    }>;
    errors?: Array<{ ticketId: string; error: string }>;
  };
}

// Team & Admin stats (docs #6)
export async function getTeamStats(
  teamId: string,
  params?: { startDate?: string; endDate?: string }
): Promise<TeamStatsResponse> {
  const res = await api.get(`/api/teams/${teamId}/stats`, {
    params: {
      ...(params?.startDate ? { startDate: params.startDate } : {}),
      ...(params?.endDate ? { endDate: params.endDate } : {}),
    },
  });
  return res.data as TeamStatsResponse;
}

export async function getAdminTeamStats(params?: {
  startDate?: string;
  endDate?: string;
  teamId?: string;
}) {
  const res = await api.get("/api/admin/team-stats", { params });
  return res.data as unknown;
}

// Categories API
export async function getCategories(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const res = await api.get("/api/categories", { params });
  return res.data as {
    categories: Category[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
  };
}

export async function getCategoryById(id: string) {
  const res = await api.get(`/api/categories/${id}`);
  return res.data.category as Category;
}

export async function getCategoryWithSubcategories(id: string) {
  const [categoryRes, subcategoriesRes] = await Promise.all([
    api.get(`/api/categories/${id}`),
    api.get(`/api/subcategories?category=${id}`)
  ]);
  
  return {
    category: categoryRes.data.category as Category,
    subcategories: subcategoriesRes.data.subcategories as SubCategory[]
  };
}

export async function createCategory(payload: {
  name: string;
  description: string;
  team?: string;
}) {
  const res = await api.post("/api/categories", payload);
  return res.data as {
    message: string;
    category: Category;
  };
}

export async function updateCategory(id: string, payload: {
  name?: string;
  description?: string;
  team?: string;
}) {
  const res = await api.put(`/api/categories/${id}`, payload);
  return res.data as {
    message: string;
    category: Category;
  };
}

export async function deleteCategory(id: string) {
  const res = await api.delete(`/api/categories/${id}`);
  return res.data as {
    message: string;
  };
}

export async function getCategoriesGroupedByTeam() {
  const res = await api.get("/api/categories/grouped-by-team");
  return res.data as {
    categories: {
      global: Category[];
      teams: {
        [teamId: string]: {
          teamId: string;
          teamName: string;
          categories: Category[];
        };
      };
    };
    total: number;
  };
}

// SubCategories API
export async function getSubCategories(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) {
  const res = await api.get("/api/subcategories", { params });
  return res.data as {
    subcategories: SubCategory[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
  };
}

export async function getSubCategoryById(id: string) {
  const res = await api.get(`/api/subcategories/${id}`);
  return res.data.subcategory as SubCategory;
}

export async function createSubCategory(payload: {
  name: string;
  description: string;
  category: string;
}) {
  const res = await api.post("/api/subcategories", payload);
  return res.data as {
    message: string;
    subcategory: SubCategory;
  };
}

export async function updateSubCategory(id: string, payload: {
  name?: string;
  description?: string;
  category?: string;
}) {
  const res = await api.put(`/api/subcategories/${id}`, payload);
  return res.data as {
    message: string;
    subcategory: SubCategory;
  };
}

export async function deleteSubCategory(id: string) {
  const res = await api.delete(`/api/subcategories/${id}`);
  return res.data as {
    message: string;
  };
}

