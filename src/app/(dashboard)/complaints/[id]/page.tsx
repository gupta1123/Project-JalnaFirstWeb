"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Hash, Tag, Flag, User as UserIcon, MapPin, Clipboard, Users, Plus, Check, FileText, ExternalLink, Eye, Image, Video, File } from "lucide-react";
import { formatDateTimeSmart } from "@/lib/utils";
import type { Ticket, TicketStatus, User, Team, ChangedBy } from "@/lib/types";
import { adminGetTicketById, adminUpdateTicketStatus, adminAddNote, adminGetTicketHistory, getUserById, assignTeamsToTicket, getTeams, getTicketAttachments } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const validStatuses: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

// Helper function to format role display
const formatUserRole = (user: ChangedBy | User) => {
  if (!user) return '';

  // Check for admin role
  if (user.role === 'admin' || ('displayRole' in user && user.displayRole === 'admin')) {
    return 'Admin';
  }

  // Check for team leader (staff with isTeamLeader: true)
  if (user.role === 'staff' && 'isTeamLeader' in user && user.isTeamLeader === true) {
    return 'Team Lead';
  }

  // Check for staff
  if (user.role === 'staff' || ('displayRole' in user && user.displayRole === 'staff')) {
    return 'Staff';
  }

  // Check for team leader display role
  if ('displayRole' in user && user.displayRole === 'team_leader') {
    return 'Team Lead';
  }

  return '';
};

// Helper function to format changed by information
const formatChangedBy = (changedBy: string | User | ChangedBy) => {
  if (!changedBy) return 'Unknown User';

  if (typeof changedBy === 'string') return changedBy;

  // Handle User type with role information
  const userRole = formatUserRole(changedBy);
  const userName = changedBy.fullName ||
    (changedBy.firstName && changedBy.lastName ? `${changedBy.firstName} ${changedBy.lastName}` : null) ||
    changedBy.email ||
    ('name' in changedBy ? changedBy.name : undefined); // Fallback to name field from API

  if (userName && userRole) {
    return `${userName} (${userRole})`;
  }

  // Fallback to name only if available
  if (userName) return userName;

  return 'Unknown User';
};

// Helper function to open location in Google Maps
const openInGoogleMaps = (ticket: Ticket) => {
  if (!ticket.coordinates) return;
  const url = `https://www.google.com/maps?q=${ticket.coordinates.latitude},${ticket.coordinates.longitude}`;
  window.open(url, '_blank');
};

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data, isLoading, mutate } = useSWR(id ? ["ticket-admin", id] : null, () => adminGetTicketById(id));
  const ticket = data as Ticket | undefined;

  const requesterUserId = useMemo(() => {
    const createdBy = ticket?.createdBy as unknown;
    if (!createdBy) return undefined;
    if (typeof createdBy === "string") return createdBy;
    if (typeof createdBy === "object") {
      const obj = createdBy as Record<string, unknown>;
      return (obj._id as string) ?? (obj.id as string) ?? undefined;
    }
    return undefined;
  }, [ticket]);

  const { data: requester, isLoading: isLoadingRequester } = useSWR(
    requesterUserId ? ["user", requesterUserId] : null,
    () => getUserById(requesterUserId as string),
    { revalidateOnFocus: false }
  );
  const requesterUser = requester as User | undefined;


  type ChangeItem = { id: string; field?: string; oldValue?: string; newValue?: string; changeType?: string; description?: string; changedBy?: string; changedAt?: string };
  type TicketHistory = { ticketNumber?: string; title?: string; changeHistory?: ChangeItem[] };
  const { data: historyResp, mutate: mutateHistory } = useSWR<TicketHistory>(id ? ["ticket-history-new", id] : null, () => adminGetTicketHistory(id), { revalidateOnFocus: false });
  const historyItems: ChangeItem[] = useMemo(() => (historyResp?.changeHistory ?? [])
    
    .filter((h) => !(h.field === 'status' && (h.oldValue ?? '') === (h.newValue ?? '')))
    .slice()
    .sort((a, b) => {
    const ta = a.changedAt ? new Date(a.changedAt).getTime() : 0;
    const tb = b.changedAt ? new Date(b.changedAt).getTime() : 0;
    return tb - ta; // newest first
  }), [historyResp]);

 
  useEffect(() => {
    if (ticket?.status) setStatus(ticket.status);
  }, [ticket?.status]);

  const [status, setStatus] = useState<TicketStatus>(ticket?.status ?? "open");
  const [note, setNote] = useState<string>("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [assignTeamsOpen, setAssignTeamsOpen] = useState(false);


  const { data: teamsData } = useSWR("teams", () => getTeams({ page: 1, limit: 100 }));
  const teams: Team[] = teamsData?.teams ?? [];

  const created = useMemo(() => formatDateTimeSmart(ticket?.createdAt), [ticket?.createdAt]);
  const updated = useMemo(() => formatDateTimeSmart(ticket?.updatedAt), [ticket?.updatedAt]);
  const isClosed = ticket?.status === 'closed';


  const { data: attachmentsResp, isLoading: isLoadingAttachments } = useSWR(
    id ? ["ticket-attachments-new", id] : null,
    () => getTicketAttachments(id),
    { revalidateOnFocus: false }
  );
  const attachments = attachmentsResp?.attachments ?? [] as Array<{ _id: string; filename: string; url: string; size: number; mimeType: string; }>;


  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{
    _id: string;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const isImage = (m?: string) => Boolean(m && m.startsWith("image/"));
  const isVideo = (m?: string) => Boolean(m && m.startsWith("video/"));
  const isPdf = (m?: string) => m === "application/pdf";

  const handleAssignTeams = async (teamIds: string[]) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await assignTeamsToTicket(id, teamIds, 'replace');
      toast.success("Teams assigned successfully");
      mutate(); 
      setAssignTeamsOpen(false);
    } catch (error) {
      toast.error("Failed to assign teams");
    } finally {
      setSubmitting(false);
    }
  };

  function statusBadgeClass(s: TicketStatus) {
    if (s === "open") return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20";
    if (s === "in_progress") return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20";
    if (s === "resolved") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    if (s === "closed") return "bg-muted text-muted-foreground border-muted-foreground/20";
    return "";
  }

  async function copyId() {
    try { await navigator.clipboard.writeText(ticket?.ticketNumber ?? ticket?._id ?? ""); setCopiedId(true); setTimeout(()=>setCopiedId(false), 1000);} catch {}
  }

  async function saveStatus() {
    try {
      setSubmitting(true);
      await adminUpdateTicketStatus(id, { status });
      toast.success("Status updated");
      await mutate();
      await mutateHistory();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSubmitting(false);
    }
  }

  async function addNote() {
    try {
      if (!note.trim()) return;
      setSubmitting(true);
      await adminAddNote(id, note.trim());
      setNote("");
      toast.success("Note added");
      await mutate();
      await mutateHistory();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="grid gap-4 overflow-x-hidden">
        {isLoading && (
          <div className="grid gap-3">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        )}
        {!isLoading && ticket && (
          <div className="grid gap-4">
    
            <div className="rounded-lg border p-4 grid gap-3 overflow-x-hidden">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] items-start">
           
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="size-4 text-muted-foreground" />
                  <span className="font-medium">{ticket.ticketNumber ?? ticket._id}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={copyId}>
                    <Clipboard className="size-4" /> {copiedId ? "Copied" : "Copy"}
                  </Button>
                </div>

                <div className="flex flex-col gap-2 md:items-end">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {ticket.category && (
                      <Badge variant="secondary" className="capitalize flex items-center gap-1">
                        <Tag className="size-3.5" />
                        {typeof ticket.category === 'string'
                          ? ticket.category
                          : typeof ticket.category === 'object' && ticket.category && 'name' in ticket.category
                          ? (ticket.category as { name: string }).name
                          : 'Category'}
                      </Badge>
                    )}
                    {ticket.priority && (
                      <Badge className="capitalize flex items-center gap-1"><Flag className="size-3.5" /> {ticket.priority}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>Add note</Button>
                  </div>
                </div>
              </div>
              <div className="text-base font-medium break-words break-all whitespace-pre-wrap">{ticket.title}</div>
              <div className="text-sm text-muted-foreground leading-relaxed break-words break-all whitespace-pre-wrap">{ticket.description}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-3.5" /> Created: {created} • Updated: {updated}</div>
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {ticket.tags.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                  ))}
            </div>
              )}
           
              <div className="flex flex-wrap gap-2 justify-end pt-2">
                <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)} disabled={isClosed}>
                  <SelectTrigger className="h-8 w-[180px] sm:w-[220px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {validStatuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize" disabled={s === 'closed'}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={saveStatus} disabled={submitting || isClosed}>Save</Button>
            </div>
            </div>

         
            <div className="rounded-lg border p-4 grid gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" /> 
                  Assigned Teams
                </div>
                {ticket.assignedTeams && ticket.assignedTeams.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {ticket.assignedTeams.length} team{ticket.assignedTeams.length !== 1 ? 's' : ''}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssignTeamsOpen(true)}
                      disabled={submitting}
                    >
                      <Users className="size-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAssignTeamsOpen(true)}
                    disabled={submitting}
                  >
                    <Plus className="size-3 mr-1" />
                    Assign Teams
                  </Button>
                )}
              </div>
              
              {ticket.assignedTeams && ticket.assignedTeams.length > 0 ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {ticket.assignedTeams.map((team) => (
                    <div key={team._id} className="rounded border p-3 bg-muted/30">
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium text-sm">{team.name}</div>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {team.areas && team.areas.length > 0 ? (
                          <div className="space-y-0.5">
                            {team.areas.slice(0, 2).map((area, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <MapPin className="size-3" />
                                <span>{area.zone}, {area.city}</span>
                              </div>
                            ))}
                            {team.areas.length > 2 && (
                              <div className="text-xs opacity-70">+{team.areas.length - 2} more areas</div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            <span>No specific areas</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No teams assigned to this complaint
                </div>
              )}
            </div>

            {/* Location Section */}
            {(ticket?.coordinates || ticket?.location) && (
              <div className="rounded-lg border p-4 grid gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="size-4 text-blue-600" />
                  Incident Location
                </div>
                <div className="space-y-4">
                  {/* Address Information */}
                  {ticket.location && (
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            📍 Reported Location
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {[
                              ticket.location.area && `${ticket.location.area}`,
                              ticket.location.zone && `${ticket.location.zone}`,
                              ticket.location.city,
                              ticket.location.state
                            ].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Map Action */}
                  {ticket.coordinates && (
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                          <MapPin className="size-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Precise Location Available
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            GPS coordinates captured from the report
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInGoogleMaps(ticket)}
                        className="bg-white dark:bg-blue-950 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300"
                      >
                        <ExternalLink className="size-4 mr-2" />
                        View on Map
                      </Button>
                    </div>
                  )}

                  {/* No location fallback */}
                  {!ticket.location && !ticket.coordinates && (
                    <div className="text-center py-6 text-muted-foreground">
                      <MapPin className="size-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No location information available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Two-column layout: left Tabs (Notes/Activity), right Details */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              {/* LEFT */}
              <div className="lg:col-span-8">
                <Card>
                  <CardHeader className="pb-2"><CardTitle>Notes & Activity</CardTitle></CardHeader>
                  <CardContent>
                    <Tabs defaultValue="activity" className="w-full">
                      <TabsList>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                        <TabsTrigger value="attachments">Attachments</TabsTrigger>
                      </TabsList>
                      <TabsContent value="activity" className="mt-4">
                        {historyItems.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="rounded-full bg-muted p-3 w-fit mx-auto mb-3">
                              <Flag className="size-6 text-muted-foreground" />
                            </div>
                            <div className="text-sm text-muted-foreground">No activity yet</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Changes and updates will appear here
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" aria-hidden />
                            <div className="space-y-4">
                              {historyItems.map((h, index) => (
                                <div key={h.id} className="relative pl-10">
                                  <div className={`absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-background ${
                                    h.field === 'status' ? 'bg-blue-500' : 'bg-muted-foreground'
                                  }`} />
                                  
                                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {h.changeType?.replace(/_/g, " ") ?? "Change"}
                                        </Badge>
                                        {h.field && (
                                          <span className="text-xs text-muted-foreground">
                                            • {h.field}
                                          </span>
                                        )}
                                      </div>
                                      {h.changedAt && (
                                        <span className="text-xs text-muted-foreground">
                                          {formatDateTimeSmart(h.changedAt)}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="text-sm">
                                      {h.field === 'status' ? (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span>Status changed from</span>
                                          <Badge variant="outline" className={`capitalize ${statusBadgeClass((h.oldValue as TicketStatus) ?? 'open')}`}>
                                            {(h.oldValue ?? '').toString().replace(/_/g, ' ')}
                                          </Badge>
                                          <span>to</span>
                                          <Badge variant="outline" className={`capitalize ${statusBadgeClass((h.newValue as TicketStatus) ?? 'open')}`}>
                                            {(h.newValue ?? '').toString().replace(/_/g, ' ')}
                                          </Badge>
                                        </div>
                                      ) : (
                                        <div>{h.description ?? `${h.field ?? 'Field'} updated`}</div>
                                      )}
                                    </div>
                                    
                                    {h.changedBy && (
                                      <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                                        Changed by: {formatChangedBy(h.changedBy)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="notes" className="mt-4">
                        {(ticket.adminNotes && ticket.adminNotes.length > 0) ? (
              <div className="grid gap-2">
                            {ticket.adminNotes.map((n, i) => (
                              <div key={i} className="text-xs text-muted-foreground border rounded p-2">
                                <div className="text-foreground text-sm">{n.note}</div>
                                {n.addedAt && (
                              <div className="opacity-70 mt-1">
                                {formatDateTimeSmart(n.addedAt)}
                                {n.addedBy && (
                                  <span> • by {formatChangedBy(n.addedBy)}</span>
                                )}
                              </div>
                            )}
                  </div>
                ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">No notes yet</div>
                        )}
                      </TabsContent>
                      <TabsContent value="attachments" className="mt-4">
                        {isLoadingAttachments ? (
                          <div className="grid gap-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-3/4" />
                          </div>
                        ) : attachments.length === 0 ? (
                          <div className="text-xs text-muted-foreground">No attachments</div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {attachments.map((att) => (
                              <div key={att._id} className="group relative aspect-square rounded-lg border overflow-hidden bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:shadow-md">
                                {/* Thumbnail/Icon */}
                                <div className="w-full h-full flex items-center justify-center">
                                  {isImage(att.mimeType) ? (
                                    <img src={att.url} alt="Attachment" className="w-full h-full object-cover" />
                                  ) : isVideo(att.mimeType) ? (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                      <Video className="size-12" />
                                      <span className="text-xs font-medium">VIDEO</span>
                                    </div>
                                  ) : isPdf(att.mimeType) ? (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                      <FileText className="size-12" />
                                      <span className="text-xs font-medium">PDF</span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                      <File className="size-12" />
                                      <span className="text-xs font-medium">FILE</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="bg-white/90 hover:bg-white text-black border-0"
                                    onClick={() => { setPreviewAttachment(att); setPreviewOpen(true); }}
                                  >
                                    <Eye className="size-4" />
                                  </Button>
                                  <Button 
                                    asChild 
                                    size="sm" 
                                    variant="secondary"
                                    className="bg-white/90 hover:bg-white text-black border-0"
                                  >
                                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="size-4" />
                                    </a>
                                  </Button>
                                </div>
                                
                                {/* File size indicator */}
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  {att.size < 1024 ? `${att.size} B` : att.size < 1024 * 1024 ? `${Math.round(att.size / 1024)} KB` : `${Math.round(att.size / (1024 * 1024))} MB`}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT */}
              <div className="lg:col-span-4">
                <Card>
                  <CardContent className="grid gap-3">
                    <div className="rounded-lg border p-4 grid gap-1">
                      <div className="text-sm font-medium mb-1 flex items-center gap-2"><UserIcon className="size-4 text-muted-foreground" /> Requester</div>
                      {requesterUserId ? (
                        <Link href={`/users/${requesterUserId}`} className="text-sm underline underline-offset-2 hover:text-accent-foreground">
                          {requesterUser?.fullName ?? (typeof ticket.createdBy === 'object' && ticket.createdBy && 'fullName' in ticket.createdBy ? (ticket.createdBy as Record<string, unknown>).fullName as string : '-')}
                        </Link>
                      ) : (
                        <div className="text-sm">{requesterUser?.fullName ?? (typeof ticket.createdBy === 'object' && ticket.createdBy && 'fullName' in ticket.createdBy ? (ticket.createdBy as Record<string, unknown>).fullName as string : '-')}</div>
                      )}
                      <div className="text-xs text-muted-foreground">{requesterUser?.email ?? (typeof ticket.createdBy === 'object' && ticket.createdBy && 'email' in ticket.createdBy ? (ticket.createdBy as Record<string, unknown>).email as string : '')}</div>
                      {requesterUser?.phoneNumber && (
                        <div className="text-xs text-muted-foreground">{requesterUser.phoneNumber}</div>
                      )}
                    </div>
                    <div className="rounded-lg border p-4 grid gap-1">
                      <div className="text-sm font-medium mb-1 flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> Address</div>
                      {requesterUser?.address ? (
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {(() => {
                            const addr = requesterUser.address!;
                            const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
                            const city = addr.city?.trim();
                            const lineHasCity = (line?: string) => !!(line && city && line.toLowerCase().includes(city.toLowerCase()));
                            const line1Text = addr.line1 ? `${addr.line1}${!lineHasCity(addr.line1) && city ? `, ${city}` : ''}` : undefined;
                            const line2Raw = addr.line2 ? `${addr.line2}` : undefined;
                            const showLine2 = line1Text && line2Raw ? normalize(line1Text) !== normalize(line2Raw) : Boolean(line2Raw);
                            const tail = [addr.state, addr.zipCode, addr.country].filter(Boolean).join(", ");
                            return (
                              <>
                                {line1Text && <div>{line1Text}</div>}
                                {showLine2 && <div>{line2Raw}</div>}
                                {tail ? <div>{tail}</div> : (!line1Text && !showLine2 ? <div>-</div> : null)}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          <div>Zone: {ticket.location?.zone ?? '-'}</div>
                          <div>City: {ticket.location?.city ?? '-'}</div>
                          <div>State: {ticket.location?.state ?? '-'}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {/* Add note modal */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add admin note</DialogTitle>
            <DialogDescription>Share a short, clear update for other admins.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Textarea rows={5} placeholder="Write a short note..." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={async () => { await addNote(); setNoteOpen(false); }} disabled={submitting || !note.trim()}>
              {submitting ? "Adding..." : "Add note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Teams Dialog */}
      <Dialog open={assignTeamsOpen} onOpenChange={setAssignTeamsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Teams to Ticket</DialogTitle>
          </DialogHeader>
          {ticket && (
            <AssignTeamsForm
              ticket={ticket}
              teams={teams}
              onAssign={handleAssignTeams}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Attachment Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={(o) => { setPreviewOpen(o); if (!o) setPreviewAttachment(null); }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewAttachment && isImage(previewAttachment.mimeType) && <Image className="size-5" />}
              {previewAttachment && isVideo(previewAttachment.mimeType) && <Video className="size-5" />}
              {previewAttachment && isPdf(previewAttachment.mimeType) && <FileText className="size-5" />}
              {previewAttachment && !isImage(previewAttachment.mimeType) && !isVideo(previewAttachment.mimeType) && !isPdf(previewAttachment.mimeType) && <File className="size-5" />}
              Preview
            </DialogTitle>
            {previewAttachment && (
              <DialogDescription className="flex items-center justify-between">
                <span>{previewAttachment.mimeType}</span>
                <Button asChild size="sm" variant="outline">
                  <a href={previewAttachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                    <ExternalLink className="size-3" />
                    Open Original
                  </a>
                </Button>
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="mt-4 flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden" style={{ minHeight: '60vh' }}>
            {previewAttachment ? (
              isImage(previewAttachment.mimeType) ? (
                <img src={previewAttachment.url} alt="Attachment" className="max-h-[60vh] max-w-full object-contain rounded" />
              ) : isVideo(previewAttachment.mimeType) ? (
                <video src={previewAttachment.url} controls className="max-h-[60vh] max-w-full rounded" />
              ) : isPdf(previewAttachment.mimeType) ? (
                <iframe src={previewAttachment.url} className="w-full h-[60vh] rounded border-0" />
              ) : (
                <div className="text-center py-12">
                  <File className="size-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Preview not available for this file type
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use &quot;Open Original&quot; to view the file
                  </p>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Assign Teams Form Component
function AssignTeamsForm({
  ticket,
  teams,
  onAssign,
  submitting,
}: {
  ticket: Ticket;
  teams: Team[];
  onAssign: (teamIds: string[]) => Promise<void>;
  submitting: boolean;
}) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    ticket.assignedTeams?.map(t => t._id) || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAssign(selectedTeams);
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium">{ticket.ticketNumber || ticket._id}</div>
          <div className="text-sm text-muted-foreground">{ticket.title}</div>
          {ticket.location && (
            <div className="text-xs text-muted-foreground mt-1">
              {ticket.location.zone && `${ticket.location.zone}, `}
              {ticket.location.city}, {ticket.location.state}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Teams:</label>
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teams available</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {teams.map((team) => (
                <div
                  key={team._id}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-colors
                    ${selectedTeams.includes(team._id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                    }
                  `}
                  onClick={() => toggleTeam(team._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{team.name}</div>
                    </div>
                    <div className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-3
                      ${selectedTeams.includes(team._id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                      }
                    `}>
                      {selectedTeams.includes(team._id) && (
                        <Check className="size-3" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setSelectedTeams([])}>
            Clear All
          </Button>
          <Button type="submit" disabled={submitting || selectedTeams.length === 0}>
            {submitting ? "Assigning..." : "Assign Teams"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

