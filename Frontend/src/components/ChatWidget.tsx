import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User as UserIcon, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChatWidgetProps {
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  customerName?: string; // Optional customer name to display instead of "customer"
}

export function ChatWidget({ messages, onSendMessage, placeholder = 'Type a message...', className, customerName }: ChatWidgetProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<React.ElementRef<typeof ScrollArea>>(null);

  const scrollToBottom = () => {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      if (scrollRef.current) {
        // Find the viewport element inside ScrollArea
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage('');
      // Scroll after message is sent
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'ai':
        return <Bot className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'ai':
        return 'bg-accent text-accent-foreground';
      case 'admin':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <div className={cn('flex flex-col h-full border rounded-lg bg-card overflow-hidden', className)}>
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.message_id} className="flex gap-3 items-start">
              <div className={cn('p-2 rounded-full flex-shrink-0', getSenderColor(message.sender_type))}>
                {getSenderIcon(message.sender_type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.sender_type === 'admin' 
                      ? 'Valio Aimo'
                      : message.sender_type === 'customer' && customerName
                      ? customerName
                      : message.sender_type === 'customer'
                      ? 'Customer'
                      : message.sender_type === 'ai'
                      ? 'AI Assistant'
                      : message.sender_type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t flex-shrink-0 bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={placeholder}
            disabled={isSending}
          />
          <Button onClick={handleSend} disabled={isSending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
