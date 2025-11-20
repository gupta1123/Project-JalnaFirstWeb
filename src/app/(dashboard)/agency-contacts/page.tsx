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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AgencyContactForm } from "@/components/forms/AgencyContactForm";
import { MoreVertical, Plus, Trash2, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

export default function AgencyContactsPage() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [agencyTypeFilter, setAgencyTypeFilter] = useState<string>("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<null | string>(null);
  const [isViewOpen, setIsViewOpen] = useState<null | string>(null);
  const [isEditOpen, setIsEditOpen] = useState<null | string>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    ["agency-contacts", search, agencyTypeFilter],
    async () =>
      await getAgencyContacts({
        search,
        agencyType: agencyTypeFilter || undefined,
        page: 1,
        limit: 20,
      }),
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
        phoneNumbers: [{ number: values.phoneNumber, type: values.phoneType ?? "office" }],
        agencyName: values.agencyName,
        agencyType: values.agencyType,
        zone: values.zone,
        area: values.area,
      };
      await createAgencyContact(payload);
      toast.success(tr(lang, "agencyContacts.toast.created"));
      setIsAddOpen(false);
      mutate();
    } catch (e) {
      toast.error(tr(lang, "agencyContacts.toast.createFailed"));
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
      toast.success(tr(lang, "agencyContacts.toast.deleted"));
      setIsDeleteOpen(null);
      mutate();
    } catch (e) {
      toast.error(tr(lang, "agencyContacts.toast.deleteFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  // Reuse AgencyFormValues defined above
  const onUpdate = async (id: string, values: AgencyFormValues) => {
    setSubmitting(true);
    try {
      const payload: Partial<AgencyContactPayload> = {
        name: values.name,
        designation: values.designation,
        phoneNumbers: [{ number: values.phoneNumber, type: values.phoneType ?? contactById.get(id)?.phoneNumbers?.[0]?.type ?? "office" }],
        agencyName: values.agencyName,
        agencyType: values.agencyType,
        zone: values.zone,
        area: values.area,
      };
      const { updateAgencyContact } = await import("@/lib/api");
      await updateAgencyContact(id, payload);
      toast.success(tr(lang, "agencyContacts.toast.updated"));
      setIsEditOpen(null);
      mutate();
    } catch (e) {
      toast.error(tr(lang, "agencyContacts.toast.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const agencyTypeOptions: Array<AgencyContact["agencyType"]> = ["police", "fire", "medical", "municipal", "government", "other"];

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{tr(lang, "agencyContacts.title")}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder={tr(lang, "agencyContacts.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64"
                />
                <Select value={agencyTypeFilter || "all"} onValueChange={(value) => setAgencyTypeFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-48" aria-label={tr(lang, "agencyContacts.filters.typeLabel")}>
                    <SelectValue placeholder={tr(lang, "agencyContacts.filters.typeLabel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tr(lang, "agencyContacts.filters.allTypes")}</SelectItem>
                    {agencyTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {tr(lang, `agencyContacts.form.types.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => mutate()} variant="secondary">{tr(lang, "agencyContacts.search")}</Button>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 size-4" /> {tr(lang, "agencyContacts.newContact")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{tr(lang, "agencyContacts.addContact")}</DialogTitle>
                  </DialogHeader>
                  <AgencyContactForm onSubmit={onCreate} submitting={submitting} showPhoneType={false} lang={lang} />
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
                  <TableHead className="w-[28%]">{tr(lang, "agencyContacts.table.nameDesignation")}</TableHead>
                  <TableHead className="w-[22%]">{tr(lang, "agencyContacts.table.agency")}</TableHead>
                  <TableHead className="w-[14%]">{tr(lang, "agencyContacts.table.type")}</TableHead>
                  <TableHead className="w-[14%]">{tr(lang, "agencyContacts.table.area")}</TableHead>
                  <TableHead className="w-[16%]">{tr(lang, "agencyContacts.table.phone")}</TableHead>
                  <TableHead className="w-[6%] text-right">{tr(lang, "agencyContacts.table.actions")}</TableHead>
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
                    <TableCell colSpan={6}>{tr(lang, "agencyContacts.empty.none")}</TableCell>
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
                        {c.area || "-"}
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
                          <DropdownMenuItem onClick={() => setIsViewOpen(c._id)}>
                            <Eye className="size-4" /> {tr(lang, "agencyContacts.actions.view")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsEditOpen(c._id)}>
                            <Pencil className="size-4" /> {tr(lang, "agencyContacts.actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setIsDeleteOpen(c._id)}
                          >
                            <Trash2 className="size-4" /> {tr(lang, "agencyContacts.actions.delete")}
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
            <DialogTitle>{tr(lang, "agencyContacts.delete.title")}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            {isDeleteOpen ? (
              <>
                {tr(lang, "agencyContacts.delete.description")}
                {" "}
                <span className="font-medium text-foreground">
                  {contactById.get(isDeleteOpen)?.name ?? tr(lang, "agencyContacts.delete.thisContact")}
                </span>
                .
              </>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{tr(lang, "agencyContacts.delete.cancel")}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onConfirmDelete} disabled={submitting}>
              {submitting ? tr(lang, "agencyContacts.delete.deleting") : tr(lang, "agencyContacts.delete.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* View contact dialog */}
      <Dialog open={!!isViewOpen} onOpenChange={(open) => !open && setIsViewOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr(lang, "agencyContacts.view.title")}</DialogTitle>
          </DialogHeader>
          {isViewOpen && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">{tr(lang, "agencyContacts.view.name")}</div>
                  <div className="font-medium">{contactById.get(isViewOpen)?.name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{tr(lang, "agencyContacts.view.designation")}</div>
                  <div>{contactById.get(isViewOpen)?.designation}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">{tr(lang, "agencyContacts.view.agency")}</div>
                  <div>{contactById.get(isViewOpen)?.agencyName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{tr(lang, "agencyContacts.view.type")}</div>
                  <div>{contactById.get(isViewOpen)?.agencyType ? tr(lang, `agencyContacts.form.types.${contactById.get(isViewOpen)?.agencyType}`) : '-'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">{tr(lang, "agencyContacts.view.zone")}</div>
                  <div>{contactById.get(isViewOpen)?.zone}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{tr(lang, "agencyContacts.view.area")}</div>
                  <div>{contactById.get(isViewOpen)?.area || '-'}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{tr(lang, "agencyContacts.view.phones")}</div>
                <div>{contactById.get(isViewOpen)?.phoneNumbers?.map(p => p.number).join(', ')}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit contact dialog */}
      <Dialog open={!!isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr(lang, "agencyContacts.editContact")}</DialogTitle>
          </DialogHeader>
          {isEditOpen && (
            <AgencyContactForm
              initial={contactById.get(isEditOpen) ?? undefined}
              submitting={submitting}
              onSubmit={async (values) => onUpdate(isEditOpen, values)}
              lang={lang}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


