"use client";

import useSWR from "swr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTeamTicketsMinimal,
  getTeamById,
  assignTicketMember,
  bulkAssignTicketMember,
  getCurrentUser,
} from "@/lib/api";
import { formatDateTimeSmart } from "@/lib/utils";
import { MapPin, Clock, AlertCircle, Plus } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function MyTicketsPage() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("open");
  const [assignContext, setAssignContext] = useState<{ ticketIds: string[]; description?: string } | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  const { data, isLoading, mutate } = useSWR(
    ["team-tickets", status, search],
    () =>
      getTeamTicketsMinimal({
        page: 1,
        limit: 50,
        status: status === "all" ? undefined : status,
        search: search || undefined,
      }),
    { revalidateOnFocus: false }
  );

  const { data: currentUser } = useSWR("current-user", getCurrentUser, { revalidateOnFocus: false });

  const swrTickets = data?.tickets;
  const tickets = swrTickets ?? [];
  const pagination = data?.pagination;
  const currentUserId =
    (currentUser as { id?: string; _id?: string } | undefined)?.id ||
    (currentUser as { id?: string; _id?: string } | undefined)?._id;
  const isTeamLead = currentUser?.teams?.some((t) => t.isLeader) ?? false;
  const leaderTeamId =
    currentUser?.teams?.find((t) => t.isLeader)?.id ?? currentUser?.teams?.[0]?.id;

  const { data: teamDetails } = useSWR(
    leaderTeamId ? ["team-details", leaderTeamId] : null,
    () => getTeamById(leaderTeamId!),
    { revalidateOnFocus: false }
  );

  const teamMembers =
    teamDetails?.employees?.filter((member) => member._id !== teamDetails?.leaderId) ?? [];

  useEffect(() => {
    if (!swrTickets) {
      if (selectedTickets.length) setSelectedTickets([]);
      return;
    }
    setSelectedTickets((prev) =>
      prev.filter((id) => swrTickets.some((ticket) => ticket.id === id && !ticket.assignedUser && ticket.status !== 'resolved' && ticket.status !== 'closed'))
    );
  }, [swrTickets]);

  const toggleTicketSelection = (ticketId: string, checked: boolean) => {
    setSelectedTickets((prev) => {
      if (checked) {
        return prev.includes(ticketId) ? prev : [...prev, ticketId];
      }
      return prev.filter((id) => id !== ticketId);
    });
  };

  const closeAssignDialog = () => {
    setAssignContext(null);
    setSelectedMember("");
    setAssigning(false);
  };

  const onAssignMember = async () => {
    if (!assignContext) return;
    if (!selectedMember) {
      toast.error(tr(lang, "teamTickets.assignMember.selectError"));
      return;
    }
    setAssigning(true);
    try {
      if (assignContext.ticketIds.length === 1) {
        await assignTicketMember(assignContext.ticketIds[0], selectedMember);
        toast.success(tr(lang, "teamTickets.assignMember.success"));
      } else {
        const res = await bulkAssignTicketMember(assignContext.ticketIds, selectedMember);
        if (res.failed && res.failed > 0) {
          toast.error(
            `${tr(lang, "teamTickets.assignMember.bulkPartial")} (${res.successful}/${res.total ?? assignContext.ticketIds.length})`
          );
        } else {
          toast.success(tr(lang, "teamTickets.assignMember.bulkSuccess"));
        }
      }
      closeAssignDialog();
      setSelectedTickets([]);
      mutate();
    } catch (error) {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          tr(lang, "teamTickets.assignMember.error")
      );
      setAssigning(false);
    }
  };

  // Filter tickets by search term and status
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      search === "" || ticket.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || ticket.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tr(lang, "teamTickets.stats.total")}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {tr(lang, "teamTickets.stats.total.helper")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tr(lang, "teamTickets.stats.open")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === "open").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {tr(lang, "teamTickets.stats.open.helper")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tr(lang, "teamTickets.stats.inProgress")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === "in_progress").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {tr(lang, "teamTickets.stats.inProgress.helper")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tr(lang, "teamTickets.stats.completed")}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === "resolved" || t.status === "closed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {tr(lang, "teamTickets.stats.completed.helper")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="flex flex-1 flex-wrap gap-2">
              <Input
                className="w-full sm:w-[360px]"
                placeholder={tr(lang, "teamTickets.filters.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={tr(lang, "teamTickets.filters.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {tr(lang, "teamTickets.filters.status.all")}
                  </SelectItem>
                  <SelectItem value="open">
                    {tr(lang, "teamTickets.filters.status.open")}
                  </SelectItem>
                  <SelectItem value="assigned">
                    {tr(lang, "teamTickets.filters.status.assigned")}
                  </SelectItem>
                  <SelectItem value="in_progress">
                    {tr(lang, "teamTickets.filters.status.inProgress")}
                  </SelectItem>
                  <SelectItem value="pending_user">
                    {tr(lang, "teamTickets.filters.status.pendingUser")}
                  </SelectItem>
                  <SelectItem value="pending_admin">
                    {tr(lang, "teamTickets.filters.status.pendingAdmin")}
                  </SelectItem>
                  <SelectItem value="resolved">
                    {tr(lang, "teamTickets.filters.status.resolved")}
                  </SelectItem>
                  <SelectItem value="closed">
                    {tr(lang, "teamTickets.filters.status.closed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isTeamLead && selectedTickets.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setAssignContext({ ticketIds: selectedTickets });
                  setSelectedMember("");
                }}
              >
                {tr(lang, "teamTickets.actions.bulkAssign")} ({selectedTickets.length})
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{tr(lang, "teamTickets.table.ticketId")}</TableHead>
                  <TableHead>{tr(lang, "teamTickets.table.description")}</TableHead>
                  <TableHead>{tr(lang, "teamTickets.table.location")}</TableHead>
                  <TableHead>{tr(lang, "teamTickets.table.status")}</TableHead>
                  <TableHead>{tr(lang, "teamTickets.table.assignedTo")}</TableHead>
                  <TableHead>{tr(lang, "teamTickets.table.subCategory")}</TableHead>
                  <TableHead>{tr(lang, "teamTickets.table.created")}</TableHead>
                  <TableHead>{tr(lang, "teamTickets.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
                {!isLoading && filteredTickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      {tickets.length === 0 ? (
                        <div className="space-y-2">
                          <AlertCircle className="size-12 text-muted-foreground mx-auto" />
                          <h3 className="text-lg font-medium">{tr(lang, "teamTickets.empty.none")}</h3>
                          <p className="text-sm text-muted-foreground">
                            {tr(lang, "teamTickets.empty.none.helper")}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <AlertCircle className="size-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            {tr(lang, "teamTickets.empty.noMatch")}
                          </p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
                {filteredTickets.map((ticket) => {
                  const isUnassigned = !ticket.assignedUser;
                  const isSelected = selectedTickets.includes(ticket.id);
                  return (
                  <TableRow key={ticket.id}>
                    <TableCell className="w-10 text-center">
                      {isTeamLead && isUnassigned && ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleTicketSelection(ticket.id, e.target.checked)}
                          className="h-4 w-4 rounded border-muted"
                        />
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Link
                        className="underline font-mono text-sm"
                        href={`/my-tickets/${ticket.id}`}
                      >
                        {ticket.ticketNumber || ticket.id.slice(-8)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {ticket.description && ticket.description.length > 60 ? (
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <div className="max-w-[300px] cursor-help">
                              <p className="truncate">{ticket.description}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            sideOffset={8}
                            className="max-w-md p-4 text-sm bg-popover text-popover-foreground border shadow-lg rounded-lg"
                          >
                            <div className="font-medium mb-2 text-xs text-muted-foreground uppercase tracking-wide">
                              {tr(lang, "ticketDetail.description")}
                            </div>
                            <div className="whitespace-pre-wrap break-words leading-relaxed">
                              {ticket.description}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className="max-w-[300px]">
                          <p className="truncate">{ticket.description}</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {ticket.coordinates ? (
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md transition-colors"
                          onClick={() => {
                            const url = `https://www.google.com/maps?q=${ticket.coordinates!.latitude},${ticket.coordinates!.longitude}`;
                            window.open(url, '_blank');
                          }}
                          title="View on map"
                        >
                          View Map
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ticket.status === "open" ? "secondary" :
                          ticket.status === "in_progress" ? "default" :
                          ticket.status === "resolved" ? "secondary" :
                          "outline"
                        }
                        className={
                          ticket.status === "open" ? "bg-sky-500/15 text-sky-700 dark:text-sky-300" :
                          ticket.status === "in_progress" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" :
                          ticket.status === "resolved" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
                          "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300"
                        }
                      >
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.assignedUser ? (
                        (() => {
                          const fullName = `${ticket.assignedUser?.firstName ?? ""} ${
                            ticket.assignedUser?.lastName ?? ""
                          }`.trim();
                          return (
                            fullName ||
                            ticket.assignedUser?.email ||
                            tr(lang, "teamTickets.table.assignedTo.none")
                          );
                        })()
                      ) : isTeamLead && ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssignContext({ ticketIds: [ticket.id], description: ticket.description });
                            setSelectedMember("");
                          }}
                        >
                          <Plus className="mr-1 size-4" />
                          {tr(lang, "teamTickets.actions.assign")}
                        </Button>
                      ) : (
                        tr(lang, "teamTickets.table.assignedTo.none")
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {ticket.subCategory?.name ?? tr(lang, "teamTickets.table.subCategory.none")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTimeSmart(ticket.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/my-tickets/${ticket.id}`}>
                          {tr(lang, "teamTickets.viewDetails")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );})}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                {tr(lang, "teamTickets.pagination.showing")} {filteredTickets.length} {tr(lang, "teamTickets.pagination.of")} {pagination.total} {tr(lang, "teamTickets.pagination.tickets")}
              </div>
              <div>
                {tr(lang, "teamTickets.pagination.page")} {pagination.currentPage} {tr(lang, "teamTickets.pagination.ofPages")} {pagination.totalPages}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!assignContext} onOpenChange={(open) => { if (!open) closeAssignDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr(lang, "teamTickets.assignMember.title")}</DialogTitle>
            {assignContext?.ticketIds.length && assignContext.ticketIds.length > 1 ? (
              <p className="text-sm text-muted-foreground">
                {tr(lang, "teamTickets.assignMember.bulkDescription")} ({assignContext.ticketIds.length})
              </p>
            ) : assignContext?.description ? (
              <p className="text-sm text-muted-foreground">
                {assignContext.description}
              </p>
            ) : null}
          </DialogHeader>
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tr(lang, "teamTickets.assignMember.noMembers")}
            </p>
          ) : (
            <div className="grid gap-3">
              <label className="text-sm font-medium">
                {tr(lang, "teamTickets.assignMember.selectLabel")}
              </label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder={tr(lang, "teamTickets.assignMember.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member._id} value={member._id}>
                      {(() => {
                        const fallbackName = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
                        return member.fullName ?? (fallbackName || member.email || tr(lang, "teamTickets.table.assignedTo.none"));
                      })()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={closeAssignDialog} disabled={assigning}>
              {tr(lang, "teamTickets.assignMember.cancel")}
            </Button>
            <Button type="button" onClick={onAssignMember} disabled={assigning || teamMembers.length === 0}>
              {assigning ? tr(lang, "teamTickets.assignMember.assigning") : tr(lang, "teamTickets.assignMember.assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
