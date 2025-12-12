"use client";

import useSWR from "swr";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getStaff,
  updateStaff,
  deleteUserByEmail,
} from "@/lib/api";
import type { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Eye,
  MoreVertical,
  Edit,
  KeyRound,
  Trash2,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

export default function StaffPage() {
  const { lang } = useLanguage();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const queryKey = useMemo(() => ["staff-all", { search }], [search]);
  const fetchAllStaff = async () => {
    const perPage = 100;
    let pageCursor = 1;
    let totalPages = 1;
    const collected: User[] = [];

    do {
      const res = await getStaff({ page: pageCursor, limit: perPage, search: search || undefined });
      if (res?.staff?.length) {
        collected.push(...res.staff);
      }
      totalPages = res?.pagination?.totalPages ?? totalPages;
      pageCursor += 1;
      if (!res?.pagination) break;
    } while (pageCursor <= totalPages);

    return { staff: collected };
  };

  const { data, isLoading, mutate } = useSWR(queryKey, fetchAllStaff, { revalidateOnFocus: false });

  const sortedStaff: User[] = useMemo(() => {
    const list = data?.staff ?? [];
    return [...list].sort((a, b) => {
      const nameA = (a.fullName ?? `${a.firstName ?? ""} ${a.lastName ?? ""}`).trim().toLowerCase();
      const nameB = (b.fullName ?? `${b.firstName ?? ""} ${b.lastName ?? ""}`).trim().toLowerCase();
      if (nameA && nameB) return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
      if (nameA) return -1;
      if (nameB) return 1;
      return 0;
    });
  }, [data?.staff]);

  const totalStaff = sortedStaff.length;
  const totalPages = Math.max(1, Math.ceil(totalStaff / limit));
  const currentPage = Math.min(page, totalPages);
  const visibleStaff = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return sortedStaff.slice(start, start + limit);
  }, [sortedStaff, currentPage, limit]);

  const [pwdTarget, setPwdTarget] = useState<User | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<User | null>(null);

  const onChangePassword = async (id: string, _newPwd: string) => {
    toast.info(tr(lang, "staff.changePassword.comingSoon"));
    setPwdTarget(null);
  };

  const onDeleteStaff = (staff: User) => {
    setStaffToDelete(staff);
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete?.email) {
      toast.error(tr(lang, "staff.delete.error"));
      setStaffToDelete(null);
      return;
    }

    setSubmitting(true);
    try {
      await deleteUserByEmail(staffToDelete.email);
      toast.success(tr(lang, "staff.delete.success"));
      setStaffToDelete(null);
      mutate();
    } catch (error) {
      console.error("Delete staff error:", error);
      toast.error(tr(lang, "staff.delete.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{tr(lang, "staff.title")}</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder={tr(lang, "staff.searchPlaceholder")}
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                className="w-64"
              />
              <Button asChild>
                <Link href="/staff/create">
                  <Plus className="mr-2 size-4" /> {tr(lang, "staff.create")}
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tr(lang, "staff.table.name")}</TableHead>
                  <TableHead>{tr(lang, "staff.table.email")}</TableHead>
                  <TableHead>{tr(lang, "staff.table.phone")}</TableHead>
                  <TableHead>{tr(lang, "staff.table.team")}</TableHead>
                  <TableHead>{tr(lang, "staff.table.status")}</TableHead>
                  <TableHead className="w-[120px] text-right">{tr(lang, "staff.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
                {!isLoading && sortedStaff.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>{tr(lang, "staff.empty.none")}</TableCell>
                  </TableRow>
                )}
                {visibleStaff.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>{s.fullName ?? `${s.firstName} ${s.lastName}`}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.phoneNumber || "—"}</TableCell>
                    <TableCell>
                      {s.teams && s.teams.length > 0 ? (
                        <div className="space-y-1">
                          {s.teams.map((team, index) => (
                            <div key={team.id} className="text-sm">
                              <span className="font-medium">{team.name}</span>
                              {team.isLeader && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {tr(lang, "staff.badge.leader")}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? tr(lang, "staff.status.active") : tr(lang, "staff.status.inactive")}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <Link href={`/staff/${s._id}`}>
                            <DropdownMenuItem>
                              <Eye className="size-4" /> {tr(lang, "staff.actions.view")}
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/staff/${s._id}/edit`}>
                            <DropdownMenuItem>
                              <Edit className="size-4" /> {tr(lang, "staff.actions.edit")}
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => setPwdTarget(s)}>
                            <KeyRound className="size-4" /> {tr(lang, "staff.actions.changePassword")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDeleteStaff(s)} className="text-red-600">
                            <Trash2 className="size-4" /> {tr(lang, "staff.actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              {tr(lang, "staff.pagination.page")} {currentPage} {tr(lang, "staff.pagination.of")} {totalPages}
              {" "}
              ({totalStaff} {tr(lang, "staff.pagination.total")})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                {tr(lang, "staff.pagination.previous")}
              </Button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                {tr(lang, "staff.pagination.next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Change Password Dialog (stub) */}
      <Dialog open={!!pwdTarget} onOpenChange={(o) => !o && setPwdTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr(lang, "staff.changePassword.title")}</DialogTitle>
          </DialogHeader>
          {pwdTarget && (
            <ChangePasswordForm staff={pwdTarget} onSubmit={onChangePassword} submitting={submitting} lang={lang} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Staff Confirmation Dialog */}
      <Dialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>{tr(lang, "staff.delete.title")}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {tr(lang, "staff.delete.description")}
                </p>
              </div>
            </div>
          </DialogHeader>
          
          {staffToDelete && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-medium">
                    {(staffToDelete.fullName || staffToDelete.email || "S").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{staffToDelete.fullName || staffToDelete.email}</div>
                  <div className="text-sm text-muted-foreground">{staffToDelete.email}</div>
                  {staffToDelete.phoneNumber && (
                    <div className="text-sm text-muted-foreground">{staffToDelete.phoneNumber}</div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {tr(lang, "staff.delete.confirmMessage")} <strong>{staffToDelete.fullName || staffToDelete.email}</strong>?{" "}
                {tr(lang, "staff.delete.warning")}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={submitting}>
                {tr(lang, "staff.delete.cancel")}
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={submitting}>
              {submitting ? tr(lang, "staff.delete.deleting") : tr(lang, "staff.delete.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChangePasswordForm({ staff, onSubmit, submitting, lang }: { staff: User; onSubmit: (id: string, newPwd: string) => Promise<void>; submitting: boolean; lang: "en" | "hi" | "mr" }) {
  const [pwd, setPwd] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) { toast.error(tr(lang, "staff.changePassword.error")); return; }
    await onSubmit(staff._id, pwd);
  };
  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label>{tr(lang, "staff.changePassword.newPassword")}</Label>
        <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder={tr(lang, "staff.changePassword.placeholder")} />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">{tr(lang, "staff.changePassword.cancel")}</Button>
        </DialogClose>
        <Button type="submit" disabled={submitting}>{submitting ? tr(lang, "staff.changePassword.saving") : tr(lang, "staff.changePassword.save")}</Button>
      </DialogFooter>
    </form>
  );
}


