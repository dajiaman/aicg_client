<script setup>
import { message } from 'ant-design-vue'
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import draggable from 'vuedraggable'

import {
  AudioOutlined,
  CaretRightOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  PauseCircleOutlined,
  PauseOutlined,
  PlayCircleFilled,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SoundOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import TrainCard from './components/trainCard.vue'
import SynthesisCard from './components/synthesisCard.vue'
import { formatSize } from '../../utils/index.js'

const voices = ref([])

const synthesisCardRef = ref(null)

// 编辑表单
const editForm = reactive({
  id: null,
  name: '',
  description: '',
  audio_path: '',
  audio_url: '',
  file_size: 0
})

/**
 * 加载声音列表
 */
async function loadVoices() {
  try {
    const res = await window.api.voice.list()
    if (!res.success) throw new Error(res.error || '加载失败')
    voices.value = res.data || []
  } catch (e) {
    message.error(e.message || '加载失败')
  }
}

// ---- 删除 ----
async function removeVoice(v) {
  try {
    const res = await window.api.voice.delete(v.id)
    if (!res.success) throw new Error(res.error || '删除失败')
    message.success('已删除')
    await loadVoices()
  } catch (e) {
    message.error(e.message || '删除失败')
  }
}

// ---- 编辑声音 ----
const saving = ref(false)
const editModalOpen = ref(false)

function openEdit(v) {
  editForm.id = v.id
  editForm.name = v.name
  editForm.description = v.description || ''
  editForm.audio_path = v.audio_path || ''
  editForm.audio_url = v.audio_url || ''

  editModalOpen.value = true
}

// ---- 播放/暂停音频 ----
const playingId = ref(null) // 当前正在播放的声音 id
let audioEl = null // 共享一个 <audio> 实例，避免每个卡片都创建

/**
 * 取音频可播放 URL
 * 优先级 audio_url > file://audio_path
 */
function audioUrlOf(v) {
  if (!v) return ''
  if (v.audio_url) return v.audio_url
  if (v.audio_path) return `file://${v.audio_path.replace(/\\/g, '/')}`
  return ''
}

function ensureAudio() {
  if (!audioEl) {
    audioEl = new Audio()
    audioEl.addEventListener('ended', () => {
      playingId.value = null
    })
    audioEl.addEventListener('error', () => {
      message.error('播放失败：文件不存在或格式不支持')
      playingId.value = null
    })
  }
  return audioEl
}

/**
 * 切换播放：同一声音再点则暂停；点别的声音则切到它
 */
async function toggleVoicePlay(v) {
  const url = audioUrlOf(v)
  if (!url) {
    message.warning('该声音没有可播放的音频文件')
    return
  }
  const audio = ensureAudio()

  // 同一个声音已经在播 → 暂停
  if (playingId.value === v.id) {
    audio.pause()
    playingId.value = null
    return
  }

  // 切换到新声音：先停旧
  if (!audio.paused) {
    audio.pause()
  }

  audio.src = url
  playingId.value = v.id
  try {
    await audio.play()
  } catch (e) {
    message.error('播放失败：' + (e?.message || '未知错误'))
    playingId.value = null
  }
}

onMounted(() => {
  // 初始化 voice_models 表
  window.api.voice.init()

  // 声音库加载
  loadVoices()
})

onUnmounted(() => {
  if (audioEl) {
    audioEl.pause()
    audioEl.src = ''
    audioEl = null
  }
})

/**
 * 保存编辑
 */
async function saveEdit() {
  if (!editForm.name.trim()) {
    message.warning('请填写声音名称')
    return
  }
  saving.value = true
  try {
    const res = await window.api.voice.update(editForm.id, {
      name: editForm.name.trim(),
      description: editForm.description.trim()
    })

    if (!res.success) throw new Error(res.error || '保存失败')
    message.success('已保存')
    editModalOpen.value = false
    await loadVoices()
    synthesisCardRef.value.loadVoices()
  } catch (e) {
    message.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

/**
 * 处理拖动结束
 */
const handleDragEnd = async (e) => {
  const oldIndex = e.oldIndex
  const newIndex = e.newIndex

  if (oldIndex !== newIndex) {
    const orders = voices.value.map((item, index) => {
      return {
        id: item.id,
        sort_order: index + 1
      }
    })
    await window.api.voice.reorder(orders)
    await loadVoices()
  }
}

/**
 * 处理创建成功
 */
const handleCreateSuccess = () => {
  loadVoices()
  synthesisCardRef.value.loadVoices()
}
</script>

<template>
  <div class="voice-clone-view">
    <div class="content-area">
      <a-row :gutter="12">
        <a-col :span="12">
          <TrainCard @create-success="handleCreateSuccess" />
        </a-col>

        <a-col :span="12">
          <SynthesisCard ref="synthesisCardRef" />
        </a-col>
      </a-row>

      <div class="voice-library-section">
        <div class="section-header">
          <div class="section-title">
            <h3>我的声音库</h3>
            <p>管理您训练的所有声音模型</p>
          </div>
          <a-button class="refresh-btn" type="text" @click="loadVoices">
            <ReloadOutlined />
            刷新
          </a-button>
        </div>
        <div class="voice-library-content">
          <draggable
            v-model="voices"
            item-key="id"
            :animation="180"
            class="voice-models-grid"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div class="voice-model-card">
                <div class="model-header">
                  <div class="model-icon">
                    <SoundOutlined />
                  </div>
                  <div class="model-info">
                    <h4>{{ element.name }}</h4>
                    <p>
                      {{ element.description }}
                    </p>
                    <div class="model-meta">
                      <span>{{ formatSize(element.file_size) }}</span>
                      <span>{{ dayjs(element.created_at).format('YYYY/MM/DD HH:mm:ss') }}</span>
                    </div>
                  </div>
                  <div class="model-actions">
                    <a-tooltip title="播放">
                      <a-button type="text" @click="toggleVoicePlay(element)">
                        <template #icon>
                          <PauseCircleOutlined v-if="playingId === element.id" />
                          <PlayCircleOutlined v-else />
                        </template>
                      </a-button>
                    </a-tooltip>

                    <a-tooltip title="编辑">
                      <a-button type="text" @click="openEdit(element)">
                        <template #icon>
                          <EditOutlined />
                        </template>
                      </a-button>
                    </a-tooltip>

                    <a-popconfirm
                      title="确定删除该声音？"
                      ok-text="确认"
                      cancel-text="取消"
                      @confirm="removeVoice(element)"
                    >
                      <a-button type="text" danger>
                        <template #icon>
                          <DeleteOutlined danger />
                        </template>
                      </a-button>
                    </a-popconfirm>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>

    <!-- 编辑声音弹窗 -->
    <a-modal v-model:open="editModalOpen" centered title="编辑声音模型" :width="480" @ok="saveEdit">
      <div class="edit-modal-body">
        <a-form layout="vertical">
          <a-form-item label="声音名称" required>
            <a-input v-model:value="editForm.name" placeholder="为这个声音起个名称" />
          </a-form-item>
          <a-form-item label="描述信息">
            <a-textarea v-model:value="editForm.description" :rows="4" placeholder="可选" />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<style lang="scss">
.audio-cropper {
  background: linear-gradient(
    135deg,
    var(--theme-background-card) 0,
    var(--theme-background-card) 50%,
    var(--theme-background-card-alt) 100%
  );
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px var(--theme-shadow-dark);
  border: 1px solid var(--theme-border-card);
}

.waveform-container {
  position: relative;
  width: 100%;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--theme-border-purple-light);
  margin-bottom: 16px;
}

.waveform-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.waveform-canvas:active {
  cursor: grabbing;
}

.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--theme-error);
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 4px var(--theme-error-light);
}

.playhead:before {
  content: '';
  position: absolute;
  top: 0;
  left: -3px;
  width: 7px;
  height: 7px;
  background: var(--theme-error);
  border-radius: 50%;
  transform: translateY(-50%);
}

.bottom-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.trial-button {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  color: #fff;
  font-size: var(--app-font-size-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px var(--theme-shadow-primary-stronger);
}

.trial-button.is-playing {
  background: linear-gradient(90deg, var(--theme-success), var(--theme-primary));
  box-shadow: 0 4px 12px var(--theme-alert-success-border);
}

.trial-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px var(--theme-shadow-primary-strongest);
}

.trial-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.trial-button .play-icon {
  font-size: var(--app-font-size-caption);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--theme-modal-bg);
  z-index: 10;
}

.loading-text {
  margin-top: 8px;
  font-size: var(--app-font-size-caption);
  color: var(--theme-text-gradient-purple);
}

.duration-display {
  flex: 1;
  padding: 10px 16px;
  border-radius: 6px;
  border: 2px solid var(--theme-border-card);
  background: var(--theme-radio-inner-bg);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.duration-display.valid {
  border-color: var(--theme-success);
  background: var(--theme-alert-success-bg);
}

.duration-display.invalid {
  border-color: var(--theme-error-lighter);
  background: var(--theme-alert-error-bg);
}

.duration-text {
  font-family:
    Monaco,
    Courier New,
    monospace;
  font-size: var(--app-font-size-body);
  font-weight: 600;
  color: var(--theme-text-tertiary);
}

.duration-display.valid .duration-text {
  color: var(--theme-success);
}

.duration-display.invalid .duration-text {
  color: var(--theme-error-lighter);
}

.status-icon {
  font-size: var(--app-font-size-caption);
  font-weight: 500;
}

.status-icon.success {
  color: var(--theme-success);
  font-size: var(--app-font-size-body);
}

.status-icon.warning {
  color: var(--theme-error-lighter);
  font-style: normal;
}

.loading-hint {
  text-align: center;
  padding: 40px;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-body);
}

.voice-clone-view {
  position: relative;
  overflow-x: hidden;
  min-height: 100vh;
}

.content-area {
  position: relative;
  z-index: 1;
}

.feature-card {
  background: linear-gradient(
    135deg,
    var(--theme-background) 0,
    var(--theme-background-lighter) 50%,
    var(--theme-background-light) 100%
  );
  border-radius: 12px;
  box-shadow: 0 4px 16px var(--theme-shadow-dark);
  border: 1px solid var(--theme-border-purple-light);
  overflow: hidden;
  transition: all 0.3s ease;
  min-height: 500px;
}

.feature-card:hover {
  box-shadow: 0 8px 24px var(--theme-shadow-darker);
}

.card-header {
  padding: 20px 24px 16px;
  background: var(--theme-scrollbar-track-light);
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  border-bottom: 1px solid var(--theme-border-purple);
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--app-font-size-card-title);
  color: var(--theme-text-primary);
}

.training-icon {
  background: var(--theme-modal-button-primary-bg);
  box-shadow: 0 2px 8px var(--theme-shadow-primary-strong);
}

.synthesis-icon {
  background: linear-gradient(90deg, var(--theme-secondary), var(--theme-accent));
  box-shadow: 0 2px 8px var(--theme-shadow-primary-strong);
}

.card-title h3 {
  font-size: var(--app-font-size-card-title);
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--theme-text-tertiary);
}

.card-title p {
  font-size: var(--app-font-size-meta);
  color: var(--theme-text-muted);
  margin: 0;
}

.card-content {
  padding: 20px 24px;
}

.card-content .ant-form-item-label > label {
  color: var(--theme-text-tertiary);
}

.card-content .ant-slider-rail {
  background: var(--theme-background-lighter);
}

.card-content .ant-slider-track {
  background: var(--theme-modal-button-primary-bg);
}

.card-content .ant-slider-handle {
  border-color: var(--theme-secondary);
  background: var(--theme-secondary);
}

.card-content .ant-slider-handle:focus,
.card-content .ant-slider-handle:hover {
  border-color: var(--theme-secondary-light);
  box-shadow: 0 0 0 4px var(--theme-input-focus-shadow);
}

.card-content .anticon {
  color: var(--theme-text-primary);
}

.card-content .anticon-delete {
  color: var(--theme-error-light);
}

.card-content .anticon-delete:hover {
  color: var(--theme-error);
}

.tab-item .ant-tabs {
  margin-bottom: 16px;
}

.tab-item .ant-tabs-tab {
  color: var(--theme-text-muted);
}

.tab-item .ant-tabs-tab-active {
  color: var(--theme-secondary);
}

.tab-item .ant-tabs-tab:hover {
  color: var(--theme-text-gradient-purple);
}

.tab-item .ant-tabs-ink-bar {
  background: var(--theme-modal-button-primary-bg);
}

.tab-item .ant-tabs-nav:before {
  border-color: var(--theme-border);
}

.upload-item .ant-form-item-label > label {
  font-weight: 600;
  color: var(--theme-text-tertiary);
}

.recording-section {
  padding: 20px;
  text-align: center;
}

.recording-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.record-button {
  min-width: 150px;
  height: 50px;
  font-size: var(--app-font-size-body);
  font-weight: 500;
}

.recording-time {
  font-size: var(--app-font-size-card-title);
  font-weight: 600;
  color: var(--theme-secondary);
}

.recorded-audio-info {
  margin-top: 20px;
}

.wavesurfer-item {
  margin-bottom: 24px;
}

.wavesurfer-container {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e1e8ed;
}

.wavesurfer-wrapper {
  margin-bottom: 12px;
  min-height: 100px;
}

.duration-warning {
  margin-top: 12px;
}

.region-info {
  margin-top: 12px;
  padding: 12px;
  background: #f0f8ff;
  border-radius: 6px;
  border: 1px solid #d1ecf1;
}

.region-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--app-font-size-body);
  color: var(--theme-text-gradient-purple);
}

.region-duration {
  font-weight: 600;
  color: var(--theme-secondary);
}

.custom-upload {
  border-radius: 8px;
  background: var(--theme-scrollbar-track-light);
  transition: all 0.3s ease;
  border-color: var(--theme-border);
}

.custom-upload:hover {
  border-color: var(--theme-border-purple-light);
  background: var(--theme-overlay-purple-strong);
}

.upload-content {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 36px;
  color: var(--theme-secondary);
  margin-bottom: 12px;
}

.upload-title {
  font-size: var(--app-font-size-body);
  font-weight: 500;
  color: var(--theme-text-tertiary);
  margin: 0 0 8px 0;
}

.upload-hint {
  font-size: var(--app-font-size-body);
  color: var(--theme-text-gradient-purple);
  margin: 0;
  line-height: 1.5;
}

.input-item .ant-input-affix-wrapper {
  border-radius: 8px;
  border: 1px solid var(--theme-input-border) !important;
}

.input-item .ant-input,
.input-item .ant-input-affix-wrapper {
  background: none !important;
  background-color: transparent !important;
  color: var(--theme-text-primary) !important;
}

.input-item .ant-input::-moz-placeholder {
  color: var(--theme-text-muted) !important;
  opacity: 0.6;
}

.input-item .ant-input::placeholder {
  color: var(--theme-text-muted) !important;
  opacity: 0.6;
}

.input-item .ant-input-prefix {
  color: var(--theme-text-primary) !important;
}

.input-item input {
  background-color: transparent !important;
}

.seed-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.seed-random-btn {
  width: 44px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-item .ant-input-affix-wrapper-focused,
.input-item .ant-input-affix-wrapper:focus {
  border-color: var(--theme-input-focus-border);
  box-shadow: 0 0 0 2px var(--theme-input-focus-shadow);
}

.recognition-status {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--theme-overlay-purple-stronger);
  border: 1px solid var(--theme-border-light);
  border-radius: 6px;
  font-size: var(--app-font-size-caption);
  color: var(--theme-primary-light);
  display: flex;
  align-items: center;
}

.recognition-success {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--theme-alert-success-bg);
  border: 1px solid var(--theme-alert-success-border);
  border-radius: 6px;
  font-size: var(--app-font-size-caption);
  color: var(--theme-success);
}

.select-item .ant-select-selector {
  border-radius: 8px;
  border: 1px solid var(--theme-border-purple) !important;
  background: none !important;
  background-color: transparent !important;
  color: var(--theme-text-primary) !important;
}

.select-item .ant-select-arrow,
.select-item .ant-select-selection-item {
  color: var(--theme-text-primary) !important;
}

.select-item .ant-select-selection-placeholder {
  color: var(--theme-text-muted) !important;
  opacity: 0.6;
}

.select-item .ant-select {
  color: var(--theme-text-primary) !important;
}

.select-item .ant-select-single .ant-select-selector {
  background-color: transparent !important;
}

.ant-select-dropdown {
  background: var(--theme-select-dropdown-bg) !important;
  border: 1px solid var(--theme-border-purple) !important;
}

.ant-select-item {
  color: var(--theme-text-primary) !important;
  background: transparent !important;
}

.ant-select-item-option-active {
  background: var(--theme-select-item-active-bg) !important;
}

.ant-select-item-option-selected {
  background: var(--theme-select-item-selected-bg) !important;
  color: var(--theme-text-primary) !important;
}

.ant-select-item-option:hover {
  background: var(--theme-select-item-hover-bg) !important;
}

.voice-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.voice-name {
  font-weight: 500;
  color: var(--theme-text-tertiary);
}

.voice-tag {
  background: var(--theme-alert-success-bg);
  color: var(--theme-success);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--app-font-size-caption);
}

.textarea-item .ant-input {
  border-radius: 8px;
  border: 1px solid var(--theme-input-border) !important;
  background: none !important;
  background-color: transparent !important;
  color: var(--theme-text-primary) !important;
  resize: none;
}

.textarea-item .ant-input:focus {
  border-color: var(--theme-input-focus-border) !important;
  box-shadow: 0 0 0 2px var(--theme-input-focus-shadow) !important;
  background-color: transparent !important;
}

.textarea-item .ant-input::-moz-placeholder {
  color: var(--theme-text-muted) !important;
  opacity: 0.6;
}

.textarea-item .ant-input::placeholder {
  color: var(--theme-text-muted) !important;
  opacity: 0.6;
}

.textarea-item textarea {
  background-color: transparent !important;
}

.textarea-item .ant-input-data-count,
.textarea-item .ant-input-show-count-suffix {
  color: var(--theme-text-primary) !important;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.slider-item {
  background: var(--theme-table-header-bg);
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--theme-border);
}

.slider-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
  color: var(--theme-text-tertiary);
}

.slider-value {
  background: var(--theme-modal-button-primary-bg);
  color: var(--theme-text-primary);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: var(--app-font-size-caption);
  font-weight: 600;
}

.expanded-settings {
  background: var(--theme-table-header-bg);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--theme-border);
  display: none;
}

.expanded-settings .ant-select-selector {
  background: none !important;
  border-color: var(--theme-border) !important;
  color: var(--theme-text-primary) !important;
}

.expanded-settings .ant-select-selection-item {
  color: var(--theme-text-primary) !important;
}

.expanded-settings .ant-select-selection-placeholder {
  color: var(--theme-text-muted) !important;
  opacity: 0.6;
}

.expanded-settings .ant-select-arrow {
  color: var(--theme-text-primary) !important;
}

.settings-header {
  font-size: var(--app-font-size-caption);
  font-weight: 600;
  color: var(--theme-text-gradient-purple);
  margin-bottom: 8px;
}

.inline-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.inline-item {
  margin-bottom: 0 !important;
}

.inline-settings .ant-select-selector {
  border-radius: 8px;
  border: 1px solid var(--theme-input-border) !important;
  background: none !important;
  background-color: transparent !important;
  color: var(--theme-text-primary) !important;
}

.inline-settings .ant-select-arrow,
.inline-settings .ant-select-selection-item {
  color: var(--theme-text-primary) !important;
}

.inline-settings .ant-select-selection-placeholder {
  color: var(--theme-text-muted) !important;
  opacity: 0.6;
}

.inline-settings .ant-select-clear {
  background: transparent !important;
  color: var(--theme-text-primary) !important;
}

.inline-settings .ant-select-clear:hover {
  color: var(--theme-secondary) !important;
}

.inline-settings .ant-input-number {
  border-radius: 8px;
  border: 1px solid var(--theme-input-border) !important;
  background: none !important;
  background-color: transparent !important;
}

.inline-settings .ant-input-number-input {
  color: var(--theme-text-primary) !important;
  background: transparent !important;
}

.inline-settings .ant-input-number-input::-moz-placeholder {
  color: var(--theme-text-muted) !important;
  opacity: 0.6;
}

.inline-settings .ant-input-number-input::placeholder {
  color: var(--theme-text-muted) !important;
  opacity: 0.6;
}

.inline-settings .ant-input-number-handler-wrap {
  background: var(--theme-scrollbar-track-light) !important;
  border-left-color: var(--theme-border-purple) !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.inline-settings .ant-input-number:not(:hover) .ant-input-number-handler-wrap {
  opacity: 1 !important;
  visibility: visible !important;
}

.inline-settings .ant-input-number-handler {
  border-color: var(--theme-border-purple) !important;
  color: var(--theme-text-primary) !important;
}

.inline-settings .ant-input-number-handler:hover {
  background: var(--theme-overlay-purple-strongest) !important;
}

.inline-settings .ant-input-number-handler-down-inner,
.inline-settings .ant-input-number-handler-up-inner {
  color: var(--theme-text-gradient-purple) !important;
}

.compact-form-item {
  margin-bottom: 0 !important;
}

.voice-select-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.preview-btn {
  flex-shrink: 0;
}

.emotion-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 8px 0;
}

.emotion-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.emotion-label {
  display: flex;
  justify-content: space-between;
  font-size: var(--app-font-size-micro);
  color: var(--theme-text-gradient-purple);
}

.emotion-value {
  color: var(--theme-secondary);
}

.mt-2 {
  margin-top: 8px;
}

.action-button {
  height: 45px;
  border-radius: 8px;
  font-size: var(--app-font-size-body);
  font-weight: 500;
  background: var(--theme-modal-button-primary-bg) !important;
  border: none !important;
  color: var(--theme-text-primary);
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px var(--theme-shadow-primary-strong);
}

.action-button:hover {
  background: var(--theme-modal-button-primary-hover-bg) !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--theme-modal-button-primary-shadow);
}

.synthesis-button {
  background: var(--theme-modal-button-primary-bg) !important;
}

.synthesis-button:hover {
  background: var(--theme-modal-button-primary-hover-bg) !important;
}

.progress-info {
  margin-top: 16px;
  padding: 16px;
  background: var(--theme-overlay-purple-strong);
  border-radius: 8px;
  border: 1px solid var(--theme-border-purple);
}

.progress-text {
  margin-top: 8px;
  font-size: var(--app-font-size-meta);
  color: var(--theme-text-gradient-purple);
  text-align: center;
}

.result-section {
  margin-top: 40px;
  background: linear-gradient(
    135deg,
    var(--theme-surface-hover) 0,
    var(--theme-gradient-surface-end) 100%
  );
  border-radius: 20px;
  box-shadow: 0 4px 16px var(--theme-shadow-dark);
  overflow: hidden;
  border: 1px solid var(--theme-border);
}

.result-content {
  padding: 30px 40px;
}

.audio-player-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.audio-player-wrapper {
  background: linear-gradient(
    135deg,
    var(--theme-overlay-purple-strong) 0,
    var(--theme-overlay-purple-stronger) 100%
  );
  border-radius: 16px;
  padding: 30px;
  border: 1px solid var(--theme-border-purple);
  text-align: center;
  width: 80%;
  max-width: 800px;
  min-width: 600px;
}

.result-audio-player {
  width: 100%;
  height: 54px;
  border-radius: 12px;
  outline: none;
  background: var(--theme-background-lighter);
  box-shadow: 0 2px 8px var(--theme-shadow-dark);
  margin-bottom: 12px;
}

.result-audio-player::-webkit-media-controls-panel {
  background-color: var(--theme-background-lighter);
  border-radius: 12px;
}

.result-audio-player::-webkit-media-controls-play-button {
  background-color: var(--theme-success);
  border-radius: 50%;
}

.result-audio-player::-webkit-media-controls-timeline {
  background-color: var(--theme-background-light);
  border-radius: 4px;
  margin: 0 8px;
}

.result-audio-player::-webkit-media-controls-current-time-display,
.result-audio-player::-webkit-media-controls-time-remaining-display {
  font-size: var(--app-font-size-caption);
  color: var(--theme-text-gradient-purple);
}

.audio-info {
  display: flex;
  justify-content: center;
  align-items: center;
}

.audio-path {
  font-size: var(--app-font-size-caption);
  color: var(--theme-text-gradient-purple);
  background: var(--theme-scrollbar-track-light);
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid var(--theme-border-purple);
}

.audio-file-section {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.audio-path-info {
  flex: 1;
  padding: 12px;
  background: var(--theme-scrollbar-track-light);
  border-radius: 8px;
  border: 1px solid var(--theme-alert-success-border);
  text-align: left;
}

.path-label {
  font-size: var(--app-font-size-micro);
  color: var(--theme-success);
  font-weight: 500;
  margin-bottom: 6px;
}

.path-value {
  font-size: var(--app-font-size-micro);
  color: var(--theme-text-secondary);
  word-break: break-all;
  line-height: 1.3;
  font-family:
    Consolas,
    Monaco,
    Courier New,
    monospace;
  background: var(--theme-scrollbar-track-light);
  padding: 6px 8px;
  border-radius: 4px;
}

.audio-actions {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 12px;
  flex-shrink: 0;
}

.audio-actions .ant-btn {
  border-radius: 8px;
  height: 36px;
  font-weight: 500;
}

.voice-library-section {
  margin-top: 24px;
  background: linear-gradient(
    135deg,
    var(--theme-surface-hover) 0,
    var(--theme-gradient-surface-end) 100%
  );
  border-radius: 12px;
  box-shadow: 0 4px 16px var(--theme-shadow-dark);
  overflow: hidden;
  border: 1px solid var(--theme-border);
}

.voice-models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px 0;
}

.voice-model-card {
  background: linear-gradient(
    135deg,
    var(--theme-scrollbar-track-light) 0,
    var(--theme-background-lighter) 100%
  );
  border-radius: 8px;
  border: 1px solid var(--theme-border);
  transition: all 0.3s ease;
  cursor: grab;
}

.voice-model-card:active {
  cursor: grabbing;
}

.voice-model-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--theme-shadow-darker);
  border-color: var(--theme-border-purple-light);
}

.voice-model-ghost {
  opacity: 0.4;
  border: 1px dashed var(--theme-border-purple-light);
}

.voice-model-chosen {
  box-shadow: 0 8px 24px var(--theme-shadow-darker);
  border-color: var(--theme-border-purple-light);
}

.model-header {
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.model-icon {
  width: 36px;
  height: 36px;
  background: var(--theme-modal-button-primary-bg);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-body);
  flex-shrink: 0;
  box-shadow: 0 2px 8px var(--theme-shadow-primary-strong);
}

.model-info {
  flex: 1;
  min-width: 0;
}

.model-info h4 {
  font-size: var(--app-font-size-secondary);
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--theme-text-tertiary);
}

.model-info p {
  font-size: var(--app-font-size-meta);
  color: var(--theme-text-gradient-purple);
  margin: 0 0 8px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
}

.model-meta {
  display: flex;
  gap: 10px;
  font-size: var(--app-font-size-micro);
  color: var(--theme-text-muted);
}

.model-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.model-actions .ant-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  transition: all 0.3s ease;
}

.model-actions .ant-btn:hover {
  transform: scale(1.1);
}

.model-actions .ant-btn[data-icon='play-circle'] {
  color: var(--theme-success);
}

.model-actions .ant-btn[data-icon='play-circle']:hover {
  background: var(--theme-alert-success-bg);
  border-color: var(--theme-success);
}

.model-actions .ant-btn[data-icon='edit'] {
  color: var(--theme-text-gradient-purple);
}

.model-actions .ant-btn[data-icon='edit']:hover {
  background: var(--theme-overlay-purple-stronger);
  border-color: var(--theme-secondary);
}

.model-actions .ant-btn[data-icon='audio'] {
  color: var(--theme-primary-light);
}

.model-actions .ant-btn[data-icon='audio']:hover {
  background: var(--theme-overlay-purple-stronger);
  border-color: var(--theme-primary);
}

.section-header {
  padding: 20px 24px 16px;
  background: var(--theme-scrollbar-track-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--theme-border);
}

.section-title h3 {
  font-size: var(--app-font-size-card-title);
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--theme-text-tertiary);
}

.section-title p {
  font-size: var(--app-font-size-meta);
  color: var(--theme-text-gradient-purple);
  margin: 0;
}

.voice-library-content {
  padding: 20px 24px;
}

.empty-state {
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 64px;
  color: var(--theme-text-disabled);
  margin-bottom: 24px;
}

.empty-state h4 {
  font-size: var(--app-font-size-section-title);
  font-weight: 600;
  color: var(--theme-text-tertiary);
  margin: 0 0 12px 0;
}

.empty-state p {
  font-size: var(--app-font-size-body);
  color: var(--theme-text-gradient-purple);
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.empty-state .ant-btn {
  border-radius: 8px;
  height: 40px;
  padding: 0 24px;
  font-weight: 500;
}

@keyframes float-08b0ff1c {
  0%,
  to {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

@media (max-width: 768px) {
  .content-area {
    padding: 20px;
  }

  .card-header {
    padding: 20px 20px 16px;
  }

  .card-content {
    padding: 20px;
  }

  .section-header {
    padding: 20px 20px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .voice-library-content {
    padding: 40px 20px;
  }
}

.recording-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 24px;
}

.timer-display {
  font-family:
    Monaco,
    Courier New,
    monospace;
  font-size: var(--app-font-size-page-title);
  font-weight: 600;
  color: var(--theme-text-muted);
  opacity: 0.5;
  transition: all 0.3s;
}

.timer-display.active {
  color: var(--theme-secondary);
  opacity: 1;
  text-shadow: 0 0 10px var(--theme-shadow-primary-stronger);
}

.record-btn-wrapper,
.record-circle-btn {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.record-circle-btn {
  border-radius: 50%;
  border: none;
  background: var(--theme-modal-button-primary-bg);
  color: var(--theme-text-primary);
  cursor: pointer;
  z-index: 2;
  box-shadow:
    0 4px 12px var(--theme-shadow-primary-strong),
    0 0 20px var(--theme-shadow-primary-stronger);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.record-circle-btn:hover {
  transform: scale(1.05);
  box-shadow:
    0 8px 20px var(--theme-shadow-primary-stronger),
    0 0 30px var(--theme-shadow-primary-strongest);
}

.record-circle-btn:active {
  transform: scale(0.95);
}

.record-circle-btn.recording {
  background: var(--theme-error);
  box-shadow: 0 4px 12px var(--theme-modal-button-danger-shadow);
}

.record-circle-btn.recording:hover {
  box-shadow: 0 8px 20px var(--theme-modal-button-danger-shadow);
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-icon {
  font-size: var(--app-font-size-page-title);
}

.stop-icon {
  width: 24px;
  height: 24px;
  background: var(--theme-text-primary);
  border-radius: 4px;
}

.ripple-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: var(--theme-modal-button-danger-shadow);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  animation: ripple-08b0ff1c 1.5s infinite;
}

.recording-hint {
  font-size: var(--app-font-size-body);
  color: var(--theme-text-gradient-purple);
  margin-top: 8px;
}

@keyframes ripple-08b0ff1c {
  0% {
    width: 80px;
    height: 80px;
    opacity: 0.8;
  }

  to {
    width: 160px;
    height: 160px;
    opacity: 0;
  }
}

.card-help-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  margin: 0;
}

.ant-select-dropdown {
  background: var(--theme-select-dropdown-bg) !important;
  border: 1px solid var(--theme-border-purple) !important;
}

.ant-select-item {
  color: var(--theme-text-primary) !important;
  background: transparent !important;
}

.ant-select-item-option-active {
  background: var(--theme-select-item-active-bg) !important;
}

.ant-select-item-option-selected {
  background: var(--theme-select-item-selected-bg) !important;
  color: var(--theme-text-primary) !important;
}

.ant-select-item-option:hover {
  background: var(--theme-select-item-hover-bg) !important;
}

.voice-clone-view {
  .refresh-btn {
    color: var(--theme-text-gradient-purple);
    border: 1px solid var(--theme-border-purple);
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .refresh-btn:hover {
    background: var(--theme-overlay-purple-stronger);
    color: var(--theme-secondary);
    border-color: var(--theme-border-purple-light);
  }

  .ant-select-item-option-content,
  .anticon {
    color: var(--theme-text-primary) !important;
  }

  .anticon.anticon-delete {
    color: var(--theme-error-light) !important;
  }

  .anticon.anticon-delete:hover {
    color: var(--theme-error) !important;
  }
}
</style>
