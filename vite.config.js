   // vite.config.js
   import { defineConfig } from 'vite';
   import { resolve } from 'path';

   export default defineConfig({
     root: './',
     publicDir: 'public',
     build: {
       outDir: 'dist',
       assetsDir: 'assets',
       emptyOutDir: true,
     },
     server: {
       open: true,
       port: 3000
     },
     resolve: {
       alias: {
         '@': resolve(__dirname, './src')
       }
     }
   });