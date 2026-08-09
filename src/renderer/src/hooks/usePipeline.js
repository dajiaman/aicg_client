import { computed } from 'vue'
import { message } from 'ant-design-vue'
import { useWorkflowStore } from '../store/workflow'

// 步骤键（key）到依赖步骤的映射表
const STEP_DEPENDENCIES = {
  digitalHuman: 'voiceClone',
  extract: null,
  publish: 'titleCover',
  rewrite: 'extract',
  titleCover: 'videoEdit',
  videoEdit: 'digitalHuman',
  voiceClone: 'rewrite'
}

// 步骤名称映射表
const STEPS_LABEL = {
  digitalHuman: '数字人生成',
  extract: '提取文案',
  publish: '视频发布',
  rewrite: '改写文案',
  titleCover: '标题封面',
  videoEdit: '视频剪辑',
  voiceClone: '声音克隆'
}

/**
 * usePipeline - 工作流核心组合式函数
 *
 */
export function usePipeline() {
  const store = useWorkflowStore()

  // 自动模式
  const autoMode = computed(() => store.executionMode === 'auto')

  const currentStep = computed(() => {
    return store.currentStep
  })

  const pipeline = computed(() => store.pipeline)

  // 进度
  const progress = computed(() => {
    return store.progress
  })

  const steps = computed(() => store.steps)

  /**
   * 检查某个步骤是否可以执行（依赖数据是否齐全）
   * 对应原始 _0x2a9023
   */
  const canExecuteStep = (stepKey) => {
    const depKey = getDependency(stepKey)
    if (!depKey) return true
    return store.steps[depKey]?.status === 'success'
  }

  /**
   * 更新工作流数据（对应原始 _0xe41808）
   */
  const updatePipelineData = (data) => {
    store.updatePipeline(data)
  }

  /**
   * 获取下一个步骤键（对应原始 _0x2a9023）
   */
  const getNextStep = (stepKey) => {
    const keys = Object.keys(STEP_DEPENDENCIES)
    const idx = keys.indexOf(stepKey)
    return idx >= 0 && idx < keys.length - 1 ? keys[idx + 1] : null
  }

  /**
   * 切换自动模式（对应原始 _0x2140f1）
   */
  const toggleAutoMode = () => {
    const newMode = store.executionMode === 'manual' ? 'auto' : 'manual'
    store.setExecutionMode(newMode)
    message.info(newMode === 'auto' ? '已开启自动模式' : '已关闭自动模式')
  }

  /**
   * 启动自动工作流（对应原始 _0x521872）
   */
  const startAutoWorkflow = (videoLink) => {
    try {
      store.resetWorkflow()
      store.updatePipeline({ videoLink })
      store.setExecutionMode('auto')
      store.setCurrentStep(1)
      window.dispatchEvent(
        new CustomEvent('workflow:start', {
          detail: {
            videoLink: videoLink
          }
        })
      )
      message.success('自动工作流已启动')
    } catch (error) {
      console.error('startAutoWorkflow failed', error)
      message.error('自动工作流启动失败')
      return
    }
  }

  /**
   * 通知步骤开始（对应原始 _0x2a9023）
   * @param {*} stepKey
   */
  const notifyStepStart = (stepKey) => {
    console.log('notifyStepStart', stepKey)
    store.updateStepStatus(stepKey, 'processing')
    message.loading({
      content: `正在执行：${STEPS_LABEL[stepKey]}...`,
      key: `step-${stepKey}`,
      duration: 0
    })
  }

  /**
   * 通知步骤完成（对应原始 _0x521872）
   */
  const notifyStepComplete = (stepKey, result) => {
    // 记录完成状态
    store.updateStepStatus(stepKey, 'success', result)
    message.success({
      content: `${STEPS_LABEL[stepKey]} 完成！`,
      key: `step-${stepKey}`,
      duration: 2
    })
  }

  /**
   * 通知步骤出错（对应原始 _0x521872）
   */
  const notifyStepError = (stepKey, error) => {
    store.updateStepStatus(stepKey, 'error', null, error)
    message.error({
      content: `${STEPS_LABEL[stepKey]} 失败：${error.message}`,
      key: `step-${stepKey}`,
      duration: 5
    })

    if (store.autoConfig.enabled) {
      store.pauseAutoWorkflow()
    }
  }

  /**
   * ----- 重置工作流 -----
   */
  const resetWorkflow = () => {
    store.resetWorkflow()
    message.warning('工作流已重置')
  }

  /**
   * 获取某个步骤的依赖项
   * 对应原始 _0x2a9023
   */
  const getDependency = (stepKey) => {
    return STEP_DEPENDENCIES[stepKey] || []
  }

  // 返回所有公开 API
  return {
    autoMode,
    currentStep,
    progress,

    // 状态（响应式）
    pipeline: pipeline.value,
    steps: steps.value,

    canExecuteStep,
    getNextStep,
    getDependency,

    // 步骤事件
    notifyStepStart,
    notifyStepComplete,
    notifyStepError,
    updatePipelineData,
    startAutoWorkflow,

    // 重置
    resetWorkflow,
    toggleAutoMode,
    setCurrentStep: store.setCurrentStep,
    pauseAutoWorkflow: store.pauseAutoWorkflow,
    resumeAutoWorkflow: store.resumeAutoWorkflow,
    skipCurrentStep: store.skipCurrentStep
  }
}
