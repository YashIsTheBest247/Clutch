import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// AI Studio / Cloud Run compatible config.
// The Gemini API key is injected at build time as process.env.API_KEY,
// matching the AI Studio "build & deploy" template convention.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const key = env.GEMINI_API_KEY || env.API_KEY || '';
  const googleClientId = env.GOOGLE_CLIENT_ID || '';
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(key),
      'process.env.GEMINI_API_KEY': JSON.stringify(key),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    },
    server: { host: true, port: 5173 },
    preview: { host: true, port: Number(process.env.PORT) || 8080 },
    build: { outDir: 'dist', sourcemap: false },
  };
});
