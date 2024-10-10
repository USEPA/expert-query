import { defineConfig, loadEnv } from 'vite';
import istanbul from 'vite-plugin-istanbul';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const { VITE_SERVER_BASE_PATH } = process.env;

  // allows the app to be accessed from a sub directory of a server (e.g. /csb)
  const serverBasePath =
    mode === "development" ? "" : VITE_SERVER_BASE_PATH || "";

  return defineConfig({
    base: serverBasePath,
    build: {
      outDir: 'build',
      sourcemap: true,
      rollupOptions: {
        output: {
          entryFileNames: 'static/js/[name]-[hash].js',
          chunkFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: ({ name }) => {
            const css = /\.(css)$/.test(name ?? '');
            const font = /\.(woff|woff2|eot|ttf|otf)$/.test(name ?? '');
            const media = /\.(png|jpe?g|gif|svg|webp|webm|mp3)$/.test(name ?? ""); // prettier-ignore
            const type = css ? 'css/' : font ? 'fonts/' : media ? 'media/' : '';
            return `static/${type}[name]-[hash][extname]`;
          },
        },
      },
    },
    define: {
      'process.env': {},
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    plugins: [
      react(),
      istanbul({
        cypress: true,
        requireEnv: false,
      }),
      svgr(),
      viteTsconfigPaths(),
    ],
    server: {
      open: true,
      port: 3000,
      fs: {
        strict: false,
      },
    },
  });
};
