'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase/firebaseConfig';
import type { User } from 'firebase/auth';
import { saveMessage, getRecentMessages, type ChatMessage } from '@/lib/firebase/messages';
import { saveCheckin } from '@/lib/firebase/checkins';
import { buildMentorContext, assembleMentorContext } from '@/lib/coach/context';
import { runExtraction } from '@/lib/coach/extraction-client';
import type { LifeModel, LifeEvent } from '@/lib/lifemodel/types';
import { logCheckinArgsSchema, extractToolCall } from '@/lib/coach/tools';
import AuthModal from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FadeIn } from '@/components/motion/fade-in';
import { MentorVoice } from '@/components/ui/mentor-voice';

const SUGGESTED_PROMPTS = [
  'Here\'s how my day went…',
  'How have I been doing lately?',
  'What should I focus on this week?',
  'Help me think through a decision',
];

const ERROR_TEXT = "Sorry, I couldn't respond just now. Please try again.";

/**
 * ActionChip — the "✓ Logged" tool-call confirmation bubble.
 *
 * Renders with a single 300ms gold background pulse on mount (sanctioned per
 * motion-guidelines: "Chat: tool-call confirmation chip — FadeIn + one 300ms
 * gold background pulse"). Uses gold tokens (gold-50 fill, gold-500 text)
 * per theme-decision: "gold = celebration/logging moments".
 *
 * Only opacity/transform animate in Framer Motion; the backgroundColor pulse
 * is a one-shot keyframe (<300ms) on a color property — sanctioned exception
 * (motion guidelines allow color transitions ≤180ms for CSS; this inline
 * animate sequence is equivalent in intent and fires exactly once).
 *
 * The pulse color is read from the computed --gold-50 CSS variable at mount so
 * it adapts to both light and dark themes without hardcoded RGB triples.
 */
function ActionChip({ content }: { content: string }) {
  const [gold50, setGold50] = useState('rgb(246 237 214)');
  useEffect(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--gold-50').trim();
    if (raw) setGold50(`rgb(${raw})`);
  }, []);

  return (
    <div className="flex justify-start">
      {/* Motion rule: FadeIn is the outer entrance; the inner pulse animates
          backgroundColor from gold-50 to transparent once over 300ms. */}
      <motion.div
        initial={{ opacity: 0, y: 6, backgroundColor: gold50 }}
        animate={{
          opacity: 1,
          y: 0,
          backgroundColor: [gold50, gold50, 'rgba(0,0,0,0)'],
        }}
        transition={{
          opacity: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
          y: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
          backgroundColor: { duration: 0.3, ease: [0.4, 0, 0.2, 1], times: [0, 0.5, 1] },
        }}
        className="flex max-w-[80%] items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-50 px-4 py-2.5 text-sm text-gold-500"
      >
        <CheckCircle2 className="size-4 flex-shrink-0" />
        <span>{content}</span>
      </motion.div>
    </div>
  );
}

function ChatBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const me = role === 'user';

  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[80%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm leading-relaxed',
          me
            ? 'rounded-br-xs bg-primary text-primary-foreground'
            : 'rounded-bl-xs border border-border bg-surface-sunken text-text-body',
        ].join(' ')}
      >
        {content || (!me ? '…' : '')}
      </div>
    </div>
  );
}

export default function CoachPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [contextBlock, setContextBlock] = useState<string | undefined>(undefined);
  const [hasModel, setHasModel] = useState(false);
  const lifeModelRef = useRef<LifeModel | null>(null);
  const recentEventsRef = useRef<LifeEvent[]>([]);
  const extractionChainRef = useRef<Promise<void>>(Promise.resolve());
  const [failedRetry, setFailedRetry] = useState<{ userText: string; assistantId: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load auth, the assembled context pipeline, and recent message history on mount.
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setUser(u);
      try {
        const idToken = await u.getIdToken();
        const [history, ctx] = await Promise.all([
          getRecentMessages(u.uid, 20),
          buildMentorContext(u.uid, idToken),
        ]);
        setMessages(history);
        setContextBlock(ctx.contextBlock || undefined);
        setHasModel(ctx.hasModel);
        lifeModelRef.current = ctx.model;
      } catch (error) {
        console.error('Error loading coach context:', error);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Autofocus the input once the page is ready to type into.
  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  /** Streams a reply into the given assistant bubble. Does not add a user bubble — callers handle that. */
  const streamAssistantReply = async (userText: string, assistantId: string, priorHistory: { role: 'user' | 'assistant'; content: string }[]) => {
    if (!user) return;
    setFailedRetry(null);
    setIsStreaming(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ message: userText, contextBlock, history: priorHistory }),
      });

      if (!res.ok || !res.body) throw new Error(`Chat request failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        rawText += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: extractToolCall(rawText).text } : m)),
        );
      }

      const { text, toolCall } = extractToolCall(rawText);
      let finalText = text;

      if (toolCall?.name === 'log_checkin') {
        const parsed = logCheckinArgsSchema.safeParse(toolCall.arguments);
        if (parsed.success) {
          const { type, summary } = parsed.data;
          try {
            await saveCheckin(user.uid, type, summary);
            const confirmation = `✓ Logged (${type}): ${summary}`;
            finalText = text ? `${text}\n\n${confirmation}` : confirmation;
          } catch (error) {
            console.error('Failed to save check-in:', error);
            finalText = text || "I tried to log that but couldn't save it. Please try again.";
          }
        } else {
          console.error('Tool call arguments failed client-side validation:', parsed.error.flatten());
          finalText = text || "I couldn't quite understand what to log. Could you rephrase?";
        }
      }

      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: finalText } : m)));

      // Update the brain from this turn. Chained (not parallel) so a rapid
      // next turn can never race an in-flight extraction and overwrite its
      // model updates; reads the ref inside the chain for the same reason.
      if (finalText) {
        const turnText = `User: ${userText}\nMentor: ${finalText}`;
        extractionChainRef.current = extractionChainRef.current.then(async () => {
          if (!lifeModelRef.current) return;
          const freshToken = await user.getIdToken();
          const outcome = await runExtraction(user.uid, freshToken, lifeModelRef.current, turnText);
          if (!outcome) return;
          lifeModelRef.current = outcome.model;
          recentEventsRef.current = [...outcome.newEvents, ...recentEventsRef.current].slice(0, 15);
          setContextBlock(assembleMentorContext(outcome.model, recentEventsRef.current) || undefined);
        });
      }

      if (finalText) {
        saveMessage(user.uid, 'assistant', finalText).catch((e) => console.error('Failed to save message:', e));
      }
    } catch (error) {
      console.error('Coach chat error:', error);
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: ERROR_TEXT } : m)));
      setFailedRetry({ userText, assistantId });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const userText = (overrideText ?? input).trim();
    if (!userText || isStreaming || !user) return;

    setInput('');
    const priorHistory = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    const userMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString(),
    };
    const assistantId = `local-${Date.now()}-a`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
    ]);
    saveMessage(user.uid, 'user', userText).catch((e) => console.error('Failed to save message:', e));

    await streamAssistantReply(userText, assistantId, priorHistory);
  };

  const handleRetry = () => {
    if (!failedRetry) return;
    const { userText, assistantId } = failedRetry;
    const priorHistory = messages
      .filter((m) => m.id !== assistantId)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: '' } : m)));
    streamAssistantReply(userText, assistantId, priorHistory);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-61px)] items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
          <p className="text-text-muted">Loading your coach…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-61px)] flex-col bg-background">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(false)} />

      {/* Header — strapline rendered in MentorVoice per theme-decision:
          "the mentor's voice" signature device for everything the AI knows about the user. */}
      <div className="border-b border-border px-4 py-3.5">
        <h1 className="font-serif text-lg font-semibold text-foreground">Thrive Mentor</h1>
        <p className="text-xs text-text-muted">
          <MentorVoice>
            {hasModel ? 'Knows your goals, history, and whole picture' : 'Getting to know you. Just start talking'}
          </MentorVoice>
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {/* Empty state — single FadeIn, no looping animation (motion guidelines). */}
          {messages.length === 0 && (
            <FadeIn>
              <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken px-6 py-10 text-center">
                <p className="mb-4 text-sm text-text-muted">
                  Say hello, or try one of these to get started:
                </p>
                {/* Suggested-prompt chips at sunken elevation with designed hover/focus-visible states.
                    Transition ≤150ms (--duration-fast) per elevation ladder + motion guidelines. */}
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      disabled={isStreaming}
                      className={[
                        'rounded-full border border-border bg-surface-sunken px-3.5 py-1.5 text-sm text-text-body',
                        'transition-[border-color,color,box-shadow] duration-[150ms] ease-standard',
                        'hover:border-accent hover:text-accent',
                        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:border-accent',
                        'active:scale-[0.98]',
                        'disabled:opacity-50 disabled:pointer-events-none',
                        'min-h-[44px]',
                      ].join(' ')}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          {/* Message list — each bubble FadeIns once on mount (keyed by stable m.id).
              Streaming updates content via setMessages map (no key change → no remount →
              the FadeIn does not re-fire during streaming). Text inside is never animated. */}
          {messages.map((m) => {
            // A logged check-in appends "✓ Logged (…)" to the reply. Render the
            // reply as a normal bubble and ONLY the confirmation line as a chip,
            // instead of swallowing the whole message into the chip style.
            const logIndex = m.role === 'assistant' ? m.content.indexOf('✓ Logged') : -1;
            const replyText = logIndex === -1 ? m.content : m.content.slice(0, logIndex).trim();
            const logText = logIndex === -1 ? null : m.content.slice(logIndex).trim();
            return (
              <FadeIn key={m.id}>
                <div className="flex flex-col gap-2">
                  {replyText && <ChatBubble role={m.role} content={replyText} />}
                  {logText && <ActionChip content={logText} />}
                </div>
              </FadeIn>
            );
          })}

          {failedRetry && (
            <div className="flex justify-start">
              <Button variant="outline" size="sm" onClick={handleRetry} disabled={isStreaming}>
                <RotateCcw className="size-3.5" /> Try again
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Input area at sunken elevation (−1 on the ladder) per theme-decision elevation rules. */}
      <div className="border-t border-border bg-surface-sunken px-4 py-3.5">
        <div className="mx-auto flex max-w-2xl items-end gap-2.5">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach anything…"
            className="min-h-[44px] resize-none"
            rows={1}
            disabled={isStreaming}
          />
          <Button
            onClick={() => handleSend()}
            variant="primary"
            size="icon"
            disabled={isStreaming || !input.trim()}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
