"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createCategory } from "@/lib/api";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; 

// Icons
import {
  ArrowLeft,
  Save,
  Tag,
  Users,
  Lightbulb,
} from "lucide-react";

import { TeamSearchSelect } from "@/components/TeamSearchSelect";

export default function AdminCreateCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teamId: null as string | null,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCategory({
        name: formData.name.trim(),
        description: formData.description.trim(),
        team: formData.teamId ?? null,
        isActive: formData.isActive,
      });
      toast.success("Category created successfully");
      router.push("/admin-categories");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden border-0 bg-transparent shadow-none">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="animated-gradient-surface gradient-noise p-6 sm:p-8 text-primary-foreground rounded-xl"
          style={{
            background: "linear-gradient(135deg, var(--primary), color-mix(in oklch, var(--primary) 45%, var(--accent)))",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin-categories">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-foreground/10 text-inherit hover:bg-foreground/20 border-foreground/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-foreground/10 backdrop-blur ring-2 ring-foreground/20">
                <Tag className="h-7 w-7 opacity-90" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold tracking-tight">
                  Create Category
                </div>
                <p className="text-sm opacity-90">
                  Define how teams will triage citizen requests.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>General details</CardTitle>
            <CardDescription>Give the category a clear title and description.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Category Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Road Maintenance"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  placeholder="Describe what types of requests belong to this category..."
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  Help admins understand when to apply this category.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Creating..." : "Create Category"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin-categories")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visibility & status</CardTitle>
              <CardDescription>Control whether this category can be used immediately.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                <div>
                  <p className="font-medium text-sm">Active</p>
                  <p className="text-xs text-muted-foreground">Visible in dropdowns and ticket filters.</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team assignment</CardTitle>
              <CardDescription>Limit ownership or keep it global.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                {formData.teamId ? (
                  <>Only the selected team will triage tickets in this category.</>
                ) : (
                  <>No team selected yet. All admins can assign this category.</>
                )}
              </div>
              <TeamSearchSelect
                label=""
                helperText=""
                value={formData.teamId}
                onChange={(teamId) => setFormData((prev) => ({ ...prev, teamId }))}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to make it available for every team.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Helpful tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Use intuitive names citizens or staff would immediately recognise.</p>
              <p>• Keep descriptions action-oriented (“Handles potholes, patching, resurfacing”).</p>
              <p>• Assign to a team only when you know who owns the workflow.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}