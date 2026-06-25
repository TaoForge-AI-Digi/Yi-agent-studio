import React from 'react';
import { useYiStore } from '../state/store.js';

export function Xiaomu() {
  const text = useYiStore((s) => s.ponderText);
  const run = useYiStore((s) => s.runMockPonder);
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, width: 320, padding: 16,
      background: 'rgba(20,16,12,0.85)', border: '1px solid var(--line)', borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>小目 · 长考</div>
      <div style={{ minHeight: 60, fontSize: 13 }}>{text || '—'}</div>
      <button onClick={run} style={{ marginTop: 8, padding: '4px 12px', cursor: 'pointer' }}>重演推理</button>
    </div>
  );
}
