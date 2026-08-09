<template>
  <header class="studio-header">
    <div class="source-info">
      <span>视频源</span>
      <div class="source-file-row">
        <b :title="displayVideoPath">
          {{ displayVideoName || '自动使用上一步数字人视频或手动选择' }}
        </b>
        <button class="source-change-action" type="button" @click="$emit('select-video')">
          修改
        </button>
      </div>
    </div>

    <div class="header-actions">
      <!-- 生成字幕按钮 -->
      <a-button :disabled="buttonState.generateData.disabled" :loading="buttonState.generateData.loading"
        @click="$emit('generate-data')">
        {{ buttonState.generateData.label }}
      </a-button>

      <!-- 编辑字幕按钮 -->
      <a-button :disabled="!canGenerate || buttonState.editSubtitles.disabled" @click="$emit('edit-subtitles')">
        编辑字幕
      </a-button>

      <!-- 生成视频按钮（主要操作） -->
      <a-button type="primary" :disabled="buttonState.generateVideo.disabled"
        :loading="buttonState.generateVideo.loading" @click="$emit('generate-video')">
        剪辑视频
      </a-button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 当前视频的完整路径（用于 title 提示） */
  displayVideoPath: {
    type: String,
    default: ''
  },
  /** 显示的视频文件名（不含路径） */
  displayVideoName: {
    type: String,
    default: ''
  },
  /** 是否满足生成条件（有视频源） */
  canGenerate: {
    type: Boolean,
    default: false
  },
  /** 是否正在生成字幕数据 */
  dataGenerating: {
    type: Boolean,
    default: false
  },
  /** 是否正在生成视频 */
  videoGenerating: {
    type: Boolean,
    default: false
  }
})

// ============================================================
// 2. Emits
// ============================================================
const emit = defineEmits([
  'select-video', // 选择/修改视频源
  'generate-data', // 生成字幕数据
  'edit-subtitles', // 编辑字幕
  'generate-video' // 生成视频
])

/**
 * 操作按钮状态
 */
const buttonState = computed(() => {
  const isGenerating = props.dataGenerating || props.videoGenerating

  return {
    // 生成字幕按钮
    generateData: {
      disabled: !props.canGenerate || props.videoGenerating,
      loading: props.dataGenerating,
      label: props.dataGenerating ? '生成字幕中...' : '生成字幕'
    },
    // 编辑字幕按钮
    editSubtitles: {
      disabled: isGenerating
    },
    // 生成视频按钮
    generateVideo: {
      disabled: !props.canGenerate || props.dataGenerating,
      loading: props.videoGenerating,
      label: props.videoGenerating ? '剪辑中...' : '生成视频'
    }
  }
})
</script>

<style lang="scss" scoped>
.studio-header {
  flex-shrink: 0;
  min-height: 66px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 20px;
  border: 1px solid var(--theme-overlay-light);
  background: color-mix(in srgb, var(--theme-overlay-light) 84%, transparent);
}

.source-info {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 4px;
}

.source-info span {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
}

.source-info b {
  min-width: 0;
  color: var(--theme-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-file-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-change-action {
  flex-shrink: 0;
  height: 24px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--theme-info) 24%, transparent);
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-primary-light) 16%, transparent);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
}

.source-change-action[data-v-af8b9e72]:hover {
  color: var(--theme-primary);
  border-color: color-mix(in srgb, var(--theme-primary) 42%, transparent);
  background: color-mix(in srgb, var(--theme-primary-light) 24%, transparent);
}

.header-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-actions .ant-btn:not(.ant-btn-primary) {
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-overlay-medium) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-secondary) 28%, transparent);
  border-radius: 8px;
  font-weight: 600;
}

.header-actions .ant-btn:not(.ant-btn-primary):hover:not(:disabled) {
  color: var(--theme-text-primary);
  border-color: color-mix(in srgb, var(--theme-secondary) 55%, transparent);
  background: color-mix(in srgb, var(--theme-secondary) 14%, transparent);
}

.header-actions .ant-btn-primary {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border: none;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--theme-secondary) 35%, transparent);
}

.header-actions .ant-btn-primary:hover:not(:disabled) {
  opacity: 0.88;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--theme-secondary) 50%, transparent);
}

.header-actions .ant-btn.ant-btn-disabled,
.header-actions .ant-btn:disabled {
  color: var(--theme-text-muted) !important;
  background: color-mix(in srgb, var(--theme-overlay-light) 160%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-overlay-medium) 60%, transparent) !important;
  box-shadow: none !important;
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
