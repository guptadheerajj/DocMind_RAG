import { useState } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function ChatList({ chats, activeChatId, onSelect, onDelete }) {
  const [hoveredId, setHoveredId] = useState(null);

  if (chats.length === 0) {
    return (
      <p className="px-3 py-4 text-center text-xs text-muted-foreground">
        No chats yet.
      </p>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <ul className="flex flex-col gap-0.5 px-2 py-1">
        {chats.map((chat) => {
          const isActive = chat.id === activeChatId;
          return (
            <li
              key={chat.id}
              onMouseEnter={() => setHoveredId(chat.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelect(chat.id)}
              className={cn(
                'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <MessageSquare
                size={13}
                className={cn('shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}
              />
              <span className="flex-1 truncate font-medium text-xs leading-5">
                {chat.title}
              </span>
              {(hoveredId === chat.id || isActive) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}
                >
                  <Trash2 size={11} />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
