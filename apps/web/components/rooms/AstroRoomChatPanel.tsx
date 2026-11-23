'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  MessageSquare,
  Users,
  ArrowLeft,
  Lock,
  Sparkles,
  AtSign,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { RoomMember } from '@studyflow/shared';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string;
  avatarUrl: string;
  isOnline: boolean;
}

export const WORKSPACE_MEMBERS: WorkspaceMember[] = [
  {
    id: 'sarah-chen',
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@astro.io',
    role: 'MEMBER',
    title: 'Lead Propulsion Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    isOnline: true,
  },
  {
    id: 'marcus-vance',
    name: 'Marcus Vance',
    email: 'marcus.v@astro.io',
    role: 'MEMBER',
    title: 'Avionics Architect',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    isOnline: true,
  },
  {
    id: 'elena-rostova',
    name: 'Elena Rostova',
    email: 'elena.r@astro.io',
    role: 'MEMBER',
    title: 'Orbital Mechanics Specialist',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    isOnline: true,
  },
];

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isSystem?: boolean;
  type?: 'chat' | 'activity';
}

interface AstroRoomChatPanelProps {
  onSendMessage?: (message: string) => void;
  className?: string;
  incomingActivities?: Array<{
    id: string;
    action: string;
    userName: string;
    details?: string;
    createdAt: string;
    userId?: string;
  }>;
  members?: RoomMember[];
}

const QUICK_REACTIONS = ['🔥', '👏', '🧠', '☕', '🎯', '💯'];

export const AstroRoomChatPanel: React.FC<AstroRoomChatPanelProps> = ({
  onSendMessage,
  className = '',
  incomingActivities,
  members,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionPopoverRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const authUser = useAuthStore((s) => s.user);
  const currentUser: WorkspaceMember = useMemo(
    () => ({
      id: authUser?.id || 'current-user',
      name: authUser?.name || 'You',
      email: authUser?.email || '',
      role: 'OWNER',
      title: 'Workspace Member',
      avatarUrl: authUser?.avatarUrl || '',
      isOnline: true,
    }),
    [authUser]
  );

  const activeMembers: WorkspaceMember[] = useMemo(() => {
    if (members && members.length > 0) {
      return members
        .filter((m) => m.userId !== currentUser.id)
        .map((m) => ({
          id: m.userId,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          title: m.role === 'OWNER' ? 'Room Host' : m.role === 'MODERATOR' ? 'Moderator' : 'Study Partner',
          avatarUrl: m.user.avatarUrl || '',
          isOnline: Boolean(m.isOnline),
        }));
    }
    return WORKSPACE_MEMBERS;
  }, [members, currentUser.id]);

  // Active top tab: 'chat' | 'members'
  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');

  // 1-on-1 Private Chat state: null means group room chat, or a specific member
  const [privateChatMember, setPrivateChatMember] = useState<WorkspaceMember | null>(null);

  // Group room chat messages (clean real-time feed without dummy text)
  const [roomMessages, setRoomMessages] = useState<ChatMessageItem[]>([]);

  // Private 1-on-1 threads isolated per member ID
  const [privateThreads, setPrivateThreads] = useState<Record<string, ChatMessageItem[]>>({
    'sarah-chen': [
      {
        id: 'priv-sarah-1',
        senderId: 'sarah-chen',
        senderName: 'Dr. Sarah Chen',
        senderAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
        content: 'Hey Asraful, I updated the star tracker optical calibration loop. Ready to review whenever you have a moment.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        type: 'chat',
      },
      {
        id: 'priv-asraful-1',
        senderId: 'asraful-islam',
        senderName: 'Md. Asraful Islam',
        content: 'Great work @Dr. Sarah Chen! I will test the quaternions matrix right after this focus session.',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        type: 'chat',
      },
    ],
    'marcus-vance': [
      {
        id: 'priv-marcus-1',
        senderId: 'marcus-vance',
        senderName: 'Marcus Vance',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        content: 'Solar array motorized actuator tests showed zero torque overshoot across 12 cycles. Ready to move to COMPLETED.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        type: 'chat',
      },
    ],
    'elena-rostova': [
      {
        id: 'priv-elena-1',
        senderId: 'elena-rostova',
        senderName: 'Elena Rostova',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        content: 'Telemetry streaming protobuf schema draft is published to backlog. Check it out when free!',
        timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        type: 'chat',
      },
    ],
  });

  // Chat input string
  const [inputText, setInputText] = useState('');

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  // Sync incoming socket activities and chat messages into room feed without duplicates
  useEffect(() => {
    if (!incomingActivities || incomingActivities.length === 0) return;

    setRoomMessages((prev) => {
      let updated = [...prev];
      let hasChanges = false;

      for (const act of incomingActivities) {
        // Skip if this exact activity ID is already present
        if (updated.some((m) => m.id === act.id)) {
          continue;
        }

        if (act.action === 'CHAT_MESSAGE') {
          const messageText = act.details || '';
          const actTime = new Date(act.createdAt).getTime();

          // Check if there is an optimistic local message with the same content sent recently
          const optimisticIndex = updated.findIndex(
            (m) =>
              m.type === 'chat' &&
              m.content.trim() === messageText.trim() &&
              (m.senderName === act.userName || m.senderId === currentUser.id) &&
              Math.abs(new Date(m.timestamp).getTime() - actTime) < 15000
          );

          if (optimisticIndex !== -1) {
            // Reconcile optimistic ID with the server activity ID (prevents double message!)
            updated[optimisticIndex] = {
              ...updated[optimisticIndex],
              id: act.id,
              timestamp: act.createdAt,
            };
            hasChanges = true;
          } else {
            // Message from another participant: render as a real chat bubble
            updated.push({
              id: act.id,
              senderId: act.userId || 'participant',
              senderName: act.userName,
              content: messageText,
              timestamp: act.createdAt,
              type: 'chat',
            });
            hasChanges = true;
          }
        } else {
          // Non-chat system activity announcement (timer phase, tasks, joins)
          let cleanText = '';
          if (act.details) {
            cleanText = act.details.startsWith(act.userName)
              ? act.details
              : `${act.userName}: ${act.details}`;
          } else {
            cleanText = `${act.userName} ${act.action.replace(/_/g, ' ').toLowerCase()}`;
          }

          updated.push({
            id: act.id,
            senderId: 'system',
            senderName: act.userName,
            content: cleanText,
            timestamp: act.createdAt,
            isSystem: true,
            type: 'activity',
          });
          hasChanges = true;
        }
      }

      return hasChanges ? updated : prev;
    });
  }, [incomingActivities]);

  // Chronological Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (feedScrollRef.current) {
      feedScrollRef.current.scrollTo({
        top: feedScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [roomMessages, privateThreads, privateChatMember, activeTab]);

  // Animate view transition when switching between Room Chat and 1-on-1 Private Chat
  const handleOpenPrivateChat = (member: WorkspaceMember) => {
    setActiveTab('chat');
    setPrivateChatMember(member);

    if (contentAreaRef.current) {
      gsap.fromTo(
        contentAreaRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  };

  const handleBackToRoomChat = () => {
    setPrivateChatMember(null);

    if (contentAreaRef.current) {
      gsap.fromTo(
        contentAreaRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  };

  // Mention Autocomplete detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1) {
      const query = textBeforeCursor.slice(lastAtIdx + 1);
      if (!query.includes(' ') || query.length <= 15) {
        setMentionQuery(query.toLowerCase());
        setMentionIndex(0);
        return;
      }
    }
    setMentionQuery(null);
  };

  // Filter mentionable members
  const allWorkspaceMembers = [currentUser, ...activeMembers];
  const filteredMentionMembers =
    mentionQuery !== null
      ? allWorkspaceMembers.filter(
          (m) =>
            m.name.toLowerCase().includes(mentionQuery) ||
            m.email.toLowerCase().includes(mentionQuery)
        )
      : [];

  // Animate mention popover opening
  useGSAP(
    () => {
      if (mentionQuery !== null && mentionPopoverRef.current) {
        gsap.fromTo(
          mentionPopoverRef.current,
          { opacity: 0, y: 8, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
        );
      }
    },
    { dependencies: [mentionQuery !== null] }
  );

  const handleSelectMention = (member: WorkspaceMember) => {
    if (!inputRef.current) return;

    const val = inputText;
    const cursorPos = inputRef.current.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPos);
    const textAfterCursor = val.slice(cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1) {
      const newText =
        textBeforeCursor.slice(0, lastAtIdx) + `@${member.name} ` + textAfterCursor;
      setInputText(newText);
      setMentionQuery(null);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newPos = lastAtIdx + member.name.length + 2;
          inputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 10);
    }
  };

  // Keyboard navigation for chat input and mention popover
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery !== null && filteredMentionMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((idx) => (idx + 1) % filteredMentionMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(
          (idx) => (idx - 1 + filteredMentionMembers.length) % filteredMentionMembers.length
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredMentionMembers[mentionIndex];
        if (selected) handleSelectMention(selected);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text) return;

    const newMessage: ChatMessageItem = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: text,
      timestamp: new Date().toISOString(),
      type: 'chat',
    };

    if (privateChatMember) {
      setPrivateThreads((prev) => ({
        ...prev,
        [privateChatMember.id]: [...(prev[privateChatMember.id] || []), newMessage],
      }));
    } else {
      setRoomMessages((prev) => [...prev, newMessage]);
      if (onSendMessage) onSendMessage(text);
    }

    setInputText('');
    setMentionQuery(null);
  };

  const handleQuickReaction = (emoji: string) => {
    handleSend(emoji);
  };

  // Helper to format chat message text and render @mentions as clickable pills
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(@[A-Za-z0-9 ._-]+)/g);

    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const rawName = part.slice(1).trim();
        const matchedMember = allWorkspaceMembers.find(
          (m) => m.name.toLowerCase() === rawName.toLowerCase()
        );

        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (matchedMember && matchedMember.id !== currentUser.id) {
                handleOpenPrivateChat(matchedMember);
              }
            }}
            className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded-md bg-accent/20 text-accent hover:bg-accent/30 border border-accent/40 text-[11px] font-semibold cursor-pointer transition-colors"
            title={matchedMember ? `Click to private chat with ${matchedMember.name}` : undefined}
          >
            <AtSign className="w-2.5 h-2.5 text-accent" />
            <span>{rawName}</span>
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const activeMessages = privateChatMember
    ? privateThreads[privateChatMember.id] || []
    : roomMessages;

  const chatMessagesCount = roomMessages.filter((m) => m.type === 'chat').length;

  return (
    <div
      ref={panelRef}
      className={cn(
        'card-glass flex flex-col h-full rounded-2xl border border-border bg-surface/90 backdrop-blur-xl shadow-xl overflow-hidden relative transition-colors duration-200',
        className
      )}
    >
      {/* Top Header Strip: Tabs or 1-on-1 Private Chat Status */}
      {privateChatMember ? (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-elevated border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={handleBackToRoomChat}
              className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
              title="Back to Room Chat"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="relative shrink-0">
              {privateChatMember.avatarUrl ? (
                <img
                  src={privateChatMember.avatarUrl}
                  alt={privateChatMember.name}
                  className="w-7 h-7 rounded-full object-cover border border-accent/50"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs text-accent font-bold">
                  {privateChatMember.name.charAt(0)}
                </div>
              )}
              <span className="w-2 h-2 rounded-full bg-emerald-400 border-2 border-surface-elevated absolute -bottom-0.5 -right-0.5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground truncate">
                  {privateChatMember.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Private (1:1)
                </span>
              </div>
              <p className="text-[10px] text-foreground-muted truncate">{privateChatMember.title}</p>
            </div>
          </div>

          <button
            onClick={handleBackToRoomChat}
            className="text-[11px] text-foreground-muted hover:text-accent hover:underline px-2 py-1 cursor-pointer transition-colors"
          >
            Room Chat
          </button>
        </div>
      ) : (
        <div className="p-2.5 bg-surface-elevated/70 border-b border-border shrink-0 space-y-2">
          {/* Tabs: Live Chat 2 vs Members (3) */}
          <div className="flex items-center gap-1 p-1 bg-surface-subtle rounded-xl border border-border">
            <button
              onClick={() => {
                setActiveTab('chat');
              }}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer',
                activeTab === 'chat'
                  ? 'bg-accent text-white shadow-md shadow-accent/25'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Chat</span>
              {chatMessagesCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/20 text-white">
                  {chatMessagesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('members');
              }}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer',
                activeTab === 'members'
                  ? 'bg-accent text-white shadow-md shadow-accent/25'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members ({activeMembers.length})</span>
            </button>
          </div>

          {/* ROOM CHAT & ACTIVITY Status Sub-header */}
          <div className="flex items-center justify-between px-1 text-[11px] font-mono">
            <span className="text-foreground-muted font-semibold tracking-wider uppercase text-[10px]">
              ROOM CHAT & ACTIVITY
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        </div>
      )}

      {/* Main Panel Content Area */}
      <div ref={contentAreaRef} className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'members' && !privateChatMember ? (
          /* Members (3) Tab View with 1-on-1 Private Chat launchers */
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            <div className="px-1 py-1">
              <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider">
                Online Members ({activeMembers.length})
              </span>
            </div>

            {activeMembers.map((member) => (
              <div
                key={member.id}
                className="group flex items-center justify-between p-2.5 rounded-xl bg-surface-elevated/70 hover:bg-surface-elevated border border-border hover:border-accent/40 transition-all duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center font-bold text-xs">
                        {(member.name || 'M').charAt(0)}
                      </div>
                    )}
                    <span className="w-2 h-2 rounded-full bg-emerald-400 border border-surface-elevated absolute -bottom-0.5 -right-0.5" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-foreground truncate">
                      {member.name}
                    </h4>
                    <p className="text-[10px] text-foreground-muted truncate">{member.title}</p>
                  </div>
                </div>

                <Button
                  onClick={() => handleOpenPrivateChat(member)}
                  size="sm"
                  variant="outline"
                  className="text-[11px] py-1 px-2.5 rounded-lg border-border hover:border-accent text-accent hover:bg-accent hover:text-white transition-all cursor-pointer whitespace-nowrap gap-1 font-semibold"
                >
                  <MessageSquare className="w-3 h-3" />
                  Message
                </Button>
              </div>
            ))}

            {/* Current User Card */}
            <div className="mt-4 pt-3 border-t border-border-subtle">
              <div className="px-1 py-1">
                <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider">
                  You
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle border border-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs text-accent font-bold shrink-0">
                    {(currentUser.name || 'U').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-foreground truncate">
                      {currentUser.name}
                    </h4>
                    <p className="text-[10px] text-foreground-muted truncate">{currentUser.title}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full badge-accent bg-accent/15 text-accent border border-accent/30 font-bold">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Chronological Chat Feed (Oldest top, Newest bottom, Auto-scroll) */
          <div
            ref={feedScrollRef}
            className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-0"
          >
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-foreground-muted space-y-2">
                <MessageSquare className="w-8 h-8 opacity-40 text-foreground-muted" />
                <p className="text-xs">No messages yet. Send a note or mention someone with @</p>
              </div>
            ) : (
              activeMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;

                if (msg.isSystem) {
                  return (
                    <div
                      key={msg.id}
                      className="flex items-center justify-center my-2 text-[10px] font-mono text-foreground-muted text-center px-2 py-1 rounded-lg bg-surface-subtle border border-border-subtle gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-accent shrink-0" />
                      <span className="truncate">{msg.content}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col space-y-1 max-w-[85%]',
                      isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                    )}
                  >
                    {/* Sender & Timestamp */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground-muted px-1">
                      <span className={cn('font-semibold', isMe ? 'text-accent' : 'text-foreground-secondary')}>
                        {msg.senderName}
                      </span>
                      <span>•</span>
                      <span>{format(new Date(msg.timestamp), 'HH:mm')}</span>
                    </div>

                    {/* Chat Bubble */}
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm transition-all',
                        isMe
                          ? 'bg-accent text-white rounded-tr-xs shadow-accent/20'
                          : 'bg-surface-elevated text-foreground rounded-tl-xs border border-border'
                      )}
                    >
                      {renderMessageContent(msg.content)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Mention Autocomplete Popover */}
      {mentionQuery !== null && filteredMentionMembers.length > 0 && (
        <div
          ref={mentionPopoverRef}
          className="absolute bottom-28 inset-x-3 bg-surface-elevated border border-accent/40 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 backdrop-blur-xl"
        >
          <div className="px-2 py-1 border-b border-border flex items-center justify-between text-[10px] font-mono text-foreground-muted">
            <span>MENTION WORKSPACE MEMBER</span>
            <span>↑↓ to navigate • ↵ select</span>
          </div>

          <div className="max-h-36 overflow-y-auto py-0.5 space-y-0.5">
            {filteredMentionMembers.map((member, index) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelectMention(member)}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer',
                  index === mentionIndex
                    ? 'bg-accent text-white font-semibold'
                    : 'text-foreground hover:bg-surface-subtle'
                )}
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] text-accent font-bold shrink-0">
                    {member.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="truncate block">{member.name}</span>
                </div>
                <span className="text-[10px] opacity-70 font-mono shrink-0">
                  {member.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Message Input Strip */}
      <div className="p-3 bg-surface-elevated/70 border-t border-border shrink-0 space-y-2">
        {/* Quick Reaction Emoji Strip */}
        <div className="flex items-center gap-1.5 justify-between px-0.5">
          <div className="flex items-center gap-1">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleQuickReaction(emoji)}
                className="w-7 h-7 rounded-lg bg-surface-subtle hover:bg-surface-elevated active:scale-90 border border-border flex items-center justify-center text-xs transition-transform cursor-pointer"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-mono text-foreground-muted">
            {privateChatMember ? '1:1 Private' : 'Type @ for mentions'}
          </span>
        </div>

        {/* Input & Send Form */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder={
                privateChatMember
                  ? `Message ${privateChatMember.name.split(' ')[0]} privately...`
                  : 'Message room or type @ to mention...'
              }
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="input-base bg-surface-subtle border border-border focus:border-accent text-foreground placeholder:text-foreground-muted"
            />
          </div>

          <Button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            size="sm"
            className="btn-primary bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-xl px-3 py-2 shrink-0 cursor-pointer transition-all shadow-md shadow-accent/25"
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
