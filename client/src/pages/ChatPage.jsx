import ChatArea from '@/components/chat/ChatArea';
import ChatInput from '@/components/chat/ChatInput';
import WelcomeScreen from '@/components/chat/WelcomeScreen';

export default function ChatPage({ chatId, messages, isLoading, hasSources, onSend, onSourceAdded }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {hasSources ? (
        <ChatArea chatId={chatId} messages={messages} isLoading={isLoading} hasSources={hasSources} />
      ) : (
        <WelcomeScreen chatId={chatId} onSourceAdded={onSourceAdded} />
      )}
      <ChatInput onSend={onSend} isLoading={isLoading} hasSources={hasSources} />
    </div>
  );
}
