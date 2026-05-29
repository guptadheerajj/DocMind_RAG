import { MessageSquare, PanelLeftClose, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ChatList from './ChatList';
import SourcePanel from './SourcePanel';
import AddSourceDialog from '@/components/upload/AddSourceDialog';

export default function Sidebar({ chats, activeChatId, activeChat, onNewChat, onSelectChat, onDeleteChat, onSourceAdded, onSourceDeleted, onClose }) {
  return (
    <aside className="sidebar animate-slide-in flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-border shrink-0">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MessageSquare size={12} />
        </div>
        <span className="flex-1 text-sm font-semibold tracking-tight">DocMind</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onClose} title="Close sidebar">
          <PanelLeftClose size={14} />
        </Button>
      </div>

      {/* Action row */}
      <div className="flex gap-1.5 px-2.5 py-2 shrink-0">
        <Button variant="outline" size="sm" className="flex-1 justify-start gap-2 h-8 text-xs" onClick={onNewChat}>
          <Plus size={13} /> New Chat
        </Button>
        <AddSourceDialog chatId={activeChatId} onSourceAdded={onSourceAdded} />
      </div>

      <Separator />

      {/* Chat list */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatList chats={chats} activeChatId={activeChatId} onSelect={onSelectChat} onDelete={onDeleteChat} />
      </div>

      <Separator />

      {/* Sources */}
      <SourcePanel
        chatId={activeChatId}
        sources={activeChat?.sources ?? []}
        onSourceDeleted={(srcId) => onSourceDeleted(activeChatId, srcId)}
      />
    </aside>
  );
}
