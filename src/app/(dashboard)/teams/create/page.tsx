"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { createTeam } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";

type TeamFormData = {
  name: string;
  description: string;
  zone: string;
  area: string;
  city: string;
  state: string;
};

export default function CreateTeamPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [teamData, setTeamData] = useState<TeamFormData>({
    name: "",
    description: "",
    zone: "",
    area: "",
    city: "Jalna",
    state: "Maharashtra",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!teamData.name.trim() || !teamData.zone.trim() || !teamData.city.trim()) {
      toast.error(tr(lang, "teams.create.toast.fillRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await createTeam({
        name: teamData.name,
        description: teamData.description,
        areas: [
          {
            zone: teamData.zone,
            area: teamData.area,
            city: teamData.city,
            state: teamData.state,
          },
        ],
      });
      toast.success(tr(lang, "teams.create.toast.success"));
      router.push("/teams");
    } catch (error) {
      toast.error(tr(lang, "teams.create.toast.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{tr(lang, "teams.create.title")}</h1>
          <p className="text-muted-foreground">
            {tr(lang, "teams.create.subtitle")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            {tr(lang, "teams.create.card.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {tr(lang, "teams.create.card.description")}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{tr(lang, "teams.create.form.teamName")} *</Label>
                <Input
                  id="name"
                  value={teamData.name}
                  onChange={(e) =>
                    setTeamData({ ...teamData, name: e.target.value })
                  }
                  placeholder={tr(lang, "teams.create.form.teamNamePlaceholder")}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">{tr(lang, "teams.create.form.description")}</Label>
                <Textarea
                  id="description"
                  value={teamData.description}
                  onChange={(e) =>
                    setTeamData({ ...teamData, description: e.target.value })
                  }
                  placeholder={tr(lang, "teams.create.form.descriptionPlaceholder")}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="zone">{tr(lang, "teams.create.form.zone")} *</Label>
                  <Input
                    id="zone"
                    value={teamData.zone}
                    onChange={(e) =>
                      setTeamData({ ...teamData, zone: e.target.value })
                    }
                    placeholder={tr(lang, "teams.create.form.zonePlaceholder")}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="area">{tr(lang, "teams.create.form.area")}</Label>
                  <Input
                    id="area"
                    value={teamData.area}
                    onChange={(e) =>
                      setTeamData({ ...teamData, area: e.target.value })
                    }
                    placeholder={tr(lang, "teams.create.form.areaPlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">{tr(lang, "teams.create.form.city")} *</Label>
                  <Input
                    id="city"
                    value={teamData.city}
                    onChange={(e) =>
                      setTeamData({ ...teamData, city: e.target.value })
                    }
                    placeholder={tr(lang, "teams.create.form.cityPlaceholder")}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">{tr(lang, "teams.create.form.state")}</Label>
                  <Input
                    id="state"
                    value={teamData.state}
                    onChange={(e) =>
                      setTeamData({ ...teamData, state: e.target.value })
                    }
                    placeholder={tr(lang, "teams.create.form.statePlaceholder")}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="min-w-32" disabled={submitting}>
                {submitting ? tr(lang, "teams.create.button.creating") : tr(lang, "teams.create.button.create")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
