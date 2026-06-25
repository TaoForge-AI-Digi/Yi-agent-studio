<template>
  <div v-if="node.type === 'intent'" class="msg-user">
    <div class="msg-bubble user">{{ (node.payload as IntentPayload).input }}</div>
  </div>
  <div v-else-if="node.type === 'ponder'" class="msg-agent">
    <div class="msg-label">分析中</div>
    <div class="msg-bubble reasoning">{{ (node.payload as PonderPayload).reasoning }}</div>
  </div>
  <div v-else-if="node.type === 'plan'" class="msg-agent">
    <div class="msg-label">执行计划</div>
    <div class="msg-bubble">
      <div v-for="(step, i) in (node.payload as PlanPayload).steps" :key="step.id" class="plan-step">
        <span class="step-num">{{ i + 1 }}.</span>
        <span>{{ step.description }}</span>
        <span class="step-tool">[{{ step.tool }}]</span>
      </div>
    </div>
  </div>
  <div v-else-if="node.type === 'action'" class="msg-tool">
    <n-icon :class="['tool-icon', node.status]" size="14">
      <CheckmarkCircleOutline v-if="node.status === 'done'" />
      <SyncOutline v-else-if="node.status === 'running'" class="rotating" />
      <CloseCircleOutline v-else-if="node.status === 'error'" />
      <RemoveOutline v-else />
    </n-icon>
    <span>{{ (node.payload as ActionPayload).tool }}</span>
    <span class="tool-duration">{{ (node.payload as ActionPayload).durationMs }}ms</span>
  </div>
  <div v-else-if="node.type === 'result'" class="msg-agent">
    <div class="msg-bubble result">
      <div class="result-title">{{ (node.payload as ResultPayload).summary }}</div>
      <div class="result-meta">
        耗时 {{ ((node.payload as ResultPayload).durationMs / 1000).toFixed(1) }}s · {{ (node.payload as ResultPayload).changes.length }} 处改动
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NIcon } from 'naive-ui';
import { CheckmarkCircleOutline, SyncOutline, CloseCircleOutline, RemoveOutline } from '@vicons/ionicons5';
import type { YiNode, IntentPayload, PonderPayload, PlanPayload, ActionPayload, ResultPayload } from '@yi/shared';

defineProps<{ node: YiNode }>();
</script>

<style scoped>
.msg-user { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.msg-agent { margin-bottom: 16px; }
.msg-tool { display: flex; align-items: center; gap: 6px; padding-left: 20px; margin-bottom: 4px; font-size: 13px; color: #666; }
.msg-label { font-size: 12px; color: #999; margin-bottom: 4px; }
.msg-bubble {
  display: inline-block;
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}
.msg-bubble.user { background: #1677ff; color: #ffffff; }
.msg-bubble.reasoning { background: #fafafa; color: #666; }
.msg-bubble.result { background: #f6ffed; border: 1px solid #b7eb8f; }
.result-title { font-weight: 500; margin-bottom: 4px; }
.result-meta { font-size: 12px; color: #666; }
.plan-step { margin-bottom: 4px; }
.step-num { color: #999; margin-right: 4px; }
.step-tool { margin-left: 8px; font-size: 11px; color: #bbb; }
.tool-icon.done { color: #52c41a; }
.tool-icon.running { color: #1677ff; }
.tool-icon.error { color: #ff4d4f; }
.tool-icon.stopped { color: #999; }
.tool-duration { color: #999; font-size: 11px; }
.rotating { animation: rotate 1s linear infinite; }
@keyframes rotate { to { transform: rotate(360deg); } }
</style>
