"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User as UserIcon,
  FileText,
  CheckCircle,
  Calendar,
  AlertCircle,
  Flag,
  Hash,
  Tag,
  Users,
  CalendarClock,
  Send,
  ExternalLink,
  Eye,
  Image,
  Video,
  File,
  Play,
  X
} from "lucide-react";
import {
  api,
  updateTicketStatusTeam,
  getTicketAttachments,
  getTeamTicketById,
  adminGetTicketHistory,
  adminAddNote,
  assignTeamsToTicket,
  getMyTeam,
  uploadTicketAttachments,
  getCurrentUser,
  assignTicketMember,
  getTeamById,
} from "@/lib/api";
import { formatDateTimeSmart } from "@/lib/utils";
import { Ticket, User, ChangedBy } from "@/lib/types";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

// Fetcher function for SWR
const fetcher = (url: string) => api.get(url).then(res => res.data);

// Helper function to format role display
const formatUserRole = (user: ChangedBy | User, lang: "en" | "hi" | "mr") => {
  if (!user) return '';

  // Check for admin role
  if (user.role === 'admin' || ('displayRole' in user && user.displayRole === 'admin')) {
    return tr(lang, "ticketDetail.role.admin");
  }

  // Check for team leader (staff with isTeamLeader: true)
  if (user.role === 'staff' && 'isTeamLeader' in user && user.isTeamLeader === true) {
    return tr(lang, "ticketDetail.role.teamLead");
  }

  // Check for staff
  if (user.role === 'staff' || ('displayRole' in user && user.displayRole === 'staff')) {
    return tr(lang, "ticketDetail.role.staff");
  }

  // Check for team leader display role
  if ('displayRole' in user && user.displayRole === 'team_leader') {
    return tr(lang, "ticketDetail.role.teamLead");
  }

  return '';
};

// Helper function to format changed by information
const formatChangedBy = (changedBy: string | User | ChangedBy, lang: "en" | "hi" | "mr") => {
  if (!changedBy) return tr(lang, "ticketDetail.unknownUser");

  if (typeof changedBy === 'string') return changedBy;

  // Handle User type with role information
  const userRole = formatUserRole(changedBy, lang);
  const userName = changedBy.fullName ||
    (changedBy.firstName && changedBy.lastName ? `${changedBy.firstName} ${changedBy.lastName}` : null) ||
    changedBy.email ||
    ('name' in changedBy ? changedBy.name : undefined); // Fallback to name field from API

  if (userName && userRole) {
    return `${userName} (${userRole})`;
  }

  // Fallback to name only if available
  if (userName) return userName;

  return tr(lang, "ticketDetail.unknownUser");
};

// Status badge helper function
const getStatusBadge = (status: string | undefined) => {
  if (!status) {
    return (
      <Badge variant="secondary" className="bg-gray-500/15 text-gray-700 dark:text-gray-300">
        LOADING
      </Badge>
    );
  }

  const statusConfig = {
    open: { variant: "secondary" as const, className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
    in_progress: { variant: "default" as const, className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
    assigned: { variant: "secondary" as const, className: "bg-purple-500/15 text-purple-700 dark:text-purple-300" },
    pending_user: { variant: "secondary" as const, className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
    pending_admin: { variant: "secondary" as const, className: "bg-purple-500/15 text-purple-700 dark:text-purple-300" },
    resolved: { variant: "secondary" as const, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
    closed: { variant: "outline" as const, className: "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300" }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;

  return (
    <Badge variant={config.variant} className={config.className}>
      {status.replace("_", " ").toUpperCase()}
    </Badge>
  );
};

interface StaffTicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function StaffTicketDetailPage({ params }: StaffTicketDetailPageProps) {
  const { lang } = useLanguage();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("activity");
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofFileName, setProofFileName] = useState<string>("");
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofInputKey, setProofInputKey] = useState(0);
  const [assignMemberOpen, setAssignMemberOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [assigningMember, setAssigningMember] = useState(false);
  
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
  
  // Unwrap the params promise
  const { id } = use(params);
  
  const { data, isLoading, error, mutate } = useSWR(
    `team-ticket-${id}`,
    () => getTeamTicketById(id),
    { revalidateOnFocus: false }
  );

  const {
    data: attachmentsData,
    isLoading: loadingAttachments,
    mutate: mutateAttachments,
  } = useSWR(
    `attachments-${id}`,
    () => getTicketAttachments(id),
    { revalidateOnFocus: false }
  );

  const { data: myTeamData } = useSWR("my-team", () => getMyTeam(), { revalidateOnFocus: false });
  const { data: currentUser } = useSWR("current-user", getCurrentUser, {
    revalidateOnFocus: false,
  });
  const isTeamLead = currentUser?.teams?.some((t) => t.isLeader) ?? false;
  const leaderTeamId =
    currentUser?.teams?.find((t) => t.isLeader)?.id ?? currentUser?.teams?.[0]?.id;

  const { data: teamDetails } = useSWR(
    isTeamLead && leaderTeamId ? ["team-details", leaderTeamId] : null,
    () => getTeamById(leaderTeamId!),
    { revalidateOnFocus: false }
  );

  const teamMembers =
    teamDetails?.employees?.filter((member) => member._id !== teamDetails?.leaderId) ?? [];

  // Ticket History
  type ChangeItem = { id: string; field?: string; oldValue?: string; newValue?: string; changeType?: string; description?: string; changedBy?: string; changedAt?: string };
  type TicketHistory = { ticketNumber?: string; title?: string; changeHistory?: ChangeItem[] };
  const { data: historyResp, isLoading: loadingHistory } = useSWR<TicketHistory>(
    activeSubTab === "activity" ? `ticket-history-${id}` : null,
    () => adminGetTicketHistory(id),
    { revalidateOnFocus: false }
  );

  const activityItems: ChangeItem[] = (historyResp?.changeHistory ?? [])
    .filter((h) => !(h.field === 'status' && (h.oldValue ?? '') === (h.newValue ?? '')))
    .slice()
    .sort((a, b) => {
      const ta = a.changedAt ? new Date(a.changedAt).getTime() : 0;
      const tb = b.changedAt ? new Date(b.changedAt).getTime() : 0;
      return tb - ta; // newest first
    });

  const ticket = data?.ticket as Ticket | undefined;

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

  const attachments = (attachmentsData?.attachments || []) as AttachmentItem[];
  const isClosed = !!ticket && ticket.status === 'closed';
  const assignedTeamCount = ticket?.assignedTeams?.length ?? 0;
  const primaryTeam = myTeamData?.team || myTeamData?.teams?.[0];
  const primaryTeamId = (primaryTeam as { _id?: string; id?: string } | undefined)?._id || (primaryTeam as { _id?: string; id?: string } | undefined)?.id;
  const currentUserId =
    (currentUser as User | undefined)?.id || (currentUser as User | undefined)?._id;

  const isAssignedUser =
    !!ticket &&
    !!currentUserId &&
    !!ticket.assignedUser &&
    ((ticket.assignedUser as User)._id === currentUserId ||
      (ticket.assignedUser as { id?: string }).id === currentUserId);

  const isLeaderForTicketTeam =
    !!primaryTeamId &&
    !!ticket?.assignedTeams?.some(
      (t) => (t as { _id?: string; id?: string })._id === primaryTeamId || (t as { _id?: string; id?: string }).id === primaryTeamId
    );

  const canUpdateStatus = !!ticket && (isAssignedUser || isLeaderForTicketTeam);
  const canAssignMember = !!ticket && !ticket.assignedUser && isTeamLead;

  // Split attachments into those uploaded by citizens vs team members (staff/team leads).
  // Use the uploadedByRole field from the API to determine the category.
  // If uploadedByRole is "staff" (or the uploadedBy user has role "staff"), it's a team upload.
  // Otherwise, it's a citizen/user upload.
  const teamAttachments: AttachmentItem[] = attachments.filter((att) => {
    // Check uploadedByRole field first
    if (att.uploadedByRole === "staff") return true;
    // Fallback: check the uploadedBy user's role
    if (att.uploadedBy?.role === "staff") return true;
    return false;
  });

  const ticketUserAttachments: AttachmentItem[] = attachments.filter((att) => {
    // If it's not a team attachment, it's a user attachment
    const isTeam = att.uploadedByRole === "staff" || att.uploadedBy?.role === "staff";
    return !isTeam;
  });

  const hasUserAttachments = ticketUserAttachments.length > 0;
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

  const renderAttachmentGrid = (items: AttachmentItem[]) => {
    if (!items.length) {
      return (
        <div className="text-xs text-muted-foreground text-center py-4">
          No files in this section yet.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
        {items.map((att) => (
          <div
            key={att._id}
            className="group relative aspect-square rounded-lg border overflow-hidden bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:shadow-md"
          >
            {/* Thumbnail/Icon */}
            <div className="w-full h-full flex items-center justify-center">
              {isImage(att.mimeType) ? (
                <img src={att.url} alt={att.filename || "Attachment"} className="w-full h-full object-cover" />
              ) : isVideo(att.mimeType) ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Video className="size-8" />
                  <span className="text-xs font-medium">
                    {tr(lang, "ticketDetail.fileType.video")}
                  </span>
                </div>
              ) : isPdf(att.mimeType) ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="size-8" />
                  <span className="text-xs font-medium">
                    {tr(lang, "ticketDetail.fileType.pdf")}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <File className="size-8" />
                  <span className="text-xs font-medium">
                    {tr(lang, "ticketDetail.fileType.file")}
                  </span>
                </div>
              )}
            </div>

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 hover:bg-white text-black border-0"
                onClick={() => {
                  setPreviewAttachment(att);
                  setPreviewOpen(true);
                }}
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
              {att.size < 1024
                ? `${att.size} B`
                : att.size < 1024 * 1024
                ? `${Math.round(att.size / 1024)} KB`
                : `${Math.round(att.size / (1024 * 1024))} MB`}
            </div>
          </div>
        ))}
      </div>
    );
  };


  const handleStartWork = async () => {
    if (!ticket) return;

    try {
      setUpdatingStatus(true);
      await updateTicketStatusTeam(id, {
        status: "in_progress",
      });
      toast.success(tr(lang, "ticketDetail.workStartedSuccessfully"));
      mutate(); 
    } catch (error: unknown) {
      console.error("Failed to start work:", error);
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || tr(lang, "ticketDetail.failedToStartWork")
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!ticket) return;

    if (!proofFile) {
      toast.error(tr(lang, "ticketDetail.pleaseUploadPhoto"));
      return;
    }

    try {
      setUpdatingStatus(true);
      // 1) Upload proof attachment (image only) - using "add" mode to append to existing attachments
      await uploadTicketAttachments(id, [proofFile], "add");

      // 2) Update status to resolved
      await updateTicketStatusTeam(id, {
        status: "resolved",
      });

      toast.success(tr(lang, "ticketDetail.ticketMarkedResolved"));
      mutate(); // Refresh the ticket data
      mutateAttachments(); // Refresh attachments list
      setResolutionNote("");
      setProofFile(null);
      setProofFileName("");
      if (proofPreviewUrl) {
        URL.revokeObjectURL(proofPreviewUrl);
        setProofPreviewUrl(null);
      }
    } catch (error: unknown) {
      console.error("Failed to mark as resolved:", error);
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || tr(lang, "ticketDetail.failedToMarkResolved")
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignToMyTeam = async () => {
    if (!ticket || !primaryTeamId) return;
    try {
      setAssigning(true);
      await assignTeamsToTicket(ticket._id || id, [primaryTeamId], "replace");
      toast.success(`${tr(lang, "ticketDetail.ticketAssignedToTeam")} ${primaryTeam?.name ?? tr(lang, "ticketDetail.yourTeam")}`);
      mutate();
    } catch (error: unknown) {
      console.error("Failed to assign team:", error);
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || tr(lang, "ticketDetail.failedToAssignTeam")
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignMember = async () => {
    if (!ticket) return;
    if (!selectedMemberId) {
      toast.error(tr(lang, "teamTickets.assignMember.selectError"));
      return;
    }
    setAssigningMember(true);
    try {
      await assignTicketMember(ticket._id || id, selectedMemberId);
      toast.success(tr(lang, "teamTickets.assignMember.success"));
      setAssignMemberOpen(false);
      setSelectedMemberId("");
      mutate();
    } catch (error: unknown) {
      console.error("Failed to assign member:", error);
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          tr(lang, "teamTickets.assignMember.error")
      );
    } finally {
      setAssigningMember(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !ticket) return;
    
    
    try {
      setAddingNote(true);
      await adminAddNote(id, newNote.trim());
      toast.success(tr(lang, "ticketDetail.noteAddedSuccessfully"));
      mutate(); // Refresh the ticket data to get updated notes
      setNewNote("");
    } catch (error: unknown) {
      console.error("Failed to add note:", error);
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || tr(lang, "ticketDetail.failedToAddNote")
      );
    } finally {
      setAddingNote(false);
    }
  };

  const openInGoogleMaps = () => {
    const coordinates = ticket?.location?.coordinates || ticket?.coordinates;
    if (!coordinates) return;
    const { latitude, longitude } = coordinates;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/my-tickets">
              <ArrowLeft className="size-4 mr-2" />
              {tr(lang, "ticketDetail.backToTickets")}
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{tr(lang, "ticketDetail.ticketNotFound")}</h2>
            <p className="text-muted-foreground text-center">
              {tr(lang, "ticketDetail.ticketNotFoundDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/my-tickets">
              <ArrowLeft className="size-4 mr-2" />
              {tr(lang, "ticketDetail.backToTickets")}
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) {
    // If the ticket isn't found (e.g. user has no access or invalid URL),
    // show the same friendly "not found" state as the error branch instead
    // of rendering an empty page.
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/my-tickets">
              <ArrowLeft className="size-4 mr-2" />
              {tr(lang, "ticketDetail.backToTickets")}
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {tr(lang, "ticketDetail.ticketNotFound")}
            </h2>
            <p className="text-muted-foreground text-center">
              {tr(lang, "ticketDetail.ticketNotFoundDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
     
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/my-tickets">
              <ArrowLeft className="size-4 mr-2" />
              {tr(lang, "ticketDetail.backToTickets")}
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status actions moved to dedicated section */}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Hash className="size-5 text-muted-foreground" />
                      Ticket #{ticket.ticketNumber || ticket._id?.slice(-8) || id.slice(-8)}
                    </CardTitle>
                  </div>
                </div>
                
                {/* Top Right - Category, Status, and Date */}
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex items-center gap-2">
                    {ticket.category && (
                      <Badge variant="secondary">
                        <Tag className="size-3 mr-1" />
                        {typeof ticket.category === 'string'
                          ? ticket.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                          : typeof ticket.category === 'object' && ticket.category && 'name' in ticket.category
                          ? (ticket.category as { name: string }).name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                          : 'Category'}
                      </Badge>
                    )}
                    {getStatusBadge(ticket?.status)}
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarClock className="size-4" />
                    <span>{ticket?.createdAt ? formatDateTimeSmart(ticket.createdAt) : tr(lang, "ticketDetail.loading")}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.title && (
                  <div>
                    <h3 className="font-medium mb-2">{tr(lang, "ticketDetail.title")}</h3>
                    <p className="text-sm">{ticket.title}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium mb-2">{tr(lang, "ticketDetail.description")}</h3>
                  <p className="text-sm leading-relaxed">{ticket.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{tr(lang, "ticketDetail.notesAndActivity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
                <TabsList>
                  <TabsTrigger value="activity">{tr(lang, "ticketDetail.tabs.activity")}</TabsTrigger>
                  <TabsTrigger value="notes">{tr(lang, "ticketDetail.tabs.notes")}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="activity" className="mt-4">
                  {loadingHistory ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="relative pl-10">
                          <Skeleton className="h-3 w-3 rounded-full absolute left-2.5 top-1" />
                          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activityItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="rounded-full bg-muted p-3 w-fit mx-auto mb-3">
                        <Flag className="size-6 text-muted-foreground" />
                      </div>
                      <div className="text-sm text-muted-foreground">{tr(lang, "ticketDetail.noActivity")}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tr(lang, "ticketDetail.noActivityHelper")}
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" aria-hidden />
                      <div className="space-y-4">
                        {activityItems.map((h, index) => (
                          <div key={h.id || index} className="relative pl-10">
                            <div className={`absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-background ${
                              h.field === 'status' ? 'bg-blue-500' : 'bg-muted-foreground'
                            }`} />
                            
                            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {h.changeType?.replace(/_/g, " ") ?? tr(lang, "ticketDetail.change")}
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
                                    <span>{tr(lang, "ticketDetail.statusChangedFrom")}</span>
                                    <Badge variant="outline" className="capitalize">
                                      {(h.oldValue ?? '').toString().replace(/_/g, ' ')}
                                    </Badge>
                                    <span>{tr(lang, "ticketDetail.statusChangedTo")}</span>
                                    <Badge variant="outline" className="capitalize">
                                      {(h.newValue ?? '').toString().replace(/_/g, ' ')}
                                    </Badge>
                                  </div>
                                ) : (
                                  <div>{h.description ?? `${h.field ?? 'Field'} ${tr(lang, "ticketDetail.fieldUpdated")}`}</div>
                                )}
                              </div>
                              
                              {h.changedBy && (
                                <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                                  {tr(lang, "ticketDetail.changedBy")}: {formatChangedBy(h.changedBy, lang)}
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
                  {/* Add Note Form */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <Textarea
                        placeholder={tr(lang, "ticketDetail.addNotePlaceholder")}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                        className="flex-1"
                        maxLength={1000}
                      />
                      <Button 
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || addingNote}
                        size="sm"
                        className="shrink-0"
                      >
                        {addingNote ? (
                          <>
                            <Clock className="h-4 w-4 mr-1 animate-spin" />
                            {tr(lang, "ticketDetail.addingNote")}
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            {tr(lang, "ticketDetail.addNote")}
                          </>
                        )}
                      </Button>
                    </div>
                    {newNote.length > 0 && (
                      <div className="text-xs text-muted-foreground text-right">
                        {newNote.length}/1000 {tr(lang, "ticketDetail.charactersCount")}
                      </div>
                    )}
                  </div>

                  {/* Existing Notes */}
                  {(ticket?.adminNotes && ticket.adminNotes.length > 0) ? (
                    <div className="grid gap-2">
                      {ticket.adminNotes
                        .slice()
                        .sort((a, b) => {
                          const ta = a.addedAt ? new Date(a.addedAt).getTime() : 0;
                          const tb = b.addedAt ? new Date(b.addedAt).getTime() : 0;
                          return tb - ta; // newest first
                        })
                        .map((note, index) => (
                          <div key={note._id || index} className="text-xs text-muted-foreground border rounded p-2">
                            <div className="text-foreground text-sm">{note.note}</div>
                            {note.addedAt && (
                              <div className="opacity-70 mt-1">
                                {formatDateTimeSmart(note.addedAt)}
                                {note.addedBy && (
                                  <span> • by {formatChangedBy(note.addedBy, lang)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">{tr(lang, "ticketDetail.noNotes")}</div>
                  )}
                </TabsContent>
                
              </Tabs>
            </CardContent>
          </Card>


        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Flag className="size-4 text-blue-600" />
                {tr(lang, "ticketDetail.statusAndActions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canAssignMember && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => {
                    setSelectedMemberId("");
                    setAssignMemberOpen(true);
                  }}
                >
                  {tr(lang, "teamTickets.actions.assign")}
                </Button>
              )}
              {/* Current Status */}
              <div className="p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{tr(lang, "ticketDetail.currentStatus")}</span>
                  {getStatusBadge(ticket.status)}
                </div>
                {/* Removed created/updated timestamp from this card as requested */}
              </div>
              
              {/* Status Action Buttons */}
              <div className="space-y-3">
                {ticket?.status === "assigned" && canUpdateStatus && (
                  <Button 
                    onClick={handleStartWork}
                    disabled={updatingStatus || isClosed}
                    className="w-full h-9"
                    size="sm"
                  >
                    {updatingStatus ? (
                      <>
                        <Clock className="size-3 mr-2 animate-spin" />
                        {tr(lang, "ticketDetail.starting")}
                      </>
                    ) : (
                      <>
                        <Play className="size-3 mr-2" />
                        {tr(lang, "ticketDetail.startWork")}
                      </>
                    )}
                  </Button>
                )}

                {ticket?.status === "in_progress" && canUpdateStatus && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-medium flex items-center gap-2">
                        <Image className="size-3 text-muted-foreground" />
                        {tr(lang, "ticketDetail.completionPhoto")}
                      </label>
                      <div className="relative">
                        <Input
                          key={proofInputKey}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) {
                              setProofFile(null);
                              setProofFileName("");
                              if (proofPreviewUrl) {
                                URL.revokeObjectURL(proofPreviewUrl);
                                setProofPreviewUrl(null);
                              }
                              setProofInputKey((k) => k + 1);
                              return;
                            }
                            if (!file.type.startsWith("image/")) {
                              toast.error(tr(lang, "ticketDetail.pleaseUploadImage"));
                              setProofFile(null);
                              setProofFileName("");
                              if (proofPreviewUrl) {
                                URL.revokeObjectURL(proofPreviewUrl);
                                setProofPreviewUrl(null);
                              }
                              setProofInputKey((k) => k + 1);
                              return;
                            }
                            setProofFile(file);
                            setProofFileName(file.name);
                            if (proofPreviewUrl) {
                              URL.revokeObjectURL(proofPreviewUrl);
                            }
                            const url = URL.createObjectURL(file);
                            setProofPreviewUrl(url);
                          }}
                          className="sr-only"
                          id={`file-input-${proofInputKey}`}
                        />
                        <label
                          htmlFor={`file-input-${proofInputKey}`}
                          className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="text-muted-foreground">
                            {proofFileName || tr(lang, "ticketDetail.noFileChosen")}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById(`file-input-${proofInputKey}`)?.click();
                            }}
                          >
                            {tr(lang, "ticketDetail.chooseFile")}
                          </Button>
                        </label>
                      </div>
                      {proofPreviewUrl && (
                        <div className="mt-3 relative h-24 w-full overflow-hidden rounded-lg border bg-muted/40">
                          <img
                            src={proofPreviewUrl}
                            alt={proofFileName || tr(lang, "ticketDetail.completionProofPreview")}
                            className="h-full w-full object-cover"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute top-1 right-1 h-7 w-7 bg-background/70 hover:bg-background"
                            onClick={() => {
                              if (proofPreviewUrl) {
                                URL.revokeObjectURL(proofPreviewUrl);
                              }
                              setProofPreviewUrl(null);
                              setProofFile(null);
                              setProofFileName("");
                              setProofInputKey((k) => k + 1);
                            }}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleMarkResolved}
                      disabled={updatingStatus || isClosed || !proofFile}
                      className="w-full h-9"
                      size="sm"
                      variant="default"
                    >
                      {updatingStatus ? (
                        <>
                          <Clock className="size-3 mr-2 animate-spin" />
                          {tr(lang, "ticketDetail.marking")}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="size-3 mr-2" />
                          {tr(lang, "ticketDetail.markAsResolved")}
                        </>
                      )}
                    </Button>
                  </>
                )}

                {ticket?.status === "resolved" && (
                  <div className="p-3 bg-muted/30 rounded-lg border text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4" />
                      <span>{tr(lang, "ticketDetail.awaitingConfirmation")}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Timing Info (created removed as requested) */}
              <div className="space-y-2 text-xs text-muted-foreground">
                {ticket?.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="size-3" />
                    <span>{tr(lang, "ticketDetail.updated")} {formatDateTimeSmart(ticket.updatedAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!assignedTeamCount && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="size-4 text-emerald-600" />
                  {tr(lang, "ticketDetail.assignTicket")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {tr(lang, "ticketDetail.notAssignedDescription")}
                </p>
                {primaryTeamId ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      {tr(lang, "ticketDetail.team")}: {primaryTeam?.name ?? tr(lang, "ticketDetail.myTeam")}
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleAssignToMyTeam}
                      disabled={assigning}
                    >
                      {assigning ? (
                        <>
                          <Clock className="size-4 mr-2 animate-spin" />
                          {tr(lang, "ticketDetail.assigning")}
                        </>
                      ) : (
                        <>
                          <Users className="size-4 mr-2" />
                          {tr(lang, "ticketDetail.assignToMyTeam")}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {tr(lang, "ticketDetail.needTeamLeadAccess")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}


          {/* Reporter Info */}
          {ticket.reportedBy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserIcon className="size-4" />
                  {tr(lang, "ticketDetail.reportedBy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{ticket.reportedBy.fullName}</p>
                  <p className="text-sm text-muted-foreground">{ticket.reportedBy.email}</p>
                  {ticket.reportedBy.phoneNumber && (
                    <p className="text-sm text-muted-foreground">{ticket.reportedBy.phoneNumber}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

         
          {(ticket.tags && ticket.tags.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="size-4" />
                  {tr(lang, "ticketDetail.tags")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Escalation Status */}
          {(ticket.escalated || ticket.slaBreached) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="size-4" />
                  {tr(lang, "ticketDetail.alerts")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ticket.escalated && (
                  <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-md">
                    <AlertCircle className="size-4 text-orange-600" />
                    <span className="text-sm text-orange-700 dark:text-orange-300">
                      {tr(lang, "ticketDetail.escalated")}
                    </span>
                  </div>
                )}
                {ticket.slaBreached && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-md">
                    <Clock className="size-4 text-red-600" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {tr(lang, "ticketDetail.slaBreached")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Location Card */}
          {(ticket.location?.coordinates || ticket.coordinates || ticket.location) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="size-5 text-blue-600" />
                  {tr(lang, "ticketDetail.incidentLocation")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Map Action */}
                  {(ticket.location?.coordinates || ticket.coordinates) && (
                    <div className="flex items-center justify-between p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-full">
                          <MapPin className="size-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                            {tr(lang, "ticketDetail.gpsLocation")}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {tr(lang, "ticketDetail.preciseCoordinatesAvailable")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openInGoogleMaps}
                        className="bg-white dark:bg-blue-950 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 h-7 px-2"
                      >
                        <ExternalLink className="size-3 mr-1" />
                        {tr(lang, "ticketDetail.view")}
                      </Button>
                    </div>
                  )}
                  
                  {/* No location fallback */}
                  {!ticket.location?.coordinates && !ticket.coordinates && !ticket.location && (
                    <div className="text-center py-6 text-muted-foreground">
                      <MapPin className="size-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{tr(lang, "ticketDetail.noLocationInfo")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-green-600" />
                {tr(lang, "ticketDetail.attachments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAttachments ? (
                <div className="grid gap-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-3/4" />
                </div>
              ) : attachments.length === 0 && !hasUserAttachments ? (
                <div className="text-xs text-muted-foreground text-center py-4">{tr(lang, "ticketDetail.noAttachments")}</div>
              ) : (
                <Tabs
                  value={activeAttachmentsTab}
                  onValueChange={(value) => setActiveAttachmentsTab(value as "user" | "team")}
                  className="w-full"
                >
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="user" className="flex-1">
                      Citizen uploads
                    </TabsTrigger>
                    <TabsTrigger value="team" className="flex-1">
                      Team proof
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="user" className="mt-3">
                    {renderAttachmentGrid(ticketUserAttachments)}
                  </TabsContent>

                  <TabsContent value="team" className="mt-3">
                    {renderAttachmentGrid(teamAttachments)}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Attachment Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={(o) => { setPreviewOpen(o); if (!o) setPreviewAttachment(null); }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewAttachment && isImage(previewAttachment.mimeType) && <Image className="size-5" />}
              {previewAttachment && isVideo(previewAttachment.mimeType) && <Video className="size-5" />}
              {previewAttachment && isPdf(previewAttachment.mimeType) && <FileText className="size-5" />}
              {previewAttachment && !isImage(previewAttachment.mimeType) && !isVideo(previewAttachment.mimeType) && !isPdf(previewAttachment.mimeType) && <File className="size-5" />}
              {tr(lang, "ticketDetail.preview")}
            </DialogTitle>
            {previewAttachment && (
              <DialogDescription className="flex items-center justify-between">
                <span>{previewAttachment.mimeType}</span>
                <Button asChild size="sm" variant="outline">
                  <a href={previewAttachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                    <ExternalLink className="size-3" />
                    {tr(lang, "ticketDetail.openOriginal")}
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
                    {tr(lang, "ticketDetail.previewNotAvailable")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tr(lang, "ticketDetail.useOpenOriginal")}
                  </p>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Member Dialog (team lead view) */}
      <Dialog
        open={assignMemberOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAssignMemberOpen(false);
            setSelectedMemberId("");
          } else {
            setAssignMemberOpen(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr(lang, "teamTickets.assignMember.title")}</DialogTitle>
            <DialogDescription>
              {tr(lang, "teamTickets.assignMember.selectLabel")}
            </DialogDescription>
          </DialogHeader>

          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tr(lang, "teamTickets.assignMember.noMembers")}
            </p>
          ) : (
            <div className="grid gap-3">
              <label className="text-sm font-medium">
                {tr(lang, "teamTickets.assignMember.selectLabel")}
              </label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={tr(lang, "teamTickets.assignMember.selectPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member._id} value={member._id}>
                      {(member.fullName ??
                        `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim()) ||
                        member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAssignMemberOpen(false);
                setSelectedMemberId("");
              }}
              disabled={assigningMember}
            >
              {tr(lang, "teamTickets.assignMember.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleAssignMember}
              disabled={assigningMember || teamMembers.length === 0}
            >
              {assigningMember
                ? tr(lang, "teamTickets.assignMember.assigning")
                : tr(lang, "teamTickets.assignMember.assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
