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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const messages = activeChat?.messages ?? [];
  const sources = activeChat?.sources ?? [];
  const hasSources = sources.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          activeChat={activeChat}
          onNewChat={createChat}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onSourceAdded={(src) => addSource(activeChatId, src)}
          onSourceDeleted={removeSource}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(true)} title="Open sidebar">
              <PanelLeft size={16} />
            </Button>
          )}
          <span className="truncate text-sm text-muted-foreground">
            {activeChat?.title ?? 'New Chat'}
          </span>
        </header>

        {/* Page content — ChatPage renders here */}
        <ChatPage
          chatId={activeChatId}
          messages={messages}
          isLoading={isLoading}
          hasSources={hasSources}
          onSend={handleSend}
          onSourceAdded={(src) => addSource(activeChatId, src)}
        />

        {/* Outlet: available for future nested routes */}
        <Outlet />
      </div>
    </div>
  );
}
