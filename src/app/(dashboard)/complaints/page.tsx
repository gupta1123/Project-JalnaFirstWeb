"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Complaint } from "@/lib/types";
import { getComplaints } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function ComplaintsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const { data, isLoading, mutate } = useSWR(["complaints", search, status], () => getComplaints({ search, status, page: 1, limit: 20 }));
  const complaints: Complaint[] = data?.complaints ?? [];

  return (
    <Card>
      <CardContent className="grid gap-3">
        <div className="flex gap-2">
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Input placeholder="Status (open/in_progress/resolved/rejected)" value={status} onChange={(e) => setStatus(e.target.value)} />
          <Button onClick={() => mutate()}>Apply</Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    </TableRow>
                  ))}
                </>
              )}
              {!isLoading && complaints.length === 0 && (
                <TableRow><TableCell colSpan={4}>No complaints</TableCell></TableRow>
              )}
              {complaints.map((c) => (
                <TableRow key={c._id}>
                  <TableCell><Link className="underline" href={`/complaints/${c._id}`}>{c._id}</Link></TableCell>
                  <TableCell>{c.subject ?? c.title ?? '-'}</TableCell>
                  <TableCell>{c.status}</TableCell>
                  <TableCell>{c.createdAt ? new Date(c.createdAt).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


