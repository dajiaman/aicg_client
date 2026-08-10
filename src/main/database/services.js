import { getDb } from './index'
import { v4 as uuidv4 } from 'uuid'
import logger from '../log'

/**
 * 解析 JSON 字符串
 * @param {string} str - 要解析的 JSON 字符串
 * @param {*} fallback - 解析失败时的兜底值
 * @returns {*}
 - 解析后的 JSON 数据或兜底值
 */
function parseJSON(str, fallback = null) {
  try {
    // 如果传入不是字符串，直接返回兜底值
    if (typeof str !== 'string') {
      return fallback
    }
    return JSON.parse(str)
  } catch (err) {
    // 解析失败，返回兜底数据
    return fallback
  }
}

/**
 * 格式化成字符串
 * @param {*} val
 * @returns
 */
function stringifyJSON(val) {
  if (val == null) return null
  return typeof val === 'string' ? val : JSON.stringify(val)
}

/**
 * 时间
 * @returns
 */
function nowISO() {
  return new Date().toISOString()
}

/**
 * 构建更新语句
 * @param {object} data - 要更新的数据
 * @param {Array} allowedFields - 允许更新的字段名数组
 * @param {Array} [extraUpdates=[]] - 额外的更新语句数组
 * @returns {object} - 包含 sets 和 values 的对象
 */
function buildUpdateSets(data, allowedFields, extraUpdates = []) {
  const sets = [...extraUpdates]
  const values = []
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = ?`)
      values.push(data[field])
    }
  }
  return { sets, values }
}

/**
 * 配置 config 表
 */
const config = {
  /**
   * 获取所有配置项（数组）
   * @returns {Array} - 所有配置项的数组
   */
  getAll() {
    const db = getDb()
    const rows = db.prepare('SELECT key, value, category, description FROM config').all()
    return rows
  },

  /**
   * 设置多个配置项
   * @param {*} configs - 多个配置项值
   * @returns {boolean} - 是否设置成功
   */
  setMultiple(configs) {
    const db = getDb()
    for (const key in configs) {
      const value = configs[key]
      const category = key.split('.')[0]
      this.set(key, value, category)
    }
    return true
  },

  /**
   * 获取所有配置项，按 category 分组
   * @returns {object} - 包含所有配置项的对象，键为 category，值为 k-v 对象
   */
  getGrouped() {
    const db = getDb()
    const rows = db.prepare('SELECT key, value, category FROM config').all()
    const result = {}
    for (const row of rows) {
      if (!result[row.category]) result[row.category] = {}
      result[row.category][row.key] = parseJSON(row.value, row.value)
    }
    return result
  },

  /**
   * 获取单 category 的配置项
   * @param {string} category - 配置项所属的 category
   * @returns {object} - 包含配置项值或 null 的对象
   */
  getByCategory(category) {
    const db = getDb()
    const rows = db
      .prepare('SELECT key, value, description FROM config WHERE category = ?')
      .all(category)

    const result = {}
    for (const row of rows) {
      result[row.key] = parseJSON(row.value, row.value)
    }
    return result
  },

  /**
   * 获取单个配置项
   * @param {string} key - 配置项键名，格式为 'category.key'
   * @param {*} [fallback] - 配置项不存在时的默认值
   * @returns {*} - 配置项值或 fallback
   */
  get(key) {
    const db = getDb()
    const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key)
    if (!row) return ''
    return row ? parseJSON(row.value, row.value) : row
  },

  /**
   * 设置单个配置项
   * @param {string} key - 配置项键名，格式为 'category.key'
   * @param {*} value - 配置项值
   * @param {string} [category] - 配置项所属的 category
   * @param {string|null} [description] - 配置项的描述，传 null/undefined 则不更新 description
   * @returns {boolean} - 是否设置成功
   *
   * 行为说明：
   *   - key 不存在时（新增）：自动写入 created_at = updated_at = nowISO()
   *   - key 已存在时（更新）：保持原 created_at 不变，仅刷新 updated_at = nowISO()
   */
  set(key, value, category = 'general', description = null) {
    const db = getDb()
    const now = nowISO()
    const stmt = db.prepare(`
      INSERT INTO config (key, value, category, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        category = excluded.category,
        description = CASE
          WHEN excluded.description IS NULL THEN description
          ELSE excluded.description
        END,
        created_at = created_at,
        updated_at = excluded.updated_at
    `)
    stmt.run(key, stringifyJSON(value), category, description, now, now)
    return { key, value, category, description, created_at: now, updated_at: now }
  },

  /**
   * 设置单 category 的配置项
   * @param {string} category - 配置项所属的 category
   * @param {*} data - 配置项值 {key: value} 如 { runMode: 'local'}
   * @returns {boolean} - 是否设置成功
   */
  setCategory(category, data) {
    const db = getDb()
    const tx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO config (key, value, category, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          category = excluded.category,
          updated_at = excluded.updated_at
      `)
      const now = nowISO()
      for (const [k, v] of Object.entries(data)) {
        let key = `${category}.${k}`
        stmt.run(key, stringifyJSON(v), category, now, now)
      }
    })
    tx()
    return true
  },

  /**
   * 删除单个配置项
   * @param {string} key - 配置项键名，格式为 'category.key'
   * @returns {boolean} - 是否删除成功
   */
  delete(key) {
    const db = getDb()
    db.prepare('DELETE FROM config WHERE key = ?').run(key)
    return true
  },

  /**
   * 重置单 category 的配置项
   * @param {string} category - 配置项所属的 category
   * @returns {boolean} - 是否重置成功
   */
  resetCategory(category) {
    const db = getDb()
    db.prepare('DELETE FROM config WHERE category = ?').run(category)
    return true
  }
}

// 素材库分类
const category = {
  list(options = {}) {
    const db = getDb()
    let rows

    if (options?.page && options?.pageSize) {
      rows = db
        .prepare('SELECT * FROM categories LIMIT ? OFFSET ? ORDER BY  created_at DESC')
        .all(options.pageSize, (options.page - 1) * options.pageSize)
    } else {
      rows = db.prepare('SELECT * FROM categories ORDER BY  created_at DESC').all()
    }
    return rows
  },

  get(id) {
    const db = getDb()
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) || null
  },

  /**
   * 查找 name 对应的记录
   */
  getByName(name) {
    const db = getDb()
    const row = db.prepare('SELECT * FROM categories WHERE name = ?').get(name) || null
    return row
  },

  /**
   * 创建
   */
  create(data) {
    const db = getDb()

    // 判断name是否存在
    const row = this.getByName(data.name)
    if (row) {
      throw new Error('分类名称已存在')
    }

    const stmt = db.prepare(`
      INSERT INTO categories (id, name, description, status)
      VALUES (@id, @name, @description, @status)
    `)
    const id = uuidv4()
    stmt.run({
      id,
      name: data.name,
      description: data.description || null,
      status: data.status || 'active'
    })
    return this.get(id)
  },

  /**
   * 更新
   */
  update(id, data) {
    const db = getDb()
    const allowed = ['name', 'description', 'status']
    const { sets, values } = buildUpdateSets(data, allowed, ['updated_at = CURRENT_TIMESTAMP'])
    if (sets.length <= 1) return this.get(id)
    values.push(id)
    db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return this.get(id)
  },

  delete(id) {
    const db = getDb()
    db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    return true
  }
}

// 数字人
const digitalHuman = {
  init() {
    logger.info('digital_humans init')
    const db = getDb()
    db.exec(`
      CREATE TABLE IF NOT EXISTS digital_humans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        video_path TEXT NOT NULL,
        video_url TEXT,
        thumbnail_path TEXT,
        video_duration REAL,
        file_size INTEGER,
        video_format TEXT,
        resolution TEXT,
        status TEXT DEFAULT 'active',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );


      CREATE INDEX IF NOT EXISTS idx_digital_humans_created_at ON digital_humans(created_at);
      CREATE INDEX IF NOT EXISTS idx_digital_humans_name ON digital_humans(name);
      CREATE INDEX IF NOT EXISTS idx_digital_humans_sort_order ON digital_humans(sort_order);
      CREATE INDEX IF NOT EXISTS idx_digital_humans_status ON digital_humans(status);
    `)

    config.set('system.digitalHumansInitialized', 'true', 'system', '数字人初始化标记')
  },

  /**
   * 列表查询
   */
  list(options = {}) {
    const db = getDb()
    let rows

    if (options?.page && options?.pageSize) {
      rows = db
        .prepare(
          'SELECT * FROM digital_humans LIMIT ? OFFSET ? ORDER BY sort_order ASC, created_at DESC'
        )
        .all(options.pageSize, (options.page - 1) * options.pageSize)
    } else {
      rows = db
        .prepare('SELECT * FROM digital_humans ORDER BY sort_order ASC, created_at DESC')
        .all()
    }
    return rows
  },

  /**
   * 查找 id 对应的记录
   */
  get(id) {
    const db = getDb()
    return db.prepare('SELECT * FROM digital_humans WHERE id = ?').get(id) || null
  },

  /**
   * 查找 name 对应的记录
   */
  getByName(name) {
    const db = getDb()
    const row = db.prepare('SELECT * FROM digital_humans WHERE name = ?').get(name) || null
    return row
  },

  /**
   * 创建
   */
  create(data) {
    const db = getDb()
    const id = uuidv4()
    const stmt = db.prepare(`
      INSERT INTO digital_humans (id, name, description, video_path, video_url, thumbnail_path, video_duration, file_size, video_format, resolution, status, sort_order)
      VALUES (@id, @name, @description, @video_path, @video_url, @thumbnail_path, @video_duration, @file_size, @video_format, @resolution, @status, @sort_order)
    `)
    stmt.run({
      id,
      name: data.name,
      description: data.description || null,
      video_path: typeof data.video_path === 'string' ? data.video_path : '',
      video_url: data.video_url || null,
      thumbnail_path: typeof data.thumbnail_path === 'string' ? data.thumbnail_path : '',
      video_duration: data.video_duration ?? null,
      file_size: data.file_size ?? null,
      video_format: data.video_format || null,
      resolution: data.resolution || null,
      status: data.status || 'active',
      sort_order: data.sort_order ?? 0
    })
    return this.get(id)
  },

  /**
   * 更新
   */
  update(id, data) {
    const db = getDb()
    const allowed = [
      'name',
      'description',
      'video_path',
      'video_url',
      'thumbnail_path',
      'video_duration',
      'file_size',
      'video_format',
      'resolution',
      'status',
      'sort_order'
    ]
    const { sets, values } = buildUpdateSets(data, allowed, ['updated_at = CURRENT_TIMESTAMP'])
    if (sets.length <= 1) return this.get(id)
    values.push(id)
    db.prepare(`UPDATE digital_humans SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return this.get(id)
  },

  /**
   * 删除
   */
  delete(id) {
    const db = getDb()
    db.prepare('DELETE FROM digital_humans WHERE id = ?').run(id)
    return true
  },

  /**
   * 统计
   */
  stats() {
    const db = getDb()
    return db.prepare('SELECT COUNT(*) as c FROM digital_humans').get().c
  },

  /**
   * 搜索
   */
  search(params = {}) {
    const { searchText, searchFields, options } = params
    const db = getDb()
    // 基础SQL与参数数组
    let sql = 'SELECT * FROM digital_humans'
    const queryParams = []
    const whereConditions = []

    // 有搜索文本时拼接多字段模糊查询
    if (searchText?.trim()) {
      const likeVal = `%${searchText.trim()}%`
      // 拼接多个字段 OR 匹配
      const fieldArr = Array.isArray(searchFields) ? searchFields : ['name']
      fieldArr.forEach((field) => {
        whereConditions.push(`${field} LIKE ?`)
        queryParams.push(likeVal)
      })
    }

    // 拼接WHERE条件
    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' OR ')}`
    }

    // 分页处理（关键：防止LIMIT少传参数报错）
    const { page = 1, pageSize = 20 } = options
    if (pageSize > 0) {
      const offset = (page - 1) * pageSize
      sql += ' LIMIT ?, ?'
      queryParams.push(offset, pageSize)
    }

    // 预编译执行，参数数组和?数量严格对应
    const rows = db.prepare(sql).all(queryParams)
    return rows
  },

  /**
   * 重新排序
   */
  reorder(orders) {
    const db = getDb()
    orders.forEach((order) => {
      db.prepare(`UPDATE digital_humans SET sort_order = ? WHERE id = ?`).run(
        order.sort_order,
        order.id
      )
    })
    return true
  }
}

/**
 * 语音模型服务 db
 */
const voice = {
  init() {
    logger.info('[voice:init]')
    const db = getDb()
    const exec = db.transaction(() => {
      db.exec(`
         CREATE TABLE IF NOT EXISTS voice_models (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          server_voice_id TEXT,
          prompt_text TEXT,
          audio_path TEXT,
          audio_url TEXT,
          audio_duration REAL,
          file_size INTEGER,
          status TEXT DEFAULT 'active',
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );


      CREATE INDEX IF NOT EXISTS idx_voice_models_created_at ON voice_models(created_at);
      CREATE INDEX IF NOT EXISTS idx_voice_models_name ON voice_models(name);
      CREATE INDEX IF NOT EXISTS idx_voice_models_sort_order ON voice_models(sort_order);
      CREATE INDEX IF NOT EXISTS idx_voice_models_status ON voice_models(status);
      `)
    })
    exec()

    config.set('system.voiceSamplesInitialized_v2', 'true', 'system', '声音样本初始化标记')
  },

  /**
   * 列表查询
   */
  list(options = {}) {
    const db = getDb()
    let rows

    if (options?.page && options?.pageSize) {
      rows = db
        .prepare(
          'SELECT * FROM voice_models LIMIT ? OFFSET ? ORDER BY sort_order ASC, created_at DESC'
        )
        .all(options.pageSize, (options.page - 1) * options.pageSize)
    } else {
      rows = db.prepare('SELECT * FROM voice_models ORDER BY sort_order ASC, created_at DESC').all()
    }
    return rows
  },

  /**
   * 查找 id 对应的记录
   */
  get(id) {
    const db = getDb()
    return db.prepare('SELECT * FROM voice_models WHERE id = ?').get(id) || null
  },

  /**
   * 查找 name 对应的记录
   */
  getByName(name) {
    const db = getDb()
    return db.prepare('SELECT * FROM voice_models WHERE name = ?').get(name) || null
  },

  /**
   * 创建
   */
  create(data) {
    const db = getDb()
    if (!data || !data.name || typeof data.name !== 'string' || !data.name.trim()) {
      throw new Error('声音名称不能为空')
    }
    const name = data.name.trim()

    // 1. 名称唯一性预检（与 schema UNIQUE(name) 对齐）
    const exists = db.prepare('SELECT id FROM voice_models WHERE name = ? LIMIT 1').get(name)
    if (exists) {
      throw new Error(`声音名称已存在：${name}`)
    }

    const id = typeof data.id === 'string' && data.id.length > 0 ? data.id : uuidv4()
    const stmt = db.prepare(`
      INSERT INTO voice_models (id, name, description, server_voice_id, prompt_text, audio_path, audio_url, audio_duration, file_size, status, sort_order)
      VALUES (@id, @name, @description, @server_voice_id, @prompt_text, @audio_path, @audio_url, @audio_duration, @file_size, @status, @sort_order)
    `)
    try {
      stmt.run({
        id,
        name,
        description: data.description || null,
        server_voice_id: data.server_voice_id || null,
        prompt_text: data.prompt_text || null,
        audio_path: typeof data.audio_path === 'string' ? data.audio_path : '',
        audio_url: data.audio_url || null,
        audio_duration: data.audio_duration ?? null,
        file_size: data.file_size ?? null,
        status: data.status || 'active',
        sort_order: data.sort_order ?? 0
      })
    } catch (err) {
      // 2. 兜底：并发场景下仍可能撞到 UNIQUE 约束，转成可读错误
      if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error(`声音名称已存在：${name}`)
      }
      throw err
    }
    return this.get(id)
  },

  /**
   * 更新
   */
  update(id, data) {
    const db = getDb()
    const allowed = [
      'name',
      'description',
      'server_voice_id',
      'prompt_text',
      'audio_path',
      'audio_url',
      'audio_duration',
      'file_size',
      'status',
      'sort_order'
    ]

    // 改名时校验唯一性（排除自己）
    if (data && typeof data.name === 'string') {
      const newName = data.name.trim()
      if (!newName) throw new Error('声音名称不能为空')
      const dup = db
        .prepare('SELECT id FROM voice_models WHERE name = ? AND id <> ? LIMIT 1')
        .get(newName, id)
      if (dup) throw new Error(`声音名称已存在：${newName}`)
    }

    const { sets, values } = buildUpdateSets(data, allowed, ['updated_at = CURRENT_TIMESTAMP'])
    if (sets.length <= 1) return this.get(id)
    values.push(id)
    try {
      db.prepare(`UPDATE voice_models SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    } catch (err) {
      if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error(`声音名称已存在：${(data && data.name) || ''}`)
      }
      throw err
    }
    return this.get(id)
  },

  /**
   * 删除
   */
  delete(id) {
    const db = getDb()
    db.prepare('DELETE FROM voice_models WHERE id = ?').run(id)
    return true
  },

  /**
   * 统计
   */
  stats() {
    const db = getDb()
    return db.prepare('SELECT COUNT(*) as c FROM voice_models').get().c
  },

  /**
   * 搜索
   */
  search(params = {}) {
    const { searchText, searchFields, options } = params
    const db = getDb()
    // 基础SQL与参数数组
    let sql = 'SELECT * FROM voice_models'
    const queryParams = []
    const whereConditions = []

    // 有搜索文本时拼接多字段模糊查询
    if (searchText?.trim()) {
      const likeVal = `%${searchText.trim()}%`
      // 拼接多个字段 OR 匹配
      const fieldArr = Array.isArray(searchFields) ? searchFields : ['name']
      fieldArr.forEach((field) => {
        whereConditions.push(`${field} LIKE ?`)
        queryParams.push(likeVal)
      })
    }

    // 拼接WHERE条件
    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' OR ')}`
    }

    // 分页处理（关键：防止LIMIT少传参数报错）
    const { page = 1, pageSize = 20 } = options
    if (pageSize > 0) {
      const offset = (page - 1) * pageSize
      sql += ' LIMIT ?, ?'
      queryParams.push(offset, pageSize)
    }

    // 预编译执行，参数数组和?数量严格对应
    const rows = db.prepare(sql).all(queryParams)
    return rows
  },
  /**
   * 重新排序
   */
  reorder(orders) {
    const db = getDb()
    orders.forEach((order) => {
      db.prepare(`UPDATE voice_models SET sort_order = ? WHERE id = ?`).run(
        order.sort_order,
        order.id
      )
    })
    return true
  }
}

const task = {
  /**
   * 查询任务列表
   * @param {Object} options
   * @param {string} [options.status]  按 status 过滤
   * @param {string} [options.mode]    按 mode 过滤 (background | manual | auto)
   * @param {number} [options.limit=10]
   * @param {number} [options.offset=0]
   * @returns {Array} tasks（含已解析的 pipeline_data / settings_data）
   */
  list(options = {}) {
    const { status, mode, limit = 10, offset = 0 } = options

    const db = getDb()

    // 动态构建 WHERE 子句，避免 4 条 SQL 分支爆炸
    const where = []
    const params = []
    if (status) {
      where.push('status = ?')
      params.push(status)
    }
    if (mode) {
      where.push('mode = ?')
      params.push(mode)
    }
    const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : ''

    const sql = `SELECT * FROM tasks${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    const rows = db.prepare(sql).all(...params, limit, offset)

    return rows.map((r) => ({
      ...r,
      pipeline_data: parseJSON(r.pipeline_data, {}),
      settings_data: parseJSON(r.settings_data, {})
    }))
  },

  /**
   * 统计
   */
  count(options = {}) {
    const { status } = options
    const db = getDb()
    if (status) {
      return db.prepare('SELECT COUNT(*) as c FROM tasks WHERE status = ?').get(status).c
    }
    return db.prepare('SELECT COUNT(*) as c FROM tasks').get().c
  },

  /**
   * 查询任务详情
   */
  get(id) {
    const db = getDb()
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
    if (!row) return null
    return {
      ...row,
      pipeline_data: JSON.parse(row.pipeline_data),
      settings_data: JSON.parse(row.settings_data)
    }
  },

  /**
   * 创建
   */
  create(data) {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, mode, status, current_step, progress, pipeline_data, settings_data, retry_count, max_retries)
      VALUES (@id, @title, @mode, @status, @current_step, @progress, @pipeline_data, @settings_data, @retry_count, @max_retries)
    `)
    const id = data.id || uuidv4()
    stmt.run({
      id,
      title: data.title,
      mode: data.mode || 'manual',
      status: data.status || 'processing',
      current_step: data.current_step ?? 1,
      progress: data.progress ?? 0,
      pipeline_data: stringifyJSON(data.pipeline_data || {}),
      settings_data: stringifyJSON(data.settings_data || {}),
      error_message: data.error_message || null,
      retry_count: data.retry_count ?? 0,
      max_retries: data.max_retries ?? 3
    })
    return this.get(id)
  },

  /**
   * 更新
   * @param {string|number} id 任务ID
   * @param {Object} data 更新数据
   * @returns {Object} 更新后的任务数据
   */
  update(id, data) {
    console.log('task update', id, data)
    const existing = this.get(id)
    if (!existing) return null

    const db = getDb()
    const allowed = [
      'title',
      'mode',
      'status',
      'current_step',
      'progress',
      'completed_at',
      'error_message',
      'retry_count',
      'max_retries'
    ]
    const { sets, values } = buildUpdateSets(data, allowed, ['updated_at = CURRENT_TIMESTAMP'])
    if (data.pipelineData !== undefined) {
      sets.push('pipeline_data = ?')
      values.push(stringifyJSON(data.pipelineData))
    }
    if (data.settingsData !== undefined) {
      sets.push('settings_data = ?')
      values.push(stringifyJSON(data.settingsData))
    }
    if (sets.length <= 1) return this.get(id)
    values.push(id)
    db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return this.get(id)
  },

  /**
   * 删除
   */
  delete(id) {
    const db = getDb()
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
    return true
  },

  /**
   * 清除旧任务
   */
  clearOld(days = 30) {
    const db = getDb()
    db.prepare(`DELETE FROM tasks WHERE created_at < datetime('now', ? || ' days')`).run(-days)
    return true
  },

  /**
   * 更新任务状态
   */
  upsert(data) {
    const existing = this.get(data.id)
    if (existing) return this.update(existing.id, data)
    return this.create(data)
  }
}

const taskSteps = {
  listByTask(taskId) {
    const db = getDb()
    const rows = db
      .prepare('SELECT * FROM task_steps WHERE task_id = ? ORDER BY id ASC')
      .all(taskId)
    return rows.map((r) => ({
      ...r,
      input_data: parseJSON(r.input_data, {}),
      output_data: parseJSON(r.output_data, {})
    }))
  },

  /**
   *
   * @param {*} id
   * @returns
   */
  get(id) {
    const db = getDb()
    const row = db.prepare('SELECT * FROM task_steps WHERE id = ?').get(id)
    if (!row) return null
    return {
      ...row,
      input_data: parseJSON(row.input_data, {}),
      output_data: parseJSON(row.output_data, {})
    }
  },

  /**
   * 查找任务步骤
   * @param {string|number} taskId 任务ID
   * @param {string} stepName 步骤名称
   * @returns {Promise<any>}
   */
  find(taskId, stepName) {
    const db = getDb()
    const row = db
      .prepare('SELECT * FROM task_steps WHERE task_id = ? AND step_name = ?')
      .get(taskId, stepName)
    if (!row) return null
    return {
      ...row,
      input_data: parseJSON(row.input_data, {}),
      output_data: parseJSON(row.output_data, {})
    }
  },

  create(data) {
    const db = getDb()
    if (!data.task_id) {
      console.error('task_id is required')
      return null
    }
    if (!data.step_name) {
      console.error('step_name is required')
      return null
    }

    const stmt = db.prepare(`
      INSERT INTO task_steps (task_id, step_name, status, input_data, output_data, started_at, completed_at, error_message, retry_count)
      VALUES (@task_id, @step_name, @status, @input_data, @output_data, @started_at, @completed_at, @error_message, @retry_count)
    `)
    const info = stmt.run({
      task_id: data.task_id,
      step_name: data.step_name,
      status: data.status || 'pending',
      input_data: stringifyJSON(data.input_data || {}),
      output_data: stringifyJSON(data.output_data || {}),
      started_at: data.started_at || null,
      completed_at: data.completed_at || null,
      error_message: data.error_message || null,
      retry_count: data.retry_count ?? 0
    })
    return this.get(info.lastInsertRowid)
  },

  /**
   * 更新任务步骤
   * @param {string|number} taskId 任务ID
   * @param {Object} data 更新数据
   * @returns {Promise<any>}
   */
  update(taskId, data) {
    const db = getDb()

    if (!taskId) {
      console.error('task_id is required')
      return null
    }

    if (!data.step_name) {
      console.error('step_name is required')
      return null
    }

    const allowed = ['status', 'started_at', 'completed_at', 'error_message', 'retry_count']
    const { sets, values } = buildUpdateSets(data, allowed, [])
    if (data.input_data !== undefined) {
      sets.push('input_data = ?')
      values.push(stringifyJSON(data.input_data))
    }
    if (data.output_data !== undefined) {
      sets.push('output_data = ?')
      values.push(stringifyJSON(data.output_data))
    }

    if (sets.length === 0) return this.find(taskId, data.step_name)
    values.push(taskId)
    values.push(data.step_name)
    db.prepare(`UPDATE task_steps SET ${sets.join(', ')} WHERE task_id = ? AND step_name = ?`).run(
      ...values
    )
    return this.find(taskId, data.step_name)
  },

  /**
   * 插入或更新任务步骤
   * @param {string|number} taskId 任务ID
   * @param {Object} data 插入或更新数据
   * @returns {Promise<any>}
   */
  upsert(data) {
    const existing = this.find(data.task_id, data.step_name)
    if (existing) return this.update(existing.task_id, data)
    return this.create(data)
  },

  /**
   * 删除任务步骤
   * @param {string|number} taskId 任务ID
   * @returns {Promise<any>}
   */
  deleteByTask(taskId) {
    const db = getDb()
    db.prepare('DELETE FROM task_steps WHERE task_id = ?').run(taskId)
    return true
  }
}

// 素材库
const material = {
  init() {
    logger.info('[material:init]')
    const db = getDb()
    const exec = db.transaction(() => {
      db.exec(`
      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        cover_path TEXT,
        file_size INTEGER,
        duration REAL,
        description TEXT,
        tags TEXT,
        vector_id TEXT,
        status TEXT DEFAULT 'uploaded',
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_materials_category_id ON materials(category_id);
      CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at);
      CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
      CREATE INDEX IF NOT EXISTS idx_materials_vector_id ON materials(vector_id);

      `)
    })
    exec()
  },

  /**
   * 获取素材列表（支持 where/whereParams、categoryId、status、keyword、page/pageSize）
   * @param {Object} options
   * @param {string} [options.where]    自定义 WHERE 片段，例如 'category_id = ? AND status = ?'
   * @param {Array}  [options.whereParams=[]] 与 where 配套的参数数组
   * @param {string|number} [options.categoryId] 快捷过滤
   * @param {string} [options.status]   快捷过滤
   * @param {string} [options.keyword]  文件名/描述模糊匹配
   * @param {number} [options.page=1]   页码（从 1 开始）
   * @param {number} [options.pageSize=20]
   * @returns {{ data: any[], pagination: { page, pageSize, total, totalPages } }}
   */
  list(options = {}) {
    const {
      where = '',
      whereParams = [],
      categoryId,
      status,
      keyword,
      page = 1,
      pageSize = 20
    } = options || {}

    const db = getDb()
    const conds = []
    const args = []

    // 1) where / whereParams
    if (where && typeof where === 'string' && where.trim()) {
      conds.push(`(${where})`)
      if (Array.isArray(whereParams)) args.push(...whereParams)
    }

    // 2) categoryId 快捷过滤
    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      conds.push('category_id = ?')
      args.push(categoryId)
    }

    // 3) status 快捷过滤
    if (status) {
      conds.push('status = ?')
      args.push(status)
    }

    // 4) keyword 模糊匹配
    if (keyword && typeof keyword === 'string' && keyword.trim()) {
      conds.push('(file_name LIKE ? OR description LIKE ?)')
      const like = `%${keyword.replace(/[%_]/g, (m) => '\\' + m)}%`
      args.push(like, like)
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : ''

    // 5) 统计总数
    let total = 0
    try {
      const countRow = db.prepare(`SELECT COUNT(*) AS cnt FROM materials ${whereSql}`).get(...args)
      total = (countRow && countRow.cnt) || 0
    } catch (e) {
      logger.error('[material.list] count failed:', e)
      total = 0
    }

    // 6) 分页
    const _page = Math.max(1, Number(page) || 1)
    const _size = Math.max(1, Number(pageSize) || 20)
    const offset = (_page - 1) * _size
    const limit = _size

    let rows = []
    try {
      const sql = `
        SELECT * FROM materials
        ${whereSql}
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT ? OFFSET ?
      `
      rows = db.prepare(sql).all(...args, limit, offset)
    } catch (e) {
      logger.error('[material.list] query failed:', e)
      rows = []
    }

    const data = rows.map((r) => ({
      ...r,
      tags: parseJSON(r.tags, []),
      metadata: parseJSON(r.metadata, {})
    }))

    return {
      data,
      pagination: {
        page: _page,
        pageSize: _size,
        total,
        totalPages: Math.max(1, Math.ceil(total / _size))
      }
    }
  },
  /**
   * 获取素材详情
   */
  get(id) {
    const db = getDb()
    const row = db.prepare('SELECT * FROM materials WHERE id = ?').get(id)
    if (!row) return null
    return {
      ...row,
      tags: parseJSON(row.tags, []),
      metadata: parseJSON(row.metadata, {})
    }
  },

  /**
   * 批量获取素材详情
   * @param {Array} ids
   * @returns {Array}
   */
  getByVectorIds(ids) {
    const db = getDb()
    if (!Array.isArray(ids) || ids.length === 0) return []
    // 动态占位符：?,?,? 个数与 ids 数量一致
    const placeholders = ids.map(() => '?').join(',')
    const rows = db
      .prepare(`SELECT * FROM materials WHERE vector_id IN (${placeholders})`)
      .all(...ids)
    return rows.map((r) => ({
      ...r,
      tags: parseJSON(r.tags, []),
      metadata: parseJSON(r.metadata, {})
    }))
  },

  /**
   * 创建素材
   */
  create(data) {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO materials (id, category_id, file_name, file_path, cover_path, file_size, duration, description, tags, vector_id, status, metadata)
      VALUES (@id, @category_id, @file_name, @file_path, @cover_path, @file_size, @duration, @description, @tags, @vector_id, @status, @metadata)
    `)
    const id = uuidv4()
    stmt.run({
      id,
      category_id: data.category_id,
      file_name: data.file_name,
      file_path: data.file_path,
      cover_path: data.cover_path || null,
      file_size: data.file_size ?? null,
      duration: data.duration ?? null,
      description: data.description || null,
      tags: stringifyJSON(data.tags || []),
      vector_id: data.vector_id || null,
      status: data.status || 'uploaded',
      metadata: stringifyJSON(data.metadata || {})
    })
    return this.get(id)
  },

  /**
   * 更新素材
   */
  update(id, data) {
    const db = getDb()
    const allowed = [
      'category_id',
      'file_name',
      'file_path',
      'cover_path',
      'file_size',
      'duration',
      'tags',
      'description',
      'vector_id',
      'metadata',
      'status'
    ]
    const { sets, values } = buildUpdateSets(data, allowed, ['updated_at = CURRENT_TIMESTAMP'])
    if (data.tags !== undefined) {
      sets.push('tags = ?')
      values.push(stringifyJSON(data.tags))
    }
    if (data.metadata !== undefined) {
      sets.push('metadata = ?')
      values.push(stringifyJSON(data.metadata))
    }
    if (sets.length <= 1) return this.get(id)
    values.push(id)
    db.prepare(`UPDATE materials SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return this.get(id)
  },

  /**
   * 删除素材
   */
  delete(id) {
    const db = getDb()
    db.prepare('DELETE FROM materials WHERE id = ?').run(id)
    return true
  },

  /**
   * 批量更新素材
   * @param {Array} ids
   * @param {Object} data
   */
  batchUpdate(ids, data) {
    const db = getDb()
    if (!Array.isArray(ids) || ids.length === 0) {
      return true
    }
    const { sets, values } = buildUpdateSets(
      data,
      ['category_id', 'name', 'description', 'status', 'tags'],
      ['updated_at = CURRENT_TIMESTAMP']
    )
    if (sets.length === 0) {
      return true
    }
    const placeholders = ids.map(() => '?').join(',')
    const stmt = db.prepare(`
      UPDATE materials
      SET ${sets.join(', ')}
      WHERE id IN (${placeholders})
    `)
    stmt.run(...values, ...ids)
    return true
  },

  /**
   * 批量删除素材
   */
  batchDelete(ids) {
    const db = getDb()
    if (!Array.isArray(ids) || ids.length === 0) {
      return true
    }
    const placeholders = ids.map(() => '?').join(',')
    db.prepare(`DELETE FROM materials WHERE id IN (${placeholders})`).run(...ids)
    return true
  }
}

// 账号 table platform_accounts
const account = {
  /**
   * 列表查询
   * 支持过滤：
   *   - status:   string | string[]   按状态筛选（单值或多值 IN）
   *   - platform: string | string[]   按平台筛选（单值或多值 IN）
   * 支持分页：
   *   - page, pageSize
   * 未传过滤条件时与原行为一致
   */
  list(options = {}) {
    const db = getDb()

    const where = []
    const params = []

    // status 过滤（支持单值或数组）
    const toArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v])
    const statusList = toArray(options.status).filter((s) => s !== '' && s != null)
    if (statusList.length === 1) {
      where.push('status = ?')
      params.push(statusList[0])
    } else if (statusList.length > 1) {
      where.push(`status IN (${statusList.map(() => '?').join(', ')})`)
      params.push(...statusList)
    }

    // platform 过滤（支持单值或数组）
    const platformList = toArray(options.platform).filter((p) => p !== '' && p != null)
    if (platformList.length === 1) {
      where.push('platform = ?')
      params.push(platformList[0])
    } else if (platformList.length > 1) {
      where.push(`platform IN (${platformList.map(() => '?').join(', ')})`)
      params.push(...platformList)
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const baseSql = `SELECT * FROM platform_accounts ${whereSql} ORDER BY created_at DESC`

    if (options?.page && options?.pageSize) {
      const page = Math.max(1, parseInt(options.page, 10) || 1)
      const pageSize = Math.max(1, parseInt(options.pageSize, 10) || 1)
      return db
        .prepare(`${baseSql} LIMIT ? OFFSET ?`)
        .all(...params, pageSize, (page - 1) * pageSize)
    }

    return db.prepare(baseSql).all(...params)
  },

  /**
   * 查找 id 对应的记录
   */
  get(id) {
    const db = getDb()
    return db.prepare('SELECT * FROM platform_accounts WHERE id = ?').get(id) || null
  },

  /**
   * 查找 name 对应的记录
   */
  getByName(name) {
    const db = getDb()
    return db.prepare('SELECT * FROM platform_accounts WHERE name = ?').get(name) || null
  },

  /**
   * 创建
   */
  create(data) {
    const db = getDb()

    // 1. 必填参数校验
    const platform = (data?.platform || '').trim()
    const account_name = (data?.account_name || '').trim()
    if (!platform) {
      throw new Error('平台不能为空')
    }
    if (!account_name) {
      throw new Error('账号名称不能为空')
    }

    // 2. 同一平台下账号名唯一性预检（与 schema UNIQUE(platform, account_name) 对齐）
    const exists = db
      .prepare('SELECT id FROM platform_accounts WHERE platform = ? AND account_name = ? LIMIT 1')
      .get(platform, account_name)
    if (exists) {
      throw new Error(`该平台下已存在同名账号：${platform} / ${account_name}`)
    }

    const id = uuidv4()
    // JS 层显式写入 ISO 时间戳，与 update() 保持一致
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const stmt = db.prepare(`
      INSERT INTO platform_accounts (id, platform, account_name, display_name, cookies, status, created_at, updated_at)
      VALUES (@id, @platform, @account_name, @display_name, @cookies, @status, @created_at, @updated_at)
    `)
    try {
      stmt.run({
        id,
        platform,
        account_name,
        display_name: data.display_name,
        cookies: data?.cookies || null,
        status: data.status || 'inactive',
        created_at: now,
        updated_at: now
      })
    } catch (err) {
      // 3. 兜底：并发场景下仍可能撞到 UNIQUE 约束，转成可读错误
      if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error(`该平台下已存在同名账号：${platform} / ${account_name}`)
      }
      throw err
    }
    return this.get(id)
  },

  /**
   * 更新
   */
  update(id, data) {
    const db = getDb()
    const allowed = [
      'platform',
      'account_name',
      'display_name',
      'cookies',
      'status',
      'last_login_at'
    ]
    // 与 create() 保持一致：JS 层显式写入 ISO 字符串，避免不同数据库引擎 CURRENT_TIMESTAMP 格式不一致
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const { sets, values } = buildUpdateSets(data, allowed)
    // 无论有没有业务字段，都更新 updated_at（让 touch 行为一致）
    sets.push('updated_at = ?')
    values.push(now)
    if (sets.length === 0) return this.get(id)
    values.push(id)
    db.prepare(`UPDATE platform_accounts SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return this.get(id)
  },

  /**
   * 删除
   */
  delete(id) {
    const db = getDb()
    db.prepare('DELETE FROM platform_accounts WHERE id = ?').run(id)
    return true
  },

  /**
   * 统计
   */
  stats() {
    const db = getDb()
    return db.prepare('SELECT COUNT(*) as c FROM platform_accounts').get().c
  },

  /**
   * 搜索
   */
  search(params = {}) {
    const { searchText, searchFields, options } = params
    const db = getDb()
    // 基础SQL与参数数组
    let sql = 'SELECT * FROM platform_accounts'
    const queryParams = []
    const whereConditions = []

    // 有搜索文本时拼接多字段模糊查询
    if (searchText?.trim()) {
      const likeVal = `%${searchText.trim()}%`
      // 拼接多个字段 OR 匹配
      const fieldArr = Array.isArray(searchFields) ? searchFields : ['account_name', 'display_name']
      fieldArr.forEach((field) => {
        whereConditions.push(`${field} LIKE ?`)
        queryParams.push(likeVal)
      })
    }

    // 拼接WHERE条件
    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' OR ')}`
    }

    // 分页处理（关键：防止LIMIT少传参数报错）
    const { page = 1, pageSize = 20 } = options
    if (pageSize > 0) {
      const offset = (page - 1) * pageSize
      sql += ' LIMIT ?, ?'
      queryParams.push(offset, pageSize)
    }

    // 预编译执行，参数数组和?数量严格对应
    const rows = db.prepare(sql).all(queryParams)
    return rows
  }
}

const publishRecords = {
  list(platform = null, status = null, limit = 100, offset = 0) {
    const db = getDb()
    let sql = 'SELECT * FROM publish_records WHERE 1=1'
    const args = []
    if (platform) {
      sql += ' AND platform = ?'
      args.push(platform)
    }
    if (status) {
      sql += ' AND status = ?'
      args.push(status)
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    args.push(limit, offset)
    const rows = db.prepare(sql).all(...args)
    return rows.map((r) => ({ ...r, tags: parseJSON(r.tags, []) }))
  },

  get(id) {
    const db = getDb()
    const row = db.prepare('SELECT * FROM publish_records WHERE id = ?').get(id)
    return row ? { ...row, tags: parseJSON(row.tags, []) } : null
  },

  create(data) {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO publish_records (id, account_id, platform, video_path, title, description, tags, is_draft, status, error_message, published_at)
      VALUES (@id, @account_id, @platform, @video_path, @title, @description, @tags, @is_draft, @status, @error_message, @published_at)
    `)
    stmt.run({
      id: data.id,
      account_id: data.account_id,
      platform: data.platform,
      video_path: data.video_path,
      title: data.title,
      description: data.description || null,
      tags: stringifyJSON(data.tags || []),
      is_draft: data.is_draft ? 1 : 0,
      status: data.status || 'pending',
      error_message: data.error_message || null,
      published_at: data.published_at || null
    })
    return this.get(data.id)
  },

  update(id, data) {
    const db = getDb()
    const allowed = [
      'account_id',
      'platform',
      'video_path',
      'title',
      'description',
      'is_draft',
      'status',
      'error_message',
      'published_at'
    ]
    const { sets, values } = buildUpdateSets(data, allowed, [])
    if (data.tags !== undefined) {
      sets.push('tags = ?')
      values.push(stringifyJSON(data.tags))
    }
    if (sets.length === 0) return this.get(id)
    values.push(id)
    db.prepare(`UPDATE publish_records SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return this.get(id)
  },

  delete(id) {
    const db = getDb()
    db.prepare('DELETE FROM publish_records WHERE id = ?').run(id)
    return true
  }
}

const ipArchives = {
  /**
   * 获取档案列表
   */
  list(opts = {}) {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM ip_archives ORDER BY created_at DESC').all()
    return rows.map((r) => ({
      ...r,
      video_list: parseJSON(r.video_list_json, []),
      deep_analysis: parseJSON(r.deep_analysis_json, null),
      data_size: r.video_list_json.length || 0
    }))
  },

  get(id) {
    const db = getDb()
    const row = db.prepare('SELECT * FROM ip_archives WHERE id = ?').get(id)
    if (!row) return null
    return {
      ...row,
      video_list: parseJSON(row.video_list_json, []),
      deep_analysis: parseJSON(row.deep_analysis_json, null),
      data_size: row.video_list_json.length || 0
    }
  },

  create(data) {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO ip_archives (name, homepage_url, video_list_json, deep_analysis_json, has_deep, created_at, updated_at)
      VALUES (@name, @homepage_url, @video_list_json, @deep_analysis_json, @has_deep, @created_at, @updated_at)
    `)
    const now = Date.now()
    const info = stmt.run({
      name: data.name,
      homepage_url: data.homepage_url,
      video_list_json: stringifyJSON(data.video_list_json || []),
      deep_analysis_json: stringifyJSON(data.deep_analysis_json || null),
      has_deep: data.has_deep ?? 0,
      created_at: data.created_at || now,
      updated_at: now
    })
    return this.get(info.lastInsertRowid)
  },

  update(id, data) {
    const db = getDb()
    const allowed = ['name', 'homepage_url', 'has_deep']
    const { sets, values } = buildUpdateSets(data, allowed, ['updated_at = CURRENT_TIMESTAMP'])
    if (data.video_list_json !== undefined) {
      sets.push('video_list_json = ?')
      values.push(stringifyJSON(data.video_list_json))
    }
    if (data.deep_analysis_json !== undefined) {
      sets.push('deep_analysis_json = ?')
      values.push(stringifyJSON(data.deep_analysis_json))
    }
    if (sets.length <= 1) return this.get(id)
    values.push(id)
    db.prepare(`UPDATE ip_archives SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return this.get(id)
  },

  delete(id) {
    const db = getDb()
    db.prepare('DELETE FROM ip_archives WHERE id = ?').run(id)
    return true
  }
}

export const models = {
  publishRecords,
  voice: voice,
  digitalHuman: digitalHuman,
  account: account,
  category: category,
  material: material,
  config: config,
  task: task,
  taskSteps: taskSteps,
  ipArchives
}
