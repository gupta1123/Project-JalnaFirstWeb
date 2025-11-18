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
import { ArrowLeft, Mail, Phone, User as UserIcon, Users, Crown } from "lucide-react";
import { formatDateTimeSmart } from "@/lib/utils";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const { id: staffId } = use(params);

  const { data: staff, isLoading, error } = useSWR(
    staffId ? `staff-${staffId}` : null,
    () => getStaffById(staffId),
    { revalidateOnFocus: false }
  );

  if (isLoading) return <StaffDetailSkeleton />;
  if (error || !staff) return <StaffNotFound onBack={() => router.back()} lang={lang} />;

  return (
    <div className="space-y-6">
      <StaffHeader staff={staff} onBack={() => router.back()} lang={lang} />
      <StaffContent staff={staff} lang={lang} />
    </div>
  );
}

// Loading skeleton component
function StaffDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}

// Not found component
function StaffNotFound({ onBack, lang }: { onBack: () => void; lang: "en" | "hi" | "mr" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <UserIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">{tr(lang, "staffDetail.notFound.title")}</h2>
      <p className="text-muted-foreground mb-6">{tr(lang, "staffDetail.notFound.description")}</p>
      <Button onClick={onBack} variant="outline">
        <ArrowLeft className="h-4 w-4 mr-2" /> {tr(lang, "staffDetail.notFound.goBack")}
      </Button>
    </div>
  );
}

// Header component
function StaffHeader({ staff, onBack, lang }: { staff: User; onBack: () => void; lang: "en" | "hi" | "mr" }) {
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
              <AvatarImage src={staff.profilePhotoUrl || undefined} alt={staff.fullName} />
              <AvatarFallback className="bg-foreground/10 text-primary-foreground text-lg font-semibold">
                {staff.firstName?.charAt(0)?.toUpperCase()}{staff.lastName?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{staff.fullName}</h1>
              <p className="text-sm opacity-90">{staff.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge isActive={staff.isActive} lang={lang} />
          {staff.isEmailVerified && (
            <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20">
              {tr(lang, "staffDetail.badge.verified")}
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
function StaffContent({ staff, lang }: { staff: User; lang: "en" | "hi" | "mr" }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <PersonalInfoCard staff={staff} lang={lang} />
        <ContactInfoCard staff={staff} lang={lang} />
      </div>
      <TeamInfoCard staff={staff} lang={lang} />
    </div>
  );
}

// Personal information card
function PersonalInfoCard({ staff, lang }: { staff: User; lang: "en" | "hi" | "mr" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserIcon className="h-4 w-4" />
          {tr(lang, "staffDetail.cards.personalInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoRow label={tr(lang, "staffDetail.labels.fullName")} value={staff.fullName} lang={lang} />
        <InfoRow label={tr(lang, "staffDetail.labels.firstName")} value={staff.firstName} lang={lang} />
        <InfoRow label={tr(lang, "staffDetail.labels.lastName")} value={staff.lastName} lang={lang} />
      </CardContent>
    </Card>
  );
}

// Contact information card
function ContactInfoCard({ staff, lang }: { staff: User; lang: "en" | "hi" | "mr" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          {tr(lang, "staffDetail.cards.contactInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">{tr(lang, "staffDetail.labels.emailAddress")}</span>
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{staff.email}</span>
            {staff.isEmailVerified && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">{tr(lang, "staffDetail.badge.verified")}</Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">{tr(lang, "staffDetail.labels.phoneNumber")}</span>
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{staff.phoneNumber || tr(lang, "staffDetail.labels.notProvided")}</span>
          </div>
        </div>

        {staff.preferredLanguage && (
          <InfoRow label={tr(lang, "staffDetail.labels.language")} value={staff.preferredLanguage} className="capitalize" lang={lang} />
        )}
      </CardContent>
    </Card>
  );
}

// Team information card
function TeamInfoCard({ staff, lang }: { staff: User; lang: "en" | "hi" | "mr" }) {
  const getRoleDisplay = (isLeader: boolean) => {
    return isLeader ? tr(lang, "staffDetail.role.teamLead") : tr(lang, "staffDetail.role.staff");
  };

  const getRoleBadgeVariant = (isLeader: boolean) => {
    return isLeader ? "default" : "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          {tr(lang, "staffDetail.cards.teamInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {staff.teams && staff.teams.length > 0 ? (
          <div className="space-y-3">
            {staff.teams.map((team, index) => (
              <div key={team.id || index} className="p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{team.name}</span>
                  <Badge variant={getRoleBadgeVariant(team.isLeader)} className="text-xs">
                    {team.isLeader ? (
                      <>
                        <Crown className="h-3 w-3 mr-1" />
                        {getRoleDisplay(team.isLeader)}
                      </>
                    ) : (
                      getRoleDisplay(team.isLeader)
                    )}
                  </Badge>
                </div>
                {team.leaderName && !team.isLeader && (
                  <div className="text-xs text-muted-foreground">
                    {tr(lang, "staffDetail.team.leadLabel")}: {team.leaderName}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{tr(lang, "staffDetail.team.noTeam")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Utility components
function InfoRow({ label, value, className = "", lang }: { label: string; value?: string; className?: string; lang?: "en" | "hi" | "mr" }) {
  const currentLang = lang || "en";
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className={`text-sm ${className}`}>{value || tr(currentLang, "staffDetail.labels.notProvided")}</span>
    </div>
  );
}

function StatusBadge({ isActive, lang }: { isActive?: boolean; lang?: "en" | "hi" | "mr" }) {
  const currentLang = lang || "en";
  return (
    <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
      {isActive ? tr(currentLang, "staffDetail.badge.active") : tr(currentLang, "staffDetail.badge.inactive")}
    </Badge>
  );
}
