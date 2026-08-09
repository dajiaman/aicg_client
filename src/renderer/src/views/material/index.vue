<template>
  <div class="h-full overflow-y-auto">
    <div class="page">
      <!-- 页头（与 voice / avatar 一致） -->
      <header class="page-header">
        <div class="form-header">
          <div class="form-header-icon">🗂️</div>
          <div class="form-header-text">
            <span class="form-header-eyebrow">ASSET LIBRARY</span>
            <span class="form-header-title">素材管理</span>
            <span class="form-header-sub">管理视频素材的分类、上传、标记与向量化</span>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="header-action-btn header-action-btn-ghost" @click="goBack">
            <span>←</span>
            <span>返回首页</span>
          </button>
        </div>
      </header>

      <!-- 工具栏 -->
      <div class="filter-bar">
        <div class="filter-bar-left">
          <a-button class="btn-ghost" @click="handleCreateCategory" data-guide="create-category-btn">
            <template #icon>
              <PlusOutlined />
            </template>新建分类
          </a-button>
          <a-button class="btn-primary" @click="handleUploadVideo" data-guide="upload-video-btn">
            <template #icon>
              <CloudUploadOutlined />
            </template>上传素材
          </a-button>
        </div>
        <div class="filter-bar-right">
          <a-input-search v-model:value="searchQuery" placeholder="搜索素材名称或描述..." class="search-input"
            data-guide="search-input" @search="searchMaterials" allow-clear />
        </div>
      </div>

      <!-- 主体 -->
      <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
        <!-- 左侧分类 -->
        <aside class="category-aside">
          <section class="card space-y-4">
            <div class="panel-head">
              <h3>分类</h3>
              <a-button type="text" class="icon-btn" @click="loadCategories">
                <template #icon>
                  <ReloadOutlined />
                </template>
              </a-button>
            </div>

            <div class="category-list">
              <div class="category-item" :class="{ active: selectedCategoryId === null }" @click="selectCategory(null)">
                <span class="cat-name">
                  <AppstoreOutlined class="cat-icon" />
                  全部素材
                </span>
                <span class="cat-badge">{{ totalMaterialCount }}</span>
              </div>

              <div v-for="cat in categories" :key="cat.id" class="category-item"
                :class="{ active: selectedCategoryId === cat.id }" @click="selectCategory(cat.id)">
                <span class="cat-name">
                  <FolderFilled class="cat-icon" />
                  {{ cat.name }}
                </span>
                <div class="cat-actions">
                  <span class="cat-badge">{{ cat.materialCount }}</span>
                  <a-button type="text" size="small" class="icon-btn" @click.stop="deleteCategory(cat.id)">
                    <template #icon>
                      <DeleteOutlined />
                    </template>
                  </a-button>
                </div>
              </div>

              <div v-if="categories.length === 0" class="cat-empty">
                <div class="empty-dots">
                  <span></span><span></span><span></span>
                </div>
                <p>暂无分类</p>
              </div>
            </div>
          </section>
        </aside>

        <!-- 右侧素材 -->
        <section class="material-section">
          <section class="card space-y-4">
            <div class="panel-head">
              <div class="head-left">
                <a-checkbox v-model:checked="selectAll" :indeterminate="indeterminate" @change="handleSelectAll">
                  <span class="check-label">全选</span>
                </a-checkbox>
                <h3 class="panel-title">
                  {{ selectedCategoryId ? getCategoryName(selectedCategoryId) : '全部素材' }}
                  <span class="count-chip">{{ materialTotal }}</span>
                </h3>
              </div>

              <div class="head-right">
                <a-button v-if="selectedMaterials.length > 0" class="btn-ghost" @click="handleBatchMove">
                  <template #icon>
                    <FolderOpenOutlined />
                  </template>
                  移动 ({{ selectedMaterials.length }})
                </a-button>
                <a-button v-if="selectedMaterials.length > 0" class="btn-danger" @click="batchDeleteMaterials">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                  删除 ({{ selectedMaterials.length }})
                </a-button>
                <a-button type="text" class="icon-btn" @click="loadMaterials">
                  <template #icon>
                    <ReloadOutlined />
                  </template>
                </a-button>
              </div>
            </div>

            <!-- 网格 -->
            <div v-if="materials.length > 0" class="material-grid">
              <div v-for="material in materials" :key="material.id" class="material-card"
                :class="{ selected: selectedMaterials.includes(material.id) }">
                <div class="card-checkbox">
                  <a-checkbox :checked="selectedMaterials.includes(material.id)"
                    @change="toggleMaterialSelection(material.id)" />
                </div>

                <!-- 向量化徽章：纯文字状态 -->
                <div class="type-badge" :class="material.status === 'vectorized' ? 'vectorized' : 'pending'"
                  v-if="material.status === 'vectorized'">
                  {{ material.status === 'vectorized' ? '已向量化' : '未向量化' }}
                </div>

                <div class="media-wrap" @mouseenter="onVideoHover(material.id, true)"
                  @mouseleave="onVideoHover(material.id, false)">
                  <img v-if="isImageMaterialRef(material) && getVideoSrcForMaterialRef(material)"
                    :src="getVideoSrcForMaterialRef(material)" class="media-element" alt="" />
                  <video v-else-if="getVideoSrcForMaterialRef(material)" :ref="setVideoRef(material.id)"
                    :src="getVideoSrcForMaterialRef(material)" class="media-element" muted loop preload="metadata"
                    @error="handleVideoError" />
                  <div v-else class="media-placeholder">
                    <FileOutlined class="placeholder-icon" />
                  </div>

                  <div class="media-gradient"></div>
                  <div class="duration-tag" v-if="!isImageMaterialRef(material)">
                    <ClockCircleOutlined /> {{ formatDurationRef(material.duration || 0) }}
                  </div>
                </div>

                <div class="card-body">
                  <div class="card-title" :title="material.file_name">
                    {{ material.file_name }}
                  </div>
                  <div v-if="material.description" class="card-desc" :title="material.description">
                    {{ material.description }}
                  </div>
                </div>

                <div class="card-footer">
                  <span class="meta-size">{{ formatFileSizeRef(material.file_size) }}</span>
                  <div class="card-actions">
                    <a-button type="text" class="icon-btn primary" @click.stop="viewMaterial(material)">
                      <template #icon>
                        <EyeOutlined />
                      </template>
                    </a-button>
                    <a-button type="text" class="icon-btn danger" @click.stop="deleteMaterial(material.id)">
                      <template #icon>
                        <DeleteOutlined />
                      </template>
                    </a-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <div class="empty-illu">
                <div class="empty-circle"></div>
                <FileImageOutlined class="empty-icon" />
              </div>
              <h4>{{ searchMode ? '未找到匹配的素材' : '素材库空空如也' }}</h4>
              <p>{{ searchMode ? '试试更换关键词，或切换分类查看' : '上传第一个素材，开启你的创作之旅' }}</p>
              <a-button v-if="!searchMode" class="btn-primary" @click="goToUpload">
                <template #icon>
                  <PlusOutlined />
                </template>
                上传第一个素材
              </a-button>
            </div>

            <!-- 分页 -->
            <div v-if="materialTotal > 0" class="pagination-wrapper">
              <a-pagination v-model:current="currentPage" :page-size="pageSize" :total="materialTotal"
                :page-size-options="pageSizeOptions" show-size-changer @change="handlePageChange"
                @showSizeChange="handlePageSizeChange" />
            </div>
          </section>
        </section>
      </div>

      <!-- 新建分类 -->
      <a-modal v-model:open="showCreateCategoryDialog" title="新建分类" :width="460" centered @ok="createCategory"
        @cancel="cancelCreateCategory">
        <a-form :model="newCategory" layout="vertical">
          <a-form-item label="分类名称" required>
            <a-input v-model:value="newCategory.name" placeholder="例如：产品演示 / 人物口播" />
          </a-form-item>
          <a-form-item label="分类描述">
            <a-textarea v-model:value="newCategory.description" placeholder="可选：描述分类用途" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 批量移动 -->
      <a-modal v-model:open="showMoveDialog" title="移动素材到分类" :width="460" centered :confirm-loading="moving"
        @ok="confirmBatchMove" @cancel="cancelMoveDialog">
        <a-form layout="vertical">
          <a-form-item label="选择目标分类" required>
            <a-select v-model:value="targetCategoryId" placeholder="请选择目标分类" style="width: 100%">
              <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id"
                :disabled="cat.id === selectedCategoryId">
                {{ cat.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <div class="move-tip">
            <InfoCircleOutlined />
            <span>移动后，素材将从当前分类移除并添加到新分类。</span>
          </div>
        </a-form>
      </a-modal>

      <!-- 素材详情 -->
      <a-modal v-model:open="showMaterialDetail" :title="null" :footer="null" :width="820" centered
        @cancel="closeMaterialDetail">
        <div v-if="currentMaterial" class="detail">
          <div class="detail-hero">
            <div class="hero-meta">
              <div class="hero-type">
                <component :is="isImageMaterialRef(currentMaterial) ? PictureOutlined : VideoCameraOutlined" />
                {{ isImageMaterialRef(currentMaterial) ? '图片素材' : '视频素材' }}
              </div>
              <h2 class="hero-title">{{ currentMaterial.file_name }}</h2>
              <div class="hero-info">
                <span>
                  <ClockCircleOutlined /> {{ formatDurationRef(currentMaterial.duration || 0) }}
                </span>
                <span>{{ formatFileSizeRef(currentMaterial.file_size || 0) }}</span>
                <span>
                  <FieldTimeOutlined /> {{ formatTimeRef(currentMaterial.created_at) }}
                </span>
              </div>
            </div>
          </div>

          <a-tabs default-active-key="info" class="detail-tabs">
            <a-tab-pane key="info" tab="基本信息">
              <a-descriptions :column="2" bordered size="small" class="info-descs">
                <a-descriptions-item label="文件路径" :span="2">
                  <div class="file-path">{{ currentMaterial.file_path || '未知' }}</div>
                </a-descriptions-item>
                <a-descriptions-item label="文件大小">
                  {{ formatFileSizeRef(currentMaterial.file_size || 0) }}
                </a-descriptions-item>
                <a-descriptions-item label="时长">
                  {{ formatDurationRef(currentMaterial.duration || 0) }}
                </a-descriptions-item>
                <a-descriptions-item label="状态">
                  <a-tag :color="getStatusColor(currentMaterial.status)" class="status-tag">
                    {{ getStatusText(currentMaterial.status) }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="所属分类">
                  <a-tag color="purple" class="status-tag">
                    <LinkOutlined /> {{ getCategoryName(currentMaterial.category_id) }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="素材ID" :span="2">
                  <span class="meta-id">{{ currentMaterial.id }}</span>
                </a-descriptions-item>
                <a-descriptions-item label="向量ID" :span="2">
                  <span class="meta-id">{{ currentMaterial.vector_id || '尚未向量化' }}</span>
                  <a-button
                    v-if="currentMaterial && !currentMaterial.vector_id && currentMaterial.status != 'vectorized'"
                    class="btn-primary btn-sm" :loading="vectorizing" data-guide="vectorize-btn"
                    style="margin-left: 8px" @click="vectorizeMaterial(currentMaterial.id)" size="small">
                    立即向量化
                  </a-button>
                </a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>

            <a-tab-pane key="desc" tab="已向量化">
              <div class="desc-section">
                <div v-if="!isEditingDescription" class="desc-preview">
                  <div class="desc-header">
                    <span class="desc-header-label">素材描述</span>
                    <a-button type="link" class="edit-link" @click="enableEditDescription">
                      <template #icon>
                        <EditOutlined />
                      </template>
                      编辑
                    </a-button>
                  </div>
                  <p v-if="currentMaterial.description" class="desc-text">{{ currentMaterial.description }}</p>
                  <p v-else class="desc-empty">暂无描述，点击右上角编辑</p>
                </div>
                <div v-else class="desc-edit">
                  <a-textarea v-model:value="editingDescription" :auto-size="{ minRows: 4, maxRows: 8 }"
                    placeholder="请输入视频描述" />
                  <div class="edit-actions">
                    <a-button @click="cancelEditDescription">取消</a-button>
                    <a-button class="btn-primary btn-sm" :loading="savingDescription" @click="saveDescription">
                      保存
                    </a-button>
                  </div>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>

          <div class="detail-footer">
            <a-button v-if="currentMaterial.file_path" class="btn-primary" @click="openFileLocation">
              <template #icon>
                <LinkOutlined />
              </template>
              打开文件位置
            </a-button>
            <a-button class="btn-danger" @click="confirmDeleteMaterial(currentMaterial.id)">
              <template #icon>
                <DeleteOutlined />
              </template>
              删除素材
            </a-button>
            <a-button @click="closeMaterialDetail">关闭</a-button>
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  PlusOutlined,
  UploadOutlined,
  LinkOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  PlayCircleFilled,
  CloudUploadOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  FolderFilled,
  AppstoreOutlined,
  FieldTimeOutlined,
  InfoCircleOutlined,
  EditOutlined
} from '@ant-design/icons-vue'
import { usePermission } from '../../hooks/usePermission'

const { checkFullPermission } = usePermission()

/* ============= 工具函数 ============= */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

function formatTime(date) {
  if (!date) return '未知时间'
  return new Date(date).toLocaleString('zh-CN')
}

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
  return m + ':' + String(s).padStart(2, '0')
}

function isImageMaterial(material) {
  if (!material) return false
  const fileName = material.file_name || material.file_path || ''
  const ext = fileName.toLowerCase().split('.').pop()
  return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)
}

function getVideoSrcForMaterial(material) {
  if (!material || !material.file_path) return null
  const path = material.file_path
  if (/^(https?|ftp):\/\//i.test(path)) return path
  if (/^[A-Za-z]:[\\/]/.test(path) || path.includes('/') || path.includes('\\')) {
    return 'file:///' + path.replace(/\\/g, '/')
  }
  return null
}

/* ============= 状态 ============= */
const router = useRouter()

const categories = ref([])
const materials = ref([])
const selectedCategoryId = ref(null)
const selectedMaterials = ref([])
const searchQuery = ref('')
const searchMode = ref(false)
const searchResultsAll = ref([])
const showCreateCategoryDialog = ref(false)
const showMoveDialog = ref(false)
const showMaterialDetail = ref(false)
const newCategory = reactive({ name: '', description: '' })
const targetCategoryId = ref(undefined)
const currentMaterial = ref(null)
const isEditingDescription = ref(false)
const editingDescription = ref('')
const savingDescription = ref(false)
const moving = ref(false)
const vectorizing = ref(false)
const totalMaterialCount = ref(0)
const materialTotal = ref(0)
const hoveredVideoId = ref(null)
const selectAll = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const pageSizeOptions = ['12', '24', '48', '96']
const videoRefs = reactive({})

const indeterminate = computed(() => {
  const ids = materials.value?.map((m) => m.id) || []
  const selected = ids.filter((id) => selectedMaterials.value.includes(id)).length
  return selected > 0 && selected < ids.length
})

/* ============= 方法 ============= */
function goToUpload() {
  router.push('/materials/upload')
}

function goBack() {
  router.push('/')
}

function handleCreateCategory() {
  if (checkFullPermission('新建分类')) showCreateCategoryDialog.value = true
}

function handleUploadVideo() {
  if (checkFullPermission('上传视频')) router.push('/materials/upload')
}

async function loadCategories() {
  try {
    const res = await window.api.category.list()
    if (res.success) {
      categories.value = res.data || []
      await Promise.all(
        categories.value.map(async (cat) => {
          const countRes = await window.api.material.list({
            where: 'category_id = ?',
            whereParams: [cat.id],
            page: 1,
            pageSize: 1
          })
          cat.materialCount = countRes.success && countRes.pagination ? countRes.pagination.total || 0 : 0
        })
      )
      await calculateTotalMaterialCount()
    } else {
      message.error(res.message || '加载分类列表失败')
    }
  } catch {
    message.error('加载分类列表失败')
  }
}

async function calculateTotalMaterialCount() {
  try {
    const res = await window.api.material.list({ page: 1, pageSize: 1 })
    if (res.success) {
      totalMaterialCount.value = res.pagination ? res.pagination.total || 0 : res.data?.length || 0
    } else {
      totalMaterialCount.value = 0
    }
  } catch {
    totalMaterialCount.value = 0
  }
}


/**
 * 加载素材列表
 */
async function loadMaterials() {
  try {
    if (searchMode.value) {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      materials.value = searchResultsAll.value.slice(start, end)
      materialTotal.value = searchResultsAll.value.length
      updateSelectAllState()
      return
    }

    const params = selectedCategoryId.value
      ? { where: 'category_id = ?', whereParams: [selectedCategoryId.value] }
      : {}
    const res = await window.api.material.list({
      ...params,
      page: currentPage.value,
      pageSize: pageSize.value
    })
    if (res.success) {
      materials.value = res.data || []
      materialTotal.value = res.pagination ? res.pagination.total || 0 : materials.value.length
      updateSelectAllState()
    } else {
      message.error(res.message || '加载素材列表失败')
    }
  } catch {
    message.error('加载素材列表失败')
  }
}

/**
 * 选择分类
 */
function selectCategory(id) {
  selectedCategoryId.value = id
  searchMode.value = false
  searchResultsAll.value = []
  currentPage.value = 1
  selectedMaterials.value = []
  selectAll.value = false
  loadMaterials()
}

async function createCategory() {
  if (!newCategory.name.trim()) {
    message.warning('请输入分类名称')
    return
  }
  try {
    const res = await window.api.category.create({
      name: newCategory.name,
      description: newCategory.description
    })
    if (res.success) {
      message.success('分类创建成功')
      showCreateCategoryDialog.value = false
      newCategory.name = ''
      newCategory.description = ''
      await loadCategories()
    } else {
      message.error(res.message || '创建分类失败')
    }
  } catch {
    message.error('创建分类失败')
  }
}

function deleteCategory(id) {
  Modal.confirm({
    title: '删除分类',
    content: '确定要删除这个分类吗？分类下的素材也会被删除。',
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        const res = await window.api.category.delete(id)
        if (res.success) {
          message.success(res.message || '分类删除成功')
          await loadCategories()
          if (selectedCategoryId.value === id) selectCategory(null)
        } else {
          message.error(res.message || '删除失败')
        }
      } catch (err) {
        message.error('删除分类失败: ' + err.message)
      }
    }
  })
}

async function searchMaterials() {
  if (!searchQuery.value.trim()) {
    searchMode.value = false
    searchResultsAll.value = []
    currentPage.value = 1
    await loadMaterials()
    return
  }

  try {
    const res = await window.api.material.search(searchQuery.value, selectedCategoryId.value)
    if (res.success) {
      searchMode.value = true
      searchResultsAll.value = res.data?.results || []
      currentPage.value = 1
      await loadMaterials()
    } else {
      message.error(res.message || '搜索素材失败')
    }
  } catch {
    message.error('搜索素材失败')
  }
}

function toggleMaterialSelection(id) {
  const idx = selectedMaterials.value.indexOf(id)
  if (idx > -1) selectedMaterials.value.splice(idx, 1)
  else selectedMaterials.value.push(id)
  updateSelectAllState()
}

function handleSelectAll(e) {
  const ids = materials.value.map((m) => m.id)
  if (e.target.checked) {
    const set = new Set(selectedMaterials.value)
    ids.forEach((id) => set.add(id))
    selectedMaterials.value = Array.from(set)
  } else {
    selectedMaterials.value = selectedMaterials.value.filter((id) => !ids.includes(id))
  }
  updateSelectAllState()
}

function updateSelectAllState() {
  const ids = materials.value.map((m) => m.id)
  if (ids.length === 0) {
    selectAll.value = false
    return
  }
  const selected = ids.filter((id) => selectedMaterials.value.includes(id)).length
  selectAll.value = selected === ids.length
}

function handlePageChange(page) {
  currentPage.value = page
  loadMaterials()
}

function handlePageSizeChange(_current, size) {
  pageSize.value = size
  currentPage.value = 1
  loadMaterials()
}

function handleBatchMove() {
  if (selectedMaterials.value.length === 0) {
    message.warning('请先选择要移动的素材')
    return
  }
  targetCategoryId.value = undefined
  showMoveDialog.value = true
}

async function confirmBatchMove() {
  if (!targetCategoryId.value) {
    message.warning('请选择目标分类')
    return
  }
  if (targetCategoryId.value === selectedCategoryId.value) {
    message.warning('目标分类不能与当前分类相同')
    return
  }
  moving.value = true
  try {
    const res = await window.api.material.batchMove(selectedMaterials.value, targetCategoryId.value)
    if (res.success) {
      const { successCount, failCount } = res.data || {}
      if (failCount === 0) message.success('成功移动 ' + successCount + ' 个素材')
      else message.warning('移动完成：成功 ' + successCount + ' 个，失败 ' + failCount + ' 个')
      showMoveDialog.value = false
      selectedMaterials.value = []
      selectAll.value = false
      await loadCategories()
      await loadMaterials()
    } else {
      message.error(res.message || '批量移动失败')
    }
  } catch (err) {
    message.error('批量移动失败: ' + err.message)
  } finally {
    moving.value = false
  }
}

function batchDeleteMaterials() {
  if (selectedMaterials.value.length === 0) {
    message.warning('请先选择要删除的素材')
    return
  }
  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedMaterials.value.length} 个素材吗？此操作无法撤销。`,
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        const ids = JSON.parse(JSON.stringify(selectedMaterials.value))
        const res = await window.api.material.batchDelete(ids)
        if (res.success) {
          const { successCount, failCount } = res.data || {}
          if (failCount === 0) message.success('删除成功 ' + successCount + ' 个素材')
          else message.warning('删除完成：成功 ' + successCount + ' 个，失败 ' + failCount + ' 个')
          selectedMaterials.value = []
          selectAll.value = false
          await loadCategories()
          await loadMaterials()
        } else {
          message.error(res.message || '批量删除失败')
        }
      } catch (err) {
        message.error('批量删除失败: ' + err.message)
      }
    }
  })
}

function viewMaterial(material) {
  currentMaterial.value = material
  isEditingDescription.value = false
  editingDescription.value = ''
  showMaterialDetail.value = true
}

function enableEditDescription() {
  editingDescription.value = currentMaterial.value?.description || ''
  isEditingDescription.value = true
}

function cancelEditDescription() {
  isEditingDescription.value = false
  editingDescription.value = ''
}

async function saveDescription() {
  if (!currentMaterial.value?.id) return
  savingDescription.value = true
  try {
    const res = await window.api.material.updateDescription(
      currentMaterial.value.id,
      editingDescription.value
    )
    if (res.success) {
      message.success('描述更新成功')
      currentMaterial.value.description = editingDescription.value
      const target = materials.value.find((m) => m.id === currentMaterial.value.id)
      if (target) target.description = editingDescription.value
      isEditingDescription.value = false
    } else {
      message.error(res.message || '更新描述失败')
    }
  } catch (err) {
    message.error('更新描述失败: ' + err.message)
  } finally {
    savingDescription.value = false
  }
}

function onVideoHover(id, hover) {
  const material = materials.value.find((m) => m.id === id)
  if (material && isImageMaterial(material)) return
  hoveredVideoId.value = hover ? id : null
  const video = videoRefs[id]
  if (video) {
    if (hover) video.play().catch(() => { })
    else {
      video.pause()
      video.currentTime = 0
    }
  }
}

function setVideoRef(id) {
  return (el) => {
    if (el) videoRefs[id] = el
    else delete videoRefs[id]
  }
}

function handleVideoError() {
  message.error('视频加载失败')
}

function deleteMaterial(id) {
  Modal.confirm({
    title: '删除素材',
    content: '确定要删除这个素材吗？此操作无法撤销。',
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        const res = await window.api.material.delete(id)
        if (res.success) {
          message.success(res.message || '素材删除成功')
          await loadCategories()
          await loadMaterials()
        } else {
          message.error(res.message || '删除失败')
        }
      } catch (err) {
        message.error('删除素材失败: ' + err.message)
      }
    }
  })
}

function getCategoryName(id) {
  const cat = categories.value.find((c) => c.id === id)
  return cat ? cat.name : '未知分类'
}

const formatFileSizeRef = (bytes) => formatFileSize(bytes)
const formatTimeRef = (date) => formatTime(date)
const formatDurationRef = (seconds) => formatDuration(seconds)
const isImageMaterialRef = (material) => isImageMaterial(material)
const getVideoSrcForMaterialRef = (material) => getVideoSrcForMaterial(material)

function getStatusText(status) {
  const map = {
    uploaded: '已上传',
    processing: '处理中',
    tagged: '已标记',
    vectorized: '已向量化'
  }
  return map[status] || '未知状态'
}

function getStatusColor(status) {
  const map = {
    uploaded: 'blue',
    processing: 'orange',
    tagged: 'green',
    vectorized: 'purple'
  }
  return map[status] || 'default'
}

async function openFileLocation() {
  if (!currentMaterial.value?.file_path) {
    message.warning('文件路径不可用')
    return
  }
  try {
    const res = await window.api.file.showInFolder(currentMaterial.value.file_path)
    if (res.success) message.success('已打开文件位置')
    else message.error(res.message || '打开文件位置失败')
  } catch (err) {
    message.error('操作失败: ' + err.message)
  }
}

function confirmDeleteMaterial(id) {
  Modal.confirm({
    title: '删除素材',
    content: '确定要删除这个素材吗？删除后无法恢复。',
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      showMaterialDetail.value = false
      try {
        const res = await window.api.material.delete(id)
        if (res.success) {
          message.success(res.message || '素材删除成功')
          await loadCategories()
          await loadMaterials()
        } else {
          message.error(res.message || '删除失败')
        }
      } catch (err) {
        message.error('删除素材失败: ' + err.message)
      }
    }
  })
}

async function vectorizeMaterial(id) {
  if (!id) {
    message.warning('素材ID不存在')
    return
  }
  const material = materials.value.find((m) => m.id === id)
  if (!material || !material.description) {
    message.warning('素材尚未标记描述，无法向量化')
    return
  }
  vectorizing.value = true
  try {
    const res = await window.api.material.vectorize(id)
    if (res.success) {
      message.success('向量化成功')
      await loadMaterials()
      if (currentMaterial.value?.id === id) {
        const updated = materials.value.find((m) => m.id === id)
        if (updated) currentMaterial.value = updated
      }
    } else {
      message.error(res.message || '向量化失败')
    }
  } catch (err) {
    message.error('向量化失败: ' + err.message)
  } finally {
    vectorizing.value = false
  }
}

function cancelCreateCategory() {
  showCreateCategoryDialog.value = false
}

function cancelMoveDialog() {
  showMoveDialog.value = false
}

function closeMaterialDetail() {
  showMaterialDetail.value = false
}

onMounted(async () => {
  await loadCategories()
  await loadMaterials()
})
</script>

<style scoped>
/* ============================================================
   工具栏 / 搜索
   ============================================================ */
.filter-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.search-input {
  width: 320px;
}

/* ============================================================
   面板头 / 计数
   ============================================================ */
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.panel-head h3 {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
  letter-spacing: 0.02em;
}

.panel-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.count-chip {
  background: var(--brand-tint-soft);
  color: var(--brand-soft);
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  font-weight: 600;
}

.head-left,
.head-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.check-label {
  margin-left: 6px;
  color: #e2e8f0;
  font-size: 13px;
}

/* ============================================================
   图标按钮（antd type="text"）
   ============================================================ */
.icon-btn {
  color: #94a3b8;
}

.icon-btn:hover {
  background: var(--brand-tint-faint);
  color: var(--brand-soft);
}

.icon-btn.primary {
  color: var(--brand);
}

.icon-btn.danger {
  color: var(--danger);
}

.icon-btn.danger:hover {
  background: var(--danger-soft);
  color: #fca5a5;
}

/* ============================================================
   分类侧栏
   ============================================================ */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: #cbd5e1;
  font-size: 13px;
  transition: all 0.18s ease;
  border: 1px solid transparent;
}

.category-item:hover {
  background: var(--brand-tint-ghost);
  color: var(--brand-soft);
  transform: translateX(2px);
}

.category-item.active {
  background: linear-gradient(135deg, var(--brand-tint-soft), rgba(124, 58, 237, 0.18));
  color: var(--brand-faint);
  border-color: var(--brand-tint-medium);
  box-shadow: 0 4px 12px rgba(217, 70, 239, 0.15);
}

.cat-name {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cat-icon {
  font-size: 14px;
  opacity: 0.85;
}

.cat-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cat-badge {
  background: var(--white-alpha-06);
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: #cbd5e1;
  font-weight: 600;
}

.category-item.active .cat-badge {
  background: rgba(217, 70, 239, 0.3);
  color: #fff;
}

.cat-empty {
  text-align: center;
  padding: 24px 12px;
  color: #64748b;
}

.cat-empty p {
  font-size: 12px;
  margin: 8px 0 0;
}

.empty-dots {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.empty-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #475569;
  animation: pulse 1.4s infinite;
}

.empty-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.empty-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 1;
  }
}

/* ============= 素材网格 ============= */
.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.material-card {
  position: relative;
  background: rgba(20, 20, 35, 0.6);
  border: 1px solid var(--white-alpha-06);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.material-card:hover {
  transform: translateY(-4px);
  border-color: rgba(217, 70, 239, 0.4);
  box-shadow: 0 16px 40px rgba(217, 70, 239, 0.18);
}

.material-card.selected {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-tint-medium), 0 12px 28px rgba(217, 70, 239, 0.2);
}

.card-checkbox {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 6px;
  padding: 2px 6px;
  backdrop-filter: blur(6px);
}

.type-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.55);
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #f0abfc;
  backdrop-filter: blur(6px);
}

.type-badge.video {
  background: linear-gradient(135deg, rgba(217, 70, 239, 0.65), rgba(124, 58, 237, 0.65));
  color: #fff;
}

.type-badge.vectorized {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.85), rgba(16, 185, 129, 0.85));
  color: #fff;
  box-shadow: 0 0 12px -2px rgba(34, 197, 94, 0.45);
}

.type-badge.pending {
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.7);
}

.type-badge.image {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.65), rgba(59, 130, 246, 0.65));
  color: #fff;
}

.media-wrap {
  position: relative;
  width: 100%;
  padding-top: 75%;
  background: #000;
  overflow: hidden;
  flex-shrink: 0;
}

.media-element {
  position: absolute;
  inset: 0;
  margin: 0 auto;
  height: 100%;
  object-fit: cover;
}

.media-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e1b4b, #0f0a1e);
}

.placeholder-icon {
  font-size: 48px;
  color: #475569;
}

.overlay-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.overlay-play {
  font-size: 48px;
  color: #fff;
  filter: drop-shadow(0 0 12px rgba(217, 70, 239, 0.8));
}

.media-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(0, 0, 0, 0.6) 100%);
  pointer-events: none;
}

.duration-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: #fff;
  font-weight: 500;
  backdrop-filter: blur(6px);
}

.card-body {
  padding: 14px 16px 10px;
  min-width: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #f1f5f9;
}

.card-desc {
  font-size: 12px;
  line-height: 1.6;
  color: #a78bfa;
  margin-top: 6px;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  text-overflow: ellipsis;
  word-break: break-word;
  white-space: normal;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px 12px;
  border-top: 1px solid var(--white-alpha-04);
}

.meta-size {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 4px;
}

/* ============= 空状态 ============= */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #94a3b8;
}

.empty-illu {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-circle {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(217, 70, 239, 0.2), transparent 70%);
  animation: float 3s ease-in-out infinite;
}

.empty-icon {
  position: relative;
  font-size: 56px;
  color: #d946ef;
  filter: drop-shadow(0 0 16px rgba(217, 70, 239, 0.4));
}

@keyframes float {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.empty-state h4 {
  font-size: 18px;
  color: #f1f5f9;
  margin: 0 0 8px;
  font-weight: 600;
}

.empty-state p {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 20px;
}

/* ============= 分页 ============= */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 0 8px;
}

/* ============= 弹窗 ============= */
.move-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 12px;
  padding: 8px 12px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  margin-top: 8px;
}

.detail {
  padding: 0 4px;
}

.detail-hero {
  padding: 20px 24px;
  margin: -16px -24px 20px;
  background: linear-gradient(135deg, rgba(217, 70, 239, 0.12), rgba(124, 58, 237, 0.12));
  border-bottom: 1px solid var(--white-alpha-06);
}

.hero-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(217, 70, 239, 0.2);
  color: #f0abfc;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}

.hero-title {
  font-size: 20px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 8px;
  word-break: break-all;
}

.hero-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #94a3b8;
  flex-wrap: wrap;
}

.hero-info span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.detail-tabs {
  padding: 0 24px;
}

.info-descs {
  background: rgba(255, 255, 255, 0.02);
}

.file-path {
  word-break: break-all;
  font-size: 12px;
  color: #a78bfa;
}

.meta-id {
  font-size: 12px;
  color: #c4b5fd;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
}

.status-tag {
  border-radius: 999px;
}

.desc-section {
  padding: 12px 0;
}

.desc-preview {
  position: relative;
  background: var(--white-alpha-02);
  border: 1px solid var(--white-alpha-06);
  border-radius: 10px;
  padding: 14px 18px 16px;
}

.desc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--white-alpha-06);
}

.desc-header-label {
  font-size: 12px;
  color: #94a3b8;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.edit-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
  height: auto;
  line-height: 1;
}

.edit-link :deep(.anticon) {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.desc-text {
  font-size: 14px;
  color: #e2e8f0;
  line-height: 1.7;
  white-space: pre-wrap;
  margin: 0;

}

.desc-empty {
  color: #64748b;
  font-style: italic;
  margin: 0;
}

.desc-edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 16px;
}

/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 1100px) {
  .category-list {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    max-height: none;
  }

  .category-item {
    flex-shrink: 0;
  }
}

@media (max-width: 720px) {
  .material-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .material-grid {
    grid-template-columns: 1fr;
  }
}
</style>
