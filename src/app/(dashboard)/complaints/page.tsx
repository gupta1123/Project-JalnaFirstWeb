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
import { adminGetTickets } from "@/lib/api";
import type { Ticket } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeSmart } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

export default function ComplaintsPage() {
  const { lang } = useLanguage();

  // Fixed categories & subcategories as configured in backend
  const fixedCategories = [
    {
      name: "Public Safety",
      subcategories: [
        "Law and Order",
        "Robbery and Theft",
        "Accident",
        "Stampede",
        "Sound Pollution",
      ],
    },
    {
      name: "Infrastructure and Roads",
      subcategories: [
        "Potholes",
        "Incomplete Roads",
        "Streetlights",
        "Encroachment",
        "Tree Cutting",
        "Black Spots",
      ],
    },
    {
      name: "Sanitation and Utilities",
      subcategories: [
        "Open Gutters and Manholes",
        "Sewer Choke",
        "Water Leakage or No Supply",
        "Solid Waste Missed Pickup",
        "Public Toilets",
      ],
    },
    {
      name: "Traffic and Transport",
      subcategories: [
        "Illegal Parking",
        "Traffic Congestion",
      ],
    },
    {
      name: "Livelihood and Local Order",
      subcategories: [
        "Hawkers Non Designated",
        "Stray Animals",
      ],
    },
  ] as const;

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("open");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const params = useMemo(() => {
    const allowed = new Set(["open", "in_progress", "assigned", "resolved", "closed"]);
    const p: Record<string, string | number> = { page, limit, sortBy: "createdAt", sortOrder: "desc" };
    if (search && search.trim()) p.search = search.trim();
    if (status && allowed.has(status)) p.status = status;
    if (category && category !== "all") {
      // Backend expects category names without underscores in the query param.
      // We keep the internal values (with underscores) for enums/translations,
      // and only normalize when sending to the API.
      p.category = category.replace(/_/g, " ");
    }
    if (priority && priority !== "all") p.priority = priority;
    return p;
  }, [page, limit, search, status, category, priority]);

  const { data, isLoading, mutate } = useSWR(["tickets-admin", params], () => adminGetTickets(params));
  const tickets: Ticket[] = data?.tickets ?? [];
  const pagination = data?.pagination;

  const getStatusKey = (status: string): string => {
    const statusMap: Record<string, string> = {
      'open': 'open',
      'in_progress': 'inProgress',
      'assigned': 'assigned',
      'resolved': 'resolved',
      'closed': 'closed',
    };
    return statusMap[status] || status;
  };

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex flex-1 flex-wrap gap-2">
            <Input className="w-full sm:w-[360px]" placeholder={tr(lang, "complaints.filters.searchPlaceholder")} value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
            <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder={tr(lang, "complaints.filters.status")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr(lang, "complaints.filters.status.all")}</SelectItem>
                <SelectItem value="open">{tr(lang, "complaints.filters.status.open")}</SelectItem>
                <SelectItem value="in_progress">{tr(lang, "complaints.filters.status.inProgress")}</SelectItem>
                <SelectItem value="assigned">{tr(lang, "complaints.filters.status.assigned")}</SelectItem>
                <SelectItem value="resolved">{tr(lang, "complaints.filters.status.resolved")}</SelectItem>
                <SelectItem value="closed">{tr(lang, "complaints.filters.status.closed")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => { setPage(1); setCategory(v); }}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={tr(lang, "complaints.filters.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {tr(lang, "complaints.filters.category.all")}
                </SelectItem>
                {fixedCategories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => { setPage(1); setPriority(v); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder={tr(lang, "complaints.filters.priority")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr(lang, "complaints.filters.priority.all")}</SelectItem>
                <SelectItem value="low">{tr(lang, "complaints.filters.priority.low")}</SelectItem>
                <SelectItem value="medium">{tr(lang, "complaints.filters.priority.medium")}</SelectItem>
                <SelectItem value="high">{tr(lang, "complaints.filters.priority.high")}</SelectItem>
                <SelectItem value="urgent">{tr(lang, "complaints.filters.priority.urgent")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tr(lang, "complaints.table.ticketNumber")}</TableHead>
                <TableHead>{tr(lang, "complaints.table.title")}</TableHead>
                <TableHead>{tr(lang, "complaints.table.priority")}</TableHead>
                <TableHead>{tr(lang, "complaints.table.status")}</TableHead>
                <TableHead>{tr(lang, "complaints.table.assignedTeams")}</TableHead>
                <TableHead>{tr(lang, "complaints.table.created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    </TableRow>
                  ))}
                </>
              )}
              {!isLoading && tickets.length === 0 && (
                <TableRow><TableCell colSpan={6}>{tr(lang, "complaints.empty.none")}</TableCell></TableRow>
              )}
              {tickets.map((t) => (
                <TableRow key={t._id}>
                  <TableCell><Link className="underline" href={`/complaints/${t._id}`}>{t.ticketNumber ?? t._id}</Link></TableCell>
                  <TableCell>
                    <span className="block max-w-[420px] truncate" title={t.title}>{t.title}</span>
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
                        {tr(lang, `complaints.priority.${t.priority}`)}
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
                    }>{tr(lang, `complaints.status.${getStatusKey(t.status)}`)}</span>
                  </TableCell>
                  <TableCell>
                    {t.assignedTeams && t.assignedTeams.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {t.assignedTeams.map((team) => (
                          <Badge key={team._id} variant="outline" className="text-xs">
                            {team.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">{tr(lang, "complaints.table.noTeams")}</span>
                    )}
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



