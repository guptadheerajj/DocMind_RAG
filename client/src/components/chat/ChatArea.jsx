import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function ChatArea({ chatId, messages, isLoading, hasSources }) {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  // Smooth-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  // Jump to top instantly when switching to a different chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [chatId]);

  return (
    // Native overflow scroll — far more reliable than ScrollArea inside flex containers.
    // min-h-0 is critical: flex items default min-height to "auto" which blocks shrinking.
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto min-h-0"
    >
      <div className="mx-auto flex max-w-3xl flex-col px-4 py-6">

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 opacity-60">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
              <MessageSquare size={24} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="mb-1.5 text-base font-semibold text-foreground">Ready to chat</p>
              <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
                {hasSources
                  ? 'Ask anything about your uploaded documents or URLs.'
                  : 'Add a PDF or URL from the sidebar, then ask any question.'}
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
    </div>
  );
}
