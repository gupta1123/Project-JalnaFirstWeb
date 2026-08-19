"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Hash, Tag, Flag, MapPin, Clipboard, Users, FileText, ExternalLink, Eye, Image, Video, File, User as UserIcon } from "lucide-react";
import { formatDateTimeSmart } from "@/lib/utils";
import type { Ticket, TicketStatus, User } from "@/lib/types";
import { adminGetTicketById, adminAddNote, adminGetTicketHistory, getTicketAttachments, getCategories, getSubCategories, adminReassignTicketCategory } from "@/lib/api";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";


// Helper function to open location in Google Maps
const openInGoogleMaps = (ticket: Ticket) => {
  const coordinates = ticket.location?.coordinates || ticket.coordinates;
  if (!coordinates) return;
  const { latitude, longitude } = coordinates;
  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  window.open(url, '_blank');
};

export default function ComplaintDetailPage() {
  const { lang } = useLanguage();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data, isLoading, mutate } = useSWR(id ? ["ticket-admin", id] : null, () => adminGetTicketById(id));
  const ticket = data as Ticket | undefined;

  const getStatusKey = (status: string): string => {
    const statusMap: Record<string, string> = {
      'open': 'open',
      'in_progress': 'inProgress',
      'assigned': 'assigned',
      'resolved': 'resolved',
      'closed': 'closed',
      'reopened_assigned': 'reopenedAssigned',
      'reopened_in_progress': 'reopenedInProgress',
      'reopened_resolved': 'reopenedResolved',
    };
    return statusMap[status] || status;
  };



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

 

  const [note, setNote] = useState<string>("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const created = useMemo(() => formatDateTimeSmart(ticket?.createdAt), [ticket?.createdAt]);
  const updated = useMemo(() => formatDateTimeSmart(ticket?.updatedAt), [ticket?.updatedAt]);
  const isClosed = ticket?.status === 'closed';


  const { data: attachmentsResp, isLoading: isLoadingAttachments } = useSWR(
    id ? ["ticket-attachments-new", id] : null,
    () => getTicketAttachments(id),
    { revalidateOnFocus: false }
  );

  const { data: categoriesResp, isLoading: isLoadingCategories } = useSWR(
    "categories",
    () => getCategories({ page: 1, limit: 100 }),
    { revalidateOnFocus: false }
  );
  const categories = categoriesResp?.categories ?? [];

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("");
  const [reassigningCategory, setReassigningCategory] = useState(false);

  const initialCategoryId = useMemo(() => {
    const cat = ticket?.category as unknown;
    if (!cat) return "";
    if (typeof cat === "string") return cat;
    if (typeof cat === "object") {
      const obj = cat as { id?: string; _id?: string };
      return obj.id || obj._id || "";
    }
    return "";
  }, [ticket?.category]);

  const initialSubCategoryId = useMemo(() => {
    const sub = (ticket as unknown as { subCategory?: { id?: string; _id?: string } })?.subCategory;
    if (!sub) return "";
    return sub.id || sub._id || "";
  }, [ticket]);

  useEffect(() => {
    if (initialCategoryId && !selectedCategoryId) {
      setSelectedCategoryId(initialCategoryId);
    }
    if (initialSubCategoryId) {
      setSelectedSubCategoryId(initialSubCategoryId);
    }
  }, [initialCategoryId, initialSubCategoryId, selectedCategoryId]);

  const { data: subCategoriesResp, isLoading: isLoadingSubCategories } = useSWR(
    selectedCategoryId ? ["ticket-subcategories-admin", selectedCategoryId] : null,
    // Keep params aligned with Categories page; backend may reject very large limits.
    () => getSubCategories({ page: 1, limit: 100, category: selectedCategoryId }),
    { revalidateOnFocus: false }
  );
  const subCategories = subCategoriesResp?.subcategories ?? [];

  // Fetch all subcategories to avoid showing old category/subcategory values duplicated as tags.
  const { data: allSubCategoriesResp } = useSWR(
    "subcategories",
    () => getSubCategories({ page: 1, limit: 100 }),
    { revalidateOnFocus: false }
  );
  const allSubCategories = allSubCategoriesResp?.subcategories ?? [];

  const hasCategoryChanged = useMemo(() => {
    if (!selectedCategoryId) return false;
    const subInitial = initialSubCategoryId || "";
    const subSelected = selectedSubCategoryId || "";
    return selectedCategoryId !== initialCategoryId || subSelected !== subInitial;
  }, [initialCategoryId, initialSubCategoryId, selectedCategoryId, selectedSubCategoryId]);

  // When a category is selected, auto-select the first subcategory (if available) for convenience.
  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }
    type SubCategoryItem = { id?: string; _id?: string; name?: string };
    const subsTyped = subCategories as SubCategoryItem[];
    const firstSub =
      subsTyped.find((s) => s.id === selectedSubCategoryId || s._id === selectedSubCategoryId) ||
      subsTyped[0];
    const firstId = firstSub?.id ?? firstSub?._id;
    if (firstId && selectedSubCategoryId !== firstId) {
      setSelectedSubCategoryId(firstId);
    }
  }, [selectedCategoryId, subCategories, selectedSubCategoryId]);

  const currentCategoryName = useMemo(() => {
    if (!ticket?.category) return "";
    type CategoryItem = { id?: string; _id?: string; name?: string };
    if (typeof ticket.category === "string") {
      const match = categories.find((c: CategoryItem) => c.id === ticket.category || c._id === ticket.category);
      return match?.name || ticket.category;
    }
    if (typeof ticket.category === "object" && "name" in ticket.category) {
      return (ticket.category as { name?: string }).name || "";
    }
    return "";
  }, [categories, ticket?.category]);

  const currentSubCategoryName = useMemo(() => {
    const sub = (ticket as unknown as { subCategory?: { name?: string; id?: string; _id?: string } })?.subCategory;
    if (!sub) return "";
    if (sub.name) return sub.name;
    type SubCategoryItem = { id?: string; _id?: string; name?: string };
    const match = subCategories.find((s: SubCategoryItem) => s.id === sub.id || s._id === sub._id);
    return match?.name || sub.id || sub._id || "";
  }, [subCategories, ticket]);

  const visibleTags = useMemo(() => {
    const raw = (ticket?.tags ?? []).filter((t) => typeof t === "string" && t.trim()) as string[];
    const norm = (v: string) => v.trim().toLowerCase();
    const exclude = new Set<string>();

    // Exclude current category/subcategory
    [currentCategoryName, currentSubCategoryName].filter(Boolean).forEach((v) => exclude.add(norm(v)));

    // Exclude any known category names (tickets sometimes store these in tags)
    type CategoryItem = { id?: string; _id?: string; name?: string };
    (categories as CategoryItem[]).forEach((c) => {
      const name = typeof c?.name === "string" ? c.name : "";
      if (name) exclude.add(norm(name));
    });

    // Exclude any known subcategory names (tickets sometimes store these in tags)
    type SubCategoryItem = { id?: string; _id?: string; name?: string };
    (allSubCategories as SubCategoryItem[]).forEach((s) => {
      const name = typeof s?.name === "string" ? s.name : "";
      if (name) exclude.add(norm(name));
    });

    const unique = new Map<string, string>();
    raw.forEach((t) => {
      const key = norm(t);
      if (!key || exclude.has(key) || unique.has(key)) return;
      unique.set(key, t.trim());
    });
    return Array.from(unique.values());
  }, [ticket?.tags, currentCategoryName, currentSubCategoryName, categories, allSubCategories]);

  type AttachmentItem = {
    _id: string;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
    publicId?: string;
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
  };

  const allAttachments = (attachmentsResp?.attachments ?? []) as AttachmentItem[];

  // Split attachments by uploadedByRole
  const userAttachments: AttachmentItem[] = allAttachments.filter((att) => {
    // Citizen uploads: role is "user" or not staff
    if (att.uploadedByRole === "user") return true;
    if (att.uploadedBy?.role === "user") return true;
    // If no role info, assume it's a user upload (from ticket creation)
    if (!att.uploadedByRole && !att.uploadedBy?.role) return true;
    return false;
  });

  const teamAttachments: AttachmentItem[] = allAttachments.filter((att) => {
    // Team proof: role is "staff"
    if (att.uploadedByRole === "staff") return true;
    if (att.uploadedBy?.role === "staff") return true;
    return false;
  });

  const hasUserAttachments = userAttachments.length > 0;
  const hasTeamAttachments = teamAttachments.length > 0;

  const [activeAttachmentsTab, setActiveAttachmentsTab] = useState<"user" | "team">("user");

  // Choose the most useful default tab based on which side has files
  useEffect(() => {
    if (!hasUserAttachments && hasTeamAttachments) {
      setActiveAttachmentsTab("team");
    } else if (hasUserAttachments && !hasTeamAttachments) {
      setActiveAttachmentsTab("user");
    }
  }, [hasUserAttachments, hasTeamAttachments]);


  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{
    _id: string;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const isImage = (m?: string) => Boolean(m && m.startsWith("image/"));
  const isVideo = (m?: string) => Boolean(m && m.startsWith("video/"));
  const isPdf = (m?: string) => m === "application/pdf";

  function statusBadgeClass(s: TicketStatus) {
    if (s === "open") return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20";
    if (s === "in_progress") return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20";
    if (s === "assigned") return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20";
    if (s === "resolved") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    if (s === "reopened_assigned") return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20";
    if (s === "reopened_in_progress") return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20";
    if (s === "reopened_resolved") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    if (s === "closed") return "bg-muted text-muted-foreground border-muted-foreground/20";
    return "";
  }

  async function copyId() {
    try { await navigator.clipboard.writeText(ticket?.ticketNumber ?? ticket?._id ?? ""); setCopiedId(true); setTimeout(()=>setCopiedId(false), 1000);} catch {}
  }


  async function addNote() {
    try {
      if (!note.trim()) return;
      setSubmitting(true);
      await adminAddNote(id, note.trim());
      setNote("");
      toast.success(tr(lang, "complaintDetail.addNoteModal.success"));
      await mutate();
      await mutateHistory();
    } catch {
      toast.error(tr(lang, "complaintDetail.addNoteModal.error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReassignCategory() {
    if (!selectedCategoryId) {
      toast.error("Select a category first");
      return;
    }
    setReassigningCategory(true);
    try {
      await adminReassignTicketCategory(id, {
        categoryId: selectedCategoryId,
        subCategoryId: selectedSubCategoryId || undefined,
      });
      toast.success("Category updated and ticket reassigned");
      await mutate();
      await mutateHistory();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update category. Please try again.");
    } finally {
      setReassigningCategory(false);
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
                    <Clipboard className="size-4" /> {copiedId ? tr(lang, "complaintDetail.copied") : tr(lang, "complaintDetail.copy")}
                  </Button>
                </div>

                <div className="flex flex-col gap-2 md:items-end">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {ticket.priority && (
                      <Badge className="capitalize flex items-center gap-1"><Flag className="size-3.5" /> {ticket.priority}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>{tr(lang, "complaintDetail.addNote")}</Button>
                  </div>
                </div>
              </div>
              <div className="text-base font-medium break-words break-all whitespace-pre-wrap">{ticket.title}</div>
              <div className="text-sm text-muted-foreground leading-relaxed break-words break-all whitespace-pre-wrap">{ticket.description}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-3.5" /> {tr(lang, "complaintDetail.created")}: {created} • {tr(lang, "complaintDetail.updated")}: {updated}</div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {currentCategoryName && (
                  <Badge variant="secondary" className="capitalize">
                    {currentCategoryName}
                  </Badge>
                )}
                {currentSubCategoryName && (
                  <Badge variant="outline" className="capitalize">
                    {currentSubCategoryName}
                  </Badge>
                )}
                <Button size="sm" variant="outline" onClick={() => setCategoryDialogOpen(true)}>
                  Change category
                </Button>
              </div>
              {visibleTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {visibleTags.map((t, i) => (
                    <Badge key={`${t}-${i}`} variant="outline" className="text-xs">{t}</Badge>
                  ))}
            </div>
              )}
           
              <div className="flex flex-wrap gap-2 justify-end pt-2">
                <Badge 
                  variant="outline" 
                  className={`capitalize ${statusBadgeClass(ticket?.status ?? 'open')}`}
                >
                  {ticket?.status?.replace(/_/g, " ") || "open"}
                </Badge>
              </div>
            </div>

         
            {/* Teams and Location side by side */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Assigned Teams Card */}
              <div className="rounded-lg border p-4 grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" /> 
                    {tr(lang, "complaintDetail.assignedTeams")}
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {ticket.assignedTeams?.length ?? 0} {(ticket.assignedTeams?.length ?? 0) !== 1 ? tr(lang, "complaintDetail.teams") : tr(lang, "complaintDetail.team")}
                  </Badge>
                </div>
                
                {ticket.assignedTeams && ticket.assignedTeams.length > 0 ? (
                  <div className="space-y-2">
                    {ticket.assignedTeams.map((team) => (
                      <div key={team._id} className="rounded border p-3 bg-muted/30">
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-sm">{team.name}</div>
                          <Badge variant="outline" className="text-xs">{tr(lang, "complaintDetail.active")}</Badge>
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
                                <div className="text-xs opacity-70">+{team.areas.length - 2} {tr(lang, "complaintDetail.moreAreas")}</div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              <span>{tr(lang, "complaintDetail.noSpecificAreas")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    {tr(lang, "complaintDetail.noTeamsAssigned")}
                  </div>
                )}
              </div>

              {/* Location Card */}
              {(ticket?.location?.coordinates || ticket?.coordinates || ticket?.location) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="size-5 text-blue-600" />
                      {tr(lang, "complaintDetail.incidentLocation")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Map Action */}
                      {(ticket.location?.coordinates || ticket.coordinates) && (
                        <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                              <MapPin className="size-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {tr(lang, "complaintDetail.preciseLocationAvailable")}
                              </p>
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                {tr(lang, "complaintDetail.gpsCoordinatesHelper")}
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
                            {tr(lang, "complaintDetail.viewOnMap")}
                          </Button>
                        </div>
                      )}

                      {/* No location fallback */}
                      {!ticket.location?.coordinates && !ticket.coordinates && !ticket.location && (
                        <div className="text-center py-6 text-muted-foreground">
                          <MapPin className="size-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">{tr(lang, "complaintDetail.noLocationInfo")}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Single column layout: Tabs (Notes/Activity) */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Card>
                  <CardHeader className="pb-2"><CardTitle>{tr(lang, "complaintDetail.notesAndActivity")}</CardTitle></CardHeader>
                  <CardContent>
                    <Tabs defaultValue="activity" className="w-full">
                      <TabsList>
                        <TabsTrigger value="activity">{tr(lang, "complaintDetail.tabs.activity")}</TabsTrigger>
                        <TabsTrigger value="notes">{tr(lang, "complaintDetail.tabs.notes")}</TabsTrigger>
                        <TabsTrigger value="attachments">{tr(lang, "complaintDetail.tabs.attachments")}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="activity" className="mt-4">
                        {historyItems.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="rounded-full bg-muted p-3 w-fit mx-auto mb-3">
                              <Flag className="size-6 text-muted-foreground" />
                            </div>
                            <div className="text-sm text-muted-foreground">{tr(lang, "complaintDetail.noActivity")}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {tr(lang, "complaintDetail.noActivityHelper")}
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
                                          {h.changeType?.replace(/_/g, " ") ?? tr(lang, "complaintDetail.change")}
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
                                          <span>{tr(lang, "complaintDetail.statusChangedFrom")}</span>
                                          <Badge variant="outline" className={`capitalize ${statusBadgeClass((h.oldValue as TicketStatus) ?? 'open')}`}>
                                            {tr(lang, `complaints.status.${getStatusKey((h.oldValue ?? '').toString())}`)}
                                          </Badge>
                                          <span>{tr(lang, "complaintDetail.statusChangedTo")}</span>
                                          <Badge variant="outline" className={`capitalize ${statusBadgeClass((h.newValue as TicketStatus) ?? 'open')}`}>
                                            {tr(lang, `complaints.status.${getStatusKey((h.newValue ?? '').toString())}`)}
                                          </Badge>
                                        </div>
                                      ) : (
                                        <div>{h.description ?? `${h.field ?? tr(lang, "complaintDetail.change")} ${tr(lang, "complaintDetail.fieldUpdated")}`}</div>
                                      )}
                                    </div>
                                    
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
                              </div>
                            )}
                  </div>
                ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">{tr(lang, "complaintDetail.noNotes")}</div>
                        )}
                      </TabsContent>
                      <TabsContent value="attachments" className="mt-4">
                        {isLoadingAttachments ? (
                          <div className="grid gap-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-3/4" />
                          </div>
                        ) : allAttachments.length === 0 ? (
                          <div className="text-xs text-muted-foreground">{tr(lang, "complaintDetail.noAttachments")}</div>
                        ) : (
                          <Tabs
                            value={activeAttachmentsTab}
                            onValueChange={(value) => setActiveAttachmentsTab(value as "user" | "team")}
                            className="w-full"
                          >
                            <TabsList className="w-full justify-start">
                              <TabsTrigger value="user" className="flex-1">
                                Citizen uploads ({userAttachments.length})
                              </TabsTrigger>
                              <TabsTrigger value="team" className="flex-1">
                                Team proof ({teamAttachments.length})
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="user" className="mt-3">
                              {userAttachments.length === 0 ? (
                                <div className="text-xs text-muted-foreground text-center py-4">
                                  No files in this section yet.
                                </div>
                              ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                  {userAttachments.map((att) => (
                                    <div key={att._id} className="group relative aspect-square rounded-lg border overflow-hidden bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:shadow-md">
                                      {/* Thumbnail/Icon */}
                                      <div className="w-full h-full flex items-center justify-center">
                                        {isImage(att.mimeType) ? (
                                          <img src={att.url} alt="Attachment" className="w-full h-full object-cover" />
                                        ) : isVideo(att.mimeType) ? (
                                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Video className="size-12" />
                                            <span className="text-xs font-medium">{tr(lang, "complaintDetail.fileType.video")}</span>
                                          </div>
                                        ) : isPdf(att.mimeType) ? (
                                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <FileText className="size-12" />
                                            <span className="text-xs font-medium">{tr(lang, "complaintDetail.fileType.pdf")}</span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <File className="size-12" />
                                            <span className="text-xs font-medium">{tr(lang, "complaintDetail.fileType.file")}</span>
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

                            <TabsContent value="team" className="mt-3">
                              {teamAttachments.length === 0 ? (
                                <div className="text-xs text-muted-foreground text-center py-4">
                                  No files in this section yet.
                                </div>
                              ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                  {teamAttachments.map((att) => (
                                    <div key={att._id} className="group relative aspect-square rounded-lg border overflow-hidden bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:shadow-md">
                                      {/* Thumbnail/Icon */}
                                      <div className="w-full h-full flex items-center justify-center">
                                        {isImage(att.mimeType) ? (
                                          <img src={att.url} alt="Attachment" className="w-full h-full object-cover" />
                                        ) : isVideo(att.mimeType) ? (
                                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Video className="size-12" />
                                            <span className="text-xs font-medium">{tr(lang, "complaintDetail.fileType.video")}</span>
                                          </div>
                                        ) : isPdf(att.mimeType) ? (
                                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <FileText className="size-12" />
                                            <span className="text-xs font-medium">{tr(lang, "complaintDetail.fileType.pdf")}</span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <File className="size-12" />
                                            <span className="text-xs font-medium">{tr(lang, "complaintDetail.fileType.file")}</span>
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
                        )}
                      </TabsContent>
                    </Tabs>
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
            <DialogTitle>{tr(lang, "complaintDetail.addNoteModal.title")}</DialogTitle>
            <DialogDescription>{tr(lang, "complaintDetail.addNoteModal.description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Textarea rows={5} placeholder={tr(lang, "complaintDetail.addNoteModal.placeholder")} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNoteOpen(false)}>{tr(lang, "complaintDetail.addNoteModal.cancel")}</Button>
            <Button onClick={async () => { await addNote(); setNoteOpen(false); }} disabled={submitting || !note.trim()}>
              {submitting ? tr(lang, "complaintDetail.addNoteModal.adding") : tr(lang, "complaintDetail.addNoteModal.add")}
            </Button>
          </DialogFooter>
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
              {tr(lang, "complaintDetail.preview.title")}
            </DialogTitle>
            {previewAttachment && (
              <DialogDescription className="flex items-center justify-between">
                <span>{previewAttachment.mimeType}</span>
                <Button asChild size="sm" variant="outline">
                  <a href={previewAttachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                    <ExternalLink className="size-3" />
                    {tr(lang, "complaintDetail.preview.openOriginal")}
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
                    {tr(lang, "complaintDetail.preview.notAvailable")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tr(lang, "complaintDetail.preview.useOpenOriginal")}
                  </p>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change category modal */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Change category</DialogTitle>
            <DialogDescription>
              Pick a new category or subcategory. This will reopen the ticket and clear assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="text-xs text-muted-foreground">
                <span>Category</span>
              </div>
              <Select
                value={selectedCategoryId}
                onValueChange={(value) => {
                  setSelectedCategoryId(value);
                  setSelectedSubCategoryId("");
                }}
                disabled={isLoadingCategories}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                  )}
                  {!isLoadingCategories && categories.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories found</div>
                  )}
                  {categories
                    .filter((cat: { id?: string; _id?: string; name?: string }) => cat.id || cat._id)
                    .map((cat: { id?: string; _id?: string; name?: string }) => (
                      <SelectItem key={cat.id ?? cat._id ?? ""} value={cat.id ?? cat._id ?? ""}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="text-xs text-muted-foreground">
                <span>Subcategory (optional)</span>
              </div>
              <Select
                value={selectedSubCategoryId}
                onValueChange={(value) => setSelectedSubCategoryId(value === "__clear_subcategory__" ? "" : value)}
                disabled={!selectedCategoryId || isLoadingSubCategories}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedCategoryId
                        ? "Select a category first"
                        : isLoadingSubCategories
                        ? "Loading subcategories..."
                        : "Select subcategory (optional)"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {!selectedCategoryId && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Choose a category first</div>
                  )}
                  {selectedCategoryId && isLoadingSubCategories && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                  )}
                  {selectedCategoryId && !isLoadingSubCategories && subCategories.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No subcategories</div>
                  )}
                  {subCategories
                    .filter((sub: { id?: string; _id?: string; name?: string }) => sub.id || sub._id)
                    .map((sub: { id?: string; _id?: string; name?: string }) => (
                      <SelectItem key={sub.id ?? sub._id ?? ""} value={sub.id ?? sub._id ?? ""}>
                      {sub.name}
                    </SelectItem>
                  ))}
                  {selectedSubCategoryId && (
                    <SelectItem value="__clear_subcategory__">Clear subcategory</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedCategoryId(initialCategoryId || "");
                setSelectedSubCategoryId(initialSubCategoryId || "");
                setCategoryDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedCategoryId(initialCategoryId || "");
                setSelectedSubCategoryId(initialSubCategoryId || "");
              }}
              disabled={!hasCategoryChanged}
            >
              Reset
            </Button>
            <Button
              onClick={async () => {
                await handleReassignCategory();
                setCategoryDialogOpen(false);
              }}
              disabled={!hasCategoryChanged || reassigningCategory}
            >
              {reassigningCategory ? "Updating..." : "Save change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
