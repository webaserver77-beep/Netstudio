import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          // Split heavyweight vendor libraries into their own cached chunks.
          // Use precise package-boundary matching so sub-dependencies that
          // merely CONTAIN "react"/"motion" in their path don't cross-group
          // and create circular chunks.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            const pkg = id.split(/[\\/]node_modules[\\/]/).pop() || '';
            if (pkg.startsWith('@firebase') || pkg.startsWith('firebase')) return 'vendor-firebase';
            if (pkg.startsWith('hls.js')) return 'vendor-hls';
            if (pkg.startsWith('lucide-react')) return 'vendor-icons';
            if (
              pkg.startsWith('react/') ||
              pkg === 'react' ||
              pkg.startsWith('react-dom') ||
              pkg.startsWith('scheduler')
            ) {
              return 'vendor-react';
            }
            if (pkg.startsWith('framer-motion') || pkg.startsWith('motion')) return 'vendor-motion';
            return 'vendor-misc';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
