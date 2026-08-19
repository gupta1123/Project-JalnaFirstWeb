"use client";

import useSWR from "swr";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { deleteCategory, getCategoriesGroupedByTeam } from "@/lib/api";
import type { Category } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tag,
  Tags,
  Search,
  Grid3X3,
  Globe,
  Building2,
  Eye,
  Calendar,
  User,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { formatDateShort } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch categories grouped by team
  const { data, isLoading, mutate } = useSWR(
    "categories-grouped-by-team",
    () => getCategoriesGroupedByTeam(),
    { revalidateOnFocus: false }
  );

  const categoriesData = data?.categories;
  const totalCategories = data?.total || 0;

  // Create flattened array of all categories for table display
  const allCategories = useMemo(() => {
    if (!categoriesData) return [];
    
    const categories: Array<Category & { teamName?: string; isGlobal: boolean }> = [];
    
    // Add global categories
    categoriesData.global.forEach(cat => {
      categories.push({ ...cat, isGlobal: true });
    });
    
    // Add team categories
    Object.entries(categoriesData.teams).forEach(([teamId, teamData]) => {
      teamData.categories.forEach(cat => {
        categories.push({ ...cat, teamName: teamData.teamName, isGlobal: false });
      });
    });
    
    return categories;
  }, [categoriesData]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!search) return allCategories;

    const searchLower = search.toLowerCase();
    return allCategories.filter(cat => 
      cat.name.toLowerCase().includes(searchLower) ||
      cat.description.toLowerCase().includes(searchLower) ||
      cat.createdBy.fullName.toLowerCase().includes(searchLower) ||
      (cat.teamName && cat.teamName.toLowerCase().includes(searchLower))
    );
  }, [allCategories, search]);

  const globalCount = filteredCategories.filter(cat => cat.isGlobal).length;
  const teamCount = filteredCategories.filter(cat => !cat.isGlobal).length;

  const openDeleteDialog = (category: { id: string; name: string }) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeletingCategoryId(categoryToDelete.id);
    try {
      await deleteCategory(categoryToDelete.id);
      toast.success("Category deleted successfully");
      await mutate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete category");
    } finally {
      setDeletingCategoryId(null);
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
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
                  All Categories Overview
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {globalCount} global
                  </Badge>
                  <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {teamCount} team-specific
                  </Badge>
                  <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {totalCategories} total
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Categories Overview
              {search && (
                <Badge variant="outline" className="ml-2">
                  {filteredCategories.length} of {totalCategories} shown
                </Badge>
              )}
            </CardTitle>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories, teams, or creators..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/admin-categories/create" className="flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-96 w-full" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              {search ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No categories found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search terms to find categories
                  </p>
                </>
              ) : (
                <>
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No categories available</h3>
                  <p className="text-sm text-muted-foreground">
                    No categories have been created yet
                  </p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Category Name</TableHead>
                  <TableHead className="w-[300px]">Description</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[150px]">Team</TableHead>
                  <TableHead className="w-[150px]">Created By</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Created</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {category.isGlobal ? (
                          <Globe className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Tag className="h-4 w-4 text-green-500" />
                        )}
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate" title={category.description}>
                        {category.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.isGlobal ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          Global
                        </Badge>
                      ) : (
                        <Badge variant="outline">Team</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {category.teamName || (
                        <span className="text-muted-foreground italic">All Teams</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm font-medium">{category.createdBy.fullName}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {category.createdBy.role}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.isActive ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateShort(category.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin-categories/${category.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          disabled={deletingCategoryId === category.id}
                          onClick={() => openDeleteDialog({ id: category.id, name: category.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setCategoryToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This category will be removed permanently.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{categoryToDelete?.name}</span>?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deletingCategoryId === categoryToDelete?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={deletingCategoryId === categoryToDelete?.id}
            >
              {deletingCategoryId === categoryToDelete?.id ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

