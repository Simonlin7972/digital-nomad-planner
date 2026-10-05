import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset URLs, so the build works from a sub-path such as GitHub Pages' /<repo>/.
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  worker: { format: 'es' },
});
