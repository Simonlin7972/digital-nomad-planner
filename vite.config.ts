import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset URLs, so the build works from a sub-path such as GitHub Pages' /<repo>/.
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  worker: { format: 'es' },
  // Six pages: the landing page at the root, the planner itself under /app/, the changelog under /changelog/, the
  // profile settings under /profile/, the cities page under /cities/ and the internal feature bento under /bento/
  // (published but linked from nowhere).
  build: {
    rollupOptions: {
      input: { main: 'index.html', app: 'app/index.html', changelog: 'changelog/index.html', profile: 'profile/index.html', cities: 'cities/index.html', bento: 'bento/index.html' },
    },
  },
});
