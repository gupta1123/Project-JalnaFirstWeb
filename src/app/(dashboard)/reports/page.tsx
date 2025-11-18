"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";
import { getCurrentUser, getTeamStats } from "@/lib/api";
import type { TeamStatsResponse, TicketStatusTotals } from "@/lib/types";
import { AlertCircle, BarChart3, CalendarRange, RefreshCw } from "lucide-react";

type DateRangeState = {
  startDate: string;
  endDate: string;
};

type MemberInfo = TeamStatsResponse["members"][number]["member"];

const STATUS_KEYS = ["open", "assigned", "in_progress", "pending_user", "pending_admin", "resolved", "closed"] as const;
type StatusKey = typeof STATUS_KEYS[number];
type StatusCardKey = StatusKey | "total";

const STATUS_INDICATORS: Record<StatusCardKey, string> = {
  total: "text-primary",
  open: "text-muted-foreground",
  assigned: "text-muted-foreground",
  in_progress: "text-muted-foreground",
  pending_user: "text-muted-foreground",
  pending_admin: "text-muted-foreground",
  resolved: "text-muted-foreground",
  closed: "text-muted-foreground",
};

const EMPTY_TOTALS: TicketStatusTotals = {
  open: 0,
  assigned: 0,
  in_progress: 0,
  pending_user: 0,
  pending_admin: 0,
  resolved: 0,
  closed: 0,
  total: 0,
};

const createDefaultDateRange = (): DateRangeState => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);

  const format = (date: Date) => date.toISOString().split("T")[0];
  return {
    startDate: format(start),
    endDate: format(end),
  };
};

export default function ReportsPage() {
  const { lang } = useLanguage();
  const { data: currentUser, isLoading: loadingUser } = useSWR("current-user", getCurrentUser, {
    revalidateOnFocus: false,
  });

  const [dateRange, setDateRange] = useState<DateRangeState>(createDefaultDateRange);

  const isTeamLead = currentUser?.teams?.some((team) => team.isLeader) ?? false;
  const leaderTeam = currentUser?.teams?.find((team) => team.isLeader);
  const leaderTeamId = leaderTeam?.id ?? leaderTeam?._id;
  const leaderTeamName = leaderTeam?.name;

  const statsKey = leaderTeamId
    ? ["team-stats", leaderTeamId, dateRange.startDate, dateRange.endDate]
    : null;

  const {
    data: statsData,
    isLoading: loadingStats,
    mutate: refetchStats,
    error: statsError,
  } = useSWR<TeamStatsResponse>(
    statsKey,
    () =>
      getTeamStats(leaderTeamId!, {
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      }),
    {
      revalidateOnFocus: false,
    }
  );

  const dateFormatter = useMemo(() => {
    const locale = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  }, [lang]);

  const reportingRangeLabel = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return "—";
    const startDate = dateFormatter.format(new Date(dateRange.startDate));
    const endDate = dateFormatter.format(new Date(dateRange.endDate));
    return `${startDate} — ${endDate}`;
  }, [dateFormatter, dateRange.endDate, dateRange.startDate]);

  const totals = statsData?.teamTotals ?? EMPTY_TOTALS;
  const members = statsData?.members ?? [];

  const handleDateChange = (field: keyof DateRangeState, value: string) => {
    setDateRange((prev) => {
      if (!value) {
        return { ...prev, [field]: value };
      }
      if (field === "startDate" && prev.endDate && value > prev.endDate) {
        return { startDate: value, endDate: value };
      }
      if (field === "endDate" && prev.startDate && value < prev.startDate) {
        return { startDate: value, endDate: value };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleResetRange = () => {
    setDateRange(createDefaultDateRange());
  };

  if (loadingUser && !currentUser) {
    return <ReportsLoadingState />;
  }

  if (!isTeamLead) {
    return (
      <div className="space-y-6">
        <PageHeading lang={lang} />
        <Card>
          <CardContent className="flex flex-col gap-3 py-6">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-300">
              <AlertCircle className="size-5" />
              <div>
                <p className="font-medium">{tr(lang, "reports.noTeamLead")}</p>
                <p className="text-sm text-muted-foreground">{tr(lang, "reports.noTeamLead.helper")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading lang={lang} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="size-5 text-primary" />
            {tr(lang, "reports.filters.dateRange")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{tr(lang, "reports.subtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {tr(lang, "reports.filters.startDate")}
              </label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(event) => handleDateChange("startDate", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {tr(lang, "reports.filters.endDate")}
              </label>
              <Input
                type="date"
                value={dateRange.endDate}
                min={dateRange.startDate}
                onChange={(event) => handleDateChange("endDate", event.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" className="flex-1" onClick={handleResetRange}>
                {tr(lang, "reports.filters.reset")}
              </Button>
              <Button onClick={() => refetchStats()} disabled={loadingStats} className="flex-1">
                <RefreshCw className={`size-4 mr-2 ${loadingStats ? "animate-spin" : ""}`} />
                {tr(lang, "reports.refresh")}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs uppercase text-muted-foreground tracking-wide">
                {tr(lang, "reports.teamLabel")}
              </p>
              <p className="text-base font-semibold">{statsData?.team?.name ?? leaderTeamName ?? "—"}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs uppercase text-muted-foreground tracking-wide">
                {tr(lang, "reports.dateRangeLabel")}
              </p>
              <p className="text-base font-semibold">{reportingRangeLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {statsError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="size-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">{tr(lang, "reports.error")}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchStats()}>
                {tr(lang, "reports.refresh")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tr(lang, "reports.overview.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(["total", ...STATUS_KEYS] as StatusCardKey[]).map((key) => {
                const label =
                  key === "total" ? tr(lang, "reports.overview.total") : tr(lang, `reports.status.${key}`);
                const indicatorClass = STATUS_INDICATORS[key] ?? "text-muted-foreground";
                return (
                  <Card key={key} className="border border-border/70 bg-card shadow-sm">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                        <span>{label}</span>
                        <span className={`${indicatorClass} text-xs font-semibold`}>●</span>
                      </div>
                      <p className={`mt-4 text-3xl font-semibold ${key === "total" ? "text-foreground" : ""}`}>
                        {totals?.[key as keyof TicketStatusTotals] ?? 0}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tr(lang, "reports.members.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <AlertCircle className="size-5" />
              {tr(lang, "reports.members.empty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr(lang, "reports.table.member")}</TableHead>
                    {STATUS_KEYS.map((statusKey) => (
                      <TableHead key={statusKey} className="text-right">
                        {tr(lang, `reports.status.${statusKey}`)}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">{tr(lang, "reports.overview.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((item) => {
                    const member = (item.member ?? {}) as MemberInfo;
                    const fallbackName = [member.firstName, member.lastName].filter(Boolean).join(" ").trim();
                    const fullName =
                      member.fullName ||
                      fallbackName ||
                      member.email ||
                      tr(lang, "ticketDetail.unknownUser");
                    const rowKey = member.id ?? member.email ?? fullName;
                    return (
                      <TableRow key={rowKey}>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">{fullName}</div>
                          {member.email ? (
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          ) : null}
                        </TableCell>
                        {STATUS_KEYS.map((statusKey) => (
                          <TableCell key={statusKey} className="text-right font-medium">
                            {item.stats?.[statusKey] ?? 0}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold">
                          {item.stats?.total ?? 0}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PageHeading({ lang }: { lang: "en" | "hi" | "mr" }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-foreground">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <BarChart3 className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold">{tr(lang, "reports.title")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{tr(lang, "reports.subtitle")}</p>
    </div>
  );
}

function ReportsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

