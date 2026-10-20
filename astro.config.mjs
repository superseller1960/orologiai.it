import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://orologiai.it',
  srcDir: './site/src',
  publicDir: './site/assets',
  outDir: './dist',
  output: 'static',
  trailingSlash: 'always',
  server: { host: '0.0.0.0', port: 3000 },
  vite: { server: { strictPort: true } },
});
