import { defineStore } from 'pinia'

const STEP_KEYS = [
  'extract',
  'rewrite',
  'voiceClone',
  'digitalHuman',
  'titleCover',
  'videoEdit',
  'publish'
]

/**
 * 获取默认 viralStudioConfig
 * @returns
 */
export function getDefaultViralStudioConfig() {
  return {
    source: {
      videoPath: '',
      videoFramePath: '',
      voiceVolume: 1,
      bgmVolume: 0.3,
      playbackRate: 1,
      silenceRemoval: { enabled: false, threshold: -30, minDuration: 0.4 }
    },
    subtitle: {
      enabled: true,
      highlightKeywords: false,
      mode: 'template',
      presetId: 'yellow_white_split',
      templateId: null,
      offsetY: 0,
      customConfig: {
        fontFamily: '微软雅黑',
        fontSize: 48,
        fontStyles: ['bold'],
        color: '#FFFFFF',
        opacity: 1,
        letterSpacing: 0,
        enableStroke: true,
        strokeWidth: 0,
        strokeColor: '#000000',
        enableShadow: false,
        shadowDistance: 0,
        shadowColor: '#000000',
        shadowOpacity: 0,
        backgroundType: 'none',
        backgroundColor: '#000000',
        backgroundOpacity: 0.7,
        lineHeight: 1.2,
        positionX: 540,
        positionY: 1500,
        animations: []
      }
    },
    title: {
      enabled: false,
      text: { h1: '', h2: '' },
      ai: {
        manualEdited: false,
        autoAttempted: false,
        generatedAt: '',
        source: '',
        status: 'idle'
      },
      displayMode: 'always',
      duration: 3,
      mode: 'template',
      presetId: 'title_yellow_ximai_stroke',
      style: {
        fontFamily: '微软雅黑',
        fontSize: 56,
        fontStyles: ['bold'],
        color: '#FFFFFF',
        opacity: 1,
        letterSpacing: 0,
        fontWeight: 'bold',
        position: 'topCenter',
        offsetX: 0,
        offsetY: 120,
        enableStroke: true,
        strokeWidth: 2,
        strokeColor: '#000000',
        enableShadow: false,
        shadowDistance: 3,
        shadowColor: '#000000',
        shadowOpacity: 0.45,
        enableBackground: false,
        backgroundType: 'none',
        backgroundColor: '#000000',
        backgroundOpacity: 0.38
      }
    },
    namecard: {
      enabled: false,
      avatar: '',
      name: '',
      subtitle: '',
      social: { wechat: '', xhs: '', dy: '' },
      displayMode: 'duration',
      duration: 5,
      presetId: 'personal_card_simple',
      style: {
        layout: 'horizontal',
        position: 'bottomLeft',
        offsetX: 64,
        offsetY: 96,
        fontFamily: '微软雅黑',
        fontSize: 28,
        textColor: '#FFFFFF',
        opacity: 1,
        letterSpacing: 0,
        lineSpacing: 2,
        nameBold: true,
        backgroundColor: '#000000',
        backgroundOpacity: 0.52,
        backgroundPaddingX: 18,
        backgroundPaddingY: 12,
        backgroundRadius: 0
      }
    },
    soundEffect: { enabled: false },
    bgm: {
      enabled: false,
      source: 'system',
      path: '',
      autoMatch: true
    },
    mixcut: {
      enabled: false,
      categoryId: ''
    }
  }
}

/**
 * useWorkflowStore - 工作流状态管理
 *
 */
export const useWorkflowStore = defineStore('workflow', {
  state: () => ({
    // 运行模式：'manual' | 'auto' | 'background'
    executionMode: 'manual',
    currentStep: 1,
    steps: {
      // 提取视频信息
      extract: {
        status: 'pending',
        data: null,
        error: null
      },
      // 重写文案
      rewrite: {
        status: 'pending',
        data: null,
        error: null
      },
      // 语音克隆
      voiceClone: {
        status: 'pending',
        data: null,
        error: null
      },
      digitalHuman: {
        status: 'pending',
        data: null,
        error: null
      },
      videoEdit: {
        status: 'pending',
        data: null,
        error: null
      },
      titleCover: {
        status: 'pending',
        data: null,
        error: null
      },
      publish: {
        status: 'pending',
        data: null,
        error: null
      }
    },
    pipeline: {
      videoLink: '', // 视频链接
      benchmarkDraft: null, // 基准草稿

      originalContent: '', // 原始内容
      rewrittenContent: '', // 重写后的内容
      voiceRewriteSourceContent: '',
      selectedTemplateId: null, // 选中的模板ID

      selectedVoiceId: null, // 选中的语音ID
      voiceModelVersion: 'v1', // 语音模型版本
      voiceTargetLanguage: 'zh', // 目标语言
      voiceSpeed: 1.0, // 语音速度
      voicePitch: 0.0, // 语音音调

      emotions: {}, // 情感配置
      emotionWeight: 0, // 情感权重
      selectedEmotionType: null, // 选中的情感类型

      emotionValue: 0, // 情感值

      clonedAudioPath: '', // 克隆音频路径
      clonedAudioName: '', // 克隆音频名称
      clonedAudioSize: 0, // 克隆音频大小
      clonedAudioUrl: '', // 克隆音频URL

      drivingAudio: '',
      drivingAudioIsManual: false,

      selectedAvatar: null, // 选中的数字人
      digitalHumanMode: 'single', // 数字人模式
      digitalHumanScenes: [], // 数字人场景
      multiAvatarReferenceVideoPath: '', // 多数字人参考视频路径

      generatedVideoPath: '', // 生成视频路径，数字人生成
      generatedVideoUrl: '', // 生成视频URL

      sourceVideoPath: '', // 源视频路径
      videoEditTemplateId: null, // 视频编辑模板ID
      subtitleConfig: null, // 字幕配置
      selectedMaterialCategory: null, // 选中的素材分类
      backgroundMusicPath: '', // 背景音乐路径
      autoBgm: false, // 自动背景音乐

      exportToDraft: false, // 导出为草稿

      previewVideoPath: '', // 预览视频路径, 剪辑生成的
      enableSubtitle: true, // 启用字幕
      bgmVolume: 0.3,
      voiceVolume: 1, // 语音音量
      enableAiProofread: false, // 启用AI校对
      enableSilenceRemoval: false, // 启用静音移除
      silenceThreshold: -30, // 静音阈值
      silenceDuration: 0.4, // 静音持续时间

      viralStudioConfig: null, // 剪辑配置
      compositionData: null, // 组合数据

      publishVideoPath: '', // 发布视频路径
      publishTitle: '', // 发布标题
      coverTitleMain: '', // 封面标题主
      coverTitleSub: '', // 封面标题副
      publishDescription: '', // 发布描述
      publishTags: [], // 发布标签

      coverPath: '', // 封面路径
      coverUrl: '', // 封面URL
      coverDesignerConfig: null, // 封面设计师配置

      selectedAccounts: [], // 选中的账号
      publishMode: 'draft', // 发布模式

      autoCloseBrowser: false, // 自动关闭浏览器

      taskId: null, // 任务ID
      status: 'idle', // 任务状态
      progress: 0, // 任务进度
      error: null // 错误信息
    },

    autoConfig: {
      skipConfirm: false, // 跳过确认弹窗
      autoNextDelay: 1000, // 自动切换到下一个步骤的延迟时间
      stopOnError: true, // 发生错误时停止执行
      notifyOnComplete: true // 完成时通知
    },

    // 当前后台任务信息
    currentTask: {
      id: null,
      status: null,
      progress: 0
    },

    _isRestoring: false,
    _isStartingNewTask: false,
    _autoSaveTimer: null
  }),
  getters: {
    /**
     * 计算整体进度（已完成步骤占比）
     */
    progress: (state) => {
      const completedCount = Object.values(state.steps).filter((s) => s.status === 'success').length
      return Math.floor((completedCount / 7) * 100)
    },

    /**
     * 判断当前步骤是否可以继续（状态为 success）
     */
    canProceedNext: (state) => {
      const currentKey = STEP_KEYS[state.currentStep - 1]
      return state.steps[currentKey]?.status === 'success'
    },

    /**
     * 当前步骤的名称（key）
     */
    currentStepName: (state) => {
      return STEP_KEYS[state.currentStep - 1]
    },
    /**
     * 是否所有步骤都已完成
     */
    isAllComplete: (state) => {
      return Object.values(state.steps).every((s) => s.status === 'success')
    },

    /**
     * 是否为后台运行模式
     */
    isBackgroundMode: (state) => {
      return state.executionMode === 'background'
    }
  },
  actions: {
    /**
     * 设置执行模式
     * @param {string} mode - 'manual' | 'auto' | 'background'
     */
    setExecutionMode(mode) {
      if (['manual', 'auto', 'background'].includes(mode)) {
        this.executionMode = mode
        console.log(`🔄 执行模式切换为: ${mode}`)
      }
    },

    /**
     * 设置当前任务信息
     * @param {Object} taskInfo - { id, status, progress }
     */
    setCurrentTask(taskInfo) {
      this.currentTask = {
        id: taskInfo.id || null,
        status: taskInfo.status || null,
        progress: taskInfo.progress || 0
      }
    },

    /**
     * 更新某个步骤的状态
     * @param {string} stepKey - 步骤名称
     * @param {string} status - 'pending' | 'processing' | 'success' | 'failed'
     * @param {*} data - 步骤产生的数据
     * @param {*} error - 错误信息
     */
    updateStepStatus(stepKey, status, data = null, error = '') {
      if (!this.steps[stepKey]) return
      this.steps[stepKey] = { status, data, error }
      console.log(`📊 步骤 ${stepKey} 状态更新：${status} 数据：`, data, `error: ${error}`)

      // 触发自动下一步
      if (status === 'success' && this.executionMode === 'auto' && stepKey !== 'rewrite') {
        this.triggerNextStep()
      }

      // 保存任务状态（非恢复模式下）
      if (!this._isRestoring) {
        this.saveTaskState({ stepName: stepKey, status, data, error })
      }
    },

    /**
     * 保存任务状态到后端
     * @param {Object|null} stepInfo - 当前步骤信息
     */
    async saveTaskState(stepInfo = null) {
      if (this._isRestoring) return
      try {
        const pipelineData = await this.preprocessPipelineData(this.deepClone(this.pipeline))
        const settingsData = this.deepClone({
          executionMode: this.executionMode,
          autoConfig: this.autoConfig
        })
        const currentStep = this.currentStep
        const progress = this.progress

        if (this.currentTask.id) {
          // 更新已有任务
          const title = this.generateTaskTitle()
          const updateData = {
            taskId: this.currentTask.id,
            ...(title && title !== '未命名任务' ? { title } : {}),
            pipelineData: pipelineData,
            settingsData: settingsData,
            currentStep: currentStep,
            progress: progress,
            status: 'processing'
          }

          // 如果有步骤信息，更新步骤状态
          if (stepInfo) {
            updateData.stepUpdate = {
              name: stepInfo.stepName,
              status: stepInfo.status,
              data: this.deepClone(stepInfo.data),
              error: this.deepClone(stepInfo.error)
            }
          }

          console.log('task updateData:', updateData)
          await window.api.task.updateData(updateData)
          console.log(' 💾 任务自动保存(更新)成功')
        } else {
          // 创建新任务
          const stepStatuses = {}
          Object.keys(this.steps).forEach((key) => {
            stepStatuses[key] = {
              status: this.steps[key].status,
              data: this.deepClone(this.steps[key].data)
            }
          })

          const taskData = {
            id: null,
            title: this.generateTaskTitle(),
            mode: this.executionMode,
            pipeline_data: pipelineData,
            settings_data: settingsData,
            current_step: currentStep,
            progress: progress,
            steps: stepStatuses,
            status: 'processing'
          }

          // 先创建
          const result = await window.api.task.create(taskData)
          if (result.success) {
            this.setCurrentTask({
              id: result.data.id,
              status: 'processing',
              progress: progress
            })
            console.log('✓ 创建任务成功 ID:', result.data.id)
          }
        }
      } catch (error) {
        console.error('保存任务状态失败:', error)
      }
    },

    /**
     * 恢复任务
     * @param {Object} taskData - 任务数据
     * @param {Array} stepsData - 步骤数据
     * @param {Object} options - 选项 { forceRedo }
     */
    restoreTask(taskData, stepsData, options = {}) {
      this._isRestoring = true
      clearTimeout(this._autoSaveTimer)
      this.resetWorkflow()

      // 恢复管道数据
      if (taskData.pipeline_data) {
        this.pipeline = this.deepClone(taskData.pipeline_data)
      }

      // 恢复设置
      if (taskData.settings_data && taskData.settings_data.autoConfig) {
        this.autoConfig = taskData.settings_data.autoConfig
      }

      // 恢复步骤状态
      if (stepsData && Array.isArray(stepsData)) {
        stepsData.forEach((step) => {
          if (this.steps[step.step_name]) {
            this.steps[step.step_name] = {
              status: step.status,
              data: step.data,
              error: step.error ? JSON.parse(step.error) : null
            }
          }
        })
      }

      // 恢复当前步骤
      this.currentStep = taskData.current_step || 1

      // 恢复执行模式
      const validModes = ['manual', 'auto']
      this.executionMode = validModes.includes(taskData.mode) ? taskData.mode : 'manual'

      // 判断是否需要重做（已完成或失败的任务）
      const forceRedo =
        Boolean(options.forceRedo) ||
        taskData.status === 'completed' ||
        taskData.status === 'failed'

      this.setCurrentTask({
        id: forceRedo ? null : taskData.id,
        status: forceRedo ? null : taskData.status,
        progress: forceRedo ? 0 : taskData.progress
      })

      console.log('🔄 任务' + (forceRedo ? '重做' : '继续') + '恢复:', taskData.title)
      setTimeout(() => {
        this._isRestoring = false
      }, 1500)
    },

    /**
     * 更新管道数据（合并更新）
     * @param {Object} payload - 要合并的数据
     */
    updatePipeline(payload) {
      const hasSourceChanged =
        Object.prototype.hasOwnProperty.call(payload, 'sourceVideoPath') &&
        payload.sourceVideoPath !== this.pipeline.sourceVideoPath

      // 合并数据
      Object.assign(this.pipeline, payload)

      // 如果视频源变了，清空相关的合成数据
      if (hasSourceChanged) {
        Object.assign(this.pipeline, {
          compositionData: null,
          previewVideoPath: '',
          publishVideoPath: '',
          selectedMaterialCategory: ''
        })
      }

      console.log('executionMode:', this.executionMode)
      // 自动保存（非后台模式、有任务ID、非恢复状态）
      if (this.executionMode !== 'background' && this.currentTask?.id && !this._isRestoring) {
        clearTimeout(this._autoSaveTimer)

        this._autoSaveTimer = setTimeout(() => {
          this.saveTaskState(null)
        }, 600)
      }
    },

    /**
     * 触发下一个步骤
     */
    triggerNextStep() {
      if (this.currentStep < 7 && this.canProceedNext) {
        setTimeout(() => {
          this.currentStep++
          console.log(`⏩ 自动进入下一步，当前步骤: ${this.currentStep}, 管道数据:`, this.pipeline)
          window.dispatchEvent(
            new CustomEvent('workflow:auto-next', {
              detail: { step: this.currentStepName }
            })
          )
        }, this.autoConfig.autoNextDelay)
      } else if (this.currentStep === 7 && this.canProceedNext) {
        console.log('🎉 所有步骤已完成！')
        if (this.autoConfig.notifyOnComplete) {
          window.dispatchEvent(new CustomEvent('workflow:complete'))
        }
      }
    },

    /**
     * 切换到指定步骤
     * @param {number} index - 步骤索引（1-7）
     */
    setCurrentStep(index) {
      if (index >= 1 && index <= 7) {
        this.currentStep = index
        console.log(`📍 切换到步骤 ${index}`)
      }
    },

    /**
     * 启动自动工作流
     * @param {string} videoLink - 视频链接
     */
    async startAutoWorkflow(videoLink) {
      this.resetWorkflow()
      this.updatePipeline({ videoLink })
      this.currentStep = 1
      window.dispatchEvent(
        new CustomEvent('workflow:start', {
          detail: { videoLink }
        })
      )
    },

    /**
     * 重置工作流（清空所有步骤状态，保留 pipeline 结构）
     */
    resetWorkflow() {
      Object.keys(this.steps).forEach((key) => {
        this.steps[key] = { status: 'pending', data: null, error: null }
      })
      this.currentStep = 1
      // 重置 pipeline 为初始状态（但保留结构）
      this.pipeline = {
        ...this.pipeline,
        videoLink: '',
        benchmarkDraft: null,
        originalContent: '',
        selectedTemplateId: null,
        rewrittenContent: '',
        voiceRewriteSourceContent: '',
        selectedVoiceId: null,
        voiceModelVersion: 'v1',
        voiceTargetLanguage: 'zh',
        voiceTranslationPreview: '',
        voiceSpeed: 1,
        voicePitch: 1,
        clonedAudioPath: '',
        clonedAudioName: '',
        clonedAudioSize: '',
        clonedAudioUrl: '',
        selectedAvatar: null,
        digitalHumanMode: 'single',
        digitalHumanScenes: [],
        multiAvatarReferenceVideoPath: '',
        drivingAudio: '',
        generatedVideoPath: '',
        generatedVideoUrl: '',
        publishTitle: '',
        coverTitleMain: '',
        coverTitleSub: '',
        publishDescription: '',
        publishTags: [],
        coverPath: '',
        coverDesignerConfig: null,
        sourceVideoPath: '',
        videoEditTemplateId: null,
        subtitleConfig: null,
        selectedMaterialCategory: '',
        backgroundMusicPath: '',
        autoBgm: true,
        exportToDraft: true,
        previewVideoPath: '',
        enableSubtitle: false,
        compositionData: null,
        bgmVolume: 0.3,
        voiceVolume: 1,
        enableAiProofread: true,
        enableSilenceRemoval: true,
        silenceThreshold: -30,
        silenceDuration: 0.4,
        viralStudioConfig: getDefaultViralStudioConfig(),
        publishVideoPath: '',
        selectedAccounts: [],
        publishMode: 'draft'
      }
    },

    /**
     * 暂停自动工作流（切回手动模式）
     */
    pauseAutoWorkflow() {
      this.setExecutionMode('manual')
    },

    /**
     * 恢复自动工作流
     */
    resumeAutoWorkflow() {
      this.setExecutionMode('auto')
      if (this.canProceedNext) {
        this.triggerNextStep()
      }
    },

    /**
     * 跳过当前步骤
     */
    skipCurrentStep() {
      const stepName = this.currentStepName
      this.updateStepStatus(stepName, 'success', { skipped: true })
      if (this.executionMode === 'auto') {
        this.triggerNextStep()
      }
    },

    /**
     * 深拷贝工具
     * @param {*} obj - 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    deepClone(obj) {
      try {
        return JSON.parse(JSON.stringify(obj))
      } catch {
        if (Array.isArray(obj)) return [...obj]
        if (obj && typeof obj === 'object') return { ...obj }
        return obj
      }
    },

    /**
     * 预处理管道数据（补充关联的完整对象信息）
     * @param {Object} pipelineData - 管道数据
     * @returns {Object} 预处理后的管道数据
     */
    async preprocessPipelineData(pipelineData) {
      try {
        // 补充声音模型的完整信息
        if (pipelineData.selectedVoiceId) {
          const result = await window.api.db.find('voice', pipelineData.selectedVoiceId)
          if (result.success && result.data) {
            pipelineData.voiceInfo = {
              id: result.data.id,
              name: result.data.name,
              description: result.data.description,
              prompt_text:
                result.data.prompt_text || result.data.description || result.data.name || '',
              audio_path: result.data.audio_path,
              audio_url: result.data.audio_url
            }
          } else {
            console.warn('⚠️ 未找到声音模型:', pipelineData.selectedVoiceId)
          }
        }

        // 补充数字人模型的完整信息
        if (pipelineData.selectedAvatar) {
          const result = await window.api.db.find('digitalHuman', pipelineData.selectedAvatar)
          if (result.success && result.data) {
            pipelineData.avatarInfo = {
              id: result.data.id,
              name: result.data.name,
              description: result.data.description,
              video_path: result.data.video_path,
              thumbnail_path: result.data.thumbnail_path,
              video_url: result.data.video_url
            }
          } else {
            console.warn('⚠️ 未找到数字人模型:', pipelineData.selectedAvatar)
          }
        }

        return pipelineData
      } catch (error) {
        console.error('❌ 预处理管道数据失败:', error)
        return pipelineData
      }
    },

    /**
     * 创建后台任务
     * @returns {Object} 创建的任务数据
     */
    async createBackgroundTask() {
      try {
        const title = this.generateTaskTitle()
        const pipelineData = await this.preprocessPipelineData(this.deepClone(this.pipeline))
        const taskData = {
          title: title,
          mode: this.executionMode,
          pipeline_data: pipelineData,
          settings_data: this.deepClone({
            executionMode: this.executionMode,
            autoConfig: this.autoConfig
          }),
          current_step: 3,
          progress: 40
        }

        const result = await window.api.task.create(taskData)
        if (result.success) {
          this.setCurrentTask({
            id: result.data.id,
            status: 'pending',
            progress: 40
          })
          return result.data
        }
        throw new Error(result.error)
      } catch (error) {
        console.error('❌ 创建后台任务失败:', error)
        throw error
      }
    },

    /**
     * 生成任务标题
     * @returns {string} 任务标题
     */
    generateTaskTitle() {
      const content = (this.pipeline.rewrittenContent || this.pipeline.videoLink || '').trim()
      const original = (this.pipeline.originalContent || '').trim()
      const title = content || original || '未命名任务'
      return title.replace(/\s+/g, ' ').slice(0, 24) || '未命名任务'
    },

    /**
     * 启动任务执行器
     * @returns {Object} 执行结果
     */
    async startTaskExecutor() {
      try {
        const result = await window.api.task.start()
        if (result.success) {
          console.log('✓ 任务执行器启动成功')
        } else {
          console.error('启动任务执行器失败:', result.error)
        }
        return result
      } catch (error) {
        console.error('❌ 启动任务执行器异常:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * 设置任务事件监听器
     */
    setupTaskEventListeners() {
      // 监听任务状态更新
      window.api.task.onTaskUpdate((payload) => {
        if (this.currentTask.id === payload.taskId) {
          this.setCurrentTask({
            id: payload.taskId,
            status: payload.status,
            progress: payload.progress || this.currentTask.progress
          })

          if (payload.status === 'completed') {
            window.dispatchEvent(
              new CustomEvent('task:completed', {
                detail: { taskId: payload.taskId }
              })
            )
          } else if (payload.status === 'failed') {
            window.dispatchEvent(
              new CustomEvent('task:failed', {
                detail: {
                  taskId: payload.taskId,
                  error: payload.error
                }
              })
            )
          }
        }
      })

      // 监听进度更新
      window.api.task.onProgressUpdate((payload) => {
        if (this.currentTask.id === payload.taskId) {
          this.setCurrentTask({
            ...this.currentTask,
            progress: payload.progress
          })
        }
      })
    }
  }
})
