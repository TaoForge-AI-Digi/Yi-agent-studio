import React from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useYiStore } from '../state/store.js';

export function Sidebar() {
  const sessions = useYiStore((s) => s.sessions);
  const activeSessionId = useYiStore((s) => s.activeSessionId);
  const switchSession = useYiStore((s) => s.switchSession);
  const createSession = useYiStore((s) => s.createSession);

  return (
    <div style={{ width: 260, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>弈</span>
        <Button type="text" icon={<PlusOutlined />} onClick={createSession} size="small" />
      </div>
      <div style={{ padding: '8px 12px' }}>
        <Input prefix={<SearchOutlined />} placeholder="搜索对话..." size="small" allowClear />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
        {sessions.map((s) => (
          <div key={s.id} onClick={() => switchSession(s.id)}
            style={{ padding: '10px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
              background: s.id === activeSessionId ? '#f0f5ff' : 'transparent',
              border: s.id === activeSessionId ? '1px solid #bae0ff' : '1px solid transparent' }}>
            <div style={{ fontSize: 14, fontWeight: s.id === activeSessionId ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.title}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
              {new Date(s.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
