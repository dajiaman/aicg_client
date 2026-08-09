<template>
  <div class="h-full overflow-y-auto">
    <div class="page">
      <!-- 页头（与 voice / avatar / material 一致） -->
      <header class="page-header">
        <div class="form-header">
          <div class="form-header-icon">☁️</div>
          <div class="form-header-text">
            <span class="form-header-eyebrow">UPLOAD STUDIO</span>
            <span class="form-header-title">上传素材</span>
            <span class="form-header-sub">通过三个步骤完成视频上传、标记与向量化</span>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="header-action-btn header-action-btn-ghost" @click="showGuide = true"
            data-guide="help-btn">
            <span>?</span>
            <span>使用帮助</span>
          </button>
          <button type="button" class="header-action-btn header-action-btn-ghost" @click="goBack">
            <span>←</span>
            <span>返回素材中心</span>
          </button>
        </div>
      </header>

      <!-- 步骤条 -->
      <div class="steps-wrap" data-guide="steps-indicator">
        <div class="steps-track">
          <div v-for="(s, i) in stepDefs" :key="i" class="step-pill" :class="{
            active: currentStep === i,
            done: currentStep > i
          }">
            <div class="step-circle">
              <CheckOutlined v-if="currentStep > i" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <div class="step-info">
              <div class="step-title">{{ s.title }}</div>
              <div class="step-desc">{{ s.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主体 -->
      <main class="page-main">
        <!-- 步骤 1：选择文件 + 分类 -->
        <section v-if="currentStep === 0" class="card space-y-5">
          <div class="panel-head">
            <h2>选择文件与分类</h2>
            <p>支持视频 / 图片批量上传，单次最多 50 个</p>
          </div>

          <div class="form-row">
            <div class="form-row__label">
              <span class="form-label">分类</span>
              <span class="form-hint">素材所属分组，便于后续检索</span>
            </div>
            <div class="form-row__control category-row" data-guide="category-select-section">
              <a-select v-model:value="selectedCategoryId" placeholder="请选择分类" class="category-select"
                data-guide="category-select" :dropdown-style="{ background: '#1f2024' }">
                <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  <span class="cat-option">
                    <FolderOutlined class="cat-icon" />
                    {{ cat.name }}
                    <span class="cat-count">{{ cat.materialCount || 0 }}</span>
                  </span>
                </a-select-option>
              </a-select>
              <a-button class="btn-ghost" @click="showCreateCategory" data-guide="create-category-btn">
                <template #icon>
                  <PlusOutlined />
                </template>
                新建分类
              </a-button>
            </div>
          </div>

          <div class="form-divider"></div>

          <!-- 拖拽上传 -->
          <a-upload-dragger v-model:fileList="fileList" :before-upload="beforeUpload" :multiple="true"
            :show-upload-list="false" accept="video/*,image/png,image/jpeg" class="upload-dragger"
            data-guide="upload-dragger">
            <div class="dragger-inner">
              <div class="dragger-icon">
                <InboxOutlined />
              </div>
              <p class="dragger-title">点击或拖拽文件到此区域</p>
              <p class="dragger-hint">支持 mp4 / avi / mov / mkv / webm 等视频，以及 jpg / png 图片</p>
            </div>
          </a-upload-dragger>

          <!-- 文件列表 -->
          <div v-if="fileList.length > 0" class="file-list">
            <div class="list-head">
              <h3>
                <PaperClipOutlined class="list-icon" />
                已选择文件
                <span class="count-chip">{{ fileList.length }}</span>
              </h3>
              <a-button class="btn-danger btn-sm" size="small" @click="clearFiles">
                <template #icon>
                  <DeleteOutlined />
                </template>
                清空
              </a-button>
            </div>
            <div class="file-items">
              <div v-for="(file, index) in fileList" :key="index" class="file-item">
                <div class="file-icon">
                  <PictureOutlined v-if="isImageFile(file.name)" />
                  <VideoCameraOutlined v-else />
                </div>
                <div class="file-info">
                  <div class="file-name">{{ file.name }}</div>
                  <div class="file-size">{{ formatFileSize(file.size) }}</div>
                </div>
                <a-button class="icon-btn danger" size="small" @click="removeFile(index)">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </div>
            </div>
          </div>

          <!-- 底部操作 -->
          <div class="step-actions">
            <a-button class="btn-ghost" @click="goBack">返回</a-button>
            <a-button class="btn-primary" :disabled="fileList.length === 0 || !selectedCategoryId" @click="nextStep">
              下一步
              <template #icon>
                <ArrowRightOutlined />
              </template>
            </a-button>
          </div>
        </section>

        <!-- 步骤 2：标记 + 处理 -->
        <section v-else-if="currentStep === 1" class="card space-y-5">
          <div class="panel-head">
            <h2>标记与向量化</h2>
            <p>AI 已自动生成描述，您可以修改后批量保存并向量化</p>
          </div>

          <!-- AI进度 -->
          <div v-if="aiTagging" class="status-alert">
            <div class="alert-icon alert-icon--info">
              <RobotOutlined />
            </div>
            <div class="alert-body">
              <div class="alert-head">
                <span class="alert-title">AI 自动标记中...</span>
                <span class="alert-progress">{{ aiProcessedCount }} / {{ videoItems.length }}</span>
              </div>
              <a-progress :percent="aiTotalProgress" :show-info="false" stroke-color="#d946ef" />
            </div>
          </div>

          <!-- 上传进度 -->
          <div v-if="uploading || uploadComplete" class="status-alert">
            <div class="alert-icon" :class="{
              'alert-icon--success': uploadStatus === 'success',
              'alert-icon--error': uploadStatus === 'exception'
            }">
              <CheckCircleOutlined v-if="uploadStatus === 'success'" />
              <CloseCircleOutlined v-else-if="uploadStatus === 'exception'" />
              <LoadingOutlined v-else spin />
            </div>
            <div class="alert-body">
              <div class="alert-head">
                <span class="alert-title">
                  {{ uploadComplete ? '处理完成' : '正在处理中...' }}
                </span>
                <span class="alert-progress">{{ uploadedCount }} / {{ videoItems.length }}</span>
              </div>
              <a-progress :percent="overallProgress" :show-info="false"
                :status="uploadStatus === 'exception' ? 'exception' : uploadStatus === 'success' ? 'success' : 'active'"
                stroke-color="#d946ef" />
            </div>
          </div>

          <!-- 标记计数 -->
          <div class="tagging-toolbar">
            <span class="tagging-count">
              <FileTextOutlined />
              已标记 <strong>{{ taggedVideosCount }}</strong> / {{ videoItems.length }}
            </span>
          </div>

          <!-- 视频卡片列表 -->
          <div class="video-list">
            <div v-for="(item, idx) in videoItems" :key="idx" class="video-card" :class="{
              'is-tagged': item.description && item.description.trim(),
              'is-processing': uploading || item.processStatus !== 'normal'
            }">
              <!-- 左侧：预览 -->
              <div class="vc-preview">
                <img v-if="item.isImage" class="vc-img" :src="item.objectURL" alt="" />
                <video v-else class="vc-video" :src="item.objectURL" preload="metadata"
                  @loadedmetadata="onLoadedMetadata(item)"></video>

                <!-- 类型徽章 -->
                <div class="vc-type-badge" :class="item.isImage ? 'image' : 'video'">
                  <component :is="item.isImage ? PictureOutlined : VideoCameraOutlined" />
                  {{ item.isImage ? 'IMG' : 'VIDEO' }}
                </div>

                <!-- 状态徽章 -->
                <div v-if="item.processStatus !== 'normal'" class="vc-status" :class="item.processStatus">
                  <LoadingOutlined v-if="item.processStatus === 'uploading'" spin />
                  <SyncOutlined v-else-if="item.processStatus === 'vectorizing'" spin />
                  <CheckCircleOutlined v-else-if="item.processStatus === 'completed'" />
                  <CloseCircleOutlined v-else-if="item.processStatus === 'error'" />
                  <span>{{ statusText(item.processStatus) }}</span>
                </div>
                <div v-else-if="item.description && item.description.trim()" class="vc-tagged">
                  <CheckCircleOutlined /> 已标记
                </div>
              </div>

              <!-- 右侧：信息 -->
              <div class="vc-body">
                <div class="vc-name" :title="item.file.name">{{ item.file.name }}</div>
                <div class="vc-meta">
                  <span v-if="!item.isImage">
                    <ClockCircleOutlined /> {{ formatDuration(item.duration) }}
                  </span>
                  <span>
                    <FileOutlined /> {{ formatFileSize(item.file.size) }}
                  </span>
                </div>
                <div class="vc-desc">
                  <label class="vc-label">
                    <FileTextOutlined /> 视频描述
                    <span class="vc-hint">≤ 500 字，便于后续检索</span>
                  </label>
                  <a-textarea v-model:value="item.description" placeholder="由 AI 自动生成，您可以手动调整..." :rows="3"
                    :maxlength="500" show-count :disabled="uploading || uploadComplete"
                    data-guide="video-description-input" />
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作 -->
          <div class="step-actions">
            <a-button class="btn-ghost" :disabled="uploading" @click="prevStep">
              <template #icon>
                <ArrowLeftOutlined />
              </template>
              上一步
            </a-button>
            <a-button class="btn-primary" :loading="uploading" :disabled="taggedVideosCount === 0 || uploadComplete"
              data-guide="next-to-vectorize-btn" @click="startUploadAndVectorize">
              {{ uploading ? '处理中...' : '开始处理并完成' }}
              <template #icon v-if="!uploading">
                <ThunderboltOutlined />
              </template>
            </a-button>
          </div>
        </section>
      </main>

      <!-- 新建分类 -->
      <a-modal v-model:open="showCreateCategoryDialog" title="新建分类" :width="460" centered @ok="createCategory"
        @cancel="showCreateCategoryDialog = false">
        <a-form :model="newCategory" layout="vertical">
          <a-form-item label="分类名称" required>
            <a-input v-model:value="newCategory.name" placeholder="例如：产品演示 / 人物口播" />
          </a-form-item>
          <a-form-item label="分类描述">
            <a-textarea v-model:value="newCategory.description" placeholder="可选：描述分类用途" :rows="3" />
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 引导 -->
      <a-modal v-model:open="showGuide" title="使用引导" :width="500" :footer="null" centered @cancel="showGuide = false">
        <div v-if="guideSteps.length > 0" class="guide-content">
          <div class="guide-step">
            <div class="guide-index">{{ currentGuideStep + 1 }}</div>
            <div class="guide-body">
              <h4>{{ guideSteps[currentGuideStep]?.title }}</h4>
              <p>{{ guideSteps[currentGuideStep]?.description }}</p>
            </div>
          </div>
          <div class="guide-actions">
            <a-button v-if="currentGuideStep > 0" class="btn-ghost" @click="currentGuideStep--">
              <template #icon>
                <ArrowLeftOutlined />
              </template>
            </a-button>
            <a-button v-if="currentGuideStep < guideSteps.length - 1" class="btn-primary" @click="currentGuideStep++">
              下一步
              <template #icon>
                <ArrowRightOutlined />
              </template>
            </a-button>
            <a-button v-else class="btn-primary" @click="showGuide = false">
              完成
            </a-button>
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  InboxOutlined,
  DeleteOutlined,
  FolderOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FileOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  PaperClipOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ThunderboltOutlined,
  RobotOutlined
} from '@ant-design/icons-vue'
import { getAIConfig } from '../../utils'

/* ============= 工具 ============= */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

const isImageFile = (fileName) => {
  const ext = String(fileName || '').toLowerCase()
  return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.webp')
}

const statusText = (s) => {
  const map = {
    uploading: '保存中',
    vectorizing: '向量化中',
    completed: '已完成',
    error: '失败'
  }
  return map[s] || ''
}

/* ============= 路由 ============= */
const router = useRouter()

/* ============= 状态 ============= */
const stepDefs = [
  { title: '选择文件', desc: '上传素材并指定分类' },
  { title: '标记与处理', desc: 'AI 自动标记 → 向量化' }
]

const currentStep = ref(0)
const fileList = ref([])
const videoItems = ref([])
const categories = ref([])
const selectedCategoryId = ref('')
const showCreateCategoryDialog = ref(false)
const newCategory = ref({ name: '', description: '' })
const uploading = ref(false)
const aiTagging = ref(false)
const uploadComplete = ref(false)
const uploadStatus = ref('active')
const uploadedCount = ref(0)
const vectorizedCount = ref(0)
const aiProcessedCount = ref(0)
const showGuide = ref(false)
const currentGuideStep = ref(0)

const taggedVideosCount = computed(
  () => videoItems.value.filter((v) => v.description && v.description.trim()).length
)

const overallProgress = computed(() => {
  if (videoItems.value.length === 0) return 0
  return Math.floor((uploadedCount.value / videoItems.value.length) * 100)
})

const aiTotalProgress = computed(() => {
  if (videoItems.value.length === 0) return 0
  return Math.floor((aiProcessedCount.value / videoItems.value.length) * 100)
})

const guideSteps = computed(() => {
  const steps = []
  if (currentStep.value === 0) {
    steps.push({
      title: '上传步骤',
      description: '通过三个步骤完成视频上传、标记和向量化'
    })
    steps.push({
      title: '选择分类',
      description: '首先选择素材所属的分类。如果还没有分类，可以点击"新建分类"按钮创建新分类。'
    })
    steps.push({
      title: '上传文件',
      description: '点击或拖拽视频文件到此区域上传，支持批量上传。'
    })
  } else if (currentStep.value === 1) {
    steps.push({
      title: '开始处理',
      description: '确认标记信息无误后，点击"开始处理并完成"按钮。'
    })
    steps.push({
      title: '修改标记',
      description: '系统会自动为视频生成描述，您可以手动修改这些描述信息。'
    })
  }
  return steps
})

/* ============= 业务方法 ============= */
const loadCategories = async () => {
  try {
    const res = await window.api.category.list()
    if (res.success) {
      const list = res.data || []
      // 并发为每个分类补上 materialCount
      await Promise.all(
        list.map(async (cat) => {
          try {
            const countRes = await window.api.material.list({
              where: 'category_id = ?',
              whereParams: [cat.id],
              page: 1,
              pageSize: 1
            })
            cat.materialCount =
              countRes && countRes.success && countRes.pagination
                ? countRes.pagination.total || 0
                : 0
          } catch {
            cat.materialCount = 0
          }
        })
      )
      categories.value = list
    } else {
      message.error(res.message || '加载分类失败')
    }
  } catch (e) {
    message.error('加载分类列表失败')
    console.error(e)
  }
}

/**
 * 获取视频文件的时长
 * @param {File} file - 视频文件对象
 * @returns {Promise<number>} - 视频时长（秒）
 */
const getVideoDuration = (file) => {
  new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(Math.floor(video.duration))
    }
    video.onerror = () => resolve(0)
    video.src = URL.createObjectURL(file)
  })
}


/**
 * 上传文件前的校验
 * @param {File} file - 待上传文件对象
 * @returns {Promise<boolean>} - 是否校验通过
 */
const beforeUpload = async (file) => {
  const isVideo = String(file.type).startsWith('video/')
  const isImage = isImageFile(file.name || file.path)
  if (!isVideo && !isImage) {
    message.warn('仅支持上传视频或 jpg/png 图片')
    return false
  }
  fileList.value.push(file)

  const duration = isImage ? 0 : await getVideoDuration(file)
  const objectURL = URL.createObjectURL(file)

  videoItems.value.push({
    file,
    duration,
    objectURL,
    isImage,
    description: '',
    processStatus: 'normal',
    materialId: null,
    marked: true
  })

  return false
}


/**
 * 删除文件
 * @param {number} index - 文件在列表中的索引
 */
const removeFile = (index) => {
  if (videoItems.value[index]?.objectURL) {
    URL.revokeObjectURL(videoItems.value[index].objectURL)
  }
  fileList.value.splice(index, 1)
  videoItems.value.splice(index, 1)
}


/**
 * 清空所有文件
 */
const clearFiles = () => {
  videoItems.value.forEach((item) => {
    if (item.objectURL) URL.revokeObjectURL(item.objectURL)
  })
  fileList.value = []
  videoItems.value = []
}

/**
 * 视频元数据加载完成后，更新视频时长
 * @param {Object} item - 视频项对象，包含 objectURL 和 duration 属性
 */
const onLoadedMetadata = (item) => {
  const videoEl = document.querySelector(`video[src="${item.objectURL}"]`)
  if (videoEl && videoEl.duration) {
    item.duration = Math.floor(videoEl.duration)
  }
}

/**
 * 进入下一个步骤
 */
const nextStep = () => {
  if (currentStep.value === 0) {
    if (!selectedCategoryId.value) {
      message.warn('请先选择或创建一个分类')
      return
    }
    currentStep.value++
    setTimeout(() => batchAITag(), 500)
  }
}

/**
 * 进入上一个步骤
 */
const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

/**
 * 返回素材管理页面
 */
const goBack = () => {
  router.push({
    name: 'MaterialManager'
  })
}


/**
 * 显示创建分类弹窗
 */
const showCreateCategory = () => {
  showCreateCategoryDialog.value = true
}

/**
 * 创建新分类
 */
const createCategory = async () => {
  if (!newCategory.value.name.trim()) {
    message.warn('请输入分类名称')
    return
  }
  try {
    const res = await window.api.category.create({
      name: newCategory.value.name,
      description: newCategory.value.description
    })


    if (res.success) {
      message.success('分类创建成功')
      showCreateCategoryDialog.value = false
      newCategory.value = { name: '', description: '' }
      await loadCategories()
      selectedCategoryId.value = res.data.id
    } else {
      message.error(res.message || '创建失败')
    }
  } catch (e) {
    message.error('创建分类失败')
    console.error(e)
  }
}

/* ============= AI 批量标记 ============= */
const batchAITag = async () => {
  if (videoItems.value.length === 0) {
    message.warn('没有素材可以进行 AI 标记')
    return
  }
  if (!selectedCategoryId.value) {
    message.warn('请先选择分类')
    return
  }

  aiTagging.value = true
  aiProcessedCount.value = 0

  try {
    const aiConfig = await getAIConfig()
    if (!aiConfig || !aiConfig.apiKey) {
      message.error('请先在设置中配置 LLM 服务的 API Key')
      aiTagging.value = false
      return
    }

    const materialIds = []
    for (let i = 0; i < videoItems.value.length; i++) {
      const item = videoItems.value[i]
      if (item.materialId) {
        materialIds.push(item.materialId)
        continue
      }

      const filePath = window.api.getPathForFile(item.file)
      if (!filePath) {
        console.error(`获取文件路径失败 (素材 ${i + 1})`)
        continue
      }

      const remark = item.description || ''
      const duration = Number(item.duration) || 0
      const saveRes = item.isImage
        ? await window.api.material.uploadImage(
          String(filePath),
          String(selectedCategoryId.value),
          { remark, duration }
        )
        : await window.api.material.uploadVideo(
          String(filePath),
          String(selectedCategoryId.value),
          { remark, duration }
        )
      if (saveRes.success) {
        item.materialId = saveRes.data.id
        materialIds.push(saveRes.data.id)
      } else {
        console.error(`素材 ${i + 1} 保存失败:`, saveRes.message)
      }
    }

    if (materialIds.length === 0) {
      message.error('没有素材可以进行 AI 标记')
      aiTagging.value = false
      return
    }

    message.info(`已保存 ${materialIds.length} 个素材，开始 AI 分析`)

    const options = {
      baseURL: String(aiConfig.baseURL || ''),
      apiKey: String(aiConfig.apiKey || ''),
      visionModel: aiConfig.visionModel || 'doubao-seed-2-0-lite-260428',
      fps: aiConfig.fps || 2
    }

    let successCount = 0, failCount = 0
    const concurrency = 5
    const tasks = []
    const running = []

    const processItem = async (materialId) => {
      const idx = videoItems.value.findIndex((v) => v.materialId === materialId)
      if (idx === -1) {
        console.warn(`未找到 materialId 为 ${materialId} 的视频`)
        return { success: true }
      }
      const item = videoItems.value[idx]
      try {
        const result = await window.api.material.batchProcess([materialId], options)
        if (result.success && result.data && result.data.length > 0) {
          const data = result.data[0]
          if (data.success) {
            successCount++
            if (data.data && data.data.description && data.data.description.trim()) {
              item.description = data.data.description
            }
            item.marked = true
            videoItems.value = [...videoItems.value]
            aiProcessedCount.value++
            return { success: true }
          } else {
            failCount++
            aiProcessedCount.value++
            console.error(`素材 ${item.file.name} 标记失败:`, data.message)
            return { success: true, error: data.message }
          }
        }
        failCount++
        aiProcessedCount.value++
        console.error(`素材 ${item.file.name} 标记失败`)
        return { success: true }
      } catch (e) {
        failCount++
        aiProcessedCount.value++
        console.error(`素材 ${item.file.name} 异常:`, e)
        return { success: true, error: e.message }
      }
    }

    for (let i = 0; i < materialIds.length; i++) {
      const task = processItem(materialIds[i]).finally(() => {
        const idx = running.indexOf(task)
        if (idx > -1) running.splice(idx, 1)
      })
      tasks.push(task)
      running.push(task)
      if (running.length >= concurrency) {
        await Promise.race(running)
      }
    }
    await Promise.all(tasks)

    if (failCount === 0) {
      message.success('AI 自动标记完成，您可以修改标记内容或点击下一步进行向量化')
    } else {
      message.warning(`AI 标记完成：成功 ${successCount} 个，失败 ${failCount} 个`)
    }
  } catch (e) {
    console.error('AI 标记过程出错:', e)
    message.error('AI 标记失败: ' + e.message)
  } finally {
    aiTagging.value = false
  }
}

/* ============= 开始处理（保存 + 向量化） ============= */
const startUploadAndVectorize = async () => {
  if (!selectedCategoryId.value) {
    message.warn('请先选择分类')
    return
  }
  uploading.value = true
  uploadedCount.value = 0
  uploadStatus.value = 'active'

  try {
    for (let i = 0; i < videoItems.value.length; i++) {
      const item = videoItems.value[i]
      try {
        const filePath = window.api.getPathForFile(item.file)
        if (!filePath) {
          console.error(`获取文件路径失败 (素材 ${i + 1})`)
          item.processStatus = 'error'
          continue
        }

        if (!item.materialId) {
          item.processStatus = 'uploading'
          const remark = item.description || ''
          const duration = Number(item.duration) || 0
          const saveRes = item.isImage
            ? await window.api.material.uploadImage(
              String(filePath),
              String(selectedCategoryId.value),
              { remark, duration }
            )
            : await window.api.material.uploadVideo(
              String(filePath),
              String(selectedCategoryId.value),
              { remark, duration }
            )
          if (!saveRes.success) {
            console.error(`素材 ${i + 1} 保存失败:`, saveRes.message)
            item.processStatus = 'error'
            continue
          }
          item.materialId = saveRes.data.id
        }

        item.processStatus = 'vectorizing'

        const descriptionText = [
          `文件名: ${item.file.name}`,
          `描述: ${item.description || '无描述'}`,
          `时长: ${item.duration}秒`
        ].join('\n')

        const metadata = {
          fileName: String(item.file.name),
          filePath: String(filePath),
          duration: Number(item.duration) || 0,
          description: String(item.description || ''),
          mediaType: item.isImage ? 'image' : 'video',
          categoryId: String(selectedCategoryId.value),
          fileSize: Number(item.file.size) || 0,
          materialId: String(item.materialId),
          createdTime: new Date().toISOString()
        }

        const vectorRes = await window.api.vector.embed(descriptionText, metadata)

        if (!vectorRes.success) {
          console.error(`素材 ${i + 1} 向量化失败:`, vectorRes.message)
          item.processStatus = 'error'
          continue
        }

        item.vectorId = vectorRes.data.vector_id
        uploadedCount.value++
        item.processStatus = 'completed'
      } catch (e) {
        console.error(`处理素材 ${i + 1} 失败:`, e)
        item.processStatus = 'error'
      }
    }

    const completed = videoItems.value.filter((v) => v.processStatus === 'completed').length
    const errors = videoItems.value.filter((v) => v.processStatus === 'error').length
    if (errors === 0) {
      uploadStatus.value = 'success'
      message.success(`成功处理 ${completed} 个素材并完成向量化`)
      uploadComplete.value = true
      setTimeout(() => goBack(), 1500)
    } else {
      uploadStatus.value = 'exception'
      message.warning(`处理完成：成功 ${completed} 个，失败 ${errors} 个`)
      uploadComplete.value = true
    }
  } catch (e) {
    uploadStatus.value = 'exception'
    message.error('处理过程出错')
    console.error('处理错误:', e)
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
/* ============================================================
   步骤条
   ============================================================ */
.steps-wrap {
  margin: 0 0 20px;
  padding: 0;
}

.steps-track {
  display: flex;
  gap: 16px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.step-pill {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  transition: all 0.25s ease;
}

.step-pill.done {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.3);
}

.step-pill.active {
  background: linear-gradient(135deg, rgba(217, 70, 239, 0.18), rgba(124, 58, 237, 0.18));
  border-color: rgba(217, 70, 239, 0.4);
  box-shadow: 0 4px 16px rgba(217, 70, 239, 0.18);
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.step-pill.active .step-circle {
  background: linear-gradient(135deg, #d946ef, #7c3aed);
  color: #fff;
  box-shadow: 0 4px 12px rgba(217, 70, 239, 0.5);
}

.step-pill.done .step-circle {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
}

.step-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  margin: 0;
  padding: 0;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
  line-height: 1.4;
}

.step-pill:not(.active):not(.done) .step-title {
  color: #94a3b8;
}

.step-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

/* ============================================================
   卡片面板头
   ============================================================ */
.panel-head {
  margin: 0 0 18px;
  padding: 0;
}

.panel-head h2 {
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 4px;
}

.panel-head p {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

/* ============================================================
   表单行
   ============================================================ */
.form-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin: 0 0 16px;
  padding: 0;
}

.form-row__label {
  flex-shrink: 0;
  width: 120px;
  margin: 0;
  padding: 8px 0 0;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
  margin: 0 0 4px;
}

.form-hint {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.form-row__control {
  flex: 1;
  margin: 0;
  padding: 0;
}

.category-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.category-select {
  flex: 1;
  max-width: 400px;
}

.cat-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.cat-icon {
  color: #f0abfc;
}

.cat-count {
  margin-left: 4px;
  background: rgba(217, 70, 239, 0.18);
  color: #f0abfc;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  font-weight: 600;
  width: 20px;
  height: 20px;
  text-align: center;
  align-items: center;
  justify-content: center;
  display: flex;
}

.form-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  margin: 24px 0;
}



.dragger-inner {
  padding: 40px 20px;
  text-align: center;
  margin: 0;
}

.dragger-icon {
  font-size: 56px;
  color: #d946ef;
  filter: drop-shadow(0 0 16px rgba(217, 70, 239, 0.4));
  margin: 0 0 12px;
}

.dragger-title {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 8px;
}

.dragger-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

/* ============= 文件列表 ============= */
.file-list {
  margin: 24px 0 0;
  padding: 0;
}

.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 12px;
  padding: 0;
}

.list-head h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  padding: 0;
}

.list-icon {
  color: #d946ef;
}

.count-chip {
  background: rgba(217, 70, 239, 0.15);
  color: #f0abfc;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  font-weight: 600;
  margin: 0;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s ease;
  margin: 0;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(217, 70, 239, 0.3);
}

.file-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(217, 70, 239, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d946ef;
  font-size: 18px;
  flex-shrink: 0;
  margin: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.file-size {
  font-size: 11px;
  color: #64748b;
  margin: 2px 0 0;
}

/* ============= 状态提示 ============= */
.status-alert {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(217, 70, 239, 0.25);
  border-radius: 12px;
  margin: 0 0 20px;
}

.alert-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(217, 70, 239, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d946ef;
  font-size: 18px;
  flex-shrink: 0;
  margin: 0;
}

.alert-icon--success {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.alert-icon--error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.alert-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.alert-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
}

.alert-title {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.alert-progress {
  font-size: 12px;
  color: #f0abfc;
  font-weight: 600;
  margin: 0;
}

/* ============= 标记工具栏 ============= */
.tagging-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 16px;
  padding: 0;
}

.tagging-count {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.tagging-count strong {
  color: #f0abfc;
  font-weight: 700;
}

/* ============= 视频卡片 ============= */
.video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
  padding: 0;
}

.video-card {
  display: flex;
  gap: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  transition: all 0.25s ease;
  margin: 0;
}

.video-card.is-tagged {
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.04);
}

.video-card.is-processing {
  opacity: 0.85;
}

.vc-preview {
  position: relative;
  width: 240px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  aspect-ratio: 16 / 9;
  margin: 0;
}

.vc-img,
.vc-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  margin: 0;
  padding: 0;
}

.vc-type-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  backdrop-filter: blur(6px);
  margin: 0;
}

.vc-type-badge.video {
  background: linear-gradient(135deg, rgba(217, 70, 239, 0.65), rgba(124, 58, 237, 0.65));
  color: #fff;
}

.vc-type-badge.image {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.65), rgba(59, 130, 246, 0.65));
  color: #fff;
}

.vc-status {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  backdrop-filter: blur(6px);
  margin: 0;
}

.vc-status.uploading {
  color: #fcd34d;
}

.vc-status.vectorizing {
  color: #d946ef;
}

.vc-status.completed {
  color: #4ade80;
}

.vc-status.error {
  color: #fca5a5;
}

.vc-tagged {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(34, 197, 94, 0.85);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  margin: 0;
}

.vc-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.vc-name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.vc-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.vc-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.vc-desc {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
}

.vc-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #cbd5e1;
  margin: 0;
}

.vc-hint {
  font-size: 11px;
  color: #64748b;
  font-weight: 400;
  margin: 0 0 0 4px;
}

/* ============================================================
   图标按钮（antd type="text"）
   ============================================================ */
.icon-btn {
  color: #94a3b8;
}

.icon-btn:hover {
  background: rgba(217, 70, 239, 0.1);
  color: #f0abfc;
}

.icon-btn.danger {
  color: #ef4444;
}

.icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
}

/* ============================================================
   步骤底部操作
   ============================================================ */
.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin: 24px 0 0;
  padding: 16px 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* ============================================================
   引导
   ============================================================ */
.guide-content {
  padding: 8px 0;
  margin: 0;
}

.guide-step {
  display: flex;
  gap: 16px;
  margin: 0 0 24px;
  padding: 0;
}

.guide-index {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d946ef, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
  margin: 0;
}

.guide-body {
  flex: 1;
  margin: 0;
  padding: 4px 0 0;
}

.guide-body h4 {
  font-size: 15px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 8px;
}

.guide-body p {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0;
}

.guide-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin: 0;
  padding: 0;
}

/* ============= 响应式 ============= */
@media (max-width: 1100px) {
  .steps-track {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 720px) {
  .video-card {
    flex-direction: column;
  }

  .vc-preview {
    width: 100%;
  }

  .form-row {
    flex-direction: column;
    gap: 8px;
  }

  .form-row__label {
    width: 100%;
    padding: 0;
  }

  .step-actions {
    flex-direction: column-reverse;
  }

  .step-actions .ant-btn {
    width: 100%;
  }
}
</style>
