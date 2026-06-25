import React from 'react';
import { useYiStore } from '../state/store.js';
import type { PermissionMode } from '@yi/shared';

const modes: { v: PermissionMode; label: string; desc: string }[] = [
  { v: 'plan', label: 'PLAN', desc: '只推演' },
  { v: 'ask', label: 'ASK', desc: '逐次确认' },
  { v: 'trusted', label: 'TRUSTED', desc: 'workdir 内随意' },
  { v: 'bypass', label: 'BYPASS', desc: '完全不拦' },
];

export function ModeSwitch() {
  const mode = useYiStore((s) => s.mode);
  const setMode = useYiStore((s) => s.setMode);
  return (
    <div style={{ padding: '8px 24px', display: 'flex', gap: 8, borderBottom: '1px solid var(--line)' }}>
      {modes.map((m) => (
        <button key={m.v} onClick={() => setMode(m.v)}
          style={{ padding: '4px 12px', cursor: 'pointer',
            background: mode === m.v ? 'var(--accent)' : 'transparent',
            color: mode === m.v ? '#1a1208' : 'var(--text)', border: '1px solid var(--line)' }}>
          {m.label} <span style={{ fontSize: 10, opacity: 0.7 }}>{m.desc}</span>
        </button>
      ))}
    </div>
  );
}
