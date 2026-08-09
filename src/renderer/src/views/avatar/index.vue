<script setup>
import {
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  PlayCircleOutlined,
  PlusCircleOutlined,
  QuestionCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ref, onMounted, computed, reactive, Teleport } from 'vue'
import draggable from 'vuedraggable'
import { formatSize } from '../../utils'

const avatars = ref([])

// ---- 视频预览 ----
const previewAvatar = ref(null)
const previewModalOpen = ref(false)

function openPreview(a) {
  previewAvatar.value = a
  previewModalOpen.value = true
}

function closePreview() {
  previewModalOpen.value = false
}

// ---- 形象注册 ----
const addForm = reactive({
  name: '',
  description: '',
  file_size: 0,
  video_path: '',
  video_format: '',
  video_duration: 0,
  resolution: null
})

const editForm = reactive({
  id: null,
  name: '',
  description: ''
})

// 支持的数字人视频格式
const ALLOWED_VIDEO_EXTS = ['video/mp4', 'video/mov', 'video/mkv', 'video/webm', 'video/flv']
// 文件大小上限（500MB）
const MAX_VIDEO_SIZE = 500 * 1024 * 1024

/**
 * 上传前处理文件信息 + 校验格式与大小
 * @param {File} file 上传的文件对象
 * @returns {Promise<boolean>} 是否校验通过
 */
async function handleBeforeUpload(file) {
  // 1. 校验格式（大小写不敏感）
  const ext = (file.type || '').toLowerCase()
  if (!ALLOWED_VIDEO_EXTS.includes(ext)) {
    message.error(`不支持的视频格式`)
    return false
  }

  if (file.size <= 0) {
    message.error('视频文件为空，请重新选择')
    return false
  }

  // 2. 校验大小
  if (file.size > MAX_VIDEO_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    const limitMB = (MAX_VIDEO_SIZE / (1024 * 1024)).toFixed(0)
    message.error(`视频文件过大（${sizeMB}MB），最大支持 ${limitMB}MB`)
    return false
  }

  const path = window.api.getPathForFile(file)
  if (!path) {
    message.warning('无法读取文件路径，请重试')
    return false
  }

  const infoRes = await window.api.file.getInfo(path)
  if (!infoRes.success) {
    message.error(infoRes.error || '获取文件信息失败')
    return false
  }
  const info = infoRes.data
  if (!info.exists) {
    message.error('文件不存在或已被删除')
    return false
  }
  if (!info.isFile) {
    message.error('所选路径不是文件')
    return false
  }

  // 校验通过 → 写入表单
  addForm.file_size = file.size
  addForm.video_format = info.ext || ''
  addForm.video_path = path

  // 获取视频信息，包括时长和分辨率
  const videoInfo = await window.api.video.getInfo(path)
  if (videoInfo.success) {
    // 时长小数点保留2位
    addForm.video_duration = Number(videoInfo.data.duration || 0).toFixed(2)
    if (videoInfo.data.width && videoInfo.data.height) {
      addForm.resolution = videoInfo.data.width + 'x' + videoInfo.data.height
    }
  }

  message.success('视频文件加载成功')
  return false
}

const canRegister = computed(() => addForm.name.trim() && addForm.video_path)

const saving = ref(false)
// 保存形象
async function saveAvatar() {
  if (!addForm.name.trim()) {
    message.warning('请填写数字人名称')
    return
  }
  if (!addForm.video_path) {
    message.warning('请选择口播视频')
    return
  }
  saving.value = true
  try {
    // 名称去重
    const exist = await window.api.digitalHuman.findByName(addForm.name.trim())
    if (exist.success && exist.data) {
      message.error('数字人名称已存在')
      return
    }

    // 上传云端（失败仅保存本地路径）
    let videoUrl = ''
    // try {
    //   const up = await window.api.oss.upload(addForm.video_path, 'video')
    //   if (up.success) videoUrl = up.data.url
    // } catch (e) {
    //   console.warn('文件上传失败，仅保存本地路径', e)
    // }

    // 提取封面
    let thumbnailPath = ''
    try {
      const coverRes = await window.api.video.getCover(addForm.video_path)
      if (coverRes.success) thumbnailPath = coverRes.data.coverPath
    } catch (e) {
      console.error('获取视频封面失败:', e)
    }

    const res = await window.api.digitalHuman.create({
      ...addForm,
      video_url: videoUrl || null,
      thumbnail_path: thumbnailPath
    })

    if (!res.success) throw new Error(res.error || '注册失败')
    message.success(`形象「${addForm.name.trim()}」注册成功`)
    addForm.name = ''
    addForm.description = ''
    await loadAvatars()
  } catch (e) {
    message.error(e.message || '注册失败')
  } finally {
    saving.value = false
  }
}

// 加载形象列表
async function loadAvatars() {
  try {
    const res = await window.api.digitalHuman.list()
    avatars.value = res.data || []
  } catch (e) {
    message.error(e.message || '加载数字人列表失败')
  }
}

// 删除形象
async function removeAvatar(a) {
  try {
    const res = await window.api.digitalHuman.delete(a.id)
    if (!res.success) throw new Error(res.error || '删除失败')
    message.success('已删除')
    await loadAvatars()
  } catch (e) {
    message.error(e.message || '删除失败')
  }
}

const editModalOpen = ref(false)

// 打开编辑弹窗
function openEditModal(a) {
  editForm.id = a.id
  editForm.name = a.name
  editForm.description = a.description || ''
  editModalOpen.value = true
}

// 关闭编辑弹窗
function closeEditModal() {
  editForm.id = null
  editForm.name = ''
  editForm.description = ''
  editModalOpen.value = false
}

// 保存编辑
async function saveEdit() {
  if (!editForm.name.trim()) {
    message.warning('请填写显示名称')
    return
  }
  try {
    const payload = {
      name: editForm.name.trim(),
      description: editForm.description.trim()
    }
    const res = await window.api.digitalHuman.update(editForm.id, payload)
    if (!res.success) throw new Error(res.error || '保存失败')
    message.success('已保存')
    closeEditModal()
    await loadAvatars()
  } catch (e) {
    message.error(e.message || '保存失败')
  } finally {
  }
}

const handleDragEnd = async (e) => {
  console.log('拖动结束:', e)
  const oldIndex = e.oldIndex
  const newIndex = e.newIndex

  if (oldIndex !== newIndex) {
    const orders = avatars.value.map((item, index) => {
      return {
        id: item.id,
        sort_order: index + 1
      }
    })
    await window.api.digitalHuman.reorder(orders)
    await loadAvatars()
  }
}

onMounted(() => {
  loadAvatars()
})
</script>

<template>
  <div class="digital-human-page">
    <div class="feature-card add-model-section">
      <!-- 页头 -->
      <div class="card-header">
        <div class="card-icon">
          <plus-circle-outlined />
        </div>
        <div class="card-title">
          <h3>添加形象</h3>
          <p>上传视频文件创建新的形象</p>
        </div>
        <a-button type="text" class="card-help-btn help-btn">
          <question-circle-outlined />
          帮助
        </a-button>
      </div>

      <div class="card-content">
        <div class="form-row">
          <div class="upload-section">
            <a-upload-dragger
              :show-upload-list="false"
              accept="video/*"
              :multiple="false"
              :before-upload="handleBeforeUpload"
              class="avatar-dragger"
            >
              <div class="upload-content">
                <div class="upload-empty">
                  <p class="ant-upload-drag-icon">
                    <inbox-outlined />
                  </p>
                  <p class="ant-upload-text">点击或拖拽视频文件到此区域</p>
                  <p class="ant-upload-hint">
                    支持 MP4、AVI、MOV、WMV、FLV、MKV、WEBM 格式，最大 500MB 分辨率建议720P或1080P
                    <br />
                    云端处理最大只能处理1080P视频，本地模式处理不限制，但建议是1080P，不然会非常消耗时间。
                    <br />
                    选择的数字人视频，保存后不要变动文件路径，不然会导致生成失败，另外数字人视频的路径不要含有空格以及特殊字符
                  </p>
                </div>
              </div>
            </a-upload-dragger>
          </div>
          <div class="form-section">
            <div class="input-item">
              <label>形象名称*</label>
              <a-input
                v-model:value="addForm.name"
                placeholder="请输入数字人名称"
                :maxlength="10"
                show-count
              />
            </div>
            <div class="textarea-item">
              <label for="">描述信息</label>
              <a-textarea
                v-model:value="addForm.description"
                size="large"
                placeholder="请输入数字人的描述信息（可选，这里就是为了记忆方面，自己随便填，不填也行，没影响）"
                :maxlength="200"
                show-count
                :rows="4"
              />
            </div>

            <div class="action-buttons">
              <a-button
                type="primary"
                block
                class="save-button"
                size="large"
                @click="saveAvatar"
                :loading="saving"
                :disabled="saving || !canRegister"
              >
                <cloud-upload-outlined />
                保存形象</a-button
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="digital-human-library-section">
      <div class="section-header">
        <div class="section-title">
          <h3>我的形象库</h3>
          <p>管理您创建的所有形象</p>
        </div>
        <a-button type="text" class="refresh-btn">
          <reload-outlined />
          刷新
        </a-button>
      </div>
      <div class="library-content">
        <draggable
          v-model="avatars"
          item-key="id"
          :animation="180"
          class="models-grid"
          @end="handleDragEnd"
        >
          <template #item="{ element }">
            <div class="model-card">
              <div class="model-video">
                <video :src="element.video_path" preload="metadata" class="model-preview"></video>
                <div class="video-overlay">
                  <a-button
                    shape="circle"
                    type="primary"
                    class="play-btn"
                    size="large"
                    @click.stop="openPreview(element)"
                  >
                    <template #icon>
                      <play-circle-outlined />
                    </template>
                  </a-button>
                </div>
              </div>
              <div class="model-info">
                <div class="model-header">
                  <div class="model-name">
                    {{ element.name }}
                  </div>
                  <div class="model-actions">
                    <a-button type="text" size="small" @click="openEditModal(element)">
                      <edit-outlined />
                    </a-button>
                    <a-popconfirm
                      title="确定删除该形象？"
                      ok-text="确认"
                      cancel-text="取消"
                      @confirm="removeAvatar(element)"
                    >
                      <a-button type="text" size="small" danger>
                        <delete-outlined />
                      </a-button>
                    </a-popconfirm>
                  </div>
                </div>
                <div class="model-meta">
                  <span>
                    {{ formatSize(element.file_size) }}
                  </span>
                  <span>
                    {{ dayjs(element.created_at).format('YYYY/MM/DD HH:mm:ss') }}
                  </span>
                  <span>
                    {{ element.video_format }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- 编辑形象弹窗 -->
    <a-modal v-model:open="editModalOpen" centered title="编辑形象" :width="640" @ok="saveEdit">
      <div class="edit-modal-body">
        <a-form layout="vertical">
          <a-form-item label="数字人名称" required>
            <a-input
              v-model:value="editForm.name"
              :maxlength="10"
              show-count
              placeholder="为这个数字人起个名称"
            />
          </a-form-item>
          <a-form-item label="描述信息">
            <a-textarea
              v-model:value="editForm.description"
              :maxlength="200"
              show-count
              :rows="3"
              placeholder="可选"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- 视频预览弹窗 -->
    <teleport to="body">
      <div
        v-if="previewModalOpen"
        style="
          position: fixed;
          top: 0px;
          left: 0px;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        "
        @click="closePreview"
      >
        <video
          v-if="previewAvatar"
          :src="videoUrl(previewAvatar)"
          controls
          autoplay
          style="max-width: 90%; max-height: 90%; border-radius: 8px"
        />
      </div>
    </teleport>
  </div>
</template>

<style lang="scss">
.digital-human-page {
  margin-bottom: 80px;
  background: var(--theme-background);
  min-height: 100vh;
  padding: 20px 0;

  .feature-card {
    background: linear-gradient(
      135deg,
      var(--theme-background) 0,
      var(--theme-background-light) 50%,
      var(--theme-background-lighter) 100%
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
    border-bottom: 1px solid var(--theme-border-card);
  }

  .card-icon {
    width: 40px;
    height: 40px;
    background: var(--theme-modal-button-primary-bg);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--app-font-size-card-title);
    color: var(--theme-text-primary);
    box-shadow: 0 2px 8px var(--theme-shadow-primary-strong);
  }

  .card-title h3 {
    margin: 0 0 4px 0;
    color: var(--theme-text-tertiary);
    font-size: var(--app-font-size-card-title);
    font-weight: 600;
  }

  .card-title p {
    margin: 0;
    color: var(--theme-text-muted);
    font-size: var(--app-font-size-meta);
  }

  .card-content {
    padding: 20px 24px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
  }

  .upload-section {
    height: 100%;
    min-height: 400px;
  }

  .custom-upload {
    height: 100% !important;
    min-height: 400px !important;
  }

  .custom-upload .ant-upload-drag {
    height: 100% !important;
    min-height: 400px !important;
    border: 2px dashed var(--theme-border-card);
    border-radius: 8px;
    background: var(--theme-scrollbar-track-light);
    transition: all 0.3s ease;
  }

  .upload-section .custom-upload .ant-upload-drag {
    height: 100% !important;
    min-height: 400px !important;
  }

  .custom-upload .ant-upload-drag:hover {
    border-color: var(--theme-border-purple-light);
    background: var(--theme-menu-item-hover-bg);
  }

  .upload-content {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .upload-empty {
    text-align: center;
    padding: 40px 20px;
  }

  .upload-empty .ant-upload-drag-icon {
    font-size: 36px;
    color: var(--theme-secondary) !important;
    margin-bottom: 12px;
  }

  .upload-empty p {
    color: var(--theme-text-primary) !important;
  }

  .upload-empty .ant-upload-text {
    font-size: var(--app-font-size-body);
    color: var(--theme-text-primary) !important;
    margin-bottom: 8px;
  }

  .upload-empty .ant-upload-hint {
    font-size: var(--app-font-size-body);
    color: var(--theme-text-primary) !important;
    opacity: 0.8;
    line-height: 1.6;
  }

  .upload-item {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
  }

  .video-preview {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .preview-video {
    max-width: 100%;
    max-height: 380px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .file-info {
    text-align: center;
  }

  .file-name {
    font-size: var(--app-font-size-body);
    font-weight: 600;
    color: var(--theme-text-tertiary);
    margin-bottom: 8px;
    word-break: break-all;
  }

  .file-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 16px;
    font-size: var(--app-font-size-body);
    color: var(--theme-text-gradient-purple);
  }

  .file-meta .rotation-hint {
    font-size: var(--app-font-size-caption);
    opacity: 0.9;
    color: var(--theme-text-tertiary, #888);
  }

  .remove-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: var(--theme-overlay-medium);
    border-radius: 50%;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
    height: 100%;
  }

  .input-item,
  .textarea-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input-item label,
  .textarea-item label {
    font-size: var(--app-font-size-body);
    font-weight: 600;
    color: var(--theme-text-tertiary);
  }

  .input-item .ant-input,
  .input-item .ant-input-affix-wrapper,
  .input-item .ant-input-show-count-wrapper,
  .textarea-item .ant-input,
  .textarea-item .ant-textarea,
  .textarea-item .ant-textarea textarea {
    border-radius: 8px;
    border: 1px solid var(--theme-input-border) !important;
    padding: 12px 16px;
    font-size: var(--app-font-size-body);
    transition: all 0.3s ease;
    background: none !important;
    background-color: transparent !important;
    color: var(--theme-text-primary) !important;
  }

  .input-item .ant-input-show-count-suffix {
    color: var(--theme-text-muted) !important;
    background: none !important;
  }

  .input-item .ant-input::-moz-placeholder,
  .textarea-item .ant-input::-moz-placeholder,
  .textarea-item .ant-textarea textarea::-moz-placeholder {
    color: var(--theme-text-primary) !important;
    opacity: 0.6;
  }

  .input-item .ant-input::placeholder,
  .textarea-item .ant-input::placeholder,
  .textarea-item .ant-textarea textarea::placeholder {
    color: var(--theme-text-primary) !important;
    opacity: 0.6;
  }

  .input-item .ant-input:hover,
  .textarea-item .ant-input:hover,
  .textarea-item .ant-textarea textarea:hover {
    border-color: var(--theme-input-hover-border) !important;
  }

  .input-item .ant-input:focus,
  .textarea-item .ant-input:focus,
  .textarea-item .ant-textarea textarea:focus {
    border-color: var(--theme-input-focus-border) !important;
    box-shadow: 0 0 0 2px var(--theme-input-focus-border) !important;
  }

  .action-buttons {
    display: flex;
    gap: 16px;
    margin-top: auto;
    justify-content: center;
  }

  .save-button {
    width: 80%;
    height: 45px;
    border-radius: 8px;
    background: var(--theme-modal-button-primary-bg) !important;
    border: none !important;
    font-size: var(--app-font-size-body);
    font-weight: 500;
    transition: all 0.3s ease;
    color: var(--theme-text-primary) !important;
    box-shadow: 0 4px 16px var(--theme-shadow-primary-strong);
  }

  .save-button:hover {
    background: var(--theme-modal-button-primary-hover-bg) !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px var(--theme-modal-button-primary-shadow);
  }

  .clear-button {
    height: 48px;
    border-radius: 12px;
    border: 1px solid var(--theme-border-gray);
    font-size: var(--app-font-size-body);
    transition: all 0.3s ease;
  }

  .digital-human-library-section {
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

  .section-header {
    padding: 20px 24px 16px;
    background: var(--theme-scrollbar-track-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--theme-border);
  }

  .section-title h3 {
    margin: 0 0 4px 0;
    color: var(--theme-text-tertiary);
    font-size: var(--app-font-size-card-title);
    font-weight: 600;
  }

  .section-title p {
    margin: 0;
    color: var(--theme-text-gradient-purple);
    font-size: var(--app-font-size-meta);
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--theme-text-gradient-purple);
    border: 1px solid var(--theme-border-card);
    border-radius: 6px;
    padding: 6px 12px;
    transition: all 0.3s ease;
  }

  .refresh-btn:hover {
    background: var(--theme-overlay-purple-stronger);
    color: var(--theme-secondary);
    border-color: var(--theme-border-purple-light);
  }

  .library-content {
    padding: 20px 24px;
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;
  }

  .empty-icon {
    font-size: 64px;
    color: var(--theme-text-disabled);
    margin-bottom: 24px;
  }

  .empty-state h4 {
    margin: 0 0 8px 0;
    color: var(--theme-text-tertiary);
    font-size: var(--app-font-size-section-title);
    font-weight: 600;
  }

  .empty-state p {
    margin: 0 0 24px 0;
    color: var(--theme-text-gradient-purple);
    font-size: var(--app-font-size-body);
  }

  .models-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }

  .model-card {
    background: linear-gradient(
      135deg,
      var(--theme-scrollbar-track-light) 0,
      var(--theme-background-lighter) 100%
    );
    border-radius: 10px;
    box-shadow: 0 2px 8px var(--theme-shadow-dark);
    border: 1px solid var(--theme-border);
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: grab;
  }

  .model-card:active {
    cursor: grabbing;
  }

  .model-card:hover {
    box-shadow: 0 8px 24px var(--theme-shadow-darker);
    transform: translateY(-2px);
    border-color: var(--theme-border-purple-light);
  }

  .model-card-ghost {
    opacity: 0.4;
    border: 1px dashed var(--theme-border-purple-light);
  }

  .model-card-chosen {
    box-shadow: 0 8px 24px var(--theme-shadow-darker);
    border-color: var(--theme-border-purple-light);
  }

  .model-video {
    position: relative;
    aspect-ratio: 9/16;
    background: var(--theme-background-lighter);
    overflow: hidden;
  }

  .model-preview {
    width: 100%;
    height: 100%;
    -o-object-fit: cover;
    object-fit: cover;
    cursor: pointer;
  }

  .video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--theme-modal-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s ease;
  }

  .model-card:hover .video-overlay {
    opacity: 1;
  }

  .play-btn {
    background: var(--theme-modal-button-primary-bg) !important;
    border: none !important;
    color: var(--theme-text-primary) !important;
    width: 60px !important;
    height: 60px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-shadow: 0 4px 12px var(--theme-shadow-primary-stronger) !important;
    padding: 0 !important;
  }

  .play-btn:hover {
    background: var(--theme-modal-button-primary-hover-bg) !important;
    transform: scale(1.1) !important;
    box-shadow: 0 6px 20px var(--theme-shadow-primary-strongest) !important;
  }

  .play-btn .ant-btn-icon {
    width: 100% !important;
    height: 100% !important;
  }

  .play-btn .ant-btn-icon,
  .play-btn .anticon {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin: 0 !important;
  }

  .play-btn .anticon {
    font-size: var(--app-font-size-page-title) !important;
    line-height: 1 !important;
  }

  .play-btn .anticon svg {
    display: block !important;
    margin: 0 auto !important;
  }

  .model-info {
    padding: 16px;
  }

  .model-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    gap: 8px;
  }

  .model-name {
    font-size: var(--app-font-size-secondary);
    font-weight: 600;
    color: var(--theme-text-tertiary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .model-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
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

  .model-description {
    font-size: var(--app-font-size-meta);
    color: var(--theme-text-gradient-purple);
    line-height: 1.4;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .model-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--app-font-size-caption);
    color: var(--theme-text-muted);
    gap: 10px;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .edit-form .input-item,
  .edit-form .textarea-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .edit-form label {
    font-size: var(--app-font-size-body);
    font-weight: 600;
    color: var(--theme-text-tertiary);
  }

  .edit-form .ant-input,
  .edit-form .ant-textarea,
  .edit-form .ant-textarea textarea {
    background: none !important;
    background-color: transparent !important;
    border-color: var(--theme-input-border) !important;
    color: var(--theme-text-primary) !important;
  }

  .edit-form .ant-input::-moz-placeholder,
  .edit-form .ant-textarea textarea::-moz-placeholder {
    color: var(--theme-text-primary) !important;
    opacity: 0.6;
  }

  .edit-form .ant-input::placeholder,
  .edit-form .ant-textarea textarea::placeholder {
    color: var(--theme-text-primary) !important;
    opacity: 0.6;
  }

  .edit-form .ant-input:hover,
  .edit-form .ant-textarea textarea:hover,
  .edit-form .ant-textarea:hover {
    border-color: var(--theme-input-hover-border) !important;
  }

  .edit-form .ant-input:focus,
  .edit-form .ant-textarea textarea:focus,
  .edit-form .ant-textarea:focus {
    border-color: var(--theme-input-focus-border) !important;
    box-shadow: 0 0 0 2px var(--theme-input-focus-border) !important;
  }

  @media (max-width: 1200px) {
    .form-row {
      grid-template-columns: 1fr;
      gap: 30px;
    }

    .models-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .digital-human-page {
      padding: 16px;
    }

    .header-content {
      flex-direction: column;
      gap: 20px;
      text-align: center;
    }

    .header-stats {
      gap: 20px;
    }

    .card-content,
    .card-header,
    .library-content {
      padding: 20px;
    }

    .models-grid {
      grid-template-columns: 1fr;
    }

    .action-buttons {
      flex-direction: column;
    }
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

  .card-help-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    margin: 0;
  }

  .anticon {
    color: var(--theme-text-primary);
  }

  .anticon-delete {
    color: var(--theme-error-lighter);
  }

  .anticon-delete:hover {
    color: var(--theme-error-light);
  }
}
</style>
