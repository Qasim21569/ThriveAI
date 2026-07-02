'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import type { User } from 'firebase/auth';
import { saveMessage, getRecentMessages, type ChatMessage } from '@/lib/firebase/messages';
import { saveCheckin } from '@/lib/firebase/checkins';
import { buildCoachContext } from '@/lib/coach/context';
import { logCheckinArgsSchema, extractToolCall } from '@/lib/coach/tools';
import AuthModal from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function ChatBubble({ role, content, isAction }: { role: 'user' | 'assistant'; content: string; isAction?: boolean }) {
  const me = role === 'user';

  if (isAction) {
    return (
      <div className="flex justify-start">
        <div className="flex max-w-[80%] items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-4 py-2.5 text-sm text-success">
          <CheckCircle2 className="size-4 flex-shrink-0" />
          <span>{content}</span>
        </div>
      </div>
    );
  }

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
  const [hasPlan, setHasPlan] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
          buildCoachContext(u.uid, idToken),
        ]);
        setMessages(history);
        setContextBlock(ctx.contextBlock || undefined);
        setHasPlan(ctx.hasPlan);
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

  const handleSend = async () => {
    const userText = input.trim();
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
        // Strip the marker live so it never flashes on screen mid-stream —
        // it only ever appears in the last chunk, but this keeps every
        // intermediate render clean regardless.
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: extractToolCall(rawText).text } : m)),
        );
      }

      const { text, toolCall } = extractToolCall(rawText);
      let finalText = text;

      if (toolCall?.name === 'log_checkin') {
        // Defense in depth: the server already validated this, but we
        // re-validate here since the payload crossed another boundary
        // (the HTTP response body) before reaching code that acts on it.
        const parsed = logCheckinArgsSchema.safeParse(toolCall.arguments);
        if (parsed.success) {
          const { type, summary } = parsed.data;
          try {
            await saveCheckin(user.uid, type, summary);
            const confirmation = `✓ Logged (${type}): ${summary}`;
            finalText = text ? `${text}\n\n${confirmation}` : confirmation;
          } catch (error) {
            console.error('Failed to save check-in:', error);
            finalText = text || "I tried to log that but couldn't save it — please try again.";
          }
        } else {
          console.error('Tool call arguments failed client-side validation:', parsed.error.flatten());
          finalText = text || "I couldn't quite understand what to log — could you rephrase?";
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: finalText } : m)),
      );

      if (finalText) {
        saveMessage(user.uid, 'assistant', finalText).catch((e) =>
          console.error('Failed to save message:', e),
        );
      }
    } catch (error) {
      console.error('Coach chat error:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, I couldn't respond just now. Please try again." }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
          <p className="text-text-muted">Loading your coach…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(false)} />

      <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Back to dashboard"
          className="inline-flex size-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="font-serif text-lg font-semibold text-foreground">Thrive Coach</h1>
          <p className="text-xs text-text-muted">
            {hasPlan ? 'Knows your active plan and recent check-ins' : 'No plan yet — create one for personalized advice'}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.length === 0 && (
            <div className="rounded-lg border border-dashed border-border-strong bg-surface-sunken px-6 py-10 text-center text-sm text-text-muted">
              Say hello to start your first conversation with your coach.
            </div>
          )}
          {messages.map((m) => (
            <ChatBubble
              key={m.id}
              role={m.role}
              content={m.content}
              isAction={m.role === 'assistant' && m.content.includes('✓ Logged')}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border px-4 py-3.5">
        <div className="mx-auto flex max-w-2xl items-end gap-2.5">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach anything…"
            className="min-h-[44px] resize-none"
            rows={1}
            disabled={isStreaming}
          />
          <Button
            onClick={handleSend}
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
