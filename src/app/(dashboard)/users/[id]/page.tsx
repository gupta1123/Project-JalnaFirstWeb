'use client';

import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  CheckCircle2,
  XCircle,
  CalendarClock,
  UserRound,
} from 'lucide-react';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

/* -------------------- Types -------------------- */
type Coordinates = { latitude?: number; longitude?: number };

type User = {
  _id: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  isActive?: boolean;
  isBlocked?: boolean;
  isEmailVerified?: boolean;
  profileVisibility?: 'public' | 'private' | string;
  preferredLanguage?: string;
  createdAt?: string;
  lastActive?: string;
  profilePhoto?: string; // can be file name or URL
  aadhaarNumber?: string;
  education?: string;
  occupation?: string;
  businessDetails?: { businessType?: string };
  adminPrivileges?: {
    canManageUsers?: boolean;
    canManageContent?: boolean;
    canManageSettings?: boolean;
    canUploadDocs?: boolean;
    canEditPhoneNumbers?: boolean;
  };
  location?: {
    coordinates?: Coordinates;
    city?: string;
    state?: string;
    country?: string;
  };
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
};

type UserResponse = { message?: string; user?: User };

/* -------------------- Helpers -------------------- */
const resolveProfileUrl = (p?: string) => {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  // Adjust base path if your files live elsewhere
  return `/uploads/${p}`;
};

const initials = (u?: User) => {
  const n = u?.fullName || `${u?.firstName ?? ''} ${u?.lastName ?? ''}`;
  return n
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'U';
};

const maskAadhaar = (v?: string) => {
  if (!v) return '—';
  const digits = v.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  return `XXXX-XXXX-${last4}`;
};

const fmtDate = (iso?: string) =>
  iso
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      }).format(new Date(iso))
    : '—';

const relativeTime = (iso?: string) => {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (Math.abs(day) >= 1) return `${day}d ago`;
  if (Math.abs(hr) >= 1) return `${hr}h ago`;
  if (Math.abs(min) >= 1) return `${min}m ago`;
  return `${sec}s ago`;
};

const mapsLink = (c?: Coordinates, city?: string) => {
  const lat = c?.latitude;
  const lon = c?.longitude;
  if (lat == null || lon == null) return undefined;
  const label = encodeURIComponent(city ?? 'Location');
  return `https://maps.google.com/?q=${lat},${lon} (${label})`;
};

/* -------------------- Page -------------------- */
export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id as string;
  const { data, isLoading } = useSWR<UserResponse>(userId ? `/api/users/${userId}` : null, fetcher);
  const user = data?.user;

  const fullName = useMemo(() => user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User', [user]);
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      }).format(new Date()),
    []
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* HEADER */}
      <Card className="lg:col-span-3 overflow-hidden border-0 bg-transparent shadow-none">
        <AnimatedGradientHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-primary-foreground">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-foreground/20 bg-background/60 backdrop-blur">
                <AvatarImage src={resolveProfileUrl(user?.profilePhoto)} alt={fullName} />
                <AvatarFallback className="text-primary-foreground bg-foreground/10">{initials(user)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <UserRound className="h-5 w-5 opacity-90" /> {isLoading ? <Skeleton className="h-6 w-40" /> : fullName}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary">{today}</Badge>
                  {user?.isActive ? (
                    <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Active</Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Inactive</Badge>
                  )}
                  {user?.profileVisibility && (
                    <Badge variant="secondary">{user.profileVisibility}</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-wrap gap-2" />
          </div>
        </AnimatedGradientHeader>
      </Card>

      {/* LEFT: Contact & Profile */}
      <Card className="lg:col-span-2">
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email} copyable />
          <InfoItem icon={<Phone className="h-4 w-4" />} label="Phone" value={user?.phoneNumber} copyable />
          <InfoItem icon={<Shield className="h-4 w-4" />} label="Email verified" value={user?.isEmailVerified ? 'Yes' : 'No'} chip />
          <InfoItem icon={<CalendarClock className="h-4 w-4" />} label="Joined" value={fmtDate(user?.createdAt)} helper={relativeTime(user?.createdAt)} />
          
           <InfoItem icon={<Shield className="h-4 w-4" />} label="Aadhaar" value={maskAadhaar(user?.aadhaarNumber)} />
        </CardContent>
      </Card>

    <Card>
        <CardHeader className="pb-2"><CardTitle>Location</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="City" value={user?.location?.city} />
          <InfoRow icon={<Globe className="h-4 w-4" />} label="State" value={user?.location?.state} />
          <InfoRow icon={<Globe className="h-4 w-4" />} label="Country" value={user?.location?.country} />
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Coordinates" value={coordsText(user?.location?.coordinates)} copyable />
          {mapsLink(user?.location?.coordinates, user?.location?.city) && (
            <Button size="sm" variant="secondary" asChild>
              <a href={mapsLink(user?.location?.coordinates, user?.location?.city)} target="_blank" rel="noreferrer">View on map</a>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
      <CardContent>
          <div className="rounded-xl border p-4 bg-muted/20">
            <div className="text-sm leading-relaxed">
              {formatAddressLines(user?.address) || '—'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <InfoRow icon={<Globe className="h-4 w-4" />} label="Preferred language" value={user?.preferredLanguage?.toUpperCase()} />
        </CardContent>
      </Card>

      {/* Admin privileges removed by request */}

      {/* Styles for header gradient (static, high-contrast for both themes) */}
      <style jsx global>{`
        .animated-gradient-surface { position: relative; border-radius: 0.75rem; background-image: linear-gradient(135deg, var(--grad-from), var(--grad-to)); background-size: 100% 100%; }
        .gradient-noise::after { content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit; background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,.06) 1px, transparent 1px); background-size: 12px 12px; opacity: .14; mix-blend-mode: soft-light; }
      `}</style>
    </div>
  );
}

/* -------------------- Subcomponents -------------------- */
function AnimatedGradientHeader({ children }: { children: React.ReactNode }) {
  const style = {
    ['--grad-from' as unknown as string]: 'var(--primary)',
    ['--grad-to' as unknown as string]: 'color-mix(in oklch, var(--primary) 45%, var(--accent))',
  } as React.CSSProperties;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={style} className="animated-gradient-surface gradient-noise p-6 sm:p-8 text-primary-foreground">{children}</div>
    </motion.div>
  );
}

function InfoItem({ icon, label, value, helper, copyable, chip }: { icon: React.ReactNode; label: string; value?: string; helper?: string; copyable?: boolean; chip?: boolean }) {
  const [copied, setCopied] = useState(false);
  const show = value && value.trim().length > 0 ? value : '—';
  const handleCopy = async () => {
    if (!copyable || !value) return;
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
  };
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-muted-foreground flex items-center gap-2">{icon}<span>{label}</span></div>
      <div className="flex items-center gap-2">
        {chip ? (
          <Badge variant={show === 'Yes' ? 'default' : 'outline'}>{show}</Badge>
        ) : (
          <span className="text-sm font-medium">{show}</span>
        )}
        {copyable && value && (
          <Button type="button" size="sm" variant="ghost" className="h-6 px-2" onClick={handleCopy}>{copied ? 'Copied' : 'Copy'}</Button>
        )}
      </div>
      {helper && <div className="text-[11px] text-muted-foreground">{helper}</div>}
          </div>
  );
}

function InfoRow({ icon, label, value, copyable }: { icon: React.ReactNode; label: string; value?: string; copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">{icon}</span><span>{label}</span></div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value && value.trim().length ? value : '—'}</span>
        {copyable && value && (
          <Button type="button" size="sm" variant="ghost" className="h-6 px-2" onClick={() => navigator.clipboard.writeText(value)}>Copy</Button>
        )}
      </div>
    </div>
  );
}

function PrivilegesGrid({ data }: { data?: User['adminPrivileges'] }) {
  const rows = [
    { key: 'canManageUsers', label: 'Manage users' },
    { key: 'canManageContent', label: 'Manage content' },
    { key: 'canManageSettings', label: 'Manage settings' },
    { key: 'canUploadDocs', label: 'Upload documents' },
    { key: 'canEditPhoneNumbers', label: 'Edit phone numbers' },
  ] as const;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {rows.map((r) => {
        const ok = (data && typeof data === 'object' ? (data as Record<string, unknown>)[r.key] : undefined) as boolean | undefined;
        return (
          <div key={r.key} className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">{r.label}</span>
            {ok ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Allowed</Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Not allowed</Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- tiny utils -------------------- */
function coordsText(c?: Coordinates) {
  const lat = c?.latitude;
  const lon = c?.longitude;
  if (lat == null || lon == null) return undefined;
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

function formatAddress(a?: User['address']) {
  if (!a) return '';
  return [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(', '), a.zipCode, a.country]
    .filter(Boolean)
    .join('\n');
}

function formatAddressLines(a?: User['address']) {
  if (!a) return '';
  const line = [a.line1, a.line2].filter(Boolean).join(', ');
  return line;
}
