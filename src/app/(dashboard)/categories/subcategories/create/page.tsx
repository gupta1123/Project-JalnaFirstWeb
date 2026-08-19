"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import useSWR from "swr";
import {
  createSubCategory,
  updateSubCategory,
  getSubCategoryById,
  getCategories,
} from "@/lib/api";
import type { SubCategory, Category } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FolderOpen,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";

function CreateSubCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  });

  // Fetch categories for dropdown
  const { data: categoriesData, isLoading: categoriesLoading } = useSWR(
    "categories",
    () => getCategories({ page: 1, limit: 100 }),
    { revalidateOnFocus: false }
  );

  // Fetch subcategory data if editing
  const { data: subCategory, isLoading } = useSWR(
    editId ? `subcategory-${editId}` : null,
    () => editId ? getSubCategoryById(editId) : null,
    { revalidateOnFocus: false }
  );

  const categories: Category[] = categoriesData?.categories ?? [];

  // Update form data when subcategory loads
  useEffect(() => {
    if (subCategory && isEditing) {
      setFormData({
        name: subCategory.name,
        description: subCategory.description,
        category: subCategory.category._id,
      });
    }
  }, [subCategory, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.category) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    
    try {
      if (isEditing && editId) {
        await updateSubCategory(editId, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
        });
        toast.success("Subcategory updated successfully");
      } else {
        await createSubCategory({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
        });
        toast.success("Subcategory created successfully");
      }
      
      router.push("/categories?tab=subcategories");
    } catch (error) {
      toast.error(isEditing ? "Failed to update subcategory" : "Failed to create subcategory");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/categories?tab=subcategories");
  };

  if ((isEditing && isLoading) || categoriesLoading) {
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
              <Link href="/categories?tab=subcategories">
                <Button variant="ghost" size="sm" className="bg-foreground/10 text-inherit hover:bg-foreground/20 border-foreground/20">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-foreground/10 backdrop-blur ring-2 ring-foreground/20">
                <FolderOpen className="h-7 w-7 opacity-90" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold tracking-tight">
                  {isEditing ? "Edit Subcategory" : "Create New Subcategory"}
                </div>
                <div className="mt-1 text-sm opacity-90">
                  {isEditing ? "Update subcategory information" : "Add a new subcategory to organize issues"}
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
            <FolderOpen className="h-5 w-5" />
            Subcategory Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6 max-w-2xl">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Parent Category *</label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Select a parent category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No categories available. Create categories first.
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the parent category this subcategory belongs to
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Subcategory Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Potholes, Broken Pipes, Faulty Street Lights"
                required
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                Choose a specific name that describes this type of issue
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide a detailed description of what specific issues this subcategory covers..."
                rows={4}
                required
                className="text-base resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Explain what specific types of issues or requests this subcategory will handle
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={submitting || categories.length === 0} 
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {submitting 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update Subcategory" : "Create Subcategory")
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

            {categories.length === 0 && (
              <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You need to create at least one category before you can add subcategories.{" "}
                  <Link href="/categories/create" className="underline hover:no-underline">
                    Create a category first
                  </Link>
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper component with Suspense boundary for useSearchParams
function CreateSubCategoryPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateSubCategoryPage />
    </Suspense>
  );
}

export default CreateSubCategoryPageWrapper;
