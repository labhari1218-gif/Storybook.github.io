// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: "https://labhari1218-gif.github.io",
  base: "/Storybook.github.io",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
