<template>
  <div class="source-panel">
    <!-- ===== 音频参数配置 ===== -->
    <div class="control-grid">
      <!-- 人声音量 -->
      <label>
        <span>人声音量</span>
        <a-slider v-model:value="config.voiceVolume" :min="0" :max="5" :step="0.1" class="volume-slider" />
        <b>{{ Number(config.voiceVolume).toFixed(1) }}</b>
      </label>

      <!-- 背景音乐音量 -->
      <label>
        <span>BGM音量</span>
        <a-slider v-model:value="config.bgmVolume" :min="0" :max="2" :step="0.1" class="volume-slider" />
        <b>{{ Number(config.bgmVolume).toFixed(1) }}</b>
      </label>

      <!-- 播放速度 -->
      <label>
        <span>视频倍速</span>
        <a-select v-model:value="config.playbackRate" :options="speedOptions" size="small" style="width: 100px" />
        <b>{{ config.playbackRate }}x</b>
      </label>
    </div>

    <!-- ===== 静音裁剪 ===== -->
    <div class="silence-row">
      <a-switch v-model:checked="config.silenceRemoval.enabled"  />
      <span>剪气口</span>
      <small v-if="!config.silenceRemoval.enabled">自动移除静音片段，增强短视频节奏</small>

      <a-input-number v-model:value="config.silenceRemoval.threshold" :min="-60" :max="-10" :step="1" addon-after="dB"
        size="small" />

      <a-input-number v-model:value="config.silenceRemoval.minDuration" :min="0.1" :max="2" :step="0.1" addon-after="秒"
        size="small" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// ============================================================
// 1. Props
// ============================================================
const props = defineProps({
  /** 配置对象（包含 source 下的所有参数） */
  config: {
    type: Object,
    required: true
  },
  /** 视频完整路径（用于 title 提示） */
  displayVideoPath: {
    type: String,
    default: ''
  },
  /** 视频文件名（显示用） */
  displayVideoName: {
    type: String,
    default: ''
  },
  /** 是否显示视频源信息区域 */
  showSource: {
    type: Boolean,
    default: false
  }
})

// ============================================================
// 2. Emits
// ============================================================
defineEmits(['select-video'])

// ============================================================
// 3. 计算属性：速度选项
// ============================================================
const speedOptions = computed(() => {
  return [0.75, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0].map((val) => ({
    label: val + 'x',
    value: val
  }))
})
</script>

<style scoped>

.source-panel{
    display: grid;
    gap: 14px
}

.source-row{
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    border-radius: 14px;
    background: color-mix(in srgb,var(--theme-background-light) 46%,transparent)
}

.source-row div{
    min-width: 0;
    display: grid;
    gap: 4px
}

.control-grid span[data-v-7d1f5afc],.silence-row span[data-v-7d1f5afc],.source-row span{
    color: var(--theme-text-muted);
    font-size: var(--app-font-size-caption);
    font-weight: 900
}

.source-row b{
    color: var(--theme-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap
}

.control-grid{
    display: grid;
    gap: 10px
}

.control-grid label{
    display: grid;
    grid-template-columns: 70px minmax(0,1fr) 48px;
    align-items: center;
    gap: 8px
}

.control-grid b{
    color: var(--theme-text-secondary);
    text-align: right
}

.silence-row{
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap
}

.silence-row small{
    color: var(--theme-text-muted)
}

</style>
