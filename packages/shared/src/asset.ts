export interface AssetRef { type: string; ref: string; version: string; }

export interface AssetInstallState {
  ref: string;
  version: string;
  autoUpdate: boolean;
  editable: boolean;
  source: 'registry' | 'local' | 'git';
  installedAt: string;
}

export function isValidLockCombo(s: { autoUpdate: boolean; editable: boolean }): boolean {
  return !(s.autoUpdate && s.editable);
}
