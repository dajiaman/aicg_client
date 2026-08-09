import { ref, onMounted } from 'vue'

/**
 * 系统字体管理 Hook
 * @returns {{
 *   systemFonts: Ref<FontItem[]>,   // 字体列表
 *   loading: Ref<boolean>,           // 加载状态
 *   loadFonts: () => Promise<void>,  // 加载字体列表
 *   preloadFont: (fontFamily: string) => Promise<void>, // 预加载单个字体
 *   handleFontChange: (fontFamily: string) => Promise<void>, // 字体切换处理
 *   filterFont: (input: string, option: any) => boolean, // 搜索过滤函数
 *   getFontOptionStyle: (font: FontItem) => object, // 选项样式
 * }}
 */
export function useSystemFonts() {
  const systemFonts = ref([])
  const loading = ref(false)
  const loadedFonts = new Set() // 已加载字体缓存

  // ---------- 1. 加载字体列表 ----------
  const loadFonts = async () => {
    loading.value = true
    try {
      // 优先从后端 API 获取
      let fonts = []
      if (window.api?.font?.getAvailable) {
        const result = await window.api.font.getAvailable()
        if (result?.success && Array.isArray(result.data)) {
          fonts = result.data.map((f) => ({
            value: f.displayName || f.fontName || f.family,
            label: f.displayName || f.fontName || f.family,
            fontFamily: f.family || f.fontName || f.displayName,
            fontPath: f.path || f.fontPath,
            fullFontName: f.fullFontName || f.displayName
          }))
        }
      }

      // 如果 API 不可用或返回空，使用内置备用字体列表
      if (fonts.length === 0) {
        fonts = getFallbackFonts()
      }

      // 去重（按 fontFamily）
      const seen = new Set()
      systemFonts.value = fonts.filter((f) => {
        const key = f.fontFamily
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      // 预加载当前选中的字体（如果有）
      const currentFont = systemFonts.value[0]?.fontFamily
      if (currentFont) {
        await preloadFont(currentFont)
      }
    } catch (error) {
      console.error('加载系统字体失败:', error)
      systemFonts.value = getFallbackFonts()
    } finally {
      loading.value = false
    }
  }

  // ---------- 2. 备用字体列表 ----------
  const getFallbackFonts = () => {
    return [
      { value: '微软雅黑', label: '微软雅黑', fontFamily: '微软雅黑' },
      { value: '思源黑体', label: '思源黑体', fontFamily: '思源黑体' },
      { value: '思源宋体', label: '思源宋体', fontFamily: '思源宋体' },
      { value: '方正粗黑宋简体', label: '方正粗黑宋简体', fontFamily: '方正粗黑宋简体' },
      { value: '优设标题黑', label: '优设标题黑', fontFamily: '优设标题黑' },
      { value: '东方大楷', label: '东方大楷', fontFamily: '东方大楷' },
      { value: '江城斜黑体', label: '江城斜黑体', fontFamily: '江城斜黑体' },
      { value: '阿里普惠体', label: '阿里普惠体', fontFamily: '阿里普惠体' },
      { value: '月星楷', label: '月星楷', fontFamily: '月星楷' },
      { value: 'Arial', label: 'Arial', fontFamily: 'Arial' },
      { value: 'Times New Roman', label: 'Times New Roman', fontFamily: 'Times New Roman' }
    ]
  }

  // ---------- 3. 预加载单个字体 ----------
  const preloadFont = async (fontFamily) => {
    if (!fontFamily || loadedFonts.has(fontFamily)) return
    try {
      // 方法一：使用 document.fonts.load（浏览器原生）
      await document.fonts.load(`16px "${fontFamily}"`)

      // 方法二：如果有本地字体文件路径，使用 FontFace API
      const fontItem = systemFonts.value.find((f) => f.fontFamily === fontFamily)
      if (fontItem?.fontPath) {
        const font = new FontFace(fontFamily, `url(file://${fontItem.fontPath})`)
        await font.load()
        document.fonts.add(font)
      }

      loadedFonts.add(fontFamily)
      console.log(`✅ 字体预加载完成: ${fontFamily}`)
    } catch (error) {
      console.warn(`⚠️ 字体预加载失败: ${fontFamily}`, error)
    }
  }

  // ---------- 4. 字体切换处理 ----------
  const handleFontChange = async (fontFamily) => {
    if (!fontFamily) return
    // 预加载新字体
    await preloadFont(fontFamily)
    // 强制刷新画布
    // 此函数由父组件传入，或通过事件触发
    if (window._forceRefreshCanvas) {
      window._forceRefreshCanvas()
    }
  }

  // ---------- 5. 搜索过滤函数 ----------
  const filterFont = (input, option) => {
    if (!input) return true
    const query = input.toLowerCase()
    const label = option?.label?.toLowerCase() || ''
    const value = option?.value?.toLowerCase() || ''
    return label.includes(query) || value.includes(query)
  }

  // ---------- 6. 选项样式（用于下拉列表预览） ----------
  const getFontOptionStyle = (font) => {
    return {
      fontFamily: `"${font.fontFamily}"`,
      fontSize: '14px'
    }
  }

  // ---------- 7. 生命周期 ----------
  onMounted(() => {
    loadFonts()
  })

  // ---------- 返回 ----------
  return {
    systemFonts,
    loading,
    loadFonts,
    preloadFont,
    handleFontChange,
    filterFont,
    getFontOptionStyle
  }
}
