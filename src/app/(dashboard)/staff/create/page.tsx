"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { createStaff } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Save, User as UserIcon } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

type StaffFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
};

export default function CreateStaffPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<StaffFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'ST';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password.trim() || !formData.phoneNumber?.trim()) {
      toast.error(tr(lang, "staff.create.toast.fillRequired"));
      return;
    }
    // Enforce exactly 10 digits phone number (no extra messages here; inline hint handles UX)
    const digitsOnly = (formData.phoneNumber || "").replace(/\D/g, "");
    if (digitsOnly.length !== 10) return;
    if (formData.password.length < 6) {
      toast.error(tr(lang, "staff.create.toast.passwordLength"));
      return;
    }

    setSubmitting(true);
    try {
      await createStaff(formData);
      toast.success(tr(lang, "staff.create.toast.success"));
      router.push("/staff"); 
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 
                          (err as { message?: string })?.message || 
                          tr(lang, "staff.create.toast.error");
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-foreground/10 backdrop-blur ring-2 ring-foreground/20">
                <UserIcon className="h-7 w-7 opacity-90" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                  {tr(lang, "staff.create.title")}
                </div>
                <div className="mt-1 text-sm opacity-90">
                  {tr(lang, "staff.create.subtitle")}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-foreground/10 text-inherit hover:bg-foreground/20 border-foreground/20"
                onClick={() => router.push("/staff")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {tr(lang, "staff.create.backToStaff")}
              </Button>
            </div>
          </div>
        </motion.div>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {tr(lang, "staff.create.staffInformation")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials(formData.firstName, formData.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {formData.firstName && formData.lastName 
                    ? `${formData.firstName} ${formData.lastName}`
                    : tr(lang, "staff.create.preview.staffMember")
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  {formData.email || tr(lang, "staff.create.preview.emailPlaceholder")}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">{tr(lang, "staff.create.form.firstName")}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder={tr(lang, "staff.create.form.placeholder.firstName")}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">{tr(lang, "staff.create.form.lastName")}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder={tr(lang, "staff.create.form.placeholder.lastName")}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{tr(lang, "staff.create.form.email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={tr(lang, "staff.create.form.placeholder.email")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{tr(lang, "staff.create.form.phoneNumber")}</Label>
              <Input
                id="phoneNumber"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={formData.phoneNumber}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData(prev => ({ ...prev, phoneNumber: digits }));
                }}
                placeholder={tr(lang, "staff.create.form.placeholder.phoneNumber")}
                required
              />
              {formData.phoneNumber && formData.phoneNumber.length < 10 && (
                <p className="text-xs text-destructive">{tr(lang, "staff.create.form.phoneError")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{tr(lang, "staff.create.form.password")}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={tr(lang, "staff.create.form.placeholder.password")}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                {tr(lang, "staff.create.form.passwordHelper")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/staff")}
                disabled={submitting}
              >
                {tr(lang, "staff.create.form.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  !formData.firstName.trim() ||
                  !formData.lastName.trim() ||
                  !formData.email.trim() ||
                  !formData.password.trim() ||
                  (formData.phoneNumber || "").replace(/\D/g, "").length !== 10
                }
              >
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {tr(lang, "staff.create.form.creating")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {tr(lang, "staff.create.form.create")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
