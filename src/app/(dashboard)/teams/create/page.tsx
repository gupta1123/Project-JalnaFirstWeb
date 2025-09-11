"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  createStaff,
  createTeam,
  getStaff,
  getTeams,
  addEmployeesToTeam,
  updateTeamLeader,
} from "@/lib/api";
import type { User, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowLeft,
  Plus,
  Users,
  Crown,
  Check,
  UserPlus,
  MapPin,
  Building2,
  Mail,
  Lock,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type TeamFormData = {
  name: string;
  description: string;
  zone: string;
  area: string;
  city: string;
  state: string;
};

type StaffFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
};

export default function CreateTeamPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<"info" | "staff">("info");
  const [teamData, setTeamData] = useState<TeamFormData>({
    name: "",
    description: "",
    zone: "",
    area: "",
    city: "Jalna",
    state: "Maharashtra",
  });
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);

  // Fetch all staff and teams
  const { data: staffData, mutate: mutateStaff } = useSWR(
    "staff",
    async () => await getStaff({ page: 1, limit: 100 }),
    { revalidateOnFocus: false }
  );

  const { data: teamsData } = useSWR(
    "teams",
    async () => await getTeams({ page: 1, limit: 100 }),
    { revalidateOnFocus: false }
  );

  const allStaff: User[] = staffData?.staff ?? [];
  const allTeams: Team[] = teamsData?.teams ?? [];
  
  // Get all staff members who are already assigned to any team
  const assignedStaffIds = useMemo(() => {
    const assignedIds = new Set<string>();
    allTeams.forEach(team => {
      team.employees.forEach(emp => assignedIds.add(emp._id));
    });
    return assignedIds;
  }, [allTeams]);

  const onCreateStaff = async (staffData: StaffFormData) => {
    setSubmitting(true);
    try {
      await createStaff(staffData);
      toast.success("Staff member created successfully");
      setIsCreateStaffOpen(false);
      mutateStaff(); // Refresh staff list
    } catch (e) {
      toast.error("Failed to create staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const createTeamWithStaff = async () => {
    setSubmitting(true);
    try {
      // Validate team data
      if (!teamData.name.trim() || !teamData.zone.trim() || !teamData.city.trim()) {
        toast.error("Please fill all required team information");
        return;
      }

      // Create the team
      const result = await createTeam({
        name: teamData.name,
        description: teamData.description,
        areas: [{
          zone: teamData.zone,
          area: teamData.area,
          city: teamData.city,
          state: teamData.state,
        }],
      });
      
      // Assign selected staff to the team
      if (selectedStaff.length > 0) {
        await addEmployeesToTeam(result.team._id, selectedStaff);
      }
      
      toast.success("Team created successfully!");
      router.push("/teams");
    } catch (e) {
      toast.error("Failed to create team");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: "info", title: "Team Information", description: "Enter team name and details" },
    { id: "staff", title: "Assign Staff", description: "Select staff members for the team" },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Team</h1>
          <p className="text-muted-foreground">Set up a new team with staff members and assignments</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                    ${currentStep === step.id 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : steps.findIndex(s => s.id === currentStep) > index
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-muted-foreground text-muted-foreground"
                    }
                  `}>
                    {steps.findIndex(s => s.id === currentStep) > index ? (
                      <Check className="size-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-16 h-px bg-border mx-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === "info" && (
        <TeamInfoStep
          teamData={teamData}
          setTeamData={setTeamData}
          onNext={() => setCurrentStep("staff")}
        />
      )}

      {currentStep === "staff" && (
        <StaffSelectionStep
          allStaff={allStaff}
          selectedStaff={selectedStaff}
          toggleStaffSelection={toggleStaffSelection}
          onCreateStaff={onCreateStaff}
          submitting={submitting}
          isCreateStaffOpen={isCreateStaffOpen}
          setIsCreateStaffOpen={setIsCreateStaffOpen}
          onBack={() => setCurrentStep("info")}
          onCreateTeam={createTeamWithStaff}
          teamName={teamData.name}
          assignedStaffIds={assignedStaffIds}
        />
      )}
    </div>
  );
}

// Team Information Step
function TeamInfoStep({
  teamData,
  setTeamData,
  onNext,
}: {
  teamData: TeamFormData;
  setTeamData: (data: TeamFormData) => void;
  onNext: () => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamData.name.trim() || !teamData.zone.trim() || !teamData.city.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    onNext();
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Team Information
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the basic information for your new team
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  value={teamData.name}
                  onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
                  placeholder="e.g., Zone A Maintenance Team"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={teamData.description}
                  onChange={(e) => setTeamData({ ...teamData, description: e.target.value })}
                  placeholder="Brief description of team responsibilities"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="zone">Zone *</Label>
                  <Input
                    id="zone"
                    value={teamData.zone}
                    onChange={(e) => setTeamData({ ...teamData, zone: e.target.value })}
                    placeholder="e.g., Zone A"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    value={teamData.area}
                    onChange={(e) => setTeamData({ ...teamData, area: e.target.value })}
                    placeholder="e.g., Sector 5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={teamData.city}
                    onChange={(e) => setTeamData({ ...teamData, city: e.target.value })}
                    placeholder="Jalna"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={teamData.state}
                    onChange={(e) => setTeamData({ ...teamData, state: e.target.value })}
                    placeholder="Maharashtra"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="min-w-32">
                Next: Select Staff
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Staff Selection Step
function StaffSelectionStep({
  allStaff,
  selectedStaff,
  toggleStaffSelection,
  onCreateStaff,
  submitting,
  isCreateStaffOpen,
  setIsCreateStaffOpen,
  onBack,
  onCreateTeam,
  teamName,
  assignedStaffIds,
}: {
  allStaff: User[];
  selectedStaff: string[];
  toggleStaffSelection: (id: string) => void;
  onCreateStaff: (data: StaffFormData) => Promise<void>;
  submitting: boolean;
  isCreateStaffOpen: boolean;
  setIsCreateStaffOpen: (open: boolean) => void;
  onBack: () => void;
  onCreateTeam: () => Promise<void>;
  teamName: string;
  assignedStaffIds: Set<string>;
}) {
  // Filter out staff who are already assigned to teams
  const availableStaff = allStaff.filter(staff => 
    staff.role === 'staff' && !assignedStaffIds.has(staff._id)
  );
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Select Staff for &quot;{teamName}&quot;
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose staff members to assign to this team (optional)
              </p>
            </div>
            <Dialog open={isCreateStaffOpen} onOpenChange={setIsCreateStaffOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 size-4" /> Create Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Staff Member</DialogTitle>
                </DialogHeader>
                <CreateStaffForm onSubmit={onCreateStaff} submitting={submitting} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {availableStaff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No available staff members</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {allStaff.length === 0 
                  ? "Create your first staff member or skip to create the team without members"
                  : "All staff members are already assigned to teams. Create new staff or skip to create the team without members."
                }
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setIsCreateStaffOpen(true)}>
                  <Plus className="mr-2 size-4" /> Create Staff Member
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedStaff.length} of {availableStaff.length} available staff selected
                  {assignedStaffIds.size > 0 && (
                    <span className="ml-2 text-xs">
                      ({assignedStaffIds.size} already assigned to other teams)
                    </span>
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedStaff.length === availableStaff.length) {
                      // Deselect all
                      availableStaff.forEach(staff => toggleStaffSelection(staff._id));
                    } else {
                      // Select all available
                      availableStaff.forEach(staff => {
                        if (!selectedStaff.includes(staff._id)) {
                          toggleStaffSelection(staff._id);
                        }
                      });
                    }
                  }}
                >
                  {selectedStaff.length === availableStaff.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableStaff.map((staff) => (
                  <div
                    key={staff._id}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-colors
                      ${selectedStaff.includes(staff._id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                      }
                    `}
                    onClick={() => toggleStaffSelection(staff._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <UserIcon className="size-4 text-muted-foreground" />
                          <span className="font-medium">{staff.fullName}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{staff.email}</div>
                        <Badge variant={staff.isActive ? "default" : "secondary"}>
                          {staff.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center
                        ${selectedStaff.includes(staff._id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                        }
                      `}>
                        {selectedStaff.includes(staff._id) && (
                          <Check className="size-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onCreateTeam} 
          disabled={submitting}
          className="min-w-32"
        >
          {submitting ? "Creating..." : "Create Team"}
        </Button>
      </div>
    </div>
  );
}


// Create Staff Form Component
function CreateStaffForm({ 
  onSubmit, 
  submitting 
}: { 
  onSubmit: (data: StaffFormData) => Promise<void>; 
  submitting: boolean; 
}) {
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    await onSubmit(formData);
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
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="john.doe@example.com"
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
          placeholder="+91 98765 43210"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Minimum 6 characters"
            className="pl-10"
            minLength={6}
            required
          />
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Staff"}
        </Button>
      </DialogFooter>
    </form>
  );
}
