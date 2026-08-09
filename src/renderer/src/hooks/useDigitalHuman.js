import { message } from 'ant-design-vue'
import { ref } from 'vue'

/**
 * 数字人
 * @returns
 */
export function useDigitalHuman() {
  const loading = ref(false)
  const avatarOptions = ref([])
  const avatarsLoading = ref(false)
  const selectedAvatar = ref(null)
  const modelVersion = ref('V2')
  const drivingAudio = ref('')
  const generatedVideo = ref('')
  const progressText = ref('')
  const digitalHumanMode = ref('single') // 'single' | 'multi'
  const digitalHumanScenes = ref([]) // [{ avatarId, duration }]
  const draftDigitalHumanScenes = ref([])
  const multiSceneModalOpen = ref(false)
  const audioDuration = ref(0)

  // 加载形象列表
  const loadAvatarList = async () => {
    avatarsLoading.value = true
    try {
      const res = await window.api.digitalHuman.list({ page: null, pageSize: null })
      if (res.success && res.data) {
        avatarOptions.value = res.data.map((item) => ({
          id: item.id,
          value: item.id,
          label: item.name,
          video_path: item.video_path,
          video_url: item.video_url,
          thumbnail_path: item.thumbnail_path || '',
          description: item.description
        }))

        if (!selectedAvatar.value && avatarOptions.value.length) {
          selectedAvatar.value = avatarOptions.value[0].value
        }

        if (avatarOptions.value.length === 0) {
          message.info('暂无可用的数字人模型，请先在数字人管理页面添加模型')
        }
      } else {
        console.error('加载数字人列表失败:', res.error)
      }
    } catch (e) {
      console.error('加载数字人模型失败:', e)
    } finally {
      avatarsLoading.value = false
    }
  }

  // 选择驱动音频（手动选择）
  const selectDrivingAudio = async () => {
    try {
      const result = await window.api.file.selectFile({
        title: '选择驱动音频',
        filters: [{ name: '音频文件', extensions: ['mp3', 'wav', 'm4a', 'aac', 'flac'] }],
        defaultPath: drivingAudio.value || undefined
      })
      if (result.success && !result.data.canceled && result.data.filePaths.length) {
        const path = result.data.filePaths[0]
        // 云端模式校验时长
        const validation = await validateCloudAudioDuration(path)
        if (!validation.valid) {
          message.error(validation.message)
          return { success: false, error: validation.message }
        }
        drivingAudio.value = path
        message.success('驱动音频选择成功')
        return { success: true, data: path }
      }
    } catch (e) {
      message.error('选择音频失败：' + e.message)
    }
    return { success: false }
  }

  // 生成视频（单形象）
  const generateVideo = async (audioPath, avatarId, onProgress, options = {}) => {
    if (!avatarId) {
      message.warning('请选择数字人形象')
      return { success: false, error: '未选择形象' }
    }
    if (!audioPath) {
      message.warning('请选择驱动音频')
      return { success: false, error: '未选择音频' }
    }

    loading.value = true
    onProgress?.('正在准备数字人生成...')

    try {
      const config = await window.api.config.getAll()
      const runMode = config.success ? config.data.general?.runMode : 'local'

      const avatar = avatarOptions.value.find((a) => a.value === avatarId)
      const videoUrl = avatar?.video_url

      let result
      if (runMode === 'cloud') {
        onProgress?.('☁️ 使用云端数字人生成...')
        // 云端生成：需要上传音频和形象视频到云端
        // 简化：使用提供的音频 URL
        const audioUrl = audioPath.startsWith('http')
          ? audioPath
          : await window.api.oss.upload(audioPath, 'temp')

        if (!videoUrl) throw new Error('未获取到云端模板视频URL')
        // 云端生成
        result = await window.api.cloud.digitalHuman.generateVideo(audioUrl, videoUrl, {
          watermark: true,
          digitalAuth: true,
          modelVersion: modelVersion.value
        })

        if (!result.success) throw new Error(result.error || '云端生成失败')
        const data = result.data || {}
        const outPath = data.videoPath || data.data?.videoPath
        if (!outPath) throw new Error('未获取到视频路径')
        return { videoPath: outPath, videoUrl: data.videoUrl || data.data?.videoUrl || '' }
      } else {
        onProgress?.('💻 使用本地数字人生成...')
        let outputDir = config?.paths?.videoOutput
        if (!outputDir) {
          const appRoot = await window.api.file.getAppRoot()
          outputDir = (appRoot.success ? appRoot.data.appRoot : '.') + '/outputs/videos'
          await window.api.file.mkdir(outputDir)
        }

        try {
          // 本地生成
          result = await window.api.python.digitalHuman.generateVideoWithProgress(
            audioPath,
            avatar?.video_path || '',
            {
              watermark: false,
              digitalAuth: false,
              outputDir,
              modelVersion: modelVersion.value
            }
          )

          if (result.success) {
            const data = result.data
            const videoPath = data.video_path || data.data?.video_path || data.outputPath
            if (!videoPath) throw new Error('返回数据中没有找到视频文件路径')
            generatedVideo.value = 'file://' + videoPath

            onProgress?.('数字人生成完成！')
            message.success('数字人生成完成！')
            return { success: true, data: { videoPath, videoUrl: generatedVideo.value } }
          } else {
            throw new Error(result.error || '数字人视频生成失败')
          }
        } catch (e) {
          console.error('数字人生成失败:', e)
          message.error('生成失败：' + e.message)
          onProgress?.('生成失败')
          return { success: false, error: e.message }
        }
      }
    } finally {
      loading.value = false
      progressText.value = ''
    }
  }

  // 多镜头拼接（参考视频）
  const buildMultiAvatarReference = async (scenes, onProgress) => {
    console.log('buildMultiAvatarReference', scenes)
    if (!scenes || scenes.length === 0) {
      message.warning('请至少添加一个镜头')
      return { success: false, error: '无镜头' }
    }
    // 验证每个镜头
    const invalid = scenes.find((s) => !s.avatarId || !s.duration || s.duration <= 0)
    if (invalid) {
      message.warning('请完善第 ' + (scenes.indexOf(invalid) + 1) + ' 个镜头的数字人和时长')
      return { success: false, error: '镜头配置不完整' }
    }
    onProgress?.('正在拼接多镜头参考视频...')
    try {
      const result = await window.api.video.buildMultiAvatarReference({
        scenes: scenes.map((s) => ({
          videoPath: avatarOptions.value.find((a) => a.value === s.avatarId)?.video_path,
          duration: s.duration
        }))
      })
      if (result.success) {
        return { success: true, data: { videoPath: result.data.outputPath } }
      } else {
        throw new Error(result.error || '多镜头拼接失败')
      }
    } catch (e) {
      message.error('多镜头拼接失败：' + e.message)
      return { success: false, error: e.message }
    }
  }

  // 格式化时长
  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return mins + ':' + String(secs).padStart(2, '0')
  }

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
  }

  return {
    loading,
    avatarOptions,
    avatarsLoading,
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
  }
}

/**
 * 检查音频文件是否符合云端时长限制（<= 5分钟）
 */
async function validateCloudAudioDuration(filePath) {
  // 仅对云端模式做校验
  try {
    const config = await window.api.config.getAll()
    const runMode = config?.general?.runMode || 'local'
    if (runMode !== 'cloud') {
      return { valid: true }
    }
    // 检查文件扩展名是否为视频格式（需先提取音频）
    const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(filePath)
    let audioPath = filePath
    if (isVideo) {
      // 先提取音频
      const extractResult = await window.api.audio.extract({ videoPath: filePath })
      if (!extractResult.success) {
        return { valid: false, message: '提取音频失败：' + extractResult.error }
      }
      audioPath = extractResult.data.audioPath
    }
    const duration = await getVideoDuration(audioPath)
    if (duration > 300) {
      // 5分钟 = 300秒
      const mins = Math.floor(duration / 60)
      const secs = Math.floor(duration % 60)
      return {
        valid: false,
        message: `云端模式下驱动音频时长不能超过5分钟（当前约 ${mins}分${secs}秒）`
      }
    }
    return { valid: true }
  } catch (e) {
    console.error('校验音频时长失败:', e)
    return { valid: false, message: '校验音频时长异常：' + e.message }
  }
}

/**
 * 获取视频时长（用于云端校验）
 */
async function getVideoDuration(filePath) {
  try {
    const result = await window.api.video.getInfo(filePath)
    if (result.success && result.data) {
      return Number(result.data.duration) || 0
    }
    return 0
  } catch (e) {
    console.warn('获取视频时长失败:', e)
    return 0
  }
}
