import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { useYiStore } from '../state/store.js';
import { Qipan } from './Qipan.js';

describe('Qipan', () => {
  it('渲染所有节点', () => {
    useYiStore.setState({
      nodes: [
        { id: 'n1', parentId: null, type: 'intent', status: 'done', createdAt: 't',
          payload: { input: '整理下载文件夹', attachments: [], mountedAssets: [], mode: 'ask' }, childrenIds: [] },
      ],
      rootId: 'n1',
    });
    render(<Qipan />);
    expect(screen.getByText(/布势/)).toBeTruthy();
  });
});
