import path from "path"
import { fileURLToPath } from "url"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'lightweight-charts': ['lightweight-charts'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-date': ['date-fns'],
          'vendor-icons': ['lucide-react'],
          // 不要给 radix 单独分组：dialog/popover/tabs/tooltip 及其 @floating-ui 依赖
          // 的引用方全在私有 overlay / 懒加载页面里（入口只用到 react-slot ~1.7 kB）。
          // 之前把它们并成一个 vendor chunk 会让入口静态 import 它，首屏被迫下载
          // 整包 26.7 kB (gzip) 的 floating-ui + popper + remove-scroll 机件。
        },
      },
    },
  },
})
