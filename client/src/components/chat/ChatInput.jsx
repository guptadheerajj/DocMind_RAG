import { useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ChatInput({ onSend, isLoading, hasSources }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const canSend = value.trim().length > 0 && !isLoading && hasSources;

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) submit();
    }
  }

  function submit() {
    const q = value.trim();
    if (!q) return;
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSend(q);
  }

  function handleInput(e) {
    setValue(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const lineH = parseInt(getComputedStyle(el).lineHeight);
      el.style.height = Math.min(el.scrollHeight, lineH * 5) + 'px';
    }
  }

  const placeholder = !hasSources
    ? 'Add a PDF or URL first…'
    : isLoading
    ? 'Waiting for response…'
    : 'Ask a question  (Enter to send)';

  return (
    <div className="border-t border-border px-4 pb-4 pt-2.5 shrink-0">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading || !hasSources}
          rows={1}
          className="min-h-[42px] max-h-[130px] flex-1 resize-none py-2.5 text-sm leading-relaxed"
        />
        <Button
          size="icon"
          className="h-[42px] w-[42px] shrink-0"
          onClick={submit}
          disabled={!canSend}
        >
          {isLoading
            ? <Loader2 size={15} className="animate-spin" />
            : <Send size={15} />}
        </Button>
      </div>
      {hasSources && (
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
          DocMind can make mistakes. Verify important information.
        </p>
      )}
    </div>
  );
}
