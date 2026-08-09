/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{vue,js}'],
  // ⚠️ 禁用 preflight：避免 tailwind 的全局样式重置
  // 与 ant-design-vue 组件库冲突（antd 依赖 button / input 的默认样式）
  // 关闭后，tw- 类仍然可用，但不会重置 h1/h2/button 等元素默认样式
  corePlugins: {
    preflight: true
  },
  theme: {
    extend: {
      colors: {
        // 品牌主色：fuchsia 系（与 antd colorPrimary #d946ef 对齐）
        brand: {
          50: '#fdf4ff',
          100: '#fae8ff',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf'
        },
        // 品牌渐变末端：purple 系
        'brand-strong': {
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce'
        },
        // 辅助点缀色：cyan
        accent: {
          400: '#22d3ee',
          500: '#06b6d4'
        }
      }
    }
  },
  plugins: []
}
