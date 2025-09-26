import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
const buildTimestamp = new Date().toISOString();

export default defineConfig({
  plugins: [react()],
  define: {

  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      papaparse: path.resolve(__dirname, 'src/lib/papaparse.ts'),
      '@supabase/supabase-js': path.resolve(__dirname, 'src/lib/supabaseStub.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
