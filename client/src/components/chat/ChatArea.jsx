import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageBubble from './MessageBubble';

export default function ChatArea({ chatId, messages, isLoading, hasSources }) {
  const viewportRef = useRef(null);
  const bottomRef = useRef(null);

  // Scroll to bottom when new messages or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  // Jump to top (instant) when switching to a different chat
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
  }, [chatId]);

  return (
    <ScrollArea className="flex-1" viewportRef={viewportRef}>
      <div className="mx-auto flex max-w-3xl flex-col px-4 py-6">

        {/* Empty state — sources exist but no messages yet */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 opacity-60">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
              <MessageSquare size={24} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="mb-1.5 text-base font-semibold text-foreground">Ready to chat</p>
              <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
                Ask anything about your {hasSources ? 'sources' : 'uploaded documents or URLs'}.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="animate-fade-in mt-3 flex justify-start py-1">
            <div className="msg-ai px-4 py-3">
              <div className="flex items-center gap-1.5 h-4">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
