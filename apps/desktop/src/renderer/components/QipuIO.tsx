import React from 'react';
import { useYiStore } from '../state/store.js';

export function QipuIO() {
  const nodes = useYiStore((s) => s.nodes);
  const mode = useYiStore((s) => s.mode);
  const setNodes = useYiStore.setState;

  const save = async () => {
    const data = {
      id: crypto.randomUUID(), title: '任务', createdAt: new Date().toISOString(),
      mode, model: 'mock', assetsUsed: [], tags: [], tree: nodes,
    };
    await (window as any).yi.saveQipu(data);
  };
  const load = async () => {
    const data = await (window as any).yi.loadQipu();
    if (data?.tree) setNodes({ nodes: data.tree, rootId: data.tree[0]?.id ?? null });
  };

  return (
    <div style={{ padding: '8px 24px' }}>
      <button onClick={save} style={{ marginRight: 8, cursor: 'pointer' }}>保存棋谱</button>
      <button onClick={load} style={{ cursor: 'pointer' }}>加载棋谱</button>
    </div>
  );
}
