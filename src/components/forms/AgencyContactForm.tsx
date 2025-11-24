"use client";

import { z } from "zod";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { AgencyContact } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User as UserIcon, Briefcase, Building2, MapPin, Phone, ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

const schema = z.object({
  name: z.string().min(1),
  designation: z.string().min(1),
  agencyName: z.string().min(1),
  agencyType: z.enum(["police", "fire", "medical", "municipal", "government", "other"]),
  zone: z.string().min(1),
  area: z.string().optional(),
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  phoneType: z.string().default("office"),
});

type Values = z.infer<typeof schema>;
const AGENCY_TYPES: Values["agencyType"][] = ["police", "fire", "medical", "municipal", "government", "other"];

export function AgencyContactForm({
  initial,
  onSubmit,
  submitting,
  showPhoneType,
  lang,
}: {
  initial?: Partial<AgencyContact>;
  submitting?: boolean;
  onSubmit: (values: Values) => Promise<void> | void;
  showPhoneType?: boolean;
  lang?: "en" | "hi" | "mr";
}) {
  const { lang: contextLang } = useLanguage();
  const currentLang = lang ?? contextLang;
  const shouldShowPhoneType = showPhoneType ?? true;
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

  const [typeSearch, setTypeSearch] = useState("");
  const [typeShowAll, setTypeShowAll] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const phoneHelper =
    values.phoneNumber.length > 0 && values.phoneNumber.length < 10
      ? tr(currentLang, "agencyContacts.form.phoneError")
      : undefined;

  const filteredTypes = useMemo(() => {
    const query = typeSearch.trim().toLowerCase();
    if (!query) return AGENCY_TYPES;
    return AGENCY_TYPES.filter((type) => {
      const label = tr(currentLang, `agencyContacts.form.types.${type}`).toLowerCase();
      return type.includes(query) || label.includes(query);
    });
  }, [currentLang, typeSearch]);

  const typeDisplayOptions = useMemo(() => {
    if (typeSearch.trim() || typeShowAll) return filteredTypes;
    return filteredTypes.slice(0, 3);
  }, [filteredTypes, typeSearch, typeShowAll]);

  const typeRenderOptions = useMemo(() => {
    if (values.agencyType && !typeDisplayOptions.includes(values.agencyType)) {
      return [values.agencyType, ...typeDisplayOptions];
    }
    return typeDisplayOptions;
  }, [typeDisplayOptions, values.agencyType]);

  const typeHasMore = filteredTypes.length > 3 && !typeSearch.trim();

  const handleTypeOpenChange = (open: boolean) => {
    if (!open) {
      setTypeSearch("");
      setTypeShowAll(false);
    }
  };

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = schema.safeParse(values);
        if (!parsed.success) {
          toast.error(tr(currentLang, "agencyContacts.form.fillRequired"));
          return;
        }
        await onSubmit(parsed.data);
      }}
    >
      <div className="grid gap-1">
        <Label className="flex items-center gap-2"><Building2 className="size-4 text-muted-foreground" /> {tr(currentLang, "agencyContacts.form.agencyType")}</Label>
        <Select value={values.agencyType} onValueChange={(v) => set("agencyType", v as Values["agencyType"])} onOpenChange={handleTypeOpenChange}>
          <SelectTrigger>
            <SelectValue placeholder={tr(currentLang, "agencyContacts.form.selectType")} />
          </SelectTrigger>
          <SelectContent side="bottom" sideOffset={8} avoidCollisions={false}>
            <div className="px-1 pb-1">
              <Input
                autoFocus
                className="h-8"
                placeholder={tr(currentLang, "agencyContacts.filters.typeSearchPlaceholder")}
                value={typeSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setTypeSearch(value);
                  setTypeShowAll(Boolean(value.trim()));
                }}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            {typeRenderOptions.length > 0 ? (
              <>
                {typeRenderOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {tr(currentLang, `agencyContacts.form.types.${type}`)}
                  </SelectItem>
                ))}
                {typeHasMore && !typeShowAll && (
                  <div
                    className="px-2 py-2 text-sm text-primary cursor-pointer hover:bg-accent rounded-sm flex items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTypeShowAll(true);
                    }}
                  >
                    <ChevronDown className="size-4" />
                    {tr(currentLang, "agencyContacts.filters.viewMore")} ({filteredTypes.length - 3})
                  </div>
                )}
              </>
            ) : (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                {tr(currentLang, "agencyContacts.empty.none")}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <Label className="flex items-center gap-2"><UserIcon className="size-4 text-muted-foreground" /> {tr(currentLang, "agencyContacts.form.name")}</Label>
        <Input value={values.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div className="grid gap-1">
        <Label className="flex items-center gap-2"><Briefcase className="size-4 text-muted-foreground" /> {tr(currentLang, "agencyContacts.form.designation")}</Label>
        <Input value={values.designation} onChange={(e) => set("designation", e.target.value)} required />
      </div>
      <div className="grid gap-1">
        <Label className="flex items-center gap-2"><Building2 className="size-4 text-muted-foreground" /> {tr(currentLang, "agencyContacts.form.agencyName")}</Label>
        <Input value={values.agencyName} onChange={(e) => set("agencyName", e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> {tr(currentLang, "agencyContacts.form.zone")}</Label>
          <Input value={values.zone} onChange={(e) => set("zone", e.target.value)} required />
        </div>
        <div className="grid gap-1">
          <Label className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> {tr(currentLang, "agencyContacts.form.area")}</Label>
          <Input value={values.area ?? ""} onChange={(e) => set("area", e.target.value)} />
        </div>
      </div>
      <div className={shouldShowPhoneType ? "grid grid-cols-2 gap-3" : "grid gap-3"}>
        <div className="grid gap-1">
          <Label className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> {tr(currentLang, "agencyContacts.form.phoneNumber")}</Label>
          <Input
            value={values.phoneNumber}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              set("phoneNumber", digits);
            }}
            className={!shouldShowPhoneType ? "max-w-xs" : undefined}
            required
          />
          {phoneHelper && (
            <p className="text-xs text-destructive">{phoneHelper}</p>
          )}
        </div>
        {shouldShowPhoneType && (
          <div className="grid gap-1">
            <Label className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> {tr(currentLang, "agencyContacts.form.phoneType")}</Label>
            <Input value={values.phoneType} onChange={(e) => set("phoneType", e.target.value)} />
          </div>
        )}
      </div>
      <div className="pt-2">
        <Button type="submit" disabled={submitting}>{submitting ? tr(currentLang, "agencyContacts.form.saving") : tr(currentLang, "agencyContacts.form.save")}</Button>
      </div>
    </form>
  );
}

