import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { YiNode, PermissionMode, AssetInstallState } from '@yi/shared';
import { isValidLockCombo } from '@yi/shared';
import { mockTree, mockAssets, mockPonderStream } from './mock-data.js';

export interface Session {
  id: string;
  title: string;
  updatedAt: string;
}

export const useAgentStore = defineStore('agent', () => {
  const nodes = ref<YiNode[]>(mockTree);
  const rootId = ref<string | null>(mockTree[0]?.id ?? null);
  const mode = ref<PermissionMode>('trusted');
  const assets = ref<AssetInstallState[]>(mockAssets);
  const ponderText = ref<string>('');
  const sessions = ref<Session[]>([
    { id: 's1', title: '整理下载文件夹照片', updatedAt: '2026-06-25T10:00:00Z' },
    { id: 's2', title: '生成周报', updatedAt: '2026-06-24T15:30:00Z' },
    { id: 's3', title: '分析研报', updatedAt: '2026-06-23T09:00:00Z' },
  ]);
  const activeSessionId = ref<string>('s1');

  const setMode = (m: PermissionMode) => { mode.value = m; };

  const toggleAutoUpdate = (ref: string) => {
    assets.value = assets.value.map((a) => {
      if (a.ref !== ref) return a;
      const next = { ...a, autoUpdate: !a.autoUpdate, editable: false };
      return isValidLockCombo(next) ? next : a;
    });
  };

  const toggleEditable = (ref: string) => {
    assets.value = assets.value.map((a) => {
      if (a.ref !== ref) return a;
      const next = { ...a, editable: !a.editable, autoUpdate: false };
      return isValidLockCombo(next) ? next : a;
    });
  };

  const runMockPonder = async () => {
    ponderText.value = '';
    let acc = '';
    for await (const ch of mockPonderStream()) {
      acc += ch;
      ponderText.value = acc;
    }
  };

  const addMessage = (input: string) => {
    const id = `n${Date.now()}`;
    nodes.value = [...nodes.value, {
      id, parentId: null, type: 'intent' as const, status: 'done' as const,
      createdAt: new Date().toISOString(),
      payload: { input, attachments: [], mountedAssets: [], mode: mode.value },
      childrenIds: [],
    }];
  };

  const switchSession = (id: string) => { activeSessionId.value = id; };

  const createSession = () => {
    const id = `s${Date.now()}`;
    sessions.value = [{ id, title: '新对话', updatedAt: new Date().toISOString() }, ...sessions.value];
    activeSessionId.value = id;
    nodes.value = [];
    rootId.value = null;
  };

  return { nodes, rootId, mode, assets, ponderText, sessions, activeSessionId,
           setMode, toggleAutoUpdate, toggleEditable, runMockPonder, addMessage, switchSession, createSession };
});
