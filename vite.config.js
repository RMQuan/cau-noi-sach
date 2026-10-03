import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' để deploy được lên GitHub Pages hoặc mở ở thư mục con
export default defineConfig({
  plugins: [react()],
  base: './',
});
