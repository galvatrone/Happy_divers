import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [
    react(),
    glsl({ compress: false }),
  ],
  publicDir: 'public',
  assetsInclude: ['**/*.glb'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three'],
          'r3f': ['@react-three/fiber', '@react-three/drei'],
          'gsap': ['gsap'],
        },
      },
    },
  },
  server: {
    fs: { allow: ['..'] },
  },
});
