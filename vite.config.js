import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
  build: { sourcemap: true },
  css: { devSourcemap: true },
  optimizeDeps: {
    exclude: ['@iconify-icons/ph', '@iconify-icons/mdi', '@iconify-icons/material-symbols', '@iconify-icons/file-icons']
  }
};

export default config;
