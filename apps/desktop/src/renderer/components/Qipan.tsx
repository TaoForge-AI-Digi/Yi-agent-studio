import React from 'react';
import { useYiStore } from '../state/store.js';
import { Qizi } from './Qizi.js';

function Branch({ parentId }: { parentId: string | null }) {
  const nodes = useYiStore((s) => s.nodes);
  const children = nodes.filter((n) => n.parentId === parentId);
  return (
    <div className="branch">
      {children.map((n) => (
        <div key={n.id}>
          <Qizi node={n} />
          <Branch parentId={n.id} />
        </div>
      ))}
    </div>
  );
}

export function Qipan() {
  const rootId = useYiStore((s) => s.rootId);
  if (!rootId) return <div className="qipan">尚无棋局</div>;
  return (
    <div className="qipan">
      <Branch parentId={null} />
    </div>
  );
}
