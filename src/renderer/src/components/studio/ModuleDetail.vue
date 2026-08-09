<template>
  <div class="module-detail">
    <!-- 标题区域 -->
    <div class="detail-head">
      <div class="detail-title">
        <h3>{{ title }}</h3>
        <p v-if="summary">{{ summary }}</p>
      </div>
    </div>

    <!-- 内容区域（插槽） -->
    <div class="detail-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
// ============================================================
// 1. Props
// ============================================================
defineProps({
  /** 模块标题 */
  title: {
    type: String,
    required: true,
  },
  /** 模块状态摘要（显示在标题下方） */
  summary: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.module-detail {
  flex: 1;
  min-width: 0;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 标题区域 ===== */
.detail-head {
  padding: 14px 18px 12px 18px;
  border-bottom: 1px solid #e8e8e8;
  background: #f5f5f5;
  flex-shrink: 0;
}

.detail-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.detail-title p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #999;
  line-height: 1.4;
}

/* ===== 内容区域 ===== */
.detail-body {
  flex: 1;
  padding: 16px 18px 18px 18px;
  overflow-y: auto;
  background: #fff;
}

/* ===== 滚动条美化 ===== */
.detail-body::-webkit-scrollbar {
  width: 4px;
}
.detail-body::-webkit-scrollbar-track {
  background: transparent;
}
.detail-body::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 4px;
}
.detail-body::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .detail-head {
    padding: 10px 14px 8px 14px;
  }
  .detail-title h3 {
    font-size: 15px;
  }
  .detail-body {
    padding: 12px 14px 14px 14px;
  }
}
</style>
