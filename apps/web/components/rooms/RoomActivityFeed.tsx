'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RoomActivity } from '@studyflow/shared';
import { Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

interface RoomActivityFeedProps {
  activities: RoomActivity[];
  onSendMessage: (message: string) => void;
  className?: string;
}

const QUICK_EMOJIS = ['🔥', '👏', '🧠', '☕', '🎯', '💯'];

export const RoomActivityFeed: React.FC<RoomActivityFeedProps> = ({
  activities,
  onSendMessage,
  className = '',
}) => {
  const [message, setMessage] = useState('');
  const currentUser = useAuthStore((s) => s.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new activities / messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const prevActivitiesLen = useRef(activities.length);
  useEffect(() => {
    scrollToBottom('smooth');
    prevActivitiesLen.current = activities.length;
  }, [activities.length]);

  // Initial scroll to bottom immediately on mount
  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleQuickEmoji = (emoji: string) => {
    onSendMessage(emoji);
  };

  return (
    <div className={cn('card-base p-0 flex flex-col h-full min-h-0 overflow-hidden border-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated/40 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Room Chat &amp; Activity
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {/* Messages Scroll Area (Chronological: Older at top, Newest at bottom) */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 text-xs"
      >
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-foreground-muted text-center py-8">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-accent" />
            <p className="text-xs font-semibold text-foreground-secondary">No messages yet</p>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              Say hello or react with an emoji below!
            </p>
          </div>
        ) : (
          activities.map((act) => {
            const isChat = act.action === 'CHAT_MESSAGE';
            const isMe = currentUser && (act.userId === currentUser.id || act.userName === currentUser.name);

            if (!isChat) {
              // System activity announcement (Timer changes, joins, task actions)
              return (
                <div key={act.id} className="flex justify-center my-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle border border-border-subtle text-[10px] text-foreground-muted font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span>{act.details || act.action.replace(/_/g, ' ').toLowerCase()}</span>
                    <span className="text-foreground-muted/60">
                      {format(new Date(act.createdAt), 'HH:mm')}
                    </span>
                  </div>
                </div>
              );
            }

            // Realtime User Chat Message
            return (
              <div
                key={act.id}
                className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}
              >
                {/* Sender Name & Time */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-foreground-muted font-mono">
                  <span className={cn('font-semibold', isMe ? 'text-accent' : 'text-foreground')}>
                    {isMe ? 'You' : act.userName}
                  </span>
                  <span>•</span>
                  <span>{format(new Date(act.createdAt), 'HH:mm')}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    'max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-xs',
                    isMe
                      ? 'bg-accent text-white rounded-tr-xs shadow-accent/20'
                      : 'bg-surface-elevated text-foreground border border-border rounded-tl-xs'
                  )}
                >
                  {act.details}
                </div>
              </div>
            );
          })
        )}
        {/* Invisible anchor to scroll into view */}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Reaction Bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-t border-border bg-surface-subtle/50 shrink-0">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickEmoji(emoji)}
            className="p-1 hover:bg-surface-elevated rounded-lg text-sm transition-transform hover:scale-125 cursor-pointer"
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Field Pinned at Bottom */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-surface shrink-0 flex gap-2">
        <input
          type="text"
          placeholder="Type a message to the room..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input-base flex-1 py-2 text-xs"
        />
        <button
          type="submit"
          className="btn-primary px-3.5 py-2 rounded-xl text-white shadow-xs"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
