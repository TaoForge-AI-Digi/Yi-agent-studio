import React from 'react';
import { useYiStore } from '../state/store.js';

export function AssetLocks() {
  const assets = useYiStore((s) => s.assets);
  const toggleAutoUpdate = useYiStore((s) => s.toggleAutoUpdate);
  const toggleEditable = useYiStore((s) => s.toggleEditable);
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>资产库</div>
      {assets.map((a) => (
        <div key={a.ref} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
          <div style={{ flex: 1 }}>
            <div>{a.ref}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.version} · {a.source}</div>
          </div>
          <label style={{ fontSize: 12 }}>
            <input type="checkbox" checked={a.autoUpdate}
              onChange={() => toggleAutoUpdate(a.ref)} /> autoUpdate
          </label>
          <label style={{ fontSize: 12 }} aria-label={`editable-${a.ref}`}>
            <input type="checkbox" checked={a.editable}
              onChange={() => toggleEditable(a.ref)} /> editable
          </label>
        </div>
      ))}
    </div>
  );
}
