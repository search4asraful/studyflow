'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '../../components/layout/AppShell';
import { apiRequest } from '../../lib/api';
import { StudyRoom } from '@studyflow/shared';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Plus,
  Users,
  Clock,
  ArrowRight,
  KeyRound,
  Loader2,
  Search,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

function RoomsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code') || '';

  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState(codeParam);
  const [isJoining, setIsJoining] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await apiRequest<StudyRoom[]>('/rooms');
        setRooms(data);
      } catch (err: any) {
        toast.error(err.message || 'Failed to fetch rooms');
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, []);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsJoining(true);
    try {
      const room = await apiRequest<StudyRoom>('/rooms/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      });
      toast.success(`Joined room: ${room.name}!`);
      router.push(`/rooms/${room.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to join room. Please check the code.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied invite code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchFilter.toLowerCase()));

    const matchesType =
      filterType === 'ALL' ||
      (filterType === 'PUBLIC' && !r.isPrivate) ||
      (filterType === 'PRIVATE' && r.isPrivate);

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-page">Study Rooms</h1>
          <p className="subheading-page">
            Collaborate in synchronized real-time Pomodoro study rooms with shared task boards.
          </p>
        </div>

        <Link href="/rooms/create">
          <Button variant="primary" size="md" className="gap-2 font-semibold shadow-md shadow-accent/25">
            <Plus className="w-4 h-4" />
            Create Study Room
          </Button>
        </Link>
      </div>

      {/* Join via Code Hero Card */}
      <div className="card-elevated p-6 sm:p-7 border-accent/25 relative overflow-hidden">
        <div className="max-w-xl relative z-10">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-accent">
            <KeyRound className="w-4 h-4" />
            <span>Direct Invitation Access</span>
          </div>
          <p className="text-xs text-foreground-secondary mb-4 leading-relaxed">
            Have an 8-character room invitation code from a classmate or teammate? Enter it below to join their workspace instantly.
          </p>

          <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. FOCUS2026"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="input-base flex-1 font-mono uppercase tracking-wider text-sm"
              maxLength={12}
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isJoining}
              className="whitespace-nowrap font-semibold px-6"
            >
              Join Room
            </Button>
          </form>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Available Workspaces ({filteredRooms.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border">
              {(['ALL', 'PUBLIC', 'PRIVATE'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    filterType === type
                      ? 'bg-accent text-white font-semibold shadow-2xs'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="input-base pl-8 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Room Listing Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-16 card-subtle border-dashed">
            <p className="text-sm font-semibold text-foreground">No study rooms match your search.</p>
            <p className="text-xs text-foreground-muted mt-1">
              Create a new room above or ask your group for their invite code.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="card-interactive p-6 flex flex-col justify-between group hover:border-accent/60"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge variant={room.isPrivate ? 'default' : 'accent'} size="sm">
                      {room.isPrivate ? 'Private' : 'Public'}
                    </Badge>
                    <button
                      onClick={(e) => handleCopyCode(room.inviteCode, e)}
                      className="flex items-center gap-1 font-mono text-xs text-foreground-muted hover:text-accent cursor-pointer transition-colors"
                      title="Click to copy invite code"
                    >
                      {copiedCode === room.inviteCode ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>#{room.inviteCode}</span>
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-accent transition-colors">
                    {room.name}
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-2 line-clamp-2 leading-relaxed">
                    {room.description || 'No description provided for this room.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 space-y-3">
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-accent" />
                      {room.memberCount || 1} members
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      {Math.round(room.focusDuration / 60)}m Focus
                    </span>
                  </div>

                  <Link href={`/rooms/${room.id}`} className="block">
                    <Button variant="secondary" size="md" className="w-full gap-2 group-hover:bg-accent group-hover:text-white transition-all font-semibold">
                      Enter Workspace
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="text-xs text-foreground-muted">Loading rooms...</div>}>
        <RoomsContent />
      </Suspense>
    </AppShell>
  );
}
