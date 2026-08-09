<template>
  <div class="audio-cropper">
    <!-- 隐藏的音频元素（用于兼容非 blob URL 的情况） -->
    <audio
      v-if="false"
      ref="audioRef"
      :src="audioUrl"
      preload="metadata"
      @loadedmetadata="onLoadedMetadata"
      @error="onError"
    />

    <!-- Wavesurfer 波形容器 -->
    <div class="cropper-controls">
      <div ref="waveformRef" class="waveform-container">
        <div v-if="loading" class="waveform-loading">正在加载音频波形…</div>
        <div v-if="errorMsg" class="waveform-error">{{ errorMsg }}</div>
      </div>

      <!-- 选区覆盖层（视觉指示） -->
      <div v-if="duration > 0" ref="trackRef" class="timeline-track">
        <div
          class="selection-highlight"
          :style="{
            left: (startTime / duration) * 100 + '%',
            width: ((endTime - startTime) / duration) * 100 + '%'
          }"
        />
        <div
          class="handle handle-left"
          :style="{ left: (startTime / duration) * 100 + '%' }"
          @mousedown="startDrag('start', $event)"
          @touchstart="startDrag('start', $event)"
        />
        <div
          class="handle handle-right"
          :style="{ left: (endTime / duration) * 100 + '%' }"
          @mousedown="startDrag('end', $event)"
          @touchstart="startDrag('end', $event)"
        />
      </div>

      <!-- 时间显示 -->
      <div v-if="duration > 0" class="time-display">
        <span class="time-label">起始</span>
        <span class="time-value">{{ formatTime(startTime) }}</span>
        <span class="time-divider">|</span>
        <span class="time-label">时长</span>
        <span
          class="time-duration"
          :class="{ 'time-duration-over': isOverMax, 'time-duration-under': isUnderMin }"
        >
          {{ formatTime(endTime - startTime) }}
        </span>
        <span class="duration-limit">({{ minDuration }}~{{ maxDuration }}s)</span>
        <span class="time-divider">|</span>
        <span class="time-label">结束</span>
        <span class="time-value">{{ formatTime(endTime) }}</span>
      </div>

      <!-- 双滑块 -->
      <div v-if="duration > 0" class="range-sliders">
        <div class="slider-group">
          <label>开始</label>
          <input
            type="range"
            :min="0"
            :max="duration"
            :step="0.05"
            :value="startTime"
            @input="onStartSliderInput"
          />
        </div>
        <div class="slider-group">
          <label>结束</label>
          <input
            type="range"
            :min="0"
            :max="duration"
            :step="0.05"
            :value="endTime"
            @input="onEndSliderInput"
          />
        </div>
      </div>

      <!-- 播放/停止 -->
      <div v-if="duration > 0" class="playback-controls">
        <button
          class="playback-btn"
          :class="{ playing: isPlaying }"
          :title="isPlaying ? '停止' : '试听选区'"
          @click="togglePlayback"
        >
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <span class="playback-hint">试听选区</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick, onUnmounted } from 'vue'
import WaveSurfer from 'wavesurfer.js'

// ----- Props -----
const props = defineProps({
  audioUrl: { type: String, required: true },
  minDuration: { type: Number, default: 5 },
  maxDuration: { type: Number, default: 30 },
  waveColor: { type: String, default: 'rgba(217, 70, 239, 0.45)' },
  progressColor: { type: String, default: '#d946ef' },
  cursorColor: { type: String, default: '#f0abfc' }
})

// ----- Emits -----
const emit = defineEmits(['update:selection', 'loaded', 'error'])

// ----- DOM 引用 -----
const audioRef = ref(null)
const trackRef = ref(null)
const waveformRef = ref(null)

// ----- 状态 -----
const duration = ref(0)
const startTime = ref(0)
const endTime = ref(0)
const isDragging = ref(false)
const dragTarget = ref(null)
const isValidSelection = ref(false)
const loading = ref(true)
const errorMsg = ref('')
const isPlaying = ref(false)

// Wavesurfer 实例
let wavesurfer = null

// ----- 计算属性 -----
const isOverMax = computed(() => endTime.value - startTime.value > props.maxDuration)
const isUnderMin = computed(
  () => duration.value > 0 && endTime.value - startTime.value < props.minDuration
)

// 选区范围
// const selection = computed(() => {
//   if (duration.value === 0) return null
//   return {
//     start: Math.min(startTime.value, endTime.value),
//     end: Math.max(startTime.value, endTime.value)
//   }
// })

// ----- 工具函数 -----
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const total = Math.floor(Math.max(0, seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const clamp = (val, min, max) => Math.max(min, Math.min(max, val))

const checkValidity = () => {
  if (duration.value === 0) {
    isValidSelection.value = false
    return
  }
  const range = endTime.value - startTime.value
  isValidSelection.value = range >= props.minDuration && range <= props.maxDuration
}

const emitSelection = () => {
  if (duration.value === 0) {
    emit('update:selection', null)
    return
  }
  const start = Math.min(startTime.value, endTime.value)
  const end = Math.max(startTime.value, endTime.value)
  const range = end - start
  emit('update:selection', {
    start,
    end,
    duration: range,
    isValid: range >= props.minDuration && range <= props.maxDuration
  })
  checkValidity()
}

// ----- Wavesurfer 初始化 -----
const initWavesurfer = async () => {
  await nextTick()
  if (!waveformRef.value || !props.audioUrl) return

  loading.value = true
  errorMsg.value = ''

  // 销毁旧实例
  if (wavesurfer) {
    try {
      wavesurfer.destroy()
    } catch {
      /* ignore */
    }
    wavesurfer = null
  }

  try {
    wavesurfer = WaveSurfer.create({
      container: waveformRef.value,
      waveColor: props.waveColor,
      progressColor: props.progressColor,
      cursorColor: props.cursorColor,
      height: 56,
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
      normalize: true,
      interact: true,
      backend: 'WebAudio',
      url: props.audioUrl
    })

    wavesurfer.on('ready', () => {
      loading.value = false
      const dur = wavesurfer.getDuration() || 0
      duration.value = dur
      // 默认选区：[0, min(duration, maxDuration)]
      startTime.value = 0
      endTime.value = Math.min(dur, props.maxDuration)
      if (dur < props.minDuration) endTime.value = dur
      emit('loaded', { duration: dur })
      emitSelection()
    })

    wavesurfer.on('play', () => {
      isPlaying.value = true
    })
    wavesurfer.on('pause', () => {
      isPlaying.value = false
    })
    wavesurfer.on('finish', () => {
      isPlaying.value = false
    })
    wavesurfer.on('error', (err) => {
      loading.value = false
      errorMsg.value = '音频加载失败：' + (err?.message || '未知错误')
      emit('error', err instanceof Error ? err : new Error(String(err)))
    })
  } catch (e) {
    loading.value = false
    errorMsg.value = 'Wavesurfer 初始化失败：' + e.message
    emit('error', e)
  }
}

// ----- 播放控制 -----
const togglePlayback = () => {
  if (!wavesurfer) return
  if (isPlaying.value) {
    wavesurfer.pause()
  } else {
    // 播放选区
    const s = Math.min(startTime.value, endTime.value)
    const e = Math.max(startTime.value, endTime.value)
    wavesurfer.play(s, e)
  }
}

// ----- 兼容原 onLoadedMetadata（保留 props.minDuration 默认逻辑） -----
const onLoadedMetadata = () => {
  // 当前实现已迁移至 Wavesurfer.ready，这里保留仅用于旧 audio 元素回调兜底
}

// ----- 兼容原 onError（保留） -----
const onError = (e) => {
  loading.value = false
  errorMsg.value = '音频加载失败，请确认文件格式正确'
  emit('error', e instanceof Error ? e : new Error(String(e)))
}

// ----- 滑块 -----
const onStartSliderInput = (e) => {
  const val = parseFloat(e.target.value)
  const maxStart = Math.max(0, endTime.value - props.minDuration)
  startTime.value = clamp(val, 0, maxStart)
  emitSelection()
}

const onEndSliderInput = (e) => {
  const val = parseFloat(e.target.value)
  const minEnd = Math.min(duration.value, startTime.value + props.minDuration)
  endTime.value = clamp(val, minEnd, duration.value)
  emitSelection()
}

// ----- 拖拽手柄 -----
const startDrag = (target, event) => {
  event.preventDefault()
  isDragging.value = true
  dragTarget.value = target

  const onMove = (e) => {
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
    updateHandlePosition(clientX)
  }

  const onEnd = () => {
    isDragging.value = false
    dragTarget.value = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
    enforceRangeConstraints()
    emitSelection()
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
  document.addEventListener('touchmove', onMove, { passive: true })
  document.addEventListener('touchend', onEnd, { passive: true })
}

const updateHandlePosition = (clientX) => {
  const track = trackRef.value
  if (!track) return
  const rect = track.getBoundingClientRect()
  const percent = clamp((clientX - rect.left) / rect.width, 0, 1)
  const time = percent * duration.value

  if (dragTarget.value === 'start') {
    const maxStart = Math.max(0, endTime.value - props.minDuration)
    startTime.value = clamp(time, 0, maxStart)
  } else if (dragTarget.value === 'end') {
    const minEnd = Math.min(duration.value, startTime.value + props.minDuration)
    endTime.value = clamp(time, minEnd, duration.value)
  }
  emitSelection()
}

const enforceRangeConstraints = () => {
  const range = endTime.value - startTime.value
  if (range < props.minDuration) {
    if (endTime.value + props.minDuration <= duration.value) {
      endTime.value = startTime.value + props.minDuration
    } else {
      startTime.value = endTime.value - props.minDuration
    }
  }
  if (range > props.maxDuration) {
    if (startTime.value + props.maxDuration <= duration.value) {
      endTime.value = startTime.value + props.maxDuration
    } else {
      startTime.value = endTime.value - props.maxDuration
    }
  }
}

// ----- 监听 audioUrl 变化 -----
watch(
  () => props.audioUrl,
  (newUrl, oldUrl) => {
    if (newUrl && newUrl !== oldUrl) {
      duration.value = 0
      startTime.value = 0
      endTime.value = 0
      isValidSelection.value = false
      initWavesurfer()
    }
  },
  { immediate: true }
)

// ----- 清理 -----
onUnmounted(() => {
  if (wavesurfer) {
    try {
      wavesurfer.destroy()
    } catch {
      /* ignore */
    }
    wavesurfer = null
  }
  if (props.audioUrl && props.audioUrl.startsWith('blob:')) {
    URL.revokeObjectURL(props.audioUrl)
  }
})
</script>

<style scoped>
.audio-cropper {
  width: 100%;
  padding: 8px 0;
}

.cropper-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ============================================================
   Wavesurfer 波形容器
   ============================================================ */
.waveform-container {
  position: relative;
  width: 100%;
  min-height: 56px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  padding: 4px 8px;
}
.waveform-container :deep(.wavesurfer-container) {
  background: transparent;
}
.waveform-loading,
.waveform-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #9ca3af;
  pointer-events: none;
}
.waveform-error {
  color: #f87171;
}

/* ============================================================
   时间轴轨道（选区 + 手柄覆盖层）
   ============================================================ */
.timeline-track {
  position: relative;
  width: 100%;
  height: 28px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  overflow: visible;
  user-select: none;
}

.selection-highlight {
  position: absolute;
  top: 0;
  height: 100%;
  background: linear-gradient(180deg, rgba(217, 70, 239, 0.35) 0%, rgba(124, 58, 237, 0.25) 100%);
  border-left: 2px solid #d946ef;
  border-right: 2px solid #d946ef;
  pointer-events: none;
  border-radius: 4px;
}

.handle {
  position: absolute;
  top: -4px;
  width: 12px;
  height: 36px;
  background: linear-gradient(135deg, #9333ea, #d946ef);
  cursor: ew-resize;
  border-radius: 3px;
  transform: translateX(-50%);
  z-index: 2;
  box-shadow: 0 4px 12px -2px rgba(217, 70, 239, 0.6);
}
.handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 16px;
  background: #fff;
  border-radius: 2px;
}
.handle:hover {
  filter: brightness(1.2);
}

/* ============================================================
   时间显示
   ============================================================ */
.time-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #9ca3af;
  font-family: ui-monospace, SFMono-Regular, monospace;
  padding: 0 2px;
}
.time-label {
  color: #6b7280;
}
.time-value {
  color: #f0abfc;
  font-weight: 600;
}
.time-divider {
  color: rgba(255, 255, 255, 0.1);
}
.time-duration {
  font-weight: 700;
  color: #f3f4f6;
}
.time-duration-under {
  color: #fbbf24;
}
.time-duration-over {
  color: #f87171;
}
.duration-limit {
  color: #6b7280;
  font-size: 11px;
}

/* ============================================================
   双滑块
   ============================================================ */
.range-sliders {
  display: flex;
  gap: 14px;
}
.slider-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider-group label {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
  width: 30px;
}
.slider-group input[type='range'] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
}
.slider-group input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9333ea, #d946ef);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(217, 70, 239, 0.5);
}
.slider-group input[type='range']::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9333ea, #d946ef);
  cursor: pointer;
  border: none;
}

/* ============================================================
   播放控制
   ============================================================ */
.playback-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.playback-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f0abfc;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.playback-btn:hover {
  background: rgba(217, 70, 239, 0.18);
  border-color: rgba(217, 70, 239, 0.5);
}
.playback-btn.playing {
  background: linear-gradient(135deg, #9333ea, #d946ef);
  border-color: transparent;
  color: #fff;
}
.playback-hint {
  font-size: 12px;
  color: #9ca3af;
}
</style>
