"use client";

import axios from "axios";
import Cookies from "js-cookie";
import type { User, AgencyContact, Pagination, Complaint, Ticket, TicketStatus } from "./types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://social-service-backend-01d8c088884a.herokuapp.com";

export const api = axios.create({
  baseURL: API_BASE_URL,
  // We send Bearer tokens via Authorization header; do not send cross-site cookies
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("ss_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  // TODO: Confirm endpoint for creating admin; using /api/admin/create for now if available.
  // If superadmin-only create endpoint exists, adjust accordingly.
  const res = await api.post("/api/admin/create", payload);
  return res.data;
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

// Profile (from docs #12-#15)
export async function updateProfile(payload: {
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: { latitude: number; longitude: number };
  };
  aadhaarNumber?: string | number;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  education?: string;
  occupation?: string;
  businessDetails?: { businessType?: string };
}) {
  const res = await api.put("/api/profile", payload);
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
  const res = await api.get(`/api/tickets/admin/${id}/history`);
  return res.data;
}

// TODO: Notices/Circulars endpoints are not in the doc. Add once available.

// Tickets admin stats
export type TicketStats = {
  overall?: { total?: number; open?: number; inProgress?: number; resolved?: number; closed?: number };
  byCategory?: Array<{ _id: string; count: number }>;
  byPriority?: Array<{ _id: string; count: number }>;
};
export async function adminGetTicketStats(): Promise<TicketStats> {
  const res = await api.get("/api/tickets/admin/stats");
  return res.data as TicketStats;
}

