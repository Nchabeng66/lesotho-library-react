// Configures Vite and its React JSX transformation plugin.
// base './' makes the built site work from any GitHub Pages address.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
});
