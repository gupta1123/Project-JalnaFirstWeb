"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { motion } from "framer-motion";
import { getCategoryWithSubcategories } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Tag,
  Globe,
  Building2,
  User,
  Calendar,
  FolderOpen,
  List,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { formatDateShort } from "@/lib/utils";

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params.id;

  const { data, isLoading, error } = useSWR(
    categoryId ? `category-detail-${categoryId}` : null,
    () => categoryId ? getCategoryWithSubcategories(categoryId) : null,
    { revalidateOnFocus: false }
  );

  const category = data?.category;
  const subcategories = data?.subcategories || [];

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !category) {
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

  const isGlobal = !category.team;

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
              <Link href="/admin-categories">
                <Button variant="ghost" size="sm" className="bg-foreground/10 text-inherit hover:bg-foreground/20 border-foreground/20">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-foreground/10 backdrop-blur ring-2 ring-foreground/20">
                {isGlobal ? (
                  <Globe className="h-7 w-7 opacity-90" />
                ) : (
                  <Tag className="h-7 w-7 opacity-90" />
                )}
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                  {category.name}
                  {isGlobal && (
                    <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20">
                      Global
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20 flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />
                    {subcategories.length} subcategories
                  </Badge>
                  {category.isActive && (
                    <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Card>

      {/* Category Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Category Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground leading-relaxed">
                {category.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Type</h4>
                <div className="flex items-center gap-2">
                  {isGlobal ? (
                    <>
                      <Globe className="h-4 w-4 text-blue-500" />
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        Global Category
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 text-green-500" />
                      <Badge variant="outline">Team Category</Badge>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Status</h4>
                {category.isActive ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>

            {category.team && (
              <div>
                <h4 className="font-medium mb-2">Assigned Team</h4>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{category.team.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Created By</h4>
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-medium">{category.createdBy.fullName}</div>
                  <div className="text-sm text-muted-foreground">{category.createdBy.email}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Created Date</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDateShort(category.createdAt)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subcategories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Subcategories ({subcategories.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Specific subcategories under this category
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {subcategories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No subcategories</h3>
              <p className="text-sm text-muted-foreground">
                This category doesn&apos;t have any subcategories yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Subcategory Name</TableHead>
                  <TableHead className="w-[400px]">Description</TableHead>
                  <TableHead className="w-[150px]">Created By</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategories.map((subcategory) => (
                  <TableRow key={subcategory.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-accent-foreground" />
                        {subcategory.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[400px]" title={subcategory.description}>
                        {subcategory.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">{subcategory.createdBy.fullName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {subcategory.isActive ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateShort(subcategory.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
