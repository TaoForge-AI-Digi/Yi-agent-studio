import { describe, it, expect } from 'vitest';
import type { YiNode, IntentPayload } from './node.js';
import { isValidLockCombo } from './asset.js';

describe('YiNode', () => {
  it('构造 intent 节点', () => {
    const n: YiNode = {
      id: '01H', parentId: null, type: 'intent', status: 'done',
      createdAt: '2026-06-25T00:00:00Z',
      payload: { input: '整理', attachments: [], mountedAssets: [], mode: 'ask' } satisfies IntentPayload,
      childrenIds: [],
    };
    expect(n.type).toBe('intent');
  });
});

describe('isValidLockCombo', () => {
  it('both on 非法', () => expect(isValidLockCombo({ autoUpdate: true, editable: true })).toBe(false));
  it('both off 合法', () => expect(isValidLockCombo({ autoUpdate: false, editable: false })).toBe(true));
  it('one on 合法', () => expect(isValidLockCombo({ autoUpdate: true, editable: false })).toBe(true));
});
