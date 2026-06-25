import React, { useRef, useEffect } from 'react';
import { Input, Button, Select, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useYiStore } from '../state/store.js';
import type { YiNode, IntentPayload, PonderPayload, PlanPayload, ActionPayload, ResultPayload } from '@yi/shared';

const { TextArea } = Input;

function MessageBubble({ node }: { node: YiNode }) {
  if (node.type === 'intent') {
    const p = node.payload as IntentPayload;
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: 12, background: '#1677ff', color: '#fff', fontSize: 14 }}>
          {p.input}
        </div>
      </div>
    );
  }

  if (node.type === 'ponder') {
    const p = node.payload as PonderPayload;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>分析中...</div>
        <div style={{ padding: '10px 14px', borderRadius: 12, background: '#f5f5f5', fontSize: 13, color: '#666' }}>
          {p.reasoning}
        </div>
      </div>
    );
  }

  if (node.type === 'plan') {
    const p = node.payload as PlanPayload;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>执行计划</div>
        <div style={{ padding: '10px 14px', borderRadius: 12, background: '#f5f5f5', fontSize: 13 }}>
          {p.steps.map((step, i) => (
            <div key={step.id} style={{ marginBottom: 4 }}>
              <span style={{ color: '#999' }}>{i + 1}.</span> {step.description}
              <span style={{ marginLeft: 8, fontSize: 11, color: '#bbb' }}>[{step.tool}]</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (node.type === 'action') {
    const p = node.payload as ActionPayload;
    return (
      <div style={{ marginBottom: 8, paddingLeft: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ color: node.status === 'done' ? '#52c41a' : node.status === 'running' ? '#1677ff' : '#999' }}>●</span>
          <span>{p.tool}</span>
          <span style={{ color: '#999', fontSize: 11 }}>{p.durationMs}ms</span>
          {p.error && <span style={{ color: '#ff4d4f', fontSize: 11 }}>{p.error}</span>}
        </div>
      </div>
    );
  }

  if (node.type === 'result') {
    const p = node.payload as ResultPayload;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ padding: '10px 14px', borderRadius: 12, background: '#f6ffed', border: '1px solid #b7eb8f', fontSize: 13 }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{p.summary}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            耗时 {(p.durationMs / 1000).toFixed(1)}s · {p.changes.length} 处改动
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function ChatView() {
  const nodes = useYiStore((s) => s.nodes);
  const mode = useYiStore((s) => s.mode);
  const setMode = useYiStore((s) => s.setMode);
  const addMessage = useYiStore((s) => s.addMessage);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = React.useState('');

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [nodes]);

  const handleSend = () => {
    if (!input.trim()) return;
    addMessage(input.trim());
    setInput('');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
        <span style={{ fontWeight: 500 }}>新对话</span>
        <Space size={8}>
          <Select value={mode} onChange={setMode} size="small" style={{ width: 130 }}
            options={[
              { value: 'plan', label: '只读规划' },
              { value: 'ask', label: '逐次确认' },
              { value: 'trusted', label: '信任执行' },
              { value: 'bypass', label: '完全放行' },
            ]} />
        </Space>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {nodes.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 120, color: '#bbb' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>弈</div>
            <div style={{ fontSize: 13 }}>开始新的对话</div>
          </div>
        )}
        {nodes.map((n) => <MessageBubble key={n.id} node={n} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextArea value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="输入指令..." autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
            style={{ flex: 1 }} />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend}
            disabled={!input.trim()} style={{ alignSelf: 'flex-end' }} />
        </div>
      </div>
    </div>
  );
}
