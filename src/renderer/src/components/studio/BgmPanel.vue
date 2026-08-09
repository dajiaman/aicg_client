<template>
  <div class="bgm-panel">
    <!-- ===== 来源选择 ===== -->
    <div class="seg-row">
      <span>音乐来源</span>
      <a-segmented v-model:value="localSource" :options="sourceOptions" size="small" @change="handleSourceChange" />
    </div>

    <!-- ===== 本地上传模式 ===== -->
    <div v-if="localSource === 'upload'" class="upload-row">
      <a-input v-model:value="localPath" placeholder="选择本地音乐文件" readonly />
      <a-button @click="$emit('select-upload')">上传</a-button>
    </div>

    <!-- ===== 系统库模式 ===== -->
    <div v-else class="library">
      <!-- 未选择音乐时的默认项 -->
      <button class="bgm-item ai-bgm-item" :class="{ active: !config.path }" type="button"
        @click="$emit('select-resource', '')">
        <span>AI 自动匹配</span>
        <small>根据文案选择系统音乐</small>
      </button>

      <!-- 音乐列表（带分类折叠） -->
      <a-spin :spinning="loading">
        <a-collapse v-if="bgmList.length" ghost accordion>
          <a-collapse-panel v-for="group in groupedBgmList" :key="group.category" :header="group.category">
            <button v-for="item in group.items" :key="item.path" type="button" class="bgm-item"
              :class="{ active: config.path === item.path }" @click="$emit('select-resource', item.path)">
              <span :title="item.name">{{ item.name }}</span>
              <a-button size="small" type="text" @click.stop="$emit('preview', item.path)">
                {{ previewingPath === item.path ? '暂停' : '试听' }}
              </a-button>
            </button>
          </a-collapse-panel>
        </a-collapse>
        <a-empty v-else description="暂无系统音乐" />
      </a-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  /** BGM 配置对象 */
  config: {
    type: Object,
    required: true
  },
  /** BGM 列表数据（来自系统库） */
  bgmList: {
    type: Array,
    default: () => []
  },
  /** 是否正在加载 */
  loading: {
    type: Boolean,
    default: false
  },
  /** 当前正在试听的音乐路径（用于显示暂停状态） */
  previewingPath: {
    type: String,
    default: ''
  }
})

// ============================================================
// 2. Emits
// ============================================================
const emit = defineEmits([
  'select-upload', // 选择本地上传
  'select-resource', // 选择系统资源（传入路径或空字符串）
  'preview' // 试听/暂停（传入路径）
])

// ============================================================
// 3. 本地状态
// ============================================================
const localSource = ref(props.config.source || 'system')
const localPath = ref(props.config.path || '')

// ============================================================
// 4. 常量
// ============================================================
const sourceOptions = [
  { label: '系统库', value: 'system' },
  { label: '本地上传', value: 'upload' }
]

// ============================================================
// 5. 计算属性：按分类分组
// ============================================================
const groupedBgmList = computed(() => {
  const groups = {}
  props.bgmList.forEach((item) => {
    const category = item.name || '默认分类'
    if (!groups[category]) groups[category] = []
    groups[category] = item.files || []
  })
  return Object.keys(groups).map((key) => ({
    category: key,
    items: groups[key]
  }))
})

// ============================================================
// 6. 事件处理方法
// ============================================================
function handleSourceChange(val) {
  localSource.value = val
  props.config.source = val
  // 切换来源时重置路径
  if (val === 'system') {
    // 切换到系统库，默认选中 AI 自动匹配
    emit('select-resource', '')
  } else {
    // 切换到本地上传，清空路径
    localPath.value = ''
    props.config.path = ''
  }
}

// ============================================================
// 7. 同步外部配置变化到本地
// ============================================================
watch(
  () => props.config.source,
  (val) => {
    if (val && val !== localSource.value) {
      localSource.value = val
    }
  },
  { immediate: true }
)

watch(
  () => props.config.path,
  (val) => {
    if (val !== undefined && val !== localPath.value) {
      localPath.value = val || ''
    }
  },
  { immediate: true }
)

// 暴露给父组件（如果需要）
defineExpose({
  reset: () => {
    localSource.value = 'system'
    localPath.value = ''
  }
})
</script>

<style scoped>
.bgm-panel {
  display: grid;
  gap: 12px
}

.seg-row,
.upload-row {
  display: flex;
  align-items: center;
  gap: 10px
}

.seg-row {
  justify-content: space-between
}

.seg-row span {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 900
}

.upload-row .ant-input {
  flex: 1
}

.upload-row .ant-btn {
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border: none;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--theme-secondary) 35%, transparent);
  transition: opacity .2s, box-shadow .2s
}

.upload-row .ant-btn:hover {
  opacity: .88;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--theme-secondary) 50%, transparent)
}

.library {
  height: 100%;
  overflow: auto;
  border-radius: 12px;
  background: color-mix(in srgb, var(--theme-background-light) 42%, transparent)
}

.bgm-item {
  width: 100%;
  padding: 8px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--theme-text-secondary);
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  text-align: left
}

.bgm-item.active {
  color: var(--theme-text-primary);
  background: color-mix(in srgb, var(--theme-primary) 24%, transparent)
}

.bgm-item span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap
}

.ai-bgm-item {
  margin: 8px;
  width: calc(100% - 16px);
  border: 1px solid color-mix(in srgb, var(--theme-primary) 24%, transparent);
  background: color-mix(in srgb, var(--theme-primary) 10%, transparent)
}

.ai-bgm-item small {
  flex-shrink: 0;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-micro);
  font-weight: 800
}

.ant-input::-moz-placeholder {
  color: var(--theme-text-secondary);
  opacity: .45
}

.ant-input::placeholder {
  color: var(--theme-text-secondary);
  opacity: .45
}

.ant-segmented {
  background: color-mix(in srgb, var(--theme-background-lighter) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-secondary) 25%, transparent);
  border-radius: 8px;
  padding: 3px;
  color: var(--theme-text-muted)
}

.ant-segmented-item {
  color: var(--theme-text-muted);
  border-radius: 6px;
  transition: color .2s
}

.ant-segmented-item:hover:not(.ant-segmented-item-selected) {
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-overlay-medium) 60%, transparent)
}

.ant-segmented-item-selected {
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border-radius: 6px;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--theme-secondary) 35%, transparent)
}

.ant-segmented-item-label {
  color: inherit
}

.ant-segmented-thumb {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border-radius: 6px
}
</style>
