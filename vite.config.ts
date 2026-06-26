import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/steam-api': {
        target: 'https://store.steampowered.com/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/steam-api/, ''),
      },
      '/steamspy-api': {
        target: 'https://steamspy.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/steamspy-api/, '/api.php'),
      },
      '/steam-charts': {
        target: 'https://api.steampowered.com/ISteamChartsService',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/steam-charts/, ''),
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths()
  ],
})
