"use client";

import useSWR from "swr";
import Link from "next/link";
import { getUsers } from "@/lib/api";
import type { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Lock, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordLevel, setPasswordLevel] = useState(1);
  const [password, setPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);

  const queryKey = useMemo(() => ["users", { page, limit, search }], [page, limit, search]);
  const { data, isLoading } = useSWR(
    isAuthenticated ? queryKey : null, 
    () => getUsers({ page, limit, search: search || undefined }), 
    { revalidateOnFocus: false }
  );
  const users: User[] = data?.users ?? [];
  const pagination = data?.pagination;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPassword = passwordLevel === 1 ? "admin1" : "admin2";
    
    if (password === expectedPassword) {
      if (passwordLevel === 1) {
        setPasswordLevel(2);
        setPassword("");
      } else {
        setIsAuthenticated(true);
        setShowPasswordDialog(false);
      }
    } else {
      alert("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordLevel(1);
    setPassword("");
    setShowPasswordDialog(true);
  };

  return (
    <>
      {/* Password Protection Dialog - Only for Users Page */}
      <Dialog open={showPasswordDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Users Data Access Required
            </DialogTitle>
            <DialogDescription>
              {passwordLevel === 1 
                ? "Please enter the first level admin password to access user data."
                : "Please enter the second level admin password to view user information."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Enter level ${passwordLevel} password`}
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => window.history.back()}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button type="submit" className="flex-1">
                <Lock className="h-4 w-4 mr-2" />
                {passwordLevel === 1 ? "Continue to Level 2" : "Access Users"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Users Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated ? (
            <>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search name or email…" 
                  value={search} 
                  onChange={(e) => { setPage(1); setSearch(e.target.value); }} 
                  className="max-w-sm"
                />
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
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
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                    {!isLoading && users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>No users found</TableCell>
                      </TableRow>
                    )}
                    {users.map((u: User) => (
                      <TableRow key={u._id}>
                        <TableCell>{u.fullName ?? `${u.firstName} ${u.lastName}`}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phoneNumber || "-"}</TableCell>
                        <TableCell>
                          <span className="capitalize">{u.role}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? "default" : "secondary"} className="text-xs">
                            {u.isActive ? 'Active' : 'Inactive'}
                          </Badge>
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
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground text-center">
                    Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalUsers} total users)
                  </div>
                  <Pagination className="pt-2">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            if (pagination.hasPrevPage) setPage((p) => Math.max(1, p - 1)); 
                          }} 
                        />
                      </PaginationItem>
                      {(() => {
                        const totalPages = pagination.totalPages;
                        const currentPage = pagination.currentPage;
                        const pages: number[] = [];
                        
                        // Calculate the range of pages to show
                        let startPage = Math.max(1, currentPage - 2);
                        let endPage = Math.min(totalPages, currentPage + 2);
                        
                        // Adjust if we're near the beginning or end
                        if (currentPage <= 3) {
                          endPage = Math.min(5, totalPages);
                        }
                        if (currentPage >= totalPages - 2) {
                          startPage = Math.max(1, totalPages - 4);
                        }
                        
                        // Generate unique page numbers
                        for (let i = startPage; i <= endPage; i++) {
                          if (!pages.includes(i)) {
                            pages.push(i);
                          }
                        }
                        
                        return pages.map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink 
                              href="#" 
                              isActive={pageNum === currentPage}
                              onClick={(e) => { 
                                e.preventDefault(); 
                                setPage(pageNum); 
                              }}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ));
                      })()}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            if (pagination.hasNextPage) setPage((p) => p + 1); 
                          }} 
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Please authenticate to view user data</p>
              <p className="text-sm mt-2">You can navigate to other pages using the sidebar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}


