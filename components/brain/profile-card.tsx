'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import type { Profile } from '@/lib/lifemodel/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const FIELDS: { key: keyof Profile; label: string; placeholder: string }[] = [
  { key: 'identity', label: 'Who you are', placeholder: 'Not captured yet — the mentor learns this as you talk.' },
  { key: 'personality', label: 'Personality', placeholder: 'Not captured yet.' },
  { key: 'coachingStyle', label: 'How you like to be coached', placeholder: 'Not captured yet — tell the mentor how to talk to you.' },
];

export function ProfileCard({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);

  const startEdit = () => { setDraft(profile); setEditing(true); };
  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile</CardTitle>
          {editing ? (
            <div className="flex gap-1.5">
              <Button size="sm" variant="primary" onClick={save} disabled={saving} aria-label="Save profile">
                <Check className="size-4" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving} aria-label="Cancel">
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={startEdit} aria-label="Edit profile">
              <Pencil className="size-3.5" /> Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <p className="mb-1 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">{label}</p>
            {editing ? (
              <Textarea
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                rows={2}
                disabled={saving}
              />
            ) : (
              <p className="text-sm text-text-body">{profile[key] || <span className="text-text-muted">{placeholder}</span>}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
