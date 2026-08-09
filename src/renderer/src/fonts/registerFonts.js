// 自定义字体注册模块
//
// 字体文件内部的 familyName 多为 GBK 编码中文（乱码）或英文，不可直接当作
// fontFamily 使用。这里用主进程返回的「稳定的中文别名」（与 CoverView 模板里
// 引用的字体名一致）注册到 document.fonts，FontFace 自动按路径加载对应文件。
//
// alias 的来源：主进程扫描 fonts 目录后，把「去掉扩展名的文件名」作为 alias
// 返回（如 "东方大楷.ttf" -> "东方大楷"）。
//
// 字体文件随安装包分发在 resources/fonts，运行时由主进程同步到用户 home
// 下的 aigc-client/fonts（开发模式直接用项目根 fonts/）。
//
// 注册以单例 Promise 形式存在：首次调用 ensureFontsReady() 才真正向主进程
// 请求字体 map 并注册；之后任意组件（如 CoverView 在渲染前）调用都复用同一
// 结果，避免受组件挂载顺序影响。

// 已注册的字体别名集合，避免重复注册
const registered = new Set()

// 单例：注册流程只执行一次
let ensurePromise = null

// 把本地字体文件注册为 FontFace（仅在尚未注册时执行）
function registerFont(font) {
  if (registered.has(font.displayName)) return Promise.resolve(true)
  try {
    // 主进程返回的是绝对路径，转 file:// URL；Windows 路径里分隔符要转 /
    const fileUrl = `file:///${String(font.path).replace(/\\/g, '/')}`
    const face = new FontFace(font.displayName, `url("${fileUrl}")`)
    registered.add(font.displayName)

    document.fonts.add(face)
    // 触发加载，确保后续 Canvas/HTML 渲染前字体已就绪
    return face
      .load()
      .then(() => {
        // console.log(`[fonts] 加载成功: ${font.displayName} (${fileUrl})`)
        return true
      })
      .catch((e) => {
        // console.error(`[fonts] 加载失败: ${font.displayName} (${fileUrl})`, e)
        registered.delete(font.displayName)
        return false
      })
  } catch (e) {
    // console.error(`[fonts] 注册失败: ${font.displayName}`, e)
    registered.delete(font.displayName)
    return Promise.resolve(false)
  }
}

/**
 * 注册全部自定义字体
 * @param {*} fonts
 * @returns
 */
async function registerAllFonts(fonts) {
  if (!fonts || typeof fonts !== 'object' || typeof FontFace === 'undefined') return []

  const results = await Promise.all(fonts.map((font) => registerFont(font).then((ok) => ok)))
  const ok = results.filter(Boolean)
  console.log(`[fonts] 已注册 ${ok.length}/${fonts.length} 个字体`)
  return ok
}

// 确保字体已注册并加载完成（幂等单例）。
// 通过 window.api.app.getFontsList 获取 alias -> 文件路径 的 map；失败则 resolve，交给浏览器 fallback。
export function ensureFontsReady() {
  if (ensurePromise) return ensurePromise
  ensurePromise = (async () => {
    try {
      const res = await window.api.font.getAvailable()
      if (res?.success && res.data && res.data.length > 0) {
        return await registerAllFonts(res.data)
      }
      console.warn('[fonts] 获取字体目录失败，将使用系统字体 fallback')
      return []
    } catch (e) {
      console.error('[fonts] 注册字体异常', e)
      return []
    }
  })()
  return ensurePromise
}

// 等待某个字体就绪（用于渲染前确保不 fallback）。
// 若字体未注册（如系统字体或别名不存在），直接 resolve。
export async function ensureFontReady(family, weight = 'normal', style = 'normal') {
  if (!family || typeof document === 'undefined' || !document.fonts) return
  try {
    await document.fonts.load(`${style} ${weight} 16px "${family}"`)
  } catch {
    /* 忽略：可能该字体未注册，交给浏览器 fallback */
  }
}
