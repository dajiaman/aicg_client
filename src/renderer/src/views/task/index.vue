<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { usePipeline } from '../../hooks/usePipeline'
import { useWorkflowStore } from '../../store/workflow'
import { QuestionCircleOutlined, ReloadOutlined } from '@ant-design/icons-vue'

const router = useRouter()

const { resetWorkflow, updatePipelineData } = usePipeline()
const workflowStore = useWorkflowStore()

const tasks = ref([])
const stats = reactive({ total: 0, running: 0, success: 0, failed: 0 })

const loading = ref(true)

const selected = ref(null)
const detailLoading = ref(false)
const filterStatus = ref('all')
const filterMode = ref('all')

const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0) // 后端返回的总数（a-pagination 用）
const detailOpen = ref(false) // 详情弹窗开关

const STATUS_MAP = {
  completed: { label: '成功', color: 'success' },
  failed: { label: '失败', color: 'error' },
  processing: { label: '处理中', color: 'processing' },
  pending: { label: '待处理', color: 'pending' }
}

// mode
const MODE_OPTIONS = [
  { value: 'all', label: '执行模式' },
  { value: 'manual', label: '手动模式' },
  { value: 'auto', label: '自动模式' },
  { value: 'background', label: '后台模式' }
]

// status
const STATUS_OPTIONS = [
  { value: 'all', label: '任务状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '运行成功' },
  { value: 'failed', label: '运行失败' }
]

function statusInfo(s) {
  return STATUS_MAP[s] || { label: s || '未知', color: 'default' }
}

function getModeTagText(key) {
  const map = {
    manual: '手动',
    auto: '自动',
    background: '后台'
  }
  return map[key] ?? ''
}

/**
 * 当前页的任务（后端已过滤 + 分页完成）
 */
const paged = computed(() => {
  return tasks.value.map((t) => ({
    ...t,
    key: t.id || t.job_id
  }))
})

// 过滤条件或分页变化时，重新从服务端加载（合并 watcher，避免多次触发）
let loadSeq = 0
async function reloadTasks({ resetPage = false } = {}) {
  if (resetPage) currentPage.value = 1
  const seq = ++loadSeq
  loading.value = true
  try {
    const res = await window.api.task.list({
      status: filterStatus.value === 'all' ? undefined : filterStatus.value,
      mode: filterMode.value === 'all' ? undefined : filterMode.value,
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    })

    // 丢弃过期请求
    if (seq !== loadSeq) return

    const data = res?.data ?? res
    if (data?.rows) {
      tasks.value = data.rows
      totalCount.value = data.total ?? data.rows.length
    } else if (Array.isArray(data)) {
      tasks.value = data
      totalCount.value = data.length
    } else {
      tasks.value = []
      totalCount.value = 0
    }
    await loadTaskStats()
  } catch (err) {
    if (seq !== loadSeq) return
    console.log('加载失败', err)
    message.error(err.message)
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

// 过滤变化：重置页码 + 重新加载
watch([filterStatus, filterMode], () => reloadTasks({ resetPage: true }))

// 分页变化：仅重新加载（不重置页码）
watch([currentPage, pageSize], () => reloadTasks())

function resetFilter() {
  filterStatus.value = 'all'
  filterMode.value = 'all'
}

// 保留给"刷新"按钮直接调用
async function loadTasks() {
  return reloadTasks()
}

async function openDetail(task) {
  detailOpen.value = true
  detailLoading.value = true
  selected.value = { id: task.id }
  try {
    // 后端 IPC 返回 { success: true, data: { task, steps } }
    const r = await window.api.task.detail(task.id)
    const data = r?.data ?? r
    // data 可能是 { task, steps } 或扁平对象
    const taskObj = data?.task ?? data
    const stepArr = data?.steps ?? taskObj?.steps ?? []
    selected.value = { id: task.id, ...taskObj, steps: stepArr }
  } catch (e) {
    console.log('详情失败', e)
    message.error(e.message)
  } finally {
    detailLoading.value = false
  }
}

/**
 * 关闭弹窗（仅改 detailOpen，让 v-model 双向绑定的内部状态同步）
 * selected 不要在这里清，否则会触发 modal 卸载导致关不掉
 */
function closeDetail() {
  detailOpen.value = false
}

/** 弹窗关闭动画结束后再清数据，避免卸载冲突 */
watch(detailOpen, (val) => {
  if (!val) {
    // 关闭后清掉 selected（用 setTimeout 错开动画结束）
    setTimeout(() => {
      if (!detailOpen.value) selected.value = null
    }, 300)
  }
})

/**
 * 新建任务：跳转到工作台并开始全新工作流
 */
const handleCreateTask = () => {
  resetWorkflow()
  router.push('/')
}

/**
 * 继续
 * @param task
 */
async function rerun(task) {
  try {
    const detailRes = await window.api.task.detail(task.id)
    if (!detailRes.success) return message.error('任务不存在')

    // 恢复任务
    workflowStore.restoreTask(detailRes.data.task, detailRes.data.steps || [])

    router.push({
      path: '/'
    })
  } catch (err) {
    message.error(err.message)
  }
}

/**
 * 删除任务
 * @param task
 */
async function remove(task) {
  if (!confirm(`确定删除任务 ${(task.id || '').slice(0, 8)}？`)) return
  try {
    if (selected.value?.id === task.id) closeDetail()
    await window.api.task.delete(task.id)
    await loadTasks()
  } catch (e) {
    console.log('删除失败', e)
    message.error(e.message)
  }
}

function stepProgress(task) {
  if (typeof task.progress === 'number' && task.progress > 0) {
    return task.progress
  }
  const steps = task.steps || []
  if (!steps.length) return 0
  const done = steps.filter((s) => ['success', 'skipped'].includes(s.status)).length
  return Math.round((done / steps.length) * 100)
}

/**
 * 从 task 推断当前正在跑的步骤名
 */
/**
 * step_name → 中文标签
 * key 是 task_steps 表里的 step_name 字段值
 * （与 workflow.js 里 this.steps 的 key 一致）
 */
const STEP_LABELS = {
  extract: '提取文案',
  rewrite: '重写文案',
  voiceClone: '语音克隆',
  digitalHuman: '数字人',
  videoEdit: '视频剪辑',
  titleCover: '标题与封面',
  publish: '发布'
}

/** current_step（数字索引 1~N）→ 中文标签 */
const STEP_ORDER = [
  'extract',
  'rewrite',
  'voiceClone',
  'digitalHuman',
  'videoEdit',
  'titleCover',
  'publish'
]

const getStepText = (stepIdx) => {
  // 数字索引 → step_name → 中文标签
  const name = STEP_ORDER[stepIdx - 1]
  return name ? STEP_LABELS[name] : '-'
}

/** 步骤状态 → 颜色（用于 a-tag） */
const STEP_STATUS_COLOR = {
  success: 'success',
  failed: 'error',
  running: 'processing',
  pending: 'default',
  skipped: 'warning',
  error: 'error'
}

const stepStatusColor = (s) => STEP_STATUS_COLOR[s] || 'default'

/** 步骤状态 → 文字 */
const STEP_STATUS_LABEL = {
  success: '已完成',
  failed: '失败',
  running: '进行中',
  pending: '待处理',
  processing: '处理中',
  skipped: '已跳过',
  error: '失败'
}
const stepStatusLabel = (s) => STEP_STATUS_LABEL[s] || s || '未知'

/**
 * 执行模式 → 中文
 * （与 workflow.js setExecutionMode() 接受的 mode 值一致）
 */
const MODE_LABEL = {
  manual: '手动模式',
  auto: '自动模式',
  background: '后台模式'
}
const modeLabel = (m) => MODE_LABEL[m] || m || '手动模式'

const loadTaskStats = async () => {
  try {
    const res = await window.api.task.stats()
    if (res?.data) {
      Object.assign(stats, res.data)
      totalCount.value = res.data.total;
    }
  } catch (e) {
    console.log('stats load failed', e)
  }
}

/** 表格列定义（用 slot 渲染，不用 JSX） */
const tableColumns = [
  {
    title: '任务标题',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
    width: 300,
    slots: { customRender: 'titleCell' }
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'left',
    slots: { customRender: 'statusCell' }
  },
  {
    title: '进度',
    dataIndex: 'progress',
    key: 'progress',
    width: 200,
    slots: { customRender: 'progressCell' }
  },
  {
    title: '当前步骤',
    dataIndex: 'currentStep',
    key: 'currentStep',
    ellipsis: true,
    width: 120,
    slots: { customRender: 'currentStepCell' }
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    slots: { customRender: 'createdAtCell' }
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    align: 'center',
    slots: { customRender: 'actionsCell' }
  }
]

onMounted(() => {
  loadTasks()
})
</script>

<template>
  <div class="task-center">
    <header class="page-header">
      <div class="header-left">
        <h2>
          <span class="header-icon">📊</span>
          任务中心
        </h2>
        <p class="header-subtitle">
          这里存储的任务，如果很久很久没用，或你曾经移动任务里的一些视频音频文件，可能导致再次制作时，失败，请您注意即可。
        </p>
        <div class="header-actions">
          <a-button type="text" class="help-btn" title="查看使用引导">
            <question-circle-outlined />
            帮助
          </a-button>
          <a-button class="action-btn" @click="loadTasks">
            <reload-outlined />
            刷新
          </a-button>
          <a-button type="primary" class="action-btn create-btn" @click="handleCreateTask">
            <plus-outlined />
            新建任务
          </a-button>
        </div>
      </div>
    </header>

    <a-row class="stats-row" :gutter="8">
      <a-col :span="6">
        <div class="stat-card stat-total">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-title">总任务</div>
            <div class="stat-value">{{ stats.total }}</div>
          </div>
        </div>
      </a-col>

      <a-col :span="6">
        <div class="stat-card stat-processing">
          <div class="stat-icon">⚙</div>
          <div class="stat-content">
            <div class="stat-title">进行中</div>
            <div class="stat-value">{{ stats.processing }}</div>
          </div>
        </div>
      </a-col>

      <a-col :span="6">
        <div class="stat-card stat-completed">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-title">已完成</div>
            <div class="stat-value">{{ stats.success }}</div>
          </div>
        </div>
      </a-col>
      <a-col :span="6">
        <div class="stat-card stat-failed">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <div class="stat-title">失败</div>
            <div class="stat-value">{{ stats.failed }}</div>
          </div>
        </div>
      </a-col>
    </a-row>

    <div class="filter-section">
      <div class="filter-label">
        <span class="filter-icon"> 🔍 </span>
        筛选条件
      </div>
      <a-space>
        <a-space-item>
          <a-select class="filter-select" v-model:value="filterStatus">
            <a-select-option v-for="o in STATUS_OPTIONS" :key="o.value" :value="o.value">
              {{ o.label }}
            </a-select-option>
          </a-select>
        </a-space-item>
        <a-space-item>
          <a-select class="filter-select" v-model:value="filterMode">
            <a-select-option v-for="m in MODE_OPTIONS" :key="m.value" :value="m.value">
              {{ m.label }}
            </a-select-option>
          </a-select>
        </a-space-item>

        <a-space-item>
          <a-button type="primary" ghost> 筛选 </a-button>
        </a-space-item>

        <a-space-item>
          <a-button @click="resetFilter">清空</a-button>
        </a-space-item>
      </a-space>
    </div>

    <!-- 任务列表 -->
    <div class="table-container">
      <a-table class="task-table" :columns="tableColumns" :data-source="paged" :loading="loading" :pagination="false"
        :row-key="(r) => r.id" :scroll="{ x: 1100 }" @row-click="(record) => openDetail(record)">
        <!-- 任务标题 -->
        <template #titleCell="{ record }">
          <div class="task-title">
            <div class="title-content">
              <span class="title-text">
                {{ record.title || `任务 ${(record.id || '').slice(0, 8)}` }}
              </span>
              <a-tag color="purple">{{ getModeTagText(record.mode) }}</a-tag>
            </div>
          </div>
        </template>

        <!-- 状态 -->
        <template #statusCell="{ record }">
          <a-tag :color="statusInfo(record.status).color" bordered>
            {{ statusInfo(record.status).label }}
          </a-tag>
        </template>

        <!-- 进度 -->
        <template #progressCell="{ record }">
          <div class="progress-cell">
            <a-progress :percent="stepProgress(record)" size="small" :show-info="false" status="active" />
            <span class="progress-text"> {{ stepProgress(record) }}% </span>
          </div>
        </template>

        <!-- 当前步骤 -->
        <template #currentStepCell="{ record }">
          <a-tag color="blue">{{ getStepText(record.current_step) }}</a-tag>
        </template>

        <!-- 创建时间 -->
        <template #createdAtCell="{ record }">
          <span>{{ dayjs(record.created_at).format('YYYY/MM/DD HH:mm:ss') }}</span>
        </template>

        <!-- 操作 -->
        <template #actionsCell="{ record }">
          <div class="flex items-center justify-center gap-1.5" @click.stop>
            <a-button v-if="record.status !== 'success'" size="small" type="primary" ghost
              @click="rerun(record)">继续</a-button>
            <a-button size="small" @click="openDetail(record)">详情</a-button>
            <a-button size="small" danger ghost @click="remove(record)">删除</a-button>
          </div>
        </template>

        <template #emptyText>
          <a-empty description="暂无任务" />
        </template>
      </a-table>

      <!-- 分页 -->
      <div v-if="totalCount" class="flex items-center justify-end px-5 py-3 border-t border-white/10">
        <a-pagination v-model:current="currentPage" v-model:page-size="pageSize" :total="totalCount"
          :show-size-changer="true" :page-size-options="['10', '20', '50']" :show-total="(total) => `共 ${total} 条记录`"
          />
      </div>
    </div>

    <!-- 详情弹窗（居中弹窗） -->
    <a-modal v-model:open="detailOpen" :footer="null" centered :closable="true" :mask-closable="true"
      class="task-detail-modal" width="calc(100% - 320px)" @cancel="closeDetail">
      <div class="relative">
        <div class="px-6 pb-6">
          <!-- 基本信息卡 -->
          <div class="section-title">基本信息</div>
          <a-descriptions bordered :column="2" size="small">
            <a-descriptions-item label="任务ID">{{ selected.id }}</a-descriptions-item>
            <a-descriptions-item label="执行模式">{{
              modeLabel(selected.mode)
            }}</a-descriptions-item>
            <a-descriptions-item label="任务状态">
              <a-tag :color="statusInfo(selected.status).color">{{
                statusInfo(selected.status).label
              }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="当前步骤">{{
              getStepText(selected.current_step)
            }}</a-descriptions-item>
            <a-descriptions-item label="进度">{{ selected.progress || 0 }}%</a-descriptions-item>
            <a-descriptions-item label="创建时间">{{
              dayjs(selected.created_at).format('YYYY/MM/DD HH:mm:ss')
            }}</a-descriptions-item>
            <a-descriptions-item label="更新时间">{{
              dayjs(selected.updated_at || selected.created_at).format('YYYY/MM/DD HH:mm:ss')
            }}</a-descriptions-item>
            <a-descriptions-item label="任务标题">{{ selected.title || '-' }}</a-descriptions-item>
          </a-descriptions>

          <div class="section-title mt-[20px]">执行历史</div>
          <!-- 执行历史（时间轴） -->
          <div class="rounded-xl border border-white/10 overflow-hidden">
            <div class="p-5 max-h-80 overflow-y-auto">
              <a-timeline class="task-history-timeline">
                <a-timeline-item v-for="(s, i) in selected.steps || []" :key="i" class="task-history-item">
                  <div class="flex flex-col bg-white/3 bg-white/5 rounded-lg px-4 py-2.5 transition">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-white/80">{{
                        STEP_LABELS[s.step_name] || s.step_name
                      }}</span>
                      <a-tag size="small" :color="stepStatusColor(s.status)" bordered>{{
                        stepStatusLabel(s.status)
                      }}</a-tag>
                    </div>
                    <div v-if="s.completed_at" class="text-sm text-gray-400 my-1">
                      完成时间：
                      {{
                        s.completed_at ? dayjs(s.completed_at).format('YYYY/MM/DD HH:mm:ss') : ''
                      }}
                    </div>
                    <div v-if="s.error_message" class="mt-1 text-sm text-red-800 bg-red-300 p-2 rounded-md">
                      {{ s.error_message }}
                    </div>
                  </div>
                </a-timeline-item>
              </a-timeline>
            </div>
          </div>

          <!-- 底部操作 -->
          <div class="flex justify-end gap-2 pt-2">
            <a-button @click="closeDetail">关闭</a-button>
            <a-button @click="remove(selected)" danger>删除任务</a-button>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style lang="scss">
.task-detail-modal .ant-modal-content {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 48px var(--theme-shadow-dark);
}

.task-detail-modal .ant-modal-header {
  background: var(--theme-primary);
  border-bottom: none;
  padding: 16px 20px;
}

.task-detail-modal .ant-modal-title {
  color: var(--theme-text-primary);
}

.task-detail-modal .ant-modal-close {
  color: var(--theme-text-primary) !important;
}

.task-detail-modal .ant-modal-close:hover {
  background-color: var(--theme-overlay-hover);
  border-radius: 8px;
}

.task-detail-modal .ant-modal-content {
  background: var(--theme-background-lighter);
}

.task-detail-modal .ant-modal-body {
  padding: 16px 20px;
  background: var(--theme-background-lighter);
  color: #fff;
}

.task-detail-modal {

  .ant-descriptions .ant-descriptions-item-label,
  .ant-descriptions .ant-descriptions-item-content {
    color: #fff !important;
  }

  .ant-timeline .ant-timeline-item-tail {
    border-color: #fff;
  }

  .ant-tag-default {
    color: #fff;
  }
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--app-font-size-card-title);
  font-weight: 600;
}

.title-icon {
  font-size: var(--app-font-size-page-title);
}

.title-text {
  color: var(--theme-text-primary);
}

.task-detail {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--theme-text-tertiary);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--theme-primary);
}

.section-icon,
.section-title {
  font-size: var(--app-font-size-body);
}

.info-section {
  background: var(--theme-background-card);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 6px var(--theme-shadow-dark);
  margin-bottom: 16px;
}

.info-descriptions .ant-descriptions-item-label {
  background: var(--theme-background-lighter);
  font-weight: 600;
  color: var(--theme-text-secondary);
}

.info-descriptions .ant-descriptions-item-content {
  background: var(--theme-background-card);
  color: var(--theme-text-tertiary);
}

.info-descriptions .ant-tag {
  border-radius: 6px;
  font-weight: 500;
  padding: 2px 12px;
}

.info-descriptions .ant-progress {
  margin: 0;
}

.info-descriptions .ant-progress-bg {
  background: var(--theme-primary);
}

.step-history {
  background: var(--theme-background-card);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 6px var(--theme-shadow-dark);
  margin-bottom: 16px;
}

.step-history .ant-timeline-item {
  padding-bottom: 12px;
}

.step-history .ant-timeline-item-tail {
  border-left: 2px dashed var(--theme-border-gray);
}

.step-item {
  background: var(--theme-background-lighter);
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--theme-border-gray);
  transition: all 0.2s ease;
}

.step-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--theme-shadow-primary);
  border-color: var(--theme-primary);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.step-name {
  font-weight: 600;
  color: var(--theme-text-tertiary);
  font-size: var(--app-font-size-meta);
}

.step-time {
  font-size: var(--app-font-size-caption);
  color: var(--theme-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.step-time:before {
  content: '🕐';
  font-size: var(--app-font-size-body);
}

.step-error {
  margin-top: 6px;
  padding: 6px 10px;
  background: var(--theme-alert-error-bg);
  border-radius: 4px;
  border-left: 2px solid var(--theme-error);
}

.output-files {
  background: var(--theme-background-card);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 6px var(--theme-shadow-dark);
  margin-bottom: 16px;
}

.output-files .ant-list-item {
  background: var(--theme-background-lighter);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid var(--theme-border-gray);
  transition: all 0.2s ease;
}

.output-files .ant-list-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--theme-shadow-primary);
  border-color: var(--theme-primary);
}

.output-files .ant-list-item:last-child {
  margin-bottom: 0;
}

.file-name {
  font-weight: 600;
  color: var(--theme-text-tertiary);
  font-size: var(--app-font-size-meta);
}

.file-path {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  word-break: break-all;
}

.file-size {
  color: var(--theme-text-disabled);
  font-size: var(--app-font-size-caption);
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid var(--theme-border-gray);
}

.output-files .ant-btn-sm {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.output-files .ant-btn-sm:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px var(--theme-shadow-primary-strong);
}

.action-buttons {
  background: var(--theme-background-card);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 6px var(--theme-shadow-dark);
  text-align: right;
}

.action-buttons .ant-btn {
  height: 32px;
  padding: 0 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-buttons .ant-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--theme-shadow-primary);
}

.action-buttons .ant-btn-primary {
  background: var(--theme-primary);
  border: none;
}

.action-buttons .ant-btn-primary:hover {
  background: var(--theme-primary-dark);
}

.action-buttons .ant-btn-dangerous {
  transition: all 0.2s ease;
}

.action-buttons .ant-btn-dangerous:hover {
  box-shadow: 0 2px 8px var(--theme-shadow-primary);
}

.video-preview {
  text-align: center;
  background: var(--theme-background);
  border-radius: 8px;
  overflow: hidden;
}

.video-preview video {
  display: block;
  margin: 0 auto;
  background: var(--theme-background);
}

.video-player {
  width: 100%;
  max-height: 500px;
}

.image-preview {
  text-align: center;
  background: var(--theme-background);
  border-radius: 8px;
  padding: 8px;
}

.preview-image {
  max-width: 100%;
  max-height: 600px;
  -o-object-fit: contain;
  object-fit: contain;
  border-radius: 6px;
  display: block;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .task-detail-modal .ant-modal {
    max-width: calc(100vw - 32px);
    margin: 16px auto;
  }

  .step-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .file-size {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    display: block;
    margin-top: 4px;
  }

  .action-buttons {
    text-align: center;
  }

  .action-buttons .ant-space {
    width: 100%;
    justify-content: center;
  }
}

.publish-video[data-v-55891f68] {
  max-height: 60vh;
  overflow-y: auto;
}

.video-info[data-v-55891f68] {
  margin-bottom: 24px;
}

.publish-form[data-v-55891f68] {
  margin-top: 16px;
}

.group-label[data-v-55891f68] {
  font-weight: 600;
  color: var(--theme-primary);
}

.account-option[data-v-55891f68] {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.platform-tag[data-v-55891f68] {
  margin: 0;
  font-size: var(--app-font-size-micro);
}

.xiaohongshu-publish-alert[data-v-55891f68] {
  margin-top: 10px;
  padding: 8px 10px;
  font-size: var(--app-font-size-micro);
  line-height: 1.45;
  color: var(--theme-tag-warning-text);
  background: var(--theme-alert-warning-bg);
  border: 1px solid var(--theme-alert-warning-border);
  border-radius: 8px;
  box-sizing: border-box;
}

.not-found-content[data-v-55891f68] {
  text-align: center;
  padding: 12px;
}

.not-found-text[data-v-55891f68] {
  color: var(--theme-text-muted);
  margin-bottom: 8px;
  font-size: var(--app-font-size-caption);
}

.publish-form[data-v-55891f68] .ant-select-selector {
  border-radius: 8px;
  border: 2px solid var(--theme-border-gray);
  transition: all 0.3s ease;
}

.publish-form[data-v-55891f68] .ant-select-selector:hover {
  border-color: var(--theme-primary);
}

.publish-form[data-v-55891f68] .ant-select-focused .ant-select-selector {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px var(--theme-shadow-primary);
}

.text-muted[data-v-55891f68] {
  color: var(--theme-text-muted);
  font-style: italic;
}

@media (max-width: 768px) {
  .publish-video[data-v-55891f68] {
    max-height: 70vh;
  }

  .publish-form[data-v-55891f68] .ant-select-selector {
    font-size: var(--app-font-size-body);
  }
}

.task-center {
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px 32px;
  border-radius: 16px;
  box-shadow: 0 8px 32px var(--theme-shadow-dark);
  backdrop-filter: blur(10px);
  border: 1px solid var(--theme-border-purple);
  background: var(--theme-scrollbar-track-light);
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: var(--theme-text-tertiary);
  font-size: var(--app-font-size-page-title);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: var(--app-font-size-page-title);
  animation: float-68b6a324 3s ease-in-out infinite;
}

@keyframes float-68b6a324 {

  0%,
  to {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

.header-subtitle {
  margin: 0;
  color: var(--theme-text-gradient-purple);
  font-size: var(--app-font-size-body);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.help-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--theme-text-gradient-purple);
  font-size: var(--app-font-size-body);
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.help-btn:hover {
  background: var(--theme-overlay-purple-strong);
  color: var(--theme-secondary);
}

.action-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.create-btn {
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  border: none;
}

.create-btn:hover {
  background: linear-gradient(90deg, var(--theme-primary-light), var(--theme-accent));
  box-shadow: 0 4px 12px var(--theme-shadow-primary-stronger);
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  background: var(--theme-scrollbar-track-light);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--theme-border-purple);
  box-shadow: 0 4px 20px var(--theme-shadow-dark);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--theme-shadow-darker);
  border-color: var(--theme-border-purple-light);
}

.stat-icon {
  font-size: 48px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: var(--app-font-size-body);
  color: var(--theme-text-gradient-purple);
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: var(--app-font-size-page-title);
  font-weight: 700;
  line-height: 1;
}

.stat-total .stat-value,
.stat-total {
  color: #1677ff;
}

.stat-processing .stat-value,
.stat-processing {
  color: #faad14;
}

.stat-completed .stat-value,
.stat-completed {
  color: #52c41a;
}

.stat-failed .stat-value,
.stat-failed {
  color: #ff4d4f;
}

.filter-section {
  background: var(--theme-scrollbar-track-light);
  padding: 20px 32px;
  border-radius: 16px;
  border: 1px solid var(--theme-border-purple);
  box-shadow: 0 4px 20px var(--theme-shadow-dark);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.filter-label {
  font-weight: 600;
  color: var(--theme-text-tertiary);
  font-size: var(--app-font-size-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
}

.filter-icon {
  font-size: var(--app-font-size-section-title);
}

.filter-select .ant-select-selector {
  border-radius: 8px;
  border: 2px solid var(--theme-text-tertiary);
  transition: all 0.3s ease;
}

.filter-select:hover .ant-select-selector {
  border-color: var(--theme-primary);
}

.table-container {
  background: var(--theme-scrollbar-track-light);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--theme-border-purple);
  box-shadow: 0 4px 20px var(--theme-shadow-dark);
}

.task-table .ant-table {
  background: transparent;
}

.task-table .ant-table-thead>tr>th {
  font-weight: 600;
  color: var(--theme-text-tertiary) !important;
  border: none;
  font-size: var(--app-font-size-body);
  padding: 16px;
  background: var(--theme-scrollbar-track-light) !important;
}

.task-table .ant-table-thead>tr>th:before {
  display: none;
}

.task-table .ant-table-tbody>tr {
  transition: all 0.3s ease;
}

.task-table .ant-table-tbody>tr>td {
  border-bottom: 1px solid var(--theme-border-purple) !important;
  padding: 16px;
  color: var(--theme-text-tertiary) !important;
  background: var(--theme-overlay-purple) !important;
}

.task-table .ant-table-tbody>tr:hover {
  background: var(--theme-overlay-purple-medium) !important;
  box-shadow: 0 1px 4px var(--theme-shadow-primary);
}

.task-table .ant-table-tbody>tr:hover>td {
  border-bottom-color: var(--theme-border-purple-light) !important;
}

.task-table .ant-pagination {
  margin-top: 24px;
}

.task-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mode-tag {
  flex-shrink: 0;
  white-space: nowrap;
}

.title-text {
  font-weight: 600;
  color: var(--theme-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
  font-size: var(--app-font-size-secondary);
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-cell .ant-progress-bg {
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
}

.progress-text {
  font-size: var(--app-font-size-meta);
  color: var(--theme-text-gradient-purple);
  min-width: 40px;
  font-weight: 600;
}

.task-table .ant-btn-sm {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.task-table .ant-btn-primary {
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  border: none;
}

.task-table .ant-btn-primary:hover {
  background: linear-gradient(90deg, var(--theme-primary-light), var(--theme-accent));
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--theme-shadow-primary-stronger);
}

.task-table .ant-btn-dangerous {
  transition: all 0.3s ease;
}

.task-table .ant-btn-dangerous:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--theme-shadow-primary-strong);
}

.task-table .ant-tag {
  border-radius: 6px;
  font-weight: 500;
  padding: 2px 12px;
  border: none;
}

@media (max-width: 768px) {
  .task-center {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 20px;
  }

  .header-left h2 {
    font-size: var(--app-font-size-page-title);
  }

  .header-actions {
    justify-content: center;
  }

  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    font-size: 36px;
  }

  .stat-value {
    font-size: var(--app-font-size-page-title);
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .filter-label {
    min-width: auto;
  }

  .table-container {
    padding: 16px;
    overflow-x: auto;
  }
}

.ant-select-selector {
  background: var(--theme-scrollbar-track-light) !important;
  border-color: var(--theme-border-purple-light) !important;
}

.ant-select-selection-item,
.ant-select-selection-placeholder,
.ant-select-selector {
  color: var(--theme-text-primary) !important;
}

.ant-select-arrow {
  color: var(--theme-text-gradient-purple) !important;
}

.ant-select:hover .ant-select-selector {
  border-color: var(--theme-border-strong) !important;
}

.ant-select-focused .ant-select-selector {
  border-color: var(--theme-border-purple-light) !important;
  box-shadow: 0 0 0 2px var(--theme-overlay-purple-strong) !important;
}

.ant-select-dropdown {
  background: var(--theme-background-light) !important;
  border: 1px solid var(--theme-border-purple) !important;
}

.ant-select-item {
  color: var(--theme-text-tertiary) !important;
}

.ant-select-item-option-active {
  background: var(--theme-overlay-purple-stronger) !important;
}

.ant-select-item-option-selected {
  background: var(--theme-overlay-purple-strongest) !important;
}

.ant-btn {
  border-radius: 6px;
  font-weight: 500;
}

.ant-btn:not(.ant-btn-primary):not(.ant-btn-text):not(.ant-btn-dangerous) {
  background: var(--theme-scrollbar-track-light);
  border-color: var(--theme-border-purple-light);
  color: var(--theme-text-tertiary);
}

.ant-btn:not(.ant-btn-primary):not(.ant-btn-text):not(.ant-btn-dangerous):hover {
  background: var(--theme-overlay-purple-stronger);
  border-color: var(--theme-border-strong);
  color: var(--theme-secondary);
}

.ant-table {
  background: transparent !important;
}

.ant-pagination {
  color: var(--theme-text-gradient-purple) !important;
}

.ant-pagination-item {
  background: var(--theme-scrollbar-track-light) !important;
  border-color: var(--theme-border-purple) !important;
}

.ant-pagination-item a {
  color: var(--theme-text-tertiary) !important;
}

.ant-pagination-item-active {
  background: var(--theme-overlay-purple-stronger) !important;
  border-color: var(--theme-secondary) !important;
}

.ant-pagination-item-active a {
  color: var(--theme-secondary) !important;
}

.ant-progress-inner {
  background: var(--theme-scrollbar-track-light) !important;
}

.ant-modal-close {
  color: var(--theme-text-primary) !important;
}

.ant-modal-close:hover {
  color: var(--theme-secondary) !important;
  background: var(--theme-overlay-purple-strongest) !important;
}

.ant-modal-close-x {
  color: var(--theme-text-primary) !important;
}
</style>

<style>
.task-table .ant-table {
  background: transparent;
}

.task-table .ant-table-thead>tr>th {
  font-weight: 600;
  color: var(--theme-text-tertiary) !important;
  border: none;
  font-size: var(--app-font-size-body);
  padding: 16px;
  background: var(--theme-scrollbar-track-light) !important;
}

.task-table .ant-table-thead>tr>th:before {
  display: none;
}

.task-table .ant-table-tbody>tr {
  transition: all 0.3s ease;
}

.task-table .ant-table-tbody>tr>td {
  border-bottom: 1px solid var(--theme-border-purple) !important;
  padding: 16px;
  color: var(--theme-text-tertiary) !important;
  background: var(--theme-overlay-purple) !important;
}

.task-table .ant-table-tbody>tr:hover {
  background: var(--theme-overlay-purple-medium) !important;
  box-shadow: 0 1px 4px var(--theme-shadow-primary);
}

.task-table .ant-table-tbody>tr:hover>td {
  border-bottom-color: var(--theme-border-purple-light) !important;
}

.task-table .ant-pagination {
  margin-top: 24px;
}
</style>
