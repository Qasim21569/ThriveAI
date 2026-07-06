'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, Dumbbell, Smile, StickyNote, CalendarCheck } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import { getRecentCheckins, type Checkin, type CheckinType } from '@/lib/firebase/checkins';
import { getLifeModel } from '@/lib/firebase/lifeModel';
import { getRecentEvents } from '@/lib/firebase/lifeModel';
import { computeStreak } from '@/lib/checkins/streak';
import { buildHeatmap, weeklyInsight, goalStats, bestStreak } from '@/lib/progress/insights';
import type { LifeEvent } from '@/lib/lifemodel/types';
import AuthModal from '@/components/auth/AuthModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { MentorVoice } from '@/components/ui/mentor-voice';
import { Stagger, StaggerItem } from '@/components/motion/stagger';
import type { LifeModel } from '@/lib/lifemodel/types';
import type { GoalAreaStats } from '@/lib/progress/insights';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<CheckinType, React.ComponentType<{ className?: string }>> = {
  workout: Dumbbell,
  mood: Smile,
  note: StickyNote,
  daily: CalendarCheck,
};

const TYPE_TONE: Record<CheckinType, 'primary' | 'accent' | 'neutral'> = {
  workout: 'primary',
  mood: 'accent',
  note: 'neutral',
  daily: 'primary',
};

const AREA_LABEL: Record<string, string> = {
  career: 'Career',
  health: 'Health',
  mental: 'Mental',
  financial: 'Financial',
  social: 'Social',
};

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** 4 top-level stat cards */
function StatCards({
  currentStreak,
  best,
  totalCheckins,
  activeGoals,
}: {
  currentStreak: number;
  best: number;
  totalCheckins: number;
  activeGoals: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Current streak — gold accent */}
      <Card className="p-4 text-center gap-2">
        <div className="flex items-center justify-center gap-1.5">
          <Flame className="size-4 text-gold-500" aria-hidden />
          <span className="font-mono text-2xl font-semibold text-gold-500">
            {currentStreak}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">day streak</p>
      </Card>

      {/* Best streak */}
      <Card className="p-4 text-center gap-2">
        <div className="font-mono text-2xl font-semibold text-foreground">{best}</div>
        <p className="text-xs text-muted-foreground">best streak</p>
      </Card>

      {/* Total check-ins */}
      <Card className="p-4 text-center gap-2">
        <div className="font-mono text-2xl font-semibold text-foreground">{totalCheckins}</div>
        <p className="text-xs text-muted-foreground">total check-ins</p>
      </Card>

      {/* Active goals */}
      <Card className="p-4 text-center gap-2">
        <div className="font-mono text-2xl font-semibold text-foreground">{activeGoals}</div>
        <p className="text-xs text-muted-foreground">active goals</p>
      </Card>
    </div>
  );
}

/** 12-week heatmap rendered as pure CSS grid */
function HeatmapCard({ checkinDates, today }: { checkinDates: string[]; today: string }) {
  const { weeks } = buildHeatmap(checkinDates, today);

  // max count for opacity scaling
  const allCounts = weeks.flat().map((d) => d.count);
  const maxCount = Math.max(...allCounts, 1);

  function opacityClass(count: number): string {
    if (count === 0) return '';
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 'opacity-25';
    if (ratio <= 0.5) return 'opacity-50';
    if (ratio <= 0.75) return 'opacity-75';
    return 'opacity-100';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity — last 12 weeks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Weekday labels */}
          <div
            className="mb-1 grid gap-1"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
            aria-hidden
          >
            {weeks.map((_, wi) => (
              <div key={wi} className="grid grid-rows-7 gap-1">
                {WEEKDAY_LETTERS.map((letter, di) =>
                  wi === 0 ? (
                    <span
                      key={di}
                      className="flex h-4 items-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
                    >
                      {letter}
                    </span>
                  ) : (
                    <span key={di} className="h-4" />
                  ),
                )}
              </div>
            ))}
          </div>

          {/* Grid of cells: columns = weeks, rows = days Mon-Sun */}
          <div
            role="grid"
            aria-label="Check-in activity heatmap"
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
          >
            {weeks.map((week, wi) => (
              <div key={wi} role="row" className="grid grid-rows-7 gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    role="gridcell"
                    aria-label={`${day.date}: ${day.count} check-in${day.count === 1 ? '' : 's'}`}
                    className={[
                      'size-3 rounded-sm sm:size-3.5',
                      day.count > 0
                        ? `bg-gold-500 ${opacityClass(day.count)}`
                        : 'bg-surface-sunken',
                    ].join(' ')}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Goals per-area with a done/total progress bar */
function GoalsCard({ stats }: { stats: GoalAreaStats[] }) {
  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken px-6 py-10 text-center">
            <p className="mb-1 text-sm font-medium text-foreground">No goals tracked yet</p>
            <p className="text-sm text-muted-foreground">
              <Link href="/coach" className="text-primary underline-offset-2 hover:underline">
                Tell your mentor a goal
              </Link>{' '}
              and it will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goals by area</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {stats.map((s) => {
          const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
          return (
            <div key={s.area}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {AREA_LABEL[s.area] ?? s.area}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {s.done}/{s.total} done
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-slow"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${AREA_LABEL[s.area] ?? s.area} goal progress`}
                />
              </div>
              {/* Active goals list */}
              {s.active.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {s.active.map((text, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/** Milestones and setbacks grouped by month */
function MilestonesCard({ events }: { events: LifeEvent[] }) {
  const relevant = events.filter(
    (e) => e.type === 'milestone' || e.type === 'setback',
  );

  if (relevant.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken px-6 py-10 text-center">
            <p className="mb-1 text-sm font-medium text-foreground">No milestones recorded yet</p>
            <p className="text-sm text-muted-foreground">
              As you share wins and challenges in{' '}
              <Link href="/coach" className="text-primary underline-offset-2 hover:underline">
                chat
              </Link>
              , your mentor will mark them here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by month (YYYY-MM), newest first
  const byMonth = new Map<string, LifeEvent[]>();
  for (const e of relevant) {
    const key = e.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e);
  }
  const monthKeys = Array.from(byMonth.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Milestones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {monthKeys.map((month) => (
          <div key={month}>
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {formatMonth(month + '-01')}
            </p>
            <ul className="space-y-3">
              {byMonth.get(month)!.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  {/* Dot: gold for milestone, muted for setback */}
                  <span
                    className={[
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      e.type === 'milestone' ? 'bg-gold-500' : 'bg-muted-foreground/40',
                    ].join(' ')}
                    aria-label={e.type}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{e.content}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {new Date(e.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC',
                      })}
                      {' · '}
                      <span className="capitalize">{AREA_LABEL[e.area] ?? e.area}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Skeleton while loading */
function ProgressSkeleton() {
  return (
    <div className="mx-auto max-w-app px-4 py-12">
      <Skeleton className="mb-2 h-4 w-20" />
      <Skeleton className="mb-8 h-8 w-56" />
      <div className="mb-6 grid grid-cols-4 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="mb-6 h-40 w-full" />
      <Skeleton className="mb-6 h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [lifeModel, setLifeModel] = useState<LifeModel | null>(null);
  const [events, setEvents] = useState<LifeEvent[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      try {
        const [checkinsData, modelData, eventsData] = await Promise.all([
          getRecentCheckins(user.uid, 365).catch(() => [] as Checkin[]),
          getLifeModel(user.uid).catch(() => null),
          getRecentEvents(user.uid, 100).catch(() => [] as LifeEvent[]),
        ]);
        setCheckins(checkinsData);
        setLifeModel(modelData);
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading progress data:', error);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  if (loading) return <ProgressSkeleton />;

  const today = todayUTC();
  const checkinDates = checkins.map((c) => c.createdAt);

  // Computed stats
  const currentStreak = computeStreak(checkinDates, today);
  const best = bestStreak(checkinDates);
  const stats = goalStats(lifeModel);
  const activeGoalCount = stats.reduce((sum, s) => sum + s.active.length, 0);
  const insight = weeklyInsight(checkinDates, today);

  // Cap stagger list at 20 per motion guidelines
  const visibleCheckins = checkins.slice(0, 20);

  return (
    <div className="px-4 py-12">
      <AuthModal
        open={showAuthModal}
        onClose={() => router.push('/')}
        onSuccess={() => setShowAuthModal(false)}
      />

      <Stagger className="mx-auto max-w-app space-y-6">
        {/* Header */}
        <StaggerItem>
          <PageHeader title="Progress" sub="The story so far" />
        </StaggerItem>

        {/* 4 stat cards */}
        <StaggerItem>
          <StatCards
            currentStreak={currentStreak}
            best={best}
            totalCheckins={checkins.length}
            activeGoals={activeGoalCount}
          />
        </StaggerItem>

        {/* Heatmap */}
        <StaggerItem>
          <HeatmapCard checkinDates={checkinDates} today={today} />
        </StaggerItem>

        {/* Weekly insight */}
        <StaggerItem>
          <MentorVoice rule className="rounded-lg">
            {insight.text}
          </MentorVoice>
        </StaggerItem>

        {/* Goals per area */}
        <StaggerItem>
          <GoalsCard stats={stats} />
        </StaggerItem>

        {/* Milestones */}
        <StaggerItem>
          <MilestonesCard events={events} />
        </StaggerItem>

        {/* Check-in feed — retained from original, capped at 20 */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle>Check-in timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {checkins.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken px-6 py-12 text-center">
                  <p className="mb-1 text-sm font-medium text-foreground">No check-ins yet</p>
                  <p className="text-sm text-muted-foreground">
                    Tell your coach about a workout or how you&apos;re feeling, and it will show up here.
                  </p>
                </div>
              ) : (
                <Stagger className="space-y-3">
                  {visibleCheckins.map((c) => {
                    const Icon = TYPE_ICON[c.type];
                    return (
                      <StaggerItem key={c.id}>
                        <div className="flex items-start gap-3 rounded-md border border-border bg-surface-sunken p-3">
                          <div className="mt-0.5 flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Badge tone={TYPE_TONE[c.type]}>{c.type}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatRelative(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground">{c.summary}</p>
                          </div>
                        </div>
                      </StaggerItem>
                    );
                  })}
                  {checkins.length > 20 && (
                    <p className="pt-1 text-center text-xs text-muted-foreground">
                      Showing the 20 most recent check-ins.
                    </p>
                  )}
                </Stagger>
              )}
            </CardContent>
          </Card>
        </StaggerItem>
      </Stagger>
    </div>
  );
}
