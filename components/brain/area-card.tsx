'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Check, X, Plus, CircleCheck, CircleDot } from 'lucide-react';
import type { AreaState, LifeAreaId } from '@/lib/lifemodel/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const AREA_LABEL: Record<LifeAreaId, string> = {
  career: 'Career',
  health: 'Health',
  mental: 'Mental',
  financial: 'Financial',
  social: 'Social',
};

export function AreaCard({
  areaId,
  area,
  onSave,
  action,
}: {
  areaId: LifeAreaId;
  area: AreaState;
  onSave: (a: AreaState) => Promise<void>;
  action?: { label: string; href: string };
}) {
  const [editing, setEditing] = useState(false);
  const [draftStatus, setDraftStatus] = useState(area.status);
  const [draftSummary, setDraftSummary] = useState(area.summary);
  const [newThread, setNewThread] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [saving, setSaving] = useState(false);

  const persist = async (next: AreaState) => {
    setSaving(true);
    try {
      await onSave(next);
    } catch (error) {
      console.error(`Failed to save ${areaId} area:`, error);
    } finally {
      setSaving(false);
    }
  };

  const saveText = async () => {
    await persist({ ...area, status: draftStatus.trim(), summary: draftSummary.trim() });
    setEditing(false);
  };

  const toggleGoal = (id: string) =>
    persist({
      ...area,
      goals: area.goals.map((g) => (g.id === id ? { ...g, status: g.status === 'active' ? 'done' : 'active' } : g)),
    });

  const toggleThread = (id: string) =>
    persist({
      ...area,
      threads: area.threads.map((t) => (t.id === id ? { ...t, status: t.status === 'open' ? 'closed' : 'open' } : t)),
    });

  const addThread = () => {
    const text = newThread.trim();
    if (!text) return;
    setNewThread('');
    persist({ ...area, threads: [...area.threads, { id: crypto.randomUUID(), text, status: 'open' }] });
  };

  const addGoal = () => {
    const text = newGoal.trim();
    if (!text) return;
    setNewGoal('');
    persist({ ...area, goals: [...area.goals, { id: crypto.randomUUID(), text, targetDate: null, status: 'active' }] });
  };

  const activeGoals = area.goals.filter((g) => g.status !== 'dropped');
  const openThreads = area.threads.filter((t) => t.status === 'open');
  const isEmpty = !area.status && !area.summary && activeGoals.length === 0 && area.threads.length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{AREA_LABEL[areaId]}</CardTitle>
            {openThreads.length > 0 && <Badge tone="primary">{openThreads.length} open</Badge>}
            {action && (
              <Link href={action.href} className="text-xs text-accent hover:underline">
                {action.label}
              </Link>
            )}
          </div>
          {editing ? (
            <div className="flex gap-1.5">
              <Button size="sm" variant="primary" onClick={saveText} disabled={saving} aria-label={`Save ${areaId}`}>
                <Check className="size-4" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving} aria-label="Cancel">
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setDraftStatus(area.status); setDraftSummary(area.summary); setEditing(true); }}
              aria-label={`Edit ${areaId}`}
            >
              <Pencil className="size-3.5" /> Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty && !editing ? (
          <p className="text-sm text-text-muted">Nothing here yet — mention this part of your life to the mentor.</p>
        ) : (
          <>
            <div>
              <p className="mb-1 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">Right now</p>
              {editing ? (
                <Textarea value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)} rows={2} disabled={saving} />
              ) : (
                <p className="text-sm text-text-body">{area.status || <span className="text-text-muted">—</span>}</p>
              )}
            </div>

            {(editing || area.summary) && (
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">History</p>
                {editing ? (
                  <Textarea value={draftSummary} onChange={(e) => setDraftSummary(e.target.value)} rows={2} disabled={saving} />
                ) : (
                  <p className="text-sm text-text-body">{area.summary}</p>
                )}
              </div>
            )}

            {activeGoals.length > 0 && (
              <div>
                <p className="mb-1.5 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">Goals</p>
                <div className="space-y-1.5">
                  {activeGoals.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      disabled={saving}
                      className="flex w-full items-center gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2 text-left text-sm transition-colors hover:border-accent"
                      aria-label={`Toggle goal: ${g.text}`}
                    >
                      {g.status === 'done'
                        ? <CircleCheck className="size-4 flex-shrink-0 text-success" />
                        : <CircleDot className="size-4 flex-shrink-0 text-text-muted" />}
                      <span className={g.status === 'done' ? 'text-text-muted line-through' : 'text-text-body'}>
                        {g.text}{g.targetDate ? ` · by ${g.targetDate}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {area.threads.length > 0 && (
              <div>
                <p className="mb-1.5 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">Open loops</p>
                <div className="space-y-1.5">
                  {area.threads.filter((t) => editing || t.status === 'open').map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleThread(t.id)}
                      disabled={saving}
                      className="flex w-full items-center gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2 text-left text-sm transition-colors hover:border-accent"
                      aria-label={`Toggle thread: ${t.text}`}
                    >
                      {t.status === 'closed'
                        ? <CircleCheck className="size-4 flex-shrink-0 text-success" />
                        : <CircleDot className="size-4 flex-shrink-0 text-accent" />}
                      <span className={t.status === 'closed' ? 'text-text-muted line-through' : 'text-text-body'}>{t.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {editing && (
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex gap-2">
              <input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add a goal…"
                className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                disabled={saving}
              />
              <Button size="sm" variant="outline" onClick={addGoal} disabled={saving || !newGoal.trim()} aria-label="Add goal">
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <input
                value={newThread}
                onChange={(e) => setNewThread(e.target.value)}
                placeholder="Add an open loop…"
                className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                disabled={saving}
              />
              <Button size="sm" variant="outline" onClick={addThread} disabled={saving || !newThread.trim()} aria-label="Add thread">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
