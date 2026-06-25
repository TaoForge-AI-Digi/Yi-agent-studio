import type { YiNode, AssetInstallState } from '@yi/shared';

export const mockTree: YiNode[] = [
  { id: 'n1', parentId: null, type: 'intent', status: 'done', createdAt: '2026-06-25T10:00:00Z',
    payload: { input: '整理下载文件夹里上个月的照片', attachments: [], mountedAssets: [], mode: 'trusted' },
    childrenIds: ['n2'] },
  { id: 'n2', parentId: 'n1', type: 'ponder', status: 'done', createdAt: '2026-06-25T10:00:01Z',
    payload: { reasoning: '需要扫描下载文件夹 → 过滤上月文件 → 按日期重命名', modelUsed: 'mock', tokensIn: 12, tokensOut: 34 },
    childrenIds: ['n3'] },
  { id: 'n3', parentId: 'n2', type: 'plan', status: 'done', createdAt: '2026-06-25T10:00:02Z',
    payload: { steps: [
      { id: 's1', description: '列出下载文件夹', tool: 'fs.list', argsPreview: '{ "path": "~/Downloads" }' },
      { id: 's2', description: '过滤上月照片', tool: 'fs.filter', argsPreview: '{ "ext": ["jpg","png"], "since": "2026-05" }' },
      { id: 's3', description: '按日期重命名', tool: 'fs.rename', argsPreview: '{ "pattern": "{date}-{name}" }' },
    ] },
    childrenIds: ['n4', 'n5', 'n6'] },
  { id: 'n4', parentId: 'n3', type: 'action', status: 'done', createdAt: '2026-06-25T10:00:03Z',
    payload: { stepId: 's1', tool: 'fs.list', args: {}, result: ['a.jpg', 'b.png', 'c.txt'], durationMs: 12 },
    childrenIds: [] },
  { id: 'n5', parentId: 'n3', type: 'action', status: 'done', createdAt: '2026-06-25T10:00:04Z',
    payload: { stepId: 's2', tool: 'fs.filter', args: {}, result: ['a.jpg', 'b.png'], durationMs: 8 },
    childrenIds: [] },
  { id: 'n6', parentId: 'n3', type: 'action', status: 'running', createdAt: '2026-06-25T10:00:05Z',
    payload: { stepId: 's3', tool: 'fs.rename', args: {}, result: null, durationMs: 0 },
    childrenIds: [] },
];

export const mockAssets: AssetInstallState[] = [
  { ref: 'photo-organizer', version: '0.1.0', autoUpdate: true, editable: false, source: 'registry', installedAt: 't' },
  { ref: 'investment-analysis', version: '0.2.1', autoUpdate: false, editable: false, source: 'registry', installedAt: 't' },
  { ref: 'my-custom-skill', version: '0.0.1', autoUpdate: false, editable: true, source: 'local', installedAt: 't' },
];

export async function* mockPonderStream(): AsyncIterable<string> {
  const text = '分析任务: 需要扫描下载文件夹 → 过滤上月文件 → 按日期重命名 → 生成索引';
  for (const ch of text) {
    yield ch;
    await new Promise((r) => setTimeout(r, 30));
  }
}
