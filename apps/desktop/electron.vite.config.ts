import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: { build: { rollupOptions: { input: { index: 'electron/main.ts' } } } },
  preload: { build: { rollupOptions: { input: { index: 'electron/preload.ts' } } } },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
  },
});
