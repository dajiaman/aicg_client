<script setup>
/**
 * Home 主页 — 工作流步骤向导
 *
 * 设计原则：
 *   1. 布局：tailwindcss 优先（容器 / 间距 / 颜色 / 字号）
 *   2. 交互：ant-design-vue 提供组件能力，按钮 / 弹窗 / 进度条
 *   3. 一致性：所有页面共用同一个 antd-dark.css 暗色主题
 *   4. 图标：用 emoji 替代 antd icons（antd 4.x 已注册但避免子组件依赖）
 */
import { ref, computed, onMounted } from 'vue'
import { ensureFontsReady } from '../../fonts/registerFonts'

import { usePipeline } from '../../hooks/usePipeline'
import { message } from 'ant-design-vue'
import { useWorkflowTargetStatus } from '../../hooks/useWorkflowTargetStatus'

import BenchmarkStudy from './components/BenchmarkStudy.vue'
import RewriteScript from './components/RewriteScript.vue'
import VoiceGenerate from './components/VoiceGenerate.vue'
import VideoGenerate from './components/VideoGenerate.vue'
import TitleCover from './components/TitleCover.vue'
import ViralStudio from './components/ViralStudio.vue'
import OneClickPublish from './components/OneClickPublish.vue'
import {
  BulbOutlined,
  EditOutlined,
  PictureOutlined,
  RocketOutlined,
  ScissorOutlined,
  SoundOutlined,
  VideoCameraOutlined
} from '@ant-design/icons-vue'

// 步骤定义
const steps = [
  {
    key: 'benchmark',
    title: '学习对标',
    icon: BulbOutlined,
    component: BenchmarkStudy
  },
  {
    key: 'rewrite',
    title: '改写文案',
    icon: EditOutlined,
    component: RewriteScript
  },
  {
    key: 'voiceClone',
    title: '声音生成',
    icon: SoundOutlined,
    component: VoiceGenerate
  },
  {
    key: 'digitalHuman',
    title: '数字人视频',
    icon: VideoCameraOutlined,
    component: VideoGenerate
  },
  {
    key: 'videoEdit',
    title: '网感剪辑',
    icon: ScissorOutlined,
    component: ViralStudio
  },
  {
    key: 'titleCover',
    title: '标题封面',
    icon: PictureOutlined,
    component: TitleCover
  },
  {
    key: 'publish',
    title: '一键发布',
    icon: RocketOutlined,
    component: OneClickPublish
  }
]

const { pipeline, resetWorkflow, executionMode } = usePipeline()

const currentStepRef = ref(null)

// 用于强制重置子组件
const resetKey = ref(0)
// 下一步按钮的加载状态
const nextLoading = ref(false)

const activeKey = ref('benchmark')
// 封面步骤是否被修改（脏标记）
const coverStepDirty = ref(false)
// 封面步骤是否已生成封面
const coverStepHasCover = ref(false)

// 当前步骤在 steps 数组中的索引
const currentIndex = computed(() => steps.findIndex((s) => s.key === activeKey.value))

// 当前步骤的完整配置对象
const currentStep = computed(() => steps[currentIndex.value] || steps[0])

// 当前进度百分比
const progressPercent = computed(() => ((currentIndex.value + 1) / steps.length) * 100)

// 动态按钮文本
const nextButtonText = computed(() => {
  if (activeKey.value === 'titleCover' && coverStepDirty.value && !coverStepHasCover.value) {
    return '生成并导出封面'
  }
  return '下一步'
})

// 获取当前步骤的验证状态（用于底部状态显示）
const workflowTargetStatus = computed(() =>
  useWorkflowTargetStatus({
    activeKey: activeKey.value,
    pipeline: pipeline,
    stepState: {
      coverDirty: coverStepDirty.value,
      hasCover: coverStepHasCover.value,
      publishStatus: pipeline.steps?.publish?.status || 'idle'
    }
  })
)

/**
 * 上一步
 */
const goPrev = () => {
  if (currentIndex.value <= 0) return
  activeKey.value = steps[currentIndex.value - 1].key
}

/**
 * 下一步
 */
const goNext = async () => {
  if (currentIndex.value >= steps.length - 1) return

  const nextStep = steps[currentIndex.value + 1]
  const currentComponent = currentStepRef.value

  // 如果当前组件暴露了 handleBeforeNext，则先验证
  if (currentComponent && typeof currentComponent.handleBeforeNext === 'function') {
    nextLoading.value = true
    try {
      const canProceed = await currentComponent.handleBeforeNext()
      if (!canProceed) return // 校验失败，终止
    } finally {
      nextLoading.value = false
    }
  }

  // 切换步骤
  activeKey.value = nextStep.key

  // 如果是从 videoEdit 跳到 titleCover 且封面尚未生成，则自动触发生成
  const { shouldAutoGenerateCoverAfterNext } = await import('../../hooks/useWorkflowAutoCover')
  const shouldAutoGenerateCover = shouldAutoGenerateCoverAfterNext({
    fromKey: 'videoEdit',
    toKey: 'titleCover',
    pipeline: pipeline
  })
  if (shouldAutoGenerateCover) {
    await import('vue').then((m) => m.nextTick())
    currentStepRef.value?.handleAutoGenerate?.()
  }
}

// 处理子组件发送的状态变更（主要用于封面步骤的脏状态）
const handleStepStateChange = (state) => {
  if (state?.step === 'titleCover') {
    coverStepDirty.value = !!state.coverDirty
    coverStepHasCover.value = !!state.hasCover
  }
}

// 导航到指定步骤（由子组件触发）
const handleNavigateStep = (key) => {
  const target = steps.find((s) => s.key === key)
  if (target) {
    activeKey.value = key
  }
}

/**
 *  清空数据，开始新任务
 */
const handleClearData = async () => {
  try {
    resetWorkflow()
    activeKey.value = 'benchmark'
    resetKey.value += 1
    coverStepDirty.value = false
    coverStepHasCover.value = false

    // 清除自动保存定时器
    if (pipeline._autoSaveTimer) {
      clearTimeout(pipeline._autoSaveTimer)
      pipeline._autoSaveTimer = null
    }

    message.success('工作流已重置')
  } catch (err) {
    console.error('开始新任务失败:', err)
    message.error('开始新任务失败: ' + (err?.message || '未知错误'))
  }
}

// 组件卸载前，关闭所有弹窗（调用子组件暴露的方法）
const closeAllOverlays = () => {
  if (currentStepRef.value && typeof currentStepRef.value.closeAllOverlays === 'function') {
    currentStepRef.value.closeAllOverlays()
  }
}

defineExpose({ closeAllOverlays })

// 应用启动（进入首页）时触发一次自定义字体注册（单例，幂等）。
// 真正注册在 registerFonts 内部完成，供 CoverView 等任意组件使用。
onMounted(() => {
  ensureFontsReady()
})
</script>

<template>
  <div class="home-dashboard">
    <div class="workflow-shell">
      <div class="workflow-left">
        <div class="workflow-header">
          <div class="workflow-title-row">
            <h1>新工作流</h1>
            <a-popconfirm title="确定要开始新任务吗？当前工作流的临时制作数据将被清空，不会影响其他任务或软件数据。" placement="bottomRight"
              @confirm="handleClearData">
              <a-button size="sm" class="clear-workflow-btn">开始新任务</a-button>
            </a-popconfirm>
          </div>
          <p>按步骤完成从对标学习到一键发布的完整创作流程</p>
        </div>
        <div class="step-list">
          <button class="step-item" :class="{
            active: step.key == activeKey
          }" v-for="(step, index) in steps" :key="step.key" @click="activeKey = step.key">
            <span class="step-index">
              {{ index + 1 }}
            </span>
            <span class="step-icon">
              <component :is="step.icon" />
            </span>
            <span class="step-copy">
              <span class="step-text">{{ step.title }}</span>
            </span>
          </button>
        </div>
      </div>

      <div class="workflow-right">
        <div class="tab-card">
          <div class="tab-card-header">
            <div>
              <h2>{{ currentStep.title }}</h2>
            </div>
          </div>

          <div class="tab-content" :class="{
            'cover-content': currentStep.key == 'titleCover'
          }">
            <component :class="{
              'step-panel': currentStep.key !== 'titleCover'
            }" :is="currentStep.component" ref="currentStepRef" :key="currentStep.key + resetKey"
              @state-change="handleStepStateChange" @navigate-step="handleNavigateStep" />
          </div>

          <div class="tab-footer">
            <div class="single-progress">
              <div class="single-progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <div class="footer-actions">
              <button class="footer-btn secondary" @click="goPrev" :disabled="currentIndex === 0">
                上一步
              </button>
              <div class="final-copy-status" :class="{
                confirmed: workflowTargetStatus.confirmed
              }">
                <span class="status-dot"></span>
                <span class="status-label">
                  {{ workflowTargetStatus.target }}
                </span>
                <span class="status-value" v-if="workflowTargetStatus.label" :title="workflowTargetStatus.label">
                  {{ workflowTargetStatus.label }}
                </span>
                <span class="status-preview">
                  {{ workflowTargetStatus.preview }}
                </span>
              </div>
              <button class="footer-btn primary" :disabled="currentIndex === steps.length - 1 || nextLoading"
                :loading="nextLoading" @click="goNext">
                {{ nextButtonText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-dashboard {
  width: 100%;
  height: calc(100vh - 110px);
  min-height: calc(100vh - 110px);
  overflow: hidden;
  color: var(--theme-text-primary);
}

.workflow-shell {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  gap: 14px;
  padding: 0;
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    pointer-events: none;
  }
}

.workflow-left {
  width: clamp(240px, calc(218px * var(--app-font-scale)), 292px);
  flex-shrink: 0;
  padding: calc(16px * var(--app-font-scale)) calc(13px * var(--app-font-scale));
  border-radius: 22px;
  background: linear-gradient(180deg,
      color-mix(in srgb, var(--theme-background-light) 96%, transparent),
      color-mix(in srgb, var(--theme-background) 96%, transparent));
  border: 1px solid color-mix(in srgb, var(--theme-secondary) 18%, transparent);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.workflow-header {
  margin-bottom: 18px;
}

.workflow-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.workflow-header h1 {
  margin: 0;
  font-size: var(--app-font-size-page-title);
  line-height: 1.2;
  color: var(--theme-text-primary);
  white-space: nowrap;
}

.clear-workflow-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 10px;
  line-height: 1;
  border-radius: 999px;
  border-color: color-mix(in srgb, var(--theme-secondary) 28%, transparent);
  background: color-mix(in srgb, var(--theme-secondary) 8%, transparent);
  color: var(--theme-text-secondary);
}

.workflow-header p {
  margin: 0;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  line-height: 1.75;
}

.step-list {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  flex: 1;
  min-height: 0;
  gap: clamp(10px, calc(8px * var(--app-font-scale)), 18px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.step-item {
  width: 100%;
  height: clamp(70px, calc(62px * var(--app-font-scale)), 92px);
  flex-shrink: 0;
  display: grid;
  grid-template-columns:
    clamp(38px, calc(34px * var(--app-font-scale)), 48px) clamp(38px,
      calc(34px * var(--app-font-scale)),
      46px) 1fr;
  -moz-column-gap: clamp(8px, calc(7px * var(--app-font-scale)), 12px);
  column-gap: clamp(8px, calc(7px * var(--app-font-scale)), 12px);
  align-items: center;
  padding: 0 0;
  border: 2px solid transparent;
  border-radius: 16px;
  background: transparent;
  color: var(--theme-text-muted);
  cursor: pointer;
  text-align: left;
  transition: all 0.24s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.step-item.active {
  color: var(--theme-text-primary);
  border-color: color-mix(in srgb, var(--theme-secondary-light) 50%, transparent);
  background: linear-gradient(90deg,
      color-mix(in srgb, var(--theme-secondary) 34%, transparent),
      color-mix(in srgb, var(--theme-primary-light) 14%, transparent));
  box-shadow:
    0 0 28px color-mix(in srgb, var(--theme-secondary) 22%, transparent),
    inset 0 0 18px var(--theme-overlay-light);
}

.step-icon {
  position: relative;
  z-index: 1;
  width: clamp(32px, calc(28px * var(--app-font-scale)), 38px);
  height: clamp(32px, calc(28px * var(--app-font-scale)), 38px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--theme-background-card);
  border: 1px solid var(--theme-overlay-light);
  font-size: var(--app-font-size-section-title);
  transition: all 0.24s;
}

.step-item.active .step-icon,
.step-item:hover .step-icon {
  background: linear-gradient(135deg, var(--theme-secondary), var(--theme-primary));
  transform: scale(1.08);
  box-shadow: 0 0 18px color-mix(in srgb, var(--theme-secondary) 45%, transparent);
}

.step-index {
  font-family:
    DIN Alternate,
    Arial Black,
    Impact,
    sans-serif;
  font-size: clamp(34px, calc(30px * var(--app-font-scale)), 42px);
  font-style: italic;
  font-weight: 800;
  letter-spacing: 1px;
  padding-left: clamp(8px, calc(8px * var(--app-font-scale)), 12px);
  color: var(--theme-text-muted);
}

.step-copy {
  display: flex;
  align-items: center;
  height: 100%;
  min-width: 0;
}

.step-text {
  min-width: 0;
  font-size: var(--app-font-size-card-title);
  font-weight: 800;
  line-height: 1.22;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-list:before {
  content: '';
  position: absolute;
  left: clamp(62px, calc(52px * var(--app-font-scale)), 66px);
  top: 34px;
  bottom: 34px;
  width: 2px;
  background: linear-gradient(180deg,
      color-mix(in srgb, var(--theme-secondary) 45%, transparent),
      color-mix(in srgb, var(--theme-secondary) 4%, transparent));
}

.workflow-right {
  flex: 1;
  min-width: 0;
}

.tab-card {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 22px;
  background:
    radial-gradient(circle at 88% 8%,
      color-mix(in srgb, var(--theme-secondary) 20%, transparent),
      transparent 30%),
    radial-gradient(circle at 54% 48%,
      color-mix(in srgb, var(--theme-secondary-dark) 12%, transparent),
      transparent 32%),
    linear-gradient(135deg,
      color-mix(in srgb, var(--theme-background-light) 96%, transparent),
      color-mix(in srgb, var(--theme-background) 98%, transparent));
  border: 1px solid color-mix(in srgb, var(--theme-secondary) 16%, transparent);
  overflow: hidden;
  box-sizing: border-box;
}

.tab-card-glow {
  position: absolute;
  width: 360px;
  height: 360px;
  right: -120px;
  top: -120px;
  border-radius: 50%;
  background: radial-gradient(circle,
      color-mix(in srgb, var(--theme-secondary) 28%, transparent),
      transparent 68%);
  pointer-events: none;
}

.tab-card-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1;
  margin-bottom: 10px;
}

.tab-card-header h2 {
  margin: 0;
  font-size: var(--app-font-size-section-title);
  line-height: 1.2;
  color: var(--theme-text-primary);
}

.tab-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  text-align: left;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
}

.tab-content.cover-content {
  overflow: hidden;
  padding-right: 0;
}

.tab-content.cover-content .title-cover-step {
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.tab-footer {
  position: relative;
  z-index: 0;
  padding-top: 18px;
  border-top: 1px solid var(--theme-overlay-light);
}

.single-progress {
  position: relative;
  height: 8px;
  margin-bottom: 20px;
  border-radius: 999px;
  background: var(--theme-overlay-light);
  overflow: hidden;
  box-shadow: inset 0 0 10px var(--theme-shadow-dark);
}

.single-progress:before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at 50% 50%, var(--theme-overlay-medium), transparent 58%);
  opacity: 0.45;
  animation: progressGlow-a15f017a 1.6s ease-in-out infinite;
  pointer-events: none;
}

.single-progress-fill {
  position: relative;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg,
      var(--theme-secondary),
      var(--theme-primary),
      var(--theme-info),
      var(--theme-secondary));
  background-size: 220% 100%;
  box-shadow:
    0 0 18px color-mix(in srgb, var(--theme-secondary) 55%, transparent),
    0 0 28px color-mix(in srgb, var(--theme-primary) 28%, transparent);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: progressFlow 2.4s linear infinite;
  overflow: hidden;
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.footer-btn {
  min-width: 128px;
  height: 48px;
  border: none;
  border-radius: 14px;
  color: var(--theme-text-primary);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.footer-btn.secondary {
  background: var(--theme-overlay-light);
}

.footer-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.footer-btn.primary {
  background: linear-gradient(90deg, var(--theme-secondary), var(--theme-primary));
  box-shadow: 0 10px 24px color-mix(in srgb, var(--theme-primary) 28%, transparent);
}

.final-copy-status {
  min-width: 0;
  flex: 1;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--theme-overlay-light);
  border: 1px solid var(--theme-border-light);
  color: var(--theme-text-muted);
  box-sizing: border-box;
}

.status-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--theme-text-muted);
  box-shadow: 0 0 10px color-mix(in srgb, var(--theme-text-muted) 35%, transparent);
}

.status-label,
.status-value {
  flex-shrink: 0;
  font-size: var(--app-font-size-caption);
  font-weight: 800;
  line-height: 1;
}

.status-label {
  color: var(--theme-text-muted);
}

.status-value {
  color: var(--theme-text-secondary);
}

.status-preview {
  min-width: 0;
  max-width: 360px;
  overflow: hidden;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.final-copy-status.confirmed {
  color: var(--theme-success);
  border-color: var(--theme-alert-success-border);
  background: var(--theme-alert-success-bg);
}

.final-copy-status.confirmed .status-dot {
  background: var(--theme-success);
  box-shadow: 0 0 12px color-mix(in srgb, var(--theme-success) 60%, transparent);
}

.final-copy-status.confirmed .status-value {
  color: var(--theme-success);
}

.tab-content .benchmark-step {
  height: 100%;
  min-height: 620px;
  flex: 1 1 auto;
  overflow: visible;
}

.benchmark-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tab-content .benchmark-tabs,
.tab-content .ip-brain-layout,
.tab-content .publish-layout,
.tab-content .rewrite-layout,
.tab-content .title-cover-layout,
.tab-content .video-layout,
.tab-content .viral-layout {
  height: auto;
  min-height: 0;
  flex: 0 0 auto;
}

.tab-content .benchmark-step,
.tab-content .publish-step,
.tab-content .rewrite-step,
.tab-content .title-cover-step,
.tab-content .video-step,
.tab-content .viral-edit-step,
.tab-content .voice-step {
  height: auto;
  min-height: 100%;
  flex: 0 0 auto;
  overflow: visible;
}

.tab-content .benchmark-tabs {
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
}

@keyframes progressFlow {
  0% {
    background-position: 0 50%;
  }

  to {
    background-position: 220% 50%;
  }
}

@keyframes progressPulse {
  0% {
    transform: translateX(-180px) skewX(-18deg);
    opacity: 0;
  }

  25% {
    opacity: 0.9;
  }

  to {
    transform: translateX(90px) skewX(-18deg);
    opacity: 0;
  }
}

@keyframes progressGlow {

  0%,
  to {
    opacity: 0.22;
  }

  50% {
    opacity: 0.58;
  }
}
</style>

<style>
.workflow-left,
.workflow-right {
  position: relative;
  z-index: 1;
}
</style>

<style scoped></style>
