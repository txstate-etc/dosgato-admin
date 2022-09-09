import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
  build: { sourcemap: true },
  css: { devSourcemap: true }
};

export default config;
