export const TIMER_CONFIG = {
  DEFAULT_FOCUS_MINUTES: 25,
  DEFAULT_SHORT_BREAK_MINUTES: 5,
  DEFAULT_LONG_BREAK_MINUTES: 15,
  CYCLES_BEFORE_LONG_BREAK: 4,
  DEFAULT_FOCUS_SECONDS: 25 * 60,
  DEFAULT_SHORT_BREAK_SECONDS: 5 * 60,
  DEFAULT_LONG_BREAK_SECONDS: 15 * 60,
  TICK_INTERVAL_MS: 1000,
  RECONCILIATION_INTERVAL_MS: 5000,
} as const;

export const SOCKET_EVENTS = {
  CLIENT: {
    ROOM_JOIN: 'room:join',
    ROOM_LEAVE: 'room:leave',
    TIMER_START: 'timer:start',
    TIMER_PAUSE: 'timer:pause',
    TIMER_RESUME: 'timer:resume',
    TIMER_SKIP: 'timer:skip',
    TASK_CREATE: 'task:create',
    TASK_UPDATE: 'task:update',
    TASK_DELETE: 'task:delete',
    TASK_CLAIM: 'task:claim',
    TASK_UNASSIGN: 'task:unassign',
    PARTICIPANT_HEARTBEAT: 'participant:heartbeat',
    ROOM_CHAT: 'room:chat',
    MEMBER_ROLE_UPDATE: 'room:member-role-update',
  },
  SERVER: {
    ROOM_STATE: 'room:state',
    ROOM_PARTICIPANT_JOINED: 'room:participant-joined',
    ROOM_PARTICIPANT_LEFT: 'room:participant-left',
    TIMER_STATE: 'timer:state',
    TIMER_TICK: 'timer:tick',
    TIMER_PHASE_CHANGED: 'timer:phase-changed',
    TASK_CREATED: 'task:created',
    TASK_UPDATED: 'task:updated',
    TASK_DELETED: 'task:deleted',
    ROOM_ACTIVITY: 'room:activity',
    ROOM_ERROR: 'room:error',
    MEMBER_ROLE_UPDATED: 'room:member-role-updated',
  },
} as const;

export const ROOM_ROLES = {
  OWNER: 'OWNER',
  MODERATOR: 'MODERATOR',
  MEMBER: 'MEMBER',
} as const;

export const TIMER_PHASES = {
  FOCUS: 'FOCUS',
  SHORT_BREAK: 'SHORT_BREAK',
  LONG_BREAK: 'LONG_BREAK',
} as const;

export const TIMER_STATUSES = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
} as const;

export const TASK_STATUSES = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export const TASK_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
