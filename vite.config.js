import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages base path.
// The default './' makes every asset path relative, so the build works from any
// repository name (https://<user>.github.io/<repo>/) because routing uses HashRouter.
// To pin an absolute base instead, set VITE_BASE, e.g.  VITE_BASE=/poker-dojo/ npm run build
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || './',
});
