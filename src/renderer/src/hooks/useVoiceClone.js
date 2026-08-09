import { message } from 'ant-design-vue'
import { reactive, ref } from 'vue'
import { pathJoin } from '../utils'
import dayjs from 'dayjs'

/**
 * 声音克隆
 */
export function useVoiceClone() {
  const loading = ref(false)
  const voiceList = ref([]) // 声音模型列表
  const voicesLoading = ref(false) // 声音模型列表加载状态
  const selectedVoiceId = ref(null) // 选中的声音模型 ID

  const voiceSpeed = ref(1.0) // 声音播放速度
  // slow 模型 只支持中英文
  // slow high_performance false
  const voiceModelVersion = ref('v1') // 声音模型版本

  const voiceTargetLanguage = ref('zh')
  const emotionLabels = {
    none: '正常',
    happy: '高兴',
    anger: '愤怒',
    sad: '悲伤',
    fear: '害怕',
    disgust: '厌恶',
    low: '忧郁',
    surprise: '惊讶',
    neutral: '平静'
  }
  // emotion 权重设置 -> 向量
  const emotions = reactive({
    happy: 0,
    anger: 0,
    sad: 0,
    fear: 0,
    disgust: 0,
    low: 0,
    surprise: 0,
    neutral: 0
  })
  const emotionWeight = ref(0)
  const selectedEmotionType = ref('none')

  // 生成的声音路径
  const clonedAudio = ref('')
  const clonedAudioName = ref('')
  const clonedAudioSize = ref('')
  const clonedAudioUrl = ref('')

  const progressText = ref('')

  /**
   * 加载声音模型列表
   */
  const loadVoiceList = async () => {
    voicesLoading.value = true
    try {
      // 加载声音列表
      const res = await window.api.voice.list({ page: null, pageSize: null })
      if (res.success && res.data) {
        voiceList.value = res.data.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          prompt_text: item.prompt_text || item.description,
          audio_path: item.audio_path,
          audio_url: item.audio_url,
          created_at: item.created_at
        }))
        if (!selectedVoiceId.value && voiceList.value.length) {
          selectedVoiceId.value = voiceList.value[0].id
        }
        if (voiceList.value.length === 0) {
          message.info('暂无可用的声音模型，请先训练声音模型')
        }
      } else {
        console.error('加载声音列表失败:', res.error)
        message.warning('加载声音列表失败')
      }
    } catch (e) {
      console.error('加载声音列表失败:', e)
      message.error('加载声音列表失败：' + e.message)
    } finally {
      voicesLoading.value = false
    }
  }

  /**
   * 克隆声音
   */
  const cloneVoice = async (text, voiceId = selectedVoiceId.value, onProgress, options = {}) => {
    if (!voiceId) {
      message.warning('请选择声音模型')
      return { success: false, error: '未选择声音模型' }
    }

    if (!text || !text.trim()) {
      message.warning('请输入要克隆的文本')
      return { success: false, error: '文本为空' }
    }

    loading.value = true
    clonedAudio.value = ''
    clonedAudioName.value = ''
    clonedAudioSize.value = ''
    clonedAudioUrl.value = ''

    try {
      onProgress?.('正在准备声音克隆...')

      // 获取选中的声音
      const voice = voiceList.value.find((v) => v.id === voiceId)
      if (!voice) throw new Error('未找到选中的声音模型')

      // 模型版本（默认 v1）
      const modelVersion = options.voiceModelVersion || 'v1'

      // 构建情绪向量
      const emotionVector = [
        emotions.happy,
        emotions.anger,
        emotions.sad,
        emotions.fear,
        emotions.disgust,
        emotions.low,
        emotions.surprise,
        emotions.neutral
      ]

      // 判断运行模式
      const config = await window.api.config.getAll()
      const runMode = config.success ? config.data.general?.runMode : 'local'
      const voiceCloneConfig = config.success ? config.data.voiceClone : {}

      let result
      if (runMode === 'cloud') {
        onProgress?.('☁️ 使用云端声音克隆 (V2)...')
        console.log('[VoiceClone] 云端克隆参数:', {
          text: text.trim(),
          audioUrl: voice.audio_url,
          speed: voiceSpeed.value,
          emotionWeight: emotionWeight.value,
          emotionVector,
          modelVersion
        })

        if (!voice.audio_url) {
          throw new Error('该声音模型没有云端URL，请重新训练或上传')
        }

        // 构建云端请求参数
        const cloudParams = {
          speed: voiceSpeed.value,
          emotion_alpha: emotionWeight.value,
          emotion_vector: emotionVector,
          // 根据模型版本调整参数
          ...(modelVersion === 'v2' ? { model: 'fast' } : {})
        }

        result = await window.api.cloud.voiceClone.textToSpeechV2(
          text.trim(),
          voice.audio_url,
          cloudParams
        )

        console.log('[VoiceClone] 云端克隆结果:', result)

        if (!result.success) {
          throw new Error(result.error || '云端声音克隆失败')
        }
      } else {
        onProgress?.('正在合成音频')
        // 本地模式调用 Python 服务
        let outputDir = config.success ? config.data.paths?.audioOutput : ''
        if (!outputDir) {
          const appRoot = await window.api.file.getAppRoot()
          outputDir = pathJoin(appRoot.success ? appRoot.data.appRoot : '.', 'outputs/audios')
          await window.api.file.mkdir(outputDir)
        }

        const outputPath = outputDir

        console.log('开始声音克隆:', {
          audioPath: voice.audio_path,
          emotionRefAudio: undefined,
          emotionText: voice.prompt_text,
          emotionWeight: emotionWeight.value,
          emotions: emotionVector,
          speed: voiceSpeed.value,
          text: text.trim(),
          voiceId: voice.id,
          voiceModelVersion: modelVersion,
          voiceName: voice.name
        })

        const mode = 'slow'

        // 调用 Python 服务进行语音克隆
        result = await window.api.python.voiceClone.textToSpeechWithProgressV2(
          mode,
          text.trim(),
          voice.prompt_text,
          voice.audio_path,
          outputPath,
          voiceSpeed.value,
          emotionVector,
          emotionWeight.value,
          null,
          null,
          false
        )

        console.log('[VoiceClone] 本地克隆结果:', result)

        if (result.success) {
          const data = result.data
          const audioPath = data.data.output_path || data.data?.output_path || ''
          if (!audioPath) throw new Error('未获取到音频文件路径')

          clonedAudio.value = audioPath
          // 从路径中提取文件名，去掉扩展名
          clonedAudioName.value = `克隆声音_${voice.name}_${dayjs().format('YYYY/MM/DD HHmmss')}`

          const size = data.data.file_size || data.data?.file_size || 0
          clonedAudioSize.value = formatFileSize(size)
          clonedAudioUrl.value = 'file:///' + audioPath.replace(/\\/g, '/')

          onProgress?.('声音克隆成功！')
          message.success('声音克隆成功！')

          return {
            success: true,
            data: {
              audioPath,
              audioName: clonedAudioName.value,
              audioSize: clonedAudioSize.value,
              audioUrl: clonedAudioUrl.value
            }
          }
        } else {
          throw new Error(result.error || '声音克隆失败')
        }
      }
    } catch (e) {
      console.error('声音克隆失败:', e)
      message.error('声音克隆失败：' + e.message)
      onProgress?.('克隆失败')
      return { success: false, error: e.message }
    } finally {
      loading.value = false
      progressText.value = ''
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
  }

  // 格式化时间
  const formatTime = (seconds) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return mins + ':' + String(secs).padStart(2, '0')
  }

  // 加载情绪参考音频
  const loadEmotionRefAudios = async () => {
    // 预置情绪音频路径
    const emotions = [
      { name: '高兴', filename: 'happy.wav' },
      { name: '生气', filename: 'angry.wav' },
      { name: '伤心', filename: 'sad.wav' },
      { name: '害怕', filename: 'fear.wav' },
      { name: '嫌弃', filename: 'disgust.wav' },
      { name: '平静', filename: 'neutral.wav' }
    ]
    // 这里可以从本地资源目录加载，简化为返回预设路径
    return emotions
  }

  return {
    loading,
    voiceList,
    voicesLoading,
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
    formatFileSize,
    formatTime,
    loadEmotionRefAudios
  }
}
