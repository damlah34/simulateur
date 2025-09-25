import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      papaparse: path.resolve(__dirname, 'src/lib/papaparse.ts'),
      '@supabase/supabase-js': path.resolve(__dirname, '../src/lib/supabaseStub.ts'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
