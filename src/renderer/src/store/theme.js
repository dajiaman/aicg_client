import { defineStore } from 'pinia'

// 所有主题颜色配置（从混淆代码中提取的 20+ 个主题）
const themePresets = {
  default: {
    name: '默认主题',
    id: 'default',
    colors: {
      '--theme-primary': '#3457fe',
      '--theme-primary-light': '#4567ff',
      '--theme-primary-dark': '#2347ed',
      '--theme-secondary': '#e071ff',
      '--theme-secondary-light': '#f082ff',
      '--theme-secondary-dark': '#d060ee',
      '--theme-accent': '#e895ff',
      '--theme-success': '#6ee7b7',
      '--theme-warning': '#fbbf24',
      '--theme-error': '#ff4757',
      '--theme-error-light': '#ff7875',
      '--theme-error-lighter': '#ff9c9c',
      '--theme-background': '#1a1d29',
      '--theme-background-light': '#252834',
      '--theme-background-lighter': '#2a2d3a',
      '--theme-background-card': '#2a3150',
      '--theme-background-card-alt': '#3a4060',
      '--theme-surface-hover': '#2d3142',
      '--theme-gradient-surface-end': '#3a3f54',
      '--theme-text-primary': '#ffffff',
      '--theme-text-secondary': '#e4e4e7',
      '--theme-text-tertiary': '#f0f0f0',
      '--theme-text-muted': '#9ca3af',
      '--theme-text-disabled': '#6b7280',
      '--theme-text-gradient-purple': '#c4b5fd',
      '--theme-border': 'rgba(91, 77, 255, 0.2)',
      '--theme-border-light': 'rgba(91, 77, 255, 0.3)',
      '--theme-border-strong': 'rgba(91, 77, 255, 0.4)',
      '--theme-border-purple': 'rgba(224, 113, 255, 0.3)',
      '--theme-border-purple-light': 'rgba(224, 113, 255, 0.5)',
      '--theme-border-gray': 'rgba(156, 163, 175, 0.3)',
      '--theme-shadow-primary': 'rgba(224, 113, 255, 0.2)',
      '--theme-shadow-primary-strong': 'rgba(224, 113, 255, 0.3)',
      '--theme-shadow-primary-stronger': 'rgba(224, 113, 255, 0.4)',
      '--theme-shadow-primary-strongest': 'rgba(224, 113, 255, 0.5)',
      '--theme-shadow-dark': 'rgba(0, 0, 0, 0.3)',
      '--theme-shadow-darker': 'rgba(0, 0, 0, 0.5)',
      '--theme-overlay-light': 'rgba(255, 255, 255, 0.04)',
      '--theme-overlay-medium': 'rgba(255, 255, 255, 0.1)',
      '--theme-overlay-hover': 'rgba(0, 0, 0, 0.04)',
      '--theme-overlay-purple': 'rgba(91, 77, 255, 0.05)',
      '--theme-overlay-purple-light': 'rgba(91, 77, 255, 0.08)',
      '--theme-overlay-purple-medium': 'rgba(91, 77, 255, 0.1)',
      '--theme-overlay-purple-strong': 'rgba(224, 113, 255, 0.1)',
      '--theme-overlay-purple-stronger': 'rgba(224, 113, 255, 0.15)',
      '--theme-overlay-purple-strongest': 'rgba(224, 113, 255, 0.2)',
      '--theme-scrollbar-track-light': 'rgba(42, 45, 58, 0.5)',
      '--theme-modal-header-bg': 'rgba(26, 29, 41, 0.9)',
      '--theme-modal-footer-bg': 'rgba(26, 29, 41, 0.9)',
      '--theme-modal-border': 'rgba(224, 113, 255, 0.4)',
      '--theme-modal-button-primary-bg': 'linear-gradient(90deg, #3457fe, #e071ff)',
      '--theme-modal-button-primary-hover-bg': 'linear-gradient(90deg, #5a7aff, #e895ff)',
      '--theme-modal-button-primary-shadow': 'rgba(224, 113, 255, 0.4)',
      '--theme-table-header-bg': 'rgba(42, 45, 58, 0.3)',
      '--theme-table-row-bg': 'rgba(42, 45, 58, 0.1)',
      '--theme-table-border': 'rgba(224, 113, 255, 0.3)',
      '--theme-menu-item-hover-bg': 'rgba(52, 87, 254, 0.1)',
      '--theme-menu-item-selected-bg': 'rgba(224, 113, 255, 0.2)',
      '--theme-input-bg': 'rgba(42, 45, 58, 0.8)',
      '--theme-input-border': 'rgba(224, 113, 255, 0.7)',
      '--theme-input-hover-border': 'rgba(224, 113, 255, 0.8)',
      '--theme-input-focus-border': 'rgba(224, 113, 255, 0.9)',
      '--theme-input-focus-shadow': 'rgba(224, 113, 255, 0.2)',
      '--theme-select-dropdown-bg': 'rgba(26, 26, 26, 1)',
      '--theme-select-dropdown-border': 'rgba(224, 113, 255, 0.5)',
      '--theme-select-item-active-bg': 'rgba(224, 113, 255, 0.3)',
      '--theme-select-item-selected-bg': 'rgba(224, 113, 255, 0.4)',
      '--theme-select-item-hover-bg': 'rgba(224, 113, 255, 0.25)',
      '--theme-radio-inner-bg': 'rgba(42, 45, 58, 0.5)',
      '--theme-radio-inner-border': 'rgba(224, 113, 255, 0.7)',
      '--theme-radio-checked-border': '#e071ff',
      '--theme-border-card': 'rgba(224, 113, 255, 0.6)',
      '--theme-platform-douyin': '#fe2c55',
      '--theme-platform-kuaishou': '#ff5000',
      '--theme-platform-wechat': '#07c160',
      '--theme-platform-xiaohongshu': '#ff2442',
      '--theme-status-active-bg': 'rgba(30, 64, 175, 0.2)',
      '--theme-status-active-color': '#60a5fa',
      '--theme-status-inactive-bg': 'rgba(217, 119, 6, 0.2)',
      '--theme-status-inactive-color': '#fbbf24',
      '--theme-modal-overlay': 'rgba(0, 0, 0, 0.5)',
      '--theme-modal-bg': 'rgba(42, 45, 58, 0.95)',
      '--theme-success-dark': '#059669',
      '--theme-warning-dark': '#d97706',
      '--theme-error-dark': '#dc2626',
      '--theme-info': '#06b6d4',
      '--theme-info-dark': '#0891b2',
      '--theme-alert-success-bg': 'rgba(110, 231, 183, 0.15)',
      '--theme-alert-success-border': 'rgba(110, 231, 183, 0.3)',
      '--theme-alert-error-bg': 'rgba(255, 77, 79, 0.2)',
      '--theme-alert-warning-bg': 'rgba(250, 173, 20, 0.15)',
      '--theme-alert-warning-border': 'rgba(250, 173, 20, 0.4)',
      '--theme-modal-button-danger-shadow': 'rgba(255, 77, 79, 0.4)',
      '--theme-tag-success-text': '#95de64',
      '--theme-tag-success-light': '#a7f3d0',
      '--theme-tag-warning-text': '#ffc53d',
      '--theme-tag-default-bg': 'rgba(217, 217, 217, 0.2)',
      '--theme-tag-default-border': '#d9d9d9',
      '--theme-tag-default-text': '#d9d9d9',
      '--theme-tag-purple-text': '#e9d5ff',
      '--theme-tag-processing-text': '#f0abfc',
      '--theme-gradient-warning-btn': 'linear-gradient(90deg, #faad14, #ffc53d)',
      '--theme-gradient-warning-btn-hover': 'linear-gradient(90deg, #ffc53d, #ffd666)',
      '--app-font-scale': 1.14,
      '--app-font-size-micro': '12px',
      '--app-font-size-meta': '13px',
      '--app-font-size-caption': '14px',
      '--app-font-size-secondary': '15px',
      '--app-font-size-body': '16px',
      '--app-font-size-control': '16px',
      '--app-font-size-card-title': '18px',
      '--app-font-size-section-title': '22px',
      '--app-font-size-page-title': '28px'
    }
  },
  blue: {
    name: '蓝色科技',
    id: 'blue',
    colors: {/* ... */}
  },
  green: {
    name: '自然绿意',
    id: 'green',
    colors: {/* ... */}
  },
  dark: {
    name: '暗黑酷炫',
    id: 'dark',
    colors: {/* ... */}
  },
  violet: {
    name: '紫罗兰梦幻',
    id: 'violet',
    colors: {/* ... */}
  },
  orange: {
    name: '橙色活力',
    id: 'orange',
    colors: {/* ... */}
  },
  cyan: {
    name: '青色清新',
    id: 'cyan',
    colors: {/* ... */}
  },
  rose: {
    name: '玫瑰粉红',
    id: 'rose',
    colors: {/* ... */}
  },
  indigo: {
    name: '靛蓝深邃',
    id: 'indigo',
    colors: {/* ... */}
  },
  aurora: {
    name: '午夜极光',
    id: 'aurora',
    colors: {/* ... */}
  },
  mint: {
    name: '薄荷清凉',
    id: 'mint',
    colors: {/* ... */}
  },
  amber: {
    name: '琥珀金黄',
    id: 'amber',
    colors: {/* ... */}
  },
  ocean: {
    name: '深海蓝调',
    id: 'ocean',
    colors: {/* ... */}
  },
  sakura: {
    name: '樱花粉嫩',
    id: 'sakura',
    colors: {/* ... */}
  },
  dusk: {
    name: '暗夜紫霞',
    id: 'dusk',
    colors: {/* ... */}
  },
  flame: {
    name: '烈焰红莲',
    id: 'flame',
    colors: {/* ... */}
  },
  forest: {
    name: '森林翠绿',
    id: 'forest',
    colors: {/* ... */}
  },
  royal: {
    name: '皇家紫金',
    id: 'royal',
    colors: {/* ... */}
  },
  burgundy: {
    name: '酒红丝绒',
    id: 'burgundy',
    colors: {/* ... */}
  },
  luxury: {
    name: '黑金奢华',
    id: 'luxury',
    colors: {/* ... */}
  },
  light: {
    name: '经典白昼',
    id: 'light',
    colors: {/* ... */}
  },
  cream: {
    name: '柔和米白',
    id: 'cream',
    colors: {/* ... */}
  },
  sky: {
    name: '清新天空',
    id: 'sky',
    colors: {/* ... */}
  },
  pink: {
    name: '温柔粉色',
    id: 'pink',
    colors: {/* ... */}
  },
  'mint-light': {
    name: '春日薄荷',
    id: 'mint-light',
    colors: {/* ... */}
  },
  lavender: {
    name: '淡雅紫韵',
    id: 'lavender',
    colors: {/* ... */}
  },
  peach: {
    name: '暖阳橙光',
    id: 'peach',
    colors: {/* ... */}
  },
  aqua: {
    name: '海洋碧波',
    id: 'aqua',
    colors: {/* ... */}
  },
  'rose-light': {
    name: '玫瑰花园',
    id: 'rose-light',
    colors: {/* ... */}
  },
  slate: {
    name: '优雅灰调',
    id: 'slate',
    colors: {/* ... */}
  }
}

// ---------- 字体大小预设 ----------
const fontSizePresets = [
  {
    id: 'compact',
    label: '紧凑',
    description: '适合高密度信息展示',
    scale: 1,
    micro: 11,
    meta: 12,
    caption: 12,
    secondary: 13,
    body: 14,
    control: 14,
    cardTitle: 16,
    sectionTitle: 20,
    pageTitle: 24
  },
  {
    id: 'standard',
    label: '标准',
    description: '推荐，阅读更轻松',
    scale: 1.07,
    micro: 12,
    meta: 13,
    caption: 13,
    secondary: 14,
    body: 15,
    control: 15,
    cardTitle: 17,
    sectionTitle: 21,
    pageTitle: 26
  },
  {
    id: 'comfortable',
    label: '舒适',
    description: '比紧凑略清晰',
    scale: 1.14,
    micro: 12,
    meta: 13,
    caption: 14,
    secondary: 15,
    body: 16,
    control: 16,
    cardTitle: 18,
    sectionTitle: 22,
    pageTitle: 28
  },
  {
    id: 'large',
    label: '大',
    description: '适合高分屏和远距离阅读',
    scale: 1.29,
    micro: 14,
    meta: 15,
    caption: 16,
    secondary: 17,
    body: 18,
    control: 18,
    cardTitle: 20,
    sectionTitle: 26,
    pageTitle: 32
  }
]

// 应用主题颜色到 CSS 变量
function applyThemeColors(themeId) {
  const theme = themePresets[themeId]
  if (!theme) {
    console.warn(`主题 "${themeId}" 不存在，使用默认主题`)
    return applyThemeColors('default')
  }
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`${key}`, value)
  })
  console.log(`已应用主题: ${theme.name}`)
  return theme
}

// 获取所有主题列表（用于下拉菜单）
function getThemeList() {
  return Object.keys(themePresets).map((id) => ({
    id,
    name: themePresets[id].name
  }))
}

// 获取主题配置（根据 id）
function getThemeConfig(id) {
  return themePresets[id] || themePresets.default
}

// 获取字体大小预设对象
function getFontSizePreset(id) {
  return fontSizePresets.find((p) => p.id === id) || fontSizePresets[2] // 默认舒适
}

// 生成字体 CSS 变量
function generateFontSizeVars(presetId) {
  const preset = getFontSizePreset(presetId)
  return {
    '--app-font-scale': String(preset.scale),
    '--app-font-size-micro': preset.micro + 'px',
    '--app-font-size-meta': preset.meta + 'px',
    '--app-font-size-caption': preset.caption + 'px',
    '--app-font-size-secondary': preset.secondary + 'px',
    '--app-font-size-body': preset.body + 'px',
    '--app-font-size-control': preset.control + 'px',
    '--app-font-size-card-title': preset.cardTitle + 'px',
    '--app-font-size-section-title': preset.sectionTitle + 'px',
    '--app-font-size-page-title': preset.pageTitle + 'px'
  }
}

// 应用字体大小到 DOM
function applyFontSize(presetId, root = document.documentElement) {
  const vars = generateFontSizeVars(presetId)
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  return getFontSizePreset(presetId)
}

// 从 localStorage 读取字体预设
function loadFontSizePreset(storage = window.localStorage) {
  const key = 'app-font-size-preset'
  const stored = storage.getItem(key)
  return stored || 'comfortable'
}

// 保存字体预设到 localStorage
function saveFontSizePreset(presetId, storage = window.localStorage) {
  storage.setItem('app-font-size-preset', presetId)
  return presetId
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    currentTheme: 'default',
    availableThemes: [],
    currentFontSizePreset: 'comfortable'
  }),
  getters: {
    themeName: (state) => state.currentTheme,
    themeConfig: (state) => getThemeCofnig(state.currentTheme),
    themes: (state) => state.availableThemes,
    fontSizePreset: (state) => state.currentFontSizePreset,
    fontSizePresets: (state) => state.fontSizePresets
  },
  actions: {
    init(themeId) {
      const storedTheme = localStorage.getItem('app-theme')
      const fontSizeStored = loadFontSizePreset()
      const userSelected = localStorage.getItem('app-theme-user-selected') === 'true'

      // 加载可用主题列表
      this.availableThemes = getThemeList()

      // 恢复字体大小
      this.currentFontSizePreset = fontSizeStored

      // 恢复主题
      let targetTheme = themeId
      if (userSelected && storedTheme) {
        // 如果用户曾经手动选择过主题，且存储的主题有效
        const exists = this.availableThemes.some((t) => t.id === storedTheme)
        if (exists) {
          targetTheme = storedTheme
        }
      }
      // 应用主题（不持久化，因为 init 时从存储恢复，无需再存）
      this.setTheme(targetTheme, { persist: false })
      // 应用字体大小（同样不持久化）
      this.setFontSizePreset(this.currentFontSizePreset, { persist: false })
    },

    setTheme(themeId, { persist = false }) {
      try {
        const theme = applyThemeColors(themeId)
        if (!theme) return false

        this.currentTheme = themeId
        if (persist) {
          localStorage.setItem('app-theme', themeId)
          localStorage.setItem('app-theme-user-selected', 'true')
        }
        console.log(`主题已切换: ${theme.name}`)
        return true
      } catch (error) {
        console.error('切换主题失败:', error)
        return false
      }
    },

    resetTheme() {
      this.setTheme('default')
    },

    // 设置字体大小预设
    setFontSizePreset(presetId, { persist = false } = {}) {
      try {
        const preset = applyFontSize(presetId)
        if (!preset) return false

        this.currentFontSizePreset = preset.id
        if (persist) {
          saveFontSizePreset(preset.id)
        }
        console.log(`界面字号已切换: ${preset.label}`)
        return true
      } catch (error) {
        console.error('切换界面字号失败:', error)
        return false
      }
    }
  }
})
