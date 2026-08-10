<script setup>
import { computed, onMounted, watch } from 'vue'
import { usePublish } from '../../../hooks/usePublish'
import { usePipeline } from '../../../hooks/usePipeline'
import {
  CloudUploadOutlined,
  FolderOpenOutlined,
  PictureFilled,
  PlusCircleFilled,
  VideoCameraOutlined
} from '@ant-design/icons-vue'
import BenchmarkProgress from '../../../components/BenchmarkProgress.vue'

const { updatePipelineData } = usePipeline()

// 使用发布逻辑
const {
  loading,
  publishVideoPath,
  selectedAccounts,
  accountsLoading,
  addAccountModalOpen,
  newAccount,
  publishTitle,
  publishDescription,
  publishMode,
  autoCloseBrowser,
  coverPath,
  setPublishMode,
  tagInput,
  publishTags,
  progressText,
  allAccounts,
  hasXiaohongshuInSelection,
  canPublish,
  displayVideoName,
  displayVideoSrc,
  coverPreviewSrc,
  getPlatformDisplayName,
  getPlatformColor,
  getPlatformBadgeText,
  isAccountSelected,
  toggleAccountSelected,
  openAddAccountModal,
  closeAddAccountModal,
  openCoverPreview,
  handleCoverPreviewError,
  supportedPlatforms,
  loginAccountLoading,
  submitAddAccount,
  createdAccountId,
  setupLoginForCreatedAccount,
  removeTag,
  handleTagBackspace,
  addTagFromInput,

  handleSelectVideo,
  handleSelectCover,
  handlePublish
} = usePublish()

watch(
  [
    publishTitle,
    publishDescription,
    publishTags,
    publishMode,
    autoCloseBrowser,
    selectedAccounts,
    coverPath,
    publishVideoPath
  ],
  () => {
    updatePipelineData({
      publishTitle: publishTitle.value,
      publishDescription: publishDescription.value,
      publishTags: [...publishTags.value],
      publishMode: publishMode.value,
      autoCloseBrowser: autoCloseBrowser.value,
      selectedAccounts: [...selectedAccounts.value],
      coverPath: coverPath.value,
      publishVideoPath: publishVideoPath.value
    })
  },
  { deep: true }
)

const handleBeforeNext = () => {
  if (!publishVideoPath.value) {
    message.warning('请选择发布视频')
    return false
  }
  if (!publishTitle.value) {
    // message.warning('请输入发布标题')
    return false
  }
  if (selectedAccounts.value.length === 0) {
    // message.warning('请选择至少一个发布账号')
    return false
  }
  return true
}

defineExpose({
  handleBeforeNext
})
</script>

<template>
  <div class="publish-step" :class="{ 'is-executing': loading }">
    <div class="publish-layout">
      <div class="glass-card preview-card">
        <div class="card-head">
          <div>
            <h3>发布素材</h3>
          </div>
          <button class="mini-action" type="button" @click="handleSelectVideo">
            <folder-open-outlined />
            选择视频
          </button>
        </div>

        <div class="video-source-card">
          <div class="source-info">
            <span>视频地址</span>
            <b :title="displayVideoName">{{ displayVideoName || '未选择发布视频' }}</b>
          </div>
          <div class="empty-video" v-if="!displayVideoSrc">
            <video-camera-outlined />
            <p>暂无发布视频</p>
            <span>默认使用上一步视频，也可以手动选择。</span>
          </div>
          <div class="video-preview-shell" v-if="displayVideoSrc">
            <video :src="displayVideoSrc" controls></video>
          </div>
        </div>

        <div class="publish-copy-card compact">
          <div class="copy-main">
            <div class="edit-field">
              <span>标题</span>
              <a-input v-model:value="publishTitle" type="text" placeholder="输入发布标题" />
            </div>

            <div class="edit-field">
              <span>描述</span>
              <a-input
                type="textarea"
                v-model:value="publishDescription"
                placeholder="输入发布描述"
              />
            </div>

            <div class="edit-field">
              <span>标签</span>
              <div class="tag-input-shell">
                <span v-for="(tag, index) in publishTags" :key="index" class="topic-tag">
                  #{{ tag }}
                  <button type="button" @click.stop="removeTag(tag)">x</button>
                </span>
                <input
                  type="text"
                  placeholder="输入标签后回车"
                  v-model="tagInput"
                  @keyup.enter="addTagFromInput"
                  @keydown.backspace="handleTagBackspace"
                />
              </div>
            </div>
          </div>

          <div class="cover-row compact">
            <button
              class="cover-preview-trigger"
              type="button"
              aria-label="放大预览封面"
              v-if="coverPreviewSrc"
            >
              <img :src="coverPreviewSrc" alt="封面预览" />
            </button>
            <div class="cover-empty" v-else>
              <picture-filled />
            </div>
            <button class="cover-select-btn" @click="handleSelectCover">选择封面</button>
          </div>
        </div>
      </div>

      <div class="glass-card config-card">
        <div class="card-head">
          <div>
            <h3>发布配置</h3>
          </div>
          <button class="mini-action" type="button" @click="openAddAccountModal">
            <plus-circle-filled />
            添加平台账号
          </button>
        </div>

        <div class="setting-block">
          <div class="setting-label">
            <span>发布账号</span>
            <b>建议一次选择1-3个，过多可能异常</b>
          </div>
        </div>

        <div class="account-summary">
          <div class="account-grid">
            <button
              type="button"
              class="account-card"
              :class="{
                selected: isAccountSelected(acc.id)
              }"
              v-for="(acc, index) in allAccounts"
              :key="index"
              @click="toggleAccountSelected(acc.id)"
            >
              <span
                class="account-avatar"
                :style="{
                  background: getPlatformColor(acc.platform)
                }"
                >{{ getPlatformBadgeText(acc.platform) }}</span
              >
              <span class="account-card-main">
                <b>{{ acc.account_name }}</b>
                <small>{{ getPlatformDisplayName(acc.platform) }}</small>
              </span>
              <span class="account-check">✓</span>
            </button>
          </div>
        </div>

        <div class="setting-block">
          <div class="setting-label">
            <span>发布方式</span>
          </div>
          <div class="mode-toggle" aria-label="发布方式" role="radiogroup">
            <button
              type="button"
              class="mode-option"
              :class="{
                active: publishMode === 'draft'
              }"
              @click="setPublishMode('draft')"
            >
              草稿
            </button>
            <button
              type="button"
              class="mode-option"
              :class="{
                active: publishMode === 'direct'
              }"
              @click="setPublishMode('direct')"
            >
              直接发布
            </button>
          </div>
          <label class="auto-close-row" v-if="publishMode === 'direct'">
            <a-checkbox v-model:checked="autoCloseBrowser" />
            <span>发布后关闭浏览器</span>
          </label>
        </div>

        <button class="publish-btn" @click="handlePublish" :disabled="loading">
          <cloud-upload-outlined />
          {{ loading ? '处理中...' : '立即发布' }}
        </button>
      </div>
    </div>

    <BenchmarkProgress :loading="loading" :text="progressText" />

    <!-- ========== 添加账号弹窗 ========== -->
    <a-modal
      v-model:open="addAccountModalOpen"
      centered
      title="添加发布账号"
      :width="520"
      :footer="null"
      :mask-closable="false"
      class="publish-account-modal"
    >
      <div class="account-modal-body">
        <p class="modal-tip">添加后请到账号管理完成登录，登录成功后即可用于一键发布。</p>
        <a-form layout="vertical">
          <a-form-item label="平台类型" required>
            <a-select
              v-model:value="newAccount.platform"
              placeholder="请选择发布平台类型"
              popup-class-name="dark-dropdown"
            >
              <a-select-option
                v-for="platform in supportedPlatforms"
                :key="platform.key"
                :value="platform.key"
              >
                {{ platform.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="账号名称" required>
            <a-input v-model:value="newAccount.account_name" placeholder="输入账号名称或用户名" />
          </a-form-item>
          <a-form-item label="显示名称">
            <a-input v-model:value="newAccount.display_name" placeholder="输入显示名称（可选）" />
          </a-form-item>
        </a-form>

        <div class="modal-actions">
          <a-button @click="closeAddAccountModal">取消</a-button>
          <a-button
            v-if="createdAccountId"
            :loading="loginAccountLoading"
            @click="setupLoginForCreatedAccount"
          >
            {{ loginAccountLoading ? '登录中...' : '登录账号' }}
          </a-button>
          <a-button
            type="primary"
            :loading="addingAccount"
            :disabled="!newAccount.platform || !newAccount.account_name"
            @click="submitAddAccount"
          >
            {{ addingAccount ? '添加中...' : '添加账号' }}
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.publish-step {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.publish-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 18px;
}

.glass-card {
  min-height: 0;
  padding: 18px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 22px;
  background:
    radial-gradient(
      circle at 18% 0,
      color-mix(in srgb, var(--theme-primary-light) 16%, transparent),
      transparent 28%
    ),
    linear-gradient(145deg, var(--theme-overlay-light), var(--theme-overlay-light));
  border: 1px solid color-mix(in srgb, var(--theme-border-gray) 16%, transparent);
  box-shadow: 0 18px 48px color-mix(in srgb, var(--theme-background) 30%, transparent);
}

.card-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-kicker {
  color: var(--theme-text-gradient-purple);
  font-size: var(--app-font-size-micro);
  font-weight: 900;
  letter-spacing: 0.14em;
}

.card-head h3 {
  margin: 4px 0 0;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title);
  font-weight: 900;
}

.mini-action {
  height: 34px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-primary-light) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 24%, transparent);
  cursor: pointer;
  font-weight: 900;
}

.account-summary,
.publish-copy-card,
.setting-block,
.video-source-card {
  margin-top: 16px;
  padding: 14px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--theme-background-light) 48%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border-gray) 14%, transparent);
  box-shadow: inset 0 1px 0 var(--theme-overlay-light);
}

.copy-row,
.cover-row,
.setting-label,
.source-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.copy-row span,
.cover-row span,
.setting-label span,
.source-info span {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
}

.copy-row b,
.cover-row b,
.setting-label b,
.source-info b {
  min-width: 0;
  overflow: hidden;
  color: var(--theme-text-secondary);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.setting-label b {
  color: var(--theme-warning);
}

.video-preview-shell {
  height: clamp(180px, 42vh, 330px);
  margin-top: 12px;
  overflow: hidden;
  border-radius: 16px;
  background: var(--theme-background);
  border: 1px solid color-mix(in srgb, var(--theme-info) 24%, transparent);
  box-shadow: 0 16px 34px color-mix(in srgb, var(--theme-background) 32%, transparent);
}

.video-preview-shell video {
  width: 100%;
  height: 100%;
  -o-object-fit: contain;
  object-fit: contain;
  background: var(--theme-background);
}

.account-empty,
.empty-video {
  flex: 1;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--theme-text-muted);
  text-align: center;
}

.account-empty svg,
.empty-video svg {
  color: var(--theme-text-gradient-purple);
  font-size: 48px;
}

.account-empty p,
.empty-video p {
  margin: 0;
  color: var(--theme-text-primary);
  font-weight: 900;
}

.publish-copy-card.compact {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 192px;
  align-items: stretch;
  gap: 12px;
}

.copy-main {
  min-width: 0;
  display: grid;
  gap: 10px;
}

.edit-field {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.edit-field span {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
}

.tag-input-shell {
  min-height: 36px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--theme-background-light) 86%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 26%, transparent);
}

.topic-tag {
  height: 23px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-primary-light) 24%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 24%, transparent);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
}

.topic-tag button {
  width: 15px;
  height: 15px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: var(--theme-text-secondary);
  background: var(--theme-overlay-light);
  line-height: 13px;
  cursor: pointer;
}

.tag-input-shell input {
  flex: 1;
  min-width: 110px;
  height: 23px;
  border: 0;
  outline: none;
  color: var(--theme-text-secondary);
  background: transparent;
  font-size: var(--app-font-size-caption);
}

.cover-row {
  align-items: stretch;
}

.cover-row.compact {
  grid-template-columns: 1fr;
  justify-items: center;
  align-items: center;
  padding-left: 12px;
  border-left: 1px solid color-mix(in srgb, var(--theme-border-gray) 14%, transparent);
  text-align: center;
}

.cover-row.compact,
.cover-row > div {
  display: grid;
  align-content: center;
  gap: 6px;
}

.cover-empty,
.cover-preview-trigger,
.cover-row > img {
  width: 112px;
  aspect-ratio: 9/16;
  border-radius: 12px;
  -o-object-fit: cover;
  object-fit: cover;
  background: color-mix(in srgb, var(--theme-background) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 20%, transparent);
}

.cover-row.compact .cover-empty,
.cover-row.compact .cover-preview-trigger,
.cover-row.compact > img {
  align-self: center;
  justify-self: center;
}

.cover-preview-trigger {
  position: relative;
  padding: 0;
  overflow: hidden;
  cursor: zoom-in;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.cover-preview-trigger:focus-visible,
.cover-preview-trigger:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--theme-info) 54%, transparent);
  box-shadow: 0 12px 26px color-mix(in srgb, var(--theme-primary) 20%, transparent);
  outline: none;
}

.cover-preview-trigger img {
  width: 100%;
  height: 100%;
  display: block;
}

.cover-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-text-gradient-purple);
  font-size: var(--app-font-size-section-title);
}

.cover-row.compact b {
  max-width: 160px;
  color: var(--theme-text-secondary);
  font-size: var(--app-font-size-micro);
  text-align: center;
  white-space: normal;
}

.cover-select-btn {
  height: 28px;
  padding: 0 12px;
  justify-self: center;
  border: 0;
  border-radius: 999px;
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-primary-light) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 26%, transparent);
  cursor: pointer;
  font-size: var(--app-font-size-caption);
  font-weight: 900;
}

.cover-select-btn:hover {
  color: var(--theme-text-primary);
  background: color-mix(in srgb, var(--theme-primary-light) 32%, transparent);
}

.risk-alert {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  color: var(--theme-warning);
  background: color-mix(in srgb, var(--theme-warning) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-warning) 22%, transparent);
  font-size: var(--app-font-size-caption);
  line-height: 1.5;
}

.account-summary {
  flex: 0 1 auto;
  max-height: clamp(180px, 32vh, 300px);
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.account-summary::-webkit-scrollbar {
  width: 8px;
}

.account-summary::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--theme-background-light) 36%, transparent);
  border-radius: 999px;
}

.account-summary::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--theme-info) 42%, transparent);
  border-radius: 999px;
}

.account-summary::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--theme-info) 56%, transparent);
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.account-card {
  min-width: 0;
  min-height: 64px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 14px;
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-background-card) 68%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 14%, transparent);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.account-card:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--theme-primary) 18%, transparent);
  border-color: color-mix(in srgb, var(--theme-info) 34%, transparent);
}

.account-card.selected {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--theme-primary) 62%, transparent),
    color-mix(in srgb, var(--theme-secondary-dark) 44%, transparent)
  );
  border-color: color-mix(in srgb, var(--theme-info) 58%, transparent);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--theme-primary) 18%, transparent);
}

.account-avatar {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  font-weight: 900;
}

.account-card-main {
  min-width: 0;
  flex: 1;
}

.account-card-main b,
.account-card-main small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-card-main b {
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-meta);
}

.account-card-main small {
  margin-top: 3px;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
}

.account-check {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: transparent;
  background: color-mix(in srgb, var(--theme-background-light) 52%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border-gray) 18%, transparent);
  font-weight: 900;
}

.account-card.selected .account-check {
  color: var(--theme-text-primary);
  background: var(--theme-success);
  border-color: color-mix(in srgb, var(--theme-success) 80%, transparent);
}

.account-empty button {
  border: 0;
  color: var(--theme-text-gradient-purple);
  background: transparent;
  cursor: pointer;
  font-weight: 900;
}

.mode-toggle {
  margin-top: 10px;
  padding: 4px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--theme-background) 42%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border-gray) 16%, transparent);
}

.mode-option {
  height: 34px;
  border: 0;
  border-radius: 999px;
  color: color-mix(in srgb, var(--theme-text-secondary) 74%, transparent);
  background: transparent;
  cursor: pointer;
  font-weight: 900;
}

.mode-option.active {
  color: var(--theme-text-primary);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--theme-primary-light) 96%, transparent),
    color-mix(in srgb, var(--theme-info) 86%, transparent)
  );
  box-shadow: 0 8px 18px color-mix(in srgb, var(--theme-primary) 22%, transparent);
}

.auto-close-row {
  margin-top: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  color: var(--theme-text-muted);
  background: color-mix(in srgb, var(--theme-background) 28%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border-gray) 12%, transparent);
  font-size: var(--app-font-size-meta);
}

.publish-btn {
  flex-shrink: 0;
  height: 48px;
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 16px;
  color: var(--theme-text-primary);
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  box-shadow: 0 16px 34px color-mix(in srgb, var(--theme-primary) 28%, transparent);
  cursor: pointer;
  font-size: var(--app-font-size-body);
  font-weight: 900;
}

.publish-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.bottom-progress {
  margin-top: 10px;
  flex-shrink: 0;
}

.publish-step .ant-checkbox-inner,
.publish-step .ant-input,
.publish-step .ant-select-selector,
.publish-step textarea.ant-input {
  color: var(--theme-text-secondary) !important;
  background: color-mix(in srgb, var(--theme-background-light) 86%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-info) 26%, transparent) !important;
}

.publish-step .ant-input::-moz-placeholder,
.publish-step textarea.ant-input::-moz-placeholder,
.tag-input-shell input::-moz-placeholder {
  color: var(--theme-text-muted) !important;
}

.publish-step .ant-input::placeholder,
.publish-step textarea.ant-input::placeholder,
.tag-input-shell input::placeholder {
  color: var(--theme-text-muted) !important;
}

.publish-step .ant-select-arrow,
.publish-step .ant-select-selection-item,
.publish-step .ant-select-selection-placeholder {
  color: color-mix(in srgb, var(--theme-text-secondary) 88%, transparent) !important;
}

.publish-step .ant-select-selection-item {
  background: color-mix(in srgb, var(--theme-primary-light) 22%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-info) 24%, transparent) !important;
}

.account-modal-body {
  display: grid;
  gap: 16px;
}

.modal-tip {
  padding: 10px 12px;
  border-radius: 12px;
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-primary-light) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-info) 22%, transparent);
  font-size: var(--app-font-size-caption);
  line-height: 1.5;
}

.account-modal-body .ant-form-item-label > label {
  color: var(--theme-text-muted);
  font-weight: 900;
}

.account-modal-body .ant-input,
.account-modal-body .ant-select-selector {
  color: var(--theme-text-secondary) !important;
  background: color-mix(in srgb, var(--theme-background-light) 78%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-info) 24%, transparent) !important;
}

.account-modal-body .ant-input::-moz-placeholder {
  color: var(--theme-text-muted) !important;
}

.account-modal-body .ant-input::placeholder,
.account-modal-body .ant-select-arrow,
.account-modal-body .ant-select-selection-placeholder {
  color: var(--theme-text-muted) !important;
}

.account-modal-body .ant-select-selection-item,
.account-modal-body .ant-select-selection-search-input {
  color: var(--theme-text-secondary) !important;
}

.form-help {
  margin-top: 6px;
  color: color-mix(in srgb, var(--theme-text-secondary) 68%, transparent);
  font-size: var(--app-font-size-caption);
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-btn {
  height: 36px;
  padding: 0 18px;
  border-radius: 12px;
  border: 0;
  cursor: pointer;
  font-weight: 900;
}

.modal-btn.ghost {
  color: var(--theme-text-secondary);
  background: var(--theme-overlay-light);
  border: 1px solid var(--theme-overlay-light);
}

.modal-btn.primary {
  color: var(--theme-text-primary);
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
}

.modal-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.cover-preview-body {
  display: flex;
  justify-content: center;
  padding: 8px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--theme-background) 72%, transparent);
}

.cover-preview-image {
  max-width: 100%;
  max-height: 72vh;
  -o-object-fit: contain;
  object-fit: contain;
  border-radius: 10px;
}

.publish-account-modal .ant-modal-content {
  padding: 0 !important;
  overflow: hidden;
  background: color-mix(in srgb, var(--theme-background-light) 96%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--theme-info) 22%, transparent);
  border-radius: 18px;
  box-shadow: 0 24px 72px color-mix(in srgb, var(--theme-background) 60%, transparent);
}

.publish-account-modal .ant-modal-header {
  margin: 0 !important;
  padding: 18px 22px;
  background: color-mix(in srgb, var(--theme-background-card) 82%, transparent) !important;
  border-bottom: 1px solid color-mix(in srgb, var(--theme-border-gray) 16%, transparent);
}

.publish-account-modal .ant-modal-title {
  color: var(--theme-text-primary) !important;
  font-weight: 900;
}

.publish-account-modal .ant-modal-close {
  color: var(--theme-text-muted) !important;
}

.publish-account-modal .ant-modal-body {
  padding: 20px 22px 22px !important;
}

.publish-account-dropdown {
  padding: 8px !important;
  background: color-mix(in srgb, var(--theme-background) 98%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--theme-info) 26%, transparent) !important;
  box-shadow: 0 22px 60px color-mix(in srgb, var(--theme-background) 56%, transparent) !important;
}

.publish-account-dropdown .ant-select-item {
  min-height: 42px;
  border-radius: 10px;
  color: color-mix(in srgb, var(--theme-text-secondary) 92%, transparent) !important;
  background: transparent !important;
}

.publish-account-dropdown .ant-select-item-group {
  padding: 8px 8px 4px;
  color: var(--theme-text-gradient-purple) !important;
  font-weight: 900;
}

.publish-account-dropdown .ant-select-item-option-active {
  background: color-mix(in srgb, var(--theme-primary-light) 18%, transparent) !important;
}

.publish-account-dropdown .ant-select-item-option-selected {
  background: color-mix(in srgb, var(--theme-primary) 38%, transparent) !important;
}

.publish-account-dropdown .ant-select-item-option-content {
  color: color-mix(in srgb, var(--theme-text-secondary) 94%, transparent) !important;
}

.publish-account-dropdown .ant-select-item-option-state {
  color: var(--theme-info) !important;
}

.cover-preview-modal .ant-modal-content {
  overflow: hidden;
  background: color-mix(in srgb, var(--theme-background-light) 96%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--theme-info) 22%, transparent);
  border-radius: 18px;
  box-shadow: 0 24px 72px color-mix(in srgb, var(--theme-background) 60%, transparent);
}

.cover-preview-modal .ant-modal-header {
  background: transparent !important;
}

.cover-preview-modal .ant-modal-title {
  color: var(--theme-text-primary) !important;
  font-weight: 900;
}

.cover-preview-modal .ant-modal-close {
  color: var(--theme-text-muted) !important;
}
</style>
