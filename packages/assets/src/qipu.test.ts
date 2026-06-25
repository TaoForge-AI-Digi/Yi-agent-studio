import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeQipu, readQipu } from './qipu.js';
import type { YiNode } from '@yi/shared';

const tree: YiNode[] = [
  { id: 'n1', parentId: null, type: 'intent', status: 'done', createdAt: 't',
    payload: { input: 'hi', attachments: [], mountedAssets: [], mode: 'ask' }, childrenIds: ['n2'] },
  { id: 'n2', parentId: 'n1', type: 'result', status: 'done', createdAt: 't',
    payload: { summary: 'done', changes: [], durationMs: 1, tokensTotal: 0 }, childrenIds: [] },
];

describe('qipu', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'yi-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });
  it('读写棋谱一致', async () => {
    await writeQipu(join(dir, 't.yi.json'), {
      meta: { id: 't1', title: 'T', createdAt: 't', mode: 'ask', model: 'stub', assetsUsed: [], tags: [] },
      tree,
    });
    const got = await readQipu(join(dir, 't.yi.json'));
    expect(got.tree).toEqual(tree);
    expect(got.meta.title).toBe('T');
  });
});
