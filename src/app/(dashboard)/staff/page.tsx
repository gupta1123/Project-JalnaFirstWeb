"use client";

import useSWR from "swr";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getStaff,
  updateStaff,
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

  const queryKey = useMemo(() => ["staff", { page, limit, search }], [page, limit, search]);
  const { data, isLoading, mutate } = useSWR(queryKey, () => getStaff({ page, limit, search: search || undefined }), { revalidateOnFocus: false });

  const staff: User[] = data?.staff ?? [];
  const pagination = data?.pagination;

  const [pwdTarget, setPwdTarget] = useState<User | null>(null);


  const onChangePassword = async (id: string, _newPwd: string) => {
    toast.info(tr(lang, "staff.changePassword.comingSoon"));
    setPwdTarget(null);
  };

  const onDeleteStaff = async (id: string) => {
    toast.info(tr(lang, "staff.delete.comingSoon"));
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
                {!isLoading && staff.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>{tr(lang, "staff.empty.none")}</TableCell>
                  </TableRow>
                )}
                {staff.map((s) => (
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
                          <DropdownMenuItem onClick={() => onDeleteStaff(s._id)} className="text-red-600">
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

          {pagination && (
            <div className="flex items-center justify-between text-sm">
              <div>{tr(lang, "staff.pagination.page")} {pagination.currentPage} {tr(lang, "staff.pagination.of")} {pagination.totalPages}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.currentPage <= 1}>{tr(lang, "staff.pagination.previous")}</Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={pagination.currentPage >= pagination.totalPages}>{tr(lang, "staff.pagination.next")}</Button>
              </div>
            </div>
          )}
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


