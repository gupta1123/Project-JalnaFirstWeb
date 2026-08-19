"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  getMyTeam,
  getTeamById,
  updateStaff,
  removeEmployeeFromTeam,
  addEmployeesToTeam,
  getStaff,
  getTeams,
  createStaff,

} from "@/lib/api";
import type { User, Team } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Crown,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Building2,
  UserCheck,
  Plus,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default function TeamMembersPage() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Get all teams data (same as the working API endpoint)
  const { data: teamsData, isLoading: myTeamsLoading } = useSWR(
    "all-teams-for-team-members",
    () => getTeams({ page: 1, limit: 100 }),
    { revalidateOnFocus: false }
  );

  // Determine the teamId to show (get the first team for now)
  const teamList = useMemo(() => {
    if (!teamsData) return [];
    return teamsData.teams ?? [];
  }, [teamsData]);

  const selectedTeamMeta = useMemo(() => {
    // Show the first team available (since this is team lead view, they should be in at least one team)
    return teamList[0];
  }, [teamList]);

  const teamId = selectedTeamMeta?._id;

  // Fetch full team details (with employees) when we have a teamId
  const { data: team, isLoading: teamDetailsLoading, mutate: mutateTeam } = useSWR(
    teamId ? ["team-details", teamId] : null,
    () => getTeamById(teamId!),
    { revalidateOnFocus: false }
  );

  // Get all staff for adding new members (same as admin teams page)
  const { data: staffData, error: staffError } = useSWR(
    "staff",
    () => getStaff({ page: 1, limit: 100 }),
    { revalidateOnFocus: false }
  );

  // Use the same teams data for staff filtering
  const teamsError = null; // No separate error since we're using the same data

  const allStaff: User[] = staffData?.staff ?? [];
  const allTeams: Team[] = teamsData?.teams ?? [];

  // Find team lead
  const teamLead = useMemo(() => {
    return team?.employees?.find(member => member._id === team.leaderId);
  }, [team?.employees, team?.leaderId]);

  // Filter team members based on search and sort team lead first
  const filteredMembers = useMemo(() => {
    if (!team?.employees) return [];
    
    // Exclude team lead from the members list below
    let members = team.employees.filter(m => m._id !== team.leaderId);
    
    if (search) {
      members = members.filter(member => 
        member.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return members;
  }, [team?.employees, team?.leaderId, search]);

  // Debug logging (admin teams page style)
  console.log("TeamMembersPage Debug (admin teams style):", {
    teamsData: teamsData ? { teams: teamsData.teams?.length, pagination: teamsData.pagination } : null,
    myTeamsLoading: myTeamsLoading,
    teamList: teamList,
    selectedTeamMeta: selectedTeamMeta,
    staffData: staffData ? { staff: staffData.staff?.length, pagination: staffData.pagination } : null,
    staffError: staffError,
    teamsError: teamsError,
    allStaff: allStaff.length,
    allStaffRoles: allStaff.map(s => ({ id: s._id, role: s.role, name: s.fullName })),
    allTeams: allTeams.length,
    team: team ? { 
      id: team._id, 
      name: team.name,
      employees: team.employees?.length, 
      leaderId: team.leaderId,
      employeesList: team.employees?.map(emp => ({ 
        id: emp._id, 
        name: emp.fullName, 
        email: emp.email, 
        isLeader: emp.isLeader 
      }))
    } : null,
    teamId: teamId,
    teamLead: teamLead ? { id: teamLead._id, name: teamLead.fullName, isLeader: teamLead.isLeader } : null,
    filteredMembers: filteredMembers.map(m => ({ id: m._id, name: m.fullName, email: m.email }))
  });


  const unassignedStaff = useMemo(() => {
    const unassigned = allStaff.filter((staff) => 
      staff.role === 'staff' && (!staff.teams || staff.teams.length === 0)
    );
    

    console.log("Unassigned staff calculation:", {
      allStaff: allStaff.length,
      staffWithRole: allStaff.filter(s => s.role === 'staff').length,
      unassignedStaff: unassigned.length,
      unassignedList: unassigned.map(s => ({ id: s._id, name: s.fullName, teams: s.teams })),
      staffTeamStatus: allStaff.map(s => ({ 
        id: s._id, 
        name: s.fullName, 
        role: s.role,
        teamsCount: s.teams?.length || 0,
        teams: s.teams || []
      }))
    });
    
    return unassigned;
  }, [allStaff]);


  const onAddMember = async (teamId: string, employeeId: string) => {
    setSubmitting(true);
    try {
      await addEmployeesToTeam(teamId, [employeeId]);
      toast.success("Member added to team");
      setIsAddMemberOpen(false);
      mutateTeam();
    } catch (error) {
      toast.error("Failed to add member");
    } finally {
      setSubmitting(false);
    }
  };



  const onRemoveMember = async (memberId: string) => {
    if (!team) return;
    
    setSubmitting(true);
    try {
      await removeEmployeeFromTeam(team._id, memberId);
      toast.success("Team member removed successfully");
      setIsRemoveMemberOpen(null);
      mutateTeam();
    } catch (error) {
      toast.error("Failed to remove team member");
    } finally {
      setSubmitting(false);
    }
  };

 

  const getInitials = (name?: string) => {
    if (!name) return 'TM';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (myTeamsLoading || teamDetailsLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Team Found</h2>
        <p className="text-muted-foreground">We could not load your team data yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">

      <Card className="overflow-hidden border-0 bg-transparent shadow-none">
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4 }}
          className="animated-gradient-surface gradient-noise p-6 sm:p-8 text-primary-foreground rounded-xl"
          style={{
            background: 'linear-gradient(135deg, var(--primary), color-mix(in oklch, var(--primary) 45%, var(--accent)))'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-foreground/20 bg-background/60 backdrop-blur">
                <AvatarFallback className="text-primary-foreground bg-foreground/10 text-lg font-semibold">
                  {getInitials(team.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <Building2 className="h-5 w-5 opacity-90" />
                  {team.name} - {tr(lang, "teamMembers.heading")}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {team.employees?.length || 0} {tr(lang, "teamMembers.badge.members")}
                  </Badge>
                  <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20 flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    {tr(lang, "teamMembers.card.roleLead")}: {teamLead?.fullName || tr(lang, "teamMembers.card.notAssigned")}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setIsAddMemberOpen(true)}
              size="sm" 
              variant="secondary"
              className="bg-foreground/10 text-inherit hover:bg-foreground/20 border-foreground/20"
            >
              <Plus className="h-4 w-4 mr-1" />
              {tr(lang, "teamMembers.actions.addMember")}
            </Button>
          </div>
        </motion.div>
      </Card>

      {/* Team Info */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {tr(lang, "teamMembers.heading")} ({filteredMembers.length})
              </CardTitle>
              <Input
                placeholder={tr(lang, "teamMembers.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">
                  {search ? tr(lang, "teamMembers.empty.searchTitle") : tr(lang, "teamMembers.card.noMembers")}
                </h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   {search ? tr(lang, "teamMembers.empty.searchHelper") : tr(lang, "teamMembers.card.noMembers.helper")}
                 </p>
                 {!search && (
                   <Button onClick={() => setIsAddMemberOpen(true)}>
                     <UserPlus className="h-4 w-4 mr-1" />
                    {tr(lang, "teamMembers.actions.addMember")}
                   </Button>
                 )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <motion.div
                    key={member._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                         <div className="flex items-center gap-2">
                    <span className="font-medium">{member.fullName}</span>
                         </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                          {member.phoneNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <Link href={`/team-members/${member._id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4" /> {tr(lang, "teamMembers.menu.view")}
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/team-members/${member._id}/edit`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4" /> {tr(lang, "teamMembers.menu.edit")}
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setIsRemoveMemberOpen(member)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" /> {tr(lang, "teamMembers.menu.remove")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {tr(lang, "teamMembers.info.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{tr(lang, "teamMembers.info.description")}</h4>
                <p className="text-sm text-muted-foreground">
                  {team.description || tr(lang, "teamMembers.info.none")}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">{tr(lang, "teamMembers.info.coverage")}</h4>
                <div className="space-y-2">
                  {team.areas?.length ? (
                    team.areas.map((area, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <div className="font-medium">{area.zone}</div>
                          <div className="text-muted-foreground">
                            {[area.area, area.city, area.state].filter(Boolean).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">{tr(lang, "teamMembers.info.none")}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{tr(lang, "teamMembers.modal.title")}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">{tr(lang, "teamMembers.modal.tabExisting")}</TabsTrigger>
              <TabsTrigger value="create">{tr(lang, "teamMembers.modal.tabCreate")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing" className="mt-4">
              {!staffData || !teamsData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">{tr(lang, "teamMembers.modal.loadingStaff")}</p>
                  </div>
                </div>
              ) : (
                <AddExistingMemberForm 
                  lang={lang}
                  teamId={team?._id || ""}
                  team={team}
                  unassignedStaff={unassignedStaff}
                  onAddMember={onAddMember}
                  submitting={submitting}
                />
              )}
            </TabsContent>
            
            <TabsContent value="create" className="mt-4">
              <CreateNewMemberForm 
                lang={lang}
                teamId={team?._id || ""}
                team={team}
                onAddMember={onAddMember}
                submitting={submitting}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog removed - now opens in new page */}

      {/* Remove Member Dialog */}
      <Dialog open={!!isRemoveMemberOpen} onOpenChange={(open) => !open && setIsRemoveMemberOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Remove Team Member</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </DialogHeader>
          
          {isRemoveMemberOpen && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-medium">
                    {getInitials(isRemoveMemberOpen.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{isRemoveMemberOpen.fullName}</div>
                  <div className="text-sm text-muted-foreground">{isRemoveMemberOpen.email}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Are you sure you want to remove <strong>{isRemoveMemberOpen.fullName}</strong> from this team? 
                They will no longer have access to team resources and assignments.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={() => isRemoveMemberOpen && onRemoveMember(isRemoveMemberOpen._id)}
              disabled={submitting}
            >
              {submitting ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Existing Member Form Component (showing only unassigned staff members)
function AddExistingMemberForm({ 
  lang,
  teamId, 
  team, 
  unassignedStaff, 
  onAddMember, 
  submitting,
}: {
  lang: Lang;
  teamId: string;
  team?: Team;
  unassignedStaff: User[];
  onAddMember: (teamId: string, employeeId: string) => Promise<void>;
  submitting: boolean;
}) {
  const [selectedStaff, setSelectedStaff] = useState<string>("");

  if (!team) return <div>Team not found</div>;

  // Debug logging
  console.log("AddMemberForm Debug:", {
    team: team ? { id: team._id, employees: team.employees?.length } : null,
    unassignedStaff: unassignedStaff.length,
    unassignedList: unassignedStaff.map(s => ({ 
      id: s._id, 
      name: s.fullName, 
      email: s.email,
      teamsCount: s.teams?.length || 0 
    }))
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) {
      toast.error(tr(lang, "teamMembers.modal.toast.selectStaff"));
      return;
    }
    await onAddMember(teamId, selectedStaff);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">{tr(lang, "teamMembers.modal.selectLabel")}</label>
        <Select value={selectedStaff} onValueChange={setSelectedStaff}>
          <SelectTrigger>
            <SelectValue placeholder={tr(lang, "teamMembers.modal.selectPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {unassignedStaff.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">{tr(lang, "teamMembers.modal.noUnassigned")}</div>
            ) : (
              unassignedStaff.map((staff) => (
                <SelectItem key={staff._id} value={staff._id}>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    {staff.fullName} ({staff.email})
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">{tr(lang, "teamMembers.modal.cancel")}</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting || !selectedStaff || unassignedStaff.length === 0}>
          {submitting ? tr(lang, "teamMembers.modal.adding") : tr(lang, "teamMembers.modal.add")}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Create New Member Form Component
function CreateNewMemberForm({
  lang,
  teamId,
  team,
  onAddMember,
  submitting,
}: {
  lang: Lang;
  teamId: string;
  team?: Team;
  onAddMember: (teamId: string, employeeId: string) => Promise<void>;
  submitting: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password.trim() || !formData.phoneNumber.trim()) {
      toast.error(tr(lang, "teamMembers.modal.toast.required"));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(tr(lang, "teamMembers.modal.toast.passwordLength"));
      return;
    }

    try {
      // Step 1: Create staff member
      const staffResponse = await createStaff({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
      });

      // Step 2: Add to team
      await onAddMember(teamId, staffResponse.staff._id);
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phoneNumber: "",
      });
      
      toast.success(tr(lang, "teamMembers.modal.toast.createSuccess"));
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 
                          (error as { message?: string })?.message || 
                          tr(lang, "teamMembers.modal.toast.createError");
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{tr(lang, "teamMembers.modal.firstName")}</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            placeholder={tr(lang, "teamMembers.modal.placeholder.firstName")}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">{tr(lang, "teamMembers.modal.lastName")}</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            placeholder={tr(lang, "teamMembers.modal.placeholder.lastName")}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{tr(lang, "teamMembers.modal.email")}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder={tr(lang, "teamMembers.modal.placeholder.email")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">{tr(lang, "teamMembers.modal.phone")}</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
          placeholder={tr(lang, "teamMembers.modal.placeholder.phone")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{tr(lang, "teamMembers.modal.password")}</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          placeholder={tr(lang, "teamMembers.modal.placeholder.password")}
          required
          minLength={6}
        />
        <p className="text-xs text-muted-foreground">
          {tr(lang, "teamMembers.modal.passwordHint")}
        </p>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">{tr(lang, "teamMembers.modal.cancel")}</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>
          {submitting ? tr(lang, "teamMembers.modal.creating") : tr(lang, "teamMembers.modal.createButton")}
        </Button>
      </DialogFooter>
    </form>
  );
}


