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
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { RoomMember } from '@studyflow/shared';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { playChatSound } from '../../lib/audio';

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
  onSendMessage?: (message: string, recipientId?: string) => void;
  className?: string;
  incomingActivities?: Array<{
    id: string;
    action: string;
    userName: string;
    details?: string;
    createdAt: string;
    userId?: string;
    recipientId?: string;
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

  // Group room chat messages (clean real-time feed)
  const [roomMessages, setRoomMessages] = useState<ChatMessageItem[]>([]);

  // Private 1-on-1 threads isolated per member ID
  const [privateThreads, setPrivateThreads] = useState<Record<string, ChatMessageItem[]>>({});

  // Chat input string
  const [inputText, setInputText] = useState('');

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  // Incoming message indicators
  const [unreadRoomCount, setUnreadRoomCount] = useState<number>(0);
  const [unreadDirect, setUnreadDirect] = useState<Record<string, number>>({});
  const [incomingDirectAlert, setIncomingDirectAlert] = useState<{
    senderId: string;
    senderName: string;
    content: string;
  } | null>(null);

  const isInitialMountRef = useRef(true);
  const processedActivityIdsRef = useRef<Set<string>>(new Set());

  // Total direct unread across all members
  const totalUnreadDirect = useMemo(
    () => Object.values(unreadDirect).reduce((sum, count) => sum + count, 0),
    [unreadDirect]
  );

  // Sync incoming socket activities and chat messages into room feed without duplicates
  useEffect(() => {
    if (!incomingActivities || incomingActivities.length === 0) return;

    const isInitial = isInitialMountRef.current;
    if (isInitial) {
      incomingActivities.forEach((act) => processedActivityIdsRef.current.add(act.id));
      isInitialMountRef.current = false;
    }

    setRoomMessages((prev) => {
      let updated = [...prev];
      let hasChanges = false;

      for (const act of incomingActivities) {
        const isNewActivity = !processedActivityIdsRef.current.has(act.id);
        processedActivityIdsRef.current.add(act.id);

        if (updated.some((m) => m.id === act.id)) {
          continue;
        }

        if (act.action === 'DIRECT_CHAT') {
          const isFromMe = act.userId === currentUser.id;
          const otherUserId = isFromMe ? act.recipientId : act.userId;
          if (otherUserId) {
            const messageText = act.details || '';
            const actTime = new Date(act.createdAt).getTime();

            // Audio chime & indicator for new incoming direct message from someone else
            if (isNewActivity && !isFromMe) {
              playChatSound();

              if (!privateChatMember || privateChatMember.id !== act.userId) {
                setUnreadDirect((prevUnread) => ({
                  ...prevUnread,
                  [otherUserId]: (prevUnread[otherUserId] || 0) + 1,
                }));

                setIncomingDirectAlert({
                  senderId: otherUserId,
                  senderName: act.userName,
                  content: messageText,
                });
              }
            }

            setPrivateThreads((prevThreads) => {
              const list = [...(prevThreads[otherUserId] || [])];
              if (list.some((m) => m.id === act.id)) return prevThreads;

              // Reconcile optimistic message sent by me to eliminate duplication
              const optimisticIndex = list.findIndex(
                (m) =>
                  m.content.trim() === messageText.trim() &&
                  (m.senderId === currentUser.id || m.senderName === act.userName) &&
                  Math.abs(new Date(m.timestamp).getTime() - actTime) < 15000
              );

              if (optimisticIndex !== -1) {
                list[optimisticIndex] = {
                  ...list[optimisticIndex],
                  id: act.id,
                  timestamp: act.createdAt,
                };
                return {
                  ...prevThreads,
                  [otherUserId]: list,
                };
              }

              return {
                ...prevThreads,
                [otherUserId]: [
                  ...list,
                  {
                    id: act.id,
                    senderId: act.userId || 'participant',
                    senderName: act.userName,
                    content: messageText,
                    timestamp: act.createdAt,
                    type: 'chat',
                  },
                ],
              };
            });
          }
          continue;
        }

        if (act.action === 'CHAT_MESSAGE') {
          const messageText = act.details || '';
          const actTime = new Date(act.createdAt).getTime();
          const isFromMe = act.userId === currentUser.id;

          // Audio chime & indicator for new room messages from others
          if (isNewActivity && !isFromMe) {
            playChatSound();
            if (activeTab !== 'chat' || privateChatMember !== null) {
              setUnreadRoomCount((c) => c + 1);
            }
          }

          const optimisticIndex = updated.findIndex(
            (m) =>
              m.type === 'chat' &&
              m.content.trim() === messageText.trim() &&
              (m.senderName === act.userName || m.senderId === currentUser.id) &&
              Math.abs(new Date(m.timestamp).getTime() - actTime) < 15000
          );

          if (optimisticIndex !== -1) {
            updated[optimisticIndex] = {
              ...updated[optimisticIndex],
              id: act.id,
              timestamp: act.createdAt,
            };
            hasChanges = true;
          } else {
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
  }, [incomingActivities, currentUser.id, privateChatMember, activeTab]);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (feedScrollRef.current) {
      feedScrollRef.current.scrollTo({
        top: feedScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [roomMessages, privateThreads, privateChatMember, activeTab]);

  const handleOpenPrivateChat = (member: WorkspaceMember) => {
    setActiveTab('chat');
    setPrivateChatMember(member);

    // Clear unread for this member
    setUnreadDirect((prev) => {
      if (!prev[member.id]) return prev;
      const updated = { ...prev };
      delete updated[member.id];
      return updated;
    });

    if (incomingDirectAlert?.senderId === member.id) {
      setIncomingDirectAlert(null);
    }

    if (contentAreaRef.current) {
      gsap.fromTo(
        contentAreaRef.current,
        { opacity: 0, x: 10 },
        { opacity: 1, x: 0, duration: 0.2, ease: 'power2.out' }
      );
    }
  };

  const handleBackToRoomChat = () => {
    setPrivateChatMember(null);
    setUnreadRoomCount(0);

    if (contentAreaRef.current) {
      gsap.fromTo(
        contentAreaRef.current,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.2, ease: 'power2.out' }
      );
    }
  };

  const handleSelectChatTab = () => {
    setActiveTab('chat');
    if (!privateChatMember) {
      setUnreadRoomCount(0);
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

  const allWorkspaceMembers = useMemo(
    () => [currentUser, ...activeMembers],
    [currentUser, activeMembers]
  );

  const filteredMentionMembers = useMemo(
    () =>
      mentionQuery !== null
        ? allWorkspaceMembers.filter(
            (m) =>
              m.name.toLowerCase().includes(mentionQuery) ||
              m.email.toLowerCase().includes(mentionQuery)
          )
        : [],
    [mentionQuery, allWorkspaceMembers]
  );

  useGSAP(
    () => {
      if (mentionQuery !== null && mentionPopoverRef.current) {
        gsap.fromTo(
          mentionPopoverRef.current,
          { opacity: 0, y: 4, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.15, ease: 'power2.out' }
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
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
      if (onSendMessage) onSendMessage(text, privateChatMember.id);
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
            className="inline-flex items-center gap-0.5 mx-0.5 px-1 py-0.2 rounded bg-accent/20 text-accent hover:bg-accent/30 text-[10px] font-semibold cursor-pointer transition-colors"
            title={matchedMember ? `Chat with ${matchedMember.name}` : undefined}
          >
            <AtSign className="w-2.5 h-2.5" />
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
        'flex flex-col h-full min-h-0 rounded-2xl border border-border/80 bg-surface/90 backdrop-blur-xl shadow-xs overflow-hidden relative transition-colors duration-200',
        className
      )}
    >
      {/* Streamlined Header */}
      {privateChatMember ? (
        <div className="flex items-center justify-between px-3 py-2 bg-surface-elevated/70 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleBackToRoomChat}
              className="p-1 -ml-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
              title="Back to Room Chat"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <div className="relative shrink-0">
              {privateChatMember.avatarUrl ? (
                <img
                  src={privateChatMember.avatarUrl}
                  alt={privateChatMember.name}
                  className="w-5 h-5 rounded-full object-cover border border-accent/40"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[10px] text-accent font-bold">
                  {privateChatMember.name.charAt(0)}
                </div>
              )}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-1 ring-surface-elevated" />
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-foreground truncate">
                {privateChatMember.name}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold flex items-center gap-0.5 shrink-0">
                <Lock className="w-2 h-2" />
                1:1
              </span>
            </div>
          </div>

          <button
            onClick={handleBackToRoomChat}
            className="p-1 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
            title="Close private chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="px-2.5 py-2 bg-surface-elevated/60 border-b border-border/80 shrink-0">
          {/* Segmented Control using full width */}
          <div className="flex items-center gap-1 p-0.5 bg-surface-subtle rounded-xl border border-border/60 w-full">
            <button
              type="button"
              onClick={handleSelectChatTab}
              className={cn(
                'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative',
                activeTab === 'chat' && !privateChatMember
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Room Chat</span>
              {unreadRoomCount > 0 && (activeTab !== 'chat' || privateChatMember !== null) ? (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                  +{unreadRoomCount}
                </span>
              ) : chatMessagesCount > 0 ? (
                <span
                  className={cn(
                    'text-[9px] font-mono px-1.5 py-0.2 rounded-full',
                    activeTab === 'chat' && !privateChatMember
                      ? 'bg-black/25 text-white'
                      : 'bg-surface-elevated text-foreground-muted border border-border/60'
                  )}
                >
                  {chatMessagesCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={cn(
                'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative',
                activeTab === 'members'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members ({activeMembers.length + 1})</span>
              {totalUnreadDirect > 0 && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                  +{totalUnreadDirect}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Panel Content Area */}
      <div ref={contentAreaRef} className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Incoming Direct Message Notification Banner */}
        {incomingDirectAlert && (
          <div className="mx-2.5 mt-2 mb-1 p-2 rounded-xl bg-accent/10 border border-accent/30 text-foreground flex items-center justify-between gap-2 shadow-2xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate">
                  {incomingDirectAlert.senderName}
                </p>
                <p className="text-[10px] text-foreground-muted truncate max-w-[180px]">
                  {incomingDirectAlert.content}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const sender = allWorkspaceMembers.find(
                    (m) => m.id === incomingDirectAlert.senderId
                  );
                  if (sender) handleOpenPrivateChat(sender);
                  setIncomingDirectAlert(null);
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer"
              >
                Reply
              </button>
              <button
                type="button"
                onClick={() => setIncomingDirectAlert(null)}
                className="p-1 text-foreground-muted hover:text-foreground rounded transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'members' && !privateChatMember ? (
          /* Members List */
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="px-1 py-0.5 flex items-center justify-between text-[10px] font-mono text-foreground-muted uppercase tracking-wider">
              <span>Active Participants</span>
              <span>{activeMembers.length + 1} online</span>
            </div>

            {/* Member Cards */}
            {activeMembers.map((member) => {
              const unreadCount = unreadDirect[member.id] || 0;
              return (
                <div
                  key={member.id}
                  className="group flex items-center justify-between p-2 rounded-xl bg-surface-elevated/60 hover:bg-surface-elevated border border-border/80 hover:border-accent/40 transition-all duration-150"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-7 h-7 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 text-accent flex items-center justify-center font-bold text-xs">
                          {(member.name || 'M').charAt(0)}
                        </div>
                      )}
                      <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-surface-elevated absolute -bottom-0.5 -right-0.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-semibold text-foreground truncate leading-tight">
                          {member.name}
                        </h4>
                        {unreadCount > 0 && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-foreground-muted truncate leading-tight mt-0.5">
                        {member.title}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleOpenPrivateChat(member)}
                    size="sm"
                    variant={unreadCount > 0 ? 'primary' : 'outline'}
                    className={cn(
                      'h-7 px-2.5 text-[10px] rounded-lg transition-all cursor-pointer shrink-0 gap-1 font-medium',
                      unreadCount > 0
                        ? 'bg-accent text-white hover:bg-accent-hover shadow-xs'
                        : 'border-border hover:border-accent text-accent hover:bg-accent hover:text-white'
                    )}
                    title={`Direct message ${member.name}`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>{unreadCount > 0 ? 'Reply' : 'Chat'}</span>
                  </Button>
                </div>
              );
            })}

            {/* Current User Card */}
            <div className="pt-2 mt-2 border-t border-border/60">
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle/80 border border-border/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-xs text-accent font-bold shrink-0">
                    {(currentUser.name || 'U').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-foreground truncate leading-tight">
                      {currentUser.name} (You)
                    </h4>
                    <p className="text-[10px] text-foreground-muted truncate leading-tight mt-0.5">
                      {currentUser.title}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold">
                  Host
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Chronological Chat Feed */
          <div
            ref={feedScrollRef}
            className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0"
          >
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[140px] text-center text-foreground-muted space-y-1.5 py-6">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <MessageSquare className="w-4 h-4 opacity-75" />
                </div>
                <p className="text-xs font-medium text-foreground-secondary">
                  {privateChatMember
                    ? `Direct chat with ${privateChatMember.name}`
                    : 'No messages yet'}
                </p>
                <p className="text-[11px] text-foreground-muted max-w-[200px]">
                  Send a live note, reaction, or mention someone with @
                </p>
              </div>
            ) : (
              activeMessages.map((msg, index) => {
                const isMe = msg.senderId === currentUser.id;
                const prevMsg = index > 0 ? activeMessages[index - 1] : null;

                const isSameSenderAsPrev =
                  !msg.isSystem &&
                  !prevMsg?.isSystem &&
                  prevMsg?.senderId === msg.senderId &&
                  Math.abs(new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime()) < 120000;

                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="flex items-center justify-center my-1.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-subtle border border-border/60 text-[10px] font-mono text-foreground-muted max-w-[95%]">
                        <Sparkles className="w-2.5 h-2.5 text-accent shrink-0" />
                        <span className="truncate">{msg.content}</span>
                        <span className="text-foreground-muted/60 shrink-0">
                          {format(new Date(msg.timestamp), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col max-w-[85%]',
                      isMe ? 'ml-auto items-end' : 'mr-auto items-start',
                      isSameSenderAsPrev ? 'mt-0.5' : 'mt-2'
                    )}
                  >
                    {!isSameSenderAsPrev && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground-muted px-1 mb-0.5">
                        <span className={cn('font-semibold', isMe ? 'text-accent' : 'text-foreground-secondary')}>
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        <span>•</span>
                        <span>{format(new Date(msg.timestamp), 'HH:mm')}</span>
                      </div>
                    )}

                    <div
                      className={cn(
                        'rounded-2xl px-3 py-1.5 text-xs leading-relaxed shadow-2xs transition-all break-words',
                        isMe
                          ? 'bg-accent text-white rounded-tr-xs shadow-accent/20'
                          : 'bg-surface-elevated text-foreground rounded-tl-xs border border-border/80'
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
          className="absolute bottom-full mb-1.5 inset-x-3 bg-surface-elevated border border-accent/40 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 backdrop-blur-xl"
        >
          <div className="px-2 py-1 border-b border-border flex items-center justify-between text-[9px] font-mono text-foreground-muted">
            <span>MENTION MEMBER</span>
            <span>↑↓ navigate • ↵ select</span>
          </div>

          <div className="max-h-32 overflow-y-auto py-0.5 space-y-0.5">
            {filteredMentionMembers.map((member, index) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelectMention(member)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left text-xs transition-colors cursor-pointer',
                  index === mentionIndex
                    ? 'bg-accent text-white font-medium'
                    : 'text-foreground hover:bg-surface-subtle'
                )}
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-[9px] text-accent font-bold shrink-0">
                    {member.name.charAt(0)}
                  </div>
                )}
                <span className="truncate flex-1 text-xs">{member.name}</span>
                <span className="text-[9px] opacity-70 font-mono shrink-0">
                  {member.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Message Input Strip */}
      <div className="p-2.5 bg-surface-elevated/70 border-t border-border/80 shrink-0 space-y-2">
        {/* Quick Reaction Emojis & Hint */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleQuickReaction(emoji)}
                className="w-6 h-6 rounded-lg bg-surface-subtle hover:bg-surface-elevated active:scale-90 border border-border/80 flex items-center justify-center text-xs transition-transform cursor-pointer"
                title={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <span className="text-[9px] font-mono text-foreground-muted/70">
            {privateChatMember ? '1:1 Private' : '@ to mention'}
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
                  ? `Message ${privateChatMember.name.split(' ')[0]}...`
                  : 'Message room or @mention...'
              }
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full h-9 px-3 rounded-xl bg-surface-subtle border border-border/80 focus:border-accent text-xs text-foreground placeholder:text-foreground-muted focus:outline-hidden transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="h-9 w-9 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-white shrink-0 cursor-pointer transition-all flex items-center justify-center shadow-xs active:scale-95"
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
