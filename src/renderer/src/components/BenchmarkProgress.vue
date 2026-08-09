<template>
  <div class="benchmark-progress-slot bottom-progress">
    <div class="benchmark-progress" v-show="loading">
      <div class="progress-dot"></div>
      <span>{{ text ? text : '正在处理中' }}</span>
      <div class="progress-track">
        <div class="progress-runner"></div>
      </div>
    </div>
  </div>
</template>

<script setup>


const props = defineProps({
  /**
   * 是否显示加载状态
   */
  loading: {
    type: Boolean,
    default: false
  },
  /**
   * 显示的提示文本
   */
  text: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.benchmark-progress-slot {
  height: 38px;
  min-height: 38px;
}

.bottom-progress {
  margin-top: 14px;
  flex-shrink: 0;
}

.benchmark-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 8px 12px;
  border-radius: 12px;
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-primary) 10%, transparent);
  box-shadow: inset 0 0 18px color-mix(in srgb, var(--theme-secondary) 8%, transparent);
  overflow: hidden;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--theme-secondary);
  box-shadow: 0 0 12px color-mix(in srgb, var(--theme-secondary) 80%, transparent);
  animation: dotPulse 1.2s ease-in-out infinite;
}

.progress-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.progress-track {
  position: relative;
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: var(--theme-overlay-light);
  overflow: hidden;
}

.progress-runner {
  position: absolute;
  inset: 0 auto 0 0;
  width: 42%;
  border-radius: inherit;
  background: linear-gradient(90deg,
      transparent,
      var(--theme-secondary),
      var(--theme-info),
      transparent);
  animation: progressSlide 1.4s ease-in-out infinite;
}

@keyframes progressSlide {
  0% {
    transform: translateX(-110%);
  }

  to {
    transform: translateX(260%);
  }
}

@keyframes dotPulse {

  0%,
  to {
    opacity: 0.55;
    transform: scale(0.9);
  }

  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}
</style>
