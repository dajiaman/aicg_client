<template>
  <div class="prompt-tab space-y-5">
    <!-- 文案写作提示词 -->
    <a-tabs v-model:activeKey="promptTabKey" class="prompt-tabs">
      <a-tab-pane key="writing" tab="文案写作提示词">
        <div class="space-y-5">
          <!-- 当前使用卡片 -->
          <section class="card card-accent space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircleFilled class="text-fuchsia-400" />
                <span class="font-medium">当前使用的提示词</span>
              </div>
              <a-button type="primary" class="btn-primary" @click="showAddPromptModal = true">
                <template #icon>
                  <PlusOutlined />
                </template>
                新增提示词
              </a-button>
            </div>

            <div v-if="currentPrompt" class="current-prompt-card">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="status-pill status-online">
                  <span class="status-pill-dot"></span>
                  使用中
                </span>
                <span v-if="currentPrompt.id === 'default'" class="status-pill"
                  style="background: rgba(34, 211, 238, 0.15); color: #67e8f9">
                  <span class="status-pill-dot" style="background: #67e8f9"></span>
                  系统默认
                </span>
                <h3 class="prompt-name">{{ currentPrompt.name }}</h3>
              </div>
              <p v-if="currentPrompt.description" class="prompt-description">
                {{ currentPrompt.description }}
              </p>
              <p v-else class="prompt-description text-gray-500">暂无描述</p>
              <PromptEditor label="提示词内容" v-model:model-value="currentPrompt.content" readonly />
            </div>

            <div v-else class="empty-state">
              <div class="empty-icon-wrap">
                <RobotOutlined />
              </div>
              <p class="text-gray-300">未选择提示词</p>
              <p class="empty-hint">请从下方列表中选择一个提示词作为默认使用</p>
            </div>
          </section>

          <!-- 所有提示词列表 -->
          <section class="card space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <h3 class="font-semibold flex items-center gap-2 text-gray-100">
                <UnorderedListOutlined class="text-fuchsia-400" />
                <span>所有提示词</span>
              </h3>
              <span class="text-xs text-gray-500">共 {{ promptList.length }} 个</span>
            </div>

            <a-empty v-if="promptList.length === 0" description="暂无提示词，点击右上角新增" class="empty-card" />

            <div v-else class="prompt-grid">
              <div v-for="prompt in promptList" :key="prompt.id" class="prompt-card"
                :class="{ 'is-active': currentPrompt?.id === prompt.id }">
                <div class="card-head">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="card-title">{{ prompt.name }}</h4>
                    <div class="card-badges">
                      <span v-if="prompt.id === 'default'" class="badge badge-cyan">
                        <span class="badge-dot"></span>
                        默认
                      </span>
                      <span v-if="currentPrompt?.id === prompt.id" class="badge badge-fuchsia">
                        <span class="badge-dot"></span>
                        使用中
                      </span>
                    </div>
                  </div>
                  <p class="card-desc">{{ prompt.description || '暂无描述' }}</p>
                </div>

                <div class="card-body">
                  <div class="card-preview">{{ prompt.content }}</div>
                </div>

                <div class="card-actions">
                  <button class="action-btn action-btn-success flex-1" :disabled="currentPrompt?.id === prompt.id"
                    @click="handleSetCurrentPrompt(prompt.id)">
                    <CheckCircleFilled v-if="currentPrompt?.id === prompt.id" />
                    <StarOutlined v-else />
                    <span>{{ currentPrompt?.id === prompt.id ? '使用中' : '设为当前' }}</span>
                  </button>
                  <button class="action-btn action-btn-info" @click="handleEditPrompt(prompt)">
                    <EditOutlined />
                    <span>编辑</span>
                  </button>
                  <a-popconfirm v-if="prompt.id !== 'default'" title="确定要删除这个提示词吗？"
                    @confirm="handleDeletePrompt(prompt.id)">
                    <button class="action-btn action-btn-danger">
                      <DeleteOutlined />
                      <span>删除</span>
                    </button>
                  </a-popconfirm>
                </div>
              </div>
            </div>
          </section>
        </div>
      </a-tab-pane>

      <!-- 标题写作提示词 -->
      <a-tab-pane key="title" tab="标题写作提示词">
        <section class="card space-y-4">
          <div class="flex items-center gap-2">
            <BgColorsOutlined class="text-fuchsia-400 text-lg" />
            <div>
              <h3 class="font-semibold text-gray-100">标题生成提示词</h3>
              <p class="text-xs text-gray-500 mt-0.5">用于生成视频标题的 AI 提示词模板</p>
            </div>
          </div>

          <div class="rounded-xl border border-white/10 bg-[#1f1f2e] overflow-hidden">
            <a-input v-model:value="titlePrompt" placeholder="请输入用于生成标题的提示词模板，例如：请为以下内容生成一个吸引人的标题..."
              :maxlength="2000" />
          </div>

          <div class="tips-card">
            <div class="tips-title">
              <BulbOutlined class="text-fuchsia-400" />
              <span>使用提示</span>
            </div>
            <div class="tips-list">
              <div class="tip-item">
                <InfoCircleOutlined class="tip-icon" />
                <span>建议明确标题的长度要求（如 15-25 字）和风格特点</span>
              </div>
              <div class="tip-item">
                <InfoCircleOutlined class="tip-icon" />
                <span>可加入数字、悬念、痛点等元素提升点击率</span>
              </div>
            </div>
          </div>

          <a-button type="primary" block :loading="loading" class="btn-primary save-btn" @click="handleSaveTitlePrompt">
            <template #icon>
              <SaveOutlined />
            </template>
            保存标题提示词
          </a-button>
        </section>
      </a-tab-pane>
    </a-tabs>

    <!-- ===== 新增提示词弹窗 ===== -->
    <a-modal v-model:open="showAddPromptModal" title="新增提示词" width="80%" @ok="handleAddPrompt"
      @cancel="handleCancelAddPrompt" class="custom-modal" destroy-on-close>
      <div class="modal-form-wrapper">
        <a-form layout="vertical">
          <a-form-item label="提示词名称" required>
            <a-input v-model:value="newPromptForm.name" placeholder="请输入提示词名称" />
          </a-form-item>
          <a-form-item label="提示词描述">
            <a-input v-model:value="newPromptForm.description" placeholder="请输入提示词描述（可选）" />
          </a-form-item>
          <a-form-item label="提示词内容" required>
            <PromptEditor v-model="newPromptForm.content" placeholder="请输入提示词内容" :maxlength="10000" />
            <div class="form-hint mt-1">
              <BulbOutlined /> 提示：清晰具体的描述能获得更好的生成效果
            </div>
          </a-form-item>
          <a-form-item label="选择模型">
            <a-select v-model:value="newPromptForm.model" placeholder="请选择使用的AI模型" style="width: 100%">
              <a-select-option v-for="m in availableModels" :key="m.model" :value="m.model">
                {{ m.displayName }} ({{ m.model }})
              </a-select-option>
            </a-select>
            <div class="form-hint mt-1">选择此提示词使用的AI模型</div>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- ===== 编辑提示词弹窗 ===== -->
    <a-modal v-model:open="showEditPromptModal" title="编辑提示词" width="80%" @ok="handleSaveEditPrompt"
      @cancel="handleCancelEditPrompt" class="custom-modal" destroy-on-close>
      <div class="modal-form-wrapper">
        <a-form layout="vertical">
          <a-form-item label="提示词名称" required>
            <a-input v-model:value="editPromptForm.name" placeholder="请输入提示词名称" />
          </a-form-item>
          <a-form-item label="提示词描述">
            <a-input v-model:value="editPromptForm.description" placeholder="请输入提示词描述（可选）" />
          </a-form-item>
          <a-form-item label="提示词内容" required>
            <PromptEditor v-model:model-value="editPromptForm.content" placeholder="请输入提示词内容" :maxlength="10000" />
            <div class="form-hint">
              <BulbOutlined /> 提示：清晰具体的描述能获得更好的生成效果（支持 Markdown
              编写、实时预览）
            </div>
          </a-form-item>
          <a-form-item label="选择模型">
            <a-select v-model:value="editPromptForm.model" placeholder="请选择使用的AI模型" style="width: 100%">
              <a-select-option v-for="m in availableModels" :key="m.model" :value="m.model">
                <div class="model-option">
                  <RobotOutlined class="model-icon" />
                  <span>{{ m.displayName }}</span>
                  <span class="model-code">{{ m.model }}</span>
                </div>
              </a-select-option>
            </a-select>
            <div class="form-hint">选择此提示词使用的AI模型</div>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import {
  BgColorsOutlined,
  BulbOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  RobotOutlined,
  SaveOutlined,
  StarOutlined,
  UnorderedListOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, ref } from 'vue'
import PromptEditor from './PromptEditor.vue'

const showAddPromptModal = ref(false)
const showEditPromptModal = ref(false)

// 文案提示词
const promptList = ref([])
const promptTabKey = ref('writing')
const currentPromptId = ref('default')

const newPromptForm = ref({
  name: '',
  description: '',
  content: '',
  model: ''
})

const editPromptForm = ref({
  id: '',
  name: '',
  description: '',
  content: '',
  model: ''
})

// 标题提示词
const titlePrompt = ref('')
const loading = ref(false)

const currentPrompt = computed(() => {
  return promptList.value.find((prompt) => prompt.id === currentPromptId.value)
})

const formatDate = (iso) => {
  if (!iso) return '未知'
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return '未知'
  }
}

/**
 * 保存编辑提示词
 */
const handleSaveEditPrompt = async () => {
  const { id, name, content, description, model } = editPromptForm.value
  if (!name.trim() || !content.trim()) {
    message.warning('提示词名称和内容不能为空')
    return
  }

  try {
    const payload = {
      name: name.trim(),
      content: content.trim(),
      description: description.trim(),
      model: model || 'doubao-seed-1-6-250615',
      createdAt: formatDate(editPromptForm.value.createdAt),
      updatedAt: new Date().toISOString()
    }
    const res = await window.api.config.set(
      'prompts.prompt_' + id,
      payload,
      'prompts',
      '编辑提示词'
    )
    if (res.success) {
      await fetchPromptList()
      showEditPromptModal.value = false
      editPromptForm.value = {
        id: '',
        name: '',
        content: '',
        description: '',
        model: 'doubao-seed-1-6-250615'
      }
      message.success('提示词更新成功')
    } else {
      message.error('提示词更新失败')
    }
  } catch (e) {
    console.error('提示词更新失败:', e)
    message.error('提示词更新失败')
  }
}

const handleCancelEditPrompt = () => {
  showEditPromptModal.value = false
  editPromptForm.value = {
    id: '',
    name: '',
    content: '',
    description: '',
    model: 'doubao-seed-1-6-250615'
  }
}

const handleEditPrompt = (prompt) => {
  editPromptForm.value = {
    id: prompt.id,
    name: prompt.name,
    content: prompt.content,
    description: prompt.description || '',
    model: prompt.model || 'doubao-seed-1-6-250615',
    createdAt: formatDate(prompt.createdAt),
    updatedAt: new Date().toISOString()
  }
  showEditPromptModal.value = true
}

const handleAddPrompt = async () => {
  const { name, content, description, model } = newPromptForm.value
  if (!name.trim() || !content.trim()) {
    message.warning('提示词名称和内容不能为空')
    return
  }
  try {
    const id = 'prompt_' + Date.now()
    const payload = {
      name: name.trim(),
      content: content.trim(),
      description: description.trim(),
      model: model || 'doubao-seed-1-6-250615',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const res = await window.api.config.set('prompts.' + id, payload, 'prompts', '新增提示词')
    if (res.success) {
      await fetchPromptList()
      showAddPromptModal.value = false
      newPromptForm.value = {
        name: '',
        content: '',
        description: '',
        model: 'doubao-seed-1-6-250615'
      }
      message.success('提示词已添加')
    } else {
      message.error('提示词添加失败')
    }
  } catch (e) {
    console.error('提示词添加失败:', e)
    message.error('提示词添加失败')
  }
}

const handleCancelAddPrompt = () => {
  showAddPromptModal.value = false
  newPromptForm.value = { name: '', content: '', description: '', model: 'doubao-seed-1-6-250615' }
}

// 拉取文案提示词
const fetchPromptList = async () => {
  const res = await window.api.config.getCategory('prompts')
  if (res.success && res.data) {
    const list = []
    Object.keys(res.data).forEach((key) => {
      const item = res.data[key]
      if (key !== 'currentPromptId' && key.startsWith('prompt_')) {
        list.push({
          id: key.replace('prompt_', ''),
          ...item
        })
      }
    })
    promptList.value = list
    currentPromptId.value = res.data.currentPromptId.replace('prompt_', '') || 'default'
  } else {
    promptList.value = []
  }
}

// 拉取标题提示词
const fetchTitlePrompt = async () => {
  const res = await window.api.config.get('prompts.titlePrompt')
  if (res.success) {
    titlePrompt.value = res.data || ''
  } else {
    titlePrompt.value = ''
  }
}

// 保存标题提示词
const handleSaveTitlePrompt = async () => {
  if (!titlePrompt.value || !titlePrompt.value.trim()) {
    message.error('请输入标题提示词')
    return
  }
  loading.value = true
  try {
    await window.api.config.set('prompts.titlePrompt', titlePrompt.value)
    message.success('标题提示词保存成功')
  } catch (e) {
    console.error(e)
    message.error('保存失败')
  } finally {
    loading.value = false
  }
}

// 设置当前提示词
const handleSetCurrentPrompt = async (id) => {
  try {
    await window.api.config.set('prompts.currentPromptId', id.replace('prompt_', ''), 'prompts')
    currentPromptId.value = id
    message.success('已切换当前提示词')
  } catch (e) {
    console.error(e)
    message.error('切换失败')
  }
}

// 删除提示词
const handleDeletePrompt = async (id) => {
  if (id === 'default') {
    message.warning('默认提示词不可删除')
    return
  }
  try {
    await window.api.config.delete(`prompts.prompt_${id}`)
    message.success('已删除')
    if (currentPromptId.value === id) {
      currentPromptId.value = 'default'
    }
    fetchPromptList()
  } catch (e) {
    console.error(e)
    message.error('删除失败')
  }
}

onMounted(() => {
  fetchPromptList()
  fetchTitlePrompt()
})
</script>

<style scoped>
.prompt-tab :deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}

.prompt-tab :deep(.ant-tabs-tab) {
  color: #9ca3af;
  padding: 12px 0;
}

.prompt-tab :deep(.ant-tabs-tab-active) {
  color: #f0abfc;
}

.prompt-tab :deep(.ant-tabs-ink-bar) {
  background: linear-gradient(90deg, #d946ef 0%, #9333ea 100%) !important;
  height: 2px !important;
}

/* ============== 当前提示词卡片 ============== */
.current-prompt-card {
  border-radius: 12px;
  border: 1px solid rgba(217, 70, 239, 0.35);
  background: linear-gradient(135deg, rgba(217, 70, 239, 0.07) 0%, rgba(147, 51, 234, 0.04) 100%);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prompt-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: #f3f4f6;
}

.prompt-description {
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.6;
  margin: 0;
}

.prompt-preview {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(10, 10, 20, 0.6);
  overflow: hidden;
}

.preview-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 11px;
  color: #f0abfc;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
}

.preview-text {
  padding: 14px 16px;
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: #e5e7eb;
  max-height: 220px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ============== 空态 ============== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: rgba(217, 70, 239, 0.12);
  color: #f0abfc;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
}

/* ============== 提示词卡片网格 ============== */
.prompt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.prompt-card {
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0e0e1c;
  overflow: hidden;
  transition: all 0.25s ease;
  position: relative;
}

.prompt-card:hover {
  border-color: rgba(217, 70, 239, 0.4);
  box-shadow: 0 8px 24px rgba(217, 70, 239, 0.12);
  transform: translateY(-2px);
}

.prompt-card.is-active {
  border-color: rgba(217, 70, 239, 0.7);
  background: linear-gradient(135deg, rgba(217, 70, 239, 0.08) 0%, rgba(147, 51, 234, 0.04) 100%);
  box-shadow:
    0 0 0 1px rgba(217, 70, 239, 0.4),
    0 8px 24px rgba(217, 70, 239, 0.15);
}

.prompt-card.is-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #d946ef 0%, #9333ea 100%);
}

.card-head {
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #f3f4f6;
  margin: 0;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-badges {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
}

.badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 4px currentColor;
}

.badge-fuchsia {
  background: rgba(217, 70, 239, 0.18);
  color: #f0abfc;
}

.badge-cyan {
  background: rgba(34, 211, 238, 0.15);
  color: #67e8f9;
}

.card-desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 36px;
}

.card-body {
  padding: 12px 16px;
  flex: 1;
}

.card-preview {
  font-size: 12px;
  line-height: 1.55;
  color: #6b7280;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

/* ============== 标题写作 ============== */
.title-textarea :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.7;
  padding: 16px 18px !important;
  background: transparent !important;
  resize: vertical;
}

.tips-card {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(135deg, rgba(217, 70, 239, 0.05) 0%, rgba(34, 211, 238, 0.03) 100%);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #f0abfc;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.6;
}

.tip-icon {
  margin-top: 3px;
  color: #f0abfc;
  font-size: 12px;
}

.tip-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
  background: rgba(217, 70, 239, 0.15);
  color: #f0abfc;
  padding: 1px 6px;
  border-radius: 4px;
}

.save-btn {
  height: 40px;
  font-weight: 500;
}

.empty-card {
  padding: 32px 0;
}
</style>
