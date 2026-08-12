<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import CoverDesignerModal from '../../../components/CoverDesignerModal.vue'
import { usePipeline } from '../../../hooks/usePipeline'
import { useTitleCover } from '../../../hooks/useTitleCover'
import { message } from 'ant-design-vue'

import { ensureFontsReady } from '../../../fonts/registerFonts.js'
import { ExportOutlined, FileTextOutlined, VideoCameraOutlined } from '@ant-design/icons-vue'
import BenchmarkProgress from '../../../components/BenchmarkProgress.vue'
import { usePermission } from '../../../hooks/usePermission.js'

defineOptions({
  name: 'TitleCover'
})

const emit = defineEmits(['navigate-step', 'state-change'])

const { pipeline, updatePipelineData, notifyStepComplete, notifyStepStart, notifyStepError } =
  usePipeline()
const { checkFullPermission } = usePermission()
const {
  publishTitle,
  progressText,
  coverTitleMain,
  coverTitleSub,
  publishDescription,
  publishTags,
  aiGenerating,
  coverPath,
  designerVideoPath,
  sourceVideoName,
  designerConfig,

  showGenerateGuide,
  designerRef,

  generateTitleOnly,

  generateCover,
  handleSelectVideoSource,
  handleDesignerDirtyChange,
  handleOpenCover,
  handleExportCover,
  handleExportCoverVideo,
  onCoverUpdated,
  restoreFromPipeline
} = useTitleCover()

const onDesignerConfirm = (result) => {
  // 更新封面
  onCoverUpdated({
    coverPath: result.coverPath,
    coverUrl: result.coverUrl,
    config: result.designerConfig
  })
  // 保存配置用于恢复
  designerConfig.value = result.designerConfig
  // 更新步骤状态
  emit('state-change', {
    step: 'titleCover',
    hasCover: true,
    coverDirty: false
  })
}

// ---------- AI 生成标题 + 封面（一键） ----------
const handleAIGenerate = async () => {
  if (!checkFullPermission('标题封面')) return

  if (aiGenerating.value) return

  try {
    notifyStepStart('titleCover')

    // 先生成标题
    const titleResult = await generateTitleOnly()
    if (!titleResult.success) {
      aiGenerating.value = false
    }

    // 再生成封面
    const generateRes = await generateCover(publishTitle.value)
    if (!generateRes.success) {
      aiGenerating.value = false
    }

    notifyStepComplete('titleCover', {
      publishTitle: publishTitle.value,
      coverTitleMain: coverTitleMain.value,
      coverTitleSub: coverTitleSub.value,
      coverPath: generateRes.data.coverPath
    })
  } catch (err) {
    aiGenerating.value = false
    console.error('AI生成标题失败:', err)
    message.error('AI生成标题失败：' + err.message)
    progressText.value = '生成失败'
    notifyStepError('titleCover', new Error(err.message))
    return
  }
}

/**
 * 确认封面并进入下一步
 */
const handleConfirmCover = async () => {
  if (!coverPath.value && !pipeline.coverPath) {
    message.warning('请先生成封面')
    return false
  }

  // 更新 pipeline
  updatePipelineData({
    publishTitle: publishTitle.value,
    coverTitleMain: coverTitleMain.value,
    coverTitleSub: coverTitleSub.value,
    publishDescription: publishDescription.value,
    publishTags: publishTags.value,
    coverPath: coverPath.value
  })

  // 标记步骤完成
  notifyStepComplete('titleCover', {
    coverPath: coverPath.value,
    publishTitle: publishTitle.value
  })

  // 触发下一步
  emit('navigate-step', 'publish')
  return true
}

/**
 * 检查并自动生成（用于 auto 模式）
 */
const handleAutoGenerate = async () => {
  if (!publishTitle.value && designerVideoPath.value) {
    await handleGenerateTitle()
  }
  if (!coverPath.value && publishTitle.value) {
    await generateCover()
  }
}

// /**
//  * 监听自动下一步事件
//  */
// onAutoNext((detail) => {
//   if (detail.step === 'titleCover' && !coverPath.value) {
//     handleAutoGenerate();
//   }
// });

/**
 * 组件挂载时，从 pipeline 恢复状态
 */
onMounted(() => {
  restoreFromPipeline()

  ensureFontsReady()

  if (coverPath.value) {
    emit('step-status', { step: 'titleCover', coverDirty: false, hasCover: true })
  }
})

defineExpose({
  handleBeforeNext: handleConfirmCover,
  handleAutoGenerate,
  generateCover
})
</script>

<style scoped>
/* 引导提示气泡：指向右侧一键生成按钮 */
.guide-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 12px;
  line-height: 1;
  color: #f0abfc;
  background: linear-gradient(135deg, rgba(217, 70, 239, 0.16), rgba(124, 58, 237, 0.12));
  border: 1px solid rgba(217, 70, 239, 0.35);
  box-shadow: 0 2px 12px -4px rgba(217, 70, 239, 0.4);
  white-space: nowrap;
  animation: guide-hint-pulse 2s ease-in-out infinite;
}

/* 脉冲呼吸动画 */
@keyframes guide-hint-pulse {

  0%,
  100% {
    box-shadow: 0 2px 12px -4px rgba(217, 70, 239, 0.4);
    border-color: rgba(217, 70, 239, 0.35);
  }

  50% {
    box-shadow: 0 2px 18px -2px rgba(217, 70, 239, 0.7);
    border-color: rgba(217, 70, 239, 0.6);
  }
}

/* 左侧脉冲圆点 */
.guide-hint__dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: #d946ef;
  box-shadow: 0 0 6px 1px rgba(217, 70, 239, 0.8);
}

/* 文字 */
.guide-hint__text {
  font-weight: 500;
}

/* 指向箭头（轻微左右摆动） */
.guide-hint__arrow {
  font-size: 14px;
  color: #f0abfc;
  animation: guide-hint-arrow 1.4s ease-in-out infinite;
}

@keyframes guide-hint-arrow {

  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(3px);
  }
}


.source-change-action {
  flex-shrink: 0;
  height: 24px;
  padding: 0 10px;
  font-size: var(--app-font-size-caption);
}
</style>

<template>
  <div class="title-cover-step">
    <div class="title-cover-layout single">
      <div class="glass-card designer-card">
        <div class="card-head designer-head">
          <div class="designer-title">
            <h3>封面设计</h3>
            <div class="designer-source">
              <span :title="sourceVideoName">{{ sourceVideoName || '未检测到视频源' }}</span>
              <button class="mini-action source-change-action" type="button" @click="handleSelectVideoSource">
                修改
              </button>
            </div>
          </div>

          <div class="designer-actions">
            <span class="generate-guide" v-if="showGenerateGuide">先点这里生成标题和封面 </span>
            <button class="ai-btn" @click="handleAIGenerate" :loading="aiGenerating"
              :disabled="aiGenerating || !designerVideoPath">
              <FileTextOutlined />
              {{ aiGenerating ? '生成中' : '一键生成' }}
            </button>
            <button class="ghost-action compact" @click="handleOpenCover" :disabled="!coverPath">打开封面</button>
            <button class="ghost-action compact" @click="handleExportCover" :disabled="aiGenerating">
              <ExportOutlined />
              生成并导出封面
            </button>
            <button class="primary-action compact" @click="handleExportCoverVideo" :disabled="aiGenerating">
              <VideoCameraOutlined />
              生成并导出封面视频
            </button>
          </div>
        </div>

        <!-- 主内容：封面设计器 -->
        <CoverDesignerModal :ref="designerRef" :video-path="designerVideoPath" :title="publishTitle"
          :titleMain="coverTitleMain" :titleSub="coverTitleSub" :initial-config="designerConfig"
          @confirm="onDesignerConfirm" @dirty-change="handleDesignerDirtyChange" :data-video-path="designerVideoPath" />
      </div>
    </div>

    <BenchmarkProgress :loading="aiGenerating" :text="progressText" />
  </div>
</template>

<style scoped>
.title-cover-step {
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.title-cover-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(320px, 0.72fr) minmax(0, 1.58fr);
  gap: 18px;
}

.title-cover-layout.single {
  grid-template-columns: minmax(0, 1fr);
}

.title-cover-layout {
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
}

.glass-card {
  min-height: 0;
  border-radius: 22px;
  background: linear-gradient(145deg, var(--theme-overlay-light), var(--theme-overlay-light));
  border: 1px solid var(--theme-overlay-light);
  box-shadow: 0 18px 48px color-mix(in srgb, var(--theme-background) 30%, transparent);
}

.designer-card,
.form-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.designer-card {
  gap: 12px;
}

.card-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.designer-title {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.card-head h3 {
  margin: 2px 0 0;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title);
  font-weight: 900;
}

.designer-source {
  max-width: 520px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.designer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.generate-guide {
  position: relative;
  height: 30px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  color: var(--theme-text-primary) 7ed;
  background: color-mix(in srgb, var(--theme-warning-dark) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-warning) 38%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--theme-warning) 8%, transparent),
    0 8px 22px color-mix(in srgb, var(--theme-warning-dark) 16%, transparent);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
  white-space: nowrap;
}

.ai-btn,
.ghost-action,
.mini-action,
.primary-action {
  border: 0;
  cursor: pointer;
  font-weight: 900;
}

.ai-btn,
.mini-action {
  height: 30px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-primary-light) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 24%, transparent);
}

.ghost-action,
.primary-action {
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 12px;
}

.ghost-action {
  color: var(--theme-text-secondary);
  background: var(--theme-overlay-light);
  border: 1px solid var(--theme-overlay-light);
}

.ghost-action.compact,
.primary-action.compact {
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: var(--app-font-size-caption);
}

.ai-btn:disabled,
.ghost-action:disabled,
.primary-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.primary-action {
  color: var(--theme-text-primary);
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  box-shadow: 0 14px 30px color-mix(in srgb, var(--theme-primary) 24%, transparent);
}

.designer-sourced {
  max-width: 520px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.designer-source span {
  min-width: 0;
  overflow: hidden;
  color: color-mix(in srgb, var(--theme-text-secondary) 68%, transparent);
  font-size: var(--app-font-size-caption);
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
