"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import {
  getAgencyContacts,
  createAgencyContact,
  deleteAgencyContact,
  type AgencyContactPayload,
} from "@/lib/api";
import type { AgencyContact } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AgencyContactForm } from "@/components/forms/AgencyContactForm";
import { MoreVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgencyContactsPage() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<null | string>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    ["agency-contacts", search],
    async () => await getAgencyContacts({ search, page: 1, limit: 20 }),
    { revalidateOnFocus: false }
  );

  const contacts: AgencyContact[] = data?.contacts ?? [];

  type AgencyFormValues = Parameters<typeof AgencyContactForm>[0]["onSubmit"] extends (v: infer V) => unknown ? V : never;
  const onCreate = async (values: AgencyFormValues) => {
    setSubmitting(true);
    try {
      const payload: AgencyContactPayload = {
        name: values.name,
        designation: values.designation,
        phoneNumbers: [{ number: values.phoneNumber, type: values.phoneType }],
        agencyName: values.agencyName,
        agencyType: values.agencyType,
        zone: values.zone,
        area: values.area,
      };
      await createAgencyContact(payload);
      toast.success("Contact created");
      setIsAddOpen(false);
      mutate();
    } catch (e) {
      toast.error("Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  const contactById = useMemo(() => {
    const map = new Map<string, AgencyContact>();
    contacts.forEach((c) => map.set(c._id, c));
    return map;
  }, [contacts]);

  async function onConfirmDelete() {
    if (!isDeleteOpen) return;
    setSubmitting(true);
    try {
      await deleteAgencyContact(isDeleteOpen);
      toast.success("Contact deleted");
      setIsDeleteOpen(null);
      mutate();
    } catch (e) {
      toast.error("Delete failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Agency Contacts</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, designation, agency..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64"
                />
                <Button onClick={() => mutate()} variant="secondary">Search</Button>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 size-4" /> New Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Contact</DialogTitle>
                  </DialogHeader>
                  <AgencyContactForm onSubmit={onCreate} submitting={submitting} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">Name & Designation</TableHead>
                  <TableHead className="w-[22%]">Agency</TableHead>
                  <TableHead className="w-[14%]">Type</TableHead>
                  <TableHead className="w-[14%]">Zone/Area</TableHead>
                  <TableHead className="w-[16%]">Phone</TableHead>
                  <TableHead className="w-[6%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Skeleton className="h-4 w-44" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
                {!isLoading && contacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>No contacts</TableCell>
                  </TableRow>
                )}
                {contacts.map((c: AgencyContact) => (
                  <TableRow key={c._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-muted-foreground text-xs">{c.designation}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div>{c.agencyName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{c.agencyType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {c.zone}
                        {c.area ? <span className="text-muted-foreground"> · {c.area}</span> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {c.phoneNumbers?.map((p) => p.number).join(", ") || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {/* Placeholder for future edit */}
                          {/* <DropdownMenuItem onClick={() => {}}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator /> */}
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setIsDeleteOpen(c._id)}
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!isDeleteOpen} onOpenChange={(open) => !open && setIsDeleteOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete contact?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            {isDeleteOpen ? (
              <>
                This action cannot be undone. You are about to delete
                {" "}
                <span className="font-medium text-foreground">
                  {" "}
                  {contactById.get(isDeleteOpen)?.name ?? "this contact"}
                </span>
                .
              </>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onConfirmDelete} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


