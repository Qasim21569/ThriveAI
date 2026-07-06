'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { MentorVoice } from '@/components/ui/mentor-voice';

const EASE = [0.4, 0, 0.2, 1] as const;
const DURATION_SLOW = 0.28;

// ─── Area status rows shown in the mock Brain card ────────────────────────────

const AREAS = [
  {
    label: 'Career',
    tone: 'primary' as const,
    status: 'Interviewing at two companies; nervous about the technical round next Friday.',
  },
  {
    label: 'Health',
    tone: 'success' as const,
    status: 'Sleep improved after cutting screens at 10 pm. Knee still tender — low-impact only.',
  },
  {
    label: 'Mental',
    tone: 'warning' as const,
    status: 'Stress is elevated this month. Linked to job uncertainty, not to-do volume.',
  },
  {
    label: 'Finances',
    tone: 'neutral' as const,
    status: 'Emergency fund at 2.1 months. Goal is 3. Saving $400 more per month.',
  },
  {
    label: 'Social',
    tone: 'accent' as const,
    status: 'Missed two dinners with friends this month. Wants to reconnect more intentionally.',
  },
];

// ─── Chat bubbles in the mock exchange ───────────────────────────────────────

function Bubble({ who, children }: { who: 'coach' | 'me'; children: React.ReactNode }) {
  const me = who === 'me';
  return (
    <div
      className={[
        'max-w-[88%] rounded-lg px-3.5 py-2.5 text-sm leading-snug',
        me
          ? 'self-end rounded-br-xs bg-primary text-primary-foreground'
          : 'self-start rounded-bl-xs border border-border bg-surface-sunken text-text-body',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

// ─── ProductMockSection ───────────────────────────────────────────────────────

export const ProductMockSection = () => {
  return (
    <section id="product" className="mx-auto max-w-content px-6 py-20">
      {/* section heading */}
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: DURATION_SLOW, ease: EASE }}
      >
        <p className="ds-label mb-3">See it in action</p>
        <h2
          className="font-serif text-3xl tracking-[-0.015em] text-foreground md:text-[2.375rem]"
          style={{ fontWeight: 400 }}
        >
          Your Brain page. Your mentor&apos;s memory.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-text-muted">
          Everything ThriveAI knows about you lives on the Brain page — visible, editable, and
          always in the mentor&apos;s voice. Nothing happens in a black box.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* ── left: Brain-page-style card ── */}
        <motion.div
          className="flex flex-col rounded-xl border border-border bg-surface shadow-sm"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: DURATION_SLOW, ease: EASE }}
        >
          {/* card header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <p className="ds-label mb-0.5">Brain</p>
              <p className="text-sm text-text-muted">Jordan&apos;s life memory</p>
            </div>
            <Badge tone="success" dot>
              Up to date
            </Badge>
          </div>

          {/* area rows */}
          <div className="flex flex-col divide-y divide-border">
            {AREAS.map((area) => (
              <div key={area.label} className="px-6 py-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge tone={area.tone}>{area.label}</Badge>
                </div>
                <MentorVoice>{area.status}</MentorVoice>
              </div>
            ))}
          </div>

          {/* card footer hint */}
          <div className="border-t border-border px-6 py-3">
            <p className="text-xs text-text-muted">
              You can edit any entry. Your mentor updates instantly.
            </p>
          </div>
        </motion.div>

        {/* ── right: chat exchange demonstrating recall ── */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: DURATION_SLOW, ease: EASE, delay: 0.1 }}
        >
          {/* context chip */}
          <div className="rounded-lg border border-border bg-surface-sunken px-4 py-3">
            <p className="text-xs text-text-muted">
              <span className="font-medium text-text-body">Mentor&apos;s context</span> — drawn
              from Jordan&apos;s Brain page
            </p>
            <MentorVoice className="mt-1 block text-sm">
              Technical interview on Friday. Knee injury limits exercise. Sleep recently improved.
              Stress elevated due to job uncertainty.
            </MentorVoice>
          </div>

          {/* chat */}
          <div className="flex-1 rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/thriveai-mark.svg" width={30} height={30} alt="" />
              <div>
                <div className="text-sm font-semibold text-foreground">Thrive Mentor</div>
                <div className="text-xs text-success">● Online now</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Bubble who="me">
                I bombed a practice problem today. Feeling really off about Friday.
              </Bubble>
              <Bubble who="coach">
                That&apos;s a hard feeling — especially with the stakes. You&apos;ve been under
                elevated stress this month, and your sleep only stabilised recently, so your
                cognitive headroom is thinner than usual right now.
              </Bubble>
              <Bubble who="coach">
                One thing: your job anxiety is the driver here, not your actual skills. You
                wouldn&apos;t be at the final round if the skills weren&apos;t there.
              </Bubble>
              <Bubble who="me">That actually helps. What should I do tonight?</Bubble>
              <Bubble who="coach">
                Protect the sleep you&apos;ve worked to fix. No hard prep after 9 pm — light
                review only. The compounding from consistent rest will do more for Friday than
                one late cram session.
              </Bubble>
            </div>
          </div>

          <p className="text-center text-xs text-text-muted">
            The mentor connected sleep, stress, and the interview — because it knows all three.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
