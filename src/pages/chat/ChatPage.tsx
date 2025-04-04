
import { ChatModule } from '@/components/chat/ChatModule';

const ChatPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground">
          Chat with other association members in real-time.
        </p>
      </div>

      <ChatModule />
    </div>
  );
};

export default ChatPage;
