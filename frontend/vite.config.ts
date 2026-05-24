import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: "/phishing-awareness-simulator/",
  plugins: [react()]
});
