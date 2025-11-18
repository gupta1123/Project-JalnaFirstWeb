"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  getTeamById,
  getTeamLeader,
  getStaff,
  getTeams,
  addEmployeesToTeam,
  updateTeamLeader,
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
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  User as UserIcon
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
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {tr(lang, "teamDetail.tabs.overview")}
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

        {/* Activity tab removed */}
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
  const availableStaff = allStaff.filter(s => 
    s.role === "staff" && 
    !team.employees.some(m => m._id === s._id) && // Not already in current team
    !assignedStaffIds.has(s._id) // Not assigned to any other team
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) { toast.error(tr(lang, "teamDetail.addMember.selectError")); return; }
    await onAddMember(selectedStaff);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label>{tr(lang, "teamDetail.addMember.selectLabel")}</Label>
        <Select value={selectedStaff} onValueChange={setSelectedStaff}>
          <SelectTrigger>
            <SelectValue placeholder={tr(lang, "teamDetail.addMember.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {availableStaff.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">{tr(lang, "teamDetail.addMember.noAvailable")}</div>
            ) : (
              availableStaff.map((staff) => (
                <SelectItem key={staff._id} value={staff._id}>
                  {staff.fullName} ({staff.email})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
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


