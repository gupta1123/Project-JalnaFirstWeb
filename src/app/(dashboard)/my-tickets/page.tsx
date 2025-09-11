"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getTeamTicketsMinimal } from "@/lib/api";
import { formatDateTimeSmart } from "@/lib/utils";
import { MapPin, Clock, AlertCircle } from "lucide-react";

export default function MyTicketsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("open");

  const { data, isLoading, mutate } = useSWR(
    ["team-tickets", status],
    () => getTeamTicketsMinimal({ page: 1, limit: 50 }),
    { revalidateOnFocus: false }
  );

  const tickets = data?.tickets ?? [];
  const pagination = data?.pagination;

  // Filter tickets by search term and status
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = search === "" || ticket.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || ticket.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">
              Assigned to your team
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === "open").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === "in_progress").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === "resolved" || t.status === "closed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              This period
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
                placeholder="Search in descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attachments</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableCell colSpan={7} className="text-center py-8">
                      {tickets.length === 0 ? (
                        <div className="space-y-2">
                          <AlertCircle className="size-12 text-muted-foreground mx-auto" />
                          <h3 className="text-lg font-medium">No tickets assigned</h3>
                          <p className="text-sm text-muted-foreground">
                            Your team hasn&apos;t been assigned any tickets yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <AlertCircle className="size-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            No tickets match your search criteria.
                          </p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link
                        className="underline font-mono text-sm"
                        href={`/my-tickets/${ticket.id}`}
                      >
                        {ticket.id.slice(-8)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <p className="truncate" title={ticket.description}>
                          {ticket.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.coordinates ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Location available
                            </span>
                          </div>
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
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">No location</span>
                        </div>
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
                      <span className="text-sm text-muted-foreground">
                        {ticket.attachments.length} files
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
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {filteredTickets.length} of {pagination.total} tickets
              </div>
              <div>
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
