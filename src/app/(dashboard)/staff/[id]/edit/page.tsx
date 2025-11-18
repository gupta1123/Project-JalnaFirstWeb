"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getStaffById, updateStaff } from "@/lib/api";
import type { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Save, User as UserIcon } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const { id: staffId } = use(params);
  const [submitting, setSubmitting] = useState(false);

  const { data: staff, isLoading, error, mutate } = useSWR(
    staffId ? `staff-${staffId}` : null,
    () => getStaffById(staffId),
    { revalidateOnFocus: false }
  );

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    isActive: true,
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        email: staff.email || "",
        phoneNumber: staff.phoneNumber || "",
        isActive: staff.isActive ?? true,
      });
    }
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error(tr(lang, "staffEdit.toast.fillRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await updateStaff(staffId, formData);
      toast.success(tr(lang, "staffEdit.toast.success"));
      mutate(); // Revalidate SWR cache for this staff member
      router.push("/staff"); // Navigate back to the staff list
    } catch (err) {
      toast.error(tr(lang, "staffEdit.toast.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-semibold mb-2">{tr(lang, "staffEdit.notFound.title")}</h2>
        <p className="text-muted-foreground">{tr(lang, "staffEdit.notFound.description")}</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> {tr(lang, "staffEdit.notFound.goBack")}
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
                {staff.firstName?.charAt(0)?.toUpperCase()}{staff.lastName?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                <UserIcon className="h-5 w-5 opacity-90" />
                {tr(lang, "staffEdit.header.title")} {staff.fullName || `${staff.firstName} ${staff.lastName}`}
              </div>
              <p className="text-sm opacity-90 mt-1">
                {tr(lang, "staffEdit.header.subtitle")}
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
              {tr(lang, "staffEdit.card.title")}
            </CardTitle>
            <Button 
              variant="outline" 
              onClick={() => router.push("/staff")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tr(lang, "staffEdit.button.back")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">{tr(lang, "staffEdit.labels.firstName")} *</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">{tr(lang, "staffEdit.labels.lastName")} *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">{tr(lang, "staffEdit.labels.email")} *</label>
              <Input
                type="email"
                value={formData.email}
                readOnly
                disabled
                placeholder="john.doe@example.com"
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">{tr(lang, "staffEdit.labels.phoneNumber")} *</label>
              <Input
                type="tel"
                value={formData.phoneNumber}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
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
                {tr(lang, "staffEdit.labels.active")}
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {submitting ? tr(lang, "staffEdit.button.saving") : tr(lang, "staffEdit.button.save")}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/staff")}
                disabled={submitting}
              >
                {tr(lang, "staffEdit.button.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
