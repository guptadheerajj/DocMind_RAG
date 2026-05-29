import { MessageSquare, PanelLeftClose, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ChatList from './ChatList';
import SourcePanel from './SourcePanel';

export default function Sidebar({
  chats, activeChatId, activeChat,
  onNewChat, onSelectChat, onDeleteChat,
  onSourceAdded, onSourceDeleted, onClose,
}) {
  return (
    <aside className="sidebar animate-slide-in flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-border shrink-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MessageSquare size={13} />
        </div>
        <span className="flex-1 text-sm font-semibold tracking-tight">DocMind</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={onClose}
          title="Close sidebar"
        >
          <PanelLeftClose size={14} />
        </Button>
      </div>

      {/* ── New Chat button ─────────────────────────────────────── */}
      <div className="px-2.5 py-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs"
          onClick={onNewChat}
        >
          <Plus size={13} />
          New Chat
        </Button>
      </div>

      <Separator />

      {/* ── Chat list ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelect={onSelectChat}
          onDelete={onDeleteChat}
        />
      </div>

      <Separator />

      {/* ── Source panel ─────────────────────────────────────────── */}
      <SourcePanel
        chatId={activeChatId}
        sources={activeChat?.sources ?? []}
        onSourceAdded={onSourceAdded}
        onSourceDeleted={(srcId) => onSourceDeleted(activeChatId, srcId)}
      />
    </aside>
  );
}
