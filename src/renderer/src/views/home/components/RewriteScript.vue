<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, reactive, h, nextTick } from 'vue'
import { message } from 'ant-design-vue'

import { usePipeline } from '../../../hooks/usePipeline'
import { useRewrite } from '../../../hooks/useRewrite'
import { usePermission } from '../../../hooks/usePermission'
import { CheckOutlined, EditOutlined, SafetyCertificateOutlined } from '@ant-design/icons-vue'
import LegalReviewHighlighted from './LegalReviewHighlighted.vue'
import BenchmarkProgress from '../../../components/BenchmarkProgress.vue'

const {
  pipeline,
  notifyStepStart,
  updatePipelineData,
  notifyStepComplete,
  notifyStepError
} = usePipeline()
const { checkFullPermission } = usePermission()
const emit = defineEmits(['navigate-step'])

const {
  loading,
  rewrittenContent,
  templateOptions,
  selectedTemplateId,
  progressText,
  initTemplateOptions,
  rewriteContent
} = useRewrite()

const editableOriginalContent = ref('')
const wordCountType = ref('300')
const customWordCount = ref(500)

// 从 pipeline 恢复
watch(
  () => pipeline.originalContent,
  (val) => {
    if (val) {
      editableOriginalContent.value = val
    }
  },
  { immediate: true }
)

watch(
  () => pipeline.rewrittenContent,
  (val) => {
    if (val) rewrittenContent.value = val
  },
  { immediate: true }
)

// 计算字数限制
const getWordCountLimit = () => {
  if (wordCountType.value === 'custom') return customWordCount.value
  return parseInt(wordCountType.value)
}

// 改写操作
const handleRewrite = async () => {
  if (!checkFullPermission('文案改写')) return

  const content = editableOriginalContent.value
  if (!content || !content.trim()) {
    message.warning('请先输入或改写文案内容')
    return
  }

  // 改写开始
  notifyStepStart('rewrite')

  const limit = getWordCountLimit()
  const result = await rewriteContent(
    content,
    selectedTemplateId.value,
    (msg) => {
      progressText.value = msg
    },
    { wordCountLimit: limit }
  )

  if (result.success) {
    updatePipelineData({
      rewrittenContent: rewrittenContent.value,
      selectedTemplateId: selectedTemplateId.value,
      voiceRewriteSourceContent: result.data.content
    })
    notifyStepComplete('rewrite', { content: rewrittenContent.value })
    progressText.value = '改写完成！'
    setTimeout(() => {
      progressText.value = ''
    }, 1000)
    if (pipeline.executionMode === 'auto') {
      // 由父组件监听 workflow:step-complete 事件
    }
  } else {
    notifyStepError('rewrite', new Error(result.error))
    progressText.value = '改写失败'
    setTimeout(() => {
      progressText.value = ''
    }, 2000)
  }
}

// 检查是否云端模式
const checkCloudMode = async () => {
  try {
    const config = await window.api.config.getAll()
    return config?.general?.runMode === 'cloud'
  } catch (e) {
    console.error('读取运行模式失败，降级到本地:', e)
    return false
  }
}

/**
 * 一键处理后续步骤（改写 + 自动继续）
 */
const handleConfirmRewrite = async () => {
  if (loading.value) return

  try {
    // 检查是否在云端模式且字数超限
    const isCloud = await checkCloudMode()
    if (isCloud) {
      const len = rewrittenContent.value?.length || 0
      if (len > 1500) {
        message.warning('云端模式下文案字数不能超过1500字，当前字数：' + len)
        return
      }
    }

    // 更新 pipeline
    updatePipelineData({
      rewrittenContent: rewrittenContent.value,
      voiceRewriteSourceContent: rewrittenContent.value,
      selectedTemplateId: selectedTemplateId.value
    })

    // 根据执行模式决定行为
    if (workflowStore.executionMode === 'manual') {
      // 手动模式：直接标记完成并跳转
      notifyStepComplete('rewrite', { content: rewrittenContent.value })
      // 触发跳转到下一步（声音生成）
      emit('navigate-step', 'voiceClone')
    } else if (workflowStore.executionMode === 'cloud') {
      // 云端模式：创建后台任务
      const task = await workflowStore.createBackgroundTask()
      await workflowStore.startTaskExecutor()
      message.success('任务已保存（' + task.id + '），正在后台执行...')
      // 触发工作流事件
      window.dispatchEvent(
        new CustomEvent('workflow:auto-next', {
          detail: { step: 'voiceClone', taskId: task.id }
        })
      )
    } else {
      // local 模式
      notifyStepComplete('rewrite', { content: rewrittenContent.value })
      // 自动跳转到下一步
      window.dispatchEvent(
        new CustomEvent('workflow:auto-next', {
          detail: { step: 'voiceClone' }
        })
      )
    }
  } catch (e) {
    message.error('一键处理失败：' + e.message)
    return
  }
}

/**
 * // 暴露给父组件（用于工作流验证）
 * 验证当前步骤是否符合要求
 * @returns {boolean} 是否符合要求
 */
const handleBeforeNext = () => {
  const content = rewrittenContent.value || pipeline.rewrittenContent
  if (content && content.trim()) {
    updatePipelineData({ rewrittenContent: content.trim() })
    message.success('改写文案完成')
    return true
  } else {
    message.warning('请先改写或填写文案')
    return false
  }
}

defineExpose({
  handleBeforeNext
})

// 计算是否可以改写
const canRewrite = computed(() => {
  const content = editableOriginalContent.value
  return content && content.trim().length > 0 && selectedTemplateId.value
})

// 法务审核
const legalReviewLoading = ref(false)
const showLegalReviewModal = ref(false)
const legalReviewResult = reactive({
  originalContent: '',
  risks: [],
  analysis: '',
  hasRisk: false
})

/**
 * 根据原文 + 风险词列表，本地派生出清理后的文案。
 *   - 主进程不再返回 cleanedContent，前端自己处理
 *   - 把每个风险词（按出现顺序、从后往前）替换为空，避免位置偏移
 *   - 合并多余空白为单个空格（去掉被删除词留下的多空格/标点孤岛）
 */
const cleanedContent = computed(() => {
  let text = legalReviewResult.originalContent || ''
  const risks = legalReviewResult.risks || []
  if (!text || !risks.length) return text

  // 收集所有匹配区间
  const matches = []
  for (const r of risks) {
    const word = String(r.word || '').trim()
    if (!word) continue
    let from = 0
    while (from <= text.length) {
      const idx = text.indexOf(word, from)
      if (idx < 0) break
      matches.push({ start: idx, end: idx + word.length })
      from = idx + word.length
    }
  }
  if (!matches.length) return text
  matches.sort((a, b) => a.start - b.start)

  // 从后往前切片删除，避免 index 偏移
  let result = text
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i]
    result = result.slice(0, m.start) + result.slice(m.end)
  }

  // 清理：把多个连续空白 / 中英文标点压缩为单个空格
  return result
    .replace(/[ \u3000\t]+/g, ' ')
    .replace(/[ ]+([，。！？、；：])/g, '$1')
    .replace(/([，。！？、；：])[ ]+/g, '$1')
    .replace(/^[ \u3000]+|[ \u3000]+$/g, '')
    .trim()
})

const canLegalReview = computed(() => {
  const content = rewrittenContent.value || editableOriginalContent.value
  return content && content.trim().length > 0
})

/**
 * 法务审核操作
 */
const handleLegalReview = async () => {
  if (!checkFullPermission('法务审核')) return
  if (!canLegalReview.value) {
    message.warning('请先改写或填写文案')
    return
  }

  const content = rewrittenContent.value || editableOriginalContent.value
  if (!content) {
    message.warning('请先改写或填写文案')
    return
  }

  legalReviewLoading.value = true
  showLegalReviewModal.value = true
  legalReviewResult.originalContent = content
  legalReviewResult.risks = []
  legalReviewResult.analysis = ''
  legalReviewResult.hasRisk = false

  try {
    const result = await window.api.llm.legalReview(content)
    console.log('法务审核结果:', result)
    if (result.success) {
      const data = result.data
      legalReviewResult.risks = data.risks || []
      legalReviewResult.analysis = data.analysis || ''
      legalReviewResult.hasRisk = data.hasRisk || false
    } else {
      message.error('法务审核失败：' + result.error)
      showLegalReviewModal.value = false
    }
  } catch (e) {
    message.error('法务审核异常：' + e.message)
    showLegalReviewModal.value = false
  } finally {
    legalReviewLoading.value = false
  }
}

/**
 * 应用清理后的内容到改写内容
 */
const applyCleanedContent = () => {
  if (cleanedContent.value && cleanedContent.value !== legalReviewResult.originalContent) {
    rewrittenContent.value = cleanedContent.value
    updatePipelineData({ rewrittenContent: rewrittenContent.value })
    showLegalReviewModal.value = false
    message.success('已替换到改写内容')
  } else {
    message.info('当前没有可清理的风险词')
  }
}

// 高亮原文中的风险词（返回 HTML 字符串，配合 v-html 渲染）
// 风险高亮渲染已抽离为 LegalReviewHighlighted 子组件

const rewriteStepRef = ref(null)
const modalSize = reactive({ width: 820, height: 560 })
// 弹窗容器样式：去掉自定义 top，由 antd 默认居中算法控制（centered 即可）
const modalStyle = reactive({ paddingBottom: 0 })
const modalBodyStyle = reactive({ padding: '16px' })

const updateModalSize = () => {
  const el = rewriteStepRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const width = Math.min(rect.width * 0.8, 820)
  const height = Math.min(rect.height * 0.7, 560)
  modalSize.width = Math.max(480, width)
  modalSize.height = Math.max(360, height)
}

onMounted(() => {
  initTemplateOptions()
  if (pipeline.originalContent) {
    editableOriginalContent.value = pipeline.originalContent
  }
  if (pipeline.rewrittenContent) {
    rewrittenContent.value = pipeline.rewrittenContent
  }
  if (pipeline.selectedTemplateId) {
    selectedTemplateId.value = pipeline.selectedTemplateId
  }

  // 监听自动下一步事件
  // onAutoNext((detail) => {
  //   if (detail.step === 'rewrite' && workflowStore.executionMode === 'auto') {
  //     // 自动模式：如果已有改写内容且未执行，则自动触发改写
  //     if (canRewrite.value) {
  //       handleRewrite();
  //     }
  //   }
  // });

  // 监听 workflow:auto-next 事件（由父组件触发）
  window.addEventListener('workflow:auto-next', (event) => {
    const { step } = event.detail
    if (step === 'rewrite' && workflowStore.executionMode === 'auto') {
      if (canRewrite.value) {
        handleRewrite()
      }
    }
  })

  nextTick(updateModalSize)
  window.addEventListener('resize', updateModalSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateModalSize)
})

// 同步到 pipeline
watch(rewrittenContent, (val) => {
  updatePipelineData({ rewrittenContent: val || '' })
})

watch(selectedTemplateId, (val) => {
  if (val) updatePipelineData({ selectedTemplateId: val })
})
</script>

<template>
  <div ref="rewriteRef" class="rewrite-step" :class="{ executing: loading }">
    <div class="rewrite-layout">
      <div class="glass-card control-panel">
        <div class="card-title">改写配置</div>
        <a-form layout="vertical" class="config-form">
          <a-form-item label="写作提示词">
            <a-select v-model:value="selectedTemplateId" placeholder="选择改写模板"
              popup-class-name="rewrite-config-dropdown">
              <a-select-option v-for="item in templateOptions" :key="item.id" :value="item.id">
                {{ item.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="字数">
            <div class="word-count-row">
              <a-select v-model:value="wordCountType" placeholder="选择字数"
                popup-class-name="rewrite-config-dropdown rewrite-word-count-dropdown"
                :style="wordCountType === 'custom' ? 'width: 120px' : 'width: 100%'">
                <a-select-option value="300">300字</a-select-option>
                <a-select-option value="500">500字</a-select-option>
                <a-select-option value="800">800字</a-select-option>
                <a-select-option value="1000">1000字</a-select-option>
                <a-select-option value="custom">自定义</a-select-option>
              </a-select>

              <a-input-number v-model:value="customWordCount" :min="10" :max="5000" class="w-full"
                v-if="wordCountType === 'custom'">
                <template #addonAfter> 字 </template>
              </a-input-number>
            </div>
          </a-form-item>

          <div class="action-grid">
            <a-button size="lg" type="primary" class="gradient-btn" @click="handleRewrite"
              :disabled="!canRewrite || loading" :loading="loading">
              <edit-outlined />
              改写文案</a-button>

            <a-button size="lg" type="default" class="gradient-btn legal-btn" @click="handleLegalReview"
              :disabled="!canLegalReview" :loading="legalReviewLoading">
              <safety-certificate-outlined />
              AI法务</a-button>
          </div>
        </a-form>
      </div>

      <div class="rewrite-content-grid">
        <div class="glass-card content-panel original-panel">
          <div class="card-title">
            <span>原文案</span>
          </div>
          <a-textarea class="full-textarea" v-model:value="editableOriginalContent"
            placeholder="上一步生成或提取的原文案会显示在这里，也可以直接编辑..." />
        </div>

        <div class="glass-card content-panel original-panel">
          <div class="card-title">
            <span>改写内容</span>
          </div>
          <a-textarea class="full-textarea" show-count v-model:value="rewrittenContent"
            placeholder="改写后的文案将显示在这里......" />
        </div>
      </div>
    </div>

    <benchmark-progress :loading="loading" :text="progressText" />

    <!-- 法务审核弹窗 -->
    <a-modal v-model:open="showLegalReviewModal" title="" :footer="null" :mask-closable="false"
      :closable="!legalReviewLoading" :keyboard="!legalReviewLoading" :width="modalSize.width" centered
      :style="modalStyle" :body-style="modalBodyStyle" wrap-class-name="rewrite-legal-modal">
      <div class="legal-modal-header">
        <div class="legal-header-title">
          <safety-certificate-outlined />
          <span>AI 法务审核报告</span>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="legalReviewLoading" class="legal-loading">
        <div class="legal-scanner">
          <safety-certificate-outlined class="scanner-icon" />
          <div class="scanner-ring ring-one"></div>
          <div class="scanner-ring ring-two"></div>
        </div>
        <span class="loading-text">AI 正在进行法务审核...</span>
        <p class="loading-subtext">检查违禁词、敏感词、极限词等法律风险</p>
      </div>

      <div class="legal-review-layout" v-else>
        <!-- 审核结果 -->
        <div class="review-panels">
          <!-- 风险概览 -->
          <div class="review-panel">
            <div class="panel-title">
              <span class="status-badge" :class="legalReviewResult.hasRisk ? 'risk' : 'safe'">
                {{ legalReviewResult.hasRisk ? '发现风险' : '无风险' }}
              </span>
              <span>原文案分析</span>
            </div>

            <div class="content-box marked-content">
              <LegalReviewHighlighted :text="legalReviewResult.originalContent" :risks="legalReviewResult.risks" />
            </div>
          </div>

          <div class="review-panel">
            <div class="panel-title between">
              <span>优化后文案</span>
              <a-button type="primary" size="sm" class="apply-btn"
                :disabled="!cleanedContent || cleanedContent === legalReviewResult.originalContent"
                @click="applyCleanedContent">
                <check-outlined />
                <span>替换为修改后文案</span>
              </a-button>
            </div>

            <div class="content-box cleaned-content">
              {{ cleanedContent }}
            </div>
          </div>
        </div>

        <div class="review-analysis">
          <div class="panel-title">AI 审核解读</div>
          <div class="content-box analysis-box">
            {{ legalReviewResult.analysis }}
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.rewrite-step {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 22px;
  border-radius: 24px;
  background:
    radial-gradient(circle at 82% 8%,
      color-mix(in srgb, var(--theme-secondary) 12%, transparent),
      transparent 34%),
    linear-gradient(135deg, var(--theme-overlay-light), var(--theme-overlay-light));
  border: 1px solid var(--theme-overlay-light);
  box-shadow:
    inset 0 0 40px color-mix(in srgb, var(--theme-secondary) 6%, transparent),
    0 12px 34px var(--theme-shadow-dark);
  box-sizing: border-box;
}

.rewrite-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 18px;
}

.glass-card {
  min-height: 0;
  padding: 20px;
  border-radius: 20px;
  background:
    radial-gradient(circle at 90% 0,
      color-mix(in srgb, var(--theme-secondary) 8%, transparent),
      transparent 38%),
    color-mix(in srgb, var(--theme-background) 76%, transparent);
  border: 1px solid var(--theme-overlay-light);
  box-shadow: inset 0 0 24px var(--theme-overlay-light);
  box-sizing: border-box;
}

.content-panel,
.control-panel {
  display: flex;
  flex-direction: column;
}

.control-panel {
  padding-bottom: 14px;
}

.config-form {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 260px auto auto;
  align-items: end;
  gap: 14px;
}

.config-form .ant-form-item {
  margin-bottom: 0;
}

.config-form .ant-btn,
.config-form .ant-input,
.config-form .ant-input-number,
.config-form .ant-input-number-group-addon,
.config-form .ant-input-number-group-wrapper,
.config-form .ant-select-selector {
  height: 38px !important;
}

.config-form .ant-input,
.config-form .ant-input-number-input {
  height: 36px !important;
  line-height: 36px !important;
}

.config-form .ant-btn,
.config-form .ant-select-selector {
  display: flex !important;
  align-items: center !important;
}

.config-form .ant-input-number-wrapper {
  height: 38px !important;
}

.config-form .ant-input-number-input-wrap {
  height: 36px !important;
}

.config-form .ant-input-number-input {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.config-form .ant-input-number-group-addon {
  display: table-cell !important;
  vertical-align: middle !important;
  padding: 0 10px !important;
}

.config-form .ant-select-selector {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.config-form .ant-select-selection-item,
.config-form .ant-select-selection-placeholder {
  display: flex !important;
  align-items: center !important;
  line-height: normal !important;
}

.config-form .ant-select-selection-search-input {
  height: 36px !important;
}

.rewrite-config-dropdown {
  padding: 6px !important;
  background: color-mix(in srgb, var(--theme-background) 98%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--theme-info) 26%, transparent) !important;
  border-radius: 10px !important;
  box-shadow: 0 16px 36px color-mix(in srgb, var(--theme-background) 42%, transparent) !important;
}

.rewrite-config-dropdown .ant-select-item {
  height: 25px !important;
  min-height: 25px !important;
  max-height: 25px !important;
  padding: 0 10px !important;
  border-radius: 8px;
  color: var(--theme-text-secondary) !important;
  font-size: var(--app-font-size-body);
  font-weight: 600;
}

.rewrite-config-dropdown .ant-select-item-option {
  display: flex;
  align-items: center;
}

.rewrite-config-dropdown .ant-select-item-option-content {
  display: flex;
  align-items: center;
  height: 25px;
  line-height: 25px !important;
}

.rewrite-config-dropdown .ant-select-item-option-active {
  background: color-mix(in srgb, var(--theme-primary) 22%, transparent) !important;
}

.rewrite-config-dropdown .ant-select-item-option-selected {
  background: color-mix(in srgb, var(--theme-primary) 34%, transparent) !important;
}

.rewrite-word-count-dropdown .rc-virtual-list-holder,
.rewrite-word-count-dropdown .rc-virtual-list-holder-inner {
  max-height: none !important;
  height: auto !important;
  overflow: visible !important;
}

.rewrite-content-grid {
  min-height: 320px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-auto-rows: minmax(320px, 1fr);
  gap: 18px;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title);
  font-weight: 800;
}

.word-count-row {
  display: flex;
  gap: 8px;
}

.custom-word-count {
  flex: 1;
}

.action-grid {
  display: flex;
  gap: 12px;
}

.action-grid .ant-btn {
  min-width: 120px;
}

.gradient-btn {
  background: linear-gradient(90deg, var(--theme-secondary), var(--theme-primary)) !important;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--theme-primary) 24%, transparent) !important;
}

.gradient-btn,
.legal-btn {
  border: none !important;
  color: var(--theme-text-primary) !important;
}

.legal-btn {
  background: linear-gradient(90deg, var(--theme-warning), var(--theme-error)) !important;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--theme-warning) 22%, transparent) !important;
}

.confirm-btn {
  min-width: 168px;
  color: var(--theme-text-secondary) !important;
  background: var(--theme-overlay-light) !important;
  border-color: var(--theme-overlay-light) !important;
}

.full-textarea {
  flex: 1;
  min-height: 240px;
}

.content-panel .ant-input {
  height: 100% !important;
  min-height: 240px;
  resize: none;
  font-size: var(--app-font-size-body);
  line-height: 1.75;
}

.cloud-limit {
  font-weight: 600;
}

.cloud-limit,
.form-hint {
  color: var(--theme-text-gradient-purple);
  font-size: var(--app-font-size-caption);
}

.form-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.bottom-progress {
  margin-top: 14px;
  flex-shrink: 0;
}

.legal-modal-header {
  padding-bottom: 16px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--theme-overlay-light);
  flex-shrink: 0;
}

.legal-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-section-title);
  font-weight: 800;
}

.legal-loading {
  flex: 1;
  height: auto;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 35px;
}

.legal-scanner {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--theme-warning), var(--theme-error));
}

.scanner-icon {
  position: relative;
  z-index: 2;
  color: var(--theme-text-primary);
  font-size: 38px;
}

.scanner-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--theme-warning) 55%, transparent);
  animation: ringPulse 1.8s ease-out infinite;
}

.ring-two {
  animation-delay: 0.6s;
}

.loading-text {
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title);
  font-weight: 700;
}

.loading-subtext {
  color: var(--theme-text-muted);
}

.legal-review-layout {
  flex: 1;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-panels {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.review-analysis,
.review-panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.review-analysis {
  height: 170px;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--theme-text-primary);
  font-weight: 800;
}

.panel-title.between {
  justify-content: space-between;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-caption);
}

.status-badge.risk {
  background: linear-gradient(90deg, var(--theme-error), var(--theme-warning-dark));
}

.status-badge.safe {
  background: linear-gradient(90deg, var(--theme-success), var(--theme-success-dark));
}

.content-box {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  border-radius: 16px;
  color: var(--theme-text-muted);
  background: color-mix(in srgb, var(--theme-background) 72%, transparent);
  border: 1px solid var(--theme-overlay-light);
  line-height: 1.8;
  white-space: pre-wrap;
}

.apply-btn {
  border: none !important;
  background: linear-gradient(90deg, var(--theme-success), var(--theme-success-dark)) !important;
}

.marked-content .risk-word {
  color: var(--theme-error) !important;
  font-weight: 700 !important;
  background-color: color-mix(in srgb, var(--theme-error) 16%, transparent) !important;
  padding: 0 4px !important;
  border-radius: 4px !important;
  border-bottom: 2px dashed var(--theme-error) !important;
  cursor: help !important;
}

::global(.legal-risk-tooltip .ant-tooltip-inner) {
  color: var(--theme-background-light) !important;
  background: var(--theme-text-secondary) !important;
  border: 1px solid color-mix(in srgb, var(--theme-warning) 26%, transparent);
  box-shadow: 0 14px 36px color-mix(in srgb, var(--theme-background-light) 26%, transparent);
}

::global(.legal-risk-tooltip .ant-tooltip-arrow:before) {
  background: var(--theme-text-secondary) !important;
}

.rewrite-legal-modal .ant-modal-content,
.rewrite-legal-modal .ant-modal-header {
  background: var(--theme-background) !important;
}

.rewrite-legal-modal .ant-empty-description,
.rewrite-legal-modal .ant-modal-close,
.rewrite-legal-modal .ant-modal-title {
  color: var(--theme-text-secondary) !important;
}

.rewrite-step .ant-modal-root {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.rewrite-step .ant-modal-mask {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: color-mix(in srgb, var(--theme-background) 66%, transparent);
  backdrop-filter: blur(8px);
  pointer-events: auto;
}

.rewrite-step .rewrite-legal-modal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 24px;
  pointer-events: auto;
}

.rewrite-step .rewrite-legal-modal .ant-modal {
  top: auto;
  max-width: none;
  margin: 0;
  padding-bottom: 0;
}

.rewrite-step .rewrite-legal-modal .ant-modal-body {
  overflow: hidden;
}
</style>

<style>
.rewrite-step .ant-form-item-label>label,
.rewrite-step .ant-input,
.rewrite-step .ant-input-number-input,
.rewrite-step .ant-select-selection-item,
.rewrite-step .ant-select-selection-placeholder,
.rewrite-step .ant-textarea textarea {
  color: var(--theme-text-secondary) !important;
}

.rewrite-step .ant-input,
.rewrite-step .ant-input-number,
.rewrite-step .ant-input-number-group-addon,
.rewrite-step .ant-select-selector,
.rewrite-step .ant-textarea textarea {
  background: var(--theme-overlay-light) !important;
  border-color: var(--theme-overlay-light) !important;
}

.rewrite-step .ant-input-number-group-addon {
  color: var(--theme-text-secondary) !important;
}

.rewrite-step .ant-input::-moz-placeholder,
.rewrite-step .ant-textarea textarea::-moz-placeholder {
  color: var(--theme-text-muted) !important;
}

.rewrite-step .ant-input::placeholder,
.rewrite-step .ant-textarea textarea::placeholder {
  color: var(--theme-text-muted) !important;
}

.marked-content .risk-word {
  color: var(--theme-error) !important;
  font-weight: 700 !important;
  background-color: color-mix(in srgb, var(--theme-error) 16%, transparent) !important;
  padding: 0 4px !important;
  border-radius: 4px !important;
  border-bottom: 2px dashed var(--theme-error) !important;
  cursor: help !important;
}

@keyframes ringPulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }

  to {
    transform: scale(1.65);
    opacity: 0;
  }
}
</style>
