import { resolve } from 'node:path';
import { withPageConfig } from '@extension/vite-config';

const rootDir = resolve(import.meta.dirname);
const srcDir = resolve(rootDir, 'src');
const packagesDir = resolve(rootDir, '..', '..', 'packages');

export default withPageConfig({
  resolve: {
    alias: {
      '@src': srcDir,
      '@extension/ui': resolve(packagesDir, 'ui'),
    },
  },
  publicDir: resolve(rootDir, 'public'),
  build: {
    lib: {
      name: 'ContentRuntimeScript',
      fileName: 'index',
      formats: ['iife'],
      entry: resolve(srcDir, 'index.ts'),
    },
    outDir: resolve(rootDir, '..', '..', 'dist', 'content-runtime'),
  },
});
