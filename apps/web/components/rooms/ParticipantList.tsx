'use client';

import React from 'react';
import { RoomMember } from '@studyflow/shared';
import { Badge } from '../ui/Badge';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';

interface ParticipantListProps {
  members: RoomMember[];
  onOpenInviteModal: () => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  members,
  onOpenInviteModal,
}) => {
  const onlineCount = members.filter((m) => m.isOnline).length;

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between pb-3 mb-3 divider-subtle">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Participants ({members.length})
          </h3>
        </div>
        <span className="text-[11px] text-foreground-muted">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mr-1" />
          {onlineCount} online
        </span>
      </div>

      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between p-2 rounded-xl card-subtle"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {member.user.avatarUrl ? (
                  <img
                    src={member.user.avatarUrl}
                    alt={member.user.name}
                    className="w-7 h-7 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border text-accent flex items-center justify-center font-bold text-xs">
                    {member.user.name.charAt(0)}
                  </div>
                )}
                {/* Online presence dot */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                    member.isOnline ? 'bg-accent' : 'bg-foreground-muted'
                  }`}
                  title={member.isOnline ? 'Online' : 'Offline'}
                />
              </div>

              <div>
                <p className="text-xs font-medium text-foreground leading-tight">
                  {member.user.name}
                </p>
                <p className="text-[10px] text-foreground-muted">{member.user.email}</p>
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
        className="w-full mt-4 text-xs gap-1.5"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Invite Room Member
      </Button>
    </div>
  );
};
