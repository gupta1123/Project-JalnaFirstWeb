"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getStaffById, updateStaff, getMyTeam } from "@/lib/api";
import type { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, User as UserIcon } from "lucide-react";

export default function EditTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    isActive: true,
  });

  // Get staff member details
  const { data: member, isLoading } = useSWR(
    memberId ? ["staff-member", memberId] : null,
    () => getStaffById(memberId),
    { revalidateOnFocus: false }
  );

  // Get team data for refreshing after update
  const { mutate: mutateTeam } = useSWR(
    "my-team",
    () => getMyTeam(),
    { revalidateOnFocus: false }
  );

  // Initialize form data when member data loads
  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        email: member.email || "",
        phoneNumber: member.phoneNumber || "",
        isActive: member.isActive ?? true,
      });
    }
  }, [member]);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'TM';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await updateStaff(memberId, formData);
      // Refresh team data to reflect the changes
      await mutateTeam();
      toast.success("Team member updated successfully");
      router.push("/team-members");
    } catch (error) {
      toast.error("Failed to update team member");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <UserIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Member Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The team member you&apos;re looking for could not be found.
        </p>
        <Button onClick={() => router.push("/team-members")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Team Members
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
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
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-foreground/20 bg-background/60 backdrop-blur">
              <AvatarFallback className="text-primary-foreground bg-foreground/10 text-lg font-semibold">
                {getInitials(member.firstName, member.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                <UserIcon className="h-5 w-5 opacity-90" />
                Edit {member.fullName || `${member.firstName} ${member.lastName}`}
              </div>
              <p className="text-sm opacity-90 mt-1">
                Update team member information
              </p>
            </div>
          </div>
        </motion.div>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Member Details
            </CardTitle>
            <Button 
              variant="outline" 
              onClick={() => router.push("/team-members")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="+91 98765 43210"
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
              <label htmlFor="isActive" className="text-sm font-medium">
                Active team member
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/team-members")}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
