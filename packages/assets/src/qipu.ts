import type { YiNode, PermissionMode } from '@yi/shared';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import yaml from 'js-yaml';

export interface QipuMeta {
  id: string; title: string; createdAt: string; mode: PermissionMode;
  model: string; assetsUsed: { type: string; ref: string; version: string }[]; tags: string[];
}
export interface Qipu { meta: QipuMeta; tree: YiNode[]; }

export async function writeQipu(path: string, q: Qipu): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify({ ...q.meta, tree: q.tree }, null, 2), 'utf8');
}

export async function readQipu(path: string): Promise<Qipu> {
  const raw = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
  const { tree, ...meta } = raw;
  return { meta: meta as unknown as QipuMeta, tree: tree as YiNode[] };
}

export function dumpYaml(data: unknown): string { return yaml.dump(data); }
