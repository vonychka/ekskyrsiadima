import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-htaccess',
      closeBundle: {
        sequential: true,
        handler() {
          // Copy .htaccess
          const sourceHtaccess = resolve(__dirname, 'public/.htaccess');
          const destHtaccess = resolve(__dirname, 'dist/.htaccess');
          
          if (existsSync(sourceHtaccess)) {
            try {
              copyFileSync(sourceHtaccess, destHtaccess);
              console.log('.htaccess successfully copied to dist folder');
            } catch (error) {
              console.error('Error copying .htaccess:', error);
            }
          } else {
            console.warn('Source .htaccess not found in public folder');
          }

          // Copy _redirects
          const sourceRedirects = resolve(__dirname, 'public/_redirects');
          const destRedirects = resolve(__dirname, 'dist/_redirects');
          
          if (existsSync(sourceRedirects)) {
            try {
              copyFileSync(sourceRedirects, destRedirects);
              console.log('_redirects successfully copied to dist folder');
            } catch (error) {
              console.error('Error copying _redirects:', error);
            }
          } else {
            console.warn('Source _redirects not found in public folder');
          }

          // Copy zip file from root to public and dist
          const sourceZip = resolve(__dirname, 'Архив.zip');
          const publicZip = resolve(__dirname, 'public/Архив.zip');
          const destZip = resolve(__dirname, 'dist/Архив.zip');
          
          if (existsSync(sourceZip)) {
            try {
              // Copy to public first
              copyFileSync(sourceZip, publicZip);
              console.log('Архив.zip successfully copied to public folder');
              
              // Then copy to dist
              copyFileSync(sourceZip, destZip);
              console.log('Архив.zip successfully copied to dist folder');
            } catch (error) {
              console.error('Error copying Архив.zip:', error);
            }
          } else {
            console.warn('Source Архив.zip not found in root folder');
          }
        }
      }
    }
  ],
  base: './', // This ensures relative paths work in production
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000,
  },
});
