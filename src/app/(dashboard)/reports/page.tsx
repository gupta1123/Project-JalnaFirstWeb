"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageProvider";
import { tr, type Lang } from "@/lib/i18n";
import { getCurrentUser, getAdminTeamStats } from "@/lib/api";
import type { AdminTeamStatsResponse, TicketStatusTotals, TeamMemberStat } from "@/lib/types";
import { AlertCircle, BarChart3, RefreshCw, TrendingUp, Activity, CheckCircle2, FileText, MapPin, ChevronDown } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Label
} from "recharts";

// Color Palette - Professional & Clean
const COLORS = {
  primary: "#3b82f6", // Blue-500
  success: "#22c55e", // Green-500
  warning: "#f59e0b", // Amber-500
  danger: "#ef4444", // Red-500
  purple: "#a855f7", // Purple-500
  gray: "#94a3b8",   // Slate-400
  dark: "#1e293b",   // Slate-800
  muted: "#e2e8f0"   // Slate-200
};

const STATUS_COLORS: Record<string, string> = {
  open: COLORS.danger,
  assigned: COLORS.purple,
  in_progress: COLORS.warning,
  resolved: COLORS.success,
  closed: COLORS.dark,
};

type DateRangeState = {
  startDate: string;
  endDate: string;
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

const STATUS_KEYS = ["open", "assigned", "in_progress", "resolved", "closed"] as const;
type StatusKey = typeof STATUS_KEYS[number];
type StatusSummary = Record<StatusKey, number>;

const TICKET_TOTAL_FIELDS: Array<keyof TicketStatusTotals> = [
  "open",
  "assigned",
  "in_progress",
  "pending_user",
  "pending_admin",
  "resolved",
  "closed",
];

const createStatusSummary = (): StatusSummary => {
  const summary = {} as StatusSummary;
  STATUS_KEYS.forEach((key) => {
    summary[key] = 0;
  });
  return summary;
};

const createTicketTotals = (): TicketStatusTotals => ({
  open: 0,
  assigned: 0,
  in_progress: 0,
  pending_user: 0,
  pending_admin: 0,
  resolved: 0,
  closed: 0,
  total: 0,
});

export default function ReportsPage() {
  const { lang } = useLanguage();
  const { data: currentUser, isLoading: loadingUser } = useSWR("current-user", getCurrentUser, {
    revalidateOnFocus: false,
  });
  
  // Hydration check for Recharts
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [dateRange, setDateRange] = useState<DateRangeState>(createDefaultDateRange);
  const [selectedTeamId, setSelectedTeamId] = useState<string | "all">("all");
  const [teamSearch, setTeamSearch] = useState("");
  const [selectedAreaKey, setSelectedAreaKey] = useState<string>("all");
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";

  const statsKey = isAdmin
    ? ["admin-team-stats", dateRange.startDate, dateRange.endDate]
    : null;

  const {
    data: statsData,
    isLoading: loadingStats,
    mutate: refetchStats,
    error: statsError,
  } = useSWR<AdminTeamStatsResponse>(
    statsKey,
    () =>
      getAdminTeamStats({
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      }),
    {
      revalidateOnFocus: false,
    }
  );

  // Metrics Calculation
  const selectedData = useMemo(() => {
    const baseTotals = statsData?.overallTotals;
    const teamData = statsData?.teams.find(t => t.team.id === selectedTeamId);
    const unassignedLabel = tr(lang, "reports.table.unassigned");
    const unassignedBacklogLabel = tr(lang, "reports.table.unassignedBacklog");
    const unknownLabel = tr(lang, "reports.table.unknown");
    
    const totals = selectedTeamId === "all" ? baseTotals : teamData?.teamStats;
    
    if (!totals) return null;

    const total = totals.total || 0;
    const resolved = (totals.resolved || 0) + (totals.closed || 0);
    const inProgress = totals.in_progress || 0;

    // Chart Data: Status Distribution (Donut)
    const pieData = STATUS_KEYS.map(key => ({
      name: tr(lang, `reports.status.${key}`),
      value: totals[key as keyof TicketStatusTotals] || 0,
      color: STATUS_COLORS[key]
    })).filter(item => item.value > 0);

    // Chart Data: Comparisons (Grouped Bar: Open vs WIP vs Resolved)
    let barData = [];
    let membersList: TeamMemberStat[] = teamData?.members ?? [];

    if (selectedTeamId === "all") {
      // Compare Teams - show all statuses
      barData = (statsData?.teams || [])
        .map(t => ({
          name: t.team.name,
          open: t.teamStats.open || 0,
          assigned: t.teamStats.assigned || 0,
          in_progress: t.teamStats.in_progress || 0,
          resolved: t.teamStats.resolved || 0,
          closed: t.teamStats.closed || 0,
          total: t.teamStats.total || 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6); // Top 6 teams
    } else {
      // Calculate Unassigned Tickets
      const memberTotals = membersList.reduce<StatusSummary>((acc, m) => {
        STATUS_KEYS.forEach((key) => {
          acc[key] += m.stats[key] || 0;
        });
        return acc;
      }, createStatusSummary());

      const unassignedStats = STATUS_KEYS.reduce<StatusSummary>((acc, key) => {
        acc[key] = Math.max(0, (totals[key] || 0) - (memberTotals[key] || 0));
        return acc;
      }, createStatusSummary());

      const hasUnassigned = Object.values(unassignedStats).some((value) => value > 0);

      // If there are unassigned tickets, add a virtual member to the list
      if (hasUnassigned) {
        // Create a copy to avoid mutating state directly if it came from SWR cache (though we are in useMemo)
        const unassignedTotal = Object.values(unassignedStats).reduce((sum, value) => sum + value, 0);
        membersList = [
          ...membersList,
          {
            member: {
              id: "unassigned",
              firstName: unassignedLabel,
              lastName: "",
              email: "",
              role: "system",
              fullName: unassignedLabel
            },
            stats: {
              open: unassignedStats.open,
              assigned: unassignedStats.assigned,
              in_progress: unassignedStats.in_progress,
              pending_user: 0,
              pending_admin: 0,
              resolved: unassignedStats.resolved,
              closed: unassignedStats.closed,
              total: unassignedTotal
            }
          }
        ];
      }

      // Compare Members (including unassigned) - show all statuses
      barData = membersList
        .map(m => {
           const fallbackName = m.member.email || unknownLabel;
           const name =
             m.member.id === "unassigned"
               ? unassignedLabel
               : ([m.member.firstName, m.member.lastName].filter(Boolean).join(" ") || fallbackName);
           return {
             name: name,
             open: m.stats.open || 0,
             assigned: m.stats.assigned || 0,
             in_progress: m.stats.in_progress || 0,
             resolved: m.stats.resolved || 0,
             closed: m.stats.closed || 0,
             total: m.stats.total || 0
           };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 10); // Top 10 items
    }

    const sortedMembers = [...membersList].sort((a, b) => {
      const isUnassignedA = a.member.id === "unassigned";
      const isUnassignedB = b.member.id === "unassigned";
      if (isUnassignedA && !isUnassignedB) return 1;
      if (!isUnassignedA && isUnassignedB) return -1;

      const nameA = (a.member.fullName || `${a.member.firstName ?? ""} ${a.member.lastName ?? ""}` || a.member.email || "").trim().toLowerCase();
      const nameB = (b.member.fullName || `${b.member.firstName ?? ""} ${b.member.lastName ?? ""}` || b.member.email || "").trim().toLowerCase();

      if (nameA && nameB) return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
      if (nameA) return -1;
      if (nameB) return 1;
      return 0;
    });

    return {
      total,
      resolved,
      inProgress,
      pieData,
      barData,
      members: sortedMembers
    };
  }, [statsData, selectedTeamId, lang]);

  const sortedTeamsForTable = useMemo(() => {
    if (!statsData?.teams) return [];
    return [...statsData.teams].sort((a, b) => {
      const nameA = a.team.name?.trim().toLowerCase() ?? "";
      const nameB = b.team.name?.trim().toLowerCase() ?? "";
      if (nameA && nameB) return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
      if (nameA) return -1;
      if (nameB) return 1;
      return 0;
    });
  }, [statsData?.teams]);

  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) return sortedTeamsForTable;
    const query = teamSearch.trim().toLowerCase();
    return sortedTeamsForTable.filter((team) => team.team.name?.toLowerCase().includes(query));
  }, [teamSearch, sortedTeamsForTable]);

  // Teams to display - show only 3 if not expanded and not searching
  const displayTeams = useMemo(() => {
    const hasSearch = teamSearch.trim().length > 0;
    if (hasSearch || showAllTeams) {
      return filteredTeams;
    }
    return filteredTeams.slice(0, 3);
  }, [filteredTeams, teamSearch, showAllTeams]);

  const hasMoreTeams = filteredTeams.length > 3 && !teamSearch.trim();

  const selectedTeamLabel = useMemo(() => {
    if (selectedTeamId === "all") return tr(lang, "reports.overview.title");
    const team = statsData?.teams.find(t => t.team.id === selectedTeamId);
    return team?.team.name || tr(lang, "reports.teamLabel");
  }, [selectedTeamId, statsData, lang]);

  const handleDateChange = (field: keyof DateRangeState, value: string) => {
    setDateRange((prev) => {
      const newState = { ...prev, [field]: value };
      return newState;
    });
  };

  const handleResetRange = () => {
    setDateRange(createDefaultDateRange());
  };

  if (loadingUser && !currentUser) {
    return <ReportsLoadingState />;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeading lang={lang} />
        <Card>
          <CardContent className="flex flex-col gap-3 py-6">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-300">
              <AlertCircle className="size-5" />
              <div>
                <p className="font-medium">{tr(lang, "reports.adminOnly")}</p>
                <p className="text-sm text-muted-foreground">{tr(lang, "reports.adminOnly.helper")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
           <h1 className="text-2xl font-semibold flex items-center gap-2">
             <BarChart3 className="size-6 text-primary" />
             {tr(lang, "reports.title")}
           </h1>
           <p className="text-muted-foreground mt-1">{tr(lang, "reports.subtitle")}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:items-center sm:justify-end">
           <div className="w-full sm:w-auto sm:min-w-[260px] sm:max-w-[360px]">
            <Select 
              value={selectedTeamId} 
              onValueChange={setSelectedTeamId}
              open={selectOpen}
              onOpenChange={(open) => {
                setSelectOpen(open);
                if (!open) {
                  setShowAllTeams(false);
                  setTeamSearch("");
                }
              }}
            >
              <SelectTrigger
                className="w-full justify-between text-left"
                title={selectedTeamLabel}
              >
                <SelectValue
                  placeholder={tr(lang, "reports.teamLabel")}
                  className="truncate"
                />
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={8} avoidCollisions={false}>
                <div className="px-2 pb-1">
                  <Input
                    autoFocus
                    value={teamSearch}
                    onChange={(e) => {
                      setTeamSearch(e.target.value);
                      if (e.target.value.trim()) {
                        setShowAllTeams(true);
                      }
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder={tr(lang, "reports.teamSearchPlaceholder")}
                    className="h-8"
                  />
                </div>
                <SelectItem value="all">{tr(lang, "reports.overview.title")}</SelectItem>
                {displayTeams.length > 0 ? (
                  <>
                    {displayTeams.map((t) => (
                      <SelectItem key={t.team.id} value={t.team.id}>
                        {t.team.name}
                      </SelectItem>
                    ))}
                    {hasMoreTeams && !showAllTeams && (
                      <div 
                        className="px-2 py-2 text-sm text-primary cursor-pointer hover:bg-accent rounded-sm flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowAllTeams(true);
                        }}
                      >
                        <ChevronDown className="size-4" />
                        {tr(lang, "reports.teamViewMore")} ({filteredTeams.length - 3})
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    {tr(lang, "reports.teamSearchEmpty")}
                  </div>
                )}
              </SelectContent>
            </Select>
           </div>
           <div className="flex gap-2 bg-background border rounded-md p-1">
             <Input 
                type="date" 
                className="border-0 h-8 w-[130px] focus-visible:ring-0" 
                value={dateRange.startDate}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
             />
             <span className="text-muted-foreground self-center">-</span>
             <Input 
                type="date" 
                className="border-0 h-8 w-[130px] focus-visible:ring-0"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
             />
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetchStats()}>
               <RefreshCw className={`size-4 ${loadingStats ? "animate-spin" : ""}`} />
             </Button>
           </div>
        </div>
      </div>

      {loadingStats || !selectedData ? (
        <ReportsLoadingState />
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard 
              title={tr(lang, "reports.overview.total")}
              value={selectedData.total}
              icon={<TrendingUp className="size-4" />}
              description={tr(lang, "reports.metrics.totalHelper")}
              color="text-primary"
            />
            <MetricCard 
              title={tr(lang, "reports.metrics.resolved")}
              value={selectedData.resolved}
              icon={<CheckCircle2 className="size-4" />}
              description={tr(lang, "reports.metrics.resolvedHelper")}
              color="text-green-500"
            />
            <MetricCard 
              title={tr(lang, "reports.metrics.inProgress")}
              value={selectedData.inProgress}
              icon={<Activity className="size-4" />}
              description={tr(lang, "reports.metrics.inProgressHelper")}
              color="text-amber-500"
            />
          </div>

          {/* Tabs View */}
          <Tabs defaultValue="charts" className="space-y-6">
            <div className="flex items-center justify-end">
              <TabsList>
                <TabsTrigger value="charts" className="flex items-center gap-2">
                  <BarChart3 className="size-4" />
                  {tr(lang, "reports.tabs.charts")}
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <FileText className="size-4" />
                  {tr(lang, "reports.tabs.table")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="charts" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2 h-[420px]">
                 {/* Donut Chart - Status Distribution */}
                 <Card className="flex flex-col">
                   <CardHeader>
                     <CardTitle className="text-base">{tr(lang, "reports.charts.statusDistribution")}</CardTitle>
                     <CardDescription>{tr(lang, "reports.charts.statusDescription")}</CardDescription>
                   </CardHeader>
                   <CardContent className="flex-1 min-h-0 relative">
                     {isMounted && selectedData.pieData.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={selectedData.pieData}
                             cx="50%"
                             cy="50%"
                             innerRadius={80}
                             outerRadius={110}
                             paddingAngle={2}
                             dataKey="value"
                             stroke="none"
                           >
                             {selectedData.pieData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                             <Label
                               value={selectedData.total}
                               position="center"
                               className="fill-foreground text-3xl font-bold"
                             />
                           </Pie>
                           <Tooltip 
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                              itemStyle={{ color: '#64748b' }}
                           />
                           <Legend 
                              verticalAlign="middle" 
                              align="right"
                              layout="vertical"
                              iconType="circle"
                              iconSize={8}
                              wrapperStyle={{ paddingLeft: '20px' }}
                           />
                         </PieChart>
                       </ResponsiveContainer>
                     ) : (
                       <EmptyState lang={lang} />
                     )}
                   </CardContent>
                 </Card>

                 {/* Grouped Bar Chart - Performance Matrix */}
                 <Card className="flex flex-col">
                   <CardHeader>
                     <CardTitle className="text-base">
                       {selectedTeamId === "all" ? tr(lang, "reports.charts.volumeByTeam") : tr(lang, "reports.charts.volumeByMember")}
                     </CardTitle>
                     <CardDescription>
                       {tr(lang, "reports.charts.performanceDescription")}
                     </CardDescription>
                   </CardHeader>
                   <CardContent className="flex-1 min-h-0">
                     {isMounted && selectedData.barData.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart 
                            data={selectedData.barData} 
                            layout="vertical" 
                            margin={{ left: 40, right: 20, top: 10, bottom: 10 }}
                            barGap={4}
                          >
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.muted} />
                           <XAxis type="number" hide />
                           <YAxis 
                              type="category" 
                              dataKey="name" 
                              width={120} 
                              tick={{ fontSize: 12, fill: '#64748b' }} 
                              axisLine={false}
                              tickLine={false}
                           />
                           <Tooltip 
                              cursor={{fill: 'transparent'}}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                           />
                           <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} height={STATUS_KEYS.length * 12} />
                           
                           {STATUS_KEYS.map((statusKey) => (
                             <Bar 
                               key={statusKey}
                               dataKey={statusKey} 
                               name={tr(lang, `reports.status.${statusKey}`)} 
                               fill={STATUS_COLORS[statusKey]} 
                               radius={[0, 4, 4, 0]} 
                               barSize={8} 
                             />
                           ))}
                         </BarChart>
                       </ResponsiveContainer>
                     ) : (
                       <EmptyState lang={lang} />
                     )}
                   </CardContent>
                 </Card>
              </div>
            </TabsContent>

            <TabsContent value="table">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {selectedTeamId === "all" ? tr(lang, "reports.teams.title") : tr(lang, "reports.members.title")}
                  </CardTitle>
                  <CardDescription>
                    {tr(lang, "reports.table.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">{selectedTeamId === "all" ? tr(lang, "reports.teamLabel") : tr(lang, "reports.table.member")}</TableHead>
                          {STATUS_KEYS.map((key) => (
                            <TableHead key={key} className="text-right capitalize whitespace-nowrap">
                              {tr(lang, `reports.status.${key}`)}
                            </TableHead>
                          ))}
                          <TableHead className="text-right font-bold">{tr(lang, "reports.overview.total")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTeamId === "all" ? (
                          sortedTeamsForTable.map((t) => (
                            <TableRow key={t.team.id}>
                              <TableCell className="font-medium">{t.team.name}</TableCell>
                              {STATUS_KEYS.map((key) => (
                                <TableCell key={key} className="text-right text-muted-foreground">
                                  {t.teamStats[key] || 0}
                                </TableCell>
                              ))}
                              <TableCell className="text-right font-bold">{t.teamStats.total}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          selectedData.members.map((m) => {
                            const isUnassigned = m.member.id === "unassigned";
                            const displayName = [m.member.firstName, m.member.lastName].filter(Boolean).join(" ") || m.member.email || tr(lang, "reports.table.unknown");
                            const name = isUnassigned ? tr(lang, "reports.table.unassignedBacklog") : displayName;
                            return (
                              <TableRow key={m.member.id} className={isUnassigned ? "bg-muted/30" : ""}>
                                <TableCell className="font-medium">
                                  {name}
                                  {m.member.isLeader && <Badge variant="outline" className="ml-2 text-[10px]">{tr(lang, "reports.teamLead")}</Badge>}
                                  {isUnassigned && <Badge variant="secondary" className="ml-2 text-[10px]">{tr(lang, "reports.table.systemBadge")}</Badge>}
                                </TableCell>
                                {STATUS_KEYS.map((key) => (
                                  <TableCell key={key} className="text-right text-muted-foreground">
                                    {m.stats[key] || 0}
                                  </TableCell>
                                ))}
                                <TableCell className="text-right font-bold">{m.stats.total}</TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: number | string;
  icon: ReactNode;
  description: string;
  color?: string;
};

function MetricCard({ title, value, icon, description, color = "" }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-2 bg-muted rounded-full ${color}`}>{icon}</div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-bold">{value}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ lang }: { lang: Lang }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {tr(lang, "reports.empty.noData")}
    </div>
  );
}

function PageHeading({ lang }: { lang: Lang }) {
  // Simplified heading component just for the admin check state
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold">{tr(lang, "reports.title")}</h1>
      <p className="text-sm text-muted-foreground">{tr(lang, "reports.subtitle")}</p>
    </div>
  );
}

function ReportsLoadingState() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2 h-[400px]">
        <Skeleton className="h-full rounded-xl" />
        <Skeleton className="h-full rounded-xl" />
      </div>
    </div>
  );
}
