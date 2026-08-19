"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import useSWR from "swr";
import {
  createCategory,
  updateCategory,
  getCategoryById,
  getMyTeam,
  getCurrentUser,
} from "@/lib/api";
import type { Category } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Tag,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";

function CreateCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Get current user to check role
  const { data: currentUser } = useSWR("current-user", getCurrentUser, { revalidateOnFocus: false });
  
  // Get team data to get team ID for creating categories
  const { data: teamData, error: teamError } = useSWR("my-team", () => getMyTeam(), { revalidateOnFocus: false });
  
  // Get the current team ID (team leads should have a team assigned)
  const currentTeamId = useMemo(() => {
    console.log("Debug info:", { 
      currentUser: currentUser ? { role: currentUser.role, id: currentUser._id } : null,
      teamData, 
      teamError,
      rawTeamData: teamData
    });
    
    if (!teamData) {
      console.log("No team data available");
      return null;
    }
    
    // If there's a single team object
    if (teamData.team) {
      console.log("Found single team:", teamData.team);
      return teamData.team._id;
    }

    // If there are multiple teams, find the one where user is leader
    if (teamData.teams && teamData.teams.length > 0) {
      console.log("Found multiple teams:", teamData.teams);
      const leaderTeam = teamData.teams.find(t => 
        t.employees && 
        Array.isArray(t.employees) && 
        t.employees.some(emp => emp && emp.isLeader)
      );
      console.log("Leader team found:", leaderTeam);
      if (leaderTeam) {
        return leaderTeam._id;
      }
      // If no leader team found, use the first team
      console.log("No leader team found, using first team:", teamData.teams[0]);
      return teamData.teams[0]._id;
    }
    
    console.log("No team found in any format");
    return null;
  }, [teamData, teamError, currentUser]);
  
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";

  // Fetch category data if editing
  const { data: category, isLoading } = useSWR(
    editId ? `category-${editId}` : null,
    () => editId ? getCategoryById(editId) : null,
    { revalidateOnFocus: false }
  );

  // Update form data when category loads
  useEffect(() => {
    if (category && isEditing) {
      setFormData({
        name: category.name,
        description: category.description,
      });
    }
  }, [category, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    // For team leads, team ID is required
    if (!isEditing && !isAdmin && !currentTeamId) {
      toast.error("Team information not found. Please contact your administrator.");
      return;
    }

    setSubmitting(true);
    
    try {
      if (isEditing && editId) {
        await updateCategory(editId, {
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
        toast.success("Category updated successfully");
      } else {
        const payload: {
          name: string;
          description: string;
          team?: string;
        } = {
          name: formData.name.trim(),
          description: formData.description.trim(),
        };
        
        // Add team field if team ID is available (for both admins and team leads)
        if (currentTeamId) {
          payload.team = currentTeamId;
          console.log("Adding team ID to payload:", currentTeamId);
        } else {
          console.log("No team ID available, creating without team");
        }
        
        console.log("Final payload:", payload);
        await createCategory(payload);
        toast.success("Category created successfully");
      }
      
      router.push("/categories");
    } catch (error) {
      toast.error(isEditing ? "Failed to update category" : "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/categories");
  };

  if (isEditing && isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/categories">
                <Button variant="ghost" size="sm" className="bg-foreground/10 text-inherit hover:bg-foreground/20 border-foreground/20">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-foreground/10 backdrop-blur ring-2 ring-foreground/20">
                <Tag className="h-7 w-7 opacity-90" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold tracking-tight">
                  {isEditing ? "Edit Category" : "Create New Category"}
                </div>
                <div className="mt-1 text-sm opacity-90">
                  {isEditing ? "Update category information" : "Add a new category for your team"}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Category Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6 max-w-2xl">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Category Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Road Maintenance, Water Supply, Street Lighting"
                required
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                Choose a clear, descriptive name for this category
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide a detailed description of what types of issues this category covers..."
                rows={4}
                required
                className="text-base resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Explain what types of issues or requests this category will handle
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={submitting} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {submitting 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update Category" : "Create Category")
                }
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={submitting}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper component with Suspense boundary for useSearchParams
function CreateCategoryPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateCategoryPage />
    </Suspense>
  );
}

export default CreateCategoryPageWrapper;
