"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { getStaffById } from "@/lib/api";
import type { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, User as UserIcon } from "lucide-react";
import { formatDateTimeSmart } from "@/lib/utils";
import { motion } from "framer-motion";

export default function TeamMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: memberId } = use(params);

  const { data: member, isLoading, error } = useSWR(
    memberId ? `staff-${memberId}` : null,
    () => getStaffById(memberId),
    { revalidateOnFocus: false }
  );

  if (isLoading) return <TeamMemberDetailSkeleton />;
  if (error || !member) return <TeamMemberNotFound onBack={() => router.back()} />;

  return (
    <div className="space-y-6">
      <TeamMemberHeader member={member} onBack={() => router.back()} />
      <TeamMemberContent member={member} />
    </div>
  );
}

// Loading skeleton component
function TeamMemberDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}

// Not found component
function TeamMemberNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <UserIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Team Member Not Found</h2>
      <p className="text-muted-foreground mb-6">The team member you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      <Button onClick={onBack} variant="outline">
        <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
      </Button>
    </div>
  );
}

// Header component
function TeamMemberHeader({ member, onBack }: { member: User; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-xl p-6 sm:p-8 text-primary-foreground"
      style={{
        background: 'linear-gradient(135deg, var(--primary), color-mix(in oklch, var(--primary) 45%, var(--accent)))'
      }}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="text-primary-foreground hover:bg-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary-foreground/20">
              <AvatarImage src={member.profilePhotoUrl || undefined} alt={member.fullName} />
              <AvatarFallback className="bg-foreground/10 text-primary-foreground text-lg font-semibold">
                {member.firstName?.charAt(0)?.toUpperCase()}{member.lastName?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{member.fullName}</h1>
              <p className="text-sm opacity-90">{member.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge isActive={member.isActive} />
          {member.isEmailVerified && (
            <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20">
              Verified
            </Badge>
          )}
        </div>
      </div>
      
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
      </div>
    </motion.div>
  );
}

// Main content component
function TeamMemberContent({ member }: { member: User }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PersonalInfoCard member={member} />
      <ContactInfoCard member={member} />
    </div>
  );
}

// Personal information card
function PersonalInfoCard({ member }: { member: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserIcon className="h-4 w-4" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoRow label="Full Name" value={member.fullName} />
        <InfoRow label="First Name" value={member.firstName} />
        <InfoRow label="Last Name" value={member.lastName} />
        <InfoRow label="Role" value={member.role} className="capitalize" />
      </CardContent>
    </Card>
  );
}

// Contact information card
function ContactInfoCard({ member }: { member: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">Email Address</span>
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{member.email}</span>
            {member.isEmailVerified && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">Verified</Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">Phone Number</span>
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{member.phoneNumber || 'Not provided'}</span>
          </div>
        </div>

        {member.preferredLanguage && (
          <InfoRow label="Language" value={member.preferredLanguage} className="capitalize" />
        )}
      </CardContent>
    </Card>
  );
}


// Utility components
function InfoRow({ label, value, className = "" }: { label: string; value?: string; className?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className={`text-sm ${className}`}>{value || 'Not provided'}</span>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive?: boolean }) {
  return (
    <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}