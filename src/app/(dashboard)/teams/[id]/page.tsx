"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  getTeamById,
  getTeamLeader,
  getStaff,
  getTeams,
  addEmployeesToTeam,
  updateTeamLeader,
  adminGetTickets,
  getTicketAttachments,
} from "@/lib/api";
import type { User, Team } from "@/lib/types";
import { formatDateTimeSmart } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Crown, 
  UserCog, 
  ArrowLeft, 
  Users, 
  Building2, 
  Mail, 
  UserPlus,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  FileText,
  Image,
  Video,
  File,
  Eye,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

export default function TeamDetailsPage() {
  const { lang } = useLanguage();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const teamId = params?.id;
  const [submitting, setSubmitting] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isChangeLeaderOpen, setIsChangeLeaderOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: team, isLoading, mutate } = useSWR(teamId ? ["team", teamId] : null, () => getTeamById(teamId!), { revalidateOnFocus: false });
  const { data: staffData, mutate: staffMutate } = useSWR("staff", () => getStaff({ page: 1, limit: 100 }), { revalidateOnFocus: false });
  const { data: teamsData } = useSWR("all-teams", () => getTeams({ page: 1, limit: 100 }), { revalidateOnFocus: false });

  // Removed Activity tab and history fetching
  
  const allStaff: User[] = staffData?.staff ?? [];
  const allTeams: Team[] = teamsData?.teams ?? [];
  
  // Get all staff members who are already assigned to any team (excluding current team)
  const assignedStaffIds = useMemo(() => {
    const assignedIds = new Set<string>();
    allTeams.forEach(t => {
      if (t._id !== teamId) { // Exclude current team
        t.employees.forEach(emp => assignedIds.add(emp._id));
      }
    });
    return assignedIds;
  }, [allTeams, teamId]);

  const onAddMember = async (employeeId: string) => {
    if (!team) return;
    setSubmitting(true);
    try {
      await addEmployeesToTeam(team._id, [employeeId]);
      toast.success(tr(lang, "teamDetail.addMember.toast.success"));
      setIsAddMemberOpen(false);
      mutate();
    } catch {
      toast.error(tr(lang, "teamDetail.addMember.toast.error"));
    } finally {
      setSubmitting(false);
    }
  };



  const onSetLeader = async (leaderId: string) => {
    if (!team) return;
    setSubmitting(true);
    try {
      await updateTeamLeader(team._id, leaderId);
      toast.success(tr(lang, "teamDetail.changeLeader.toast.success"));
      setIsChangeLeaderOpen(false);
      mutate();
    } catch {
      toast.error(tr(lang, "teamDetail.changeLeader.toast.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const today = useMemo(() => 
    new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric', 
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    }).format(new Date()),
    []
  );

  // Team members ordered with leader first, then others alphabetically
  const orderedMembers: User[] = useMemo(() => {
    if (!team) return [] as User[];
    const leader = team.employees.find(e => e._id === team.leaderId);
    const others = team.employees
      .filter(e => e._id !== team.leaderId)
      .slice()
      .sort((a, b) => {
        const nameA = (a.fullName || `${a.firstName || ''} ${a.lastName || ''}` || a.email || '').trim().toLowerCase();
        const nameB = (b.fullName || `${b.firstName || ''} ${b.lastName || ''}` || b.email || '').trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });
    return leader ? [leader, ...others] : others;
  }, [team]);

  const getInitials = (name?: string) => {
    if (!name) return 'T';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading || !team) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* HEADER */}
      <Card className="overflow-hidden border-0 bg-transparent shadow-none">
        <AnimatedGradientHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-primary-foreground">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-foreground/20 bg-background/60 backdrop-blur">
                <AvatarFallback className="text-primary-foreground bg-foreground/10 text-lg font-semibold">
                  {getInitials(team.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <Building2 className="h-5 w-5 opacity-90" /> 
                  {team.name}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20">
                    {today}
                  </Badge>
                  <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {team.employees.length} {tr(lang, "teamDetail.badge.members")}
                  </Badge>
                  {team.isActive ? (
                    <Badge variant="secondary" className="bg-emerald-500/20 text-inherit border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {tr(lang, "teamDetail.badge.active")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-500/20 text-inherit border-red-500/30 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> {tr(lang, "teamDetail.badge.inactive")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-foreground/10 text-inherit hover:bg-foreground/20 border-foreground/20"
                onClick={() => router.push("/teams")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {tr(lang, "teamDetail.button.backToTeams")}
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-foreground/10 text-inherit hover:bg-foreground/20 border-foreground/20"
                onClick={() => setIsAddMemberOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                {tr(lang, "teamDetail.button.addMember")}
              </Button>
            </div>
          </div>
        </AnimatedGradientHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {tr(lang, "teamDetail.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Attachments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* LEFT: Team Info & Members */}
            <div className="lg:col-span-2 space-y-6">
              {/* Team Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {tr(lang, "teamDetail.teamInfo.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border p-4 bg-muted/20">
                    <p className="text-sm leading-relaxed">
                      {team.description || tr(lang, "teamDetail.teamInfo.noDescription")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {tr(lang, "teamDetail.members.title")} ({team.employees.length})
                    </CardTitle>
                    {team.employees.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsChangeLeaderOpen(true)} 
                        disabled={submitting}
                      >
                        <UserCog className="h-4 w-4 mr-1" /> 
                        {tr(lang, "teamDetail.members.changeLeader")}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {team.employees.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">{tr(lang, "teamDetail.members.empty.title")}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {tr(lang, "teamDetail.members.empty.description")}
                      </p>
                      <Button onClick={() => setIsAddMemberOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        {tr(lang, "teamDetail.members.empty.addFirst")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderedMembers.map((member) => (
                        <motion.div
                          key={member._id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="text-sm font-medium">
                                {getInitials(member.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{member.fullName}</span>
                                {team.leaderId === member._id && (
                                  <Badge variant="default" className="text-xs">
                                    <Crown className="h-3 w-3 mr-1" /> {tr(lang, "teamDetail.members.teamLead")}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Team Lead & Coverage */}
            <div className="space-y-6">
              {/* Team Lead */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    {tr(lang, "teamDetail.teamLead.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TeamLeadDisplay 
                    teamId={team._id} 
                    fallbackName={team.employees.find(e => e._id === team.leaderId)?.fullName}
                    leaderId={team.leaderId}
                    employees={team.employees}
                    lang={lang}
                  />
                </CardContent>
              </Card>

              {/* Coverage Areas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {tr(lang, "teamDetail.coverage.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {team.areas.map((area, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <div className="font-medium">{area.zone}</div>
                          <div className="text-muted-foreground">
                            {[area.area, area.city, area.state].filter(Boolean).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions removed */}
            </div>
          </div>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="space-y-6">
          <TeamAttachmentsTab teamId={team._id} lang={lang} />
        </TabsContent>
      </Tabs>

      {/* Add Member */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr(lang, "teamDetail.addMember.title")}</DialogTitle>
          </DialogHeader>
          {team && (
            <AddMemberForm team={team} allStaff={allStaff} onAddMember={onAddMember} submitting={submitting} assignedStaffIds={assignedStaffIds} lang={lang} />
          )}
        </DialogContent>
      </Dialog>


      {/* Change Team Lead */}
      <Dialog open={isChangeLeaderOpen} onOpenChange={setIsChangeLeaderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr(lang, "teamDetail.changeLeader.title")}</DialogTitle>
          </DialogHeader>
          {team && (
            <ChangeLeaderForm team={team} onSubmit={(tid, lid) => onSetLeader(lid)} submitting={submitting} lang={lang} />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

function TeamLeadDisplay({ 
  teamId, 
  fallbackName, 
  leaderId, 
  employees,
  lang
}: { 
  teamId: string; 
  fallbackName?: string; 
  leaderId?: string;
  employees: User[];
  lang: "en" | "hi" | "mr";
}) {
  const { data, isLoading } = useSWR(["team-leader", teamId], async () => await getTeamLeader(teamId), { revalidateOnFocus: false });
  const name = data?.fullName || fallbackName;
  const leadMember = employees.find(e => e._id === leaderId);

  const getInitials = (name?: string) => {
    if (!name) return 'TL';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!name && !leadMember) {
    return (
      <div className="text-center py-6">
        <Crown className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{tr(lang, "teamDetail.teamLead.noLead")}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-12 w-12">
        <AvatarFallback className="text-sm font-medium">
          {getInitials(name || leadMember?.fullName)}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium flex items-center gap-2">
          {name || leadMember?.fullName}
          <Crown className="h-4 w-4 text-amber-500" />
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <Mail className="h-3 w-3" />
          {leadMember?.email || tr(lang, "teamDetail.teamLead.emailNotAvailable")}
        </div>
      </div>
    </div>
  );
}

function AnimatedGradientHeader({ children }: { children: React.ReactNode }) {
  const style = {
    ['--grad-from' as unknown as string]: 'var(--primary)',
    ['--grad-to' as unknown as string]: 'color-mix(in oklch, var(--primary) 45%, var(--accent))',
  } as React.CSSProperties;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
    >
      <div 
        style={style} 
        className="animated-gradient-surface gradient-noise p-6 sm:p-8 text-primary-foreground"
      >
        {children}
      </div>
      <style jsx global>{`
        .animated-gradient-surface { 
          position: relative; 
          border-radius: 0.75rem; 
          background-image: linear-gradient(135deg, var(--grad-from), var(--grad-to)); 
          background-size: 100% 100%; 
        }
        .gradient-noise::after { 
          content: ''; 
          position: absolute; 
          inset: 0; 
          pointer-events: none; 
          border-radius: inherit; 
          background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,.06) 1px, transparent 1px); 
          background-size: 12px 12px; 
          opacity: .14; 
          mix-blend-mode: soft-light; 
        }
        .dark .gradient-noise::after { 
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.14) 1px, transparent 1px); 
          opacity: .14; 
          mix-blend-mode: overlay; 
        }
      `}</style>
    </motion.div>
  );
}

function AddMemberForm({ team, allStaff, onAddMember, submitting, assignedStaffIds, lang }: { team: Team; allStaff: User[]; onAddMember: (employeeId: string) => Promise<void>; submitting: boolean; assignedStaffIds: Set<string>; lang: "en" | "hi" | "mr"; }) {
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const availableStaff = allStaff.filter(s => 
    s.role === "staff" && 
    !team.employees.some(m => m._id === s._id) && // Not already in current team
    !assignedStaffIds.has(s._id) // Not assigned to any other team
  );

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return availableStaff;
    const searchLower = searchQuery.toLowerCase();
    return availableStaff.filter((staff) =>
      [staff.fullName, staff.email, staff.firstName, staff.lastName]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(searchLower))
    );
  }, [availableStaff, searchQuery]);

  const selectedStaffMember = availableStaff.find(s => s._id === selectedStaff);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) { toast.error(tr(lang, "teamDetail.addMember.selectError")); return; }
    await onAddMember(selectedStaff);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label>{tr(lang, "teamDetail.addMember.selectLabel")}</Label>
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name or email..."
            disabled={submitting}
          />
          <div className="max-h-56 overflow-y-auto space-y-2">
            {filteredStaff.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                {searchQuery.trim() 
                  ? "No staff members found matching your search"
                  : tr(lang, "teamDetail.addMember.noAvailable")}
              </div>
            ) : (
              filteredStaff.map((staff) => (
                <button
                  key={staff._id}
                  type="button"
                  onClick={() => setSelectedStaff(staff._id)}
                  disabled={submitting}
                  className={`w-full rounded-md border px-3 py-2 text-left transition hover:border-primary hover:bg-primary/5 ${
                    selectedStaff === staff._id 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{staff.fullName}</p>
                      <p className="text-xs text-muted-foreground">{staff.email}</p>
                    </div>
                    {selectedStaff === staff._id && (
                      <span className="text-xs font-medium text-primary">Selected</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        {selectedStaffMember && (
          <p className="text-xs text-muted-foreground">
            Selected: {selectedStaffMember.fullName} ({selectedStaffMember.email})
          </p>
        )}
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">{tr(lang, "teamDetail.addMember.cancel")}</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting || !selectedStaff || availableStaff.length === 0}>
          {submitting ? tr(lang, "teamDetail.addMember.adding") : tr(lang, "teamDetail.addMember.add")}
        </Button>
      </DialogFooter>
    </form>
  );
}


function ChangeLeaderForm({ team, onSubmit, submitting, lang }: { team: Team; onSubmit: (teamId: string, leaderId: string) => Promise<void>; submitting: boolean; lang: "en" | "hi" | "mr"; }) {
  const [selectedLeader, setSelectedLeader] = useState(team.leaderId || "");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeader) { toast.error(tr(lang, "teamDetail.changeLeader.selectError")); return; }
    await onSubmit(team._id, selectedLeader);
  };
  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label>{tr(lang, "teamDetail.changeLeader.selectLabel")}</Label>
        <Select value={selectedLeader} onValueChange={setSelectedLeader}>
          <SelectTrigger>
            <SelectValue placeholder={tr(lang, "teamDetail.changeLeader.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {team.employees.map((member) => (
              <SelectItem key={member._id} value={member._id}>
                <div className="flex items-center gap-2">
                  {team.leaderId === member._id && <Crown className="size-3 text-amber-500" />}
                  {member.fullName} ({member.email})
                  {team.leaderId === member._id && <span className="text-xs text-muted-foreground">{tr(lang, "teamDetail.changeLeader.current")}</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-muted-foreground">{tr(lang, "teamDetail.changeLeader.currentLabel")}: {team.employees.find(m => m._id === team.leaderId)?.fullName || tr(lang, "teamDetail.changeLeader.none")}</div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">{tr(lang, "teamDetail.changeLeader.cancel")}</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting || !selectedLeader || selectedLeader === team.leaderId}>{submitting ? tr(lang, "teamDetail.changeLeader.updating") : tr(lang, "teamDetail.changeLeader.change")}</Button>
      </DialogFooter>
    </form>
  );
}

function TeamAttachmentsTab({ teamId, lang }: { teamId: string; lang: "en" | "hi" | "mr" }) {
  const [activeAttachmentsTab, setActiveAttachmentsTab] = useState<"user" | "team">("user");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{
    _id: string;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  } | null>(null);

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
    ticketId?: string;
    ticketNumber?: string;
  };

  // Fetch all tickets (we'll filter by team client-side)
  const { data: ticketsData, isLoading: loadingTickets } = useSWR(
    ["admin-tickets-for-team", teamId],
    () => adminGetTickets({ page: 1, limit: 1000 }),
    { revalidateOnFocus: false }
  );

  // Filter tickets assigned to this team
  const teamTickets = useMemo(() => {
    if (!ticketsData?.tickets) return [];
    return ticketsData.tickets.filter((ticket) =>
      ticket.assignedTeams?.some((team) => {
        const teamIdStr = (team as { _id?: string; id?: string })._id || (team as { _id?: string; id?: string }).id;
        return teamIdStr === teamId;
      })
    );
  }, [ticketsData, teamId]);

  // Fetch attachments for all team tickets
  const attachmentResults = useSWR(
    teamTickets.length > 0 ? [`team-attachments-batch-${teamId}`, teamTickets.map(t => t._id).join(',')] : null,
    async () => {
      if (teamTickets.length === 0) return [];
      const results = await Promise.all(
        teamTickets.map(async (ticket) => {
          try {
            const attData = await getTicketAttachments(ticket._id);
            return {
              ticketId: ticket._id,
              ticketNumber: ticket.ticketNumber,
              attachments: (attData?.attachments || []).map((att) => ({
                ...att,
                ticketId: ticket._id,
                ticketNumber: ticket.ticketNumber,
              })),
            };
          } catch {
            return {
              ticketId: ticket._id,
              ticketNumber: ticket.ticketNumber,
              attachments: [],
            };
          }
        })
      );
      return results;
    },
    { revalidateOnFocus: false }
  );

  const allAttachments: AttachmentItem[] = useMemo(() => {
    if (!attachmentResults.data) return [];
    return attachmentResults.data.flatMap((result) => result.attachments);
  }, [attachmentResults.data]);

  // Split attachments by uploadedByRole
  const teamAttachments: AttachmentItem[] = allAttachments.filter((att) => {
    if (att.uploadedByRole === "staff") return true;
    if (att.uploadedBy?.role === "staff") return true;
    return false;
  });

  const userAttachments: AttachmentItem[] = allAttachments.filter((att) => {
    const isTeam = att.uploadedByRole === "staff" || att.uploadedBy?.role === "staff";
    return !isTeam;
  });

  const hasUserAttachments = userAttachments.length > 0;
  const hasTeamAttachments = teamAttachments.length > 0;

  useEffect(() => {
    if (!hasUserAttachments && hasTeamAttachments) {
      setActiveAttachmentsTab("team");
    } else if (hasUserAttachments && !hasTeamAttachments) {
      setActiveAttachmentsTab("user");
    }
  }, [hasUserAttachments, hasTeamAttachments]);

  const isImage = (m?: string) => Boolean(m && m.startsWith("image/"));
  const isVideo = (m?: string) => Boolean(m && m.startsWith("video/"));
  const isPdf = (m?: string) => m === "application/pdf";

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
                  <span className="text-xs font-medium">Video</span>
                </div>
              ) : isPdf(att.mimeType) ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="size-8" />
                  <span className="text-xs font-medium">PDF</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <File className="size-8" />
                  <span className="text-xs font-medium">File</span>
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

            {/* Ticket number badge */}
            {att.ticketNumber && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {att.ticketNumber}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loadingTickets || attachmentResults.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attachments from Team Tickets ({allAttachments.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allAttachments.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              No attachments found for tickets assigned to this team.
            </div>
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
                {renderAttachmentGrid(userAttachments)}
              </TabsContent>

              <TabsContent value="team" className="mt-3">
                {renderAttachmentGrid(teamAttachments)}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

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
                    Preview not available for this file type.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use &quot;Open Original&quot; to view the file.
                  </p>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


