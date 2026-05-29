import ChatArea from '@/components/chat/ChatArea';
import ChatInput from '@/components/chat/ChatInput';

export default function ChatPage({ messages, isLoading, hasSources, onSend }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ChatArea messages={messages} isLoading={isLoading} hasSources={hasSources} />
      <ChatInput onSend={onSend} isLoading={isLoading} hasSources={hasSources} />
    </div>
  );
}
