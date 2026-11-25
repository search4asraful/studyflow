'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Wifi,
  WifiOff,
  Activity,
  Users,
  RefreshCw,
  Radio,
  Sparkles,
} from 'lucide-react';
import { getSocket, measureSocketPing, reconnectSocket } from '../../lib/socket';
import { useRoomStore } from '../../stores/roomStore';
import { cn } from '../../lib/utils';

export const OnlineActivityStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Active room data from roomStore
  const room = useRoomStore((s) => s.room);
  const members = useRoomStore((s) => s.members);

  const onlineMemberCount = useMemo(() => {
    if (!room || !members) return 0;
    return members.filter((m) => m.isOnline).length;
  }, [room, members]);

  const pingServer = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!navigator.onLine) {
      setLatency(null);
      return;
    }

    setIsChecking(true);
    try {
      const socket = getSocket();
      if (!socket.connected) {
        socket.connect();
      }
      const rtt = await measureSocketPing();
      setLatency(rtt);
      setSocketConnected(socket.connected);
    } catch {
      setLatency(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleReconnect = useCallback(async () => {
    setIsChecking(true);
    reconnectSocket();
    await pingServer();
  }, [pingServer]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initial browser online state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      pingServer();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSocketConnected(false);
      setLatency(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Track Socket.IO connection status
    const socket = getSocket();
    setSocketConnected(socket.connected);

    const onSocketConnect = () => {
      setSocketConnected(true);
      pingServer();
    };

    const onSocketDisconnect = () => {
      setSocketConnected(false);
      setLatency(null);
    };

    socket.on('connect', onSocketConnect);
    socket.on('disconnect', onSocketDisconnect);

    const handleCustomConnected = () => {
      setSocketConnected(true);
      pingServer();
    };
    const handleCustomDisconnected = () => {
      setSocketConnected(false);
      setLatency(null);
    };

    window.addEventListener('studyflow:socket-connected', handleCustomConnected);
    window.addEventListener('studyflow:socket-disconnected', handleCustomDisconnected);
    window.addEventListener('studyflow:socket-reconnected', handleCustomConnected);

    // Initial ping measurement
    pingServer();

    // Periodic ping every 18 seconds to keep latency fresh & detect stale links
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        pingServer();
      }
    }, 18000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('studyflow:socket-connected', handleCustomConnected);
      window.removeEventListener('studyflow:socket-disconnected', handleCustomDisconnected);
      window.removeEventListener('studyflow:socket-reconnected', handleCustomConnected);
      socket.off('connect', onSocketConnect);
      socket.off('disconnect', onSocketDisconnect);
      clearInterval(interval);
    };
  }, [pingServer]);

  // Overall status classification
  const statusState = useMemo(() => {
    if (!isOnline) {
      return {
        label: 'Offline',
        subtext: 'No Internet Connection',
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/20',
        dotColor: 'bg-rose-400',
        pulse: false,
      };
    }
    if (!socketConnected) {
      return {
        label: 'Reconnecting',
        subtext: 'Connecting to real-time mesh...',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        dotColor: 'bg-amber-400',
        pulse: true,
      };
    }
    if (latency !== null && latency > 200) {
      return {
        label: 'High Latency',
        subtext: `${latency}ms round-trip`,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        dotColor: 'bg-amber-400',
        pulse: false,
      };
    }
    return {
      label: 'Live & Synced',
      subtext: latency !== null ? `${latency}ms latency` : 'Connected',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      dotColor: 'bg-emerald-400',
      pulse: true,
    };
  }, [isOnline, socketConnected, latency]);

  return (
    <div
      className={cn(
        'card-subtle p-3 space-y-2.5 transition-all border shadow-xs',
        statusState.borderColor,
        statusState.bgColor
      )}
    >
      {/* Header: Title and Reconnect/Ping button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          {isOnline ? (
            <Activity className="w-3.5 h-3.5 text-accent" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>Network &amp; Peers</span>
        </div>

        <button
          onClick={handleReconnect}
          disabled={isChecking}
          title={isChecking ? 'Checking latency...' : 'Refresh connection ping'}
          className="p-1 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
          type="button"
        >
          <RefreshCw
            className={cn('w-3 h-3', isChecking && 'animate-spin text-accent')}
          />
        </button>
      </div>

      {/* Main Status Indicator Row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {statusState.pulse && (
              <span
                className={cn(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  statusState.dotColor
                )}
              />
            )}
            <span
              className={cn('relative inline-flex rounded-full h-2 w-2', statusState.dotColor)}
            />
          </span>
          <span className={cn('font-medium text-[11px]', statusState.color)}>
            {statusState.label}
          </span>
        </div>

        {/* Latency Pill */}
        {socketConnected && latency !== null && (
          <span
            className={cn(
              'font-mono text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1',
              latency < 60
                ? 'bg-emerald-500/15 border-emerald-500/30 dark:text-emerald-300 text-emerald-600'
                : latency < 150
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            )}
          >
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            {latency}ms
          </span>
        )}
      </div>

      {/* Peer Activity Row: If in a study room, show real-time peers; else show mesh sync */}
      <div className="text-[11px] text-foreground-muted flex items-center justify-between pt-1 border-t border-border/40">
        {room ? (
          <div className="flex items-center gap-1.5 text-foreground-secondary truncate">
            <Users className="w-3 h-3 text-accent shrink-0" />
            <span className="truncate">
              <strong className="text-foreground font-semibold">{onlineMemberCount}</strong> /{' '}
              {members.length} peer{members.length === 1 ? '' : 's'} online
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-foreground-secondary">
            <Sparkles className="w-3 h-3 text-accent shrink-0" />
            <span>Workspace sync active</span>
          </div>
        )}

        <Link
          href="/credits"
          className="text-[10px] text-foreground-muted hover:text-accent font-medium transition-colors shrink-0"
        >
          Specs
        </Link>
      </div>
    </div>
  );
};
