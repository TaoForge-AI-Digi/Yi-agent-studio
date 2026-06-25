import React from 'react';
import { useYiStore } from '../state/store.js';

export function ShouGuan() {
  const assets = useYiStore((s) => s.assets);
  const toggleAutoUpdate = useYiStore((s) => s.toggleAutoUpdate);
  const toggleEditable = useYiStore((s) => s.toggleEditable);
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>守关 · 资产</div>
      {assets.map((a) => (
        <div key={a.ref} style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 13 }}>
          <span style={{ minWidth: 140 }}>{a.ref} v{a.version}</span>
          <button onClick={() => toggleAutoUpdate(a.ref)} style={{ fontSize: 11, cursor: 'pointer' }}>
            {a.autoUpdate ? '🔒 更新' : '更新'}
          </button>
          <button onClick={() => toggleEditable(a.ref)} style={{ fontSize: 11, cursor: 'pointer' }}>
            {a.editable ? '🔒 编辑' : '编辑'}
          </button>
        </div>
      ))}
    </div>
  );
}
