'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface RoomInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  inviteCode: string;
}

export const RoomInviteModal: React.FC<RoomInviteModalProps> = ({
  isOpen,
  onClose,
  roomName,
  inviteCode,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/rooms?code=${inviteCode}`
      : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    toast.success('Invite code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast.success('Invite link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Members to Room"
      description={`Invite teammates to join "${roomName}"`}
    >
      <div className="space-y-4 my-2">
        {/* Large Invite Code Box */}
        <div className="card-subtle p-5 text-center">
          <span className="text-xs uppercase tracking-widest text-foreground-muted">Room Invite Code</span>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-3xl font-mono font-bold tracking-widest text-accent">
              {inviteCode}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="p-2"
              title="Copy code"
            >
              {copiedCode ? (
                <Check className="w-4 h-4 text-accent" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs text-foreground-secondary">Direct Invite Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="input-base flex-1 select-all"
            />
            <Button variant="secondary" size="sm" onClick={handleCopyLink}>
              {copiedLink ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-foreground-muted leading-relaxed">
          Anyone with this code can join this study room, share the synchronized Pomodoro session,
          and collaborate on common tasks.
        </p>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="md" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
