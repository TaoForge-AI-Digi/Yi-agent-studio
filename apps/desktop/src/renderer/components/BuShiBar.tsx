import React, { useState, useEffect } from 'react';
import { useYiStore } from '../state/store.js';
import type { PermissionMode } from '@yi/shared';
import { ulid } from 'ulid';

export function BuShiBar() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const mode = useYiStore((s) => s.mode);
  const setMode = useYiStore((s) => s.setMode);
  const nodes = useYiStore((s) => s.nodes);
  const setNodes = useYiStore.setState;

  useEffect(() => {
    const handler = () => setOpen((o) => !o);
    (window as any).yi?.onToggleBushu?.(handler);
    return () => {};
  }, []);

  const send = () => {
    if (!text.trim()) return;
    const id = ulid();
    setNodes({
      nodes: [...nodes, {
        id, parentId: null, type: 'intent', status: 'done', createdAt: new Date().toISOString(),
        payload: { input: text, attachments: [], mountedAssets: [], mode },
        childrenIds: [],
      }],
    });
    setText(''); setOpen(false);
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      width: 560, padding: 16, background: 'var(--board)', border: '1px solid var(--line)', borderRadius: 8, zIndex: 100 }}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="布势:说意图,不说怎么做"
        style={{ width: '100%', height: 60, background: '#1a1208', color: 'var(--text)', border: '1px solid var(--line)' }} />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <select value={mode} onChange={(e) => setMode(e.target.value as PermissionMode)} style={{ background: '#1a1208', color: 'var(--text)' }}>
          <option value="plan">PLAN</option><option value="ask">ASK</option>
          <option value="trusted">TRUSTED</option><option value="bypass">BYPASS</option>
        </select>
        <button onClick={send} style={{ marginLeft: 'auto', padding: '4px 16px', cursor: 'pointer' }}>落子</button>
      </div>
    </div>
  );
}
