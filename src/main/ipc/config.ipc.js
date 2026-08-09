// config:*  —  系统配置 / 设置（settings 表）
// 与 db:* 通道的区别：
//   - db:config:*  → 旧通道名，仍然被一些底层代码引用，保留作为别名
//   - config:*     → 新通道名，专门面向 renderer 端 window.api.config.* 使用
import logger from '../log'
import { models } from '../database/services'

/**
 * 注册 config:* 通道
 *
 * 暴露：
 *   config:getAll()                → 所有配置项（数组）
 *   config:getGrouped()            → 按 category 分组的对象
 *   config:getByCategory(category) → 单 category 的 k-v
 *   config:get(key)                → { success, data: parsedValue | null }
 *   config:set(key, value, cat?, desc?)
 *   config:setCategory(category, data)
 *   config:delete(key)
 *   config:resetCategory(category)
 */
export function registerConfigIpc(ipcMain) {
  logger.info('[config] registering config ipc')

  ipcMain.handle('config:get-all', () => {
    logger.info('[config:get-all]')
    try {
      const allConfig = models.config.getAll()
      // 把config 处理成  {general: {runmode: 'dev'}}} 这种
      const groupedConfig = {}
      allConfig.forEach((item) => {
        const category = item.category
        const key = item.key.split('.')[1]
        if (!groupedConfig[category]) {
          groupedConfig[category] = {}
        }

        if (typeof item.value === 'string' && item.value.startsWith('{')) {
          groupedConfig[category][key] = JSON.parse(item.value)
        } else {
          groupedConfig[category][key] = item.value
        }
      })

      return { success: true, data: groupedConfig }
    } catch (e) {
      logger.error(`[config:getAll] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  /**
   * 获取单 category 的配置项
   * @param {string} category - 配置项所属的 category
   * @returns {Promise<{success: boolean, data: any | null}>} - 包含配置项值或 null 的对象
   */
  ipcMain.handle('config:get-category', (_, category) => {
    logger.info(`[config:get-category] category: ${category}`)
    if (!category) {
      return { success: false, error: 'category is required' }
    }

    try {
      const value = models.config.getByCategory(category)
      const obj = {}
      Object.keys(value).forEach((key) => {
        const categoryKey = key.split('.')[1]
        // 如果value 里面的是json 字符串，解析为对象
        if (typeof value[key] === 'string' && value[key].startsWith('{')) {
          obj[categoryKey] = JSON.parse(value[key])
        } else {
          obj[categoryKey] = value[key]
        }
      })

      // 服务层在没有值时返回 undefined，统一规范化为 null
      return { success: true, data: obj }
    } catch (e) {
      logger.error(`[config:getByCategory] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  /**
   * 更新单 category 的配置项
   * @param {string} category - 配置项所属的 category
   * @param {*} data - 配置项值 {key: value} 如 { runMode: 'local'}
   * @returns {Promise<{success: boolean}>} - 包含更新结果的 Promise
   */
  ipcMain.handle('config:update-category', (_, category, data) => {
    logger.info(`[config:update-category] category: ${category} data: ${JSON.stringify(data)}`)
    if (!category) {
      return { success: false, error: 'category is required' }
    }

    if (!data) {
      return { success: false, error: 'data is required' }
    }

    if (!Object.keys(data).length) {
      return { success: false, error: 'data is empty' }
    }

    try {
      const ok = models.config.setCategory(category, data)
      return { success: !!ok }
    } catch (e) {
      logger.error(`[config:updateCategory] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  /**
   * 获取单个配置项
   * @param {string} key - 配置项键名，格式为 'category.key'
   * @returns {Promise<{success: boolean, data: any | null}>} - 包含配置项值或 null 的对象
   */
  ipcMain.handle('config:get', (_, key) => {
    logger.info(`[config:get] key: ${key}`)
    if (!key) {
      return { success: false, error: 'key is required' }
    }
    try {
      const value = models.config.get(key)
      return { success: true, data: value }
    } catch (e) {
      logger.error(`[config:get] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  /**
   * 设置单个配置项
   * @param {string} key - 配置项键名，格式为 'category.key'
   * @param {*} value - 配置项值
   * @param {string} [category] - 配置项所属的 category
   * @param {string} [description] - 配置项的描述
   * @returns {Promise<{success: boolean}>} - 包含设置结果的 Promise
   */
  ipcMain.handle('config:set', (_, key, value, category, description) => {
    logger.info(
      `[config:set] key: ${key} value: ${value} category: ${category} description: ${description}`
    )
    if (!key) {
      return { success: false, error: 'key is required' }
    }
    if (!key) {
      return { success: false, error: 'key is required' }
    }
    if (!value) {
      return { success: false, error: 'value is required' }
    }
    if (!category) {
      return { success: false, error: 'category is required' }
    }
    try {
      const result = models.config.set(key, value, category, description)
      return { success: true, data: result }
    } catch (e) {
      logger.error(`[config:set] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  /**
   * 删除单个配置项
   * @param {string} key - 配置项键名，格式为 'category.key'
   * @returns {Promise<{success: boolean}>} - 包含删除结果的 Promise
   */
  ipcMain.handle('config:delete', (_, key) => {
    logger.info(`[config:delete] key: ${key}`)
    if (!key) {
      return { success: false, error: 'key is required' }
    }
    try {
      const ok = models.config.delete(key)
      return { success: !!ok }
    } catch (e) {
      logger.error(`[config:delete] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  /**
   * 设置多个配置项
   * @param {*} configs - 配置项值 {key: value} 如 { runMode: 'local'}
   * @returns {Promise<{success: boolean}>} - 包含设置结果的 Promise
   */
  ipcMain.handle('config:set-multiple', (_, configs) => {
    logger.info(`[config:set-multiple]`)
    try {
      const ok = models.config.setMultiple(configs)
      return { success: !!ok }
    } catch (e) {
      logger.error(`[config:setMultiple] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })
}
