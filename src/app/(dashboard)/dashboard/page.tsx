'use client';
export const dynamic = 'force-dynamic';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api, adminGetTicketStats, getUserStats, getCurrentUser, getTeamTicketsMinimal } from '@/lib/api';
import { useLanguage } from '@/components/LanguageProvider';
import { tr } from '@/lib/i18n';
// removed charts

const fetcher = (url: string) => api.get(url).then((r) => r.data);

type Greeting = { key: 'morning' | 'afternoon' | 'evening' | 'night'; emoji: string; img: string } | null;

type Overview = {
  totalUsers: number;
  newUsers7d: number;
  complaints: {
    open: number;
    inProgress: number;
    resolved7d: number;
    slaAtRisk: number;
    avgFirstResponseMins?: number;
    avgResolutionHours?: number;
  };
  trend?: Array<{ day: string; intake: number; resolved: number }>;
  topCategories?: Array<{ name: string; count: number }>;
};

/* -------------------- Hooks -------------------- */
function useGreeting(): Greeting {
  const [greeting, setGreeting] = useState<Greeting>(null);
  useEffect(() => {
    const hour = Number(
      new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      }).format(new Date())
    );
    if (hour >= 5 && hour < 11)
      setGreeting({ key: 'morning', emoji: '🌅', img: pickHeaderImage('morning') });
    else if (hour >= 11 && hour < 16)
      setGreeting({ key: 'afternoon', emoji: '🌤️', img: pickHeaderImage('afternoon') });
    else if (hour >= 16 && hour < 21)
      setGreeting({ key: 'evening', emoji: '🌙', img: pickHeaderImage('evening') });
    else setGreeting({ key: 'night', emoji: '✨', img: pickHeaderImage('night') });
  }, []);
  return greeting;
}

function useOverview(isAdmin: boolean) {
  const { data, error, isLoading } = useSWR<Overview>(
    isAdmin ? '/api/stats/overview' : null, 
    fetcher, 
    { revalidateOnFocus: false }
  );
  type UsersCount = { users: unknown[]; pagination?: { totalUsers?: number } };
  const { data: usersData } = useSWR<UsersCount>(
    isAdmin ? ['/api/users', 'count'] : null,
    () => api.get('/api/users', { params: { page: 1, limit: 1 } }).then((r) => r.data),
    { revalidateOnFocus: false }
  );
  // Graceful fallback demo data if backend not ready
  const demo: Overview = useMemo(
    () => ({
      totalUsers: 18234,
      newUsers7d: 312,
      complaints: { open: 1462, inProgress: 538, resolved7d: 1201, slaAtRisk: 84, avgFirstResponseMins: 28, avgResolutionHours: 36 },
      trend: Array.from({ length: 7 }).map((_, i) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        intake: 80 + Math.round(Math.random() * 60),
        resolved: 70 + Math.round(Math.random() * 60),
      })),
      topCategories: [
        { name: 'Water Supply', count: 342 },
        { name: 'Roads & Potholes', count: 289 },
        { name: 'Streetlights', count: 214 },
      ],
    }),
    []
  );
  const merged: Overview = {
    ...(data ?? demo),
    totalUsers: usersData?.pagination?.totalUsers ?? (data ?? demo).totalUsers,
  };
  return { data: merged, error, isLoading };
}

// weather removed

/* -------------------- Ticket stats (admin) -------------------- */
function useTicketStats(isAdmin: boolean) {
  const { data, isLoading } = useSWR(
    isAdmin ? ['tickets-admin-stats'] : null, 
    adminGetTicketStats, 
    { revalidateOnFocus: false }
  );
  const overall = data?.overall ?? {};
  return {
    counts: {
      open: overall.open ?? 0,
      inProgress: overall.inProgress ?? 0,
      resolved: overall.resolved ?? 0,
      closed: overall.closed ?? 0,
    },
    isLoading,
    raw: data,
  } as const;
}

/* -------------------- Quote bank (curated) -------------------- */
const QUOTES = [
  { key: 'serveSimply', fallback: 'Serve simply. Solve steadily. Keep people first.' },
  { key: 'clarityReducesChaos', fallback: 'Clarity reduces chaos. Say what we will do and when.' },
  { key: 'smallIssuesBigTrust', fallback: 'Small resolved issues create big public trust.' },
  { key: 'respectTime', fallback: 'Respect time: acknowledge, act, and update.' },
  { key: 'verifyAtSource', fallback: 'When unsure, verify at source—assumptions are expensive.' },
  { key: 'consistencyBeatsIntensity', fallback: 'Consistency beats intensity. Close one loop at a time.' },
  { key: 'documentDecisions', fallback: 'Document decisions so teams can move without you.' },
  { key: 'urgencyVsPatience', fallback: 'Urgency for people, patience for problems.' },
  { key: 'measureWhatMatters', fallback: 'Measure what matters: response, resolution, and care.' },
  { key: 'trackPromises', fallback: 'If it’s promised, track it. If it’s tracked, keep it.' },
  { key: 'visibleOwnership', fallback: 'Ownership is visible: name, timestamp, next step.' },
  { key: 'fewerClicks', fallback: 'Fewer clicks for citizens; fewer doubts for teams.' },
  { key: 'progressOverPerfection', fallback: 'Progress over perfection. Ship a fix today.' },
  { key: 'politenessReturns', fallback: 'Politeness costs nothing, and returns everything.' },
  { key: 'trustworthyDashboard', fallback: 'The best dashboard is a trustworthy update.' },
  { key: 'dataGuides', fallback: 'Data guides; field confirms.' },
  { key: 'escalateEarly', fallback: 'Escalate early; surprises late help no one.' },
  { key: 'alignOutcome', fallback: 'Align on outcome, then adjust the path.' },
  { key: 'writeClearly', fallback: 'Write to be understood on the first read.' },
  { key: 'relayService', fallback: 'Public service is a relay—handoff cleanly.' },
] as const;

type QuoteEntry = (typeof QUOTES)[number];

function useQuote(): QuoteEntry {
  const [quote, setQuote] = useState<QuoteEntry>(QUOTES[0]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = 'ps_quote_pool_v2';
    const raw = window.localStorage.getItem(key);
    let pool: number[] = [];
    try { pool = raw ? (JSON.parse(raw) as number[]) : []; } catch {}
    if (!Array.isArray(pool) || pool.length === 0 || pool.some((n) => n >= QUOTES.length)) {
      pool = [...Array(QUOTES.length).keys()];
    }
    const idx = Math.floor(Math.random() * pool.length);
    const pickIndex = pool.splice(idx, 1)[0];
    window.localStorage.setItem(key, JSON.stringify(pool));
    setQuote(QUOTES[pickIndex]);
  }, []);
  return quote;
}

// weather helpers removed

const headerArt = {
  morning: [
    '/morning%201.png',
    '/morning2.png',
  ],
  night: [
    '/Night1.png',
    '/Night2.png',
  ],
  evening: [
    '/evening1.png',
    '/evening2.png',
  ],
  afternoon: [
    '/afternoon1.png',
    '/afternoon2.png',
  ],
} as const;

function pickHeaderImage(category: keyof typeof headerArt): string {
  const key = `ps_img_pool_${category}_v1`;
  if (typeof window === 'undefined') return headerArt[category][0];
  let pool: number[] = [];
  try { const raw = window.localStorage.getItem(key); pool = raw ? (JSON.parse(raw) as number[]) : []; } catch {}
  if (!Array.isArray(pool) || pool.length === 0 || pool.some((n) => n >= headerArt[category].length)) {
    pool = [...Array(headerArt[category].length).keys()];
  }
  const idx = Math.floor(Math.random() * pool.length);
  const pickIndex = pool.splice(idx, 1)[0];
  window.localStorage.setItem(key, JSON.stringify(pool));
  return headerArt[category][pickIndex];
}

function formatDashboardDate() {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const parts = formatter.formatToParts(new Date());
  const lookup = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';

  const day = lookup('day');
  const month = lookup('month');
  const year = lookup('year');
  const weekday = lookup('weekday');
  const hour = lookup('hour');
  const minute = lookup('minute');
  const dayPeriod = lookup('dayPeriod');

  return `${day} ${month} ${year}, ${weekday}, ${hour}:${minute} ${dayPeriod}`.replace(/\s+/g, ' ').trim();
}

/* -------------------- Page -------------------- */
export default function DashboardPage() {
  const { lang } = useLanguage();
  const { data: currentUser, isLoading: loadingUser } = useSWR('current-user', getCurrentUser);
  const user = currentUser as { firstName?: string; role?: string; teams?: Array<{ id: string; isLeader: boolean }> } | undefined;
  const userRole = user?.role || 'user';
  const isStaff = userRole === 'staff';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isTeamLead = !!user?.teams?.some((t) => t.isLeader);

  const greeting = useGreeting();
  const quote = useQuote();
  
  // Admin-specific data
  const { data: overview, isLoading: loadingOverview } = useOverview(isAdmin);
  const { counts: ticketCounts, isLoading: loadingTickets, raw: rawTicketStats } = useTicketStats(isAdmin);
  
  // Staff-specific data
  const { data: teamTickets, isLoading: loadingTeamTickets } = useSWR(
    isStaff ? 'team-tickets' : null,
    () => getTeamTicketsMinimal({ page: 1, limit: 20 }),
    { revalidateOnFocus: false }
  );
  // Stats are already fetched by useTicketStats

  // Avoid hydration mismatch: compute on client after mount
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setToday(formatDashboardDate());
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
      <div className="grid gap-6 xl:grid-cols-3 items-stretch">
      {/* HEADER */}
      <Card className="xl:col-span-2 overflow-hidden border-0 bg-transparent shadow-none h-full">
        <AnimatedGradientHeader>
          <div className="grid gap-6 sm:grid-cols-[1.2fr_1fr] items-center">
            <div className="text-primary-foreground space-y-4">
              <div className="text-xl sm:text-2xl font-semibold tracking-tight">
                {loadingUser || !greeting ? (
                  <Skeleton className="h-7 w-64" />
                ) : (
                  `${tr(lang, 'dashboard.greeting.' + greeting.key)}, ${
                    user?.firstName ?? tr(lang, 'dashboard.greeting.there')
                  }! ${greeting.emoji}`
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20">
                  <span suppressHydrationWarning>{today ?? ''}</span>
                </Badge>
              </div>

              <p className="opacity-90 text-sm leading-relaxed max-w-prose">
                {tr(lang, `dashboard.quotes.${quote.key}`) ?? quote.fallback}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {isAdmin && (
                  <Button size="sm" variant="secondary" asChild>
                    <Link href="/complaints">{tr(lang, 'dashboard.hero.viewOpenComplaints')}</Link>
                  </Button>
                )}
                {isStaff && (
                  <Button size="sm" variant="secondary" asChild>
                    <Link href="/my-tickets">{tr(lang, 'dashboard.hero.viewMyTickets')}</Link>
                  </Button>
                )}
                {isAdmin && (
                  <Button size="sm" variant="ghost" className="text-inherit" asChild>
                    <Link href="/agency-contacts">{tr(lang, 'dashboard.hero.agencyContacts')}</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-lg overflow-hidden shadow-md ring-1 ring-foreground/20">
                {greeting ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={greeting.img} alt="Time of day" className="h-36 w-full object-cover sm:h-40 md:h-44" />
                ) : (
                  <Skeleton className="h-36 w-full sm:h-40 md:h-44" />
                )}
              </div>
            </div>
          </div>
        </AnimatedGradientHeader>
      </Card>

      {/* Role-based snapshot */}
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle>
            {isAdmin ? tr(lang, 'dashboard.snapshot.admin.title') : tr(lang, 'dashboard.snapshot.staff.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 flex-1">
          {isAdmin && (loadingTickets ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-10 rounded-md" />
          </div>
              ))}
              <Skeleton className="h-3 w-64" />
          </div>
          ) : (
            <>
              <RowStat label={tr(lang, 'dashboard.snapshot.admin.total')} value={rawTicketStats?.overall?.total ?? 0} badgeVariant="secondary" />
              <RowStat label={tr(lang, 'dashboard.snapshot.admin.open')} value={ticketCounts.open} badgeVariant="default" />
              <RowStat label={tr(lang, 'dashboard.snapshot.admin.inProgress')} value={ticketCounts.inProgress} badgeVariant="secondary" />
              <RowStat label={tr(lang, 'dashboard.snapshot.admin.resolved')} value={ticketCounts.resolved} badgeVariant="outline" />
              <RowStat label={tr(lang, 'dashboard.snapshot.admin.closed')} value={ticketCounts.closed} badgeVariant="outline" />
              <div className="pt-1 text-xs text-muted-foreground">
                {tr(lang, 'dashboard.snapshot.admin.highPriority')}: {rawTicketStats?.byPriority?.find(p => p._id === 'high')?.count ?? 0}
              </div>
            </>
          ))}
          
          {isStaff && (loadingTeamTickets ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-10 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {teamTickets?.tickets ? (
                <>
                  <RowStat label={tr(lang, 'dashboard.snapshot.staff.totalAssigned')} value={teamTickets.tickets.length} badgeVariant="secondary" />
                  <RowStat 
                    label={tr(lang, 'dashboard.snapshot.staff.open')} 
                    value={teamTickets.tickets.filter(t => t.status === 'open').length} 
                    badgeVariant="default" 
                  />
                  <RowStat 
                    label={tr(lang, 'dashboard.snapshot.staff.inProgress')} 
                    value={teamTickets.tickets.filter(t => t.status === 'in_progress').length} 
                    badgeVariant="secondary" 
                  />
                  <RowStat 
                    label={tr(lang, 'dashboard.snapshot.staff.completed')} 
                    value={teamTickets.tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length} 
                    badgeVariant="outline" 
                  />
                </>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  {tr(lang, 'dashboard.snapshot.staff.empty')}
                </div>
              )}
            </>
          ))}
        </CardContent>
      </Card>

      {/* Role-based KPI STRIP */}
      {isAdmin && (
        <div className="grid gap-3 xl:col-span-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatsTile label={tr(lang, 'dashboard.kpi.admin.totalUsers')} value={overview?.totalUsers} loading={loadingOverview} />
          <StatsTile label={tr(lang, 'dashboard.kpi.admin.newThisWeek')} value={overview?.totalUsers} loading={loadingOverview} tone="alt" />
          <StatsTile label={tr(lang, 'dashboard.kpi.admin.openComplaints')} value={ticketCounts.open} loading={loadingTickets} />
          <StatsTile label={tr(lang, 'dashboard.kpi.admin.highPriority')} value={rawTicketStats?.byPriority?.find(p => p._id === 'high')?.count ?? 0} loading={loadingTickets} tone="warn" />
        </div>
      )}
      
      {isStaff && teamTickets && (
        <div className="grid gap-3 xl:col-span-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatsTile
            label={tr(lang, 'dashboard.kpi.staff.myTickets')}
            value={teamTickets.tickets.length}
            loading={loadingTeamTickets}
          />
          <StatsTile
            label={tr(lang, 'dashboard.kpi.staff.open')}
            value={teamTickets.tickets.filter(t => t.status === 'open').length}
            loading={loadingTeamTickets}
            tone="alt"
          />
          <StatsTile
            label={tr(lang, 'dashboard.kpi.staff.assigned')}
            value={teamTickets.tickets.filter(t => t.status === 'assigned').length}
            loading={loadingTeamTickets}
          />
          <StatsTile
            label={tr(lang, 'dashboard.kpi.staff.inProgress')}
            value={teamTickets.tickets.filter(t => t.status === 'in_progress').length}
            loading={loadingTeamTickets}
          />
          <StatsTile
            label={tr(lang, 'dashboard.kpi.staff.completed')}
            value={teamTickets.tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
            loading={loadingTeamTickets}
            tone="alt"
          />
        </div>
      )}

      {/* trends removed */}

      {/* Role-based Quick links */}
      <div className="xl:col-span-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isAdmin && (
          <>
            <GradientMini title={tr(lang, 'dashboard.quick.admin.checkComplaints')} href="/complaints" />
            <GradientMini title={tr(lang, 'dashboard.quick.admin.manageTeams')} href="/teams" variant="alt" />
            <GradientMini title={tr(lang, 'dashboard.quick.admin.browseContacts')} href="/agency-contacts" variant="alt" />
            <GradientMini title={tr(lang, 'dashboard.quick.admin.viewReports')} variant="alt" disabled />
          </>
        )}
        {isStaff && (
          <>
            <GradientMini title={tr(lang, 'dashboard.quick.staff.myTickets')} href="/my-tickets" />
            {isTeamLead && <GradientMini title={tr(lang, 'dashboard.quick.staff.teamMembers')} href="/team-members" variant="alt" />}
          </>
        )}
      </div>

      {/* Styles */}
      <div className="xl:col-span-3 mt-8 text-center pb-4">
        <p className="text-xs text-muted-foreground font-medium opacity-70">Powered by Nyx Solutions</p>
      </div>

      <style jsx global>{`
        .animated-gradient-surface { position: relative; border-radius: 0.75rem; background-image: linear-gradient(135deg, var(--grad-from), var(--grad-to)); background-size: 100% 100%; }
        /* Subtle grain that remains visible in light and dark */
        .gradient-noise::after { content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit; background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,.06) 1px, transparent 1px); background-size: 12px 12px; opacity: .14; mix-blend-mode: soft-light; }
        .dark .gradient-noise::after { background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.14) 1px, transparent 1px); opacity: .14; mix-blend-mode: overlay; }
      `}</style>
    </div>
  );
}

/* -------------------- Subcomponents -------------------- */
function AnimatedGradientHeader({ children }: { children: React.ReactNode }) {
  const style = {
    // Subtle gradient tuned against foreground readability
    ['--grad-from' as unknown as string]: 'color-mix(in oklch, var(--primary) 70%, oklch(1 0 0))',
    ['--grad-to' as unknown as string]: 'color-mix(in oklch, var(--accent) 35%, var(--primary))',
  } as React.CSSProperties;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div
        style={style}
        className="animated-gradient-surface gradient-noise p-6 sm:p-8 text-primary-foreground"
      >
        {children}
      </div>
    </motion.div>
  );
}

function GradientMini({ title, href, variant = 'base', disabled = false }: { title: string; href?: string; variant?: 'base' | 'alt'; disabled?: boolean }) {
  const variantClasses =
    variant === 'base'
      ? 'border-primary/40 bg-primary/5 hover:bg-primary/10 focus-visible:ring-primary/40'
      : 'border-accent/40 bg-accent/5 hover:bg-accent/10 focus-visible:ring-accent/40';

  if (disabled) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-4 flex items-center justify-between gap-4 cursor-not-allowed opacity-80">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">Coming soon</span>
      </div>
    );
  }

  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`relative block rounded-xl border px-4 py-4 text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${variantClasses}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">{title}</span>
      </div>
    </motion.a>
  );
}

function StatsTile({ label, value, loading, tone = 'base' }: { label: string; value?: number; loading?: boolean; tone?: 'base' | 'alt' | 'warn' }) {
  const style =
    tone === 'base'
      ? ({ ['--grad-from' as unknown as string]: 'var(--primary)', ['--grad-to' as unknown as string]: 'color-mix(in oklch, var(--primary) 40%, var(--accent))' } as React.CSSProperties)
      : tone === 'alt'
      ? ({ ['--grad-from' as unknown as string]: 'var(--accent)', ['--grad-to' as unknown as string]: 'color-mix(in oklch, var(--accent) 40%, var(--primary))' } as React.CSSProperties)
      : ({ ['--grad-from' as unknown as string]: 'var(--destructive)', ['--grad-to' as unknown as string]: 'color-mix(in oklch, var(--destructive) 30%, var(--primary))' } as React.CSSProperties);

  return (
    <div className="rounded-xl p-[1px]" style={style}>
      <div className="bg-background rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="h-1.5 w-16 rounded-full animated-gradient-surface" style={style} />
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">
          {loading ? <Skeleton className="h-8 w-20" /> : value?.toLocaleString('en-IN') ?? '—'}
        </div>
      </div>
    </div>
  );
}

type RowStatProps = {
  label: string;
  value?: number;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
};

function RowStat({ label, value, badgeVariant = 'default' }: RowStatProps) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <Badge variant={badgeVariant}>{typeof value === 'number' ? value.toLocaleString('en-IN') : '—'}</Badge>
    </div>
  );
}
