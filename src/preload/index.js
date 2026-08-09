import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 根据数字人版本返回对应的 Python 模块名
const getDigitalHumanModuleName = async (version = 'V1') => {
  return version === 'V2' ? 'hdModule' : 'humanModule'
}

const api = {
  // 获取file对象的真实路径
  getPathForFile: (file) => {
    const path = webUtils.getPathForFile(file)
    return path
  },

  // ---- 数据库操作（通用） ----
  db: {
    init: (model) => {
      console.log('db init', model)
      return ipcRenderer.invoke('db:init', { model })
    },
    create: (model, data) => {
      console.log('db create', model, data)
      return ipcRenderer.invoke('db:create', { model, data })
    },
    find: (model, id) => {
      console.log('db find', model, id)
      return ipcRenderer.invoke('db:find', { model, id })
    },
    findByName: (model, name) => {
      console.log('db findByName', model, name)
      return ipcRenderer.invoke('db:findByName', { model, name })
    },
    list: (model, options) => {
      console.log('db list', model, options)
      return ipcRenderer.invoke('db:list', { model, options })
    },
    update: (model, id, data) => {
      console.log('db update', model, id, data)
      return ipcRenderer.invoke('db:update', { model, id, data })
    },
    delete: (model, id, hardDelete) => {
      console.log('db delete', model, id, hardDelete)
      return ipcRenderer.invoke('db:delete', { model, id, hardDelete })
    },
    stats: (model) => {
      console.log('db stats', model)
      return ipcRenderer.invoke('db:stats', { model })
    },
    search: (model, searchText, searchFields, options) => {
      console.log('db search', model, searchText, searchFields, options)
      return ipcRenderer.invoke('db:search', { model, searchText, searchFields, options })
    },
    backup: (options) => {
      console.log('db backup', options)
      return ipcRenderer.invoke('database:backup', options)
    },
    restore: (options) => {
      console.log('db restore', options)
      return ipcRenderer.invoke('database:restore', options)
    }
  },

  // IP 大脑 / 对标账号（ip_archives 表）
  ipBrain: {
    list: (opts) => {
      console.log('ipBrain list', opts)
      return ipcRenderer.invoke('ip-brain:list', opts)
    },
    create: (data) => {
      console.log('ipBrain create', data)
      return ipcRenderer.invoke('ip-brain:create', data)
    },
    // 获取
    get: (id) => {
      console.log('ipBrain get', id)
      return ipcRenderer.invoke('ip-brain:get', id)
    },
    // 删除
    delete: (id) => {
      console.log('ipBrain delete', id)
      return ipcRenderer.invoke('ip-brain:delete', id)
    }
  },

  // ---- 语音（数据库模型） ----
  voice: {
    init: () => {
      console.log('voice init')
      return ipcRenderer.invoke('db:init', { model: 'voice' })
    },
    create: (data) => ipcRenderer.invoke('db:create', { model: 'voice', data }),
    find: (id) => ipcRenderer.invoke('db:find', { model: 'voice', id }),
    findByName: (name) => ipcRenderer.invoke('db:findByName', { model: 'voice', name }),
    list: (options) => ipcRenderer.invoke('db:list', { model: 'voice', options }),
    update: (id, data) => {
      console.log('voice update', id, data)
      return ipcRenderer.invoke('db:update', { model: 'voice', id, data })
    },
    delete: (id) => {
      console.log('voice delete', id)
      return ipcRenderer.invoke('db:delete', { model: 'voice', id })
    },
    // 重新排序
    reorder: (orders) => {
      console.log('voice reorder', orders)
      return ipcRenderer.invoke('db:reorder', { model: 'voice', orders })
    },
    stats: () => {
      console.log('voice stats')
      return ipcRenderer.invoke('db:stats', { model: 'voice' })
    },
    search: (searchText, options) => {
      console.log('voice search', searchText, options)
      return ipcRenderer.invoke('db:search', {
        model: 'voice',
        searchText,
        searchFields: ['name', 'description'],
        options
      })
    }
  },

  // 数字人模型（digital_humans 表）
  digitalHuman: {
    init: () => {
      console.log('digitalHuman init')
      return ipcRenderer.invoke('db:init', { model: 'digitalHuman' })
    },
    create: (data) => ipcRenderer.invoke('db:create', { model: 'digitalHuman', data }),
    find: (id) => ipcRenderer.invoke('db:find', { model: 'digitalHuman', id }),
    findByName: (name) => ipcRenderer.invoke('db:findByName', { model: 'digitalHuman', name }),
    list: (options) => ipcRenderer.invoke('db:list', { model: 'digitalHuman', options }),
    update: (id, data) => ipcRenderer.invoke('db:update', { model: 'digitalHuman', id, data }),
    delete: (id) => ipcRenderer.invoke('db:delete', { model: 'digitalHuman', id }),
    reorder: (orders) => {
      console.log('digitalHuman reorder', orders)
      return ipcRenderer.invoke('db:reorder', { model: 'digitalHuman', orders })
    },
    stats: () => {
      console.log('digitalHuman stats')
      return ipcRenderer.invoke('db:stats', { model: 'digitalHuman' })
    },
    search: (searchText, options) =>
      ipcRenderer.invoke('db:search', {
        model: 'digitalHuman',
        searchText,
        searchFields: ['name', 'description'],
        options
      })
  },

  // Python 功能调用
  python: {
    asr: {
      recognize: (audioFile, language = 'auto', useItn = true) => {
        return ipcRenderer.invoke('python:call-function', {
          moduleName: 'asrModule',
          functionName: 'speechRecognition',
          params: { audio_file: audioFile, language, use_itn: useItn }
        })
      },
      recognizeWithProgress: (audioFile, language = 'auto', useItn = true) =>
        ipcRenderer.invoke('python:call-function-with-progress', {
          moduleName: 'asrModule',
          functionName: 'speechRecognition',
          params: { audio_file: audioFile, language, use_itn: useItn }
        })
    },
    // 语音克隆
    voiceClone: {
      // 文字转语音
      textToSpeech: (mode, text, promptText, promptAudioPath, outputPath, speed = 1, seed = 42) => {
        console.log(
          `voiceClone textToSpeech`,
          mode,
          text,
          promptText,
          promptAudioPath,
          outputPath,
          speed,
          seed
        )
        return ipcRenderer.invoke('python:call-function', {
          moduleName: 'voiceCloneModule',
          functionName: 'soundClone',
          params: {
            mode,
            text,
            prompt_text: promptText,
            prompt_audio_path: promptAudioPath,
            output_path: outputPath,
            speed,
            seed
          }
        })
      },
      // 文字转语音（进度）
      textToSpeechWithProgress: (
        mode,
        text,
        promptText,
        promptAudioPath,
        outputPath,
        speed = 1,
        seed = 42
      ) => {
        console.log(
          `voiceClone textToSpeechWithProgress`,
          mode,
          text,
          promptText,
          promptAudioPath,
          outputPath,
          speed,
          seed
        )
        const res = ipcRenderer.invoke('python:call-function-with-progress', {
          moduleName: 'voiceCloneModule',
          functionName: 'soundClone',
          params: {
            mode,
            text,
            prompt_text: promptText,
            prompt_audio_path: promptAudioPath,
            output_path: outputPath,
            speed,
            seed
          }
        })
        console.log('textToSpeechWithProgress res:', res)
        return res
      },
      // 文字转语音（V2）
      textToSpeechV2: (
        mode,
        text,
        promptText,
        promptAudioPath,
        outputPath,
        speed = 1,
        emotions = null,
        emotionWeight = 1,
        emotionText = null,
        emotionRefAudioPath = null
      ) => {
        console.log(
          `voiceClone textToSpeechV2`,
          mode,
          text,
          promptText,
          promptAudioPath,
          outputPath,
          speed,
          emotions,
          emotionWeight,
          emotionText,
          emotionRefAudioPath
        )
        return ipcRenderer.invoke('python:call-function', {
          moduleName: 'voiceV2Module',
          functionName: 'soundClone',
          params: {
            mode,
            text,
            prompt_text: promptText,
            prompt_audio_path: promptAudioPath,
            output_path: outputPath,
            speed,
            emotions,
            emotion_weight: emotionWeight,
            emotion_text: emotionText,
            emotion_ref_audio_path: emotionRefAudioPath
          }
        })
      },
      // 文字转语音（V2）（进度）
      // 1. 经典模型  mode slow
      // 2. 快速模型  mode slow
      // 2个都一样的
      textToSpeechWithProgressV2: (
        mode,
        text,
        promptText,
        promptAudioPath,
        outputPath,
        speed = 1,
        emotions = null,
        emotionWeight = 1,
        emotionText = null,
        emotionRefAudioPath = null,
        highPerformance = false
      ) => {
        console.log(
          `voiceClone textToSpeechWithProgressV2`,
          'mode',
          mode,
          'speed',
          speed,
          'emotions',
          emotions,
          'emotionWeight',
          emotionWeight,
          'emotionText',
          emotionText,
          'emotionRefAudioPath',
          emotionRefAudioPath,
          'highPerformance',
          highPerformance
        )
        return ipcRenderer.invoke('python:call-function-with-progress', {
          moduleName: 'voiceV2Module',
          functionName: 'soundClone',
          params: {
            mode,
            text,
            prompt_text: promptText,
            prompt_audio_path: promptAudioPath,
            output_path: outputPath,
            speed,
            emotions,
            emotion_weight: emotionWeight,
            emotion_text: emotionText,
            emotion_ref_audio_path: emotionRefAudioPath,
            high_performance: highPerformance
          }
        })
      }
    },
    // 数字人视频生成
    digitalHuman: {
      // 生成视频
      generateVideo: async (audioFile, videoFile, options = {}) => {
        console.log(`digitalHuman generateVideo`, audioFile, videoFile, options)
        const params = {
          audio_file: audioFile,
          video_file: videoFile,
          watermark: options.watermark ?? false,
          digital_auth: options.digital_auth ?? options.digitalAuth ?? false,
          output_dir: options.output_dir ?? options.outputDir ?? null,
          model_version: options.model_version ?? options.modelVersion ?? 'V1'
        }
        const moduleName = await getDigitalHumanModuleName(params.model_version)
        return ipcRenderer.invoke('python:call-function', {
          moduleName,
          functionName: 'generateDigitalHuman',
          params
        })
      },
      // 生成视频（进度）
      generateVideoWithProgress: async (audioFile, videoFile, options = {}) => {
        console.log(`digitalHuman generateVideoWithProgress`, audioFile, videoFile, options)
        const params = {
          audio_file: audioFile,
          video_file: videoFile,
          watermark: options.watermark ?? false,
          digital_auth: options.digital_auth ?? options.digitalAuth ?? false,
          output_dir: options.output_dir ?? options.outputDir ?? null,
          model_version: options.model_version ?? options.modelVersion ?? 'V1'
        }
        const moduleName = await getDigitalHumanModuleName(params.model_version)
        return ipcRenderer.invoke('python:call-function-with-progress', {
          moduleName,
          functionName: 'generateDigitalHuman',
          params
        })
      }
    },
    // 任务进度监听
    onProgress: (callback) => {
      const handler = (_, data) => {
        console.log('onProgress', data)
        return callback(data)
      }
      ipcRenderer.on('taskProgress', handler)
      return () => ipcRenderer.removeListener('taskProgress', handler)
    },
    // 获取任务状态
    getStatus: (moduleName) => ipcRenderer.invoke('python:get-status', moduleName),
    // 控制 API
    controlApi: (moduleName, action) =>
      ipcRenderer.invoke('python:control-api', { moduleName, action }),
    // 检查模块是否存在
    checkModuleExists: (moduleName) => ipcRenderer.invoke('python:check-module-exists', moduleName)
  },

  // ---- 文件操作 ----
  file: {
    getAppInfo: () => ipcRenderer.invoke('file:get-app-info'),
    getAppRoot: () => ipcRenderer.invoke('file:get-app-root'),
    getTempPath: () => ipcRenderer.invoke('file:get-temp-dir'),
    getDataPath: () => {
      return ipcRenderer.invoke('file:get-data-dir')
    },
    read: (path) => {
      console.log('file read', path)
      return ipcRenderer.invoke('file:read', path)
    },
    write: (path, data) => {
      console.log('file write', path, data)
      return ipcRenderer.invoke('file:write', path, data)
    },
    writeText: (path, text) => {
      console.log('file writeText', path, text)
      return ipcRenderer.invoke('file:write', path, text)
    },
    writeBuffer: (path, buffer) => {
      console.log('file writeBuffer', path, buffer)
      return ipcRenderer.invoke('file:write-buffer', path, buffer)
    },
    readText: (path) => {
      console.log('file readText', path)
      return ipcRenderer.invoke('file:read', path)
    },
    readBuffer: (path) => {
      console.log('file readBuffer', path)
      return ipcRenderer.invoke('file:read-buffer', path)
    },
    copy: (src, dest) => {
      console.log('file copy', src, dest)
      return ipcRenderer.invoke('file:copy', src, dest)
    },
    delete: (path) => {
      console.log('file delete', path)
      return ipcRenderer.invoke('file:delete', path)
    },
    // 检查路径是否存在
    exists: (path) => {
      console.log('file exists', path)
      return ipcRenderer.invoke('file:exists', path)
    },
    getInfo: (path) => {
      console.log('file getInfo', path)
      return ipcRenderer.invoke('file:get-info', path)
    },
    getStats: (path) => {
      console.log('file getStats', path)
      return ipcRenderer.invoke('file:get-stats', path)
    },
    ensureDir: (path) => {
      console.log('file ensureDir', path)
      return ipcRenderer.invoke('file:mkdir', path)
    },
    readDir: (path) => {
      console.log('file readDir', path)
      return ipcRenderer.invoke('file:read-dir', path)
    },
    mkdir: (path) => {
      console.log('file mkdir', path)
      return ipcRenderer.invoke('file:mkdir', path)
    },
    selectFolder: (options) => {
      console.log('file selectFolder', options)
      return ipcRenderer.invoke('file:select-folder', options)
    },
    selectDirectory: (options) => {
      console.log('file selectDirectory', options)
      return ipcRenderer.invoke('file:select-folder', options)
    },
    selectFile: (options) => {
      console.log('file selectFile', options)
      return ipcRenderer.invoke('file:select-file', options)
    },
    selectFiles: (options) => {
      console.log('file selectFiles', options)
      return ipcRenderer.invoke('file:select-files', options)
    },
    saveDialog: (options) => {
      console.log('file saveDialog', options)
      return ipcRenderer.invoke('file:save-dialog', options)
    },
    showInFolder: (path) => {
      console.log('file showInFolder', path)
      return ipcRenderer.invoke('file:show-in-folder', path)
    },
    openExternal: (url) => {
      console.log('file openExternal', url)
      return ipcRenderer.invoke('file:open-external', url)
    },
    openPath: (path) => {
      console.log('file openPath', path)
      return ipcRenderer.invoke('file:open-path', path)
    },
    openTodayLog: () => ipcRenderer.invoke('file:open-today-log'),
    uploadTodayLog: () => ipcRenderer.invoke('file:upload-today-log'),
    clearCache: () => ipcRenderer.invoke('file:clear-cache')
  },

  // ---- 加密 ----
  crypto: {
    md5: (data) => ipcRenderer.invoke('crypto:md5', data),
    sha256: (data) => ipcRenderer.invoke('crypto:sha256', data)
  },

  // ---- 路径工具 ----
  path: {
    join: (...args) => ipcRenderer.invoke('path:join', ...args),
    getUserDataPath: () => ipcRenderer.invoke('path:get-user-data-path'),
    getDocumentsPath: () => ipcRenderer.invoke('path:get-documents-path')
  },

  // ---- 向量数据库 ----
  vector: {
    init: (options) => {
      console.log('vector init', options)
      return ipcRenderer.invoke('vector:init', options)
    },
    embed: (text, options) => {
      console.log('vector embed', text, options)
      return ipcRenderer.invoke('vector:embed', text, options)
    },
    search: (query, topK, options) => {
      console.log('vector search', query, topK, options)
      return ipcRenderer.invoke('vector:search', query, topK, options)
    },
    delete: (id) => {
      console.log('vector delete', id)
      return ipcRenderer.invoke('vector:delete', id)
    }
  },

  // ---- 分类（数据库模型） ----
  category: {
    create: (data) => ipcRenderer.invoke('db:create', { model: 'category', data }),
    find: (id) => ipcRenderer.invoke('db:find', { model: 'category', id }),
    findByName: (name) => ipcRenderer.invoke('db:findByName', { model: 'category', name }),
    list: (options) => {
      console.log('category list', options)
      return ipcRenderer.invoke('db:list', { model: 'category', options })
    },
    update: (id, data) => ipcRenderer.invoke('db:update', { model: 'category', id, data }),
    delete: (id) => ipcRenderer.invoke('db:delete', { model: 'category', id }),
    stats: () => ipcRenderer.invoke('db:stats', { model: 'category' })
  },

  // ---- 素材库 ----
  material: {
    create: (data) => ipcRenderer.invoke('db:create', { model: 'material', data }),
    find: (id) => {
      console.log('material find', id)
      return ipcRenderer.invoke('db:find', { model: 'material', id })
    },
    list: (options) => {
      console.log('material list', options)
      return ipcRenderer.invoke('db:list', { model: 'material', options })
    },
    update: (id, data) => ipcRenderer.invoke('db:update', { model: 'material', id, data }),
    delete: (id) => ipcRenderer.invoke('material:delete', id),
    batchDelete: (ids) => ipcRenderer.invoke('material:batch-delete', ids),
    batchMove: (ids, targetCategory) => {
      console.log('material batchMove', ids, targetCategory)
      return ipcRenderer.invoke('material:batch-move', ids, targetCategory)
    },
    updateDescription: (id, description) => {
      console.log('material updateDescription', id, description)
      return ipcRenderer.invoke('material:update-description', id, description)
    },
    init: () => {
      console.log('material init')
      return ipcRenderer.invoke('material:init')
    },
    uploadVideo: (path, category, options) => {
      console.log('material uploadVideo', path, category, options)
      return ipcRenderer.invoke('material:upload-video', path, category, options)
    },
    uploadImage: (path, category, options) =>
      ipcRenderer.invoke('material:upload-image', path, category, options),
    batchProcess: (ids, action) => ipcRenderer.invoke('material:batch-process', ids, action),
    vectorize: (id) => {
      console.log('material vectorize', id)
      return ipcRenderer.invoke('material:vectorize', id)
    },
    search: (query, categoryId) => {
      console.log('material search', query, categoryId)
      const result = ipcRenderer.invoke('material:search', query, categoryId)
      console.log('material search result', result)
      return result
    },
    verifyCategoryFiles: (categoryId) => {
      console.log('material verifyCategoryFiles', categoryId)
      return ipcRenderer.invoke('material:verify-category-files', categoryId)
    }
  },

  // ---- 账号管理 ----
  account: {
    // 创建账号
    create: (data) => ipcRenderer.invoke('db:create', { model: 'account', data }),

    // 查找账号通过id
    find: (id) => ipcRenderer.invoke('db:find', { model: 'account', id }),

    // 获取账号列表
    list: (options) => {
      console.log('account list', options)
      return ipcRenderer.invoke('db:list', { model: 'account', options })
    },
    update: (id, data) => ipcRenderer.invoke('db:update', { model: 'account', id, data }),
    // 删除账号
    delete: (id) => ipcRenderer.invoke('db:delete', { model: 'account', id }),
    search: (searchText, options) =>
      ipcRenderer.invoke('db:search', {
        model: 'account',
        searchText,
        searchFields: ['account_name', 'display_name'],
        options
      }),

    // 获取支持的平台
    getSupportedPlatforms: () => ipcRenderer.invoke('account:get-supported-platforms'),

    // 登录
    setupLogin: (accountId) => ipcRenderer.invoke('account:setup-login', accountId),

    // 测试登录
    testLogin: (accountId) => ipcRenderer.invoke('account:test-login', accountId),
    // 打开账号
    openAccount: (accountId) => ipcRenderer.invoke('account:open-account', accountId),
    // 刷新登录
    refreshLogin: (accountId) => ipcRenderer.invoke('account:refresh-login', accountId),

    // 获取发布记录
    getPublishRecords: (accountId, options) => {
      console.log(`account getPublishRecords`, accountId, options)
      return ipcRenderer.invoke('account:get-publish-records', accountId, options)
    }
  },

  // ---- 发布 ----
  publish: {
    publishVideo: (params) => {
      console.log(`publish publishVideo`, params)
      return ipcRenderer.invoke('publish:publish-video', params)
    }
  },

  // ---- 视频渲染 ----
  videoRender: {
    render: (params) => ipcRenderer.invoke('video-render:render', params),
    getTemplates: () => {
      return ipcRenderer.invoke('video-render:get-templates')
    }
  },

  // ---- 视频处理 ----
  video: {
    getInfo: (path) => {
      console.log(`video getInfo`, path)
      return ipcRenderer.invoke('video:get-info', path)
    },
    getCover: (videoPath, outputPath, options) => {
      console.log(`video getCover`, videoPath, outputPath, options)
      return ipcRenderer.invoke('video:get-cover', videoPath, outputPath, options)
    },
    embedCover: (params) => {
      console.log(`video embedCover`, params)
      return ipcRenderer.invoke('video:embed-cover', params)
    },
    transcodeTo2K: (videoPath) => {
      console.log(`video transcodeTo2K`, videoPath)
      return ipcRenderer.invoke('video:transcode-to-2k', videoPath)
    },
    trim: (params) => {
      console.log(`video trim`, params)
      return ipcRenderer.invoke('video:trim', params)
    },
    buildMultiAvatarReference: (params) => {
      console.log(`video buildMultiAvatarReference`, params)
      return ipcRenderer.invoke('video:build-multi-avatar-reference', params)
    },
    extractAudio: (params) => {
      console.log(`video extractAudio`, params)
      return ipcRenderer.invoke('video:extract-audio', params)
    },
    onProgress: (callback) => {
      const handler = (_, ...args) => callback(...args)
      ipcRenderer.on('video:progress', handler)
      return () => ipcRenderer.removeListener('video:progress', handler)
    },
    removeProgressListeners: () => {
      console.log(`video removeProgressListeners`)
      ipcRenderer.removeAllListeners('video:progress')
    }
  },

  // ---- 音频处理 ----
  audio: {
    trim: (inputPath, outputPath, start, duration) => {
      console.log(`audio trim`, inputPath, outputPath, start, duration)
      return ipcRenderer.invoke('audio:trim', { inputPath, outputPath, start, duration })
    },
    convert: (inputPath, outputPath) => {
      console.log(`audio convert`, inputPath, outputPath)
      return ipcRenderer.invoke('audio:convert', { inputPath, outputPath })
    },
    getInfo: (path) => {
      console.log(`audio getInfo`, path)
      return ipcRenderer.invoke('audio:getInfo', path)
    },
    extractAudio: (params) => {
      console.log(`audio extractAudio`, params)
      return ipcRenderer.invoke('audio:extractAudio', params)
    },
    saveUpload: (buffer, opts) => {
      console.log(`audio saveUpload`, buffer, opts)
      return ipcRenderer.invoke('audio:saveUpload', buffer, opts)
    }
  },

  // ---- 封面生成 ----
  cover: {
    generate: (params) => {
      console.log(`cover generate`, params)
      return ipcRenderer.invoke('cover:generate', params)
    },
    extractFrame: (params) => {
      console.log(`cover extractFrame`, params)
      return ipcRenderer.invoke('cover:extract-frame', params)
    },
    save: (data) => {
      console.log(`cover save`, data)
      return ipcRenderer.invoke('cover:save', data)
    },
    saveTempImage: (data) => {
      console.log(`cover saveTempImage`, data)
      return ipcRenderer.invoke('cover:save-temp-image', data)
    }
  },

  // ---- 任务系统 ----
  task: {
    create: (params) => {
      console.log(`task create`, params)
      return ipcRenderer.invoke('task:create', params)
    },
    list: (options) => {
      console.log(`task list`, options)
      return ipcRenderer.invoke('task:list', options)
    },
    detail: (id) => {
      console.log(`task detail`, id)
      return ipcRenderer.invoke('task:detail', id)
    },
    updateStatus: (id, status, progress, result, error) => {
      console.log(`task updateStatus`, id, status, progress, result, error)
      return ipcRenderer.invoke('task:update-status', id, status, progress, result, error)
    },
    updateData: (params) => {
      console.log(`task updateData`, params)
      return ipcRenderer.invoke('task:update-data', params)
    },
    delete: (id) => {
      console.log(`task delete`, id)
      return ipcRenderer.invoke('task:delete', id)
    },
    stats: () => {
      console.log(`task stats`)
      return ipcRenderer.invoke('task:stats')
    },
    startExecutor: () => {
      console.log(`task startExecutor`)
      return ipcRenderer.invoke('task:start-executor')
    },
    stopExecutor: () => {
      console.log(`task stopExecutor`)
      return ipcRenderer.invoke('task:stop-executor')
    },
    executorStatus: () => {
      console.log(`task executorStatus`)
      return ipcRenderer.invoke('task:executor-status')
    },
    onTaskUpdate: (callback) => {
      const handler = (_, data) => {
        console.log(`task onTaskUpdate`, data)
        callback(data)
      }
      ipcRenderer.on('task:update', handler)
      return () => ipcRenderer.removeListener('task:update', handler)
    },
    onTaskProgress: (callback) => {
      const handler = (_, data) => {
        console.log(`task onTaskProgress`, data)
        callback(data)
      }
      ipcRenderer.on('task:progress', handler)
      return () => ipcRenderer.removeListener('task:progress', handler)
    }
  },

  // ---- 云端服务 ----
  cloud: {
    asr: {
      transcribe: (audioUrl, language = 'auto') => {
        console.log(`cloud asr transcribe`, audioUrl, language)
        return ipcRenderer.invoke('cloud:asr', { audioUrl, language })
      }
    },
    voiceClone: {
      textToSpeech: (text, audioUrl) => {
        console.log(`cloud voiceClone textToSpeech`, text, audioUrl)
        return ipcRenderer.invoke('cloud:voice-clone', { text, audioUrl })
      },
      textToSpeechV2: (text, speakerAudioUrl, options = {}) => {
        console.log(`cloud voiceClone textToSpeechV2`, text, speakerAudioUrl, options)
        return ipcRenderer.invoke('cloud:voice-clone-v2', { text, speakerAudioUrl, options })
      }
    },
    digitalHuman: {
      generate: (audioPath, avatarVideoPath, options = {}) => {
        console.log(`cloud digitalHuman generate`, audioPath, avatarVideoPath, options)
        return ipcRenderer.invoke('cloud:digital-human', { audioPath, avatarVideoPath, options })
      }
    },
    checkVersion: () => {
      console.log(`cloud checkVersion`)
      return ipcRenderer.invoke('cloud:check-version')
    },
    getAiConfig: () => {
      console.log(`cloud getAiConfig`)
      return ipcRenderer.invoke('cloud:get-ai-config')
    },
    downloadUpdate: ({ updateUrl }) => {
      console.log(`cloud downloadUpdate`, updateUrl)
      return ipcRenderer.invoke('cloud:download-update', { updateUrl })
    },
    applyUpdate: ({ zipPath }) => {
      console.log(`cloud applyUpdate`, zipPath)
      return ipcRenderer.invoke('cloud:apply-update', { zipPath })
    },
    onProgress: (callback) => {
      console.log(`cloud onProgress`)
      const handler = (_, data) => callback(data)
      ipcRenderer.on('cloud:progress', handler)
      return () => ipcRenderer.removeListener('cloud:progress', handler)
    }
  },

  // ---- OEM ----
  oem: {
    getInfo: () => {
      console.log(`oem getInfo`)
      return ipcRenderer.invoke('oem:get-info')
    },
    getId: () => {
      console.log(`oem getId`)
      return ipcRenderer.invoke('oem:get-id')
    }
  },

  // ---- 通用事件监听 ----
  on: (event, callback) => {
    ipcRenderer.on(event, (_, ...args) => callback(...args))
  },
  off: (event, callback) => {
    ipcRenderer.removeListener(event, callback)
  },

  // ---- 配置管理 ----
  config: {
    getAll: () => {
      console.log(`config getAll`)
      return ipcRenderer.invoke('config:get-all')
    },
    get: (key) => {
      console.log(`config get`, key)
      return ipcRenderer.invoke('config:get', key)
    },
    set: (key, value, category, options) => {
      console.log(`config set`, key, value, category, options)
      return ipcRenderer.invoke('config:set', key, value, category, options)
    },
    setMultiple: (configs) => {
      console.log(`config setMultiple`, configs)
      return ipcRenderer.invoke('config:set-multiple', configs)
    },
    delete: (key) => {
      console.log(`config delete`, key)
      return ipcRenderer.invoke('config:delete', key)
    },
    getCategory: (category) => {
      console.log(`config getCategory`, category)
      return ipcRenderer.invoke('config:get-category', category)
    },
    updateCategory: (category, data) => {
      console.log(`config updateCategory`, category, data)
      return ipcRenderer.invoke('config:update-category', category, data)
    }
  },

  // ---- 大语言模型 ----
  llm: {
    sendMessage: (message, options) => {
      console.log(`llm sendMessage`, message, options)
      return ipcRenderer.invoke('llm:send-message', message, options)
    },
    sendStreamMessage: (message, options) => {
      console.log(`llm sendStreamMessage`, message, options)
      return ipcRenderer.invoke('llm:send-stream-message', message, options)
    },
    sendStreamWithEvents: (requestId, message, options) => {
      console.log(`llm sendStreamWithEvents`, requestId, message, options)
      ipcRenderer.send('llm:start-stream', { requestId, message, options })
    },
    onStreamChunk: (callback) => {
      const handler = (_, data) => {
        console.log('stream-chunk:', data)
        callback(data)
      }
      ipcRenderer.on('llm:stream-chunk', handler)
      return () => ipcRenderer.removeListener('llm:stream-chunk', handler)
    },
    onStreamComplete: (callback) => {
      const handler = (_, data) => {
        console.log('stream-complete:', data)
        callback(data)
      }
      ipcRenderer.on('llm:stream-complete', handler)
      return () => ipcRenderer.removeListener('llm:stream-complete', handler)
    },
    updateConfig: (config) => {
      console.log(`llm updateConfig`, config)
      return ipcRenderer.invoke('llm:update-config', config)
    },
    testConnectionWithConfig: (config) => {
      console.log(`llm testConnectionWithConfig`, config)
      return ipcRenderer.invoke('llm:test-connection-with-config', config)
    },
    legalReview: (content) => {
      console.log(`llm legalReview`, content)
      return ipcRenderer.invoke('llm:legal-review', content)
    },
    sendMessageWithFunctions: (message, functions, options) => {
      console.log(`llm sendMessageWithFunctions`, message, functions, options)
      return ipcRenderer.invoke('llm:send-message-with-functions', message, functions, options)
    }
  },

  // ---- 草稿 ----
  draft: {
    create: (params) => {
      console.log(`draft create`, params)
      return ipcRenderer.invoke('draft:create', params)
    },
    createMixCut: (params) => {
      console.log(`draft createMixCut`, params)
      return ipcRenderer.invoke('draft:create-mixcut', params)
    },
    createWithProgress: (params, onProgress, onComplete) => {
      console.log(`draft createWithProgress`, params, onProgress, onComplete)
      return ipcRenderer.invoke('draft:create-with-progress', params, onProgress, onComplete)
    },
    batchCreate: (params, options) => {
      console.log(`draft batchCreate`, params, options)
      return ipcRenderer.invoke('draft:batch-create', params, options)
    },
    getSupportedRatios: () => {
      console.log(`draft getSupportedRatios`)
      return ipcRenderer.invoke('draft:supported-ratios')
    },
    getSupportedFormats: () => {
      console.log(`draft getSupportedFormats`)
      return ipcRenderer.invoke('draft:supported-formats')
    },
    validate: (params) => {
      console.log(`draft validate`, params)
      return ipcRenderer.invoke('draft:validate', params)
    }
  },

  // ---- 视频解析 ----
  videoParser: {
    parse: (url) => {
      console.log(`videoParser parse`, url)
      return ipcRenderer.invoke('video-parser:parse', url)
    },
    parseAndExtract: (url) => {
      console.log(`videoParser parseAndExtract`, url)
      return ipcRenderer.invoke('video-parser:parse-and-extract', url)
    },
    validateUrl: (url) => {
      console.log(`videoParser validateUrl`, url)
      return ipcRenderer.invoke('video-parser:validate-url', url)
    },
    extractUrl: (url) => {
      console.log(`videoParser extractUrl`, url)
      return ipcRenderer.invoke('video-parser:extract-url', url)
    }
  },

  // ---- 视频合成 ----
  videoComposition: {
    compose: (params) => {
      console.log(`videoComposition compose`, params)
      return ipcRenderer.invoke('video-composition:compose', params)
    },
    generateData: (params) => {
      console.log(`videoComposition generateData`, params)
      return ipcRenderer.invoke('video-composition:generate-data', params)
    },
    searchMaterials: (query, options) => {
      console.log(`vivideoCompositiondeo searchMaterials`, query, options)
      return ipcRenderer.invoke('video-composition:search-materials', query, options)
    },
    searchMusic: (query, options) => {
      console.log(`videoComposition searchMusic`, query, options)
      return ipcRenderer.invoke('video-composition:search-music', query, options)
    },
    getBgmResources: () => {
      console.log(`videoComposition getBgmResources`)
      return ipcRenderer.invoke('video-composition:get-bgm-resources')
    },
    onProgress: (callback) => {
      console.log(`videoComposition onProgress`)
      const handler = (_, data) => callback(data)
      ipcRenderer.on('video-composition:progress', handler)
      return () => ipcRenderer.removeListener('video-composition:progress', handler)
    }
  },

  // ---- 字体 ----
  font: {
    getAvailable: () => {
      console.log(`font getAvailable`)
      return ipcRenderer.invoke('font:get-available')
    }
  },

  // ---- 对象存储 ----
  oss: {
    upload: (localPath, remoteKey) => {
      console.log(`oss upload`, localPath, remoteKey)
      return ipcRenderer.invoke('oss:upload', localPath, remoteKey)
    },
    delete: (remoteKey) => {
      console.log(`oss delete`, remoteKey)
      return ipcRenderer.invoke('oss:delete', remoteKey)
    }
  },

  // ---- 用户 ----
  user: {
    /**
     * 注册用户
     */
    register: (username, email, password) => {
      console.log(`user register`, username, email, password)
      return ipcRenderer.invoke('user:register', { username, email, password })
    },
    /**
     * 登录用户
     */
    login: (email, password) => {
      console.log(`user login`, email, password)
      return Promise.resolve({
        success: true,
        data: {
          signInfo: {
            expiresAt: '2026-08-04T20:11:05.281Z',
            keyId: 'f211de2465a8a04851431fc9',
            secret: '6d9677a4b2e50d276a504e915f106d60beea33998037a04a37b307d950690d6f',
            version: 'v2'
          },
          token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIwOTcyLCJlbWFpbCI6ImRhamlhbWFuQGxpdmUuY29tIiwidG9rZW5WZXJzaW9uIjo3MiwiaWF0IjoxNzg1MjY5NDY1LCJleHAiOjE3ODU4NzQyNjV9.XL_qRebziBWqFhWgZigcgV-vscyg8K_wsxgmvWvSRzY',

          user: {
            api_expires_at: '2026-07-15T13:12:19.000Z',
            created_at: '2026-07-15T13:12:19.000Z',
            email: 'dajiaman@live.com',
            id: 20972,
            is_active: 1,
            is_vip: 1,
            points: 0,
            token_version: 71,
            updated_at: '2026-07-28T20:01:19.000Z',
            username: 'dajiaman',
            vip_expires_at: '2026-07-18T13:12:19.000Z'
          }
        }
      })
      return ipcRenderer.invoke('user:login', { email, password })
    },

    /**
     * 获取用户资料
     */
    getProfile: () => {
      console.log(`user getProfile`)
      return Promise.resolve({
        success: true,
        data: {
          api_expires_at: '2026-07-15T13:12:19.000Z',
          created_at: '2026-07-15T13:12:19.000Z',
          email: 'dajiaman@live.com',
          id: 20972,
          is_active: 1,
          is_vip: 1,
          points: 0,
          token_version: 71,
          updated_at: '2026-07-28T20:01:19.000Z',
          username: 'dajiaman',
          vip_expires_at: '2026-07-18T13:12:19.000Z'
        }
      })
      return ipcRenderer.invoke('user:profile')
    },

    /**
     * 更新用户资料
     */
    updateProfile: (username, email) => {
      console.log(`user updateProfile`, username, email)
      return ipcRenderer.invoke('user:update-profile', { username, email })
    },
    /**
     * 更新用户密码
     * @param {*} currentPassword
     * @param {*} newPassword
     * @returns
     */
    updatePassword: (currentPassword, newPassword) => {
      console.log(`user updatePassword`, currentPassword, newPassword)
      return ipcRenderer.invoke('user:update-password', { currentPassword, newPassword })
    },
    /**
     * 激活
     * @param {*} activationCode 激活码
     * @param {*} token
     * @returns
     */
    activate: (activationCode, token) => {
      console.log(`user activate`, activationCode, token)
      return ipcRenderer.invoke('user:activate', { activationCode, token })
    },
    /**
     * 设置用户 token
     */
    setToken: (token, signInfo = null) => {
      console.log(`user setToken`, token, signInfo)
      return Promise.resolve({
        success: true,
        data: {
          token,
          signInfo: signInfo || {}
        }
      })
      return ipcRenderer.invoke('user:set-token', { token, signInfo })
    },
    /**
     * 通知登录成功
     */
    notifyLoginSuccess: () => {
      console.log(`user notifyLoginSuccess`)
      return ipcRenderer.invoke('user:notify-login-success')
    },
    /**
     * 发送重置密码邮件
     */
    sendResetCode: (email) => {
      console.log(`user sendResetCode`, email)
      return ipcRenderer.invoke('user:send-reset-code', { email })
    },
    /**
     * 重置密码
     */
    resetPassword: (email, oldPassword, newPassword) => {
      console.log(`user resetPassword`, email, oldPassword, newPassword)
      return ipcRenderer.invoke('user:reset-password', { email, oldPassword, newPassword })
    }
  },

  // ---- 窗口控制 ----
  window: {
    minimize: () => {
      return ipcRenderer.invoke('window-minimize')
    },
    maximize: () => {
      return ipcRenderer.invoke('window-maximize')
    },
    unmaximize: () => {
      return ipcRenderer.invoke('window-unmaximize')
    },
    close: () => {
      return ipcRenderer.invoke('window-close')
    }
  },

  // ---- 日志 ----
  logger: {
    debug: (message, ...args) => {
      return ipcRenderer.invoke('logger:debug', message, ...args)
    },
    log: (message, ...args) => {
      return ipcRenderer.invoke('logger:log', message, ...args)
    },
    info: (message, ...args) => {
      return ipcRenderer.invoke('logger:info', message, ...args)
    },
    warn: (message, ...args) => {
      return ipcRenderer.invoke('logger:warn', message, ...args)
    },
    error: (message, ...args) => {
      return ipcRenderer.invoke('logger:error', message, ...args)
    }
  },

  // 系统 shell 相关（用系统默认浏览器打开 URL 等）
  shell: {
    // 用系统默认浏览器打开外部链接
    // 入参：url（http/https/...）
    // 返回：{ success: true } | { success: false, error }
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
  }
}

// ---- 将主进程事件转发到渲染进程（通过 window.dispatchEvent） ----
ipcRenderer.on('dispatchEvent', (_, eventData) => {
  window.dispatchEvent(new CustomEvent('dispatchEvent', { detail: eventData }))
})

ipcRenderer.on('taskProgress', (_, data) => {
  window.dispatchEvent(new CustomEvent('taskProgress', { detail: data }))
})

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
