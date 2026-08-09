import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { getAppRootPath } from '../ipc/file.ipc'

/**
 * 数据库实例
 *
 * @type {better-sqlite3.Database}
 */
let db = null

/**
 * 确保目录存在
 * @param {string} dir - 目录路径
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * 安全删除文件
 * @param {string} p - 文件路径
 */
function safeUnlink(p) {
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p)
  } catch (e) {
    console.warn('[db] unlink failed:', (e && e.message) || e)
  }
}

/**
 * 获取数据库路径
 */
export function getDbPath() {
  const projectRoot = process.cwd()
  const userData = app ? app.getPath('userData') : path.join(projectRoot, '.local-userdata')
  ensureDir(userData)
  return path.join(userData, 'aigc_client.db')
}

/**
 * 初始化数据库
 */
export function initDatabase() {
  if (db) return db

  const dbPath = getDbPath()

  let opened = false
  let firstOpenError = null
  try {
    db = new Database(dbPath, {
      verbose: (sql) => {
        // console.log('[SQL]', sql)
      }
    })
    opened = true
  } catch (e) {
    firstOpenError = e
  }

  if (!opened) {
    safeUnlink(dbPath)
    safeUnlink(dbPath + '-wal')
    safeUnlink(dbPath + '-shm')
    try {
      db = new Database(dbPath)
      opened = true
    } catch (e2) {
      throw firstOpenError || e2
    }
  }

  try {
    db.pragma('journal_mode = DELETE')
  } catch (e) {
    console.warn('[db] journal_mode failed:', (e && e.message) || e)
  }
  try {
    db.pragma('foreign_keys = ON')
  } catch (e) {
    console.warn('[db] foreign_keys failed:', (e && e.message) || e)
  }

  try {
    createTables()
    seedDefaultData()
  } catch (e) {
    console.warn('[db] init tables/seed failed, resetting DB:', (e && e.message) || e)
    try {
      db.close()
    } catch (e) {
      console.warn('[db] close failed:', (e && e.message) || e)
      db = null
    }
    safeUnlink(dbPath)
    safeUnlink(dbPath + '-wal')
    safeUnlink(dbPath + '-shm')
    db = new Database(dbPath)
    try {
      db.pragma('journal_mode = DELETE')
    } catch (e) {
      console.warn('[db] journal_mode retry failed:', (e && e.message) || e)
    }
    try {
      db.pragma('foreign_keys = ON')
    } catch (e) {
      console.warn('[db] foreign_keys retry failed:', (e && e.message) || e)
    }
    createTables()
    seedDefaultData()
  }

  return db
}

/**
 * 初始化默认数据
 */
function seedDefaultData() {
  function now() {
    return new Date().toISOString()
  }
  const appRoot = getAppRootPath()
  const assetsDir = path.join(appRoot, 'resources', 'assets')
  const __userDataDir =
    app && app.getPath ? app.getPath('userData') : path.join(process.cwd(), '.local-userdata')
  ensureDir(__userDataDir)
  const __outputsDir = path.join(appRoot, 'outputs')

  const countConfig = db.prepare('SELECT COUNT(*) AS c FROM config').get().c
  if (countConfig === 0) {
    const ins = db.prepare(`
      INSERT INTO config (key, value, category, description, created_at, updated_at)
      VALUES (@key, @value, @category, @description, @created_at, @updated_at)
    `)
    const tx = db.transaction(() => {
      // 扩展：SettingsView 常规设置补充
      ins.run({
        key: 'general.highPerfTts',
        value: 'false',
        category: 'general',
        description: '声音合成高性能模式开关',
        created_at: now(),
        updated_at: now()
      })
      ins.run({
        key: 'general.highPerfRunning',
        value: 'false',
        category: 'general',
        description: '高性能常驻服务是否运行中',
        created_at: now(),
        updated_at: now()
      })
      ins.run({
        key: 'general.theme',
        value: 'dark',
        category: 'general',
        description: '默认general.theme配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'general.language',
        value: 'zh-CN',
        category: 'general',
        description: '默认general.language配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'general.autoStart',
        value: 'false',
        category: 'general',
        description: '默认general.autoStart配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'general.minimizeToTray',
        value: 'false',
        category: 'general',
        description: '默认general.minimizeToTray配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'general.rememberWindow',
        value: 'true',
        category: 'general',
        description: '默认general.rememberWindow配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'general.runMode',
        value: 'local',
        category: 'general',
        description: '默认general.runMode配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'general.defaultWorkflowView',
        value: 'new',
        category: 'general',
        description: '默认general.defaultWorkflowView配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'paths.baseOutput',
        value: __outputsDir,
        category: 'paths',
        description: '默认paths.baseOutput配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'paths.audioOutput',
        value: path.join(__outputsDir, 'audios'),
        category: 'paths',
        description: '默认paths.audioOutput配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'paths.videoOutput',
        value: path.join(__outputsDir, 'videos'),
        category: 'paths',
        description: '默认paths.videoOutput配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'paths.draftOutput',
        value: path.join(__outputsDir, 'drafts'),
        category: 'paths',
        description: '默认paths.draftOutput配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'paths.exportOutput',
        value: path.join(__outputsDir, 'exports'),
        category: 'paths',
        description: '默认paths.exportOutput配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'paths.thumbs',
        value: path.join(__outputsDir, 'thumbs'),
        category: 'paths',
        description: '默认paths.thumbs配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })

      // ai
      ins.run({
        key: 'ai.baseURL',
        value: 'https://ark.cn-beijing.volces.com/api/v3',
        category: 'ai',
        description: '默认ai.baseURL配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'ai.provider',
        value: 'volcengine',
        category: 'ai',
        description: '默认ai.provider配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'ai.apiKey',
        value: '',
        category: 'ai',
        description: '默认ai.apiKey配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'ai.model',
        value: 'doubao-seed-2-0-lite-260215',
        category: 'ai',
        description: '默认ai.model配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'ai.visionModel',
        value: 'doubao-seed-1-6-251015',
        category: 'ai',
        description: '默认ai.visionModel配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'ai.fps',
        value: '2',
        category: 'ai',
        description: '默认ai.fps配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'ai.temperature',
        value: '0.7',
        category: 'ai',
        description: '默认ai.temperature配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'ai.maxTokens',
        value: '4000',
        category: 'ai',
        description: '默认ai.maxTokens配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'ai.enableStream',
        value: 'true',
        category: 'ai',
        description: '默认ai.enableStream配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })

      // 数字人
      ins.run({
        key: 'digitalHuman.provider',
        value: 'default',
        category: 'digitalHuman',
        description: '默认digitalHuman.provider配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'digitalHuman.voice',
        value: 'female_1',
        category: 'digitalHuman',
        description: '默认digitalHuman.voice配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'digitalHuman.speed',
        value: '1',
        category: 'digitalHuman',
        description: '默认digitalHuman.speed配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'digitalHuman.pitch',
        value: '1',
        category: 'digitalHuman',
        description: '默认digitalHuman.pitch配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'digitalHuman.emotion',
        value: 'neutral',
        category: 'digitalHuman',
        description: '默认digitalHuman.emotion配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'digitalHuman.background',
        value: 'default',
        category: 'digitalHuman',
        description: '默认digitalHuman.background配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'digitalHuman.modelVersion',
        value: 'V1',
        category: 'digitalHuman',
        description: '默认digitalHuman.modelVersion配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })

      // 语音克隆
      ins.run({
        key: 'voiceClone.provider',
        value: 'default',
        category: 'voiceClone',
        description: '默认voiceClone.provider配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'voiceClone.model',
        value: 'default',
        category: 'voiceClone',
        description: '默认voiceClone.model配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'voiceClone.quality',
        value: 'high',
        category: 'voiceClone',
        description: '默认voiceClone.quality配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'voiceClone.speed',
        value: '1',
        category: 'voiceClone',
        description: '默认voiceClone.speed配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'voiceClone.pitch',
        value: '1',
        category: 'voiceClone',
        description: '默认voiceClone.pitch配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'voiceClone.enableNoise',
        value: 'false',
        category: 'voiceClone',
        description: '默认voiceClone.enableNoise配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'voiceClone.noiseLevel',
        value: '0.1',
        category: 'voiceClone',
        description: '默认voiceClone.noiseLevel配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'voiceClone.mode',
        value: 'slow',
        category: 'voiceClone',
        description: '默认voiceClone.mode配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'voiceClone.highPerformance',
        value: 'false',
        category: 'voiceClone',
        description: '默认voiceClone.highPerformance配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })

      // 提示词
      ins.run({
        key: 'prompts.currentPromptId',
        value: 'default',
        category: 'prompts',
        description: '默认prompts.currentPromptId配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'prompts.titlePrompt',
        value:
          '请为以下内容生成一个吸引人的标题，要求简洁有力，能够吸引用户点击，标题字数控制在12字以内，描述控制在50字以内：',
        category: 'prompts',
        description: '默认prompts.titlePrompt配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'prompts.prompt_default',
        value:
          '{"name":"默认文案写作提示词","content":"# 你是一位文案改写助手，全文字数要与原文案字数没有什么差距。\\n\\n                ## 写作限制和特征\\n                -禁止输出的词：“原文”“作者”“文章”等词，攻击性强、侮辱性强的词（滚吧、找爸爸去、废物）、骂人的词（傻子、垃圾、蠢蛋），ai常用词（如“这波操作”、“666”）\\n                -用词口语化，句式有短句、情绪浓烈，\\n                -不要输出前言和介绍，也不能直白的指责。\\n                -写作的内容不要引用提示词的要求。\\n\\n                ## 写作要求\\n                1、第一段直接照抄原文的第一句话作为文章开头，一个字也不能改，必须控制30个字以内，绝对禁止照抄的第一句话超过30个字，超过30个字在不影响句子连贯的情况下截停。\\n\\n                2、后面的内容要具体叙述具体行为，每一个具体动作都不能跳过，可以直接使用原文句子，但是不能完全一致，从原文案的内容里面，用不同的角度切入叙述，确保内容完整，可以使用同义字进行替换，重组结构。\\n\\n                3、最后一段可以直接使用原文的最后一段，如果有身份信息的内容，就不要写出来，**例如：我是某某，后续内容主页观看。**","description":"系统默认的文案写作提示词模板","model":"doubao-seed-1-6-250615","createdAt":"2026-07-15T13:11:47.743Z","updatedAt":"2026-07-15T13:11:47.743Z"}',
        category: 'prompts',
        description: '默认prompts.prompt_default配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })

      // auth
      ins.run({
        key: 'auth.token',
        value: '',
        category: 'auth',
        description: '默认auth.token配置',
        created_at: '2026-07-15T13:11:47.743Z',
        updated_at: '2026-07-15T13:11:47.743Z'
      })
      ins.run({
        key: 'auth.deviceId',
        value: '',
        category: 'auth',
        description: 'PC端设备ID',
        created_at: '2026-07-15T13:11:48.671Z',
        updated_at: '2026-07-15T13:11:48.671Z'
      })

      ins.run({
        key: 'system.voiceSamplesInitialized_v2',
        value: 'true',
        category: 'system',
        description: '声音样本初始化标记',
        created_at: '2026-07-15T13:32:35.752Z',
        updated_at: '2026-07-15T13:32:35.752Z'
      })
      ins.run({
        key: 'system.digitalHumansInitialized',
        value: 'true',
        category: 'system',
        description: '数字人初始化标记',
        created_at: '2026-07-15T13:32:35.764Z',
        updated_at: '2026-07-15T13:32:35.764Z'
      })
    })
    tx()
  }

  const countHumans = db.prepare('SELECT COUNT(*) AS c FROM digital_humans').get().c
  if (countHumans === 0) {
    const ins = db.prepare(`
      INSERT INTO digital_humans (id, name, description, video_path, video_url, thumbnail_path, video_duration, file_size, video_format, resolution, status, sort_order)
      VALUES (@id, @name, @description, @video_path, @video_url, @thumbnail_path, @video_duration, @file_size, @video_format, @resolution, 'active', @sort_order)
    `)
    const tx = db.transaction(() => {
      ins.run({
        id: '82b5ac8f-dfc3-481c-9b7f-06780a55c951',
        name: '示例1-绿幕',
        description: null,
        video_path: path.join(assetsDir, 'videos', '示例1-绿幕.mp4'),
        video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/video/1764939140639_f6tv14.mp4',
        thumbnail_path: path.join(assetsDir, 'thumbs', '示例1-绿幕_cover.jpg'),
        video_duration: null,
        file_size: 49923075,
        video_format: '.mp4',
        resolution: null,
        sort_order: 1
      })
      ins.run({
        id: '1c491992-312e-47d3-9f1f-8f7527d56f99',
        name: '示例2-夜间',
        description: null,
        video_path: path.join(assetsDir, 'videos', '示例2-夜间.mp4'),
        video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/video/1764939161086_0bf1jf.mp4',
        thumbnail_path: path.join(assetsDir, 'thumbs', '示例2-夜间_cover.jpg'),
        video_duration: null,
        file_size: 24403036,
        video_format: '.mp4',
        resolution: null,
        sort_order: 2
      })
      ins.run({
        id: '01b65c79-9cb2-4ab2-af38-2d45d2ba2857',
        name: '示例3-百天',
        description: null,
        video_path: path.join(assetsDir, 'videos', '示例3-百天.mp4'),
        video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/video/1764939180646_jzj1nv.mp4',
        thumbnail_path: path.join(assetsDir, 'thumbs', '示例3-百天_cover.jpg'),
        video_duration: null,
        file_size: 22272872,
        video_format: '.mp4',
        resolution: null,
        sort_order: 3
      })
      ins.run({
        id: '73b8bd23-e817-4cd8-84b6-0e883326fcf1',
        name: '示例4-白天',
        description: null,
        video_path: path.join(assetsDir, 'videos', '示例4-白天.mp4'),
        video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/video/1764939209916_m5tyk1.mp4',
        thumbnail_path: path.join(assetsDir, 'thumbs', '示例4-白天_cover.jpg'),
        video_duration: null,
        file_size: 24339520,
        video_format: '.mp4',
        resolution: null,
        sort_order: 4
      })
      ins.run({
        id: 'e877db98-dec6-41d5-9c24-87c8c9cb6a97',
        name: '中年男士1',
        description: null,
        video_path: path.join(assetsDir, 'videos', '中年男士1_processed.mp4'),
        video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/video/1767510587441_uhewip.mp4',
        thumbnail_path: path.join(assetsDir, 'thumbs', '中年男士1_processed_cover.jpg'),
        video_duration: null,
        file_size: 8263471,
        video_format: '.mp4',
        resolution: null,
        sort_order: 5
      })
      ins.run({
        id: 'c3994b0c-1db1-4c07-b99c-47d0c8e5e065',
        name: '青年男1',
        description: null,
        video_path: path.join(assetsDir, 'videos', '青年男1_processed.mp4'),
        video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/video/1767514386275_4awehx.mp4',
        thumbnail_path: path.join(assetsDir, 'thumbs', '青年男1_processed_cover.jpg'),
        video_duration: null,
        file_size: 9653346,
        video_format: '.mp4',
        resolution: null,
        sort_order: 6
      })
    })
    tx()
  }

  const countVoices = db.prepare('SELECT COUNT(*) AS c FROM voice_models').get().c
  if (countVoices === 0) {
    const ins = db.prepare(`
      INSERT INTO voice_models (id, name, description, prompt_text, audio_path, audio_url, audio_duration, file_size, status, sort_order)
      VALUES (@id, @name, @description, @prompt_text, @audio_path, @audio_url, @audio_duration, @file_size, 'active', @sort_order)
    `)
    const tx = db.transaction(() => {
      ins.run({
        id: '77c13aac-5290-4a55-8da5-c1fbe942dcb6',
        name: '女-带货',
        description:
          '上来以后就很清爽，但是又足够的滋润，一定是比普通的水比精华水会更加滋润。只要你这个皮肤粗糙干燥起皮的，你用了很多水，很多面膜。',
        prompt_text: null,
        audio_path: path.join(assetsDir, 'audio', '女生-声音1-带货.MP3'),
        audio_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/audio/1762416655252_eh0cy8.MP3',
        audio_duration: null,
        file_size: 241421,
        sort_order: 1
      })
      ins.run({
        id: '2163e1b4-e642-4378-a296-abb51e9270db',
        name: '女-鸡汤',
        description:
          '我被罗素的这段话给骂醒了，一定要读给你听。他说，人的放纵是本能，自律才是修行。短时间能让你感到快乐的东西，一定能够让你感到痛苦。',
        prompt_text: null,
        audio_path: path.join(assetsDir, 'audio', '女-声音-鸡汤.MP3'),
        audio_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/audio/1762416688495_v4xhap.MP3',
        audio_duration: null,
        file_size: 301607,
        sort_order: 2
      })
      ins.run({
        id: '5dc5426e-acd1-45b1-94ce-2a2edbd80de5',
        name: '女-营销',
        description:
          '拍旅游vlog没人看，一开场5秒，必放高能画面，跳海美食特写上眼球。2、运镜用推拉摇移，动态感秒杀静态镜头。3、结尾加下期预告勾住观众。',
        prompt_text: null,
        audio_path: path.join(assetsDir, 'audio', '女-营销.MP3'),
        audio_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/audio/1762416701154_q4xs62.MP3',
        audio_duration: null,
        file_size: 257094,
        sort_order: 3
      })
      ins.run({
        id: '4552bb50-55fb-46e1-929e-290fd9279fb2',
        name: '磁性男生',
        description:
          '傍晚时分，我静静地坐在院子里，看着天空慢慢变成粉红色，远处的白云像棉花糖一样轻柔，微风轻轻吹过，带来了茉莉花的香气。这样平静的时刻，总让人感到温暖而安心。',
        prompt_text: null,
        audio_path: path.join(assetsDir, 'audio', '磁性男生.wav'),
        audio_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/audio/1767262350381_xmueya.wav',
        audio_duration: null,
        file_size: 414692,
        sort_order: 4
      })
      ins.run({
        id: 'd3964e1b-f60d-4ddd-b0d3-71867d53a33a',
        name: '磁性男声2',
        description:
          '今天我们要做一个有趣的化学实验。首先准备碳酸氢钠和醋酸溶液，观察它们混合时产生的反应。注意实验过程中要戴好防护眼镜，保持通风。这个实验可以帮助我们理解酸碱中和反应的原理。',
        prompt_text: null,
        audio_path: path.join(assetsDir, 'audio', '磁性男声2.wav'),
        audio_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/audio/1767262367123_whnaeb.wav',
        audio_duration: null,
        file_size: 474042,
        sort_order: 5
      })
      ins.run({
        id: '954c4f37-408d-433c-8405-0b459fdf3cdc',
        name: '纪录片男播音',
        description:
          '走进宾居老街盐马古道上的小香港，青瓦白墙，雕花木窗，带着历史审美色彩的砖瓦房。',
        prompt_text: null,
        audio_path: path.join(assetsDir, 'audio', '纪录片男播音.wav'),
        audio_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/audio/1767262380843_gnb8m7.wav',
        audio_duration: null,
        file_size: 363702,
        sort_order: 6
      })
      ins.run({
        id: 'df04993f-1668-4333-9d8d-87065dd99049',
        name: '中年男',
        description: '那些打不倒你的，都会让你悄悄长出铠甲。天亮之后，你会发现自己比想象中更强大。',
        prompt_text: null,
        audio_path: path.join(assetsDir, 'audio', '中年男.wav'),
        audio_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/digital_human/2/audio/1767262389201_v8ursl.wav',
        audio_duration: null,
        file_size: 208128,
        sort_order: 7
      })
    })
    tx()
  }
}

/**
 * 创建数据库表
 */
function createTables() {
  const exec = db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

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

      CREATE TABLE IF NOT EXISTS ip_archives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        homepage_url TEXT NOT NULL,
        video_list_json TEXT,
        deep_analysis_json TEXT,
        has_deep INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );

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

      CREATE TABLE IF NOT EXISTS platform_accounts (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        account_name TEXT NOT NULL,
        display_name TEXT,
        cookies TEXT,
        status TEXT,
        last_login_at DATETIME,
        created_at DATETIME,
        updated_at DATETIME,
        UNIQUE(platform, account_name)
      );

      CREATE TABLE IF NOT EXISTS publish_records (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        video_path TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        is_draft BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        published_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES platform_accounts (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        mode TEXT NOT NULL CHECK (mode IN ('immediate', 'background', 'cloud', 'manual', 'auto')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
        current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 7),
        progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        pipeline_data TEXT NOT NULL DEFAULT '{}',
        settings_data TEXT NOT NULL DEFAULT '{}',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME NULL,
        error_message TEXT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3
      );

      CREATE TABLE IF NOT EXISTS task_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        step_name TEXT NOT NULL CHECK (step_name IN ('extract', 'rewrite', 'voiceClone', 'digitalHuman', 'videoEdit', 'titleCover', 'publish')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'error', 'skipped')),
        input_data TEXT DEFAULT '{}',
        output_data TEXT DEFAULT '{}',
        started_at DATETIME NULL,
        completed_at DATETIME NULL,
        error_message TEXT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      );

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

      CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at);
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

      CREATE INDEX IF NOT EXISTS idx_config_category ON config(category);
      CREATE INDEX IF NOT EXISTS idx_config_updated ON config(updated_at);

      CREATE INDEX IF NOT EXISTS idx_digital_humans_created_at ON digital_humans(created_at);
      CREATE INDEX IF NOT EXISTS idx_digital_humans_name ON digital_humans(name);
      CREATE INDEX IF NOT EXISTS idx_digital_humans_sort_order ON digital_humans(sort_order);
      CREATE INDEX IF NOT EXISTS idx_digital_humans_status ON digital_humans(status);

      CREATE INDEX IF NOT EXISTS idx_ip_archives_created_at ON ip_archives(created_at);

      CREATE INDEX IF NOT EXISTS idx_materials_category_id ON materials(category_id);
      CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at);
      CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
      CREATE INDEX IF NOT EXISTS idx_materials_vector_id ON materials(vector_id);

      CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON platform_accounts(created_at);
      CREATE INDEX IF NOT EXISTS idx_accounts_platform ON platform_accounts(platform);
      CREATE INDEX IF NOT EXISTS idx_accounts_status ON platform_accounts(status);

      CREATE INDEX IF NOT EXISTS idx_publish_records_account_id ON publish_records(account_id);
      CREATE INDEX IF NOT EXISTS idx_publish_records_created_at ON publish_records(created_at);
      CREATE INDEX IF NOT EXISTS idx_publish_records_platform ON publish_records(platform);
      CREATE INDEX IF NOT EXISTS idx_publish_records_status ON publish_records(status);

      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_current_step ON tasks(current_step);
      CREATE INDEX IF NOT EXISTS idx_tasks_mode ON tasks(mode);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

      CREATE INDEX IF NOT EXISTS idx_task_steps_started_at ON task_steps(started_at);
      CREATE INDEX IF NOT EXISTS idx_task_steps_status ON task_steps(status);
      CREATE INDEX IF NOT EXISTS idx_task_steps_step_name ON task_steps(step_name);
      CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);

      CREATE INDEX IF NOT EXISTS idx_voice_models_created_at ON voice_models(created_at);
      CREATE INDEX IF NOT EXISTS idx_voice_models_name ON voice_models(name);
      CREATE INDEX IF NOT EXISTS idx_voice_models_sort_order ON voice_models(sort_order);
      CREATE INDEX IF NOT EXISTS idx_voice_models_status ON voice_models(status);
    `)
  })

  exec()

  // 迁移：为旧版数据库补全缺失的列
  try {
    const cols = db.pragma('table_info(voice_models)').map((c) => c.name)
    if (!cols.includes('server_voice_id')) {
      db.exec('ALTER TABLE voice_models ADD COLUMN server_voice_id TEXT')
    }
  } catch (e) {
    console.warn('[db] migrate voice_models columns failed:', (e && e.message) || e)
  }
}

/**
 * 获取数据库实例
 */
export function getDb() {
  if (!db) initDatabase()
  return db
}

/**
 * 关闭数据库连接
 */
export function closeDb() {
  if (db) {
    try {
      db.close()
    } catch (e) {
      console.warn('[db] close failed:', (e && e.message) || e)
    }
    db = null
  }
}
