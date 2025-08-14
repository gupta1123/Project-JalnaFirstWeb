"use client";

import { z } from "zod";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { AgencyContact } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User as UserIcon, Briefcase, Building2, MapPin, Phone } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  designation: z.string().min(1),
  agencyName: z.string().min(1),
  agencyType: z.enum(["police", "fire", "medical", "municipal", "government", "other"]),
  zone: z.string().min(1),
  area: z.string().optional(),
  phoneNumber: z.string().min(3),
  phoneType: z.string().default("office"),
});

type Values = z.infer<typeof schema>;

export function AgencyContactForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Partial<AgencyContact>;
  submitting?: boolean;
  onSubmit: (values: Values) => Promise<void> | void;
}) {
  const [values, setValues] = useState<Values>({
    name: initial?.name ?? "",
    designation: initial?.designation ?? "",
    agencyName: initial?.agencyName ?? "",
    agencyType: (initial?.agencyType as Values["agencyType"]) ?? "police",
    zone: initial?.zone ?? "",
    area: initial?.area ?? "",
    phoneNumber: initial?.phoneNumbers?.[0]?.number ?? "",
    phoneType: initial?.phoneNumbers?.[0]?.type ?? "office",
  });

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = schema.safeParse(values);
        if (!parsed.success) {
          toast.error("Please fill all required fields correctly.");
          return;
        }
        await onSubmit(parsed.data);
      }}
    >
      <div className="grid gap-1">
        <Label className="flex items-center gap-2"><UserIcon className="size-4 text-muted-foreground" /> Name</Label>
        <Input value={values.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div className="grid gap-1">
        <Label className="flex items-center gap-2"><Briefcase className="size-4 text-muted-foreground" /> Designation</Label>
        <Input value={values.designation} onChange={(e) => set("designation", e.target.value)} required />
      </div>
      <div className="grid gap-1">
        <Label className="flex items-center gap-2"><Building2 className="size-4 text-muted-foreground" /> Agency Name</Label>
        <Input value={values.agencyName} onChange={(e) => set("agencyName", e.target.value)} required />
      </div>
      <div className="grid gap-1">
        <Label className="flex items-center gap-2"><Building2 className="size-4 text-muted-foreground" /> Agency Type</Label>
        <Select value={values.agencyType} onValueChange={(v) => set("agencyType", v as Values["agencyType"]) }>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="police">Police</SelectItem>
            <SelectItem value="fire">Fire</SelectItem>
            <SelectItem value="medical">Medical</SelectItem>
            <SelectItem value="municipal">Municipal</SelectItem>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> Zone</Label>
          <Input value={values.zone} onChange={(e) => set("zone", e.target.value)} required />
        </div>
        <div className="grid gap-1">
          <Label className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> Area</Label>
          <Input value={values.area ?? ""} onChange={(e) => set("area", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> Phone Number</Label>
          <Input value={values.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} required />
        </div>
        <div className="grid gap-1">
          <Label className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> Phone Type</Label>
          <Input value={values.phoneType} onChange={(e) => set("phoneType", e.target.value)} />
        </div>
      </div>
      <div className="pt-2">
        <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}

