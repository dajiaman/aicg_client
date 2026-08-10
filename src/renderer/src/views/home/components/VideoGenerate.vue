<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount, reactive, watch, h } from 'vue'
import { message } from 'ant-design-vue'
import WaveSurfer from 'wavesurfer.js'
import { usePipeline } from '../../../hooks/usePipeline'
import { useDigitalHuman } from '../../../hooks/useDigitalHuman'
import { usePermission } from '../../../hooks/usePermission'
import draggable from 'vuedraggable'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  ExportOutlined,
  FolderOpenFilled,
  InboxOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  UserOutlined
} from '@ant-design/icons-vue'

const { pipeline, notifyStepStart, notifyStepComplete, notifyStepError, updatePipelineData } =
  usePipeline()
const { checkFullPermission, loadUserInfo } = usePermission()

const videoStepRef = ref(null)
const audioWaveRef = ref(null)
const avatarPreviewVideoRef = ref(null)
const waveCurrentTime = ref(0)

const {
  loading,
  avatarOptions,
  selectedAvatar,
  modelVersion,
  drivingAudio,
  generatedVideo,
  progressText,
  digitalHumanMode,
  digitalHumanScenes,
  draftDigitalHumanScenes,
  multiSceneModalOpen,
  audioDuration,
  loadAvatarList,
  selectDrivingAudio,
  generateVideo,
  buildMultiAvatarReference,
  formatDuration,
  formatFileSize
} = useDigitalHuman()

const avatarModalOpen = ref(false)
const avatarUploading = ref(false)
const avatarFileList = ref([])
const avatarForm = reactive({ name: '', videoPath: '' })
const avatarVideoInfo = reactive({
  fileSize: 0,
  duration: 0,
  format: '',
  width: 0,
  height: 0,
  resolution: '',
  displayRotation: null
})
const avatarTrimRange = reactive({ start: 0, end: 0 })
const avatarTrimMax = ref(0)
const avatarTrimDuration = ref(0)
const avatarPreviewing = ref(false)
const canSaveAvatar = computed(() => {
  return avatarForm.name.trim() && avatarForm.videoPath && !avatarUploading.value
})

// 音频波形播放
const audioWavePlaying = ref(false)

// 计算属性
const selectedAvatarName = computed(() => {
  const found = avatarOptions.value.find((a) => a.value === selectedAvatar.value)
  return found?.label || ''
})

const displayAudioName = computed(() => {
  if (!drivingAudio.value) return '未选择'
  return drivingAudio.value.split(/[\\/]/).pop() || '未选择'
})

const displayAudioPath = computed(() => drivingAudio.value)

const audioSourceLabel = computed(() => {
  if (drivingAudio.value) return displayAudioName
  if (pipeline.clonedAudioPath) return displayAudioName
  return '未选择驱动音频'
})

const canGenerate = computed(() => {
  if (digitalHumanMode.value === 'single') {
    return !!selectedAvatar.value && !!drivingAudio.value
  } else {
    return (
      digitalHumanScenes.value.length > 0 &&
      digitalHumanScenes.value.every((s) => s.avatarId && s.duration > 0) &&
      !!drivingAudio.value
    )
  }
})

const setDigitalhumanMode = (mode) => {
  digitalHumanMode.value = mode
}

const scenesTotalDuration = computed(() => {
  return digitalHumanScenes.value.reduce((sum, s) => sum + (s.duration || 0), 0)
})

// 草稿镜头总时长
const draftScenesTotalDuration = computed(() => {
  return draftDigitalHumanScenes.value.reduce((sum, s) => sum + (s.duration || 0), 0)
})

// 是否可以分发草稿镜头
const canDistributeDraftScenes = computed(() => {
  return draftDigitalHumanScenes.value.length > 0 && audioDuration.value > 0
})

// 生成视频的名字
const generatedVideoName = computed(() => {
  if (!generatedVideo.value) return ''
  return generatedVideo.value.split(/[\\/]/).pop() || 'video.mp4'
})

// 生成视频（主入口）
const handleGenerate = async () => {
  if (!checkFullPermission('视频生成')) return


  if (!canGenerate.value) {
    message.warning('请完善数字人形象和驱动音频')
    return
  }

  notifyStepStart('digitalHuman')

  let audioPath = drivingAudio.value || pipeline.clonedAudioPath
  let avatarId = selectedAvatar.value
  let referenceVideoPath = ''

  // 多镜头模式：先拼接参考视频
  if (digitalHumanMode.value === 'multi') {
    const scenes = digitalHumanScenes.value.map((s) => ({
      avatarId: s.avatarId,
      duration: Number(s.duration)
    }))
    const refResult = await buildMultiAvatarReference(scenes, (msg) => {
      progressText.value = msg
    })
    console.log('refResult', refResult)
    if (!refResult.success) {
      notifyStepError('digitalHuman', new Error(refResult.error))
      return
    }
    referenceVideoPath = refResult.data.videoPath
    avatarId = scenes[0].avatarId // 使用第一个形象的 ID 作为主形象
  }

  console.log('avatarId', avatarId)
  console.log('referenceVideoPath', referenceVideoPath)

  const result = await generateVideo(
    audioPath,
    avatarId,
    (msg) => {
      progressText.value = msg
    },
    { referenceVideoPath }
  )
  if (result.success) {
    updatePipelineData({
      selectedAvatar: avatarId,
      digitalHumanMode: digitalHumanMode.value,
      digitalHumanScenes: JSON.parse(JSON.stringify(digitalHumanScenes.value)),
      multiAvatarReferenceVideoPath: referenceVideoPath,
      generatedVideoPath: result.data.videoPath,
      sourceVideoPath: result.data.videoPath
    })
    notifyStepComplete('digitalHuman', result.data)
    // 自动模式下触发下一步
    if (pipeline.executionMode === 'auto') {
      window.dispatchEvent(new CustomEvent('workflow:auto-next', { detail: { step: 'videoEdit' } }))
    }
  } else {
    notifyStepError('digitalHuman', new Error(result.error))
  }
}

// ----- 多镜头管理 -----
/**
 * 计算默认形象 id：
 *   1. 优先取 selectedAvatar
 *   2. 否则取 avatarOptions 第一个
 *   3. 都没有则空串
 */
const defaultAvatarId = () => {
  if (selectedAvatar.value) return selectedAvatar.value
  if (avatarOptions.value && avatarOptions.value.length > 0) {
    return avatarOptions.value[0].value
  }
  return ''
}

const openMultiSceneModal = () => {
  draftDigitalHumanScenes.value = JSON.parse(JSON.stringify(digitalHumanScenes.value))
  if (draftDigitalHumanScenes.value.length === 0) {
    draftDigitalHumanScenes.value = [
      { id: 'scene_' + Date.now(), avatarId: defaultAvatarId(), duration: 5 }
    ]
  } else {
    // 已存在场景：如果首场景 avatarId 为空，自动选第一个形象
    if (!draftDigitalHumanScenes.value[0].avatarId) {
      draftDigitalHumanScenes.value[0].avatarId = defaultAvatarId()
    }
  }
  // 每次打开弹窗重置 draggable key，确保重新挂载
  draggableVersion.value++
  multiSceneModalOpen.value = true
}

const addDraftScene = () => {
  draftDigitalHumanScenes.value.push({
    id: 'scene_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    avatarId: defaultAvatarId(),
    duration: 5
  })
  // 强制 draggable 重建（vuedraggable 4.x + Vue 3 + modal 嵌套场景下 push 新项可能不触发内部重渲）
  draggableVersion.value++
}

const removeDraftScene = (index) => {
  if (draftDigitalHumanScenes.value.length <= 1) return
  draftDigitalHumanScenes.value.splice(index, 1)
}

/**
 * 上移/下移
 * @param index
 * @param direction
 */
const moveDraftScene = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= draftDigitalHumanScenes.value.length) return
  const [item] = draftDigitalHumanScenes.value.splice(index, 1)
  draftDigitalHumanScenes.value.splice(newIndex, 0, item)
}

/**
 * 按音频平均分配
 */
const distributeDraftScenesByAudio = () => {
  // 1. 校验音频时长是否已加载
  if (!audioDuration.value || audioDuration.value <= 0) {
    message.warning('请先加载驱动音频后再分配')
    return
  }

  const totalDuration = audioDuration.value
  const sceneCount = draftDigitalHumanScenes.value.length

  if (sceneCount === 0) {
    message.warning('请先添加镜头')
    return
  }

  // 2. 计算每个镜头的基准时长（向下取整到10的倍数）
  let baseDuration = Math.floor(totalDuration / sceneCount / 10) * 10
  if (baseDuration < 10) {
    baseDuration = 10 // 最少 10 秒
  }

  // 3. 计算剩余时间（不足一个整10秒的部分）
  const totalAllocated = baseDuration * sceneCount
  let remaining = totalDuration - totalAllocated
  // 剩余秒数按每 10 秒为一个单位，分配给前 N 个镜头
  const extraUnits = Math.floor(remaining / 10)
  // 但最多不能超过场景数，因为每个镜头最多加一次10秒
  const extraCount = Math.min(extraUnits, sceneCount)

  // 4. 更新每个镜头的时长
  draftDigitalHumanScenes.value.forEach((scene, index) => {
    let extra = index < extraCount ? 10 : 0
    // 但避免总时长超过音频总时长太多，可做微调
    let newDuration = baseDuration + extra
    // 限制单个镜头时长不超过300秒（5分钟），根据实际场景设定
    if (newDuration > 300) newDuration = 300
    scene.duration = newDuration
  })

  // 5. 提示用户
  console.log(`已按音频时长 ${totalDuration}s 平均分配 ${sceneCount} 个镜头`)
}

/**
 * 确定多镜头
 */
const confirmMultiSceneModal = () => {
  // 验证
  const invalid = draftDigitalHumanScenes.value.find(
    (s) => !s.avatarId || !s.duration || s.duration <= 0
  )
  if (invalid) {
    message.warning('请完善每个镜头的数字人和时长')
    return
  }
  digitalHumanScenes.value = JSON.parse(JSON.stringify(draftDigitalHumanScenes.value))
  multiSceneModalOpen.value = false
  message.success('多镜头配置已保存')
}

const cancelMultiSceneModal = () => {
  multiSceneModalOpen.value = false
}

// ----- 多镜头：自定义下拉状态 -----
const openScenePickerIndex = ref(-1)
// vuedraggable 在 modal 嵌套 + Vue 3 + 4.1.0 下，偶尔不响应 push 新项
// 用 version 强制 key 重建，绕过 bug
const draggableVersion = ref(0)

const toggleSceneAvatarPicker = (index) => {
  openScenePickerIndex.value = openScenePickerIndex.value === index ? -1 : index
}

const selectSceneAvatar = (index, avatarId) => {
  draftDigitalHumanScenes.value[index].avatarId = avatarId
  openScenePickerIndex.value = -1
}

const getSceneAvatar = (avatarId) => {
  if (!avatarId) return null
  return avatarOptions.value.find((a) => a.value === avatarId) || null
}

// 点外面关闭下拉
const handleSceneOutsideClick = (e) => {
  if (openScenePickerIndex.value === -1) return
  const target = e.target
  // 检查点击是否在 .scene-avatar-picker 内
  let el = target
  while (el && el !== document.body) {
    if (el.classList && el.classList.contains('scene-avatar-picker')) return
    el = el.parentElement
  }
  openScenePickerIndex.value = -1
}

// ----- 选择音频 -----
const handleSelectAudio = async () => {
  const result = await selectDrivingAudio()
  if (result.success) {
    updatePipelineData({ drivingAudio: result.data, drivingAudioIsManual: true })

    loadAudioWaveform(result.data)
  }
}

// ----- 音频波形播放（与 VoiceGenerate 一致）
// WaveSurfer 实例（驱动音频波形）
let wavesurferInstance = null

/**
 * 销毁并清理 WaveSurfer
 */
const destroyWavesurfer = () => {
  if (wavesurferInstance) {
    try {
      wavesurferInstance.destroy()
    } catch (e) {
      console.error(e)
      // ignore
    }
    wavesurferInstance = null
  }
}

/**
 * 加载音频波形（与 VoiceGenerate 一致）
 */
const loadAudioWaveform = async (audioPath) => {
  console.log('loadAudioWaveform', audioPath)
  await nextTick()
  if (!audioWaveRef.value || !audioPath) return
  destroyWavesurfer()
  try {
    wavesurferInstance = WaveSurfer.create({
      container: audioWaveRef.value,
      waveColor: 'rgba(217, 70, 239, 0.35)',
      progressColor: 'rgba(217, 70, 239, 0.85)',
      cursorColor: '#f0abfc',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 36,
      normalize: true,
      url: 'file://' + audioPath
    })
    wavesurferInstance.on('play', () => {
      audioWavePlaying.value = true
    })
    wavesurferInstance.on('pause', () => {
      audioWavePlaying.value = false
    })
    wavesurferInstance.on('finish', () => {
      audioWavePlaying.value = false
    })
    wavesurferInstance.on('audioprocess', () => {
      try {
        waveCurrentTime.value = wavesurferInstance.getCurrentTime()
      } catch {
        // ignore
      }
    })
    wavesurferInstance.on('ready', () => {
      try {
        const dur = wavesurferInstance.getDuration()
        if (dur) {
          audioDuration.value = dur
        }
      } catch {
        // ignore
      }
    })
  } catch (e) {
    console.warn('驱动音频波形加载失败:', e)
  }
}

const toggleAudioWave = () => {
  if (!wavesurferInstance) {
    // 兜底：未初始化时（选了 audio 但波形未加载），尝试重新加载
    if (displayAudioPath.value) {
      loadAudioWaveform(displayAudioPath.value)
    }
    return
  }
  wavesurferInstance.playPause()
}

// ----- 打开/导出视频 -----
const openFileInFolder = async (path) => {
  if (!path) return
  try {
    await window.api.file.showInFolder(path.replace(/^file:\/\//, ''))
  } catch (e) {
    message.error('打开文件夹失败：' + e.message)
  }
}

const exportVideo = async (path) => {
  if (!path) return
  try {
    const fileName = path.split(/[\\/]/).pop() || 'video.mp4'
    const result = await window.api.file.saveDialog({
      title: '导出视频',
      defaultPath: fileName,
      filters: [
        { name: 'MP4 视频', extensions: ['mp4'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    if (result.success && !result.data.canceled && result.data.filePath) {
      await window.api.file.copy(path.replace(/^file:\/\//, ''), result.data.filePath)
      message.success('视频导出成功')
    }
  } catch (e) {
    message.error('导出视频失败：' + e.message)
  }
}

// ----- 上传形象 -----
const openAvatarModal = () => {
  avatarForm.name = ''
  avatarForm.videoPath = ''
  avatarFileList.value = []
  avatarVideoInfo.fileSize = 0
  avatarVideoInfo.duration = 0
  avatarVideoInfo.format = ''
  avatarVideoInfo.width = 0
  avatarVideoInfo.height = 0
  avatarVideoInfo.resolution = ''
  avatarVideoInfo.displayRotation = null
  avatarTrimRange.start = 0
  avatarTrimRange.end = 0
  avatarTrimMax.value = 0
  avatarTrimDuration.value = 0
  avatarPreviewing.value = false
  avatarModalOpen.value = true
}

/**
 * 文件上传
 * @param file
 */
const beforeAvatarUpload = async (file) => {
  // ---------- 1. 校验视频格式 ----------
  const validMimeTypes = [
    'video/mp4',
    'video/avi',
    'video/quicktime', // .mov
    'video/x-ms-wmv', // .wmv
    'video/x-flv', // .flv
    'video/x-matroska', // .mkv
    'video/webm'
  ]
  const validExtensions = /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i

  // 检查 MIME 类型或扩展名
  const isValidType = validMimeTypes.includes(file.type) || validExtensions.test(file.name)
  if (!isValidType) {
    message.error('不支持的视频格式，请使用 MP4、AVI、MOV、WMV、FLV、MKV 或 WEBM 格式')
    return false
  }

  // ---------- 2. 校验文件大小（最大 500MB） ----------
  const MAX_SIZE = 500 * 1024 * 1024 // 500 MB
  if (file.size > MAX_SIZE) {
    message.error('视频文件大小不能超过 500MB')
    return false
  }

  const path = window.api.getPathForFile(file)
  avatarForm.videoPath = path
  avatarVideoInfo.fileSize = file.size
  avatarVideoInfo.format = file.name.split('.').pop().toLowerCase()

  // 获取视频信息
  try {
    const info = await window.api.video.getInfo(path)
    console.log('videoInfo:', info)
    if (info.success) {
      avatarVideoInfo.duration = info.data.duration || 0
      avatarVideoInfo.width = info.data.width || 0
      avatarVideoInfo.height = info.data.height || 0
      avatarVideoInfo.resolution =
        info.data.width && info.data.height ? info.data.width + '*' + info.data.height : ''
      // 后端可能返回 null（视频不带 rotation 信息，常见于 ffmpeg 转码产物）；
      // 归一为 0 让前端可以统一展示「未旋转」。
      avatarVideoInfo.displayRotation =
        typeof info.data.display_rotation === 'number' ? info.data.display_rotation : 0
      avatarTrimMax.value = info.data.duration || 0
      avatarTrimRange.end = info.data.duration || 0
    }
  } catch (e) {
    console.warn('获取视频信息失败:', e)
  }
  // 默认名称
  const baseName = file.name.replace(/\.[^.]+$/, '').slice(0, 20)
  if (!avatarForm.name) avatarForm.name = baseName
  return false
}

/**
 * 移除
 */
const removeAvatarVideo = () => {
  avatarForm.videoPath = ''
  avatarVideoInfo.fileSize = 0
  avatarVideoInfo.duration = 0
  avatarVideoInfo.format = ''
  avatarVideoInfo.width = 0
  avatarVideoInfo.height = 0
  avatarVideoInfo.resolution = ''
  avatarVideoInfo.displayRotation = null
  avatarTrimRange.start = 0
  avatarTrimRange.end = 0
  avatarTrimMax.value = 0
  avatarTrimDuration.value = 0
  avatarFileList.value = []
}

/**
 * 保存数字人模型
 */
const saveAvatarModel = async () => {
  if (!canSaveAvatar.value) return

  if (!avatarForm.name.trim()) return message.error('请输入数字人模型名称')

  // 名称不能重复
  const res = await window.api.digitalHuman.findByName(avatarForm.name.trim())
  if (res.success && res.data) return message.error('数字人模型名称已存在')

  avatarUploading.value = true

  try {
    let videoPath = avatarForm.videoPath
    // 如果裁剪了，先裁剪视频
    if (
      avatarTrimDuration.value > 0 &&
      (avatarTrimRange.start > 0.05 || avatarTrimRange.end < avatarTrimMax.value - 0.05)
    ) {
      message.loading('正在裁剪视频...', 0)
      const trimResult = await window.api.video.trim({
        inputPath: videoPath,
        start: avatarTrimRange.start,
        duration: avatarTrimDuration.value
      })
      message.destroy()
      console.log('trimResult:', trimResult)
      if (trimResult.success) {
        videoPath = trimResult.data.outputPath
      } else {
        message.warning('视频裁剪失败，使用原视频')
      }
    }

    // 上传到云端
    let videoUrl = ''
    try {
      const uploadResult = await window.api.oss.upload(videoPath, 'video')
      if (uploadResult.success) videoUrl = uploadResult.data.url
    } catch (e) {
      console.warn('文件上传失败，仅保存本地路径', e)
    }

    // 获取封面
    let thumbnailPath = ''
    try {
      const coverRes = await window.api.video.getCover(videoPath)
      if (coverRes.success) thumbnailPath = coverRes.data.coverPath
    } catch (e) {
      console.error('获取视频封面失败:', e)
    }

    console.log('thumbnailPath', thumbnailPath)

    // 保存到数据库
    const saveResult = await window.api.digitalHuman.create({
      name: avatarForm.name.trim(),
      description: '',
      video_path: videoPath,
      video_url: videoUrl || null,
      thumbnail_path: thumbnailPath,
      resolution: avatarVideoInfo.resolution || null,
      video_duration: avatarVideoInfo.duration || null
    })
    console.log('saveResult', saveResult)
    if (!saveResult.success) throw new Error(saveResult.error || '保存失败')
    message.success('数字人模型保存成功')
    await loadAvatarList()
    // 自动选中新形象
    const newId = saveResult.data.id || saveResult.data?.id
    if (newId) selectedAvatar.value = newId
    avatarModalOpen.value = false
    removeAvatarVideo()
  } catch (e) {
    avatarUploading.value = false
    console.error('保存失败', e)
    message.error('保存失败：' + e.message)
  } finally {
    avatarUploading.value = false
  }
}

// ----- 视频裁剪预览 -----
const handleAvatarPreviewTimeUpdate = () => {
  // 由视频元素触发
}

const updateAvatarTrimStart = (e) => {
  const val = parseFloat(e.target.value)
  avatarTrimRange.start = Math.max(0, Math.min(val, avatarTrimRange.end - 0.5))
  avatarTrimDuration.value = avatarTrimRange.end - avatarTrimRange.start
}

const updateAvatarTrimEnd = (e) => {
  const val = parseFloat(e.target.value)
  avatarTrimRange.end = Math.min(avatarTrimMax.value, Math.max(val, avatarTrimRange.start + 0.5))
  avatarTrimDuration.value = avatarTrimRange.end - avatarTrimRange.start
}

const handleAvatarTrimStartDrag = () => {
  // 拖拽开始，暂停预览
  if (avatarPreviewing.value) {
    avatarPreviewVideoRef.value?.pause()
    avatarPreviewing.value = false
  }
}

/**
 * 预览选区
 */
let avatarPreviewTimeHandler = null

const previewAvatarTrimSelection = async () => {
  const video = avatarPreviewVideoRef.value
  if (!video) {
    message.warning('请先上传数字人视频')
    return
  }
  // 切到起始前确保 metadata 已加载
  if (!video.duration || Number.isNaN(video.duration)) {
    await new Promise((resolve) => {
      const onLoaded = () => {
        video.removeEventListener('loadedmetadata', onLoaded)
        resolve()
      }
      video.addEventListener('loadedmetadata', onLoaded)
      // metadata 已就绪情况下 100ms 内兜底
      setTimeout(() => {
        video.removeEventListener('loadedmetadata', onLoaded)
        resolve()
      }, 100)
    })
  }

  if (avatarPreviewing.value) {
    video.pause()
    avatarPreviewing.value = false
    return
  }

  // 清除上一个监听器（如果上次未自然结束）
  if (avatarPreviewTimeHandler) {
    video.removeEventListener('timeupdate', avatarPreviewTimeHandler)
    avatarPreviewTimeHandler = null
  }

  video.currentTime = avatarTrimRange.start
  avatarPreviewing.value = true
  try {
    await video.play()
    // 监听播放到 end 时暂停
    avatarPreviewTimeHandler = () => {
      if (!avatarPreviewVideoRef.value) return
      if (avatarPreviewVideoRef.value.currentTime >= avatarTrimRange.end) {
        avatarPreviewVideoRef.value.pause()
        avatarPreviewing.value = false
        avatarPreviewVideoRef.value.removeEventListener('timeupdate', avatarPreviewTimeHandler)
        avatarPreviewTimeHandler = null
      }
    }
    video.addEventListener('timeupdate', avatarPreviewTimeHandler)
  } catch (e) {
    avatarPreviewing.value = false
    console.warn('预览播放失败:', e)
  }
}

// ----- 暴露给父组件 -----
const handleBeforeNext = () => {
  if (!generatedVideo.value && !pipeline.generatedVideoPath) {
    message.warning('请先生成视频')
    return false
  }
  return true
}

defineExpose({
  handleBeforeNext
})

// ----- 生命周期 -----
onMounted(() => {
  loadAvatarList()
  loadUserInfo()

  // 从 pipeline 恢复数据
  if (pipeline.selectedAvatar) {
    selectedAvatar.value = pipeline.selectedAvatar
  }
  if (pipeline.digitalHumanMode) {
    digitalHumanMode.value = pipeline.digitalHumanMode
  }
  if (pipeline.digitalHumanScenes) {
    digitalHumanScenes.value = JSON.parse(JSON.stringify(pipeline.digitalHumanScenes))
  }

  if (pipeline.drivingAudio) {
    drivingAudio.value = pipeline.drivingAudio
  }

  if (pipeline.clonedAudioPath) {
    drivingAudio.value = pipeline.clonedAudioPath
    loadAudioWaveform()
  }

  if (pipeline.generatedVideoPath) {
    generatedVideo.value = 'file://' + pipeline.generatedVideoPath
  }

  // 设置默认模型版本
  modelVersion.value = 'V2'
})

// 监听驱动音频变化（同步到 pipeline + 加载波形）
watch(drivingAudio, (val) => {
  if (val) {
    updatePipelineData({ drivingAudio: val })
    // 异步加载波形（选 audio 后自动渲染）
    loadAudioWaveform(val)
  } else {
    destroyWavesurfer()
    audioWavePlaying.value = false
    waveCurrentTime.value = 0
  }
})

// 监听形象变化
watch(selectedAvatar, (val) => {
  if (val) updatePipelineData({ selectedAvatar: val })
})

// 模态框尺寸
const modalSize = reactive({ width: 1040, height: 720 })
// 弹窗样式：垂直居中 + 限制最大高度（自适应）
const modalStyle = reactive({
  paddingBottom: 0,
  maxHeight: 'calc(100vh - 40px)'
})
const modalBodyStyle = reactive({
  padding: '24px',
  overflow: 'hidden',
  maxHeight: 'calc(100vh - 100px)'
})

const updateModalSize = () => {
  const el = videoStepRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  modalSize.width = Math.min(Math.max(rect.width * 0.92, 880), 1040)
  modalSize.height = Math.min(Math.max(rect.height * 0.85, 600), 720)
}

onMounted(() => {
  nextTick(updateModalSize)
  window.addEventListener('resize', updateModalSize)
  document.addEventListener('mousedown', handleSceneOutsideClick)
  // 兜底：组件挂载时如果已有音频，加载波形
  if (drivingAudio.value) {
    loadAudioWaveform(drivingAudio.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateModalSize)
  document.removeEventListener('mousedown', handleSceneOutsideClick)
  // 销毁 WaveSurfer 实例
  destroyWavesurfer()
  // 清理数字人预览视频监听器
  if (avatarPreviewVideoRef.value && avatarPreviewTimeHandler) {
    avatarPreviewVideoRef.value.removeEventListener('timeupdate', avatarPreviewTimeHandler)
    avatarPreviewTimeHandler = null
  }
})
</script>

<template>
  <div ref="videoStepRef" class="video-step" :class="{
    executing: loading
  }">
    <div class="video-layout">
      <div class="video-left">
        <div class="glass-card config-card">
          <div class="card-head">
            <div>
              <h3>视频配置</h3>
            </div>
            <button class="manage-link" @click="openAvatarModal" type="button">上传形象</button>
          </div>

          <div class="mode-toggle" role="radiogroup">
            <button class="mode-option" :class="{
              active: digitalHumanMode == 'single'
            }" @click="setDigitalhumanMode('single')">
              单形象
            </button>
            <button class="mode-option" :class="{
              active: digitalHumanMode == 'multi'
            }" @click="setDigitalhumanMode('multi')">
              多镜头
            </button>
          </div>

          <div class="setting-block" v-if="digitalHumanMode === 'single'">
            <div class="setting-label">
              <span>选择形象</span>
            </div>
            <a-select class="full-select" mode="single" v-model:value="selectedAvatar">
              <a-select-option v-for="item in avatarOptions" :key="item.id" :value="item.value">
                <div class="avatar-option">
                  <div class="avatar-cover">
                    <img v-if="item.thumbnail_path" :src="'file://' + item.thumbnail_path" class="cover-image" />
                  </div>
                  <div class="avatar-text">
                    <span>{{ item.label }}</span>
                  </div>
                </div>
              </a-select-option>
            </a-select>
          </div>

          <div class="setting-block multi-card" v-if="digitalHumanMode === 'multi'">
            <div>
              <div class="setting-label compact">
                <span>多镜头配置</span>
              </div>
              <p>总时长约 10 秒，可配置不同形象的出场顺序。</p>
            </div>
            <div class="multi-actions">
              <span>{{ draftDigitalHumanScenes.length }}个镜头</span>
              <button class="mini-action" type="button" @click="openMultiSceneModal">
                编辑镜头
              </button>
            </div>
          </div>

          <!-- 驱动音频 -->
          <div class="setting-block">
            <div class="setting-label">
              <span>驱动音频</span>
              <b>上一步音频</b>
            </div>
            <div class="audio-source-card">
              <div class="audio-source-main">
                <span>{{ audioSourceLabel }}</span>
              </div>
              <button v-if="!drivingAudio" @click="handleSelectAudio" class="select-audio-btn">
                选取音频
              </button>
              <div class="audio-wave-player" v-else>
                <button class="audio-wave-btn" type="button" @click="toggleAudioWave">
                  <play-circle-outlined v-if="!audioWavePlaying" />
                  <pause-circle-outlined v-else />
                </button>
                <div class="audio-waveform" ref="audioWaveRef"></div>
                <button class="select-audio-btn" type="button" @click.stop="handleSelectAudio">
                  选择音频
                </button>
              </div>
            </div>
          </div>

          <div class="setting-block">
            <div class="setting-label">
              <span>模型版本</span>
            </div>

            <a-select class="full-select" mode="single" v-model:value="modelVersion">
              <a-select-option value="V1">高清模型V1</a-select-option>
              <a-select-option value="V2">高清模型V2</a-select-option>
            </a-select>
          </div>

          <a-button size="lg" block class="generate-btn" @click="handleGenerate" :loading="loading">
            <user-outlined />
            生成视频</a-button>
        </div>
      </div>
      <div class="glass-card preview-card">
        <div class="card-head">
          <div>
            <h3>视频预览</h3>
          </div>
          <div class="result-actions">
            <a-button size="small" type="primary" class="pill-btn">
              <folder-open-filled />
              打开
            </a-button>

            <a-button size="small" class="ghost-btn">
              <export-outlined />
              导出
            </a-button>
          </div>
        </div>


        <div class="video-preview" v-if="generatedVideo">
          <video :src="generatedVideo" class="preview-video" controls preload="metadata"></video>
          <div class="video-name">
            {{ generatedVideoName }}
          </div>
        </div>

        <div class="video-placeholder" v-if="!generatedVideo">
          <user-outlined class="placeholder-icon" />
          <p>暂无预览视频</p>
          <span>生成视频后将在此处显示预览</span>
        </div>
      </div>
    </div>

    <!-- 多镜头配置弹窗 -->
    <a-modal v-model:open="multiSceneModalOpen" :title="null" :footer="null" :width="modalSize.width"
      :style="modalStyle" :body-style="modalBodyStyle" :get-container="true" destroy-on-close centered
      wrap-class-name="scene-modal" @cancel="cancelMultiSceneModal">
      <div class="scene-modal-layout">
        <div class="scene-modal-head">
          <div>
            <h3>配置多镜头</h3>
          </div>
          <div class="scene-head-actions">
            <a-button size="small" @click="distributeDraftScenesByAudio">按音频平均分配</a-button>
            <a-button size="small" type="primary" @click="addDraftScene">
              <plus-outlined />
              添加镜头
            </a-button>
          </div>
        </div>

        <!-- 镜头列表（vuedraggable 拖拽排序） -->
        <draggable v-model="draftDigitalHumanScenes" item-key="id" class="scene-list" :animation="180"
          handle=".scene-drag-handle" ghost-class="scene-ghost" chosen-class="scene-chosen" drag-class="scene-dragging"
          :key="'scene-draggable-' + draggableVersion">
          <template #item="{ element, index }">
            <div class="scene-item" :class="{
              'scene-item-first': index === 0,
              'scene-item-last': index === draftDigitalHumanScenes.length - 1
            }">
              <!-- 拖拽手柄 -->
              <button class="scene-drag-handle" title="拖动排序">::</button>

              <!-- 序号徽章 -->
              <div class="scene-index">{{ index + 1 }}</div>

              <a-select class="scene-avatar-select" mode="single" v-model:value="element.avatarId">
                <a-select-option v-for="item in avatarOptions" :key="item.id" :value="item.value">
                  <div class="avatar-option">
                    <div class="avatar-cover">
                      <img v-if="item.thumbnail_path" :src="'file://' + item.thumbnail_path" class="cover-image" />
                    </div>
                    <div class="avatar-text">
                      <span>{{ item.label }}</span>
                    </div>
                  </div>
                </a-select-option>
              </a-select>

              <a-input-number v-model:value="element.duration" type="number" :min="0.5" :max="300" :step="0.1">
                <template #addonAfter>秒</template>
              </a-input-number>

              <div class="scene-actions">
                <a-button size="small" :disabled="index === 0" @click="moveDraftScene(index, -1)">
                  <arrow-up-outlined />
                </a-button>

                <a-button size="small" @click="moveDraftScene(index, 1)"
                  :disabled="index === draftDigitalHumanScenes.length - 1">
                  <arrow-down-outlined />
                </a-button>

                <a-button size="small" danger :disabled="draftDigitalHumanScenes.length <= 1"
                  @click="removeDraftScene(index)">
                  <delete-outlined />
                </a-button>
              </div>
            </div>
          </template>
        </draggable>

        <!-- 底部 -->
        <div class="scene-footer">
          <div class="scene-footer-info">
            <span class="scene-footer-summary">
              共 {{ draftDigitalHumanScenes.length }}个镜头 , 总时长约
              {{ draftScenesTotalDuration.toFixed(1) }}秒/ 音频 {{ audioDuration.toFixed(1) }} 秒
            </span>
          </div>
          <div class="scene-footer-actions">
            <a-button @click="cancelMultiSceneModal">取消</a-button>
            <a-button type="primary" @click="confirmMultiSceneModal"> 确定 </a-button>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- ============ 上传形象弹窗 ============ -->
    <a-modal v-model:open="avatarModalOpen" title="" :footer="null" :width="modalSize.width" :style="modalStyle"
      :body-style="modalBodyStyle" get-container centered :mask-closable="false" :closable="!avatarUploading"
      :keyboard="!avatarUploading" destroy-on-close wrap-class-name="video-avatar-modal">
      <div class="avatar-modal-layout">
        <div class="scene-modal-head">
          <div>
            <span class="card-kicker">UPLOAD AVATAR</span>
            <h3>上传形象</h3>
          </div>
          <p>上传数字人视频文件，保存后会自动出现在形象选择中。</p>
        </div>

        <div class="avatar-upload-grid">
          <div class="avatar-upload-card">
            <a-upload-dragger v-model:file-list="avatarFileList" name="file" :multiple="false" accept="video/*"
              :before-upload="beforeAvatarUpload" :disabled="avatarUploading" :show-upload-list="false"
              @remove="removeAvatarVideo">
              <div class="avatar-upload-content">
                <!-- 已上传：展示预览视频 -->
                <div v-if="avatarForm.videoPath" class="avatar-upload-preview">
                  <video ref="avatarPreviewVideoRef" class="avatar-preview-video"
                    :src="'file://' + avatarForm.videoPath" muted playsinline preload="metadata" />
                </div>
                <!-- 未上传：拖拽上传 -->
                <div v-else class="avatar-upload-empty">
                  <inbox-outlined class="avatar-upload-icon" />
                  <p>点击或拖拽视频文件到此区域</p>
                  <span class="upload-sub-hint">
                    支持 MP4、AVI、MOV、WMV、FLV、MKV、WEBM，最大 500MB，建议 720P 或 1080P。
                  </span>
                </div>
              </div>
            </a-upload-dragger>
          </div>

          <div class="avatar-form-card">
            <label class="field-label"> 形象名称 * </label>
            <a-input placeholder="请输入数字人名称" maxlength="10" v-model:value="avatarForm.name" show-count></a-input>

            <div v-if="avatarForm.videoPath" class="avatar-meta">
              <span v-if="avatarVideoInfo.fileSize" class="meta-tag">
                💾 {{ formatFileSize(avatarVideoInfo.fileSize) }}
              </span>
              <span v-if="avatarVideoInfo.resolution" class="meta-tag">
                📐 {{ avatarVideoInfo.resolution }}
              </span>
              <span v-if="avatarVideoInfo.displayRotation" class="meta-tag"> 🔄 已校正方向 </span>
              <span v-if="avatarVideoInfo.duration" class="meta-tag">
                ⏱ {{ formatDuration(avatarVideoInfo.duration) }}
              </span>
            </div>

            <!-- 视频裁剪 -->
            <div v-if="avatarForm.videoPath" class="avatar-trim-controller">
              <div class="trim-head">
                <span class="form-label-text">视频裁剪</span>
                <b class="trim-head-value">
                  {{ formatDuration(avatarTrimRange.start) }} -
                  {{ formatDuration(avatarTrimRange.end) }}
                </b>
              </div>
              <button class="trim-preview-btn" @click="previewAvatarTrimSelection">
                <span>{{ avatarPreviewing ? '⏸' : '▶' }}</span>
                {{ avatarPreviewing ? '暂停预览' : '预览选区' }}
              </button>
              <div class="trim-sliders">
                <input type="range" class="trim-slider" :min="0" :max="avatarTrimMax" :step="0.1"
                  :value="avatarTrimRange.start" @pointerdown="handleAvatarTrimStartDrag"
                  @input="updateAvatarTrimStart" />
                <input type="range" class="trim-slider" :min="0" :max="avatarTrimMax" :step="0.1"
                  :value="avatarTrimRange.end" @pointerdown="handleAvatarTrimStartDrag" @input="updateAvatarTrimEnd" />
              </div>
              <div class="trim-info">
                <span>总时长：{{ formatDuration(avatarTrimMax) }}</span>
                <span class="ml-1">裁剪时长：{{ formatDuration(avatarTrimDuration) }}</span>
              </div>
            </div>

            <a-button type="primary" size="large" class="avatar-save-btn" :loading="avatarUploading"
              :disabled="!canSaveAvatar" @click="saveAvatarModel">
              <cloud-upload-outlined />
              保存形象
            </a-button>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.video-step {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  background:
    radial-gradient(circle at 82% 8%,
      color-mix(in srgb, var(--theme-primary-light) 13%, transparent),
      transparent 32%),
    radial-gradient(circle at 12% 92%,
      color-mix(in srgb, var(--theme-secondary) 14%, transparent),
      transparent 34%),
    color-mix(in srgb, var(--theme-background) 42%, transparent);
  overflow: hidden;
}

.video-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

.glass-card {
  min-height: 0;
  border-radius: 22px;
  background: linear-gradient(145deg, var(--theme-overlay-light), var(--theme-overlay-light));
  border: 1px solid var(--theme-overlay-light);
  box-shadow: 0 18px 46px var(--theme-shadow-dark);
  backdrop-filter: blur(18px);
}

.config-card,
.preview-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 18px;
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.card-kicker {
  display: block;
  margin-bottom: 5px;
  color: color-mix(in srgb, var(--theme-info) 72%, transparent);
  font-size: var(--app-font-size-micro);
  font-weight: 900;
  letter-spacing: 0.14em;
}

.card-head h3 {
  margin: 0;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title);
  font-weight: 900;
}

.manage-link,
.mini-action {
  flex-shrink: 0;
  height: 30px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-primary-light) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 22%, transparent);
  font-size: var(--app-font-size-caption);
  font-weight: 800;
  cursor: pointer;
}

.mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 5px;
  border-radius: 16px;
  background: var(--theme-overlay-light);
  border: 1px solid var(--theme-overlay-light);
}

.mode-option {
  height: 34px;
  border: 0;
  border-radius: 12px;
  color: var(--theme-text-muted);
  background: transparent;
  font-weight: 900;
  cursor: pointer;
}

.mode-option.active {
  color: var(--theme-text-primary);
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  box-shadow: 0 10px 22px color-mix(in srgb, var(--theme-primary) 22%, transparent);
}

.setting-block {
  margin-top: 14px;
  padding: 14px;
  border-radius: 16px;
  background: var(--theme-overlay-light);
  border: 1px solid var(--theme-overlay-light);
}

.setting-label {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
}

.setting-label.compact {
  margin-bottom: 4px;
}

.setting-label b {
  color: var(--theme-text-secondary);
}

.multi-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.multi-card p {
  margin: 0;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
}

.multi-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.multi-actions span {
  color: var(--theme-text-secondary);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
}

.cover-image {
  width: 100%;
  height: 100%;
  -o-object-fit: contain;
  object-fit: contain;
}

.cover-placeholder {
  color: var(--theme-text-muted);
}

.avatar-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.avatar-text span {
  color: var(--theme-text-secondary);
  font-weight: 800;
}

.avatar-text small {
  color: var(--theme-text-muted);
}

.audio-source-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  min-height: 96px;
  padding: 12px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--theme-background) 48%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 12%, transparent);
}

.audio-source-main {
  min-width: 0;
}

.audio-source-main>span {
  display: block;
  min-width: 0;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 800;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-audio-btn {
  height: 38px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--theme-info) 28%, transparent);
  border-radius: 999px;
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-primary-light) 16%, transparent);
  cursor: pointer;
  font-weight: 900;
}

.select-audio-btn:hover {
  color: var(--theme-text-primary);
  background: color-mix(in srgb, var(--theme-primary-light) 26%, transparent);
  border-color: color-mix(in srgb, var(--theme-info) 48%, transparent);
}

.audio-wave-player {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.audio-wave-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 13px;
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  cursor: pointer;
}

.audio-wave-btn .anticon {
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-section-title);
}

.audio-waveform {
  height: 48px;
  padding: 9px 10px;
  border-radius: 13px;
  background:
    linear-gradient(90deg,
      color-mix(in srgb, var(--theme-primary) 11%, transparent),
      color-mix(in srgb, var(--theme-secondary) 10%, transparent)),
    var(--theme-overlay-light);
  overflow: hidden;
  box-sizing: border-box;
}

.generate-btn {
  width: 100%;
  height: 44px;
  margin-top: 16px;
  border: none !important;
  border-radius: 15px !important;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary)) !important;
  box-shadow: 0 14px 28px color-mix(in srgb, var(--theme-primary) 24%, transparent);
  font-weight: 900;
}

.marquee-container {
  width: 100%;
  margin-top: 10px;
  padding: 9px 0;
  overflow: hidden;
  border-radius: 10px;
  background: color-mix(in srgb, var(--theme-primary) 10%, transparent);
}

.marquee-text {
  display: inline-block;
  padding-left: 100%;
  white-space: nowrap;
  color: var(--theme-text-gradient-purple);
  font-size: var(--app-font-size-caption);
  line-height: 18px;
  animation: marquee-5cddd0ad 18s linear infinite;
}

.result-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.ghost-btn,
.pill-btn {
  border-radius: 999px !important;
  font-weight: 800;
}

.ghost-btn {
  color: var(--theme-text-secondary) !important;
  background: color-mix(in srgb, var(--theme-primary-light) 14%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-info) 24%, transparent) !important;
}

.video-placeholder,
.video-preview {
  flex: 1;
  min-height: 0;
  border-radius: 18px;
  background: color-mix(in srgb, var(--theme-background) 58%, transparent);
  border: 1px solid var(--theme-overlay-light);
  overflow: hidden;
}

.video-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px;
}

.preview-video {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: clamp(220px, 52vh, 520px);
  border-radius: 14px;
  -o-object-fit: contain;
  object-fit: contain;
  background: var(--theme-background);
}

.video-name {
  margin-top: 10px;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--theme-overlay-medium);
  text-align: center;
}

.placeholder-icon {
  margin-bottom: 12px;
  color: color-mix(in srgb, var(--theme-info) 48%, transparent);
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 48px !important;
}

.video-placeholder .placeholder-icon svg {
  width: 1em !important;
  height: 1em !important;
}

.video-placeholder p {
  margin: 0;
  color: var(--theme-text-muted);
  font-weight: 900;
}

.video-placeholder span {
  margin-top: 6px;
  font-size: var(--app-font-size-caption);
}

.bottom-progress {
  margin-top: 12px;
}

.avatar-modal-layout,
.scene-modal-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.scene-modal-head p {
  margin: 0;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 700;
}

.avatar-upload-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.9fr);
  gap: 16px;
}

.avatar-form-card,
.avatar-upload-card {
  min-height: 0;
  border-radius: 18px;
  background: var(--theme-overlay-light);
  border: 1px solid var(--theme-overlay-light);
}

.avatar-upload-card {
  overflow: hidden;
}

.avatar-upload-card .ant-upload,
.avatar-upload-card .ant-upload-drag,
.avatar-upload-card .ant-upload-wrapper {
  width: 100%;
  height: 100%;
}

.avatar-upload-card .ant-upload-drag {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--theme-background-light) 35%, transparent) !important;
  border: 1px dashed color-mix(in srgb, var(--theme-info) 32%, transparent) !important;
  border-radius: 18px !important;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.avatar-upload-card .ant-upload-drag:hover {
  border-color: color-mix(in srgb, var(--theme-info) 72%, transparent) !important;
  background: color-mix(in srgb, var(--theme-primary) 12%, transparent) !important;
}

.avatar-upload-content {
  width: 100%;
  height: 100%;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-upload-empty {
  max-width: 420px;
  padding: 28px;
  text-align: center;
}

.avatar-upload-icon {
  margin-bottom: 18px;
  color: var(--theme-text-gradient-purple);
  font-size: 42px;
}

.avatar-upload-empty p {
  margin: 0 0 10px;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-secondary);
  font-weight: 900;
}

.avatar-upload-empty span {
  color: var(--theme-text-muted);
  line-height: 1.8;
  font-size: var(--app-font-size-meta);
}

.avatar-video-preview {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 50% 20%,
      color-mix(in srgb, var(--theme-primary-light) 16%, transparent),
      transparent 38%),
    color-mix(in srgb, var(--theme-background) 58%, transparent);
}

.avatar-preview-stage {
  height: 100%;
  max-height: 100%;
  width: auto;
  max-width: 100%;
  aspect-ratio: 9/16;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 14px;
  background: var(--theme-background);
  box-shadow: 0 18px 46px var(--theme-shadow-dark);
}

.avatar-preview-video {
  width: 380px;
  height: 100%;
  min-height: 0;
  border-radius: 0;
  -o-object-fit: contain;
  object-fit: contain;
  background: var(--theme-background);
}

.avatar-trim-controller {
  flex-shrink: 0;
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--theme-background-light) 76%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 14%, transparent);
}

.trim-foot,
.trim-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 800;
}

.trim-head b {
  color: var(--theme-text-secondary);
}

.avatar-upload-preview {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.avatar-preview-video {
  width: 100%;
  max-height: 260px;
  border-radius: 10px;
  background: #000;
  object-fit: contain;
}

.trim-preview-btn {
  width: 100%;
  height: 34px;
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 0;
  border-radius: 12px;
  color: var(--theme-text-primary);
  background: linear-gradient(90deg,
      color-mix(in srgb, var(--theme-primary) 86%, transparent),
      color-mix(in srgb, var(--theme-secondary) 86%, transparent));
  font-size: var(--app-font-size-caption);
  font-weight: 900;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.trim-preview-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px color-mix(in srgb, var(--theme-primary) 22%, transparent);
}

.trim-sliders {
  position: relative;
  height: 28px;
  margin: 8px 0 4px;
}

.trim-sliders input[type='range'] {
  position: absolute;
  inset: 0;
  width: 100%;
  margin: 0;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: transparent;
  pointer-events: none;
}

.trim-sliders input[type='range']::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg,
      color-mix(in srgb, var(--theme-primary) 28%, transparent),
      color-mix(in srgb, var(--theme-secondary) 28%, transparent));
}

.trim-sliders input[type='range']::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  margin-top: -5px;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 50%;
  background: var(--theme-text-secondary);
  border: 3px solid var(--theme-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-primary) 20%, transparent);
  cursor: ew-resize;
  pointer-events: auto;
}

.trim-sliders input[type='range']:last-child::-webkit-slider-thumb {
  border-color: var(--theme-secondary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-secondary) 20%, transparent);
}

.avatar-remove-btn {
  position: absolute;
  top: 22px;
  right: 22px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  color: var(--theme-text-primary);
  background: color-mix(in srgb, var(--theme-background-light) 72%, transparent);
  border: 1px solid var(--theme-overlay-medium);
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.avatar-remove-btn:hover {
  transform: scale(1.06);
  background: color-mix(in srgb, var(--theme-error) 72%, transparent);
  border-color: color-mix(in srgb, var(--theme-error-light) 52%, transparent);
}

.avatar-form-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.avatar-form-card .ant-input,
.avatar-form-card .ant-input-affix-wrapper,
.avatar-form-card textarea.ant-input {
  color: var(--theme-text-secondary) !important;
  background: color-mix(in srgb, var(--theme-background-light) 68%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-info) 18%, transparent) !important;
  box-shadow: inset 0 1px 0 var(--theme-overlay-light) !important;
}

.avatar-form-card .ant-input-affix-wrapper .ant-input {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.avatar-form-card .ant-input-affix-wrapper .ant-input-suffix {
  color: color-mix(in srgb, var(--theme-text-secondary) 66%, transparent) !important;
  background: transparent !important;
}

.avatar-form-card .ant-input-affix-wrapper:hover,
.avatar-form-card .ant-input:hover,
.avatar-form-card textarea.ant-input:hover {
  border-color: color-mix(in srgb, var(--theme-info) 44%, transparent) !important;
  background: color-mix(in srgb, var(--theme-background-light) 78%, transparent) !important;
}

.avatar-form-card .ant-input-affix-wrapper-focused,
.avatar-form-card .ant-input-focused,
.avatar-form-card .ant-input:focus,
.avatar-form-card textarea.ant-input:focus {
  border-color: color-mix(in srgb, var(--theme-info) 72%, transparent) !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary-light) 16%, transparent) !important;
}

.avatar-form-card .ant-input::-moz-placeholder,
.avatar-form-card textarea.ant-input::-moz-placeholder {
  color: var(--theme-text-muted) !important;
}

.avatar-form-card .ant-input::placeholder,
.avatar-form-card textarea.ant-input::placeholder {
  color: var(--theme-text-muted) !important;
}

.avatar-form-card .ant-input-data-count,
.avatar-form-card .ant-input-show-count-suffix,
.avatar-form-card .ant-input-textarea-show-count:after {
  color: color-mix(in srgb, var(--theme-text-secondary) 66%, transparent) !important;
}

.field-label {
  font-weight: 900;
}

.avatar-meta,
.field-label {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
}

.avatar-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  background: var(--theme-overlay-light);
  font-weight: 800;
}

.avatar-meta span {
  padding: 4px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--theme-primary-light) 14%, transparent);
}

.avatar-save-btn {
  margin-top: auto;
  height: 44px;
  border: 0 !important;
  border-radius: 14px !important;
  font-weight: 900 !important;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary)) !important;
  box-shadow: 0 14px 30px color-mix(in srgb, var(--theme-primary) 24%, transparent) !important;
}

.scene-footer,
.scene-modal-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.scene-modal-head {
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--theme-overlay-light);
}

.scene-modal-head h3 {
  margin: 0;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-section-title);
  font-weight: 900;
}

.scene-head-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.scene-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.scene-item {
  display: grid;
  grid-template-columns: 24px 70px minmax(0, 1fr) 120px auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
  background: var(--theme-overlay-light);
  border: 1px solid var(--theme-overlay-light);
}

.scene-drag-handle {
  border: 0;
  color: var(--theme-text-muted);
  background: transparent;
  cursor: grab;
}

.scene-index {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
  cursor: grab;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}

.scene-avatar-select,
.scene-duration-input {
  width: 100%;
}

.scene-avatar-select .ant-select-selector {
  min-height: 48px !important;
  height: 48px !important;
  align-items: center !important;
}

.scene-avatar-select .ant-select-selection-item {
  display: flex !important;
  align-items: center !important;
  overflow: hidden !important;
}

.scene-avatar-select .ant-select-selection-item .avatar-option {
  min-height: 40px;
  padding: 0;
}

.scene-avatar-select .ant-select-selection-item .avatar-cover {
  width: 32px;
  height: 40px;
  border-radius: 6px;
}

.scene-avatar-select .ant-select-selection-item .avatar-text small {
  display: none;
}

.scene-actions {
  display: flex;
  gap: 4px;
}

.scene-actions .ant-btn {
  color: var(--theme-text-secondary) !important;
  background: var(--theme-overlay-light) !important;
  border-color: var(--theme-overlay-medium) !important;
}

.scene-actions .ant-btn:hover {
  color: var(--theme-text-primary) !important;
  border-color: color-mix(in srgb, var(--theme-info) 46%, transparent) !important;
  background: color-mix(in srgb, var(--theme-primary-light) 18%, transparent) !important;
}

.scene-actions .ant-btn[disabled] {
  color: var(--theme-overlay-medium) !important;
  background: var(--theme-overlay-light) !important;
  border-color: var(--theme-overlay-light) !important;
}

.scene-actions .ant-btn-dangerous:not([disabled]) {
  color: var(--theme-error-light) !important;
  border-color: color-mix(in srgb, var(--theme-error-light) 34%, transparent) !important;
  background: color-mix(in srgb, var(--theme-error) 12%, transparent) !important;
}

.scene-footer {
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--theme-overlay-light);
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
}

.scene-footer>div {
  display: flex;
  gap: 8px;
}

.video-step .ant-input,
.video-step .ant-input-number,
.video-step .ant-input-number-group-addon,
.video-step .ant-input-number-input,
.video-step .ant-select-selector {
  color: var(--theme-text-secondary) !important;
  background: var(--theme-overlay-light) !important;
  border-color: var(--theme-overlay-light) !important;
}

.video-step .ant-select-arrow,
.video-step .ant-select-selection-item,
.video-step .ant-select-selection-placeholder {
  color: var(--theme-text-secondary) !important;
}

.video-avatar-modal .ant-modal-content,
.video-avatar-modal .ant-modal-header,
.video-scene-modal .ant-modal-content,
.video-scene-modal .ant-modal-header {
  background: var(--theme-background) !important;
}

.video-avatar-modal .ant-modal-close,
.video-scene-modal .ant-modal-close {
  color: var(--theme-text-secondary) !important;
}

.video-step .ant-modal-root {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.video-step .ant-modal-mask {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: color-mix(in srgb, var(--theme-background) 66%, transparent);
  backdrop-filter: blur(8px);
  pointer-events: auto;
}

.video-step .video-avatar-modal,
.video-step .video-scene-modal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 24px;
  pointer-events: auto;
}

.video-step .video-avatar-modal .ant-modal,
.video-step .video-scene-modal .ant-modal {
  top: auto;
  max-width: none;
  margin: 0;
  padding-bottom: 0;
}

.video-step .video-avatar-modal .ant-modal-body,
.video-step .video-scene-modal .ant-modal-body {
  overflow: hidden;
}

.pill-btn {
  box-shadow: none;
}
</style>

<style>
.full-select {
  width: 100%;
}

.full-select .ant-select-selector {
  min-height: 58px !important;
  height: 58px !important;
  align-items: center !important;
  padding: 6px 14px !important;
}

.full-select .ant-select-selection-item {
  display: flex !important;
  align-items: center !important;
  overflow: hidden !important;
}

.full-select .ant-select-selection-item .avatar-cover {
  width: 42px;
  height: 48px;
  border-radius: 7px;
}

.full-select .ant-select-selection-item .avatar-option {
  min-height: 48px;
  padding: 0;
}

.avatar-option {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 66px;
  padding: 8px 2px;
}

.avatar-cover {
  width: 48px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  background: color-mix(in srgb, var(--theme-background) 48%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ant-select-dropdown {
  background: var(--theme-background) !important;
  border: 1px solid color-mix(in srgb, var(--theme-info) 18%, transparent) !important;
  border-radius: 14px !important;
  box-shadow: 0 18px 46px var(--theme-shadow-dark) !important;
}

.ant-select-dropdown .ant-select-item {
  min-height: 64px !important;
  padding: 8px 12px !important;
  color: var(--theme-text-secondary) !important;
  background: transparent !important;
}

.ant-select-dropdown .ant-select-item-option-active {
  background: color-mix(in srgb, var(--theme-primary-light) 16%, transparent) !important;
}

.ant-select-dropdown .ant-select-item-option-selected {
  color: var(--theme-text-primary) !important;
  background: color-mix(in srgb, var(--theme-primary-light) 26%, transparent) !important;
}

.ant-select-dropdown .ant-select-item-option-content {
  color: var(--theme-text-secondary) !important;
}

.video-step .ant-input,
.video-step .ant-input-number,
.video-step .ant-input-number-input,
.video-step .ant-select-selector,
.video-step .ant-textarea textarea {
  color: var(--theme-text-secondary) !important;
  background: var(--theme-overlay-light) !important;
  border-color: var(--theme-overlay-light) !important;
}

.video-avatar-modal .ant-modal-content,
.video-avatar-modal .ant-modal-header,
.video-scene-modal .ant-modal-content,
.video-scene-modal .ant-modal-header {
  background: var(--theme-background) !important;
}

.avatar-form-card .ant-input,
.avatar-form-card .ant-input-affix-wrapper,
.avatar-form-card textarea.ant-input {
  color: var(--theme-text-secondary) !important;
  background: color-mix(in srgb, var(--theme-background-light) 68%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-info) 18%, transparent) !important;
  box-shadow: inset 0 1px 0 var(--theme-overlay-light);
}

.avatar-form-card .ant-input-affix-wrapper input {
  outline: none;
  box-shadow: none;
}

.avatar-meta,
.field-label {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
}
</style>
