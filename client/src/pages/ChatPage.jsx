import { useState, useEffect } from 'react';
import ChatArea from '@/components/chat/ChatArea';
import ChatInput from '@/components/chat/ChatInput';
import WelcomeScreen from '@/components/chat/WelcomeScreen';

export default function ChatPage({ chatId, messages, isLoading, hasSources, onSend, onSourceAdded }) {
  // Track whether WelcomeScreen has an in-progress upload or scrape.
  // Even if hasSources becomes true (first source done), we keep showing
  // WelcomeScreen until isBusy goes false (all ops finished).
  const [isBusy, setIsBusy] = useState(false);

  // Reset busy flag whenever the user switches to a different chat
  useEffect(() => {
    setIsBusy(false);
  }, [chatId]);

  // Show WelcomeScreen while:
  //  (a) no sources at all, OR
  //  (b) sources exist but operations are still running
  const showWelcome = !hasSources || isBusy;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {showWelcome ? (
        <WelcomeScreen
          chatId={chatId}
          onSourceAdded={onSourceAdded}
          onBusyChange={setIsBusy}
        />
      ) : (
        <ChatArea chatId={chatId} messages={messages} isLoading={isLoading} hasSources={hasSources} />
      )}

      {/* Chat input is disabled until WelcomeScreen is fully done */}
      <ChatInput
        onSend={onSend}
        isLoading={isLoading}
        hasSources={hasSources && !isBusy}
      />
    </div>
  );
}
