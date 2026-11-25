import { describe, it, expect } from 'vitest';

describe('Multi-Tab Synchronization & Single-Active-Tab Broadcast Channel Logic', () => {
  interface TabState {
    tabId: string;
    isActive: boolean;
  }

  class MockBroadcastChannel {
    name: string;
    onmessage: ((event: { data: any }) => void) | null = null;
    static channels = new Map<string, Set<MockBroadcastChannel>>();

    constructor(name: string) {
      this.name = name;
      if (!MockBroadcastChannel.channels.has(name)) {
        MockBroadcastChannel.channels.set(name, new Set());
      }
      MockBroadcastChannel.channels.get(name)!.add(this);
    }

    postMessage(data: any) {
      const set = MockBroadcastChannel.channels.get(this.name);
      if (set) {
        set.forEach((ch) => {
          if (ch !== this && ch.onmessage) {
            ch.onmessage({ data });
          }
        });
      }
    }

    close() {
      const set = MockBroadcastChannel.channels.get(this.name);
      if (set) {
        set.delete(this);
      }
    }
  }

  it('should enforce only ONE active tab when a new tab claims leadership', () => {
    const tab1: TabState = { tabId: 'tab_1', isActive: true };
    const tab2: TabState = { tabId: 'tab_2', isActive: true };

    const ch1 = new MockBroadcastChannel('studyflow_test_bus');
    const ch2 = new MockBroadcastChannel('studyflow_test_bus');

    ch1.onmessage = ({ data }) => {
      if (data.type === 'CLAIM_ACTIVE_TAB' && data.tabId !== tab1.tabId) {
        tab1.isActive = false;
      }
    };

    ch2.onmessage = ({ data }) => {
      if (data.type === 'CLAIM_ACTIVE_TAB' && data.tabId !== tab2.tabId) {
        tab2.isActive = false;
      }
    };

    // Tab 2 claims active tab
    ch2.postMessage({ type: 'CLAIM_ACTIVE_TAB', tabId: tab2.tabId });

    expect(tab2.isActive).toBe(true);
    expect(tab1.isActive).toBe(false);

    // Tab 1 user clicks "Use Here Instead"
    tab1.isActive = true;
    ch1.postMessage({ type: 'CLAIM_ACTIVE_TAB', tabId: tab1.tabId });

    expect(tab1.isActive).toBe(true);
    expect(tab2.isActive).toBe(false);

    ch1.close();
    ch2.close();
  });

  it('should synchronize logout across all open tabs', () => {
    let tab1LoggedOut = false;
    let tab2LoggedOut = false;

    const ch1 = new MockBroadcastChannel('studyflow_logout_bus');
    const ch2 = new MockBroadcastChannel('studyflow_logout_bus');

    ch1.onmessage = ({ data }) => {
      if (data.type === 'AUTH_LOGOUT') {
        tab1LoggedOut = true;
      }
    };

    ch2.onmessage = ({ data }) => {
      if (data.type === 'AUTH_LOGOUT') {
        tab2LoggedOut = true;
      }
    };

    // Tab 2 logs out
    ch2.postMessage({ type: 'AUTH_LOGOUT' });

    expect(tab1LoggedOut).toBe(true);

    ch1.close();
    ch2.close();
  });
});
