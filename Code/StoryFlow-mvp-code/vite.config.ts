import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    // 兼容旧版 Android 微信内置浏览器（X5 / 低版本 Chromium），避免白屏或语法不兼容
    legacy({
      targets: ['defaults', 'Android >= 5', 'iOS >= 10', 'Chrome >= 61'],
      modernPolyfills: true,
    }),
  ],
  server: {
    open: true,
    port: 5173, // 默认端口，可自定义
  },
  build: {
    // 与 legacy 插件配合，降低输出语法版本
    target: 'es2015',
    cssTarget: 'chrome61',
  },
});
