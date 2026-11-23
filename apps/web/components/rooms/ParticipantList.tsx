'use client';

import React from 'react';
import { RoomMember } from '@studyflow/shared';
import { Badge } from '../ui/Badge';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';

interface ParticipantListProps {
  members: RoomMember[];
  onOpenInviteModal: () => void;
  className?: string;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  members,
  onOpenInviteModal,
  className = '',
}) => {
  const onlineCount = members.filter((m) => m.isOnline).length;

  return (
    <div className={`card-base p-5 space-y-4 flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Room Participants ({members.length})
          </h3>
        </div>
        <span className="text-[11px] font-mono text-foreground-muted flex items-center gap-1.5 bg-surface-subtle px-2 py-0.5 rounded-full border border-border">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {onlineCount} active
        </span>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between p-2.5 rounded-xl card-subtle hover:border-accent/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {member.user.avatarUrl ? (
                  <img
                    src={member.user.avatarUrl}
                    alt={member.user.name}
                    className="w-8 h-8 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center font-bold text-xs">
                    {member.user.name.charAt(0)}
                  </div>
                )}
                {/* Online presence dot */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                    member.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-foreground-muted'
                  }`}
                  title={member.isOnline ? 'Online now' : 'Offline'}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {member.user.name}
                </p>
                <p className="text-[10px] text-foreground-muted font-mono">{member.user.email}</p>
              </div>
            </div>

            <Badge
              variant={
                member.role === 'OWNER'
                  ? 'accent'
                  : member.role === 'MODERATOR'
                  ? 'warning'
                  : 'default'
              }
              size="sm"
            >
              {member.role}
            </Badge>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onOpenInviteModal}
        className="w-full text-xs gap-1.5"
      >
        <UserPlus className="w-3.5 h-3.5 text-accent" />
        Invite Teammates
      </Button>
    </div>
  );
};
