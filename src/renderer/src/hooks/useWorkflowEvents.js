// composables/useWorkflowEvents.js
import { ref, onMounted, onBeforeUnmount, provide, inject } from 'vue'

/**
 * 工作流事件名称常量
 */
export const WORKFLOW_EVENTS = {
  START: 'workflow:start',
  AUTO_NEXT: 'workflow:auto-next',
  COMPLETE: 'workflow:complete',
  ERROR: 'workflow:error',
  STEP_CHANGE: 'workflow:step-change',
  PROGRESS: 'workflow:progress'
}

/**
 * 工作流事件组合式函数
 * 提供事件监听和触发能力，支持步骤间自动流转
 */
export function useWorkflowEvents() {
  // ---------- 状态 ----------
  const listeners = ref({
    [WORKFLOW_EVENTS.START]: [],
    [WORKFLOW_EVENTS.AUTO_NEXT]: [],
    [WORKFLOW_EVENTS.COMPLETE]: [],
    [WORKFLOW_EVENTS.ERROR]: [],
    [WORKFLOW_EVENTS.STEP_CHANGE]: [],
    [WORKFLOW_EVENTS.PROGRESS]: []
  })

  // ---------- 注册监听器 ----------
  /**
   * 注册工作流启动事件监听
   * @param {Function} callback - 回调函数，接收 detail 参数
   * @returns {Function} 取消监听函数
   */
  function onStart(callback) {
    return registerListener(WORKFLOW_EVENTS.START, callback)
  }

  /**
   * 注册自动下一步事件监听
   * @param {Function} callback - 回调函数，接收 { step, data } 参数
   * @returns {Function} 取消监听函数
   */
  function onAutoNext(callback) {
    return registerListener(WORKFLOW_EVENTS.AUTO_NEXT, callback)
  }

  /**
   * 注册工作流完成事件监听
   * @param {Function} callback - 回调函数，接收 { result } 参数
   * @returns {Function} 取消监听函数
   */
  function onComplete(callback) {
    return registerListener(WORKFLOW_EVENTS.COMPLETE, callback)
  }

  /**
   * 注册工作流错误事件监听
   * @param {Function} callback - 回调函数，接收 { step, error } 参数
   * @returns {Function} 取消监听函数
   */
  function onError(callback) {
    return registerListener(WORKFLOW_EVENTS.ERROR, callback)
  }

  /**
   * 注册步骤变更事件监听
   * @param {Function} callback - 回调函数，接收 { from, to } 参数
   * @returns {Function} 取消监听函数
   */
  function onStepChange(callback) {
    return registerListener(WORKFLOW_EVENTS.STEP_CHANGE, callback)
  }

  /**
   * 注册进度更新事件监听
   * @param {Function} callback - 回调函数，接收 { step, progress, message } 参数
   * @returns {Function} 取消监听函数
   */
  function onProgress(callback) {
    return registerListener(WORKFLOW_EVENTS.PROGRESS, callback)
  }

  // ---------- 内部注册函数 ----------
  function registerListener(eventName, callback) {
    if (typeof callback !== 'function') {
      console.warn(`[useWorkflowEvents] 回调函数无效: ${eventName}`)
      return () => {}
    }

    const eventListeners = listeners.value[eventName]
    if (!eventListeners) {
      console.warn(`[useWorkflowEvents] 未知事件: ${eventName}`)
      return () => {}
    }

    eventListeners.push(callback)

    // 返回取消监听函数
    return () => {
      const index = eventListeners.indexOf(callback)
      if (index !== -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  // ---------- 触发事件 ----------
  /**
   * 触发工作流启动事件
   * @param {Object} detail - 启动参数 { step, data }
   */
  function emitStart(detail = {}) {
    emitEvent(WORKFLOW_EVENTS.START, detail)
  }

  /**
   * 触发自动下一步事件
   * @param {Object} detail - 下一步参数 { step, data, from }
   */
  function emitAutoNext(detail = {}) {
    emitEvent(WORKFLOW_EVENTS.AUTO_NEXT, detail)
  }

  /**
   * 触发工作流完成事件
   * @param {Object} detail - 完成参数 { result, steps }
   */
  function emitComplete(detail = {}) {
    emitEvent(WORKFLOW_EVENTS.COMPLETE, detail)
  }

  /**
   * 触发工作流错误事件
   * @param {Object} detail - 错误参数 { step, error, message }
   */
  function emitError(detail = {}) {
    emitEvent(WORKFLOW_EVENTS.ERROR, detail)
  }

  /**
   * 触进步骤变更事件
   * @param {Object} detail - 变更参数 { from, to, data }
   */
  function emitStepChange(detail = {}) {
    emitEvent(WORKFLOW_EVENTS.STEP_CHANGE, detail)
  }

  /**
   * 触发进度更新事件
   * @param {Object} detail - 进度参数 { step, progress, message }
   */
  function emitProgress(detail = {}) {
    emitEvent(WORKFLOW_EVENTS.PROGRESS, detail)
  }

  // ---------- 内部触发函数 ----------
  function emitEvent(eventName, detail) {
    const eventListeners = listeners.value[eventName]
    if (!eventListeners || eventListeners.length === 0) return

    // 异步执行所有监听器，避免阻塞主线程
    for (const callback of eventListeners) {
      try {
        callback(detail)
      } catch (err) {
        console.error(`[useWorkflowEvents] 事件处理异常 (${eventName}):`, err)
      }
    }
  }

  // ---------- 清除所有监听器 ----------
  function clearAllListeners() {
    for (const key of Object.keys(listeners.value)) {
      listeners.value[key] = []
    }
  }

  // ---------- 自动清理 ----------
  let cleanupFunctions = []

  /**
   * 在组件挂载时自动设置事件监听
   * 自动从 window 对象获取事件并转发
   */
  function setupAutoListeners() {
    // 监听 window 上的自定义事件
    const handlers = {
      [WORKFLOW_EVENTS.START]: (e) => emitStart(e.detail),
      [WORKFLOW_EVENTS.AUTO_NEXT]: (e) => emitAutoNext(e.detail),
      [WORKFLOW_EVENTS.COMPLETE]: (e) => emitComplete(e.detail),
      [WORKFLOW_EVENTS.ERROR]: (e) => emitError(e.detail),
      [WORKFLOW_EVENTS.STEP_CHANGE]: (e) => emitStepChange(e.detail),
      [WORKFLOW_EVENTS.PROGRESS]: (e) => emitProgress(e.detail)
    }

    for (const [eventName, handler] of Object.entries(handlers)) {
      window.addEventListener(eventName, handler)
      cleanupFunctions.push(() => {
        window.removeEventListener(eventName, handler)
      })
    }

    // 返回清理函数
    return () => {
      for (const cleanup of cleanupFunctions) {
        cleanup()
      }
      cleanupFunctions = []
    }
  }

  // ---------- 生命周期集成 ----------
  // 在组件挂载时自动设置监听
  onMounted(() => {
    const cleanup = setupAutoListeners()
    // 将清理函数存储以便在卸载时执行
    const unregister = () => {
      cleanup()
    }
    // 添加到清理列表
    cleanupFunctions.push(unregister)
  })

  onBeforeUnmount(() => {
    // 执行所有清理
    for (const cleanup of cleanupFunctions) {
      cleanup()
    }
    cleanupFunctions = []
    clearAllListeners()
  })

  // ---------- 暴露 ----------
  return {
    // 监听注册
    onStart,
    onAutoNext,
    onComplete,
    onError,
    onStepChange,
    onProgress,

    // 事件触发
    emitStart,
    emitAutoNext,
    emitComplete,
    emitError,
    emitStepChange,
    emitProgress,

    // 工具
    clearAllListeners,
    setupAutoListeners,

    // 事件常量
    EVENTS: WORKFLOW_EVENTS
  }
}

// ============================================================
// 提供/注入模式（用于跨组件共享）
// ============================================================

/**
 * 提供工作流事件实例给子组件
 * @param {Object} options - 可选配置
 */
export function provideWorkflowEvents(options = {}) {
  const events = useWorkflowEvents()
  provide('workflowEvents', events)
  return events
}

/**
 * 在子组件中注入工作流事件实例
 * @returns {Object} 工作流事件实例
 */
export function injectWorkflowEvents() {
  const events = inject('workflowEvents')
  if (!events) {
    console.warn(
      '[useWorkflowEvents] 未找到提供的工作流事件，请确保父组件调用了 provideWorkflowEvents'
    )
    // 返回一个降级版本，避免崩溃
    return {
      onStart: () => () => {},
      onAutoNext: () => () => {},
      onComplete: () => () => {},
      onError: () => () => {},
      onStepChange: () => () => {},
      onProgress: () => () => {},
      emitStart: () => {},
      emitAutoNext: () => {},
      emitComplete: () => {},
      emitError: () => {},
      emitStepChange: () => {},
      emitProgress: () => {},
      EVENTS: WORKFLOW_EVENTS
    }
  }
  return events
}

// ============================================================
// 快捷工具：在工作流步骤中触发事件
// ============================================================

/**
 * 创建步骤事件触发器
 * 用于在组件中方便地触发步骤相关事件
 * @param {string} stepName - 当前步骤名称
 * @param {Object} events - 工作流事件实例
 * @returns {Object} 步骤事件触发器
 */
export function createStepEvents(stepName, events) {
  const { emitStart, emitAutoNext, emitComplete, emitError, emitProgress } = events

  return {
    /**
     * 标记步骤开始
     * @param {Object} data - 步骤数据
     */
    start(data = {}) {
      emitStart({ step: stepName, data })
    },

    /**
     * 触发自动下一步
     * @param {Object} data - 传递给下一步的数据
     */
    next(data = {}) {
      emitAutoNext({ step: stepName, data, from: stepName })
    },

    /**
     * 标记步骤完成
     * @param {Object} result - 步骤结果
     */
    complete(result = {}) {
      emitComplete({ step: stepName, result })
      // 自动触发下一步
      emitAutoNext({ step: stepName, data: result, from: stepName })
    },

    /**
     * 标记步骤错误
     * @param {Error|string} error - 错误对象或消息
     */
    error(error) {
      const message = error instanceof Error ? error.message : String(error)
      emitError({ step: stepName, error, message })
    },

    /**
     * 更新进度
     * @param {number} progress - 进度值 (0-100)
     * @param {string} message - 进度消息
     */
    progress(progress, message = '') {
      emitProgress({ step: stepName, progress, message })
    }
  }
}

/**
 * 自动监听工作流事件并执行回调
 * @param {Object} handlers - 事件处理函数映射
 * @returns {Function} 清理函数
 */
export function useWorkflowEventHandlers(handlers = {}) {
  const events = injectWorkflowEvents()
  const cleanups = []

  const handlerMap = {
    start: events.onStart,
    autoNext: events.onAutoNext,
    complete: events.onComplete,
    error: events.onError,
    stepChange: events.onStepChange,
    progress: events.onProgress
  }

  for (const [key, handler] of Object.entries(handlers)) {
    if (typeof handler === 'function' && handlerMap[key]) {
      const cleanup = handlerMap[key](handler)
      cleanups.push(cleanup)
    }
  }

  // 返回清理函数
  return () => {
    for (const cleanup of cleanups) {
      cleanup()
    }
  }
}
