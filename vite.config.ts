import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset URLs, so the build works from a sub-path such as GitHub Pages' /<repo>/.
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  worker: { format: 'es' },
  // Four pages: the landing page at the root, the planner itself under /app/, the changelog under /changelog/ and
  // the profile settings under /profile/.
  build: { rollupOptions: { input: { main: 'index.html', app: 'app/index.html', changelog: 'changelog/index.html', profile: 'profile/index.html' } } },
});
