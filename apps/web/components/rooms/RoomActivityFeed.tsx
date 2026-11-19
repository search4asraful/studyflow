'use client';

import React, { useState } from 'react';
import { RoomActivity } from '@studyflow/shared';
import { Activity, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RoomActivityFeedProps {
  activities: RoomActivity[];
  onSendMessage: (message: string) => void;
}

export const RoomActivityFeed: React.FC<RoomActivityFeedProps> = ({
  activities,
  onSendMessage,
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage('');
  };

  return (
    <div className="card-base p-5 flex flex-col h-80">
      <div className="flex items-center gap-2 pb-3 mb-2 divider-subtle">
        <Activity className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Room Activity &amp; Chat
        </h3>
      </div>

      {/* Activity Timeline */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
        {activities.length === 0 ? (
          <p className="text-foreground-muted text-center pt-8">No recent activity</p>
        ) : (
          activities.map((a) => {
            const isChat = a.action === 'CHAT_MESSAGE';

            return (
              <div
                key={a.id}
                className={`p-2 rounded-xl ${
                  isChat
                    ? 'card-subtle'
                    : 'bg-transparent text-foreground-secondary'
                }`}
              >
                <div className="flex items-baseline justify-between gap-1">
                  <span className={`font-semibold ${isChat ? 'text-accent' : 'text-foreground'}`}>
                    {a.userName}
                  </span>
                  <span className="text-[10px] text-foreground-muted">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-foreground-secondary mt-0.5 break-words">
                  {a.details || a.action.replace('_', ' ').toLowerCase()}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Live Chat input */}
      <form onSubmit={handleSubmit} className="mt-3 pt-2.5 divider-subtle flex gap-2">
        <input
          type="text"
          placeholder="Send a message to room..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input-base flex-1 py-1.5 text-xs"
        />
        <button
          type="submit"
          className="btn-secondary p-2 rounded-xl text-accent"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
