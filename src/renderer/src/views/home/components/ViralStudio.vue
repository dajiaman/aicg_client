<script setup>
import { usePipeline } from '../../../hooks/usePipeline'

import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import ModuleNav from '../../../components/studio/ModuleNav.vue'
import SourcePanel from '../../../components/studio/SourcePanel.vue'
import SubtitlePanel from '../../../components/studio/SubtitlePanel.vue'
import TitlePanel from '../../../components/studio/TitlePanel.vue'
import BgmPanel from '../../../components/studio/BgmPanel.vue'
import PipMixcutPanel from '../../../components/studio/PipMixcutPanel.vue'
import BenchmarkProgress from '../../../components/BenchmarkProgress.vue'
import PreviewStage from '../../../components/studio/PreviewStage.vue'
import SubtitleSettingsModal from '../../../components/studio/SubtitleSettingsModal.vue'
import { subtitleStylePresets, titleStylePresets } from '../../../constants/index.js'
import { usePermission } from '../../../hooks/usePermission.js'

import StudioHeader from '../../../components/studio/StudioHeader.vue'
import { useVideoEdit } from '../../../hooks/useVideoEdit.js'

const {
  loading,
  sourceVideoPath,
  previewVideoPath,
  editableSubtitles,
  subtitleEditorVisible,
  materialCategories,
  materialCategoriesLoading,
  materialCategoryMissingTooltip,
  materialCategoryVectorTooltip,
  bgmList,
  bgmListLoading,
  config,
  dataGenerating,
  videoGenerating,
  titleGenerating,
  previewingBgm,
  progressText,
  // 计算
  displayVideoPath,
  displayVideoSrc,
  displayVideoName,
  canGenerate,
  canGenerateTitle,
  bgmSummary,
  mixcutSummary,
  soundEffectSummary,
  subtitleSummary,
  titleSummary,

  // 方法
  selectSourceVideo,
  selectBackgroundMusic,
  selectBgmResource,
  togglePreviewBgm,
  generateCompositionData,
  generateVideo,

  syncMixcutCategory,
  clearMixcut,

  syncEditableFromCompositionData,
  generateTitleText
} = useVideoEdit()

const { pipeline,
  updatePipelineData,
  notifyStepStart, notifyStepError, notifyStepComplete } = usePipeline()
const { checkFullPermission } = usePermission()

const activeModule = ref('subtitle')
const previewMode = ref('edit') // 'edit' | 'rendered'

// 预览帧
const previewFrameSrc = ref('')
const previewFrameHeight = ref(800)
// 预览帧加载中
const previewFrameLoading = ref(false)
const renderedDirty = ref(false)
const showSubtitleModal = ref(false)

// 画中画混剪面板是否可见
const pipEditorVisible = ref(false)

const modalWidth = ref(800)

const subtitleEditorLayout = reactive({
  modalWidth: 720,
  tableScrollX: 600,
  tableScrollY: 300
})

const subtitleEditorBodyStyle = reactive({
  padding: '16px',
  overflow: 'auto'
})

const pipEditorOverlayStyle = reactive({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1000,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})
const pipDraftSubtitles = ref([])
const pipSelectedKeys = ref([])
const pipSourceMode = ref('library')
const pipLibraryCategoryId = ref('')
const pipLibraryAssets = ref([])
const pipLibraryLoading = ref(false)
const pipLibraryPage = ref(1)
const pipLibraryPageSize = ref(12)
const pipLibraryTotal = ref(0)
const pipSelectedMaterialPath = ref('')
const localPipPath = ref('')

// ----- 字幕列定义 -----
const subtitleColumns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 50 },
  { title: '字幕内容', dataIndex: 'text', key: 'text', width: 200 },
  { title: '开始时间', dataIndex: 'start', key: 'start', width: 80 },
  { title: '结束时间', dataIndex: 'end', key: 'end', width: 80 },
  { title: '时长', dataIndex: 'duration', key: 'duration', width: 60 },
  { title: '操作', key: 'actions', width: 100 }
]

const moduleItems = computed(() => [
  {
    key: 'source',
    title: '音视频参数',
    summary: `人声 ${config.source.voiceVolume.toFixed(1)} · ${config.source.playbackRate.toFixed(2)}x`,
    enabled: true,
    switchable: false
  },
  {
    key: 'title',
    title: '标题',
    summary: titleSummary.value,
    enabled: config.title.enabled
  },
  {
    key: 'subtitle',
    title: '字幕',
    summary: subtitleSummary.value,
    enabled: config.subtitle.enabled
  },
  {
    key: 'soundEffect',
    title: '音效',
    summary: soundEffectSummary.value,
    enabled: config.soundEffect.enabled
  },
  {
    key: 'bgm',
    title: '背景音乐',
    summary: bgmSummary.value,
    enabled: config.bgm.enabled
  },
  {
    key: 'mixcut',
    title: '画中画混剪',
    summary: mixcutSummary.value,
    enabled: !!config.mixcut.enabled
  }
])

const activeModuleMeta = computed(
  () => moduleItems.value.find((m) => m.key === activeModule.value) || moduleItems.value[0]
)

const pipSelectedCount = computed(() => pipSelectedKeys.value.length)
const pipSelectedDuration = computed(() => {
  const selected = pipDraftSubtitles.value.filter((item) =>
    pipSelectedKeys.value.includes(item.index)
  )
  return selected.reduce((sum, item) => sum + (item.duration || 0), 0)
})

const pipMaterialCategoryOptions = computed(() => materialCategories.value)

/**
 * 编辑字幕
 */
const handleEditSubtitles = () => {
  if (!displayVideoPath.value) {
    message.warning('请先选择视频源')
    return
  }

  if (!pipeline.compositionData) {
    message.warning('请先生成字幕数据')
    return
  }

  if (pipeline.compositionData?.convertedSubtitles) {
    syncEditableFromCompositionData(pipeline.compositionData)
  }

  subtitleEditorVisible.value = true
}

/**
 * 确认编辑字幕
 */
const handleSubtitleEditConfirm = () => {
  const compData = pipeline.compositionData
  if (compData) {
    compData.convertedSubtitles = JSON.parse(JSON.stringify(editableSubtitles.value))
    // 同步字幕结果
    if (compData.subtitleResult?.subtitles) {
      compData.subtitleResult.subtitles = editableSubtitles.value.map((item, idx) => ({
        ...(compData.subtitleResult.subtitles?.[idx] || {}),
        id: 'subtitle_' + item.index,
        text: item.text,
        start: item.start,
        end: item.end
      }))
    }

    if (compData.llmContent?.subtitles) {
      compData.llmContent.subtitles = editableSubtitles.value.map((item) => ({
        text: item.text,
        start_time: item.start,
        end_time: item.end
      }))
    }
    updatePipelineData({ compositionData: compData })
    renderedDirty.value = true
  }

  subtitleEditorVisible.value = false
  message.success('字幕已更新，剪辑时将使用新的字幕内容')
}

/**
 * 字幕开始时间改变
 */
function handleSubtitleStartChange(record) {
  record.duration = record.end - record.start
  renderedDirty.value = true
}

/**
 * 字幕结束时间改变
 */
function handleSubtitleEndChange(record) {
  record.duration = record.end - record.start
  renderedDirty.value = true
}

/**
 * 字幕文本改变
 */
function handleSubtitleTextChange(record) {
  renderedDirty.value = true
}

/**
 * 删除字幕行
 */
function handleDeleteSubtitleRow(record) {
  const idx = editableSubtitles.value.indexOf(record)
  if (idx > -1 && editableSubtitles.value.length > 1) {
    editableSubtitles.value.splice(idx, 1)
    renderedDirty.value = true
  }
}

/**
 * 插入字幕行
 */
function handleInsertSubtitleRow(record) {
  const idx = editableSubtitles.value.indexOf(record)
  const newItem = {
    index: editableSubtitles.value.length,
    text: '',
    start: record.start,
    end: record.start + 0.5,
    duration: 0.5,
    pipVideoPath: null,
    pipGroupId: null,
    willClip: true
  }
  editableSubtitles.value.splice(idx + 1, 0, newItem)
  renderedDirty.value = true
}

// ----- 模块切换 -----
const setActiveModule = (key) => {
  activeModule.value = key
}

/**
 * 切换模块状态
 */
const handleModuleToggle = (key, enabled) => {
  const map = {
    subtitle: () => {
      config.subtitle.enabled = enabled
    },
    title: () => {
      config.title.enabled = enabled
    },
    namecard: () => {
      config.namecard.enabled = enabled
    },
    soundEffect: () => {
      config.soundEffect.enabled = enabled
    },
    bgm: () => {
      config.bgm.enabled = enabled
    },
    mixcut: () => {
      config.mixcut.enabled = enabled
      if (enabled) {
        syncMixcutCategory()
      } else {
        clearMixcut()
      }
    }
  }
  map[key]?.()
  renderedDirty.value = true
}

/**
 * 应用字幕样式预设
 */
const applySubtitlePreset = (preset) => {
  config.subtitle.mode = 'template'
  config.subtitle.presetId = preset.id
  config.subtitle.templateId = preset.templateId || null

  if (preset.config) {
    Object.assign(config.subtitle.customConfig, preset.config)
  }

  renderedDirty.value = true
  message.success('已选择字幕样式：' + preset.name)
}

/**
 * 确认字幕样式设置
 */
const handleSubtitleConfirm = (settings) => {
  Object.assign(config.subtitle.customConfig, settings)
  showSubtitleModal.value = false
  renderedDirty.value = true
  message.success('字幕样式设置已保存')
}

// ----- 标题 -----
const applyTitlePreset = (preset) => {
  config.title.mode = 'template'
  config.title.presetId = preset.id
  if (preset.style) {
    // 修复：先清空旧 style 字段，避免上一个预设没定义而当前预设也没带的字段（如 shadowColor/backgroundOpacity）残留导致切换后样式"残留"
    for (const key in config.title.style) delete config.title.style[key]
    Object.assign(config.title.style, preset.style)
  }
  renderedDirty.value = true
  message.success('已选择标题样式：' + preset.name)
}

/**
 * 标题文本编辑
 */
const handleTitleTextEdited = () => {
  config.title.ai.manualEdited = true
  renderedDirty.value = true
}

/**
 * 标题偏移更新更新
 */
const handleTitleOffsetUpdate = (offsetY) => {
  config.title.style.offsetY = parseInt(offsetY)
  renderedDirty.value = true
}

// ----- 名片 -----
const handleNamecardPositionUpdate = ({ offsetX, offsetY }) => {
  config.namecard.style.offsetX = parseInt(offsetX)
  config.namecard.style.offsetY = parseInt(offsetY)
  renderedDirty.value = true
}

// ----- 画中画编辑器 -----
const handleEditPipMixcut = () => {
  if (!displayVideoPath.value) {
    message.warning('请先选择视频源')
    return
  }

  if (!pipeline && !pipeline?.compositionData) {
    message.warning('请先生成字幕数据')
    return
  }

  pipDraftSubtitles.value = JSON.parse(JSON.stringify(editableSubtitles.value))
  pipSelectedKeys.value = []
  pipSourceMode.value = 'library'
  pipLibraryCategoryId.value = config.mixcut.categoryId || ''
  pipSelectedMaterialPath.value = ''
  localPipPath.value = ''
  pipEditorVisible.value = true
  if (pipLibraryCategoryId.value) loadPipLibraryMaterials(pipLibraryCategoryId.value)
}

/**
 * 加载画中画素材库
 */
const loadPipLibraryMaterials = async (categoryId) => {
  if (!categoryId) {
    pipLibraryAssets.value = []
    return
  }
  pipLibraryLoading.value = true
  try {
    const result = await window.api.material.list({
      where: 'category_id = ?',
      whereParams: [categoryId],
      page: pipLibraryPage.value,
      pageSize: pipLibraryPageSize.value,
      orderBy: 'created_at DESC'
    })
    if (result.success) {
      const items = result.data || []
      pipLibraryAssets.value = items
        .filter(
          (item) =>
            item.file_path &&
            /\.(mp4|mov|avi|mkv|flv|webm|png|jpg|jpeg|gif|webp)$/i.test(item.file_path)
        )
        .map((item) => ({
          ...item,
          preview: getMediaPreview(item.file_path)
        }))
      pipLibraryTotal.value = result.pagination?.total || items.length
    }
  } catch (e) {
    console.error('加载画中画素材失败:', e)
    message.error('加载画中画素材失败：' + e.message)
  } finally {
    pipLibraryLoading.value = false
  }
}

/**
 * 获取媒体预览
 */
function getMediaPreview(path) {
  const ext = path.split('.').pop().toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    return { type: 'image', src: 'file://' + path }
  }
  return { type: 'video', src: 'file://' + path + '#t=0.1' }
}

const handlePipRowClick = (row, event) => {
  const idx = row.index
  if (event.shiftKey) {
    const lastKey = pipSelectedKeys.value.length
      ? pipSelectedKeys.value[pipSelectedKeys.value.length - 1]
      : null
    if (lastKey !== null) {
      const start = Math.min(lastKey, idx),
        end = Math.max(lastKey, idx)
      const range = []
      for (let i = start; i <= end; i++) range.push(i)
      pipSelectedKeys.value = range
    } else {
      pipSelectedKeys.value = [idx]
    }
  } else {
    if (pipSelectedKeys.value.includes(idx)) {
      pipSelectedKeys.value = pipSelectedKeys.value.filter((k) => k !== idx)
    } else {
      pipSelectedKeys.value = [...pipSelectedKeys.value, idx]
    }
  }
}

/**
 * 全选画中画行
 */
const selectAllPipRows = () => {
  pipSelectedKeys.value = pipDraftSubtitles.value.map((item) => item.index)
}
const clearPipSelection = () => {
  pipSelectedKeys.value = []
}

const clearSelectedPipMedia = () => {
  if (!pipSelectedKeys.value.length) {
    message.warning('请先选择要清除画中画的字幕')
    return
  }
  pipDraftSubtitles.value.forEach((item) => {
    if (pipSelectedKeys.value.includes(item.index)) {
      item.pipVideoPath = null
      item.pipGroupId = null
    }
  })
  message.success('已清除所选字幕的画中画')
}

const applyLibraryPipMedia = () => {
  if (!pipSelectedKeys.value.length) {
    message.warning('请先选择字幕片段')
    return
  }
  if (!pipSelectedMaterialPath.value) {
    message.warning('请先从素材库选择素材')
    return
  }
  const groupId = 'group_' + Date.now()
  pipDraftSubtitles.value.forEach((item) => {
    if (pipSelectedKeys.value.includes(item.index)) {
      item.pipVideoPath = pipSelectedMaterialPath.value
      item.pipGroupId = groupId
    }
  })
  message.success('已应用素材到所选字幕')
}

const selectLocalPipFile = async () => {
  try {
    const result = await window.api.file.selectFile({
      title: '选择画中画素材（视频/图片）',
      filters: [
        {
          name: '媒体文件',
          extensions: [
            'mp4',
            'mov',
            'avi',
            'mkv',
            'flv',
            'webm',
            'png',
            'jpg',
            'jpeg',
            'gif',
            'webp'
          ]
        }
      ]
    })
    if (result.success && !result.data.canceled && result.data.filePaths.length) {
      localPipPath.value = result.data.filePaths[0]
    }
  } catch (e) {
    console.error('选择画中画素材失败:', e)
    message.error('选择画中画素材失败：' + e.message)
  }
}

const applyLocalPipMedia = () => {
  if (!pipSelectedKeys.value.length) {
    message.warning('请先选择字幕片段')
    return
  }
  if (!localPipPath.value) {
    message.warning('请先选择本地素材')
    return
  }
  const groupId = 'group_' + Date.now()
  pipDraftSubtitles.value.forEach((item) => {
    if (pipSelectedKeys.value.includes(item.index)) {
      item.pipVideoPath = localPipPath.value
      item.pipGroupId = groupId
    }
  })
  message.success('已应用本地素材到所选字幕')
}

/**
 * 确认画中画编辑
 */
const handlePipEditorConfirm = () => {
  editableSubtitles.value = JSON.parse(JSON.stringify(pipDraftSubtitles.value))
  const compData = pipeline.compositionData
  if (compData) {
    compData.convertedSubtitles = JSON.parse(JSON.stringify(editableSubtitles.value))
    updatePipelineData({ compositionData: compData })
  }

  pipEditorVisible.value = false
  renderedDirty.value = true
  message.success('画中画设置已保存，剪辑时将使用这些素材')
}

/**
 * 切换画中画素材库分类
 */
const handlePipCategoryChange = (val) => {
  pipLibraryCategoryId.value = val
  loadPipLibraryMaterials(val)
}

/**
 * 切换画中画素材库分页
 */
const handlePipMaterialPageChange = (page) => {
  pipLibraryPage.value = page
  loadPipLibraryMaterials(pipLibraryCategoryId.value)
}

/**
 * 打开文件所在文件夹
 */
const handleOpenFileInFolder = (path) => {
  if (!path) return
  try {
    window.api.file.showInFolder(path.replace(/^file:\/\//, ''))
  } catch (e) {
    console.error('打开文件夹失败:', e)
  }
}

/**
 * 导出视频
 */
const handleExportVideo = (path) => {
  if (!path) return
  try {
    const fileName = path.split(/[\\/]/).pop() || 'video.mp4'
    window.api.file
      .saveDialog({
        title: '导出视频',
        defaultPath: fileName,
        filters: [{ name: 'MP4 视频', extensions: ['mp4'] }]
      })
      .then((result) => {
        if (result.success && !result.data.canceled && result.data.filePath) {
          window.api.file
            .copy(path.replace(/^file:\/\//, ''), result.data.filePath)
            .then(() => message.success('视频导出成功'))
            .catch((e) => message.error('导出失败：' + e.message))
        }
      })
  } catch (e) {
    message.error('导出视频失败：' + e.message)
  }
}

/**
 * 格式化时间
 */
const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60),
    secs = Math.floor(seconds % 60)
  return mins + ':' + String(secs).padStart(2, '0')
}

/**
 * 获取文件名
 */
const getFileName = (path) => (path ? path.split(/[\\/]/).pop() || '' : '')
const formatPipDuration = (seconds) => (seconds ? seconds.toFixed(1) : '0.0')
const formatPipFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

/**
 * 自定义画中画
 */
const openManual = () => {
  handleEditPipMixcut()
}

// ============================================================
// 5. 工作流集成
// ============================================================
const handleBeforeNext = () => {
  if (!pipeline.previewVideoPath && !pipeline.generatedVideoPath) {
    message.warning('请先生成剪辑结果')
    return false
  }

  updatePipelineData({ previewVideoPath: pipeline.previewVideoPath, publishVideoPath: pipeline.previewVideoPath })

  return true
}

defineExpose({ handleBeforeNext, generateCompositionData, generateVideo })

/**
 * 生成视频封面
 */
const generateVideoFrame = async () => {
  if (!config.source.videoPath) {
    console.warn('视频路径为空，无法生成封面')
    return
  }

  try {
    previewFrameLoading.value = true
    const res = await window.api.file.getTempPath()
    const tempDir = res.success ? res.data.tempDir : ''
    const outputPath = pathJoin(tempDir, `cover_frame_${Date.now()}.jpg`)
    const coverRes = await window.api.video.getCover(config.source.videoPath, outputPath)
    if (coverRes.success) {
      previewFrameSrc.value = coverRes.data.coverPath
      previewFrameHeight.value = coverRes.data.height
    }
  } catch (e) {
    console.error('生成视频封面失败:', e)
  } finally {
    setTimeout(() => {
      previewFrameLoading.value = false
    }, 10)
  }
}

/**
 * 生成视频剪辑数据
 */
const handleGenerateCompositionData = () => {
  const videoPath = sourceVideoPath.value
  console.log('videoPath:', videoPath)
  generateCompositionData(videoPath)
}

/**
 * 生成标题文本
 */
const handleGenerateTitleText = () => {
  generateTitleText({ force: true, auto: true })
}

/**
 * 生成视频
 */
const handleGenerateVideo = async () => {
  if (!checkFullPermission('视频剪辑')) return

  try {
    const videoPath = sourceVideoPath.value

    notifyStepStart('videoEdit')
    const result = await generateVideo(videoPath)
    if (result.success) {
      previewMode.value = 'rendered'
      notifyStepComplete('videoEdit', result.data)
    }
  } catch (e) {
    console.error('生成视频失败:', e)
    message.error('生成视频失败：' + e.message)
    notifyStepError('videoEdit', new Error(e.message))
  }
}

/**
 * 更新预览模式
 */
const handleUpdatePreviewMode = (newMode) => {
  console.log('更新预览模式:', newMode)
  previewMode.value = newMode
}
</script>

<template>
  <div ref="studioRef" class="viral-studio-step" :class="{ executing: loading }">
    <StudioHeader :display-video-path="displayVideoPath" :display-video-name="displayVideoName"
      :can-generate="canGenerate" :data-generating="dataGenerating" :video-generating="videoGenerating"
      @select-video="selectSourceVideo" @generate-data="handleGenerateCompositionData"
      @edit-subtitles="handleEditSubtitles" @generate-video="handleGenerateVideo" />

    <!-- ===== 主体三列布局 ===== -->
    <div class="studio-layout">
      <!-- 左侧导航 -->

      <ModuleNav :modules="moduleItems" :active-key="activeModule" @select="setActiveModule"
        @toggle="handleModuleToggle" />

      <section class="module-detail">
        <div class="detail-head">
          <div>
            <h3>{{ activeModuleMeta.title }}</h3>
            <p>{{ activeModuleMeta.summary }}</p>
          </div>
        </div>
        <div class="detail-body">
          <SourcePanel v-if="activeModule === 'source'" :config="config.source" :display-video-path="displayVideoPath"
            :display-video-name="displayVideoName" :show-source="true" @select-video="selectSourceVideo" />

          <!-- 字幕面板 -->
          <SubtitlePanel v-else-if="activeModule === 'subtitle'" :config="config.subtitle"
            :presets="subtitleStylePresets" @open-settings="showSubtitleModal = true"
            @apply-preset="applySubtitlePreset" />

          <!-- 标题面板 -->
          <TitlePanel v-else-if="activeModule === 'title'" :config="config.title" :presets="titleStylePresets"
            :title-generating="titleGenerating" :preview-frame-height="previewFrameHeight"
            :can-generate-title="canGenerateTitle" @apply-preset="applyTitlePreset"
            @generate-title="handleGenerateTitleText" @text-edited="handleTitleTextEdited"
            @offset-update="handleTitleOffsetUpdate" />

          <!-- 音效面板 -->
          <div v-else-if="activeModule === 'soundEffect'" class="simple-setting">
            <h4>{{ config.soundEffect.enabled ? '已开启 AI 音效' : '音效已关闭' }}</h4>
            <p>
              {{
                config.soundEffect.enabled
                  ? '剪辑时会根据文案内容自动匹配合适的音效。'
                  : '开启后，系统会根据文案内容自动匹配合适的音效。'
              }}
            </p>
          </div>

          <!-- BGM面板 -->
          <BgmPanel v-else-if="activeModule === 'bgm'" :config="config.bgm" :bgm-list="bgmList"
            :loading="bgmListLoading" :previewing-path="previewingBgm" @select-upload="selectBackgroundMusic"
            @select-resource="selectBgmResource" @preview="togglePreviewBgm" />

          <!-- 画中画混剪面板 -->
          <PipMixcutPanel v-else-if="activeModule === 'mixcut'" :config="config.mixcut" :categories="materialCategories"
            :loading="materialCategoriesLoading" :missing-tip="materialCategoryMissingTooltip"
            :vector-tip="materialCategoryVectorTooltip" @change="syncMixcutCategory" @open-manual="openManual"
            @clear="clearMixcut" />
        </div>
      </section>

      <PreviewStage :source-video-src="displayVideoSrc" :preview-video-path="previewVideoPath"
        :preview-mode="previewMode" :preview-frame-src="previewFrameSrc" :preview-frame-loading="previewFrameLoading"
        :rendered-dirty="renderedDirty" :video-name="displayVideoName" :subtitle="config.subtitle" :title="config.title"
        :namecard="config.namecard" @open-file="handleOpenFileInFolder" @export-file="handleExportVideo"
        @update-preview-mode="handleUpdatePreviewMode" @update-title-offset="handleTitleOffsetUpdate"
        @update-namecard-position="handleNamecardPositionUpdate" :data-preview-frame-src="previewFrameSrc"
        :data-source-video-src="displayVideoSrc" />
    </div>

    <BenchmarkProgress :loading="loading" :text="progressText"/>

    <!-- ===== 字幕设置弹窗 ===== -->
    <SubtitleSettingsModal v-model:open="showSubtitleModal" :initial-config="config.subtitle.customConfig"
      :modal-width="modalWidth" @confirm="handleSubtitleConfirm" @cancel="showSubtitleModal = false" />

    <!-- ===== 字幕编辑器弹窗 ===== -->
    <a-modal v-model:open="subtitleEditorVisible" title="编辑字幕" centered get-container destroy-on-close
      wrap-class-name="subtitle-editor-modal" :width="subtitleEditorLayout.modalWidth"
      :body-style="subtitleEditorBodyStyle" @ok="handleSubtitleEditConfirm" @cancel="subtitleEditorVisible = false">
      <div class="subtitle-editor">
        <a-table :columns="subtitleColumns" :data-source="editableSubtitles" :pagination="false" :scroll="{
          x: subtitleEditorLayout.tableScrollX,
          y: subtitleEditorLayout.tableScrollY
        }" size="small" row-key="index">
          <template #bodyCell="{ column, record }">
            <a-textarea v-if="column.key === 'text'" v-model:value="record.text" :auto-size="{ minRows: 1, maxRows: 4 }"
              placeholder="请输入字幕文本" @focus="handleSubtitleFieldFocus(record, 'text')"
              @blur="handleSubtitleTextChange(record)" />
            <a-input-number v-else-if="column.key === 'start'" v-model:value="record.start" :min="0" :step="0.1"
              :precision="2" size="small" style="width: 80px" @focus="handleSubtitleFieldFocus(record, 'start')"
              @change="handleSubtitleStartChange(record)" />
            <a-input-number v-else-if="column.key === 'end'" v-model:value="record.end" :min="0" :step="0.1"
              :precision="2" size="small" style="width: 80px" @focus="handleSubtitleFieldFocus(record, 'end')"
              @change="handleSubtitleEndChange(record)" />
            <span v-else-if="column.key === 'duration'">
              {{ (record.duration || 0).toFixed(2) }}s
            </span>
            <div v-else-if="column.key === 'actions'" class="subtitle-row-actions">
              <a-button type="default" size="small" title="在下方插入一行" @click="handleInsertSubtitleRow(record)">
                插入
              </a-button>
              <a-button type="link" size="small" danger title="删除此行" :disabled="editableSubtitles.length <= 1"
                @click="handleDeleteSubtitleRow(record)">
                删除
              </a-button>
            </div>
          </template>
        </a-table>
      </div>
    </a-modal>

    <!-- ===== 画中画编辑器（悬浮层） ===== -->
    <Teleport v-if="pipEditorVisible" to=".viral-studio-step">
      <div class="pip-editor-overlay" :style="pipEditorOverlayStyle" role="dialog" aria-modal="true">
        <div class="pip-editor-dialog">
          <header class="pip-editor-dialog-header">
            <h3>自定义画中画</h3>
            <button type="button" class="pip-editor-close" aria-label="关闭" @click="pipEditorVisible = false">
              ×
            </button>
          </header>
          <div class="pip-editor-dialog-body">
            <!-- 左侧：字幕片段列表 -->
            <section class="pip-subtitle-list">
              <div class="pip-pane-head">
                <h4>字幕片段</h4>
                <p>点击选择，按住 Shift 可连续选择。</p>
              </div>
              <a-tag color="processing">
                已选 {{ pipSelectedCount }} 条，总时长 {{ pipSelectedDuration.toFixed(1) }}s
              </a-tag>
              <div class="pip-row-actions">
                <a-button size="small" @click="selectAllPipRows">全选字幕</a-button>
                <a-button size="small" @click="clearPipSelection">清空选择</a-button>
                <a-button size="small" danger :disabled="!pipSelectedCount" @click="clearSelectedPipMedia">
                  清除所选画中画
                </a-button>
              </div>
              <div class="pip-row-list">
                <button v-for="row in pipDraftSubtitles" :key="row.index" type="button" class="pip-subtitle-row"
                  :class="{ selected: pipSelectedKeys.includes(row.index) }" @click="handlePipRowClick(row, $event)">
                  <span class="pip-row-check" aria-hidden="true">✓</span>
                  <span class="pip-row-main">
                    <span class="pip-row-time">{{ formatTime(row.start) }} - {{ formatTime(row.end) }}</span>
                    <span class="pip-row-text">{{ row.text || '空字幕' }}</span>
                    <span v-if="row.pipVideoPath" class="pip-row-media">{{
                      getFileName(row.pipVideoPath)
                    }}</span>
                  </span>
                </button>
              </div>
            </section>

            <!-- 右侧：画中画素材 -->
            <section class="pip-material-pane">
              <div class="pip-pane-head">
                <div>
                  <h4>画中画素材</h4>
                  <p>从素材库或本地文件选择后，应用到左侧选中的字幕。</p>
                </div>
              </div>
              <a-radio-group v-model:value="pipSourceMode" button-style="solid" class="pip-source-switch">
                <a-radio-button value="library">素材库</a-radio-button>
                <a-radio-button value="local">本地文件</a-radio-button>
              </a-radio-group>

              <!-- 素材库模式 -->
              <template v-if="pipSourceMode === 'library'">
                <div class="pip-material-category">
                  <span>素材分类</span>
                  <a-select v-model:value="pipLibraryCategoryId" :options="pipMaterialCategoryOptions"
                    :loading="materialCategoriesLoading" placeholder="选择素材分类" @change="handlePipCategoryChange" />
                </div>
                <div class="pip-material-list" :class="{ loading: pipLibraryLoading }">
                  <button v-for="item in pipLibraryAssets" :key="item.id" type="button" class="pip-material-item"
                    :class="{ selected: pipSelectedMaterialPath === item.file_path }"
                    @click="pipSelectedMaterialPath = item.file_path">
                    <div class="pip-material-thumb" aria-hidden="true">
                      <img v-if="item.preview?.type === 'image'" :src="item.preview.src" alt="" />
                      <video v-else-if="item.preview?.type === 'video'" :src="item.preview.src" muted preload="metadata"
                        playsinline />
                      <span v-else class="pip-material-thumb-empty">预览</span>
                    </div>
                    <span class="pip-material-info">
                      <span class="pip-material-name">{{
                        item.file_name || getFileName(item.filePath)
                      }}</span>
                      <span class="pip-material-meta">
                        {{ formatPipDuration(item.duration) }}s ·
                        {{ formatPipFileSize(item.file_size) }}
                      </span>
                    </span>
                  </button>
                </div>
                <a-pagination v-if="pipLibraryTotal > pipLibraryPageSize" v-model:current="pipLibraryPage" size="small"
                  simple :page-size="pipLibraryPageSize" :total="pipLibraryTotal" class="pip-material-pagination"
                  @change="handlePipMaterialPageChange" />
                <a-button type="primary" block :disabled="!pipSelectedCount || !pipLibraryCategoryId"
                  @click="applyLibraryPipMedia">
                  应用到所选字幕 ({{ pipSelectedCount }})
                </a-button>
              </template>

              <!-- 本地文件模式 -->
              <template v-else>
                <div class="pip-local-box">
                  <a-button block @click="selectLocalPipFile">选择本地视频/图片</a-button>
                  <p :title="localPipPath">
                    {{ localPipPath ? getFileName(localPipPath) : '未选择文件' }}
                  </p>
                </div>
                <a-button type="primary" block :disabled="!pipSelectedCount || !localPipPath"
                  @click="applyLocalPipMedia">
                  应用到所选字幕 ({{ pipSelectedCount }})
                </a-button>
              </template>
            </section>
          </div>
          <footer class="pip-editor-dialog-footer">
            <a-button @click="pipEditorVisible = false">取消</a-button>
            <a-button type="primary" @click="handlePipEditorConfirm">确定</a-button>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.viral-studio-step {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--theme-text-primary);
}

.studio-layout {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 208px minmax(300px, 0.9fr) minmax(0, 1.1fr);
  gap: 12px;
}

.module-detail {
  min-height: 0;
  padding: 18px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid var(--theme-overlay-light);
  background: color-mix(in srgb, var(--theme-overlay-light) 84%, transparent);
}

.detail-head {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-head h3 {
  margin: 0;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title);
  font-weight: 900;
}

.detail-head p {
  margin: 4px 0 0;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
}

.detail-body {
  flex: 1;
  min-height: 0;
  margin-top: 16px;
  overflow-y: auto;
}
</style>
