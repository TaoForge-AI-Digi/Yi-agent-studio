import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { Sidebar } from './components/Sidebar.js';
import { ChatView } from './components/ChatView.js';
import './styles.css';

export function App() {
  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#1677ff', borderRadius: 6 } }}>
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <ChatView />
      </div>
    </ConfigProvider>
  );
}
