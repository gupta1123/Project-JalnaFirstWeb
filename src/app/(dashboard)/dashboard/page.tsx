'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
// removed charts

const fetcher = (url: string) => api.get(url).then((r) => r.data);

type Greeting = { title: string; emoji: string; img: string } | null;

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
      setGreeting({ title: 'Good morning', emoji: '🌅', img: pickHeaderImage('morning') });
    else if (hour >= 11 && hour < 16)
      setGreeting({ title: 'Good afternoon', emoji: '🌤️', img: pickHeaderImage('afternoon') });
    else if (hour >= 16 && hour < 21)
      setGreeting({ title: 'Good evening', emoji: '🌙', img: pickHeaderImage('evening') });
    else setGreeting({ title: 'Hello', emoji: '✨', img: pickHeaderImage('night') });
  }, []);
  return greeting;
}

function useOverview() {
  const { data, error, isLoading } = useSWR<Overview>('/api/stats/overview', fetcher, { revalidateOnFocus: false });
  type UsersCount = { users: unknown[]; pagination?: { totalUsers?: number } };
  const { data: usersData } = useSWR<UsersCount>(
    ['/api/users', 'count'],
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

/* -------------------- Quote bank (curated) -------------------- */
const QUOTES: string[] = [
  'Serve simply. Solve steadily. Keep people first.',
  'Clarity reduces chaos. Say what we will do and when.',
  'Small resolved issues create big public trust.',
  'Respect time: acknowledge, act, and update.',
  'When unsure, verify at source—assumptions are expensive.',
  'Consistency beats intensity. Close one loop at a time.',
  'Document decisions so teams can move without you.',
  'Urgency for people, patience for problems.',
  'Measure what matters: response, resolution, and care.',
  'If it’s promised, track it. If it’s tracked, keep it.',
  'Ownership is visible: name, timestamp, next step.',
  'Fewer clicks for citizens; fewer doubts for teams.',
  'Progress over perfection. Ship a fix today.',
  'Politeness costs nothing, and returns everything.',
  'The best dashboard is a trustworthy update.',
  'Data guides; field confirms.',
  'Escalate early; surprises late help no one.',
  'Align on outcome, then adjust the path.',
  'Write to be understood on the first read.',
  'Public service is a relay—handoff cleanly.',
];

function useQuote(): string {
  const [quote, setQuote] = useState<string>(QUOTES[0]);
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

/* -------------------- Page -------------------- */
export default function DashboardPage() {
  const { data: me, isLoading: loadingUser } = useSWR('/api/users/me', fetcher);
  const user = me?.user as { firstName?: string } | undefined;

  const greeting = useGreeting();
  const quote = useQuote();
  const { data: overview, isLoading: loadingOverview } = useOverview();

  const today = useMemo(() =>
    new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date()),
  []);

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
                  `${greeting.title}, ${user?.firstName ?? 'there'}! ${greeting.emoji}`
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary" className="bg-foreground/10 text-inherit border-foreground/20">{today}</Badge>
              </div>

              <p className="opacity-90 text-sm leading-relaxed max-w-prose">{quote}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="secondary" asChild>
                  <Link href="/complaints">View Open Complaints</Link>
                </Button>
                <Button size="sm" variant="ghost" className="text-inherit" asChild>
                  <a href="/agency-contacts">Add Contact</a>
                </Button>
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

      {/* Complaints snapshot - moved to top-right */}
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle>Complaints snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-3 flex-1">
          {loadingOverview ? (
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
              <RowStat label="Open" value={overview?.complaints?.open} badgeVariant="default" />
              <RowStat label="In progress" value={overview?.complaints?.inProgress} badgeVariant="secondary" />
              <RowStat label="Resolved (7d)" value={overview?.complaints?.resolved7d} badgeVariant="outline" />
          <p className="text-xs text-muted-foreground">Hook to real stats once endpoints are ready.</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* KPI STRIP */}
      <div className="grid gap-3 xl:col-span-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatsTile label="Total users" value={overview?.totalUsers} loading={loadingOverview} />
        <StatsTile label="New this week" value={overview?.totalUsers} loading={loadingOverview} tone="alt" />
        <StatsTile label="Open complaints" value={overview?.complaints?.open} loading={loadingOverview} />
      </div>

      {/* trends removed */}

      {/* Quick links */}
      <div className="xl:col-span-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GradientMini title="Create complaint" href="/complaints/new" />
        <GradientMini title="Browse contacts" href="/agency-contacts" variant="alt" />
        <GradientMini title="Upload circular" disabled />
        <GradientMini title="View reports" variant="alt" disabled />
      </div>

      {/* Styles */}
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
  const style =
    variant === 'base'
      ? ({ ['--grad-from' as unknown as string]: 'var(--primary)', ['--grad-to' as unknown as string]: 'color-mix(in oklch, var(--primary) 40%, var(--accent))' } as React.CSSProperties)
      : ({ ['--grad-from' as unknown as string]: 'var(--accent)', ['--grad-to' as unknown as string]: 'color-mix(in oklch, var(--accent) 40%, var(--primary))' } as React.CSSProperties);
  if (disabled) {
    return (
      <motion.div style={style} whileHover={{ scale: 1.01 }} className="relative block rounded-xl p-[1px] cursor-not-allowed opacity-80" aria-disabled>
        <div className="animated-gradient-surface rounded-xl p-[1px]">
          <div className="rounded-[calc(theme(borderRadius.xl)-1px)] bg-background">
            <div className="flex items-center justify-between gap-4 p-4">
              <span className="text-sm font-medium">{title}</span>
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.a href={href} style={style} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }} className="relative block rounded-xl p-[1px]">
      <div className="animated-gradient-surface rounded-xl p-[1px]">
        <div className="rounded-[calc(theme(borderRadius.xl)-1px)] bg-background">
          <div className="flex items-center justify-between gap-4 p-4">
            <span className="text-sm font-medium">{title}</span>
            <span className="text-xs text-muted-foreground">Open →</span>
          </div>
        </div>
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
