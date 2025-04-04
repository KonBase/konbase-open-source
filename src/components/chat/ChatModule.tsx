
import { useState, useEffect, useRef } from 'react';
import { Send, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { ChatMessage } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUserProfile } from '@/hooks/useUserProfile';

export function ChatModule() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<{id: string, name: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { currentAssociation } = useAssociation();
  
  useEffect(() => {
    if (user && currentAssociation) {
      fetchMessages();
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('chat-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT', 
            schema: 'public',
            table: 'chat_messages',
            filter: `association_id=eq.${currentAssociation.id}`
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();
      
      // Set up presence tracking
      const presenceChannel = supabase.channel('online-users');
      
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const presentUsers = Object.values(state).flat() as any[];
          setOnlineUsers(presentUsers);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log('user joined', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.log('user left', leftPresences);
        })
        .subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') { return }
          
          const userStatus = {
            id: user.id,
            name: profile?.name || user.email || 'Unknown user',
            online_at: new Date().toISOString(),
          };
          
          await presenceChannel.track(userStatus);
        });
      
      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(presenceChannel);
      };
    }
  }, [user, currentAssociation]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchMessages = async () => {
    if (!user || !currentAssociation) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('association_id', currentAssociation.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if (!user || !currentAssociation || !message.trim()) return;
    
    try {
      const newMessage = {
        association_id: currentAssociation.id,
        sender_id: user.id,
        sender_name: profile?.name || user.email || 'Unknown user',
        message: message.trim(),
      };
      
      const { error } = await supabase
        .from('chat_messages')
        .insert(newMessage);
      
      if (error) throw error;
      
      // Clear input after sending
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  if (!currentAssociation) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <p className="text-muted-foreground">Select an association to start chatting</p>
      </Card>
    );
  }
  
  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="px-4 py-2 flex-row justify-between items-center">
        <CardTitle className="text-lg">Association Chat</CardTitle>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Users className="h-4 w-4 mr-2" />
              Online Users
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Online Association Members</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4">
              {onlineUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users online</p>
              ) : (
                onlineUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">Online now</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent className="p-4 flex-grow overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{msg.sender_name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      {!isMe && (
                        <span className="text-xs text-muted-foreground mb-1">
                          {msg.sender_name}
                        </span>
                      )}
                      <div 
                        className={`rounded-lg py-2 px-3 ${
                          isMe 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2">
        <form 
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
