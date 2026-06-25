import { describe, it, expect, beforeEach } from 'vitest';
import { useYiStore } from './store.js';
import { mockAssets } from './mock-data.js';

beforeEach(() => {
  useYiStore.setState({ assets: [...mockAssets] });
});

describe('useYiStore', () => {
  it('toggleAutoUpdate disables editable (mutual exclusion)', () => {
    useYiStore.getState().toggleAutoUpdate('photo-organizer');
    const a = useYiStore.getState().assets.find((x) => x.ref === 'photo-organizer')!;
    expect(a.autoUpdate).toBe(false);
    expect(a.editable).toBe(false);
  });
  it('toggleEditable disables autoUpdate (mutual exclusion)', () => {
    useYiStore.getState().toggleEditable('photo-organizer');
    const a = useYiStore.getState().assets.find((x) => x.ref === 'photo-organizer')!;
    expect(a.editable).toBe(true);
    expect(a.autoUpdate).toBe(false);
  });
  it('both off is valid', () => {
    useYiStore.setState({ assets: [{ ...mockAssets[0], autoUpdate: true, editable: false }] });
    useYiStore.getState().toggleAutoUpdate('photo-organizer');
    const a = useYiStore.getState().assets.find((x) => x.ref === 'photo-organizer')!;
    expect(a.autoUpdate).toBe(false);
    expect(a.editable).toBe(false);
  });
});
