"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Complaint, User } from "@/lib/types";
import { getComplaintById, updateComplaintStatus, assignComplaint, addComplaintComment } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data, isLoading, mutate } = useSWR(id ? ["complaint", id] : null, () => getComplaintById(id));
  const complaint = data as Complaint | undefined;

  const [status, setStatus] = useState<string>(complaint?.status ?? "");
  const [assignee, setAssignee] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  async function saveStatus() {
    try {
      await updateComplaintStatus(id, status as Complaint["status"]);
      toast.success("Status updated");
      mutate();
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function assign() {
    try {
      await assignComplaint(id, assignee);
      toast.success("Assigned");
      mutate();
    } catch {
      toast.error("Failed to assign");
    }
  }

  async function addComment() {
    try {
      await addComplaintComment(id, comment);
      setComment("");
      toast.success("Comment added");
      mutate();
    } catch {
      toast.error("Failed to add comment");
    }
  }

  function formatAssignedTo(a: Complaint["assignedTo"]) {
    if (!a) return "-";
    if (typeof a === "string") return a;
    const u = a as unknown as User;
    return u.email ?? u._id ?? "-";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complaint Detail</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading && (
          <div className="grid gap-3">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Skeleton className="h-9" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        )}
        {!isLoading && complaint && (
          <div className="grid gap-3">
            <div className="text-sm"><span className="font-medium">ID:</span> {complaint._id}</div>
            <div className="text-sm"><span className="font-medium">Subject:</span> {complaint.subject ?? complaint.title ?? '-'}</div>
            <div className="text-sm"><span className="font-medium">Description:</span> {complaint.description ?? '-'}</div>
            <div className="text-sm"><span className="font-medium">Status:</span> {complaint.status}</div>
            <div className="text-sm"><span className="font-medium">Assigned To:</span> {formatAssignedTo(complaint.assignedTo)}</div>

            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Status (open/in_progress/resolved/rejected)" value={status} onChange={(e) => setStatus(e.target.value)} />
              <Button onClick={saveStatus}>Update Status</Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Assign to userId" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
              <Button onClick={assign}>Assign</Button>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
              <Input placeholder="Add a comment" value={comment} onChange={(e) => setComment(e.target.value)} />
              <Button onClick={addComment}>Comment</Button>
            </div>

            <div className="mt-2">
              <div className="font-medium mb-1 text-sm">Comments</div>
              <div className="grid gap-2">
                {complaint.comments?.map((c, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground border rounded p-2">
                    <div>{c.text}</div>
                    <div className="opacity-70 mt-1">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

