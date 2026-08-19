"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getCategoryById, updateCategory } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TeamSearchSelect } from "@/components/TeamSearchSelect";
import { ArrowLeft, Save, Tag, X, Building2, Globe, CalendarDays, User } from "lucide-react";
import { formatDateShort } from "@/lib/utils";

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params.id;
  const router = useRouter();

  const { data, isLoading, error } = useSWR(
    categoryId ? `category-${categoryId}` : null,
    () => categoryId ? getCategoryById(categoryId) : null,
    { revalidateOnFocus: false }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teamId: null as string | null,
    isActive: true,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name,
        description: data.description,
        teamId: data.team?._id ?? null,
        isActive: data.isActive ?? true,
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;

    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCategory(categoryId, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        team: formData.teamId ?? null,
        isActive: formData.isActive ?? true,
      });
      toast.success("Category updated successfully");
      router.push(`/admin-categories/${categoryId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Tag className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Category Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The category you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/admin-categories">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
        </Link>
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
            background: "linear-gradient(135deg, var(--primary), color-mix(in oklch, var(--primary) 45%, var(--accent)))",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={`/admin-categories/${categoryId}`}>
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
                  Edit Category
                </div>
                <p className="mt-1 text-sm opacity-90">
                  Update details for this category
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
            <CardDescription>Adjust the title and description shown to admins.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  required
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin-categories/${categoryId}`)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
              <CardDescription>Select which team should own this category.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                {data?.team ? (
                  <>
                    <Building2 className="h-4 w-4 text-primary" />
                    <span>
                      Currently assigned to{" "}
                      <span className="font-medium text-foreground">{data.team.name}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 text-primary" />
                    <span>This category is global (visible to all teams).</span>
                  </>
                )}
              </div>
              <TeamSearchSelect
                label=""
                helperText=""
                value={formData.teamId}
                onChange={(teamId) => setFormData((prev) => ({ ...prev, teamId }))}
              />
              <p className="text-xs text-muted-foreground">
                Leaving this blank keeps the category available to every team.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Control if the category can be selected right now.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">Active</p>
                  <p className="text-xs text-muted-foreground">Inactive categories stay hidden from new assignments.</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Who created this category and when.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  Created by{" "}
                  <span className="font-medium text-foreground">
                    {data.createdBy?.fullName ?? "Unknown"}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Created on {formatDateShort(data.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

