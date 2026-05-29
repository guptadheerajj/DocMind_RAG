import { MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function ChatList({ chats, activeChatId, onSelect, onDelete }) {
  if (chats.length === 0) {
    return (
      <p className="px-3 py-4 text-center text-xs text-muted-foreground">
        No chats yet. Click "New Chat" to start.
      </p>
    );
  }

  return (
    <ScrollArea className="h-full">
      <ul className="flex flex-col gap-0.5 px-2 py-1.5">
        {chats.map((chat) => {
          const isActive = chat.id === activeChatId;
          return (
            <li
              key={chat.id}
              onClick={() => onSelect(chat.id)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <MessageSquare
                size={12}
                className={cn('shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}
              />
              <span className="flex-1 truncate font-medium leading-5">
                {chat.title}
              </span>
              {/* Delete button — always visible */}
              <Button
                variant="ghost"
                size="icon-xs"
                className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}
                title="Delete chat"
              >
                <Trash2 size={11} />
              </Button>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
