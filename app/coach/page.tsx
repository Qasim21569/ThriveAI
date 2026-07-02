'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import type { User } from 'firebase/auth';
import { getUserPlans, getPlan } from '@/lib/firebase/plans';
import { saveMessage, getRecentMessages, type ChatMessage } from '@/lib/firebase/messages';
import { summarizePlanForPrompt } from '@/lib/coach/context';
import AuthModal from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
  const [planSummary, setPlanSummary] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load auth, active plan summary, and recent message history on mount.
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setUser(u);
      try {
        const [plans, history] = await Promise.all([
          getUserPlans(u.uid),
          getRecentMessages(u.uid, 20),
        ]);
        setMessages(history);

        if (plans[0]) {
          const fullPlan = await getPlan(u.uid, plans[0].id);
          if (fullPlan) {
            setPlanSummary(summarizePlanForPrompt(fullPlan.type, fullPlan.data));
          }
        }
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
    const text = input.trim();
    if (!text || isStreaming || !user) return;

    setInput('');
    const priorHistory = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    const userMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const assistantId = `local-${Date.now()}-a`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
    ]);
    saveMessage(user.uid, 'user', text).catch((e) => console.error('Failed to save message:', e));

    setIsStreaming(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ message: text, planSummary, history: priorHistory }),
      });

      if (!res.ok || !res.body) throw new Error(`Chat request failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m)),
        );
      }

      if (fullText) {
        saveMessage(user.uid, 'assistant', fullText).catch((e) =>
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
            {planSummary ? 'Knows your active plan' : 'No plan yet — create one for personalized advice'}
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
            <ChatBubble key={m.id} role={m.role} content={m.content} />
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
