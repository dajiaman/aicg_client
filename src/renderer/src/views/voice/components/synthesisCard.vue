<template>
  <div class="feature-card synthesis-card">
    <div class="card-header">
      <div class="card-icon synthesis-icon">
        <AudioOutlined />
      </div>
      <div class="card-title">
        <h3>声音合成</h3>
        <p>选择声音模型，生成个性化语音</p>
      </div>
      <a-button class="help-btn card-help-btn" type="text">
        <QuestionCircleOutlined />
        帮助
      </a-button>
    </div>
    <div class="card-content">
      <a-form layout="vertical">
        <a-form-item label="选择声音模型" class="select-item">
          <div class="voice-select-container">
            <a-select
              class="select-voice-model"
              size="large"
              v-model:value="selectedVoiceId"
              placeholder="请选择声音模型"
              popup-class-name="dark-dropdown"
            >
              <a-select-option v-for="v in voiceList" :key="v.id" :value="v.id">{{
                v.name
              }}</a-select-option>
            </a-select>
            <span
              class="preview-btn"
              shape="circle"
              :disabled="!selectedVoiceId"
              @click="toggleVoicePreview"
            >
              <PlayCircleOutlined v-if="!samplePlaying" style="font-size: 20px" />
              <PauseCircleOutlined v-else style="font-size: 20px" />
            </span>
          </div>
        </a-form-item>

        <a-form-item label="输入文本" class="textarea-item">
          <a-textarea
            size="large"
            v-model:value="text"
            :rows="4"
            :maxlength="5000"
            show-count
            placeholder="输入要合成的文本..."
          />
        </a-form-item>

        <div class="inline-settings">
          <a-form-item label="语速">
            <a-slider
              v-model:value="voiceSpeed"
              :min="0.5"
              :max="1.5"
              :step="0.05"
              :tooltip-open="false"
            />
          </a-form-item>

          <a-form-item label="情绪类型">
            <div class="flex items-center">
              <a-select
                v-model:value="selectedEmotionType"
                placeholder="选择情绪（可选）"
                popup-class-name="dark-dropdown"
                allow-clear
                mode="single"
              >
                <a-select-option :value="key" v-for="(label, key) in emotionLabels" :key="key">{{
                  label
                }}</a-select-option>
              </a-select>
              <a-input-number
                v-model:value="emotionWeight"
                :min="0"
                :max="1"
                :step="0.1"
                style="width: 80px"
              />
            </div>
          </a-form-item>
        </div>

        <a-form-item>
          <a-button
            block
            type="primary"
            size="large"
            class="action-button synthesis-button"
            @click="cloneVoice"
            :disabled="loading"
            :loading="loading"
          >
            <SoundOutlined />
            生成语音
          </a-button>
        </a-form-item>
      </a-form>

      <div class="audio-preview" v-if="clonedAudioUrl">
        <audio :src="clonedAudioUrl" controls preload="metadata"></audio>
        <span style="margin-top: 10px">{{ clonedAudioName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  AudioOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  SoundOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { onMounted, ref, reactive, onUnmounted } from 'vue'

const selectedVoiceId = ref('')
const voiceList = ref([])
const clonedAudioUrl = ref('')
const clonedAudioName = ref('')
const voiceSpeed = ref(1)
const loading = ref(false)

const text = ref('你好，这是一个声音克隆测试。')
const selectedEmotionType = ref(undefined)
const emotionWeight = ref(0)
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

const samplePlaying = ref(false)

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

/**
 * 加载声音模型列表
 */
const loadVoiceList = async () => {
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
  }
}

let previewAudio = null

/**
 * 试听声音（按钮即播放器，独立于合成结果）
 * 参考 VoiceGenerate.vue 的 toggleVoicePreview 模式：new Audio(url) + onended/onerror
 */
function toggleVoicePreview() {
  if (samplePlaying.value) {
    samplePlaying.value = false
    if (previewAudio) {
      try {
        previewAudio.pause()
        previewAudio.currentTime = 0
        previewAudio.onerror = null
        previewAudio.src = ''
      } catch {
        /* noop */
      }
      previewAudio = null
    }
    return
  }
  const voice = voiceList.value.find((v) => v.id === selectedVoiceId.value)
  if (!voice) {
    message.warning('该声音没有预览音频')
    return
  }
  const audioUrl2 = voice.audio_url || audioUrlOf(voice)
  if (!audioUrl2) {
    message.warning('该声音没有预览音频')
    return
  }
  samplePlaying.value = true
  const audio = new Audio(audioUrl2)
  audio.onended = () => {
    samplePlaying.value = false
  }
  audio.onerror = () => {
    samplePlaying.value = false
    message.error('播放预览失败')
  }
  audio.play().catch(() => {
    samplePlaying.value = false
    message.error('播放预览失败')
  })
  previewAudio = audio
}

// 音频预览 URL：本地路径转 file://，云端直接返回
function audioUrlOf(a) {
  if (a?.audio_url) return a.audio_url
  if (!a?.audio_path) return ''
  return `file://${a.audio_path.replace(/\\/g, '/')}`
}

/**
 * 克隆声音
 */
const cloneVoice = async () => {
  if (!selectedVoiceId.value) {
    message.warning('请选择声音模型')
    return
  }

  if (!text.value.trim()) {
    message.warning('请输入要克隆的文本')
    return
  }

  // 获取选中的声音
  const voice = voiceList.value.find((v) => v.id === selectedVoiceId.value)
  if (!voice) {
    message.error('未选中声音模型')
    return
  }

  loading.value = true

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

  clonedAudioUrl.value = ''
  clonedAudioName.value = ''

  const config = await window.api.config.getAll()
  let outputDir = config.success ? config.data.paths?.audioOutput : ''
  if (!outputDir) {
    const appRoot = await window.api.file.getAppRoot()
    outputDir = pathJoin(appRoot.success ? appRoot.data.appRoot : '.', 'outputs/audios')
    await window.api.file.mkdir(outputDir)
  }

  try {
    const outputPath = outputDir

    // 调用 Python 服务进行语音克隆
    const result = await window.api.python.voiceClone.textToSpeechWithProgressV2(
      'V2',
      text.value.trim(),
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

    if (result.success) {
      const data = result.data
      const audioPath = data.data.output_path || data.data?.output_path || ''
      clonedAudioUrl.value = 'file:///' + audioPath.replace(/\\/g, '/')
      // 从路径中提取文件名，去掉扩展名
      clonedAudioName.value = `克隆声音_${voice.name}_${dayjs().format('YYYY/MM/DD HHmmss')}`
    } else {
      message.error('声音生成失败')
    }
  } catch (err) {
    console.log('生成失败：', err)
    message.error('声音生成失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadVoiceList()
})

onUnmounted(() => {
  // 样本试听
  if (previewAudio) {
    try {
      previewAudio.pause()
      previewAudio.src = ''
    } catch {
      /* noop */
    }
    previewAudio = null
  }
})

defineExpose({
  loadVoices: () => {
    loadVoiceList()
  }
})
</script>

<style lang="scss" scoped>
.audio-preview {
  background-color: #1a1d29;
  min-height: 50px;
  padding: 20px;
  display: flex;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.help-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--theme-text-gradient-purple);
  font-size: var(--app-font-size-body);
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.3s;
  border: none;
}

.help-btn:hover {
  background: var(--theme-overlay-purple-stronger);
  color: var(--theme-secondary);
}
</style>
