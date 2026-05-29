import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/hooks/useChatStore';
import { sendMessage } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatPage from '@/pages/ChatPage';

export default function MainLayout() {
  // Default: open on desktop (≥768px), closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  );
  const [isLoading, setIsLoading] = useState(false);

  const {
    chats, activeChatId, activeChat,
    createChat, selectChat, deleteChat,
    addMessage, addSource, removeSource,
  } = useChatStore();

  async function handleSend(question) {
    if (!activeChatId || isLoading) return;
    addMessage(activeChatId, { role: 'user', content: question });
    setIsLoading(true);
    try {
      const data = await sendMessage(activeChatId, question);
      addMessage(activeChatId, { role: 'assistant', content: data.answer, sources: data.sources ?? [] });
    } catch (err) {
      addMessage(activeChatId, { role: 'assistant', content: `⚠️ ${err.message}`, sources: [] });
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // On mobile, close sidebar after selecting a chat
  function handleSelectChat(chatId) {
    selectChat(chatId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }

  // On mobile, close sidebar after creating a new chat
  function handleNewChat() {
    createChat();
    if (window.innerWidth < 768) setSidebarOpen(false);
  }

  const messages = activeChat?.messages ?? [];
  const sources  = activeChat?.sources  ?? [];
  const hasSources = sources.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Mobile backdrop — click outside to close sidebar ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar
            Mobile  → fixed overlay (z-50), slides in from left
            Desktop → normal flex child, in flow                  */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-50 md:relative md:inset-auto md:z-auto">
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            activeChat={activeChat}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={deleteChat}
            onSourceAdded={(src) => addSource(activeChatId, src)}
            onSourceDeleted={removeSource}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
          {/* Hamburger — always visible on mobile, visible on desktop only when closed */}
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setSidebarOpen(true)}
              title="Open sidebar"
            >
              <PanelLeft size={16} />
            </Button>
          )}
          <span className="truncate text-sm text-muted-foreground">
            {activeChat?.title ?? 'New Chat'}
          </span>
        </header>

        {/* Page */}
        <ChatPage
          chatId={activeChatId}
          messages={messages}
          isLoading={isLoading}
          hasSources={hasSources}
          onSend={handleSend}
          onSourceAdded={(src) => addSource(activeChatId, src)}
        />

        <Outlet />
      </div>
    </div>
  );
}
