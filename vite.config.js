import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    open: true,
  },
  build: {
    outDir: 'build',
  },
});
