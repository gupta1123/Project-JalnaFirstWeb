"use client";

import useSWR from "swr";
import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  getCategories,
  getSubCategories,
  deleteCategory,
  deleteSubCategory,
} from "@/lib/api";
import type { Category, SubCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Tag,
  Tags,
  FolderOpen,
  Search,
  Grid3X3,
  List,
} from "lucide-react";
import Link from "next/link";
import { formatDateShort } from "@/lib/utils";

function CategoriesPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Get active tab from URL params or default to categories
  const activeTab = (searchParams.get("tab") as "categories" | "subcategories") || "categories";

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading, mutate: mutateCategories } = useSWR(
    "categories",
    () => getCategories({ page: 1, limit: 100 }),
    { revalidateOnFocus: false }
  );

  // Fetch subcategories
  const { data: subCategoriesData, isLoading: subCategoriesLoading, mutate: mutateSubCategories } = useSWR(
    "subcategories",
    () => getSubCategories({ page: 1, limit: 100 }),
    { revalidateOnFocus: false }
  );

  const categories: Category[] = categoriesData?.categories ?? [];
  const subCategories: SubCategory[] = subCategoriesData?.subcategories ?? [];

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  // Filter subcategories based on search
  const filteredSubCategories = useMemo(() => {
    if (!search) return subCategories;
    return subCategories.filter(subCat => 
      subCat.name.toLowerCase().includes(search.toLowerCase()) ||
      subCat.description.toLowerCase().includes(search.toLowerCase()) ||
      subCat.category.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [subCategories, search]);

  // Delete operations

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This will also delete all its subcategories.`)) {
      return;
    }

    setSubmitting(true);
    try {
      await deleteCategory(category.id);
      toast.success("Category deleted successfully");
      mutateCategories();
      mutateSubCategories(); // Refresh subcategories as they might be affected
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setSubmitting(false);
    }
  };


  const handleDeleteSubCategory = async (subCategory: SubCategory) => {
    if (!confirm(`Are you sure you want to delete "${subCategory.name}"?`)) {
      return;
    }

    setSubmitting(true);
    try {
      await deleteSubCategory(subCategory.id);
      toast.success("Subcategory deleted successfully");
      mutateSubCategories();
    } catch (error) {
      toast.error("Failed to delete subcategory");
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
                <Grid3X3 className="h-7 w-7 opacity-90" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <Tags className="h-5 w-5 opacity-90" />
                  Category Management
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {categories.length} categories
                  </Badge>
                  <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20 flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />
                    {subCategories.length} subcategories
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Link href="/categories">
                  <Button
                    variant={activeTab === "categories" ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <Tag className="h-4 w-4" />
                    Categories
                  </Button>
                </Link>
                <Link href="/categories?tab=subcategories">
                  <Button
                    variant={activeTab === "subcategories" ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <List className="h-4 w-4" />
                    Subcategories
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                {activeTab === "categories" ? (
                  <Link href="/categories/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </Link>
                ) : (
                  <Link href="/categories/subcategories/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subcategory
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categories ({filteredCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-8">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    {search ? "No categories found" : "No categories yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {search ? "Try adjusting your search terms" : "Create your first category to get started"}
                  </p>
                  {!search && (
                    <Link href="/categories/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Category
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCategories.map((category) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Tag className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.name}</span>
                            {category.isActive && (
                              <Badge variant="default" className="text-xs">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <span>Created by {category.createdBy.fullName}</span>
                            <span>•</span>
                            <span>{formatDateShort(category.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <Link href={`/categories/create?edit=${category.id}`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4" />
                              Edit Category
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCategory(category)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Category
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Subcategories Tab */}
        {activeTab === "subcategories" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Subcategories ({filteredSubCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subCategoriesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredSubCategories.length === 0 ? (
                <div className="text-center py-8">
                  <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    {search ? "No subcategories found" : "No subcategories yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {search ? "Try adjusting your search terms" : categories.length === 0 ? "Create categories first, then add subcategories" : "Create your first subcategory to get started"}
                  </p>
                  {!search && categories.length > 0 && (
                    <Link href="/categories/subcategories/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Subcategory
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubCategories.map((subCategory) => (
                    <motion.div
                      key={subCategory.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                          <FolderOpen className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{subCategory.name}</span>
                            {subCategory.isActive && (
                              <Badge variant="default" className="text-xs">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{subCategory.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <Badge variant="outline" className="text-xs">
                              {subCategory.category.name}
                            </Badge>
                            <span>•</span>
                            <span>Created by {subCategory.createdBy.fullName}</span>
                            <span>•</span>
                            <span>{formatDateShort(subCategory.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <Link href={`/categories/subcategories/create?edit=${subCategory.id}`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4" />
                              Edit Subcategory
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSubCategory(subCategory)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Subcategory
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}

// Wrapper component with Suspense boundary for useSearchParams
function CategoriesPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoriesPage />
    </Suspense>
  );
}

export default CategoriesPageWrapper;
