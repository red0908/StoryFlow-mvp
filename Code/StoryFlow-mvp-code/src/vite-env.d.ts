/// <reference types="vite/client" />

// 支持导入 .less 文件（样式侧边效应或 CSS Modules）
declare module '*.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
