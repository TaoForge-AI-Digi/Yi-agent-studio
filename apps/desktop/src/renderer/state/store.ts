import { create } from 'zustand';
import type { YiNode, PermissionMode, AssetInstallState } from '@yi/shared';
import { isValidLockCombo } from '@yi/shared';
import { mockTree, mockAssets, mockPonderStream } from './mock-data.js';

interface YiState {
  nodes: YiNode[];
  rootId: string | null;
  mode: PermissionMode;
  assets: AssetInstallState[];
  ponderText: string;
  setMode: (m: PermissionMode) => void;
  toggleAutoUpdate: (ref: string) => void;
  toggleEditable: (ref: string) => void;
  runMockPonder: () => Promise<void>;
}

export const useYiStore = create<YiState>((set, get) => ({
  nodes: mockTree,
  rootId: mockTree[0]?.id ?? null,
  mode: 'trusted',
  assets: mockAssets,
  ponderText: '',

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
}));
