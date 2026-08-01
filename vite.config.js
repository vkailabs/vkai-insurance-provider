import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server runs on 5174 to match the Entra ID redirect URI
// registered for "VKAI Insurance Provider Portal".
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
});
