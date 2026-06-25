import { describe, it, expect, beforeEach } from 'vitest';
import { useYiStore } from './store.js';
import { mockAssets } from './mock-data.js';

beforeEach(() => {
  useYiStore.setState({ assets: [...mockAssets] });
});

describe('useYiStore', () => {
  it('toggleAutoUpdate 开则 editable 自动关(互斥)', () => {
    useYiStore.getState().toggleAutoUpdate('tesuji-photo-org');
    const a = useYiStore.getState().assets.find((x) => x.ref === 'tesuji-photo-org')!;
    expect(a.autoUpdate).toBe(false);
    expect(a.editable).toBe(false);
  });
  it('toggleEditable 开则 autoUpdate 自动关(互斥)', () => {
    useYiStore.getState().toggleEditable('tesuji-photo-org');
    const a = useYiStore.getState().assets.find((x) => x.ref === 'tesuji-photo-org')!;
    expect(a.editable).toBe(true);
    expect(a.autoUpdate).toBe(false);
  });
  it('都 off 合法', () => {
    useYiStore.setState({ assets: [{ ...mockAssets[0], autoUpdate: true, editable: false }] });
    useYiStore.getState().toggleAutoUpdate('tesuji-photo-org');
    const a = useYiStore.getState().assets.find((x) => x.ref === 'tesuji-photo-org')!;
    expect(a.autoUpdate).toBe(false);
    expect(a.editable).toBe(false);
  });
});
