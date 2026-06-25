import type { PermissionMode } from './permission.js';

export type NodeType = 'intent' | 'ponder' | 'plan' | 'action' | 'result' | 'checkpoint';
export type NodeStatus = 'running' | 'done' | 'stopped' | 'error';

export interface IntentPayload {
  input: string; attachments: string[];
  mountedAssets: { type: 'expert-pack' | 'tesuji' | 'qijing'; ref: string }[];
  mode: PermissionMode;
}
export interface PonderPayload {
  reasoning: string; modelUsed: string; tokensIn: number; tokensOut: number;
}
export interface PlanStep { id: string; description: string; tool: string; argsPreview: string; }
export interface PlanPayload { steps: PlanStep[]; }
export interface ActionPayload {
  stepId: string; tool: string; args: unknown; result: unknown; error?: string; durationMs: number;
}
export interface ResultPayload {
  summary: string; changes: { path: string; op: 'create' | 'modify' | 'delete' }[];
  durationMs: number; tokensTotal: number;
}
export interface CheckpointPayload { label: string; }

export type NodePayload =
  | IntentPayload | PonderPayload | PlanPayload
  | ActionPayload | ResultPayload | CheckpointPayload;

export interface YiNode {
  id: string; parentId: string | null; type: NodeType; status: NodeStatus;
  createdAt: string; payload: NodePayload; childrenIds: string[];
}
