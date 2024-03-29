import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/kit/vite';
import preprocess from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess({ sourceMap: true }),
	compilerOptions: { enableSourcemap: true },
	kit: {
		adapter: adapter({
			fallback: 'index.html',
			precompress: true
		}),
		output: {
			preloadStrategy: 'preload-mjs'
		},
		paths: {
			base: '/.admin'
		}
	}
};

export default config
