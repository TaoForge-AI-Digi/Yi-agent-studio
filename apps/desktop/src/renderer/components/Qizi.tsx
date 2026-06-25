import React from 'react';
import { motion } from 'framer-motion';
import type { YiNode, NodeType } from '@yi/shared';

const typeLabel: Record<NodeType, string> = {
  intent: '布势', ponder: '长考', plan: '分投', action: '落子', result: '收官', checkpoint: '检查点',
};

export function Qizi({ node }: { node: YiNode }) {
  return (
    <motion.div className="qizi" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
      <div className={`stone ${node.status}`} />
      <div className="qizi-label">{typeLabel[node.type]}</div>
    </motion.div>
  );
}
