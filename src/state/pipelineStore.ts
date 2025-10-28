import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import type {
  CheckpointItem,
  FeedbackItem,
  PipelineCheckpoint,
  PipelineConfig,
  PipelineItemState,
  PipelineItemStatus,
  PipelineSnapshot
} from '@/lib/pipeline/types';

export type PipelineRunStatus = 'idle' | 'running' | 'paused';

export interface PipelineState {
  items: Record<string, PipelineItemState>;
  queue: string[];
  processedIds: string[];
  status: PipelineRunStatus;
  activeItemId?: string;
  lastError?: string;
  rateLimitError?: string;
  config: PipelineConfig;
  enqueue: (items: FeedbackItem[]) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  dequeue: () => string | undefined;
  markProcessing: (id: string) => void;
  markCompleted: (id: string) => void;
  markFailed: (id: string, error: string) => void;
  markPending: (id: string) => void;
  recordAttempt: (id: string) => void;
  remove: (id: string) => void;
  cancel: (id?: string) => void;
  reset: () => void;
  setConfig: (config: Partial<PipelineConfig>) => void;
  clearRateLimitError: () => void;
  setRateLimitError: (message: string) => void;
  getSnapshot: (userId: string) => PipelineSnapshot;
  restoreFromCheckpoint: (checkpoint: PipelineCheckpoint, feedbackItems: FeedbackItem[]) => void;
}

const defaultConfig: PipelineConfig = {
  batchSize: 5,
  delayMs: 800,
  summarizationEnabled: true,
  maxRetries: 5,
  backoffMs: 1000,
  backoffFactor: 2
};

const toCheckpointItem = (state: PipelineItemState): CheckpointItem => ({
  id: state.item.id,
  status: state.status,
  attempts: state.attempts,
  error: state.error
});

const createInitialState = (): Pick<
  PipelineState,
  'items' | 'queue' | 'processedIds' | 'status' | 'config' | 'activeItemId' | 'lastError' | 'rateLimitError'
> => ({
  items: {},
  queue: [],
  processedIds: [],
  status: 'idle',
  config: { ...defaultConfig },
  activeItemId: undefined,
  lastError: undefined,
  rateLimitError: undefined
});

export const createPipelineStore = (seed?: Partial<PipelineState>) =>
  createStore<PipelineState>()((set, get) => ({
    ...createInitialState(),
    ...seed,
    enqueue: (items: FeedbackItem[]) => {
      const timestamp = new Date().toISOString();
      set((state) => {
        const nextItems = { ...state.items };
        const queue = [...state.queue];
        const processed = new Set(state.processedIds);

        items.forEach((item) => {
          const existing = nextItems[item.id];
          if (!existing) {
            nextItems[item.id] = {
              item,
              status: 'pending',
              attempts: 0,
              lastUpdatedAt: timestamp
            };
          } else {
            nextItems[item.id] = {
              ...existing,
              item,
              lastUpdatedAt: timestamp
            };
          }

          if (!processed.has(item.id) && !queue.includes(item.id)) {
            queue.push(item.id);
          }
        });

        return {
          items: nextItems,
          queue
        };
      });
    },
    start: () => {
      set((state) => ({
        status: state.status === 'paused' ? 'running' : 'running',
        lastError: undefined
      }));
    },
    pause: () => {
      set({ status: 'paused' });
    },
    resume: () => {
      set((state) => ({
        status: state.queue.length ? 'running' : state.status,
        rateLimitError: undefined
      }));
    },
    dequeue: () => {
      const state = get();
      const nextId = state.queue[0];
      if (!nextId) {
        return undefined;
      }
      set({ queue: state.queue.slice(1), activeItemId: nextId });
      return nextId;
    },
    markProcessing: (id: string) => {
      const timestamp = new Date().toISOString();
      set((state) => {
        const current = state.items[id];
        if (!current) {
          return state;
        }
        return {
          items: {
            ...state.items,
            [id]: {
              ...current,
              status: 'processing',
              lastUpdatedAt: timestamp
            }
          }
        };
      });
    },
    markCompleted: (id: string) => {
      const timestamp = new Date().toISOString();
      set((state) => {
        const current = state.items[id];
        if (!current) {
          return state;
        }
        const processedIds = state.processedIds.includes(id)
          ? state.processedIds
          : [...state.processedIds, id];
        const nextItems = {
          ...state.items,
          [id]: {
            ...current,
            status: 'completed',
            lastUpdatedAt: timestamp
          }
        };
        const completed = Object.values(nextItems).every((entry) => entry.status === 'completed');
        return {
          items: nextItems,
          processedIds,
          lastError: undefined,
          activeItemId: state.activeItemId === id ? undefined : state.activeItemId,
          status: !state.queue.length && completed ? 'idle' : state.status
        };
      });
    },
    markFailed: (id: string, error: string) => {
      const timestamp = new Date().toISOString();
      set((state) => {
        const current = state.items[id];
        if (!current) {
          return state;
        }
        const nextItems: Record<string, PipelineItemState> = {
          ...state.items,
          [id]: {
            ...current,
            status: 'failed',
            error,
            lastUpdatedAt: timestamp
          }
        };
        return {
          items: nextItems,
          lastError: error,
          activeItemId: state.activeItemId === id ? undefined : state.activeItemId
        };
      });
    },
    markPending: (id: string) => {
      const timestamp = new Date().toISOString();
      set((state) => {
        const current = state.items[id];
        if (!current) {
          return state;
        }
        return {
          items: {
            ...state.items,
            [id]: {
              ...current,
              status: 'pending',
              error: undefined,
              lastUpdatedAt: timestamp
            }
          }
        };
      });
    },
    recordAttempt: (id: string) => {
      const timestamp = new Date().toISOString();
      set((state) => {
        const current = state.items[id];
        if (!current) {
          return state;
        }
        return {
          items: {
            ...state.items,
            [id]: {
              ...current,
              attempts: current.attempts + 1,
              lastUpdatedAt: timestamp
            }
          }
        };
      });
    },
    remove: (id: string) => {
      set((state) => {
        if (!state.items[id]) {
          return state;
        }
        const nextItems = { ...state.items };
        delete nextItems[id];
        return {
          items: nextItems,
          queue: state.queue.filter((entry) => entry !== id),
          processedIds: state.processedIds.filter((entry) => entry !== id),
          activeItemId: state.activeItemId === id ? undefined : state.activeItemId
        };
      });
    },
    cancel: (id?: string) => {
      const timestamp = new Date().toISOString();
      set((state) => {
        const nextItems = { ...state.items };
        const queue = id ? state.queue.filter((entry) => entry !== id) : [];

        if (id) {
          if (nextItems[id]) {
            nextItems[id] = {
              ...nextItems[id],
              status: 'canceled',
              lastUpdatedAt: timestamp
            };
          }
        } else {
          Object.keys(nextItems).forEach((key) => {
            if (nextItems[key].status === 'pending' || nextItems[key].status === 'processing') {
              nextItems[key] = {
                ...nextItems[key],
                status: 'canceled',
                lastUpdatedAt: timestamp
              };
            }
          });
        }

        return {
          items: nextItems,
          queue,
          status: 'idle',
          activeItemId: undefined
        };
      });
    },
    reset: () => {
      set((state) => ({
        ...createInitialState(),
        config: state.config
      }));
    },
    setConfig: (config: Partial<PipelineConfig>) => {
      set((state) => ({
        config: {
          ...state.config,
          ...config
        }
      }));
    },
    clearRateLimitError: () => {
      set({ rateLimitError: undefined });
    },
    setRateLimitError: (message: string) => {
      set({ rateLimitError: message, status: 'paused' });
    },
    getSnapshot: (userId: string) => {
      const state = get();
      const queue = state.queue.map((id) => toCheckpointItem(state.items[id]));
      const processedIds = [...state.processedIds];
      const activeItemId = state.activeItemId;
      let activeItem: CheckpointItem | undefined;
      if (activeItemId) {
        const item = state.items[activeItemId];
        if (item) {
          activeItem = toCheckpointItem(item);
        }
      }

      const snapshot: PipelineSnapshot = {
        userId,
        queue,
        processedIds,
        status: state.status,
        activeItemId,
        updatedAt: new Date().toISOString(),
        error: state.lastError
      };

      if (activeItem) {
        snapshot.queue = [activeItem, ...snapshot.queue.filter((entry) => entry.id !== activeItem.id)];
      }

      return snapshot;
    },
    restoreFromCheckpoint: (checkpoint: PipelineCheckpoint, feedbackItems: FeedbackItem[]) => {
      const timestamp = new Date().toISOString();
      set(() => {
        const items: Record<string, PipelineItemState> = {};
        const processedIds = [...checkpoint.processedIds];
        const queue: string[] = [];
        const feedbackMap = new Map(feedbackItems.map((item) => [item.id, item]));

        checkpoint.queue.forEach((entry) => {
          const feedback = feedbackMap.get(entry.id);
          if (feedback) {
            items[entry.id] = {
              item: feedback,
              status: entry.status as PipelineItemStatus,
              attempts: entry.attempts,
              error: entry.error,
              lastUpdatedAt: timestamp
            };
            if (entry.status === 'pending' || entry.status === 'processing') {
              queue.push(entry.id);
            }
          }
        });

        processedIds.forEach((id) => {
          if (!items[id]) {
            const feedback = feedbackMap.get(id);
            if (feedback) {
              items[id] = {
                item: feedback,
                status: 'completed',
                attempts: 1,
                lastUpdatedAt: timestamp
              };
            }
          }
        });

        return {
          items,
          queue,
          processedIds,
          status: checkpoint.status,
          activeItemId: checkpoint.activeItemId,
          lastError: checkpoint.error
        };
      });
    }
  }));

const pipelineStore = createPipelineStore();

export const usePipelineStore = <T>(
  selector: (state: PipelineState) => T,
  equalityFn?: (a: T, b: T) => boolean
) => useStore(pipelineStore, selector, equalityFn);

export type PipelineStore = typeof pipelineStore;
export { pipelineStore };
