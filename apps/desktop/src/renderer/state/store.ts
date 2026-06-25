import { create } from 'zustand';
import type { YiNode, PermissionMode, AssetInstallState } from '@yi/shared';
import { isValidLockCombo } from '@yi/shared';
import { mockTree, mockAssets, mockPonderStream } from './mock-data.js';

interface AgentState {
  nodes: YiNode[];
  rootId: string | null;
  mode: PermissionMode;
  assets: AssetInstallState[];
  ponderText: string;
  sessions: { id: string; title: string; updatedAt: string }[];
  activeSessionId: string | null;
  setMode: (m: PermissionMode) => void;
  toggleAutoUpdate: (ref: string) => void;
  toggleEditable: (ref: string) => void;
  runMockPonder: () => Promise<void>;
  addMessage: (input: string) => void;
  switchSession: (id: string) => void;
  createSession: () => void;
}

export const useYiStore = create<AgentState>((set, get) => ({
  nodes: mockTree,
  rootId: mockTree[0]?.id ?? null,
  mode: 'trusted',
  assets: mockAssets,
  ponderText: '',
  sessions: [
    { id: 's1', title: '整理下载文件夹照片', updatedAt: '2026-06-25T10:00:00Z' },
    { id: 's2', title: '生成周报', updatedAt: '2026-06-24T15:30:00Z' },
    { id: 's3', title: '分析研报', updatedAt: '2026-06-23T09:00:00Z' },
  ],
  activeSessionId: 's1',

  setMode: (m) => set({ mode: m }),

  toggleAutoUpdate: (ref) => set((s) => ({
    assets: s.assets.map((a) => {
      if (a.ref !== ref) return a;
      const next = { ...a, autoUpdate: !a.autoUpdate, editable: false };
      return isValidLockCombo(next) ? next : a;
    }),
  })),

  toggleEditable: (ref) => set((s) => ({
    assets: s.assets.map((a) => {
      if (a.ref !== ref) return a;
      const next = { ...a, editable: !a.editable, autoUpdate: false };
      return isValidLockCombo(next) ? next : a;
    }),
  })),

  runMockPonder: async () => {
    set({ ponderText: '' });
    let acc = '';
    for await (const ch of mockPonderStream()) {
      acc += ch;
      set({ ponderText: acc });
    }
  },

  addMessage: (input) => {
    const id = `n${Date.now()}`;
    set((s) => ({
      nodes: [...s.nodes, {
        id, parentId: null, type: 'intent' as const, status: 'done' as const,
        createdAt: new Date().toISOString(),
        payload: { input, attachments: [], mountedAssets: [], mode: s.mode },
        childrenIds: [],
      }],
    }));
  },

  switchSession: (id) => set({ activeSessionId: id }),

  createSession: () => {
    const id = `s${Date.now()}`;
    set((s) => ({
      sessions: [{ id, title: '新对话', updatedAt: new Date().toISOString() }, ...s.sessions],
      activeSessionId: id,
      nodes: [],
      rootId: null,
    }));
  },
}));
