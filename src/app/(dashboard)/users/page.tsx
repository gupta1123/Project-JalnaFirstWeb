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
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

export default function UsersPage() {
  const { lang } = useLanguage();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordLevel, setPasswordLevel] = useState(1);
  const [password, setPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);

  const queryKey = useMemo(() => ["users-all", { search }], [search]);

  const fetchAllUsers = async () => {
    const perPage = 100;
    let pageCursor = 1;
    let totalPages = 1;
    const collected: User[] = [];

    do {
      const res = await getUsers({ page: pageCursor, limit: perPage, search: search || undefined });
      if (res?.users?.length) {
        collected.push(...res.users);
      }
      totalPages = res?.pagination?.totalPages ?? totalPages;
      pageCursor += 1;
      if (!res?.pagination) break;
    } while (pageCursor <= totalPages);

    return { users: collected };
  };

  const { data, isLoading } = useSWR(
    isAuthenticated ? queryKey : null,
    fetchAllUsers,
    { revalidateOnFocus: false }
  );

  const sortedUsers: User[] = useMemo(() => {
    const list = data?.users ?? [];
    return [...list].sort((a, b) => {
      const nameA = (a.fullName ?? `${a.firstName ?? ""} ${a.lastName ?? ""}`).trim().toLowerCase();
      const nameB = (b.fullName ?? `${b.firstName ?? ""} ${b.lastName ?? ""}`).trim().toLowerCase();
      if (nameA && nameB) return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
      if (nameA) return -1;
      if (nameB) return 1;
      return 0;
    });
  }, [data?.users]);

  const totalUsers = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return sortedUsers.slice(start, start + limit);
  }, [sortedUsers, currentPage, limit]);

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
      toast.error(tr(lang, "users.auth.incorrectPassword"));
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
      
      <Dialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          if (!open) {
            window.history.back();
            setShowPasswordDialog(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {tr(lang, "users.auth.required")}
            </DialogTitle>
            <DialogDescription>
              {passwordLevel === 1 
                ? tr(lang, "users.auth.level1Description")
                : tr(lang, "users.auth.level2Description")
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{tr(lang, "users.auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`${tr(lang, "users.auth.passwordPlaceholder")} ${passwordLevel} ${tr(lang, "users.auth.passwordPlaceholderSuffix")}`}
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
                {tr(lang, "users.auth.goBack")}
              </Button>
              <Button type="submit" className="flex-1">
                <Lock className="h-4 w-4 mr-2" />
                {passwordLevel === 1 ? tr(lang, "users.auth.continueToLevel2") : tr(lang, "users.auth.accessUsers")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{tr(lang, "users.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated ? (
            <>
              <div className="flex gap-2">
                <Input 
                  placeholder={tr(lang, "users.searchPlaceholder")} 
                  value={search} 
                  onChange={(e) => { setPage(1); setSearch(e.target.value); }} 
                  className="max-w-sm"
                />
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tr(lang, "users.table.name")}</TableHead>
                      <TableHead>{tr(lang, "users.table.email")}</TableHead>
                      <TableHead>{tr(lang, "users.table.phone")}</TableHead>
                      <TableHead>{tr(lang, "users.table.status")}</TableHead>
                      <TableHead className="w-12 text-right">{tr(lang, "users.table.view")}</TableHead>
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
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                    {!isLoading && sortedUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>{tr(lang, "users.empty.none")}</TableCell>
                      </TableRow>
                    )}
                    {visibleUsers.map((u: User) => (
                      <TableRow key={u._id}>
                        <TableCell>{u.fullName ?? `${u.firstName} ${u.lastName}`}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phoneNumber || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? "default" : "secondary"} className="text-xs">
                            {u.isActive ? tr(lang, "users.status.active") : tr(lang, "users.status.inactive")}
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
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground text-center">
                  {tr(lang, "users.pagination.showing")} {currentPage} {tr(lang, "users.pagination.of")} {totalPages} ({totalUsers} {tr(lang, "users.pagination.totalUsers")})
                </div>
                <Pagination className="pt-2">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((prev) => Math.max(prev - 1, 1));
                        }}
                        aria-disabled={currentPage === 1}
                        tabIndex={currentPage === 1 ? -1 : undefined}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNumber = idx + 1;
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            isActive={pageNumber === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(pageNumber);
                            }}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((prev) => Math.min(prev + 1, totalPages));
                        }}
                        aria-disabled={currentPage === totalPages}
                        tabIndex={currentPage === totalPages ? -1 : undefined}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{tr(lang, "users.auth.authenticateMessage")}</p>
              <p className="text-sm mt-2">{tr(lang, "users.auth.sidebarMessage")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}


