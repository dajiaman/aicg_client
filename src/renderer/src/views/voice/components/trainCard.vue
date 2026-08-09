<template>
  <div class="feature-card training-card">
    <div class="card-header">
      <div class="card-icon training-icon">
        <CloudUploadOutlined />
      </div>
      <div class="card-title">
        <h3>声音训练</h3>
        <p>上传音频样本，训练专属声音模型</p>
      </div>
      <a-button class="help-btn card-help-btn" type="text">
        <QuestionCircleOutlined />
        帮助
      </a-button>
    </div>
    <div class="card-content">
      <a-form layout="vertical">
        <a-form-item class="tab-item">
          <a-tabs v-model:activeKey="trainTab">
            <a-tab-pane tab="上传音频" key="upload">
              <a-upload-dragger :show-upload-list="true" accept="audio/*,video/*" :multiple="false"
                :disabled="extracting" :before-upload="handleBeforeUpload" class="voice-dragger">
                <div class="upload-content">
                  <div class="upload-icon">
                    <InboxOutlined />
                  </div>
                  <div class="upload-text">
                    <p class="upload-title">点击或拖拽音频/视频文件到此区域</p>
                    <p class="upload-hint">
                      支持 MP3、WAV、M4A、MP4、MOV 等格式，视频会自动提取音频
                      <br />
                      建议时长 5-30 秒，文件大小不超过 50MB
                    </p>
                  </div>
                </div>
              </a-upload-dragger>
            </a-tab-pane>
            <a-tab-pane tab="直接录音" key="record">
              <div class="recording-section">
                <div class="recording-container">
                  <!-- 时间显示 -->
                  <div class="timer-display" :class="{
                    active: recording
                  }">
                    {{ fmtRecordTime(recordedDuration) }}
                  </div>

                  <div class="record-btn-wrapper">
                    <button class="record-circle-btn" :class="{
                      recording: recording
                    }" @click="toggleRecord">
                      <div class="btn-inner">
                        <div class="stop-icon" v-if="recording"></div>
                        <AudioOutlined class="mic-icon" v-if="!recording" />
                      </div>
                      <div class="ripple-effect" v-if="recording"></div>
                    </button>
                  </div>

                  <div class="recording-hint">
                    {{ recoding ? '正在录音' : '点击开始录音' }}
                  </div>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
        </a-form-item>

        <!-- 公共：音频预览与裁剪（上传选完文件 / 录音转 wav 后共用同一组件） -->
        <div v-if="cropAudioUrl && !extracting" class="audio-editor-section" style="margin-bottom: 24px">
          <div class="section-title" style="font-weight: 500; margin-bottom: 8px; color: rgb(240, 240, 240)">
            音频预览与裁剪
          </div>
          <div style="
              padding: 10px 12px;
              background: rgba(52, 87, 254, 0.15);
              border: 1px solid rgba(52, 87, 254, 0.3);
              border-radius: 4px;
              margin-bottom: 12px;
              font-size: var(--app-font-size-meta);
              color: rgb(147, 197, 253);
            ">
            <span>💡 </span>
            <span>建议音频时长为 5-30 秒。如超过 30 秒，默认选择前 30
              秒，您可以拖拽选区调整裁剪范围。</span>
          </div>
          <AudioCropper :key="`cropper-${trainTab}`" :audio-url="cropAudioUrl" :min-duration="5" :max-duration="30"
            @update:selection="handleSelectionUpdate" @loaded="handleAudioLoaded" @error="handleAudioError" />
        </div>

        <a-form-item label="声音名称" class="input-item">
          <a-input size="large" v-model:value="addForm.name" placeholder="为这个声音起个名字" show-count :maxlength="10" />
          <div class="form-hint" style="
              margin-top: 4px;
              font-size: var(--app-font-size-caption);
              color: rgb(156, 163, 175);
            ">
            起个名字方便记忆（10个字以内），例如：我的声音
          </div>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" size="large" class="action-button" block @click="startTrain" :disabled="!canTrain"
            :loading="training">
            <PlayCircleOutlined />
            开始训练
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { message } from 'ant-design-vue'
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import AudioCropper from '../../../components/AudioCropper.vue'
import { pathJoin } from '../../../utils'

import {
  AudioOutlined,
  CloudUploadOutlined,
  InboxOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons-vue'

const emit = defineEmits(['create-success'])

// 视频文件扩展名（用于判断上传的是视频，需自动提取音频）
const VIDEO_EXTS = [
  'mp4',
  'mov',
  'mkv',
  'avi',
  'webm',
  'flv',
  'wmv',
  'm4v',
  'ts',
  'mts',
  'm2ts',
  '3gp',
  'rmvb'
]

// 训练表单
const addForm = reactive({
  name: '',
  description: '',
  audio_path: '',
  audio_url: '',
  file_size: 0,
  audio_duration: 0
})

// 提取文案中
const extracting = ref(false)
// 上传/预览
const fileName = ref('')
const previewSrc = ref('')
const training = ref(false)

// 录音相关
const recording = ref(false)
const recordedBlob = ref(null)
const recordedUrl = ref('')
const recordedDuration = ref(0)
const recordStartAt = ref(0)
let mediaRecorder = null
let chunks = []
let recordTimer = null

const cropAudioUrl = ref('')
// 用于裁剪的源音频路径（视频已提取出的 wav / 原始音频文件路径）
const sourceAudioPath = ref('')
// 裁剪选区
const selectedRegion = ref(null)
const isValidRegion = ref(false)
const audioDuration = ref(0)

const handleAudioLoaded = (info) => {
  audioDuration.value = info.duration || 0
}

const handleAudioError = (err) => {
  message.error('音频加载失败：' + (err?.message || '未知错误'))
}

/**
 * 裁剪选区更新
 */
const handleSelectionUpdate = (selection) => {
  selectedRegion.value = selection
  if (selection) {
    isValidRegion.value =
      selection.end - selection.start >= 5 && selection.end - selection.start <= 30
  } else {
    isValidRegion.value = false
  }
}

/**
 * 静默识别：调用本地 ASR 识别音频内容
 */
async function recognizeAudio(audioPath) {
  if (!audioPath) {
    return { success: false }
  }
  const config = await window.api.config.getAll()
  const runMode = config.success ? config.data.general?.runMode : 'local'

  if (runMode == 'local') {
    return await window.api.python.asr.recognize(audioPath)
  } else {
  }
}

/**
 * 是否是视频文件
 * @param file
 */
function isVideoFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  return VIDEO_EXTS.includes(ext) || (file.type || '').startsWith('video/')
}

// 填充已选文件路径
function setAudioPath(p) {
  addForm.audio_path = p
  addForm.audio_url = ''
  fileName.value = p.split(/[\\/]/).pop()
  previewSrc.value = 'file://' + p
}

// a-upload-dragger 选择/拖拽回调：读取 Electron 文件真实路径，阻止自动上传
// 视频文件会先自动提取音频（wav），提取结果作为训练素材；选择后显示 AudioCropper 裁剪片段
async function handleBeforeUpload(file) {
  const p = window.api.getPathForFile(file)
  addForm.file_size = file.size
  if (!p) {
    message.warning('无法读取文件路径，请重试')
    return false
  }

  // 取上传文件名称（去扩展名）作为声音名称，为空时才填充
  if (!addForm.name) {
    addForm.name = file.name.replace(/\.[^.]+$/, '').slice(0, 10)
  }

  // 视频：提取音频后再设置表单
  if (isVideoFile(file)) {
    extracting.value = true
    try {
      const dotIdx = p.lastIndexOf('.')
      const outputPath = (dotIdx > 0 ? p.slice(0, dotIdx) : p) + '_audio.wav'
      const res = await window.api.video.extractAudio({ videoPath: p, outputPath })
      if (!res?.success) throw new Error(res?.error || '音频提取失败')
      const audioPath = res.data?.audioPath || outputPath
      setAudioPath(audioPath)
      sourceAudioPath.value = audioPath
      cropAudioUrl.value = await pathToBlobUrl(audioPath)
      message.success('已从视频提取音频，请裁剪 5-30 秒片段')
    } catch (e) {
      message.error('视频提取音频失败：' + (e.message || e))
    } finally {
      extracting.value = false
    }
    return false
  }

  // 音频：直接使用
  setAudioPath(p)
  sourceAudioPath.value = p
  if (cropAudioUrl.value && cropAudioUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(cropAudioUrl.value)
  }
  cropAudioUrl.value = URL.createObjectURL(file)
  return false
}

// 从本地路径读取音频为 blob URL（wavesurfer 的 fetch 加载不了 file:// 协议）
async function pathToBlobUrl(audioPath) {
  const readRes = await window.api.file.readBuffer(audioPath)
  if (readRes?.success && readRes.data) {
    return URL.createObjectURL(new Blob([readRes.data], { type: 'audio/wav' }))
  }
  return 'file://' + audioPath.split(/[\\/]/).join('/')
}

/**
 * 开始训练
 */
async function startTrain() {
  if (!addForm.name.trim()) {
    message.warning('请填写声音名称')
    return
  }
  if (trainTab.value === 'upload') {
    if (!addForm.audio_path) {
      message.warning('请上传音频文件')
      return
    }
    if (!isValidRegion.value || !selectedRegion.value) {
      message.warning('请选择 5-30 秒的音频区域')
      return
    }
  }
  if (trainTab.value === 'record' && !recordedBlob.value) {
    message.warning('请先录制一段音频')
    return
  }
  training.value = true
  try {
    // 名称去重
    const exist = await window.api.voice.findByName(addForm.name.trim())
    if (exist.success && exist.data) {
      message.error('声音名称已存在')
      return
    }

    // 录音模式：toggleRecord 已把 blob 写入 voice_samples 并转 wav，
    // addForm.audio_path 在 onstop 中维护为 wav 路径
    if (trainTab.value === 'record' && !addForm.audio_path) {
      throw new Error('请等待录音处理完成')
    }

    // 按选区裁剪 5-30 秒片段作为训练样本
    //   - 上传模式：sourceAudioPath = 已选择文件（或视频提取的 wav）
    //   - 录音模式：sourceAudioPath = 录音转好的 wav
    let trainAudioPath = ''
    if (selectedRegion.value && isValidRegion.value) {
      const sourcePath = trainTab.value === 'upload' ? sourceAudioPath.value : addForm.audio_path
      if (!sourcePath) throw new Error('请先上传音频或完成录音')
      const { start, end } = selectedRegion.value
      const duration = end - start
      if (duration < 5 || duration > 30) {
        throw new Error('裁剪区域时长必须在 5 ~ 30 秒之间')
      }
      const dataDir = await ensureVoiceDataDir()
      trainAudioPath = pathJoin(dataDir, `voice_sample_${Date.now()}.wav`)
      const trimRes = await window.api.audio.trim(sourcePath, trainAudioPath, start, duration)
      console.log('trimRes:', trimRes)
      if (!trimRes.success) throw new Error(trimRes.error || '音频裁剪失败')
      addForm.audio_duration = duration
    } else if (trainTab.value === 'upload') {
      // 上传模式未裁剪：不通过
      throw new Error('请先选择 5-30 秒的音频区域')
    } else {
      // 录音模式未裁剪：直接保存整段 wav（要求总时长 5-30 秒）
      if (recordedDuration.value < 5 || recordedDuration.value > 30) {
        throw new Error('录音时长需在 5-30 秒之间，请重新录制或拖拽选区裁剪')
      }
      trainAudioPath = addForm.audio_path
      addForm.audio_duration = recordedDuration.value
    }

    // 通过 asr 去识别音频内容，自动写入 description（失败不影响保存）
    if (trainAudioPath) {
      const asrResult = await recognizeAudio(trainAudioPath)
      if (asrResult.success) {
        addForm.description = asrResult.data.data?.processed_text || ''
      }
    }

    // 录音仅作为试听，可通过后续编辑流程替换为本地音频文件
    const res = await window.api.voice.create({
      name: addForm.name.trim(),
      description: addForm.description.trim(),
      audio_path: trainAudioPath,
      audio_url: null,
      file_size: addForm.file_size,
      audio_duration: addForm.audio_duration
    })

    if (!res.success) throw new Error(res.error || '保存失败')

    message.success(`声音「${res.data.name}」保存成功`)

    emit('create-success')

    addForm.name = ''
    addForm.description = ''
    addForm.audio_duration = 0
    clearAudio()
    if (recordedUrl.value) URL.revokeObjectURL(recordedUrl.value)
    recordedBlob.value = null
    recordedUrl.value = ''
  } catch (e) {
    message.error(e.message || '保存失败')
  } finally {
    training.value = false
  }
}

/**
 * 切换录音
 */
async function toggleRecord() {
  if (recording.value) {
    mediaRecorder?.stop()
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    chunks = []
    recordedDuration.value = 0
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.onstop = async () => {
      stopRecordTimer()
      const dur = (Date.now() - recordStartAt.value) / 1000
      recordedDuration.value = dur
      stream.getTracks().forEach((t) => t.stop())
      recording.value = false

      const blob = new Blob(chunks, { type: 'audio/webm' })
      recordedBlob.value = blob
      // 把录音 Blob 关联到表单
      fileName.value = '录音 ' + new Date().toLocaleTimeString()
      previewSrc.value = URL.createObjectURL(blob)

      try {
        // 1) webm → 临时文件（write-buffer）
        const dataDir = await ensureVoiceDataDir()
        const ts = Date.now()
        const webmPath = pathJoin(dataDir, `temp_record_${ts}.webm`)
        const wavPath = pathJoin(dataDir, `record_${ts}.wav`)
        const buffer = await blob.arrayBuffer()
        const writeRes = await window.api.file.writeBuffer(webmPath, new Uint8Array(buffer))
        if (!writeRes?.success) throw new Error(writeRes?.error || '写入录音临时文件失败')
        addForm.file_size = buffer.byteLength

        // 2) audio.convert 转 wav
        const convertRes = await window.api.audio.convert(webmPath, wavPath)
        console.log('转换结果：', convertRes)
        if (!convertRes?.success) throw new Error(convertRes?.error || '录音格式转换失败')

        // 3) 删除 webm 临时文件
        try {
          await window.api.file.delete(webmPath)
        } catch (e) {
          console.warn('删除 webm 临时文件失败：', e)
        }

        // 4) read-buffer 读取 wav，生成 blob URL 给 AudioCropper
        const readRes = await window.api.file.readBuffer(wavPath)
        if (readRes?.success && readRes.data) {
          const wavBlob = new Blob([readRes.data], { type: 'audio/wav' })
          if (recordedUrl.value) URL.revokeObjectURL(recordedUrl.value)
          recordedUrl.value = URL.createObjectURL(wavBlob)
          cropAudioUrl.value = recordedUrl.value
          addForm.audio_path = wavPath
          message.success('录音已转换为 wav，可裁剪片段')
        } else {
          throw new Error(readRes?.error || '读取 wav 失败')
        }
      } catch (e) {
        message.error('录音处理失败：' + (e.message || e))
      }
    }
    mediaRecorder.start()
    recording.value = true
    recordStartAt.value = Date.now()
    recordTimer = setInterval(() => {
      recordedDuration.value = (Date.now() - recordStartAt.value) / 1000
    }, 200)
  } catch (e) {
    message.error('无法访问麦克风：' + e.message)
  }
}

/**
 * 清除表单，充值数据
 */
function clearAudio() {
  addForm.audio_path = ''
  addForm.audio_url = ''
  fileName.value = ''
  previewSrc.value = ''
  if (cropAudioUrl.value && cropAudioUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(cropAudioUrl.value)
  }
  cropAudioUrl.value = ''
  sourceAudioPath.value = ''
  selectedRegion.value = null
  isValidRegion.value = false
  audioDuration.value = 0
}

/**
 * 是否可以提交
 */
const canTrain = computed(() => {
  if (!addForm.name.trim()) return false
  if (trainTab.value === 'upload') {
    return addForm.audio_path && isValidRegion.value
  }
  // 录音模式：要么选区有效（裁剪后保存），要么总时长在 5-30 秒之间（整段保存）
  if (!recordedBlob.value || recording.value) return false
  if (isValidRegion.value) return true
  return recordedDuration.value >= 5 && recordedDuration.value <= 30
})

// 获取音频临时输出目录（voice_samples）
async function ensureVoiceDataDir() {
  const res = await window.api.file.getDataPath()
  if (!res.success) throw new Error(res.error || '获取数据目录失败')
  const dir = pathJoin(res.data.dataDir, 'voice_samples')
  const exists = await window.api.file.exists(dir)
  if (!exists.success || !exists.data?.exists) {
    const mk = await window.api.file.mkdir(dir)
    if (!mk.success) throw new Error(mk.error || '创建声音目录失败')
  }
  return dir
}

// ---- 录音 ----
function fmtRecordTime(seconds) {
  const total = Math.max(0, Math.floor(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function stopRecordTimer() {
  if (recordTimer) {
    clearInterval(recordTimer)
    recordTimer = null
  }
}

// 当前 Tab：upload | record
const trainTab = ref('upload')
watch(trainTab, (v) => {
  // 切换 Tab 时清理另一种模式的临时状态，避免 URL 串台
  if (v === 'record') {
    if (cropAudioUrl.value && cropAudioUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(cropAudioUrl.value)
    }
    if (previewSrc.value && previewSrc.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewSrc.value)
    }
    cropAudioUrl.value = ''
    previewSrc.value = ''
    selectedRegion.value = null
    isValidRegion.value = false
  } else if (v === 'upload') {
    if (recordedUrl.value) URL.revokeObjectURL(recordedUrl.value)
    if (previewSrc.value && previewSrc.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewSrc.value)
    }
    recordedBlob.value = null
    recordedUrl.value = ''
    previewSrc.value = ''
    recordedDuration.value = 0
    if (recording.value) {
      mediaRecorder?.stop()
    }
  }
})

onUnmounted(() => {
  stopRecordTimer()
  if (recordedUrl.value) URL.revokeObjectURL(recordedUrl.value)
  if (cropAudioUrl.value && cropAudioUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(cropAudioUrl.value)
  }
})
</script>

<style lang="scss" scoped>
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
