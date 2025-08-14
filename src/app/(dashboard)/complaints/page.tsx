"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Complaint } from "@/lib/types";
import { adminGetTickets } from "@/lib/api";
import type { Ticket } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeSmart } from "@/lib/utils";

export default function ComplaintsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("open");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const params = useMemo(() => {
    const allowed = new Set(["open", "in_progress", "resolved", "closed"]);
    const p: Record<string, string | number> = { page, limit, sortBy: "createdAt", sortOrder: "desc" };
    if (search && search.trim()) p.search = search.trim();
    if (status && allowed.has(status)) p.status = status;
    if (category && category !== "all") p.category = category;
    if (priority && priority !== "all") p.priority = priority;
    return p;
  }, [page, limit, search, status, category, priority]);

  const { data, isLoading, mutate } = useSWR(["tickets-admin", params], () => adminGetTickets(params));
  const tickets: Ticket[] = data?.tickets ?? [];
  const pagination = data?.pagination;

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex flex-1 flex-wrap gap-2">
            <Input className="w-full sm:w-[360px]" placeholder="Search title/description/number…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
            <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => { setPage(1); setCategory(v); }}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="sanitation">Sanitation</SelectItem>
                <SelectItem value="water_supply">Water Supply</SelectItem>
                <SelectItem value="electricity">Electricity</SelectItem>
                <SelectItem value="roads">Roads</SelectItem>
                <SelectItem value="streetlights">Streetlights</SelectItem>
                <SelectItem value="drainage">Drainage</SelectItem>
                <SelectItem value="public_safety">Public Safety</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="municipal_services">Municipal Services</SelectItem>
                <SelectItem value="pollution">Pollution</SelectItem>
                <SelectItem value="encroachment">Encroachment</SelectItem>
                <SelectItem value="property_tax_billing">Property Tax/Billing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => { setPage(1); setPriority(v); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button variant="secondary" onClick={() => { setPage(1); setSearch(""); setStatus("open"); setCategory(""); setPriority(""); }}>Reset</Button>
            <Button onClick={() => mutate()}>Apply</Button>
          </div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    </TableRow>
                  ))}
                </>
              )}
              {!isLoading && tickets.length === 0 && (
                <TableRow><TableCell colSpan={7}>No complaints</TableCell></TableRow>
              )}
              {tickets.map((t) => (
                <TableRow key={t._id}>
                  <TableCell><Link className="underline" href={`/complaints/${t._id}`}>{t.ticketNumber ?? t._id}</Link></TableCell>
                  <TableCell>
                    <span className="block max-w-[420px] truncate" title={t.title}>{t.title}</span>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const cb = t.createdBy as unknown;
                      let userId: string | undefined;
                      let userName: string | undefined;
                      if (typeof cb === 'string') {
                        userId = cb;
                        userName = 'View';
                      } else if (cb && typeof cb === 'object') {
                        const o = cb as Record<string, unknown>;
                        userId = (o._id as string) ?? (o.id as string);
                        userName = (o.fullName as string) ?? (o.email as string) ?? 'User';
                      }
                      return userId ? (
                        <Link href={`/users/${userId}`} className="underline underline-offset-2">
                          <span className="block max-w-[220px] truncate" title={userName}>{userName}</span>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="capitalize">
                    {t.category ? <Badge variant="secondary" className="capitalize">{t.category}</Badge> : '-'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {t.priority ? (
                      <span
                        className={
                          t.priority === 'low'
                            ? 'rounded px-2 py-0.5 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : t.priority === 'medium'
                            ? 'rounded px-2 py-0.5 text-xs bg-amber-500/20 text-amber-800 dark:text-amber-300'
                            : t.priority === 'high'
                            ? 'rounded px-2 py-0.5 text-xs bg-red-500/20 text-red-800 dark:text-red-300'
                            : 'rounded px-2 py-0.5 text-xs bg-red-600/20 text-red-800 dark:text-red-300'
                        }
                      >
                        {t.priority.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    <span className={
                      t.status === 'open' ? 'rounded px-2 py-0.5 text-xs bg-sky-500/15 text-sky-700 dark:text-sky-300' :
                      t.status === 'in_progress' ? 'rounded px-2 py-0.5 text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300' :
                      t.status === 'resolved' ? 'rounded px-2 py-0.5 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' :
                      'rounded px-2 py-0.5 text-xs bg-neutral-500/15 text-neutral-700 dark:text-neutral-300'
                    }>{t.status.replace(/_/g, ' ')}</span>
                  </TableCell>
                  <TableCell>{formatDateTimeSmart(t.createdAt)}</TableCell>
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


