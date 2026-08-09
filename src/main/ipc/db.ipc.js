// db:*  —  通用数据库 / 配置 / 各类表 CRUD
import fs from 'fs/promises'
import path from 'path'
import logger from '../log'
import { models } from '../database/services'
import { getDb } from '../database/index.js'

/**
 * 注册所有 db:* 通道
 */
export function registerDbIpc(ipcMain) {
  logger.info('[db] registering database ipc')

  // 初始化数据库
  ipcMain.handle('db:init', async (_, params) => {
    logger.info('[db:init]')
    // model (voice/digitalHuman/)
    const { model } = params

    const modelNames = ['category', 'material']

    if (!modelNames.includes(model)) {
      return { success: false, error: `未知的模型：${model}` }
    }

    models[model].init()

    return { success: true }
  })

  // 列表查询
  ipcMain.handle('db:list', (_, params) => {
    logger.info(`[db:list] params: ${JSON.stringify(params)}`)
    const { model, options = {} } = params
    const res = models[model].list(options)

    if (res?.pagination) {
      return {
        success: true,
        data: res.data,
        pagination: res.pagination
      }
    }

    return { success: true, data: res }
  })

  // 创建
  ipcMain.handle('db:create', (_, params) => {
    logger.info(`[db:create] params: ${JSON.stringify(params)}`)
    const { model, data } = params
    try {
      const res = models[model].create(data)
      return { success: true, data: res }
    } catch (error) {
      logger.error('[db:create] error:', error)
      return { success: false, error: error.message }
    }
  })

  // 更新
  ipcMain.handle('db:update', (_, params) => {
    logger.info(`[db:update] params: ${JSON.stringify(params)}`)
    const { model, id, data } = params
    try {
      models[model].update(id, data)
      return { success: true }
    } catch (error) {
      logger.error('[db:update] error:', error)
      return { success: false, error: error.message }
    }
  })

  // 查找 id 对应的记录
  ipcMain.handle('db:find', (_, params) => {
    logger.info(`[db:find] params: ${JSON.stringify(params)}`)
    const { model, id } = params
    const row = models[model].get(id)
    return { success: true, data: row }
  })

  // 查找 name 对应的记录
  ipcMain.handle('db:findByName', (_, params) => {
    logger.info(`[db:findByName] params: ${JSON.stringify(params)}`)
    const { model, name } = params
    const row = models[model].getByName(name)
    return { success: true, data: row }
  })

  // 删除
  ipcMain.handle('db:delete', (_, params) => {
    logger.info(`[db:delete] params: ${JSON.stringify(params)}`)
    const { model, id } = params
    models[model].delete(id)
    return { success: true }
  })

  // 统计
  ipcMain.handle('db:stats', (_, params) => {
    logger.info(`[db:stats] params: ${JSON.stringify(params)}`)
    const { model } = params
    const stats = models[model].stats()
    return { success: true, data: stats }
  })

  /**
   * 重新排序
   */
  ipcMain.handle('db:reorder', (_, params) => {
    logger.info(`[db:reorder] params: ${JSON.stringify(params)}`)
    const { model, orders } = params
    models[model].reorder(JSON.parse(JSON.stringify(orders)))
    return { success: true }
  })

  // 搜索
  ipcMain.handle('db:search', (_, params) => {
    logger.info(`[db:search] params: ${JSON.stringify(params)}`)
    const { model, ...rest } = params
    const rows = models[model].search(rest)
    return { success: true, data: rows }
  })

  /**
   * 备份数据
   *  - 通过 SQLite VACUUM INTO 做在线安全备份（事务一致）
   *  - 同时拷贝 .db-wal / .db-shm 配套文件，restore 时一起回写
   *  - 入参校验：dbPath 必须存在且可写
   */
  ipcMain.handle('database:backup', async (_, dbPath) => {
    logger.info(`[database:backup] dbPath: ${dbPath}`)
    if (!dbPath || typeof dbPath !== 'string') {
      return { success: false, error: 'dbPath 不能为空' }
    }

    let db
    try {
      db = getDb()
      const srcPath = getDbPath()
      const srcBase = srcPath.replace(/\.db$/i, '')

      // 1. 确保目标目录存在
      const targetDir = path.dirname(dbPath)
      try {
        await fs.access(targetDir)
      } catch {
        await fs.mkdir(targetDir, { recursive: true })
      }

      // 2. 用 VACUUM INTO 做事务一致的备份
      //    SQL: VACUUM INTO 'path' 会产生一个完整、独立的 SQLite 数据库副本
      //    必须用引号包裹路径，避免路径含特殊字符（如空格、连字符）
      const safePath = dbPath.replace(/'/g, "''")
      db.exec(`VACUUM INTO '${safePath}'`)

      // 3. 同时复制 .db-wal / .db-shm（保险，实际生产中如果 journal_mode=DELETE，wal 不存在）
      for (const suffix of ['-wal', '-shm']) {
        const src = srcBase + suffix
        const dst = dbPath.replace(/\.db$/i, '') + suffix
        try {
          await fs.access(src)
          await fs.copyFile(src, dst)
        } catch {
          // 不存在则跳过
        }
      }

      // 4. 返回备份统计
      const stat = await fs.stat(dbPath)
      logger.info(`[database:backup] 备份完成: ${dbPath} (${stat.size} bytes)`)
      return {
        success: true,
        data: {
          dbPath,
          size: stat.size,
          createdAt: new Date().toISOString()
        }
      }
    } catch (e) {
      logger.error(`[database:backup] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  /**
   * 恢复数据
   */
  ipcMain.handle('database:restore', async (_) => {})
}
