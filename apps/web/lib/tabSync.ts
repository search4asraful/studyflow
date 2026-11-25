import { create } from 'zustand';
import { disconnectSocket, reconnectSocket } from './socket';
import { toast } from 'sonner';

export type TabSyncEvent =
  | { type: 'CLAIM_ACTIVE_TAB'; tabId: string; timestamp: number }
  | { type: 'TAB_CLOSED'; tabId: string }
  | { type: 'AUTH_LOGOUT'; timestamp: number }
  | { type: 'AUTH_LOGIN'; user: any; profile: any; timestamp: number }
  | { type: 'CACHE_INVALIDATED'; pattern?: string; timestamp: number }
  | { type: 'TIMER_SYNC'; roomId: string; timerState: any; timestamp: number };

const CHANNEL_NAME = 'studyflow_tab_bus';
const STORAGE_BACKUP_KEY = 'studyflow_tab_bus_event';

// Generate or retrieve stable tab ID for this browser session
function getTabId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = window.sessionStorage.getItem('studyflow_tab_id');
  if (!id) {
    id = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    try {
      window.sessionStorage.setItem('studyflow_tab_id', id);
    } catch {
      // Ignore private browsing storage restrictions
    }
  }
  return id;
}

const TAB_ID = getTabId();

interface ActiveTabState {
  isActiveTab: boolean;
  tabId: string;
  claimActiveTab: () => void;
  setInactive: () => void;
}

export const useActiveTabStore = create<ActiveTabState>((set) => ({
  isActiveTab: true,
  tabId: TAB_ID,

  claimActiveTab: () => {
    set({ isActiveTab: true });
    broadcastTabEvent({
      type: 'CLAIM_ACTIVE_TAB',
      tabId: TAB_ID,
      timestamp: Date.now(),
    });
    reconnectSocket();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studyflow:tab-claimed'));
    }
  },

  setInactive: () => {
    set({ isActiveTab: false });
    disconnectSocket();
  },
}));

let broadcastChannel: BroadcastChannel | null = null;
let isInitialized = false;

/**
 * Send an event to all other tabs via BroadcastChannel (with localStorage fallback)
 */
export function broadcastTabEvent(event: TabSyncEvent): void {
  if (typeof window === 'undefined') return;

  // 1. Native BroadcastChannel API
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch {
      // Channel closed or failed
    }
  }

  // 2. LocalStorage Fallback for older browsers or if BroadcastChannel is blocked
  try {
    window.localStorage.setItem(
      STORAGE_BACKUP_KEY,
      JSON.stringify({ ...event, _rnd: Math.random() })
    );
  } catch {
    // Ignore storage quota
  }
}

/**
 * Handle incoming cross-tab messages
 */
function handleIncomingEvent(event: TabSyncEvent) {
  if (!event || typeof event !== 'object') return;

  switch (event.type) {
    case 'CLAIM_ACTIVE_TAB':
      // If another tab claims active status, this tab must relinquish control
      if (event.tabId !== TAB_ID) {
        useActiveTabStore.getState().setInactive();
      }
      break;

    case 'TAB_CLOSED':
      // If the active tab closed and this tab is currently visible, take over smoothly
      if (
        !useActiveTabStore.getState().isActiveTab &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible'
      ) {
        useActiveTabStore.getState().claimActiveTab();
      }
      break;

    case 'AUTH_LOGOUT':
      // Synchronized cross-tab logout: immediately disconnect, clear state & redirect
      disconnectSocket();
      try {
        window.localStorage.removeItem('studyflow-auth-storage');
        window.sessionStorage.clear();
      } catch {
        // Ignore
      }

      toast.info('You were logged out from another window.');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 300);
      }
      break;

    case 'AUTH_LOGIN':
      // Optionally handle cross-tab login without full reload
      break;

    case 'CACHE_INVALIDATED':
      // Triggered when mutations happen in another tab
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('studyflow:cache-invalidated', { detail: event.pattern })
        );
      }
      break;

    case 'TIMER_SYNC':
      // Authoritative timer state sync across open tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('studyflow:timer-sync', { detail: event })
        );
      }
      break;
  }
}

/**
 * Initialize the multi-tab synchronization and single-tab leadership guard
 */
export function initTabSync(): () => void {
  if (typeof window === 'undefined' || isInitialized) {
    return () => {};
  }
  isInitialized = true;

  // Setup BroadcastChannel
  if (typeof window.BroadcastChannel !== 'undefined') {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.onmessage = (messageEvent) => {
        handleIncomingEvent(messageEvent.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel initialization failed, using storage fallback', e);
    }
  }

  // Storage event listener fallback (also catches events across tabs)
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_BACKUP_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        handleIncomingEvent(parsed);
      } catch {
        // Ignore parse error
      }
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // Automatically claim leadership on mount
  broadcastTabEvent({
    type: 'CLAIM_ACTIVE_TAB',
    tabId: TAB_ID,
    timestamp: Date.now(),
  });

  // Handle window focus: when user switches to this tab, automatically claim active status
  const handleFocus = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      if (!useActiveTabStore.getState().isActiveTab) {
        useActiveTabStore.getState().claimActiveTab();
      }
    }
  };
  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleFocus);

  // Handle tab close / reload: notify other tabs so one can take over
  const handleBeforeUnload = () => {
    if (useActiveTabStore.getState().isActiveTab) {
      broadcastTabEvent({
        type: 'TAB_CLOSED',
        tabId: TAB_ID,
      });
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleFocus);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
    isInitialized = false;
  };
}

/**
 * Broadcast logout to all other open tabs
 */
export function broadcastLogout(): void {
  broadcastTabEvent({
    type: 'AUTH_LOGOUT',
    timestamp: Date.now(),
  });
}

/**
 * Broadcast login to all other open tabs
 */
export function broadcastLogin(user: any, profile: any): void {
  broadcastTabEvent({
    type: 'AUTH_LOGIN',
    user,
    profile,
    timestamp: Date.now(),
  });
}

/**
 * Broadcast cache invalidation across tabs
 */
export function broadcastCacheInvalidate(pattern?: string): void {
  broadcastTabEvent({
    type: 'CACHE_INVALIDATED',
    pattern,
    timestamp: Date.now(),
  });
}

/**
 * Broadcast authoritative timer state to all open tabs for instant zero-latency cross-tab sync
 */
export function broadcastTimerSync(roomId: string, timerState: any): void {
  broadcastTabEvent({
    type: 'TIMER_SYNC',
    roomId,
    timerState,
    timestamp: Date.now(),
  });
}
