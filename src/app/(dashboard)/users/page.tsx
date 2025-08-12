"use client";

import useSWR from "swr";
import Link from "next/link";
import { getUsers } from "@/lib/api";
import type { User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string | undefined>(undefined);

  const queryKey = useMemo(() => ["users", { page, limit, search, isActive }], [page, limit, search, isActive]);
  const { data, isLoading } = useSWR(queryKey, () => getUsers({ page, limit, search: search || undefined, isActive: isActive === undefined ? undefined : isActive === "true" }), { revalidateOnFocus: false });
  const users: User[] = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Search name or email…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <Select onValueChange={(v) => { setPage(1); setIsActive(v === "all" ? undefined : v); }}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="w-12 text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </>
              )}
              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>No users</TableCell>
                </TableRow>
              )}
              {users.map((u: User) => (
                <TableRow key={u._id}>
                  <TableCell>{u.fullName ?? `${u.firstName} ${u.lastName}`}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phoneNumber}</TableCell>
                  <TableCell>
                    <span className="block max-w-[260px] truncate">
                      {([u.address?.line1, u.address?.line2].filter(Boolean).join(", ") || "-")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/users/${u._id}`}>
                      <Button variant="ghost" size="icon" aria-label={`View ${u.fullName ?? u.firstName ?? "user"}`}>
                        <Eye className="size-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <Pagination className="pt-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (pagination.hasPrevPage) setPage((p) => Math.max(1, p - 1)); }} />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>{pagination.currentPage}</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (pagination.hasNextPage) setPage((p) => p + 1); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}


