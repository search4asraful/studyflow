'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '../../components/layout/AppShell';
import { apiRequest } from '../../lib/api';
import { StudyRoom } from '@studyflow/shared';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Users, Clock, ArrowRight, KeyRound, Loader2, Search } from 'lucide-react';
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

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 divider-subtle">
        <div>
          <h1 className="heading-page">
            Study Rooms
          </h1>
          <p className="subheading-page">
            Join a synchronized Pomodoro room or start a new session for your group.
          </p>
        </div>

        <Link href="/rooms/create">
          <Button variant="primary" size="md" className="gap-2 font-semibold">
            <Plus className="w-4 h-4" />
            Create Study Room
          </Button>
        </Link>
      </div>

      {/* Join via Code Box */}
      <div className="card-base p-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <KeyRound className="w-4 h-4" />
            <span>Join with Room Invitation Code</span>
          </div>
          <p className="text-xs text-foreground-secondary mb-4">
            Have a unique room code from a teammate? Enter it below to join their workspace immediately.
          </p>

          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. FOCUS2026"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="input-base flex-1 font-mono uppercase tracking-wider"
            />
            <Button type="submit" variant="primary" size="md" isLoading={isJoining}>
              Join Room
            </Button>
          </form>
        </div>
      </div>

      {/* Search and Room Listing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Available Rooms ({filteredRooms.length})
          </h2>

          <div className="relative w-64">
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

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-16 card-subtle border-dashed">
            <p className="text-sm text-foreground-secondary">No study rooms match your search.</p>
            <p className="text-xs text-foreground-muted mt-1">
              Create a new room or ask a friend for their invite code.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="card-interactive p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge variant={room.isPrivate ? 'default' : 'accent'} size="sm">
                      {room.isPrivate ? 'Private' : 'Public'}
                    </Badge>
                    <span className="font-mono text-xs text-foreground-muted">#{room.inviteCode}</span>
                  </div>

                  <h3 className="text-base font-bold text-foreground leading-snug">{room.name}</h3>
                  <p className="text-xs text-foreground-secondary mt-2 line-clamp-2 leading-relaxed">
                    {room.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 divider-subtle space-y-4">
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {room.memberCount || 1} members
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.round(room.focusDuration / 60)}m Focus
                    </span>
                  </div>

                  <Link href={`/rooms/${room.id}`} className="block">
                    <Button variant="secondary" size="md" className="w-full gap-2">
                      Enter Workspace
                      <ArrowRight className="w-4 h-4" />
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
