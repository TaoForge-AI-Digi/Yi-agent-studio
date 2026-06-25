import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useYiStore } from '../state/store.js';
import { mockAssets } from '../state/mock-data.js';
import { AssetLocks } from './AssetLocks.js';

beforeEach(() => {
  useYiStore.setState({ assets: [...mockAssets] });
});

describe('AssetLocks', () => {
  it('开 editable 自动关 autoUpdate', () => {
    render(<AssetLocks />);
    const editableCheckbox = screen.getByLabelText(/editable-tesuji-photo-org/);
    fireEvent.click(editableCheckbox);
    const a = useYiStore.getState().assets.find((x) => x.ref === 'tesuji-photo-org')!;
    expect(a.editable).toBe(true);
    expect(a.autoUpdate).toBe(false);
  });
});
