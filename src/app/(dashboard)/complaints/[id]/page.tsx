"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Hash, Tag, Flag, User as UserIcon, MapPin, Clipboard } from "lucide-react";
import { formatDateTimeSmart } from "@/lib/utils";
import type { Ticket, TicketStatus, User } from "@/lib/types";
import { adminGetTicketById, adminUpdateTicketStatus, adminAddNote, adminGetTicketHistory, getUserById } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const validStatuses: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data, isLoading, mutate } = useSWR(id ? ["ticket-admin", id] : null, () => adminGetTicketById(id));
  const ticket = data as Ticket | undefined;

  const requesterUserId = useMemo(() => {
    const createdBy = ticket?.createdBy as unknown;
    if (!createdBy) return undefined;
    if (typeof createdBy === "string") return createdBy;
    if (typeof createdBy === "object") {
      const obj = createdBy as Record<string, unknown>;
      return (obj._id as string) ?? (obj.id as string) ?? undefined;
    }
    return undefined;
  }, [ticket]);

  const { data: requester, isLoading: isLoadingRequester } = useSWR(
    requesterUserId ? ["user", requesterUserId] : null,
    () => getUserById(requesterUserId as string),
    { revalidateOnFocus: false }
  );
  const requesterUser = requester as User | undefined;

  // Ticket change history
  type ChangeItem = { id: string; field?: string; oldValue?: string; newValue?: string; changeType?: string; description?: string; changedBy?: { fullName?: string }; changedAt?: string };
  type TicketHistory = { ticketNumber?: string; title?: string; changeHistory?: ChangeItem[] };
  const { data: historyResp, mutate: mutateHistory } = useSWR<TicketHistory>(id ? ["ticket-history-admin", id] : null, () => adminGetTicketHistory(id), { revalidateOnFocus: false });
  const historyItems: ChangeItem[] = useMemo(() => (historyResp?.changeHistory ?? [])
    // Hide no-op status changes where oldValue === newValue
    .filter((h) => !(h.field === 'status' && (h.oldValue ?? '') === (h.newValue ?? '')))
    .slice()
    .sort((a, b) => {
    const ta = a.changedAt ? new Date(a.changedAt).getTime() : 0;
    const tb = b.changedAt ? new Date(b.changedAt).getTime() : 0;
    return tb - ta; // newest first
  }), [historyResp]);

  // Keep status select in sync with loaded ticket
  useEffect(() => {
    if (ticket?.status) setStatus(ticket.status);
  }, [ticket?.status]);

  const [status, setStatus] = useState<TicketStatus>(ticket?.status ?? "open");
  const [note, setNote] = useState<string>("");
  const [noteOpen, setNoteOpen] = useState(false);
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
      await mutate();
      await mutateHistory();
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
      await mutate();
      await mutateHistory();
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
      <CardContent className="grid gap-4 overflow-x-hidden">
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
            <div className="rounded-lg border p-4 grid gap-3 overflow-x-hidden">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] items-start">
                {/* Left: identifier */}
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="size-4 text-muted-foreground" />
                  <span className="font-medium">{ticket.ticketNumber ?? ticket._id}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={copyId}>
                    <Clipboard className="size-4" /> {copiedId ? "Copied" : "Copy"}
                  </Button>
                </div>

                {/* Right: badges + add note */}
                <div className="flex flex-col gap-2 md:items-end">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {ticket.category && (
                      <Badge variant="secondary" className="capitalize flex items-center gap-1"><Tag className="size-3.5" /> {ticket.category}</Badge>
                    )}
                    {ticket.priority && (
                      <Badge className="capitalize flex items-center gap-1"><Flag className="size-3.5" /> {ticket.priority}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>Add note</Button>
                  </div>
                </div>
              </div>
              <div className="text-base font-medium break-words break-all whitespace-pre-wrap">{ticket.title}</div>
              <div className="text-sm text-muted-foreground leading-relaxed break-words break-all whitespace-pre-wrap">{ticket.description}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-3.5" /> Created: {created} • Updated: {updated}</div>
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {ticket.tags.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                  ))}
            </div>
              )}
              {/* Bottom-right controls */}
              <div className="flex flex-wrap gap-2 justify-end pt-2">
                <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
                  <SelectTrigger className="h-8 w-[180px] sm:w-[220px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {validStatuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={saveStatus} disabled={submitting}>Save</Button>
            </div>
            </div>

            {/* Compact controls moved to top summary; removed section to save space */}

            {/* Two-column layout: left Tabs (Notes/Activity), right Details */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              {/* LEFT */}
              <div className="lg:col-span-8">
                <Card>
                  <CardHeader className="pb-2"><CardTitle>Notes & Activity</CardTitle></CardHeader>
                  <CardContent>
                    <Tabs defaultValue="activity" className="w-full">
                      <TabsList>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                      </TabsList>
                      <TabsContent value="activity" className="mt-4">
                        {historyItems.length === 0 ? (
                          <div className="text-xs text-muted-foreground">No history yet</div>
                        ) : (
                          <div className="relative">
                            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" aria-hidden />
                            <div className="grid gap-3">
                              {historyItems.map((h) => (
                                <div key={h.id} className="relative pl-8">
                                  <div className="absolute left-2.5 top-0.5 h-2.5 w-2.5 rounded-full bg-foreground" />
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Flag className="size-3.5" />
                                    <span className="capitalize">{h.changeType?.replace(/_/g, " ") ?? "change"}</span>
                                    {h.changedAt && <span>• {formatDateTimeSmart(h.changedAt)}</span>}
                                  </div>
                                  <div className="text-sm">
                                    {h.field === 'status' ? (
                                      <>
                                        Status changed from{' '}
                                        <Badge className={`ml-1 capitalize border ${statusBadgeClass((h.oldValue as TicketStatus) ?? 'open')}`}>
                                          {(h.oldValue ?? '').toString().replace(/_/g, ' ')}
                                        </Badge>
                                        {' '}to{' '}
                                        <Badge className={`capitalize border ${statusBadgeClass((h.newValue as TicketStatus) ?? 'open')}`}>
                                          {(h.newValue ?? '').toString().replace(/_/g, ' ')}
                                        </Badge>
                                      </>
                                    ) : (
                                      h.description ?? `${h.field ?? 'field'} updated`
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="notes" className="mt-4">
                        {(ticket.adminNotes && ticket.adminNotes.length > 0) ? (
              <div className="grid gap-2">
                            {ticket.adminNotes.map((n, i) => (
                              <div key={i} className="text-xs text-muted-foreground border rounded p-2">
                                <div className="text-foreground text-sm">{n.note}</div>
                                {n.addedAt && <div className="opacity-70 mt-1">{formatDateTimeSmart(n.addedAt)}</div>}
                  </div>
                ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">No notes yet</div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT */}
              <div className="lg:col-span-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle>Details</CardTitle></CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="rounded-lg border p-4 grid gap-1">
                      <div className="text-sm font-medium mb-1 flex items-center gap-2"><UserIcon className="size-4 text-muted-foreground" /> Requester</div>
                      {requesterUserId ? (
                        <Link href={`/users/${requesterUserId}`} className="text-sm underline underline-offset-2 hover:text-accent-foreground">
                          {requesterUser?.fullName ?? (typeof ticket.createdBy === 'object' && ticket.createdBy && 'fullName' in ticket.createdBy ? (ticket.createdBy as Record<string, unknown>).fullName as string : '-')}
                        </Link>
                      ) : (
                        <div className="text-sm">{requesterUser?.fullName ?? (typeof ticket.createdBy === 'object' && ticket.createdBy && 'fullName' in ticket.createdBy ? (ticket.createdBy as Record<string, unknown>).fullName as string : '-')}</div>
                      )}
                      <div className="text-xs text-muted-foreground">{requesterUser?.email ?? (typeof ticket.createdBy === 'object' && ticket.createdBy && 'email' in ticket.createdBy ? (ticket.createdBy as Record<string, unknown>).email as string : '')}</div>
                      {requesterUser?.phoneNumber && (
                        <div className="text-xs text-muted-foreground">{requesterUser.phoneNumber}</div>
                      )}
                    </div>
                    <div className="rounded-lg border p-4 grid gap-1">
                      <div className="text-sm font-medium mb-1 flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> Address</div>
                      {requesterUser?.address ? (
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {(() => {
                            const addr = requesterUser.address!;
                            const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
                            const city = addr.city?.trim();
                            const lineHasCity = (line?: string) => !!(line && city && line.toLowerCase().includes(city.toLowerCase()));
                            const line1Text = addr.line1 ? `${addr.line1}${!lineHasCity(addr.line1) && city ? `, ${city}` : ''}` : undefined;
                            const line2Raw = addr.line2 ? `${addr.line2}` : undefined;
                            const showLine2 = line1Text && line2Raw ? normalize(line1Text) !== normalize(line2Raw) : Boolean(line2Raw);
                            const tail = [addr.state, addr.zipCode, addr.country].filter(Boolean).join(", ");
                            return (
                              <>
                                {line1Text && <div>{line1Text}</div>}
                                {showLine2 && <div>{line2Raw}</div>}
                                {tail ? <div>{tail}</div> : (!line1Text && !showLine2 ? <div>-</div> : null)}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          <div>Zone: {ticket.location?.zone ?? '-'}</div>
                          <div>City: {ticket.location?.city ?? '-'}</div>
                          <div>State: {ticket.location?.state ?? '-'}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {/* Add note modal */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add admin note</DialogTitle>
            <DialogDescription>Share a short, clear update for other admins.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Textarea rows={5} placeholder="Write a short note..." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={async () => { await addNote(); setNoteOpen(false); }} disabled={submitting || !note.trim()}>
              {submitting ? "Adding..." : "Add note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

