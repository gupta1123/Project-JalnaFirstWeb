"use client";

import useSWR from "swr";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getTeams,
  getStaff,
  removeEmployeeFromTeam,
  updateTeamLeader,
  updateStaff,
  getTeamLeader,
} from "@/lib/api";
import type { User, Team } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  MoreVertical, 
  Eye, 
  Crown, 
  Trash2,
  Users,
  MapPin,
  Edit,
  UserCog
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";


export default function TeamsPage() {
  const [search, setSearch] = useState("");
  // const [isViewOpen, setIsViewOpen] = useState<null | string>(null);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState<null | {teamId: string, member: User}>(null);
  const [isChangeLeaderOpen, setIsChangeLeaderOpen] = useState<null | string>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    ["teams", search],
    async () => await getTeams({ search, page: 1, limit: 20 }),
    { revalidateOnFocus: false }
  );

  const { data: staffData, mutate: staffMutate } = useSWR(
    "staff",
    async () => await getStaff({ page: 1, limit: 100 }),
    { revalidateOnFocus: false }
  );

  const teams: Team[] = data?.teams ?? [];
  const allStaff: User[] = staffData?.staff ?? [];

  const teamById = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((t) => map.set(t._id, t));
    return map;
  }, [teams]);

  // Staff already assigned to any team (used to filter Add Member options)
  const assignedStaffIds = useMemo(() => {
    const ids = new Set<string>();
    teams.forEach((t) => t.employees.forEach((e) => ids.add(e._id)));
    return ids;
  }, [teams]);



  const onRemoveMember = async (teamId: string, employeeId: string) => {
    setSubmitting(true);
    try {
      await removeEmployeeFromTeam(teamId, employeeId);
      toast.success("Member removed from team");
      mutate();
    } catch (e) {
      toast.error("Failed to remove member");
    } finally {
      setSubmitting(false);
    }
  };

  const onSetLeader = async (teamId: string, leaderId: string) => {
    setSubmitting(true);
    try {
      await updateTeamLeader(teamId, leaderId);
      toast.success("Team lead updated");
      mutate();
      setIsChangeLeaderOpen(null);
    } catch (e) {
      toast.error("Failed to update team lead");
    } finally {
      setSubmitting(false);
    }
  };

  const onEditMember = async (memberId: string, updates: {firstName?: string, lastName?: string, email?: string, isActive?: boolean}) => {
    setSubmitting(true);
    try {
      await updateStaff(memberId, updates);
      toast.success("Staff member updated");
      mutate();
      staffMutate();
      setIsEditMemberOpen(null);
    } catch (e) {
      toast.error("Failed to update staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteMember = async (teamId: string, memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this team?`)) return;
    
    setSubmitting(true);
    try {
      await removeEmployeeFromTeam(teamId, memberId);
      toast.success("Member removed from team");
      mutate();
    } catch (e) {
      toast.error("Failed to remove team member");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Teams Management</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Button asChild>
                <Link href="/teams/create">
                  <Plus className="mr-2 size-4" /> New Team
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Team Name</TableHead>
                  <TableHead className="w-[30%]">Description</TableHead>
                  <TableHead className="w-[20%]">Area</TableHead>
                  <TableHead className="w-[15%]">Members</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
                {!isLoading && teams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>No teams found</TableCell>
                  </TableRow>
                )}
                {teams.map((team: Team) => (
                  <TableRow key={team._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="font-medium">{team.name}</div>
                        {team.leaderId && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Crown className="size-3" />
                            Team lead: {team.employees.find(e => e._id === team.leaderId)?.fullName || 'Unknown'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate text-sm">
                        {team.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {team.areas.map((area, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground" />
                            {area.zone}, {area.city}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="size-3" />
                        {team.employees.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <Link href={`/teams/${team._id}`}>
                            <DropdownMenuItem>
                              <Eye className="size-4" /> View Details
                            </DropdownMenuItem>
                          </Link>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View moved to dedicated page at /teams/[id] */}


      {/* Edit Member Dialog */}
      <Dialog open={!!isEditMemberOpen} onOpenChange={(open) => !open && setIsEditMemberOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          {isEditMemberOpen && (
            <EditMemberForm
              member={isEditMemberOpen.member}
              onSubmit={onEditMember}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Change Team Lead Dialog */}
      <Dialog open={!!isChangeLeaderOpen} onOpenChange={(open) => !open && setIsChangeLeaderOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Team Lead</DialogTitle>
          </DialogHeader>
          {isChangeLeaderOpen && (
            <ChangeLeaderForm
              team={teamById.get(isChangeLeaderOpen)!}
              onSubmit={onSetLeader}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


// Team Details View Component
function TeamDetailsView({ 
  team, 
  allStaff, 
  onRemoveMember, 
  onSetLeader,
  onEditMember,
  onChangeLeader,
  submitting 
}: { 
  team?: Team; 
  allStaff: User[]; 
  onRemoveMember: (teamId: string, employeeId: string, memberName: string) => Promise<void>;
  onSetLeader: (teamId: string, leaderId: string) => Promise<void>;
  onEditMember: (member: User) => void;
  onChangeLeader: () => void;
  submitting: boolean;
}) {
  if (!team) return <div>Team not found</div>;

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <h3 className="text-lg font-semibold">{team.name}</h3>
        <p className="text-sm text-muted-foreground">{team.description}</p>
      </div>

      <div className="grid gap-2">
        <h4 className="font-medium">Coverage Areas</h4>
        <div className="grid gap-1">
          {team.areas.map((area, i) => (
            <div key={i} className="text-sm flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              <span>{area.zone}, {area.area && `${area.area}, `}{area.city}, {area.state}</span>
            </div>
          ))}
        </div>
      </div>

      <TeamLeadDisplay teamId={team._id} fallbackName={team.employees.find(e => e._id === team.leaderId)?.fullName} />

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Team Members ({team.employees.length})</h4>
          {team.employees.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onChangeLeader}
              disabled={submitting}
            >
              <UserCog className="size-3 mr-1" /> Change Team Lead
            </Button>
          )}
        </div>
        {team.employees.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members assigned yet</p>
        ) : (
          <div className="grid gap-2">
            {team.employees.map((member) => (
              <div key={member._id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.fullName}</span>
                      {team.leaderId === member._id && (
                        <Badge variant="default" className="text-xs">
                          <Crown className="size-3 mr-1" /> Team Lead
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditMember(member)}
                    disabled={submitting}
                    title="Edit member"
                  >
                    <Edit className="size-3" />
                  </Button>
                  {team.leaderId !== member._id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSetLeader(team._id, member._id)}
                      disabled={submitting}
                      title="Make team lead"
                    >
                      <Crown className="size-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveMember(team._id, member._id, member.fullName || member.email)}
                    disabled={submitting}
                    title="Remove from team"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Small component to fetch and show current team lead name
function TeamLeadDisplay({ teamId, fallbackName }: { teamId: string; fallbackName?: string }) {
  const { data, isLoading, mutate } = useSWR(["team-leader", teamId], async () => await getTeamLeader(teamId), { revalidateOnFocus: false });
  const name = data?.fullName || fallbackName;

  return (
    <div className="grid gap-1">
      <h4 className="font-medium">Team Lead</h4>
      <div className="text-sm text-muted-foreground">{isLoading ? "Loading..." : (name || "None")}</div>
    </div>
  );
}


// Edit Member Form Component
function EditMemberForm({ 
  member, 
  onSubmit, 
  submitting 
}: { 
  member: User;
  onSubmit: (memberId: string, updates: {firstName?: string, lastName?: string, email?: string, isActive?: boolean}) => Promise<void>;
  submitting: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    isActive: member.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    await onSubmit(member._id, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            placeholder="John"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            placeholder="Doe"
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="john.doe@example.com"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Active staff member
        </Label>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Updating..." : "Update Member"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Change Team Lead Form Component
function ChangeLeaderForm({ 
  team, 
  onSubmit, 
  submitting 
}: { 
  team: Team;
  onSubmit: (teamId: string, leaderId: string) => Promise<void>;
  submitting: boolean;
}) {
  const [selectedLeader, setSelectedLeader] = useState(team.leaderId || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeader) {
      toast.error("Please select a team lead");
      return;
    }
    await onSubmit(team._id, selectedLeader);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label>Select New Team Lead</Label>
        <Select value={selectedLeader} onValueChange={setSelectedLeader}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a team lead" />
          </SelectTrigger>
          <SelectContent>
            {team.employees.map((member) => (
              <SelectItem key={member._id} value={member._id}>
                <div className="flex items-center gap-2">
                  {team.leaderId === member._id && <Crown className="size-3 text-amber-500" />}
                  {member.fullName} ({member.email})
                  {team.leaderId === member._id && <span className="text-xs text-muted-foreground">Current Team Lead</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">
        Current team lead: {team.employees.find(m => m._id === team.leaderId)?.fullName || "None"}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting || !selectedLeader || selectedLeader === team.leaderId}>
          {submitting ? "Updating..." : "Change Team Lead"}
        </Button>
      </DialogFooter>
    </form>
  );
}
