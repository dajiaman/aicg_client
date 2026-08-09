<template>
  <div ref="benchmarkStepRef" class="benchmark-step" :class="{ executing: extractLoading || mediaExtracting }">
    <a-tabs v-model:active-key="activeTab" class="benchmark-tabs">
      <!-- 提取文案 -->
      <a-tab-pane key="extract" tab="提取文案">
        <div class="feature-grid two-column">
          <div class="glass-card form-card">
            <div class="card-mini-title">视频链接</div>
            <div class="input-actions">
              <a-button type="link" size="sm" danger
              v-if="videoLink"
              class="clear-action" @click="clearExtract">清除</a-button>
            </div>
            <div class="link-input-shell" data-guide="extract-video-link">
              <LinkOutlined class="link-input-icon" />
              <input class="link-input" placeholder="请输入视频链接..." v-model="videoLink" />
              <button class="paste-chip" type="button" @click="handlePaste">粘贴</button>
            </div>
            <div class="extract-divider">
              <span>或</span>
            </div>

            <div class="media-extract-card" @click.stop="handleSelectFile">
              <div class="media-upload-plus">
                <PlusOutlined />
              </div>
              <div class="media-upload-copy">
                <span>从音频或视频中提取文案</span>
                <p>点击上传音频/视频，AI会提取音视频中的文案。</p>
              </div>
            </div>

            <a-button block class="extract-btn gradient-btn" type="primary" @click="handleExtract"
              :loading="extractLoading">
              <LinkOutlined />
              提取文案
            </a-button>
            <div class="hint-line">支持直接粘贴分享文本，系统会自动识别有效链接。</div>
            <div class="platform-actions">
              <span class="platform-label">快捷打开</span>
              <button class="platform-btn douyin" @click="openDouyin">抖</button>
              <button class="platform-btn kuaishou" @click="openKuaishou">快</button>
              <button class="platform-btn xiaohongshu" @click="openXiaohongshu">红</button>
            </div>
          </div>
          <div class="glass-card result-card">
            <div class="card-mini-title">原文案</div>
            <a-textarea v-model:value="extractedContent" placeholder="提取的文案会显示在这里..." class="original-textarea"
              data-guide="extracted-content">
            </a-textarea>
          </div>
        </div>
      </a-tab-pane>

      <!-- IP 大脑 -->
      <a-tab-pane key="ipBrain" tab="IP大脑">
        <div class="ip-brain-layout">
          <div class="glass-card ip-create-card">
            <div class="card-mini-title">添加对标账号</div>
            <p class="ip-helper">输入某音博主主页链接，系统会自动识别博主昵称作为档案名称。</p>
            <a-form layout="vertical" :model="ipBrainForm">
              <a-form-item label="对标账号主页" prop="url">
                <a-input v-model:value="ipBrainForm.url" type="text" size="lg" placeholder="请输入某音博主主页链接" />
              </a-form-item>

              <a-form-item label="学习模式" prop="deepLearning">
                <div class="learning-mode-cards">
                  <button class="learning-mode-card" @click.stop="ipBrainForm.deepLearning = 0"
                    :class="{ active: ipBrainForm.deepLearning == 0 }">
                    <span class="mode-title">浅度学习</span>
                    <span class="mode-desc">学习选题和基础写作风格，速度更快</span>
                  </button>
                  <button class="learning-mode-card" @click.stop="ipBrainForm.deepLearning = 1"
                    :class="{ active: ipBrainForm.deepLearning == 1 }">
                    <span class="mode-title">深度学习</span>
                    <span class="mode-desc">深度学习爆款文案风格，耗时较长</span>
                  </button>
                </div>
              </a-form-item>
              <a-button class="gradient-btn" block type="primary" @click="handleAddIpBrain">
                <PlusOutlined />
                添加并学习
              </a-button>
            </a-form>
          </div>

          <div class="glass-card archive-list-panel">
            <div class="section-toolbar">
              <span>已添加档案</span>
              <span class="archive-count">{{ archives.length }}个</span>
            </div>
            <div class="archive-empty" v-if="archives.length == 0">
              <div class="empty-orb">
                <BulbOutlined />
              </div>
              <h4>暂无 IP 大脑档案</h4>
              <p>左侧添加后会显示在这里。</p>
            </div>

            <div class="archives-grid" v-if="archives.length > 0">
              <div class="archive-card" v-for="archive in archives" :key="archive.id">
                <div class="archive-header">
                  <div class="archive-avatar">
                    {{ archive.name[0] }}
                  </div>
                  <div class="archive-main">
                    <div class="archive-title-row">
                      <div class="archive-name">{{ archive.name }}</div>
                      <span class="archive-depth-tag">{{
                        archive.deepLearning == 0 ? '浅度学习' : '深度学习'
                        }}</span>
                    </div>
                    <div class="archive-meta">
                      创建时间：
                      {{ dayjs(archive.created_at).format('YYYY/MM/DD') }}
                    </div>
                  </div>
                  <a-button type="primary" size="sm" class="gradient-btn archive-action-btn"
                    @click.stop="openAnalysisModal(archive.id)">
                    <BulbOutlined />分析
                  </a-button>
                  <DeleteOutlined title="删除" class="delete-icon" @click.stop="deleteArchive(archive.id)" />
                </div>
                <div class="archive-url" :title="archive.homepage_url"
                  @click.stop="openArchiveHomepage(archive.homepage_url)">
                  {{ archive.homepage_url }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-tab-pane>

      <!-- 爆款选题 -->
      <a-tab-pane key="topic" tab="爆款选题">
        <div class="glass-card topic-form">
          <a-form layout="vertical" :model="topicForm">
            <a-form-item label="关键词" prop="keyword">
              <a-input v-model:value="topicForm.keyword" size="lg" placeholder="如：口腔诊所、装修公司、儿童护眼台灯"
                @press-enter="handleGenerateKeywordTopics" @contextmenu.stop />
            </a-form-item>

            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="人设方向" prop="persona">
                  <a-select v-model:value="topicForm.persona" placeholder="选择人设方向" allow-clear size="lg"
                    :options="personaOptions" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="目标人群" prop="targetAudience">
                  <a-input v-model:value="topicForm.targetAudience" size="lg" placeholder="选填：如：宝妈、中小企业老板" />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="我的人设">
              <a-textarea type="textarea" v-model:value="topicForm.myPersona"
                placeholder="介绍你的人设，比如身份、行业经验、表达风格等，最多500字。" size="lg" :maxlength="500" show-count />
            </a-form-item>

            <div class="form-actions">
              <a-button type="primary" size="lg" class="gradient-btn" @click.stop="handleGenerateKeywordTopics">
                <BulbOutlined />
                生成爆款选题
              </a-button>
            </div>
          </a-form>
        </div>
      </a-tab-pane>

      <!-- 自由创作 -->
      <a-tab-pane key="freeCreate" tab="自由创作">
        <a-form layout="vertical" :model="freeCreationForm">
          <a-row :gutter="8">
            <a-col :span="12">
              <a-form-item label="写作模板">
                <a-select v-model:value="selectedTemplateId" placeholder="选择写作模板" size="lg"
                  :options="templateOptions" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="字数限制">
                <div class="word-count-row">
                  <a-select v-model:value="wordCountType" size="lg" placeholder="选择字数限制"
                    :style="wordCountType === 'custom' ? 'width: 120px' : 'width: 100%'">
                    <a-select-option value="200">200字</a-select-option>
                    <a-select-option value="300">300字</a-select-option>
                    <a-select-option value="500">500字</a-select-option>
                    <a-select-option value="800">800字</a-select-option>
                    <a-select-option value="1000">1000字</a-select-option>
                    <a-select-option value="custom">自定义</a-select-option>
                  </a-select>

                  <a-input-number v-if="wordCountType === 'custom'" v-model:value="customWordCount"
                    placeholder="请输入自定义字数" :min="50" :max="5000" size="lg" :step="10">
                    <template #addonAfter>
                      <span>字</span>
                    </template>
                  </a-input-number>
                </div>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row gutter="12">
            <a-col :span="12">
              <a-form-item label="产品名称">
                <a-input v-model:value="freeCreationForm.productName" size="lg" placeholder="请输入产品名称" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="适用人群">
                <a-input v-model:value="freeCreationForm.targetAudience" size="lg" placeholder="请输入适用人群" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row gutter="12">
            <a-col :span="12">
              <a-form-item label="产品卖点">
                <a-input v-model:value="freeCreationForm.productSlogan" size="lg" placeholder="请输入产品卖点" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="人设内容">
                <a-input v-model:value="freeCreationForm.myPersona" size="lg" placeholder="请输入人设内容" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="优惠活动">
            <a-input v-model:value="freeCreationForm.discount" size="lg" placeholder="请输入优惠活动" />
          </a-form-item>

          <div class="form-actions">
            <a-button type="primary" size="lg" class="gradient-btn" @click.stop="handleFreeCreation">
              <FileTextOutlined />
              创作文案
            </a-button>
          </div>
        </a-form>
      </a-tab-pane>
    </a-tabs>

    <BenchmarkProgress :loading="ipBrainGenerating" text="正在处理中" />

    <!-- 分析结果弹窗 -->
    <a-modal v-model:open="ipAnalysisModalVisible" title="IP选题分析" :footer="null" :width="modalSize.width"
      :style="modalStyle" :body-style="modalBodyStyle" centered mask-closable destroy-on-close
      wrap-class-name="ip-analysis-modal compact-modal">
      <div v-if="ipBrainGenerating && !analysisResult" class="modal-loading">
        <a-spin size="large" tip="AI正在深入分析账号风格与选题..." />
      </div>

      <div v-else class="analysis-content">
        <div v-if="styleAnalysis" class="analysis-box">
          <h4>
            <BulbOutlined />
            风格分析
          </h4>
          <p>{{ styleAnalysis }}</p>
        </div>
        <div class="section-toolbar">
          <span class="section-toolbar-title">推荐选题</span>
          <a-button type="link" size="small" :loading="ipBrainGenerating" @click="handleRefreshTopics">
            <SyncOutlined />
            换一批
          </a-button>
        </div>
        <!-- 滚动列表 -->
        <div class="topic-list">
          <div v-for="(topic, index) in topics" :key="index" class="topic-item" @click="handleCreateFromTopic(topic)">
            <span class="topic-index">{{ index + 1 }}</span>
            <div class="topic-text">{{ topic }}</div>
            <em>去创作</em>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 爆款选题弹窗（关键词） -->
    <a-modal v-model:open="keywordTopicModalVisible" :title="null" :footer="null" :width="modalSize.width"
      :style="modalStyle" :body-style="modalBodyStyle" centered mask-closable destroy-on-close
      wrap-class-name="keyword-topic-modal compact-modal">
      <div v-if="topicGenerating && keywordTopics.length === 0" class="loading-state">
        <a-spin size="large" tip="AI正在生成爆款选题..." />
      </div>
      <div v-else-if="keywordTopics.length > 0" class="modal-content-wrap">
        <div v-if="keywordAnalysis" class="keyword-analysis">
          <span class="keyword-analysis-icon">💡</span>
          <div class="keyword-analysis-scroll">{{ keywordAnalysis }}</div>
        </div>
        <div class="section-toolbar">
          <span class="section-toolbar-title">📋 推荐选题</span>
          <a-button type="default" size="small" class="toolbar-refresh-btn" :loading="topicGenerating"
            @click="handleRefreshKeywordTopics">
            ↻ 换一批
          </a-button>
        </div>
        <!-- 滚动列表 -->
        <div class="keyword-topic-list">
          <div v-for="(topic, index) in keywordTopics" :key="topic.id || index" class="keyword-topic-item"
            :class="{ selected: selectedKeywordTopic && selectedKeywordTopic.id === topic.id }"
            @click="selectKeywordTopic(topic)">
            <span class="topic-index">{{ index + 1 }}</span>
            <div class="topic-body">
              <div class="topic-text">{{ topic.title }}</div>
              <div v-if="topic.personaAngle" class="persona-angle">
                <span class="persona-angle-tag">人设角度</span>
                <span>{{ topic.personaAngle }}</span>
              </div>
              <em class="topic-hint">{{
                selectedKeywordTopic && selectedKeywordTopic.id === topic.id
                  ? '✓ 已选中'
                  : '点击选择'
              }}</em>
            </div>
          </div>
        </div>
        <div class="keyword-action-bar">
          <div class="selected-info">
            <span class="selected-info-label">已选：</span>
            <span class="selected-info-value">{{
              selectedKeywordTopic ? selectedKeywordTopic.title : '未选择'
              }}</span>
          </div>
          <a-select v-model:value="topicWordCountType" class="keyword-word-select"
            :disabled="!selectedKeywordTopic || topicCopyGenerating">
            <a-select-option value="200">200字</a-select-option>
            <a-select-option value="300">300字</a-select-option>
            <a-select-option value="500">500字</a-select-option>
            <a-select-option value="800">800字</a-select-option>
            <a-select-option value="custom">自定义</a-select-option>
          </a-select>
          <a-input-number v-if="topicWordCountType === 'custom'" v-model:value="topicCustomWordCount" :min="50"
            :max="3000" addon-after="字" :disabled="!selectedKeywordTopic || topicCopyGenerating" />
          <a-button type="primary" class="generate-btn" :disabled="!selectedKeywordTopic" :loading="topicCopyGenerating"
            @click="handleGenerateCopyFromSelectedTopic">
            生成文案
          </a-button>
        </div>
      </div>
      <a-empty v-else description="暂无选题，请重新生成" />
    </a-modal>

    <!-- 自由创作结果弹窗 -->
    <a-modal v-model:open="freeCreationModalVisible" title="IP口播文案" centered :footer="null" mask-closable
      :closable="!currentCreationGenerating" :width="modalSize.width" :style="modalStyle" :body-style="modalBodyStyle"
      destroy-on-close wrap-class-name="creation-modal">
      <div class="creation-modal-layout">
        <!-- 加载态 -->
        <div v-if="currentCreationGenerating && currentCreationResults.every((item) => !item.text)"
          class="modal-loading">
          <div class="loading-spinner">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p class="loading-text">AI 正在创作中...</p>
          <p class="loading-subtext">通常需要 5-15 秒</p>
        </div>

        <!-- 结果列表 -->
        <div v-else class="creation-results">
          <div v-for="(item, index) in currentCreationResults" :key="item.id" class="creation-card" :class="{
            selected: selectedFreeCreationId === item.id,
            generating: item.generating,
            empty: !item.text && !item.generating
          }" @click="!item.generating && selectFreeCreationResult(item.id)">
            <!-- 卡片头部 -->
            <div class="creation-card-head">
              <span>方案{{ index + 1 }}</span>
            </div>

            <!-- 卡片正文 -->
            <div class="creation-text">
              <template v-if="item.text">
                <p>{{ item.text }}<span v-if="item.generating" class="cursor">|</span></p>
              </template>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <a-button type="primary" size="large" class="gradient-btn" :disabled="!selectedFreeCreationId"
            @click="confirmFreeCreationResult">使用此文案</a-button>
        </div>

        <!-- 底部操作 -->
        <div v-if="!currentCreationGenerating && currentCreationResults.some((item) => item.text)" class="confirm-area">
          <div class="confirm-info">
            <span class="confirm-info-icon">💡</span>
            <span>选中卡片后点击右侧按钮使用该方案</span>
          </div>
          <div class="confirm-actions">
            <a-button class="!bg-white/5 !border-white/10 !text-gray-300 hover:!bg-white/10 hover:!text-white"
              @click="freeCreationModalVisible = false">
              取消
            </a-button>
            <a-button type="primary" size="large" class="gradient-btn" :disabled="!selectedFreeCreationId"
              @click="confirmFreeCreationResult">
              使用此文案
            </a-button>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'

// ----- Props 与 Emits -----
const emit = defineEmits(['navigate-step'])

// ----- 获取工作流 -----
import { usePipeline } from '../../../hooks/usePipeline'
import { message } from 'ant-design-vue'
import { useFreeCreation } from '../../../hooks/useFreeCreation'
import { usePermission } from '../../../hooks/usePermission'
import { useExtractContent } from '../../../hooks/useExtractContent'
import { useIpBrain } from '../../../hooks/useIpBrain'
import { useTopicGenerator } from '../../../hooks/useTopicGenerator'
import {
  createBenchmarkDraftSnapshot,
  normalizeBenchmarkDraft
} from '../../../hooks/useBenchmarkDraft'
import { validateBenchmarkBeforeNext } from '../../../hooks/validateBenchmarkBeforeNext'
import {
  PlusOutlined,
  LinkOutlined,
  BulbOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import BenchmarkProgress from '../../../components/BenchmarkProgress.vue'

const { pipeline, updatePipelineData, notifyStepStart, notifyStepError, notifyStepComplete } = usePipeline()
const { checkFullPermission } = usePermission()

const {
  loading: extractLoading,
  videoLink,
  extractedContent,
  extractFromMedia,
  mediaExtracting,
  selectedMediaName,
  selectedMediaFilePath,
  extractContent,
  clear: clearExtract,
  selectFile
} = useExtractContent()

const {
  loading: ipBrainLoading,
  archives,
  createForm: ipBrainForm,
  loadArchives,
  createArchive,
  deleteArchive,
  analyzeArchive,
  refreshTopics,
  analysisResult,
  styleAnalysis,
  generating: ipBrainGenerating,
  topics,
  currentArchive,
  generateIpCopy,
  copyGenerating: ipCopyGenerating,
  generatedCopies: ipGeneratedCopies
} = useIpBrain()

// 话题生成
const {
  topicForm,
  keywordAnalysis,
  topics: keywordTopics,
  generating: topicGenerating,
  copyGenerating: topicCopyGenerating,
  generatedCopies: topicGeneratedCopies,
  generateTopicsByKeyword,
  refreshTopics: refreshKeywordTopics,
  generateCopyFromTopic,
  saveCustomPersona,
  personaOptions
} = useTopicGenerator()

// 自由创作
const {
  generating: freeCreationGenerating,
  results: freeCreationResults,
  selectedTemplateId,
  templateOptions,
  initTemplateOptions,
  performFreeCreation
} = useFreeCreation()

const activeTab = ref('extract')
const progressText = ref('')
const benchmarkStepRef = ref(null)

// 模态框状态
const ipAnalysisModalVisible = ref(false)
const keywordTopicModalVisible = ref(false)
const freeCreationModalVisible = ref(false)

// 关键词选题
const selectedKeywordTopic = ref(null)
const topicWordCountType = ref('200')
const topicCustomWordCount = ref(200)

// 粘贴视频链接到输入框
// @param {string} text - 的文本内容
const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text && text.trim()) {
      videoLink.value = text.trim()
    } else {
      message.warning('剪贴板内容为空')
    }
  } catch (e) {
    console.error('读取剪贴板失败:', e)
    message.error('无法读取剪贴板')
  }
}

/**
 * 提取文案
 */
const handleExtract = async () => {
  if (!checkFullPermission('文案提取')) return

  notifyStepStart('extract')
  // 提取内容
  const result = await extractContent(videoLink.value, (msg) => {
    progressText.value = msg
  })

  if (result.success) {
    extractedContent.value = result.data.content
    updatePipelineData({
      originalContent: result.data.content,
      videoLink: videoLink.value
    })

    notifyStepComplete('extract', result.data)

    // 自动下一步（如果自动模式开启）
    if (window.workflowAutoMode) {
      window.dispatchEvent(new CustomEvent('workflow:auto-next', { detail: { step: 'extract' } }))
    }
    message.success('提取完成！')
  } else {
    notifyStepError('extract', new Error(result.error))
  }
}

/**
 * 选择音视频文件
 */
const handleSelectFile = async () => {
  await selectFile()
  if (selectedMediaFilePath.value) {
    extractFromMedia(selectedMediaFilePath.value, (msg) => {
      progressText.value = msg
    })
  }
}

// 快捷打开平台
const openDouyin = () => window.api.file.openExternal('https://www.douyin.com')
const openKuaishou = () => window.api.file.openExternal('https://www.kuaishou.com')
const openXiaohongshu = () => window.api.file.openExternal('https://www.xiaohongshu.com')

// 打开档案主页 / 快捷打开官网首页
// @param {string} url - 要打开的完整 URL（http/https）
const openArchiveHomepage = async (url) => {
  if (!url) return
  try {
    const res = await window.api.file.openExternal(url)
    if (res && !res.success) {
      message.error('打开链接失败：' + (res.error || '未知错误'))
    }
  } catch (e) {
    message.error('打开链接失败：' + e.message)
  }
}

// 试听：绑定到一个全局 Audio 实例
const previewAudio = ref(null)
const isPreviewPlaying = ref(false)
const previewDuration = ref(0)
const previewCurrentTime = ref(0)

const resetPreview = () => {
  if (previewAudio.value) {
    previewAudio.value.pause()
    previewAudio.value.onended = null
    previewAudio.value.ontimeupdate = null
    previewAudio.value.onloadedmetadata = null
    previewAudio.value.onerror = null
    previewAudio.value.onplay = null
    previewAudio.value.onpause = null
    previewAudio.value.src = ''
  }
  isPreviewPlaying.value = false
  previewDuration.value = 0
  previewCurrentTime.value = 0
}

onBeforeUnmount(() => {
  resetPreview()
})

// ----- IP 大脑逻辑 -----
/**
 *  添加对标账号
 */
const handleAddIpBrain = async () => {
  if (!ipBrainForm.url.trim()) {
    message.warning('请输入对标账号主页链接')
    return
  }
  await createArchive()
}

// 打开分析弹窗
const openAnalysisModal = async (id) => {
  ipAnalysisModalVisible.value = true
  await analyzeArchive(id)
}

/**
 * 刷新选题
 */
const handleRefreshTopics = async () => {
  if (currentArchive.value) {
    await refreshTopics(currentArchive.value.id)
  }
}

/**
 * 点击选题
 * @param {string|object} topic - 选题字符串，或带 title 的对象
 */
const handleCreateFromTopic = async (topic) => {
  ipAnalysisModalVisible.value = false
  generateIpCopy(topic)
  freeCreationModalVisible.value = true
  isKeywordTopicCreationMode.value = false
}

// 生成爆款选题
const handleGenerateKeywordTopics = async () => {
  if (!topicForm.keyword.trim()) {
    message.warning('请输入行业、行业类别或产品关键词')
    return
  }

  keywordTopicModalVisible.value = true
  generateTopicsByKeyword({ resetHistory: false })
}

const handleRefreshKeywordTopics = async () => {
  await refreshKeywordTopics()
}

const selectKeywordTopic = (topic) => {
  selectedKeywordTopic.value = topic
}

/**
 * 从选题生成文案
 */
const handleGenerateCopyFromSelectedTopic = async () => {
  if (!selectedKeywordTopic.value) {
    message.warning('请先选择一个选题')
    return
  }

  const wordCount =
    topicWordCountType.value === 'custom'
      ? topicCustomWordCount.value
      : parseInt(topicWordCountType.value)

  freeCreationModalVisible.value = true
  isKeywordTopicCreationMode.value = true

  await generateCopyFromTopic(selectedKeywordTopic.value, wordCount)
}

// ----- 自由创作逻辑 -----
const freeCreationForm = reactive({
  wordLimit: '200',
  // 产品名称
  productName: '',
  // 卖点
  sellingPoints: '',
  // 目标受众
  targetAudience: '',
  promotions: '',
  // 人设内容
  persona: ''
})

// 自由创作
const handleFreeCreation = async () => {
  if (!freeCreationForm.productName && !freeCreationForm.sellingPoints) {
    message.warning('请至少输入产品名称或卖点')
    return
  }

  if (!selectedTemplateId.value) {
    message.warning('请选择写作模板')
    return
  }

  // 从当前选中的 IP 档案中获取范文作为参考
  let referenceText = ''
  if (currentArchive.value?.samples?.length > 0) {
    const sample =
      currentArchive.value.samples[Math.floor(Math.random() * currentArchive.value.samples.length)]
    referenceText = sample.content || ''
  }

  // 如果有参考文案，附加到人设中
  const formData = { ...freeCreationForm }
  if (referenceText) {
    formData.persona =
      (formData.persona || '') + '\n\n【参考范文】：\n' + referenceText.substring(0, 500) + '...'
  }

  const wordCount =
    wordCountType.value === 'custom' ? customWordCount.value : parseInt(wordCountType.value)

  performFreeCreation(formData, selectedTemplateId.value, wordCount)

  freeCreationModalVisible.value = true
  isKeywordTopicCreationMode.value = false
}

const wordCountType = ref('300')
const customWordCount = ref(500)
const selectedFreeCreationId = ref(null)
const isKeywordTopicCreationMode = ref(false)

/**
 * 当前创作结果
 */
const currentCreationResults = computed(() => {
  if (ipCopyGenerating.value || ipGeneratedCopies.value.length > 0) {
    return ipGeneratedCopies.value
  }

  if (topicCopyGenerating.value || topicGeneratedCopies.value.length > 0) {
    return topicGeneratedCopies.value
  }
  return freeCreationResults.value
})

const currentCreationGenerating = ref(false)

const creationModalTitle = ref('')

const selectFreeCreationResult = (id) => {
  selectedFreeCreationId.value = id
}

const confirmFreeCreationResult = () => {
  const selected = currentCreationResults.value.find((r) => r.id === selectedFreeCreationId.value)
  if (!selected) {
    message.warning('请先选择一条文案')
    return
  }

  updatePipelineData({
    originalContent: selected.text,
    rewrittenContent: selected.text
  })

  freeCreationModalVisible.value = false
  message.success('已确认最终文案')
  emit('navigate-step', 'rewrite')
}

// 6. 保存状态到 pipeline
const saveDraft = () => {
  const draft = createBenchmarkDraftSnapshot({
    activeTab: activeTab.value,
    ipBrainForm: { ...ipBrainForm },
    topicForm: { ...topicForm },
    freeCreationForm: { ...freeCreationForm },
    selectedTemplateId: selectedTemplateId.value,
    wordCountType: wordCountType.value,
    customWordCount: customWordCount.value,
    topicWordCountType: topicWordCountType.value,
    topicCustomWordCount: topicCustomWordCount.value
  })

  updatePipelineData({ benchmarkDraft: draft })
}

const restoreDraft = (draft) => {
  if (!draft) return
  const normalized = normalizeBenchmarkDraft(draft)
  activeTab.value = normalized.activeTab
  Object.assign(ipBrainForm, normalized.ipBrainForm)
  Object.assign(topicForm, normalized.topicForm)
  Object.assign(freeCreationForm, normalized.freeCreationForm)
  selectedTemplateId.value = normalized.selectedTemplateId
  wordCountType.value = normalized.wordCountType
  customWordCount.value = normalized.customWordCount
  topicWordCountType.value = normalized.topicWordCountType
  topicCustomWordCount.value = normalized.topicCustomWordCount
}

// 弹窗尺寸：宽度自适应父容器（90%，最大 1200），高度自适应视窗
const modalSize = reactive({ width: 960, minHeight: 480, maxHeight: 0 })
const modalStyle = reactive({ top: '20px', paddingBottom: 0 })

const modalBodyStyle = reactive({
  maxHeight: '581px',
  height: '581px'
})

const updateModalSize = () => {
  const el = benchmarkStepRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  // 宽度 90% 父容器，最大 1200px，最小 640px
  const width = Math.min(rect.width * 0.9, 1200)
  modalSize.width = Math.max(640, width)
  // 高度按视窗自适应，留 160px 给标题/底部操作 + 上下 padding
  modalSize.maxHeight = Math.max(420, window.innerHeight - 160)
}

// ----- 生命周期 -----
onMounted(async () => {
  // 加载 IP 档案
  await loadArchives()
  // 初始化模板选项
  await initTemplateOptions()

  if (pipeline.benchmarkDraft) {
    restoreDraft(pipeline.benchmarkDraft)
  }

  // 从 pipeline 恢复视频链接和提取内容
  if (pipeline.originalContent) {
    extractedContent.value = pipeline.originalContent
  }

  if (pipeline.videoLink) {
    videoLink.value = pipeline.videoLink
  }

  window.addEventListener('resize', updateModalSize)
  nextTick(updateModalSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateModalSize)
})

/**
 * 暴露给父组件（用于工作流验证）
 * 验证当前步骤是否符合要求
 * @returns {boolean} 是否符合要求
 */
const handleBeforeNext = () => {
  const result = validateBenchmarkBeforeNext({
    activeTab: activeTab.value,
    extractedContent: extractedContent.value,
    selectedKeywordTopic: selectedKeywordTopic.value,
    currentCreationResults: currentCreationResults.value,
    selectedFreeCreationId: selectedFreeCreationId.value,
    hasGeneratedCopyForSelectedTopic:
      (selectedKeywordTopic.value && topicGeneratedCopies.value.length > 0) ||
      (selectedKeywordTopic.value && ipGeneratedCopies.value.length > 0),
    isGeneratingCopy: currentCreationGenerating.value,
    updatePipelineData
  })

  if (result.success) {
    return true
  } else {
    message.warning(result.message)
    return false
  }
}

defineExpose({
  handleBeforeNext,
  closeAllOverlays: () => {
    ipAnalysisModalVisible.value = false
    keywordTopicModalVisible.value = false
    freeCreationModalVisible.value = false
  },
  handleAutoGenerate: () => {
    // 自动生成逻辑（由工作流触发）
  }
})

watch(
  [
    activeTab,
    ipBrainForm,
    topicForm,
    freeCreationForm,
    selectedTemplateId,
    wordCountType,
    customWordCount,
    topicWordCountType,
    topicCustomWordCount
  ],
  () => {
    saveDraft()
  },
  { deep: true }
)

// 监听 extractedContent 变化同步到 pipeline
watch(extractedContent, (val) => {
  updatePipelineData({ originalContent: val || '' })
})
</script>

<style>
.benchmark-step {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 22px;
  border-radius: 24px;
  background:
    radial-gradient(circle at 82% 8%,
      color-mix(in srgb, var(--theme-secondary) 12%, transparent),
      transparent 34%),
    linear-gradient(135deg, var(--theme-overlay-light), var(--theme-overlay-light));
  border: 1px solid var(--theme-overlay-light);
  box-shadow:
    inset 0 0 40px color-mix(in srgb, var(--theme-secondary) 6%, transparent),
    0 12px 34px var(--theme-shadow-dark);
  text-align: left;
  box-sizing: border-box;
}

.benchmark-step.executing {
  border-color: color-mix(in srgb, var(--theme-secondary) 45%, transparent);
  box-shadow:
    0 0 24px color-mix(in srgb, var(--theme-secondary) 20%, transparent),
    inset 0 0 34px color-mix(in srgb, var(--theme-secondary) 8%, transparent);
}

.benchmark-tabs .ant-tabs-nav {
  margin-bottom: 24px;
  padding: clamp(6px, calc(6px * var(--app-font-scale)), 9px);
  border-radius: 16px;
  background: color-mix(in srgb, var(--theme-background) 48%, transparent);
  border: 1px solid var(--theme-overlay-light);
}

.benchmark-tabs .ant-tabs-nav:before {
  display: none;
}

.benchmark-tabs .ant-tabs-tab {
  padding: clamp(9px, calc(9px * var(--app-font-scale)), 13px) clamp(18px, calc(18px * var(--app-font-scale)), 26px);
  border-radius: 12px;
  color: var(--theme-text-muted);
  transition: all 0.2s;
}

.benchmark-tabs .ant-tabs-tab-btn {
  font-size: var(--app-font-size-control);
  line-height: 1.35;
  font-weight: 800;
}

.benchmark-tabs .ant-tabs-tab:hover {
  color: var(--theme-text-primary);
  background: color-mix(in srgb, var(--theme-secondary) 12%, transparent);
}

.benchmark-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
  color: var(--theme-text-primary);
}

.benchmark-tabs .ant-tabs-tab-active {
  background: linear-gradient(90deg,
      color-mix(in srgb, var(--theme-secondary) 34%, transparent),
      color-mix(in srgb, var(--theme-primary) 18%, transparent));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--theme-secondary) 12%, transparent);
}

.benchmark-tabs .ant-tabs-ink-bar {
  display: none;
}

.benchmark-tabs,
.benchmark-tabs .ant-tabs-content,
.benchmark-tabs .ant-tabs-content-holder,
.benchmark-tabs .ant-tabs-tabpane {
  min-height: 0;
}

.benchmark-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.bottom-progress {
  margin-top: 14px;
  flex-shrink: 0;
}

.benchmark-tabs .ant-tabs-content-holder {
  flex: 1;
}

.benchmark-tabs .ant-tabs-content,
.benchmark-tabs .ant-tabs-tabpane {
  height: 100%;
}
</style>

<style>
.benchmark-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
  color: var(--theme-text-primary) !important;
}
</style>

<style scoped>
.feature-grid {
  display: grid;
  gap: 22px;
  height: 100%;
  min-height: 0;
}

.feature-grid.two-column {
  grid-template-columns: minmax(0, 0.96fr) minmax(0, 1.04fr);
}

.glass-card {
  padding: 22px;
  border-radius: 20px;
  background:
    radial-gradient(circle at 90% 0,
      color-mix(in srgb, var(--theme-secondary) 8%, transparent),
      transparent 38%),
    color-mix(in srgb, var(--theme-background) 76%, transparent);
  border: 1px solid var(--theme-overlay-light);
  box-shadow: inset 0 0 24px var(--theme-overlay-light);
  box-sizing: border-box;
}

.card-mini-title {
  margin-bottom: 16px;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title);
  font-weight: 800;
  letter-spacing: 0.2px;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  height: 24px;
  margin-bottom: 10px;
}

.clear-action.invisible {
  visibility: hidden;
  pointer-events: none;
}

.link-input-shell {
  height: 52px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 0 16px;
  border-radius: 12px;
  background: var(--theme-background-light);
  border: 1px solid color-mix(in srgb, var(--theme-info) 34%, transparent);
  box-shadow: inset 0 0 0 1px var(--theme-overlay-light);
  transition: all 0.2s;
}

.link-input-shell:focus-within {
  border-color: color-mix(in srgb, var(--theme-info) 70%, transparent);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--theme-primary) 16%, transparent),
    inset 0 0 0 1px var(--theme-overlay-light);
}

.link-input-icon {
  color: var(--theme-info);
  font-size: var(--app-font-size-section-title);
  flex-shrink: 0;
}

.link-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--theme-text-secondary);
  font-size: var(--app-font-size-body);
}

.link-input::-moz-placeholder {
  color: var(--theme-text-muted);
}

.link-input::placeholder {
  color: var(--theme-text-muted);
}

.paste-chip {
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 10px;
  background: var(--theme-surface-hover);
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-body);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.paste-chip:hover {
  background: var(--theme-background-card-alt);
}

.gradient-btn {
  border: none !important;
  color: var(--theme-text-primary) !important;
  background: linear-gradient(90deg, var(--theme-secondary), var(--theme-primary)) !important;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--theme-primary) 24%, transparent) !important;
}

.extract-btn {
  margin-top: 14px;
  height: 42px;
  border-radius: 12px !important;
}

.extract-divider {
  margin: 10px 0 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--theme-overlay-medium);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
}

.extract-divider:after,
.extract-divider:before {
  content: '';
  flex: 1;
  height: 1px;
  background: color-mix(in srgb, var(--theme-border-gray) 16%, transparent);
}

.extract-divider span {
  padding: 0 4px;
}

.platform-btn {
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  color: var(--theme-text-primary);
  cursor: pointer;
  font-weight: 800;
  font-size: var(--app-font-size-caption);
  line-height: 1;
  padding: 0;
  box-sizing: border-box;
  transition:
    transform 0.18s ease,
    filter 0.18s ease,
    box-shadow 0.18s ease;
}

.platform-btn:hover {
  transform: translateY(-2px) scale(1.08);
  filter: brightness(1.08);
  box-shadow: 0 8px 18px var(--theme-shadow-dark);
}

.platform-btn:active {
  transform: translateY(0) scale(0.96);
}

.douyin {
  background: var(--theme-gradient-surface-end);
  box-shadow: inset 0 0 0 1px var(--theme-overlay-light);
}

.kuaishou {
  background: linear-gradient(135deg, var(--theme-warning-dark), var(--theme-warning));
}

.xiaohongshu {
  background: var(--theme-platform-xiaohongshu);
}

.hint-line {
  margin-top: 14px;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  line-height: 1.7;
}

.media-extract-card {
  margin-top: 10px;
  padding: 12px 14px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--theme-background-light) 42%, transparent);
  border: 1px dashed color-mix(in srgb, var(--theme-info) 28%, transparent);
  cursor: pointer;
  transition: all 0.2s ease;
}

.media-extract-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--theme-info) 54%, transparent);
  background:
    radial-gradient(circle at 18% 0,
      color-mix(in srgb, var(--theme-primary-light) 28%, transparent),
      transparent 34%),
    color-mix(in srgb, var(--theme-background-light) 66%, transparent);
  box-shadow: 0 14px 30px color-mix(in srgb, var(--theme-background) 22%, transparent);
}

.media-extract-card.disabled {
  cursor: not-allowed;
  opacity: 0.65;
  transform: none;
}

.media-upload-plus {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-text-gradient-purple);
  background: transparent;
  box-shadow: none;
  font-size: var(--app-font-size-page-title);
}

.media-upload-copy {
  min-width: 0;
}

.media-upload-copy span {
  color: color-mix(in srgb, var(--theme-text-secondary) 86%, transparent);
  font-size: var(--app-font-size-meta);
  font-weight: 900;
}

.media-upload-copy p {
  margin: 4px 0 0;
  overflow: hidden;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.platform-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: auto;
  padding-top: 18px;
}

.platform-label {
  color: var(--theme-overlay-medium);
  font-size: var(--app-font-size-caption);
}

.form-card,
.result-card {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.result-card .original-textarea {
  flex: 1;
  height: 100% !important;
  min-height: 0 !important;
  resize: none;
}
</style>

<style>
.ip-brain-layout {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 22px;
}

.ip-brain-layout {
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
}

.archive-list-pane,
.ip-create-card {
  height: 100%;
  min-height: 0;
}

.ip-create-card {
  display: flex;
  flex-direction: column;
}

.archive-list-panel,
.ip-create-card {
  height: 100%;
  min-height: 0;
}

.archive-list-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin-bottom: 14px;
  color: var(--theme-text-primary);
  font-weight: 700;
}

.archive-count {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-meta);
  font-weight: 500;
}

.ip-helper {
  margin: 0 0 22px;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-meta);
  line-height: 1.8;
}

.learning-mode-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.learning-mode-card {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--theme-overlay-light);
  background: var(--theme-overlay-light);
  color: var(--theme-text-muted);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.learning-mode-card.active,
.learning-mode-card:hover {
  color: var(--theme-text-primary);
  border-color: color-mix(in srgb, var(--theme-secondary) 55%, transparent);
  background: linear-gradient(90deg,
      color-mix(in srgb, var(--theme-secondary) 20%, transparent),
      color-mix(in srgb, var(--theme-primary) 10%, transparent));
  box-shadow: 0 10px 22px color-mix(in srgb, var(--theme-secondary) 12%, transparent);
}

.mode-title {
  display: block;
  margin-bottom: 6px;
  font-size: var(--app-font-size-body);
  font-weight: 800;
}

.mode-desc {
  display: block;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  line-height: 1.6;
}

.archive-empty {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-orb {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  border-radius: 24px;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-page-title);
  background: linear-gradient(135deg, var(--theme-secondary), var(--theme-primary));
  box-shadow: 0 16px 36px color-mix(in srgb, var(--theme-secondary) 28%, transparent);
}

.archive-empty h4 {
  margin: 0 0 8px;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title);
}

.archive-empty p {
  margin: 0;
  color: var(--theme-text-muted);
}

.archives-grid {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: scroll;
  overflow-x: hidden;
  padding-right: 8px;
  scrollbar-gutter: stable;
}

.archive-list-panel .archives-grid {
  min-height: 0;
}

.archive-card,
.archive-picker-item,
.creation-card,
.topic-item {
  border-radius: 16px;
  background: color-mix(in srgb, var(--theme-background) 72%, transparent);
  border: 1px solid var(--theme-overlay-light);
}

.archive-card {
  position: relative;
  flex: 0 0 auto;
  padding: 16px;
  overflow: hidden;
  transition: all 0.22s ease;
}

.archive-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--theme-secondary) 38%, transparent);
  box-shadow: 0 12px 28px var(--theme-shadow-dark);
}

.archive-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.archive-avatar {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 15px;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title);
  font-weight: 900;
  background: linear-gradient(135deg, var(--theme-secondary), var(--theme-primary));
  box-shadow: 0 10px 22px color-mix(in srgb, var(--theme-secondary) 28%, transparent);
}

.archive-main {
  min-width: 0;
  flex: 1;
}

.archive-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.archive-name {
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-body);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archive-depth-tag {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  color: var(--theme-text-gradient-purple);
  background: color-mix(in srgb, var(--theme-secondary) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-secondary) 22%, transparent);
  font-size: var(--app-font-size-micro);
  font-weight: 700;
}

.archive-meta,
.archive-url {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
}

.archive-action-btn {
  flex-shrink: 0;
  height: 30px;
  padding: 0 12px !important;
  border-radius: 999px !important;
  font-weight: 700;
  font-size: var(--app-font-size-caption) !important;
}

.delete-icon {
  position: relative;
  color: var(--theme-text-muted);
  cursor: pointer;
  font-size: var(--app-font-size-body);
  transition: color 0.2s;
}

.archive-meta,
.archive-url {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
}

.archive-url {
  position: relative;
  margin-bottom: 14px;
  padding: 9px 11px;
  border-radius: 10px;
  background: var(--theme-overlay-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.2s,
    background 0.2s,
    border-color 0.2s;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 8px;
}
</style>

<style>
.benchmark-step .ant-form-item-label>label,
.benchmark-step .ant-input,
.benchmark-step .ant-input-number-input,
.benchmark-step .ant-select-selection-item,
.benchmark-step .ant-select-selection-placeholder,
.benchmark-step .ant-textarea textarea {
  color: var(--theme-text-secondary) !important;
}

.benchmark-step .ant-input,
.benchmark-step .ant-input-number,
.benchmark-step .ant-select-selector,
.benchmark-step .ant-textarea textarea {
  background: var(--theme-overlay-light) !important;
  border-color: var(--theme-overlay-light) !important;
}

.benchmark-step .ant-input-number-group-addon,
.benchmark-step .ant-input-number-handler,
.benchmark-step .ant-input-number-handler-down-inner,
.benchmark-step .ant-input-number-handler-up-inner {
  color: var(--theme-text-secondary) !important;
}

.benchmark-step .ant-input-number-handler-wrap {
  background: color-mix(in srgb, var(--theme-background-light) 72%, transparent) !important;
  border-left-color: var(--theme-overlay-light) !important;
}

.benchmark-step .ant-input-number-handler:hover .ant-input-number-handler-down-inner,
.benchmark-step .ant-input-number-handler:hover .ant-input-number-handler-up-inner {
  color: var(--theme-text-gradient-purple) !important;
}

.benchmark-step .ant-input::-moz-placeholder,
.benchmark-step .ant-textarea textarea::-moz-placeholder {
  color: var(--theme-text-muted) !important;
}

.benchmark-step .ant-input::placeholder,
.benchmark-step .ant-textarea textarea::placeholder {
  color: var(--theme-text-muted) !important;
}

.benchmark-modal .ant-modal-content,
.benchmark-modal .ant-modal-header {
  background: var(--theme-background) !important;
}

.benchmark-modal .ant-empty-description,
.benchmark-modal .ant-form-item-label>label,
.benchmark-modal .ant-modal-close,
.benchmark-modal .ant-modal-title,
.benchmark-modal .ant-radio-wrapper {
  color: var(--theme-text-secondary) !important;
}

.benchmark-step .ant-modal-root {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.benchmark-step .ant-modal-mask {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: color-mix(in srgb, var(--theme-background) 66%, transparent);
  backdrop-filter: blur(8px);
  pointer-events: auto;
}

.benchmark-step .benchmark-modal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 24px;
  pointer-events: auto;
}

.benchmark-step .benchmark-modal .ant-modal {
  top: auto;
  max-width: none;
  margin: 0;
  padding-bottom: 0;
}

.benchmark-step .benchmark-modal .ant-modal-body {
  overflow: auto;
}

.word-count-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

<style>
.modal-loading {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.analysis-box {
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--theme-background) 72%, transparent);
  border: 1px solid var(--theme-overlay-light);
}

.analysis-box h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  color: var(--theme-text-primary);
}

.analysis-box p {
  margin: 0;
  color: var(--theme-text-muted);
  white-space: pre-wrap;
  line-height: 1.7;
}

.analysis-content {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topic-list {
  display: grid;
  gap: 10px;
  min-height: 0;
}

.analysis-content>.topic-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
}

.topic-scroll {
  max-height: 420px;
  overflow-y: auto;
  padding-right: 6px;
}

.topic-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  min-height: 50px;
  color: var(--theme-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.topic-item.selected,
.topic-item:hover {
  color: var(--theme-text-primary);
  border-color: color-mix(in srgb, var(--theme-secondary) 55%, transparent);
  background: color-mix(in srgb, var(--theme-secondary) 14%, transparent);
  transform: translateX(4px);
}

.topic-index {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--theme-secondary), var(--theme-primary));
  color: var(--theme-text-primary);
  font-weight: 800;
}

.topic-item em {
  margin-left: auto;
  color: var(--theme-text-gradient-purple);
  font-style: normal;
  font-size: var(--app-font-size-meta);
  white-space: nowrap;
}
</style>

<style>
.creation-modal-layout {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.creation-results {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 4px;
}

.creation-results.two {
  grid-template-columns: repeat(2, 1fr);
}

.creation-card {
  height: 100%;
  min-height: 0;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.creation-card.selected,
.creation-card:hover {
  border-color: color-mix(in srgb, var(--theme-secondary) 55%, transparent);
  background: color-mix(in srgb, var(--theme-secondary) 12%, transparent);
}

.creation-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: var(--theme-text-primary);
  font-weight: 700;
}

.selected-icon {
  color: var(--theme-secondary);
}

.creation-text {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  color: var(--theme-text-muted);
  line-height: 1.7;
  white-space: pre-wrap;
}

.cursor {
  animation: blink-a7ad1a5c 1s infinite;
}

.modal-actions {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--theme-overlay-light);
}
</style>
