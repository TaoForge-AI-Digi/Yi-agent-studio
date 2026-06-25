import React from 'react';
import './styles.css';
import { Qipan } from './components/Qipan.js';
import { Xiaomu } from './components/Xiaomu.js';
import { ShouGuan } from './components/ShouGuan.js';
import { BuShiBar } from './components/BuShiBar.js';
import { ModeSwitch } from './components/ModeSwitch.js';
import { AssetLocks } from './components/AssetLocks.js';
import { QipuIO } from './components/QipuIO.js';

export function App() {
  return (
    <div>
      <h1 style={{ padding: 24, margin: 0, borderBottom: '1px solid var(--line)' }}>弈</h1>
      <ModeSwitch />
      <QipuIO />
      <Qipan />
      <ShouGuan />
      <AssetLocks />
      <Xiaomu />
      <BuShiBar />
    </div>
  );
}
