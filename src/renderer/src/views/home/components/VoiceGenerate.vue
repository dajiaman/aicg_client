<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import WaveSurfer from 'wavesurfer.js'
import { usePipeline } from '../../../hooks/usePipeline'
import { usePermission } from '../../../hooks/usePermission'
import { useVoiceClone } from '../../../hooks/useVoiceClone'
import AudioCropper from '../../../components/AudioCropper.vue'
import { pathJoin } from '../../../utils'
import {
  CloudUploadOutlined,
  DownOutlined,
  FolderOpenFilled,
  InboxOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SaveFilled,
  SoundOutlined
} from '@ant-design/icons-vue'
import BenchmarkProgress from '../../../components/BenchmarkProgress.vue'

const { pipeline, notifyStepStart, notifyStepComplete, notifyStepError, updatePipelineData } =
  usePipeline()

const { checkFullPermission } = usePermission()

const voiceStepRef = ref(null)

// wavesurfer 相关
const wavesurferInstance = ref(null)
const waveformRef = ref(null)
const waveDuration = ref(0)
const waveCurrentTime = ref(0)
const wavePlaying = ref(false)

/**
 * 把秒数格式化为时长字符串：
 *   - 总时长 < 1 小时：MM:SS
 *   - 总时长 >= 1 小时：HH:MM:SS
 */
const formatDuration = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const h = Math.floor(total / 3600)
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${m}:${s}`
  }
  return `${m}:${s}`
}

const waveDurationText = computed(() => formatDuration(waveDuration.value))
const waveCurrentTimeText = computed(() => formatDuration(waveCurrentTime.value))

const {
  loading,
  voiceList,
  selectedVoiceId,
  voiceSpeed,
  voiceModelVersion,
  voiceTargetLanguage,
  emotionLabels,
  emotions,
  emotionWeight,
  selectedEmotionType,
  clonedAudio,
  clonedAudioName,
  clonedAudioSize,
  clonedAudioUrl,
  progressText,
  loadVoiceList,
  cloneVoice,
  formatTime
} = useVoiceClone()

/**
 * 音频地址
 */
const clonedAudioSrc = computed(() => {
  const local = clonedAudio.value
  const remote = clonedAudioUrl.value
  if (local && !local.startsWith('http') && !local.startsWith('file://')) {
    return 'file://' + local
  }
  return local || remote || ''
})

const shouldShowAudioSize = computed(() => {
  const v = clonedAudioSize.value
  return !!v && v !== '0 B' && v !== '0'
})

const voiceScript = ref('')
// 显示高级设置
const showMoreSettings = ref(false)
const previewPlaying = ref(false)
const resultVolume = ref(30)

const uploadModalVisible = ref(false)
const uploadingVoice = ref(false)
// 视频提取音频中
const extractingVoice = ref(false)

const uploadForm = reactive({
  name: '',
  description: '',
  file: null,
  fileList: [],
  fileName: '',
  audioUrl: '',
  savedAudioPath: ''
})
const currentAudioUrl = ref('')
const selectedRegion = ref(null)
const audioDuration = ref(0)
const isValidRegion = ref(false)

const canUploadVoice = computed(() => {
  return uploadForm.file && uploadForm.name.trim() && isValidRegion.value && !uploadingVoice.value
})

const canClone = computed(() => {
  return !!selectedVoiceId.value && voiceScript.value && voiceScript.value.trim().length > 0
})

const voiceScriptLimitState = computed(() => {
  const count = voiceScript.value?.length || 0
  const limit = 3000
  return { valid: count <= limit, count, limit, isOverLimit: count > limit }
})

/**
 * 加载波形图
 */
const loadWaveform = async () => {
  await nextTick()
  if (!waveformRef.value || !clonedAudio.value) return
  if (wavesurferInstance.value) {
    wavesurferInstance.value.destroy()
    wavesurferInstance.value = null
  }
  wavesurferInstance.value = WaveSurfer.create({
    container: waveformRef.value,
    waveColor: '#999',
    progressColor: '#1890ff',
    cursorWidth: 0,
    barWidth: 2,
    barGap: 2,
    barRadius: 2,
    height: 56,
    normalize: true
  })
  wavesurferInstance.value.on('ready', () => {
    waveDuration.value = Math.floor(wavesurferInstance.value.getDuration())
  })
  wavesurferInstance.value.on('audioprocess', () => {
    waveCurrentTime.value = Math.floor(wavesurferInstance.value.getCurrentTime())
  })
  wavesurferInstance.value.on('play', () => {
    wavePlaying.value = true
  })
  wavesurferInstance.value.on('pause', () => {
    wavePlaying.value = false
  })
  wavesurferInstance.value.on('finish', () => {
    wavePlaying.value = false
  })
  wavesurferInstance.value.load(clonedAudioSrc.value)
}

const toggleWavePlayback = () => {
  if (!wavesurferInstance.value) return
  wavesurferInstance.value.playPause()
}

// 从 pipeline 恢复
watch(
  () => pipeline.rewrittenContent,
  (val) => {
    if (val) voiceScript.value = val
  },
  { immediate: true }
)

watch(
  () => pipeline.voiceTargetLanguage,
  (val) => {
    if (val) voiceTargetLanguage.value = val
  },
  { immediate: true }
)

watch(
  () => pipeline.selectedVoiceId,
  (val) => {
    if (val) selectedVoiceId.value = val
  },
  { immediate: true }
)
watch(
  () => pipeline.voiceModelVersion,
  (val) => {
    if (val) voiceModelVersion.value = val
  },
  { immediate: true }
)
watch(
  () => pipeline.voiceSpeed,
  (val) => {
    if (val) voiceSpeed.value = val
  },
  { immediate: true }
)

watch(
  () => pipeline.emotions,
  (val) => {
    if (val) Object.assign(emotions, val)
  },
  { immediate: true }
)

watch(
  () => pipeline.emotionWeight,
  (val) => {
    if (val !== undefined) emotionWeight.value = val
  },
  { immediate: true }
)

watch(
  () => pipeline.selectedEmotionType,
  (val) => {
    if (val) selectedEmotionType.value = val
  },
  { immediate: true }
)

watch(
  () => pipeline.clonedAudioPath,
  (val) => {
    if (val) clonedAudio.value = val
  },
  { immediate: true }
)
watch(
  () => pipeline.clonedAudioUrl,
  (val) => {
    if (val) clonedAudioUrl.value = val
  },
  { immediate: true }
)

watch(
  () => selectedEmotionType.value,
  (val) => {
    if (val === 'none') {
      emotionWeight.value = 0
    }
  },
  { immediate: true }
)

/**
 * 克隆声音
 */
const handleClone = async () => {
  if (!checkFullPermission('声音克隆')) return

  if (!canClone.value) {
    message.warning('请选择声音模型并输入文案')
    return
  }

  progressText.value = '正在准备声音克隆...'
  notifyStepStart('voiceClone')

  if (selectedEmotionType.value && selectedEmotionType.value !== 'none') {
    Object.keys(emotions).forEach((key) => {
      emotions[key] = 0
    })
    emotions[selectedEmotionType.value] = emotionValue.value
  } else {
    Object.keys(emotions).forEach((key) => {
      emotions[key] = 0
    })
  }

  // 克隆
  const result = await cloneVoice(
    voiceScript.value,
    selectedVoiceId.value,
    (text) => {
      progressText.value = text
    },
    { voiceModelVersion: voiceModelVersion.value }
  )

  if (result.success) {
    updatePipelineData({
      selectedVoiceId: selectedVoiceId.value,
      voiceModelVersion: voiceModelVersion.value,
      voiceTargetLanguage: voiceTargetLanguage.value,
      voiceSpeed: voiceSpeed.value,
      emotions: { ...emotions },
      emotionWeight: emotionWeight.value,
      selectedEmotionType: selectedEmotionType.value,
      clonedAudioPath: result.data.audioPath,
      clonedAudioName: result.data.audioName,
      clonedAudioSize: result.data.audioSize,
      clonedAudioUrl: result.data.audioUrl,
      drivingAudio: result.data.audioPath
    })

    notifyStepComplete('voiceClone', result.data)
    progressText.value = ''

    if (pipeline.executionMode === 'auto') {
      window.dispatchEvent(new CustomEvent('workflow:auto-next', { detail: { step: 'video' } }))
    }
    // 加载波形
    await loadWaveform()
  } else {
    notifyStepError('voiceClone', new Error(result.error))
    progressText.value = ''
    setTimeout(() => {
      progressText.value = ''
    }, 2000)
  }
}

const previewAudio = ref(null)

// 切换声音预览
const toggleVoicePreview = () => {
  if (previewPlaying.value) {
    previewPlaying.value = false
    if (previewAudio.value) {
      previewAudio.value.pause()
      previewAudio.value.currentTime = 0
      previewAudio.value.onerror = null
      previewAudio.value.src = ''
      previewAudio.value = null
    }
    return
  }
  const voice = voiceList.value.find((v) => v.id === selectedVoiceId.value)
  if (!voice) {
    message.warning('该声音没有预览音频')
    return
  }
  const audioUrl2 = voice.audio_url || voice.audio_path
  if (!audioUrl2) {
    message.warning('该声音没有预览音频')
    return
  }
  previewPlaying.value = true
  const audio = new Audio(audioUrl2)
  audio.onended = () => {
    previewPlaying.value = false
  }
  audio.onerror = () => {
    previewPlaying.value = false
    message.error('播放预览失败')
  }
  audio.play().catch(() => {
    previewPlaying.value = false
    message.error('播放预览失败')
  })
  previewAudio.value = audio
}

onBeforeUnmount(() => {
  if (previewAudio.value) {
    try {
      previewAudio.value.pause()
      previewAudio.value.src = ''
    } catch {
      /* ignore */
    }
    previewAudio.value = null
  }
})

/**
 * 打开文件所在文件夹
 */
const openFileInFolder = async (path) => {
  try {
    const result = await window.api.file.showInFolder(path)
    if (result.success) {
      // message.success('已打开文件所在文件夹')
    } else {
      message.error(result.error || '打开文件夹失败')
    }
  } catch (e) {
    console.error('打开文件夹失败:', e)
    message.error('打开文件夹失败')
  }
}

/**
 * 另存为
 */
const saveAudioAs = async () => {
  if (!clonedAudio.value) return
  try {
    const result = await window.api.file.saveDialog({
      title: '另存为音频',
      defaultPath: clonedAudioName.value || '克隆音频.wav',
      filters: [{ name: '音频文件', extensions: ['wav', 'mp3', 'm4a'] }]
    })
    if (result.success && !result.data.canceled && result.data.filePath) {
      const copyResult = await window.api.file.copy(clonedAudio.value, result.data.filePath)
      if (copyResult.success) {
        message.success('音频已另存为')
      } else {
        message.error(copyResult.error || '另存为失败')
      }
    }
  } catch (e) {
    console.error('另存为失败:', e)
    message.error('另存为失败：' + e.message)
  }
}

/**
 * 打开上传弹窗
 */
const openUploadModal = () => {
  if (!checkFullPermission('声音克隆')) return
  resetUploadForm()
  uploadModalVisible.value = true
  nextTick(updateModalSize)
}

/**
 * 重置上传表单
 */
const resetUploadForm = () => {
  if (currentAudioUrl.value && currentAudioUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(currentAudioUrl.value)
  }
  currentAudioUrl.value = ''
  uploadForm.name = ''
  uploadForm.description = ''
  uploadForm.file = null
  uploadForm.fileList = []
  uploadForm.fileName = ''
  uploadForm.audioUrl = ''
  uploadForm.savedAudioPath = ''
  selectedRegion.value = null
  isValidRegion.value = false
  audioDuration.value = 0
}

/**
 * 上传前验证
 */
const beforeVoiceUpload = async (file) => {
  const validTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/x-m4a',
    'audio/aac',
    'audio/flac',
    'video/mp4',
    'video/quicktime'
  ]
  if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|aac|flac|mp4|mov)$/i)) {
    message.error('只能上传音频或视频文件')
    return false
  }
  if (file.size > 50 * 1024 * 1024) {
    message.error('文件大小不能超过 50MB')
    return false
  }
  uploadForm.file = file
  uploadForm.fileName = file.name || '未命名文件'

  // 视频文件：先提取音频（wav），AudioCropper 基于提取出的音频裁剪
  const isVideo = /\.(mp4|mov|mkv|avi|webm|flv|wmv|m4v|ts|3gp)$/i.test(file.name)
  if (isVideo) {
    const p = window.api.getPathForFile(file)
    if (!p) {
      message.error('无法读取视频文件路径，请重新选择')
      return false
    }
    extractingVoice.value = true
    try {
      const dataDir = await ensureDataDir()
      const timestamp = Date.now()
      const wavPath = pathJoin(dataDir, `extracted_${timestamp}.wav`)
      const res = await window.api.video.extractAudio({ videoPath: p, outputPath: wavPath })
      if (!res?.success) throw new Error(res?.error || '音频提取失败')
      const audioPath = res.data?.audioPath || wavPath
      uploadForm.savedAudioPath = audioPath
      // 读取为 Buffer 并生成 blob URL 供 wavesurfer 加载（file:// 协议下 fetch 受限）
      const readRes = await window.api.file.readBuffer(audioPath)
      if (readRes?.success && readRes.data) {
        const blob = new Blob([readRes.data], { type: 'audio/wav' })
        currentAudioUrl.value = URL.createObjectURL(blob)
      } else {
        currentAudioUrl.value = 'file://' + audioPath.split(/[\\/]/).join('/')
      }
      message.success('已从视频提取音频，请裁剪片段')
    } catch (e) {
      message.error('视频提取音频失败：' + (e.message || e))
      uploadForm.file = null
      uploadForm.fileName = ''
      currentAudioUrl.value = ''
      uploadForm.savedAudioPath = ''
      return false
    } finally {
      extractingVoice.value = false
    }

    // 自动填充名称
    const baseName = file.name.replace(/\.[^.]+$/, '').slice(0, 10)
    if (!uploadForm.name) {
      uploadForm.name = baseName
    }
    return false // 阻止自动上传
  }

  // 音频文件：blob URL 直接预览裁剪
  uploadForm.savedAudioPath = ''
  const url = URL.createObjectURL(file)
  currentAudioUrl.value = url
  const audio = new Audio()
  audio.src = url
  audio.onloadedmetadata = () => {
    audioDuration.value = audio.duration
  }

  // 自动填充名称
  const baseName = file.name.replace(/\.[^.]+$/, '').slice(0, 10)
  if (!uploadForm.name) {
    uploadForm.name = baseName
  }
  return false // 阻止自动上传
}

/**
 * 移除上传音频
 */
const removeUploadAudio = () => {
  if (currentAudioUrl.value && currentAudioUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(currentAudioUrl.value)
  }
  uploadForm.file = null
  uploadForm.fileList = []
  uploadForm.fileName = ''
  uploadForm.savedAudioPath = ''
  currentAudioUrl.value = ''
  selectedRegion.value = null
  audioDuration.value = 0
  isValidRegion.value = false
}

/**
 * audioCropper 选区
 */
const handleSelectionUpdate = (selection) => {
  if (selection) {
    selectedRegion.value = selection
    isValidRegion.value =
      selection.end - selection.start >= 5 && selection.end - selection.start <= 30
  } else {
    selectedRegion.value = null
    isValidRegion.value = false
  }
}

// 显示warn
const showDurationWarning = ref(false)
const audioTrimmerError = ref('')

/**
 * 处理音频加载完成
 */
const handleAudioLoaded = (info) => {
  const duration = info.duration
  audioDuration.value = duration || 0
  if (duration > 30) {
    showDurationWarning.value = true
  } else {
    showDurationWarning.value = false
  }
}

/**
 * 处理音频加载错误
 */
const handleAudioError = (err) => {
  audioTrimmerError.value = err.message || '音频加载失败'
  message.error('加载音频失败：' + audioTrimmerError.value)
}

/**
 * 获取上传文件的原始路径或 ArrayBuffer
 */
const getUploadFileSource = async () => {
  const file = uploadForm.file
  if (!file) throw new Error('未选择文件')

  // 视频已提取音频：直接用提取出的 wav 路径参与裁剪
  if (uploadForm.savedAudioPath) {
    return { sourcePath: uploadForm.savedAudioPath, sourceBuffer: null }
  }

  // 如果文件是 Blob（来自拖拽或未保存的临时对象），读取为 ArrayBuffer
  if (file instanceof Blob) {
    const buffer = await file.arrayBuffer()
    return { sourcePath: null, sourceBuffer: buffer }
  }

  // 如果是路径字符串
  if (typeof file === 'string') {
    return { sourcePath: file, sourceBuffer: null }
  }

  // 如果有 path 属性（Electron 文件对象）
  if (file.path) {
    return { sourcePath: file.path, sourceBuffer: null }
  }

  // 如果文件对象有 originFileObj（如 Ant Design Upload 组件包装的对象）
  if (file.originFileObj instanceof Blob) {
    const buffer = await file.originFileObj.arrayBuffer()
    return { sourcePath: null, sourceBuffer: buffer }
  }

  throw new Error('无法读取文件内容')
}

/**
 * 获取并确保音频输出目录存在（用于存储临时音频文件）
 * @returns {Promise<string>} 音频目录的绝对路径
 */
const ensureDataDir = async () => {
  // 1. 获取应用数据根目录（Electron 的 userData）
  const dataPathResult = await window.api.file.getDataPath()
  console.log('dataPathResult:', dataPathResult)

  if (!dataPathResult.success) {
    throw new Error(dataPathResult.error || '获取数据目录失败')
  }

  const appRoot = dataPathResult.data.dataDir
  // 2. 拼接子目录：voice_samples
  const audioDir = pathJoin(appRoot, 'voice_samples')

  // 3. 检查目录是否存在，不存在则创建
  const existsResult = await window.api.file.exists(audioDir)
  if (!existsResult.success) {
    // 如果检查失败（可能权限问题），直接尝试创建
    console.error(audioDir + '文件夹不存在')
    return
  }

  // 不存在
  if (!existsResult.data?.exists) {
    const mkdirResult = await window.api.file.mkdir(audioDir)
    if (!mkdirResult.success) {
      throw new Error(mkdirResult.error || '创建声音目录失败')
    }
  }

  return audioDir
}

/**
 * 执行 ASR 语音识别，提取文案
 * @param {string} localPath - 本地音频文件路径
 * @param {string} cloudUrl - 云端音频 URL（优先使用）
 * @returns {Promise<string>} 识别出的文本
 */
const performAsr = async (localPath, cloudUrl) => {
  // 获取运行模式
  const configRes = await window.api.config.getAll()
  const runMode = (configRes.success && configRes.data?.general?.runMode) || 'local'

  let audioSource = cloudUrl || localPath

  // 如果是云端模式但只有本地路径，先上传
  if (runMode === 'cloud' && !cloudUrl) {
    // 实际上此时 audioUrl 已存在，因为前面已上传，所以无需再上传
    // 但以防万一，这里保留逻辑
    if (!cloudUrl) {
      const upload = await window.api.oss.upload(localPath, 'temp')
      if (!upload.success) throw new Error('上传音频到云端失败')
      audioSource = upload.data.url
    }
  }

  // 调用 ASR
  let result
  if (runMode === 'cloud') {
    result = await window.api.cloud.asr.transcribe(audioSource, 'auto')
  } else {
    // 本地 ASR 需要本地文件路径
    result = await window.api.python.asr.recognize(localPath, 'auto')
  }

  if (!result.success) {
    throw new Error(result.error || '语音识别失败')
  }

  // 提取文本
  const text =
    result.data.data?.text || result.data.data?.processed_text || result.data.data?.raw_text || ''
  return text.trim()
}

/**
 * 提交上传音频，执行 ASR 语音识别
 */
const submitUploadVoice = async () => {
  if (!canUploadVoice.value) {
    message.warning('请先选择音频文件并填写名称，且裁剪区域有效')
    return
  }

  uploadingVoice.value = true
  let trimmedPath = null
  let bufferPath = null

  try {
    // 文件验证（裁剪功能由 UploadVoiceModal 接管时这里跳过）
    if (!uploadForm.file) {
      message.error('请先选择音频文件')
      return
    }

    // 2. 获取数据目录（用于存放临时文件）
    const dataDir = await ensureDataDir() // 返回目录路径字符串
    const timestamp = Date.now()

    // 临时文件路径
    trimmedPath = pathJoin(dataDir, `voice_sample_${timestamp}.wav`)
    bufferPath = pathJoin(dataDir, `temp_audio_${timestamp}.wav`)

    const { sourcePath, sourceBuffer } = await getUploadFileSource()

    // 4. 获取用户裁剪选区（从 AudioCropper 组件获得）
    if (!selectedRegion.value) {
      throw new Error('请先选择音频片段')
    }

    const { start, end } = selectedRegion.value
    const duration = end - start
    if (duration < 5 || duration > 30) {
      throw new Error('裁剪区域时长必须在 5 ~ 30 秒之间')
    }

    // 4. 写入临时文件（如果是 Buffer）
    let inputPath = sourcePath
    if (sourceBuffer) {
      const writeResult = await window.api.file.writeBuffer(bufferPath, sourceBuffer)
      if (!writeResult.success) {
        throw new Error(writeResult.error || '写入临时音频失败')
      } else {
        console.log('写入成功')
      }
      inputPath = bufferPath
    }

    // 6. 调用音频裁剪接口
    const trimResult = await window.api.audio.trim(inputPath, trimmedPath, start, duration)
    if (!trimResult.success) {
      throw new Error(trimResult.error || '音频裁剪失败')
    } else {
      console.log('音频裁剪成功')
    }

    // 7. 清理临时缓冲区文件（如果存在）
    if (sourceBuffer && bufferPath) {
      try {
        await window.api.file.delete(bufferPath)
        console.log('删除临时音频文件成功')
      } catch (e) {
        console.warn('删除临时音频文件失败:', e)
      }
    }

    let audioUrl = ''

    // // 8. 上传裁剪后的音频到 OSS（获取可公开访问的 URL）
    // const uploadResult = await window.api.oss.upload(trimmedPath, 'audio')
    // if (!uploadResult.success) {
    //   throw new Error('上传声音失败：' + uploadResult.error)
    // } else {
    //   console.log('上传oss成功')
    // }

    // const audioUrl = uploadResult.data.url

    // 9. 对音频进行 ASR 识别，提取文案作为模型描述
    const asrText = await performAsr(trimmedPath, audioUrl)
    const description = asrText || uploadForm.description || uploadForm.name

    // 保存到数据库
    const saveResult = await window.api.voice.create({
      name: uploadForm.name.trim(),
      description: description || uploadForm.name.trim(),
      prompt_text: description || uploadForm.name.trim(),
      audio_path: trimmedPath,
      audio_url: audioUrl
    })

    if (saveResult.success) {
      message.success('声音上传成功')
      await loadVoiceList()
      const newId = saveResult.data?.id
      if (newId) selectedVoiceId.value = newId
      uploadModalVisible.value = false
      removeUploadAudio()
    } else {
      throw new Error(saveResult.error || '保存声音失败')
    }
  } catch (e) {
    message.error('上传声音失败：' + e.message)
  } finally {
    uploadingVoice.value = false
  }
}

const modalSize = reactive({ width: 1040, height: 800 })
const modalStyle = reactive({ paddingBottom: '' })
const modalBodyStyle = reactive({ padding: '50px 24px', overflow: 'hidden' })

const updateModalSize = () => {
  const el = voiceStepRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  modalSize.width = Math.min(Math.max(rect.width * 0.92, 880), 1040)
  modalSize.height = Math.min(Math.max(rect.height * 0.9, 640), 800)
}

/**
 * // 暴露给父组件（用于工作流验证）
 * 验证当前步骤是否符合要求
 * @returns {boolean} 是否符合要求
 */
const handleBeforeNext = () => {
  if (!clonedAudio.value && !pipeline.clonedAudioPath) {
    message.warning('请先生成音频')
    return false
  }

  console.log('音频已生成')
  return true
}

defineExpose({
  handleBeforeNext
})

onMounted(async () => {
  await loadVoiceList()

  if (pipeline.rewrittenContent) {
    voiceScript.value = pipeline.rewrittenContent
  }

  if (pipeline.voiceScript) {
    voiceScript.value = pipeline.voiceScript
  }

  if (pipeline.voiceTargetLanguage) {
    voiceTargetLanguage.value = pipeline.voiceTargetLanguage
  }

  if (pipeline.selectedVoiceId) {
    selectedVoiceId.value = pipeline.selectedVoiceId
  }

  if (pipeline.voiceModelVersion) {
    voiceModelVersion.value = pipeline.voiceModelVersion
  }

  if (pipeline.voiceSpeed) {
    voiceSpeed.value = pipeline.voiceSpeed
  }

  if (pipeline.emotionWeight !== undefined) {
    emotionWeight.value = pipeline.emotionWeight
  }

  if (pipeline.selectedEmotionType) {
    selectedEmotionType.value = pipeline.selectedEmotionType
  }

  if (pipeline.clonedAudioPath) {
    clonedAudio.value = pipeline.clonedAudioPath
    loadWaveform()
  }

  if (pipeline.clonedAudioName) {
    clonedAudioName.value = pipeline.clonedAudioName
  }

  if (pipeline.clonedAudioSize) {
    clonedAudioSize.value = pipeline.clonedAudioSize
  }

  nextTick(updateModalSize)
  window.addEventListener('resize', updateModalSize)
})

onBeforeUnmount(() => {
  if (wavesurferInstance.value) {
    wavesurferInstance.value.destroy()
    wavesurferInstance.value = null
  }
  if (previewAudio.value) {
    previewAudio.value.pause()
    previewAudio.value = null
  }

  window.removeEventListener('resize', updateModalSize)
})

watch(() => voiceScript.value, (val) => {
  updatePipelineData({ voiceScript: val })
}, {
  immediate: true
})

/**
 * 情感类型选择器
 * @param {string} val - 选择的情感类型
 */
const handleEmotionChange = (val) => {
  if (val === 'none') {
    emotionWeight.value = 0.0
  }
  selectedEmotionType.value = val
}
</script>

<template>
  <div ref="voiceStepRef" :class="{ executing: loading }" class="voice-step">
    <div class="voice-layout">
      <div class="glass-card script-card">
        <div class="card-title">
          <div>
            <h3>最终文案</h3>
          </div>
          <div class="script-tools"></div>
        </div>
        <div class="script-input-wrap">
          <a-textarea v-model:value="voiceScript" class="voice-script-textarea"
            placeholder="第二步改写后的文案会显示在这里，也可以在生成声音前继续修改" :disabled="loading" />
          <span class="word-count">{{ voiceScriptLimitState.count }} / {{ voiceScriptLimitState.limit }} 字</span>
        </div>

        <div class="script-hint">配音将使用这里的最终文案生成，修改后会请重新生成音频。</div>
      </div>

      <div class="voice-main">
        <div class="glass-card config-card">
          <div class="config-head">
            <div>
              <h3>声音配置</h3>
            </div>
            <button class="manage-link" @click="openUploadModal">上传声音</button>
          </div>

          <div class="voice-select-row">
            <a-select v-model:value="selectedVoiceId" class="voice-select">
              <a-select-option v-for="voice in voiceList" :key="voice.id" :value="voice.id">
                {{ voice.name }}
              </a-select-option>
            </a-select>
            <a-button class="preview-btn" @click="toggleVoicePreview">
              <template #icon>
                <PlayCircleOutlined style="width: 25px" v-if="!previewPlaying" />
                <PauseCircleOutlined style="width: 25px" v-else />
              </template>
            </a-button>
          </div>

          <div class="model-version-row">
            <span>生成模型</span>
            <a-radio-group v-model:value="voiceModelVersion" class="model-version-radio">
              <a-radio-button value="v1">经典模型</a-radio-button>
              <a-radio-button value="v2">快速模型</a-radio-button>
            </a-radio-group>
          </div>

          <button class="more-toggle" type="button">
            <DownOutlined />
            <span>高级设置</span>
          </button>

          <div class="settings-grid">
            <div class="setting-block">
              <div class="setting-label">
                <span>语速</span>
                <b>1.00x</b>
              </div>
              <a-slider v-model:value="voiceSpeed" class="setting-slider" :min="0.5" :max="1.5" :step="0.1" />
            </div>

            <div class="setting-block">
              <div class="setting-label">
                <span>情感类型</span>
                <b>{{ emotionLabels[selectedEmotionType] }}</b>
              </div>

              <div class="emotion-row">
                <a-select v-model:value="selectedEmotionType" @change="handleEmotionChange">
                  <a-select-option :value="index" v-for="(label, index) in emotionLabels" :key="index">{{ label
                    }}</a-select-option>
                </a-select>
                <a-input-number v-model:value="emotionWeight" :min="0.0" :max="1.0" :step="0.1" />
              </div>
            </div>
          </div>

          <a-button block type="parimary" size="lg" class="generate-btn" :disabled="!canClone" @click="handleClone">
            <SoundOutlined />
            生成声音
          </a-button>

          <div class="marquee-container" v-if="loading">
            <div class="marquee-text">
              温馨提示：正常 1 分钟的声音克隆耗时约 1-3 分钟，请耐心等待。
            </div>
          </div>
        </div>

        <div class="glass-card result-card">
          <div class="card-title">
            <div>
              <h3>克隆结果</h3>
            </div>
            <div class="result-actions">
              <a-button class="open-btn" type="primary" size="sm" @click="openFileInFolder(clonedAudio)">
                <FolderOpenFilled />
                打开
              </a-button>
              <a-button class="save-btn" size="sm" @click="saveAudioAs">
                <SaveFilled />
                另存为
              </a-button>
            </div>
          </div>

          <div class="audio-player" v-if="clonedAudio">
            <div class="audio-info">
              <span class="audio-name">
                {{ clonedAudioName }}
              </span>
              <span class="audio-size">
                {{ clonedAudioSize }}
              </span>
            </div>
            <div class="wave-player">
              <button class="wave-play-btn" type="button" @click="toggleWavePlayback">
                <PlayCircleOutlined v-if="wavePlaying" />
                <PauseCircleOutlined v-else />
              </button>
              <div class="waveform" ref="waveformRef"></div>
              <div class="wave-meta">
                <span class="wave-time">
                  {{ waveCurrentTimeText }}
                </span>
                <span class="wave-volume">
                  <SoundOutlined class="volume-icon" />
                  <a-slider class="volume-slider" v-model:value="resultVolume"></a-slider>
                  <b>{{ resultVolume }}</b>
                </span>
                <span class="wave-time wave-duration">
                  {{ waveDurationText }}
                </span>
              </div>
            </div>
          </div>

          <div class="audio-placeholder" v-if="!clonedAudio">
            <SoundOutlined class="placeholder-icon" />
            <p>克隆的音频将在这里显示</p>
            <span>完成生成后可在此处播放预览</span>
          </div>
        </div>
      </div>
    </div>

    <BenchmarkProgress :text="progressText" :loading="loading" />

    <!-- 上传声音弹窗 -->
    <a-modal v-model:open="uploadModalVisible" title="" :footer="null" centered :width="modalSize.width"
      :style="modalStyle" :body-style="modalBodyStyle" wrap-class-name="voice-upload-modal">
      <div class="upload-modal-layout">
        <div class="upload-modal-head">
          <div>
            <span class="card-kicker">UPLOAD VOICE</span>
            <h3>上传声音</h3>
          </div>
          <p>上传一段音频或视频，系统会保存为可选声音模型。</p>
        </div>

        <div class="upload-form-grid">
          <div class="upload-drap-card">
            <a-upload-dragger v-model:file-list="uploadForm.fileList" name="file" multiple accept="audio/*,video/*"
              :before-upload="beforeVoiceUpload" :disabled="uploadingVoice" @remove="removeUploadAudio">
              <div class="upload-drop-content">
                <InboxOutlined class="upload-drop-icon" />
                <p class="upload-title">点击或拖拽音频/视频文件到这里</p>
                <p class="upload-hint">支持 MP3、WAV、M4A、MP4、MOV 等格式，文件不超过 50MB</p>
              </div>
            </a-upload-dragger>
          </div>

          <div class="upload-side-card">
            <span class="field-label">声音名称</span>
            <a-input v-model:value="uploadForm.name" :disabled="uploadingVoice" placeholder="例如：我的声音" />

            <div v-if="uploadForm.file" class="upload-preview">
              <div class="upload-preview-head">
                <span>{{ uploadForm.fileName }}</span>
                <span v-if="audioDuration">{{ formatTime(audioDuration) }}</span>
              </div>

              <div class="cropper-tip">
                建议选择 5-30 秒音频，超过 30 秒默认选取前 30 秒，可拖拽调整裁剪范围。
              </div>

              <div v-if="extractingVoice" class="uploading-text">正在从视频提取音频...</div>
              <template v-else-if="!uploadingVoice">
                <div v-if="!isValidRegion" class="cropper-tip">⚠️ 请选择 5-30 秒的音频区域</div>
                <!-- 音频裁剪组件：选择音频/视频（提取音频后）即显示 -->
                <AudioCropper :audio-url="currentAudioUrl" :min-duration="5" :max-duration="30"
                  @update:selection="handleSelectionUpdate" @loaded="handleAudioLoaded" @error="handleAudioError" />
              </template>
              <div v-if="uploadingVoice" class="uploading-text">正在上传音频到云端...</div>
            </div>

            <a-button type="primary" size="large" class="upload-submit-btn" :loading="uploadingVoice"
              :disabled="!canUploadVoice" @click="submitUploadVoice">
              <CloudUploadOutlined />
              保存声音
            </a-button>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.voice-step {
  width: 100%;
  height: auto;
  min-height: 610px;
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  background:
    radial-gradient(circle at 80% 12%,
      color-mix(in srgb, var(--theme-info) 12%, transparent),
      transparent 32%),
    radial-gradient(circle at 10% 90%,
      color-mix(in srgb, var(--theme-secondary) 13%, transparent),
      transparent 34%),
    color-mix(in srgb, var(--theme-background) 42%, transparent);
  overflow: hidden;
}

.voice-layout {
  flex: 1;
  min-height: 560px;
  display: grid;
  grid-template-columns: minmax(280px, 38%) minmax(0, 1fr);
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
.result-card,
.script-card {
  display: flex;
  flex-direction: column;
}

.script-card {
  padding: 18px;
}

.voice-main {
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(260px, 1fr) 280px;
  gap: 18px;
}

.config-card,
.result-card {
  padding: 18px;
}

.card-title,
.config-head {
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

.card-title h3,
.config-head h3 {
  margin: 0;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title);
  font-weight: 900;
}

.word-count {
  position: absolute;
  right: 12px;
  bottom: 10px;
  z-index: 1;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-micro);
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}

.word-count.warning {
  color: var(--theme-warning);
}

.script-tools {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.translation-language-select {
  width: 112px;
}

.translate-btn {
  flex-shrink: 0;
  color: var(--theme-text-secondary) !important;
  background: color-mix(in srgb, var(--theme-primary-light) 14%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-info) 22%, transparent) !important;
  font-weight: 800;
}

.translate-btn:not(.ant-btn-disabled):hover {
  color: var(--theme-text-primary) !important;
  border-color: color-mix(in srgb, var(--theme-info) 46%, transparent) !important;
}

.dialect-voice-tip {
  margin-top: 10px;
  padding: 9px 12px;
  border-radius: 12px;
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-warning) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-warning) 26%, transparent);
  font-size: var(--app-font-size-caption);
  line-height: 1.6;
}

.script-input-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
}

.script-textarea {
  flex: 1;
  min-height: 0;
  resize: none;
  font-size: var(--app-font-size-body);
  line-height: 1.75;
}

.script-hint {
  margin-top: 12px;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
}

.manage-link {
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
}

.manage-link:hover {
  color: var(--theme-text-primary);
  border-color: color-mix(in srgb, var(--theme-info) 46%, transparent);
  background: color-mix(in srgb, var(--theme-primary-light) 24%, transparent);
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 9px 12px;
  border-radius: 13px;
  color: var(--theme-text-muted);
  background: var(--theme-overlay-light);
  border: 1px solid var(--theme-overlay-light);
  font-size: var(--app-font-size-caption);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--theme-overlay-medium);
}

.status-bar.online .status-dot {
  background: var(--theme-success);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-success) 16%, transparent);
}

.status-bar.starting .status-dot {
  background: var(--theme-warning);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-warning) 16%, transparent);
}

.status-bar.error .status-dot {
  background: var(--theme-error);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-error) 16%, transparent);
}

.voice-select-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  gap: 10px;
  align-items: center;
}

.voice-select {
  width: 100%;
}

.voice-select .ant-select-selector {
  height: 42px !important;
  display: flex !important;
  align-items: center !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.voice-select .ant-select-selection-item,
.voice-select .ant-select-selection-placeholder {
  line-height: 40px !important;
}

.voice-select .ant-select-selection-search-input {
  height: 40px !important;
}

.preview-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px !important;
}

.preview-btn.ant-btn-primary,
.preview-btn:not(.ant-btn-disabled) {
  color: var(--theme-text-primary) !important;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary)) !important;
  border-color: transparent !important;
  box-shadow: 0 10px 22px color-mix(in srgb, var(--theme-primary) 26%, transparent);
}

.preview-btn.ant-btn-primary:focus,
.preview-btn.ant-btn-primary:hover,
.preview-btn:not(.ant-btn-disabled):focus,
.preview-btn:not(.ant-btn-disabled):hover {
  color: var(--theme-text-primary) !important;
  background: linear-gradient(135deg,
      var(--theme-primary-dark),
      var(--theme-secondary-dark)) !important;
}

.preview-btn.ant-btn-primary .anticon,
.preview-btn:not(.ant-btn-disabled) .anticon {
  color: var(--theme-text-primary) !important;
}

.model-version-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--theme-text-secondary);
  font-size: var(--app-font-size-caption);
  font-weight: 800;
}

.model-version-radio {
  flex-shrink: 0;
}

.model-version-radio .ant-radio-button-wrapper {
  color: var(--theme-text-secondary);
  background: var(--theme-overlay-light);
  border-color: color-mix(in srgb, var(--theme-info) 22%, transparent);
  font-weight: 800;
}

.model-version-radio .ant-radio-button-wrapper-checked {
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border-color: transparent;
}

.more-toggle {
  margin: 15px 0 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  color: var(--theme-text-muted);
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: var(--app-font-size-meta);
  font-weight: 800;
}

.more-toggle:hover {
  color: var(--theme-text-gradient-purple);
}

.toggle-icon {
  transition: transform 0.2s ease;
}

.toggle-icon.open {
  transform: rotate(180deg);
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 12px;
}

.setting-block {
  min-width: 0;
  padding: 13px;
  border-radius: 16px;
  background: var(--theme-overlay-light);
  border: 1px solid var(--theme-overlay-light);
}

.setting-label {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 800;
}

.setting-label b {
  color: var(--theme-text-secondary);
}

.emotion-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 82px;
  gap: 8px;
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
  animation: marquee 10s linear infinite;
}

.result-card {
  height: 280px;
  min-height: 280px;
  max-height: 280px;
  overflow: hidden;
}

.result-card .card-title {
  flex-shrink: 0;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.open-btn,
.save-btn {
  flex-shrink: 0;
  border-radius: 999px !important;
  font-weight: 800;
}

.save-btn {
  color: var(--theme-text-secondary) !important;
  background: color-mix(in srgb, var(--theme-primary-light) 14%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-info) 24%, transparent) !important;
}

.save-btn:hover {
  color: var(--theme-text-primary) !important;
  background: color-mix(in srgb, var(--theme-primary-light) 26%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-info) 46%, transparent) !important;
}

.audio-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.audio-name {
  min-width: 0;
  color: var(--theme-text-secondary);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-size {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  color: var(--theme-text-gradient-purple);
  background: color-mix(in srgb, var(--theme-secondary) 16%, transparent);
  font-size: var(--app-font-size-micro);
  font-weight: 800;
}

.wave-player {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) auto;
  -moz-column-gap: 10px;
  column-gap: 10px;
  align-items: center;
  padding: 12px 12px 8px;
  border-radius: 18px;
  background:
    linear-gradient(90deg,
      color-mix(in srgb, var(--theme-primary) 12%, transparent),
      color-mix(in srgb, var(--theme-secondary) 10%, transparent)),
    var(--theme-overlay-light);
  border: 1px solid color-mix(in srgb, var(--theme-info) 13%, transparent);
  overflow: hidden;
}

.wave-play-btn {
  position: relative;
  z-index: 2;
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 16px;
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  box-shadow: 0 12px 26px color-mix(in srgb, var(--theme-primary) 28%, transparent);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.wave-play-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 32px color-mix(in srgb, var(--theme-primary) 36%, transparent);
}

.wave-play-btn .anticon {
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-page-title);
}

.wave-player .waveform {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 70px;
  overflow: hidden;
}

.wave-player .waveform canvas,
.wave-player .waveform wave {
  max-width: 100% !important;
}

.wave-meta {
  grid-column: 2;
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  color: color-mix(in srgb, var(--theme-text-secondary) 62%, transparent);
  font-size: var(--app-font-size-micro);
  font-weight: 800;
}

.wave-volume {
  display: grid;
  grid-template-columns: 14px minmax(80px, 110px) 28px;
  justify-self: center;
  gap: 6px;
  align-items: center;
}

.wave-time {
  min-width: 34px;
}

.wave-duration {
  justify-self: end;
  text-align: right;
}

.volume-icon {
  color: color-mix(in srgb, var(--theme-text-secondary) 72%, transparent);
  font-size: var(--app-font-size-meta);
}

.volume-slider {
  margin: 0;
}

.wave-volume b {
  color: var(--theme-text-secondary);
  text-align: right;
}

.audio-placeholder {
  flex: 1;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  color: var(--theme-overlay-medium);
  background: var(--theme-overlay-light);
  border: 1px dashed var(--theme-overlay-light);
  text-align: center;
}

.placeholder-icon {
  margin-bottom: 10px;
  color: color-mix(in srgb, var(--theme-info) 48%, transparent);
  font-size: 38px;
}

.audio-placeholder p {
  margin: 0;
  color: var(--theme-text-muted);
  font-weight: 800;
}

.audio-placeholder span {
  margin-top: 6px;
  font-size: var(--app-font-size-caption);
}

.bottom-progress {
  margin-top: 12px;
}

.settings-fade-enter-active,
.settings-fade-leave-active {
  transition: all 0.18s ease;
}

.settings-fade-enter-from,
.settings-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.voice-step .ant-input,
.voice-step .ant-input-number,
.voice-step .ant-input-number-input,
.voice-step .ant-select-selector,
.voice-step .ant-textarea textarea {
  color: var(--theme-text-secondary) !important;
  background: var(--theme-overlay-light) !important;
  border-color: var(--theme-overlay-light) !important;
}

.voice-step .ant-textarea textarea,
.voice-step textarea.ant-input.script-textarea {
  height: 100% !important;
  padding-bottom: 32px !important;
  font-size: var(--app-font-size-body) !important;
  line-height: 1.75 !important;
}

.voice-step .ant-input[readonly],
.voice-step .ant-textarea textarea[readonly] {
  cursor: default;
}

.voice-step .ant-input::-moz-placeholder,
.voice-step .ant-textarea textarea::-moz-placeholder {
  color: var(--theme-text-muted) !important;
}

.voice-step .ant-input::placeholder,
.voice-step .ant-select-selection-placeholder,
.voice-step .ant-textarea textarea::placeholder {
  color: var(--theme-text-muted) !important;
}

.voice-step .ant-input-number-handler-down-inner,
.voice-step .ant-input-number-handler-up-inner,
.voice-step .ant-select-arrow,
.voice-step .ant-select-selection-item {
  color: var(--theme-text-secondary) !important;
}

.voice-step .ant-input-number-handler-wrap {
  background: var(--theme-overlay-light) !important;
  border-left-color: var(--theme-overlay-light) !important;
}

.voice-step .ant-slider-rail {
  background: var(--theme-overlay-light) !important;
}

.voice-step .ant-slider-track {
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary)) !important;
}

.voice-step .ant-slider-handle:after {
  box-shadow: 0 0 0 2px var(--theme-info) !important;
}

.upload-modal-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.upload-modal-head {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--theme-overlay-light);
}

.upload-modal-head h3 {
  margin: 0;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-section-title);
  font-weight: 900;
}

.upload-modal-head p {
  max-width: 360px;
  margin: 0;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-meta);
  text-align: right;
}

.upload-form-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(300px, 0.92fr);
  gap: 16px;
}

.upload-drop-card,
.upload-side-card {
  min-height: 0;
  padding: 16px;
  border-radius: 18px;
  background: var(--theme-overlay-light);
  border: 1px solid var(--theme-overlay-light);
}

.upload-drop-card .ant-upload,
.upload-drop-card .ant-upload-drag {
  height: 100%;
  background: color-mix(in srgb, var(--theme-background) 48%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-info) 22%, transparent) !important;
  border-radius: 16px !important;
}

.upload-drop-card .ant-upload-drag-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-drop-card .ant-upload-btn {
  height: 100%;
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.upload-drop-content {
  padding: 24px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.upload-drop-icon {
  margin-bottom: 16px;
  color: var(--theme-info);
  font-size: 44px;
}

.upload-title {
  margin: 0 0 8px;
  color: var(--theme-text-secondary);
  font-size: var(--app-font-size-card-title);
  font-weight: 900;
}

.upload-hint {
  margin: 0;
  max-width: 420px;
  color: color-mix(in srgb, var(--theme-text-secondary) 52%, transparent);
  line-height: 1.7;
  text-align: center;
}

.upload-side-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.field-label {
  margin: 0 0 8px;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
}

.field-label:not(:first-child) {
  margin-top: 14px;
}

.upload-preview {
  flex: 1;
  min-height: 0;
  margin-top: 14px;
  padding: 12px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--theme-background) 58%, transparent);
  margin-bottom: 10px;
}

.upload-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.upload-preview-head span {
  min-width: 0;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-preview-head b {
  flex-shrink: 0;
  color: var(--theme-text-gradient-purple);
  font-size: var(--app-font-size-caption);
}

.cropper-error,
.cropper-tip,
.cropper-warning {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: var(--app-font-size-caption);
  line-height: 1.5;
}

.cropper-tip {
  color: color-mix(in srgb, var(--theme-text-secondary) 68%, transparent);
  background: color-mix(in srgb, var(--theme-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 16%, transparent);
}

.cropper-warning {
  margin: 10px 0 0;
  color: var(--theme-warning);
  background: color-mix(in srgb, var(--theme-warning) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-warning) 22%, transparent);
}

.cropper-error {
  color: var(--theme-error-light);
  background: color-mix(in srgb, var(--theme-error) 13%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-error-light) 28%, transparent);
}

.upload-preview .audio-cropper {
  color: var(--theme-text-secondary);
}

.upload-preview .waveform-container {
  border-radius: 14px;
  background: var(--theme-overlay-light);
  border: 1px solid color-mix(in srgb, var(--theme-info) 12%, transparent);
  overflow: hidden;
}

.upload-preview .bottom-controls {
  margin-top: 10px;
}

.upload-preview .trial-button {
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border: 0;
}

.upload-submit-btn {
  height: 44px;
  margin-top: auto;
  border: none !important;
  border-radius: 15px !important;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary)) !important;
  font-weight: 900;
}

.voice-upload-modal .ant-modal-content,
.voice-upload-modal .ant-modal-header {
  background: var(--theme-background) !important;
}

.voice-upload-modal .ant-modal-close {
  color: var(--theme-text-secondary) !important;
}

.voice-step .ant-modal-root {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.voice-step .ant-modal-mask {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: color-mix(in srgb, var(--theme-background) 66%, transparent);
  backdrop-filter: blur(8px);
  pointer-events: auto;
}

.voice-step .voice-upload-modal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 24px;
  pointer-events: auto;
}

.voice-step .voice-upload-modal .ant-modal {
  top: auto;
  max-width: none;
  margin: 0;
  padding-bottom: 0;
}

.voice-step .voice-upload-modal .ant-modal-body {
  overflow: hidden;
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }

  to {
    transform: translateX(-100%);
  }
}

.audio-player {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 14px 16px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--theme-background) 58%, transparent);
  border: 1px solid var(--theme-overlay-light);
}
</style>

<style>
.voice-step .ant-input,
.voice-step .ant-input-number,
.voice-step .ant-input-number-input,
.voice-step .ant-select-selector,
.voice-step .ant-textarea textarea {
  color: var(--theme-text-secondary) !important;
  background: var(--theme-overlay-light) !important;
  border-color: var(--theme-overlay-light) !important;
}

.voice-upload-modal .ant-modal-content,
.voice-upload-modal .ant-modal-header {
  background: var(--theme-background) !important;
}
</style>
