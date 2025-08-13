"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Hash, Tag, Flag, User, MapPin, Clipboard } from "lucide-react";
import { formatDateTimeSmart } from "@/lib/utils";
import type { Ticket, TicketStatus } from "@/lib/types";
import { adminGetTicketById, adminUpdateTicketStatus, adminAddNote } from "@/lib/api";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const validStatuses: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data, isLoading, mutate } = useSWR(id ? ["ticket-admin", id] : null, () => adminGetTicketById(id));
  const ticket = data as Ticket | undefined;

  const [status, setStatus] = useState<TicketStatus>(ticket?.status ?? "open");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const created = useMemo(() => formatDateTimeSmart(ticket?.createdAt), [ticket?.createdAt]);
  const updated = useMemo(() => formatDateTimeSmart(ticket?.updatedAt), [ticket?.updatedAt]);

  function statusBadgeClass(s: TicketStatus) {
    if (s === "open") return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20";
    if (s === "in_progress") return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20";
    if (s === "resolved") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    if (s === "closed") return "bg-muted text-muted-foreground border-muted-foreground/20";
    return "";
  }

  async function copyId() {
    try { await navigator.clipboard.writeText(ticket?.ticketNumber ?? ticket?._id ?? ""); setCopiedId(true); setTimeout(()=>setCopiedId(false), 1000);} catch {}
  }

  async function saveStatus() {
    try {
      setSubmitting(true);
      await adminUpdateTicketStatus(id, { status });
      toast.success("Status updated");
      mutate();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSubmitting(false);
    }
  }

  async function addNote() {
    try {
      if (!note.trim()) return;
      setSubmitting(true);
      await adminAddNote(id, note.trim());
      setNote("");
      toast.success("Note added");
      mutate();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading && (
          <div className="grid gap-3">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        )}
        {!isLoading && ticket && (
          <div className="grid gap-4">
            {/* Top summary */}
            <div className="rounded-lg border p-4 grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="size-4 text-muted-foreground" />
                  <span className="font-medium">{ticket.ticketNumber ?? ticket._id}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={copyId}>
                    <Clipboard className="size-4" /> {copiedId ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ticket.category && (
                    <Badge variant="secondary" className="capitalize flex items-center gap-1"><Tag className="size-3.5" /> {ticket.category}</Badge>
                  )}
                  {ticket.priority && (
                    <Badge className="capitalize flex items-center gap-1"><Flag className="size-3.5" /> {ticket.priority}</Badge>
                  )}
                  <Badge className={`capitalize border ${statusBadgeClass(ticket.status)}`}>{ticket.status.replace(/_/g, " ")}</Badge>
                </div>
              </div>
              <div className="text-base font-medium">{ticket.title}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{ticket.description}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-3.5" /> Created: {created} • Updated: {updated}</div>
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {ticket.tags.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Status & note actions */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4 grid gap-2">
                <div className="text-sm font-medium">Update status</div>
                <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {validStatuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={saveStatus} disabled={submitting} className="w-fit">{submitting ? "Saving..." : "Save"}</Button>
              </div>

              <div className="rounded-lg border p-4 grid gap-2">
                <div className="text-sm font-medium">Add admin note</div>
                <Textarea rows={4} placeholder="Write a short note..." value={note} onChange={(e) => setNote(e.target.value)} />
                <Button onClick={addNote} disabled={submitting || !note.trim()} className="w-fit">{submitting ? "Adding..." : "Add note"}</Button>
              </div>
            </div>

            {/* Requester & Location */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4 grid gap-1">
                <div className="text-sm font-medium mb-1 flex items-center gap-2"><User className="size-4 text-muted-foreground" /> Requester</div>
                <div className="text-sm">{typeof ticket.createdBy === 'object' && ticket.createdBy && 'fullName' in ticket.createdBy ? (ticket.createdBy as Record<string, unknown>).fullName as string : '-'}</div>
                <div className="text-xs text-muted-foreground">
                  {typeof ticket.createdBy === 'object' && ticket.createdBy && 'email' in ticket.createdBy ? (ticket.createdBy as Record<string, unknown>).email as string : ''}
                </div>
              </div>
              <div className="rounded-lg border p-4 grid gap-1">
                <div className="text-sm font-medium mb-1 flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> Location</div>
                <div className="text-sm text-muted-foreground">Zone: {ticket.location?.zone ?? '-'}</div>
                <div className="text-sm text-muted-foreground">City: {ticket.location?.city ?? '-'}</div>
                <div className="text-sm text-muted-foreground">State: {ticket.location?.state ?? '-'}</div>
              </div>
            </div>

            {/* Meta */}
            <div className="rounded-lg border p-4 grid gap-2">
              <div className="text-sm font-medium">Meta</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={ticket.escalated ? 'destructive' : 'outline'}>Escalated: {ticket.escalated ? 'Yes' : 'No'}</Badge>
                <Badge variant={ticket.slaBreached ? 'destructive' : 'outline'}>SLA Breached: {ticket.slaBreached ? 'Yes' : 'No'}</Badge>
                <Badge variant={ticket.isPublic ? 'secondary' : 'outline'}>Public: {ticket.isPublic ? 'Yes' : 'No'}</Badge>
                {typeof ticket.age === 'number' && <Badge variant="outline">Age: {ticket.age}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">Updated: {updated}</div>
            </div>

            {/* Notes list */}
            {(ticket.adminNotes && ticket.adminNotes.length > 0) && (
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium mb-2">Admin notes</div>
              <div className="grid gap-2">
                  {ticket.adminNotes.map((n, i) => (
                    <div key={i} className="text-xs text-muted-foreground border rounded p-2">
                      <div>{n.note}</div>
                      {n.addedAt && <div className="opacity-70 mt-1">{new Date(n.addedAt).toLocaleString()}</div>}
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

