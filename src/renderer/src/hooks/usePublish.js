import { computed, onMounted, ref } from 'vue'
import { usePipeline } from './usePipeline'
import { usePermission } from './usePermission'
import { message } from 'ant-design-vue'

/**
 * 规范化 URL
 */
function normalizeUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
    return url
  }
  return 'file://' + url.replace(/\\/g, '/')
}

/**
 * 清理标签：移除 # 前缀，去除首尾空白
 */
function cleanTag(tag) {
  return String(tag || '')
    .replace(/^#+/, '')
    .trim()
}

export function usePublish() {
  const { pipeline, updatePipelineData, notifyStepError, notifyStepComplete, notifyStepStart } =
    usePipeline()
  const { checkFullPermission } = usePermission()

  // 加载状态
  const loading = ref(false)
  // 账号加载状态
  const accountsLoading = ref(false)

  // 发布视频地址
  const publishVideoPath = ref('')

  // 发布内容
  const publishTitle = ref('')
  const publishDescription = ref('')
  const publishTags = ref([])

  const publishMode = ref('draft') // 'draft' | 'direct'
  const autoCloseBrowser = ref(false)

  // 封面
  const coverPath = ref('')
  const coverPreviewSrc = ref('')
  const coverPreviewOpen = ref(false)

  const tagInput = ref('')

  // 选中的账户Id
  const selectedAccounts = ref([])
  const accountOptions = ref([]) // 分组后的账号列表

  const progressText = ref('')

  const addAccountModalOpen = ref(false)
  const addingAccount = ref(false)
  const createdAccountId = ref('')
  const loginAccountLoading = ref(false)

  const allAccounts = ref([])

  // 支持的平台
  const supportedPlatforms = ref([
    { id: 'douyin', name: '某音' },
    { id: 'kuaishou', name: '某手' },
    { id: 'xiaohongshu', name: '某书' },
    { id: 'wx_channels', name: '蝴蝶号' }
  ])

  // 新账号
  const newAccount = ref({
    platform: undefined,
    account_name: '',
    display_name: ''
  })

  // 获取平台显示名称
  const getPlatformDisplayName = (platformName) => {
    const find = supportedPlatforms.value.find((a) => {
      return a.key === platformName
    })

    return find?.name || platformName
  }

  // 获取平台颜色
  const getPlatformColor = (platformName) => {
    const map = {
      douyin: '#1E1E1E',
      kuaishou: '#FF6600',
      bilibili: '#FB7299',
      xiaohongshu: '#FE2C55',
      xigua: '#1E9D1E',
      wx_channels: '#07C160'
    }
    return map[platformName] || '#888'
  }

  // 获取平台徽章文本（单个字符）
  const getPlatformBadgeText = (platformName) => {
    const map = {
      douyin: '抖',
      kuaishou: '快',
      xiaohongshu: '书',
      bilibili: 'B',
      xigua: '西',
      wx_channels: '微'
    }
    return map[platformName] || platformName[0] || '?'
  }

  // 检查账号是否已选中
  const isAccountSelected = (id) => selectedAccounts.value.includes(id)

  // 切换账号选中状态
  const toggleAccountSelected = (id) => {
    if (selectedAccounts.value.includes(id)) {
      selectedAccounts.value = selectedAccounts.value.filter((i) => i !== id)
    } else {
      selectedAccounts.value = [...selectedAccounts.value, id]
    }
  }

  // 加载账号列表
  const loadAccounts = async () => {
    accountsLoading.value = true
    try {
      const result = await window.api.account.list({ status: 'active', pageSize: 100 })
      console.log('result', result)
      if (result.success && result.data) {
        allAccounts.value = result.data
      } else {
        allAccounts.value = []
      }
      console.log('allAccounts', allAccounts.value)
    } catch (e) {
      console.error('加载账号失败:', e)
    } finally {
      accountsLoading.value = false
    }
  }

  /**
   * 加载支持平台列表
   */
  const loadSupportPlatforms = async () => {
    const res = await window.api.account.getSupportedPlatforms()
    if (res.success) {
      supportedPlatforms.value = res.data
    }
  }

  /**
   * handleSelectVideo
   * @returns
   */
  const handleSelectVideo = async () => {
    try {
      const result = await window.api.file.selectFile({
        title: '选择发布视频',
        filters: [{ name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'mkv', 'flv', 'webm'] }],
        defaultPath: publishVideoPath.value || undefined
      })
      if (result.success && !result.data.canceled && result.data.filePaths.length) {
        const path = result.data.filePaths[0]
        publishVideoPath.value = path
        updatePipelineData({ publishVideoPath: path })
        message.success('发布视频选择成功')
        return { success: true, data: path }
      }
    } catch (e) {
      console.error('选择视频失败：' + e.message)
    }
    return { success: false }
  }

  /**
   * 选择封面图片
   * @returns {Promise<{success: boolean, data: string}>}
   */
  const handleSelectCover = async () => {
    try {
      const result = await window.api.file.selectFile({
        title: '选择封面图片',
        filters: [{ name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
      })
      if (result.success && !result.data.canceled && result.data.filePaths.length) {
        const path = result.data.filePaths[0]
        const url = normalizeUrl(path)
        coverPath.value = path
        coverPreviewSrc.value = url
        updatePipelineData({ coverPath: path, coverUrl: url })
        message.success('封面选择成功')
        return {
          success: true,
          data: {
            path,
            url
          }
        }
      }
    } catch (err) {
      console.error('选择封面失败:', err)
      message.error('选择封面失败：' + err.message)
      return { success: false, error: err.message }
    }
  }

  /**
   * 一键发布视频
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const handlePublish = async () => {
    if (!checkFullPermission('一键发布')) {
      message.error('没有权限')
      return
    }

    if (!canPublish.value) {
      if (!publishVideoPath.value) message.warning('请选择发布视频')
      else if (!publishTitle.value) message.warning('请输入发布标题')
      else if (selectedAccounts.value.length === 0) message.warning('请选择至少一个发布账号')
      return
    }

    loading.value = true
    progressText.value = '正在发布视频...'

    let successCount = 0
    let failCount = 0

    try {
      // 获取所有选中账号的详细信息
      const selected = allAccounts.value.filter((acc) => selectedAccounts.value.includes(acc.id))

      if (selected.length === 0) {
        throw new Error('未找到选中的账号')
      }

      // 构建标签字符串
      const tagString = publishTags.value.map((t) => '#' + t).join(' ')
      const description = (publishDescription.value + (tagString ? '\n' + tagString : '')).trim()

      // 开始
      notifyStepStart('publish')

      for (const account of selected) {
        try {
          const payload = {
            accountId: String(account.id),
            platform: String(account.platform),
            videoPath: String(publishVideoPath.value),
            title: String(publishTitle.value),
            description: description,
            tags: publishTags.value,
            isDraft: publishMode.value === 'draft',
            coverPath: coverPath.value ? String(coverPath.value).replace(/^file:\/\//, '') : '',
            autoCloseBrowser: publishMode.value === 'direct' && autoCloseBrowser.value
          }

          progressText.value = `正在发布到 ${getPlatformDisplayName(account.platform)}...`

          const result = await window.api.publish.publishVideo(JSON.parse(JSON.stringify(payload)))
          console.log('发布结果：', result)
          if (result.success) {
            successCount++
            message.success(`✅ 发布成功: ${account.account_name}`)
          } else {
            failCount++
            message.error(`❌ 发布失败: ${account.account_name} - ${result.error || '未知错误'}`)
          }
        } catch (err) {
          failCount++
          console.error(`发布到 ${account.account_name} 异常:`, err)
          message.error(`❌ 发布异常: ${account.account_name} - ${err.message}`)
        }
      }

      // 显示总结
      if (successCount > 0 && failCount === 0) {
        message.success(`🎉 全部发布成功！共 ${successCount} 个账号`)
        updatePipelineData({ publishCompleted: true })
        notifyStepComplete('publish', { successCount, failCount })
      } else if (successCount > 0 && failCount > 0) {
        message.warning(`部分发布成功：成功 ${successCount} 个，失败 ${failCount} 个`)
        notifyStepComplete('publish', { successCount, failCount, partial: true })
      } else {
        message.error(`❌ 全部发布失败！共 ${failCount} 个账号`)
        notifyStepError('publish', new Error(`全部发布失败`))
      }

      progressText.value = successCount > 0 ? '发布完成！' : '发布失败'
      setTimeout(() => {
        progressText.value = ''
      }, 3000)
    } catch (err) {
      console.error('发布过程出错:', err)
      message.error('发布过程出错：' + err.message)
      notifyStepError('publish', err)
      progressText.value = '发布失败'
      setTimeout(() => {
        progressText.value = ''
      }, 3000)
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加新账号
   */
  const submitAddAccount = async () => {
    if (!newAccount.value.platform || !newAccount.value.account_name) {
      message.warning('请填写必要信息')
      return
    }
    addingAccount.value = true
    try {
      const result = await window.api.account.create({
        platform: newAccount.value.platform,
        account_name: newAccount.value.account_name,
        display_name: newAccount.value.display_name
      })
      console.log('result:', result)
      if (result.success) {
        message.success(result.message || '添加账号成功')
        createdAccountId.value = result.data?.id
        // 刷新账号列表
        await loadAccounts()

        // 如果返回了 id 则自动选中
        if (createdAccountId.value) {
          selectedAccounts.value = [...selectedAccounts.value, createdAccountId.value]
        }

        // closeAddAccountModal()
      } else {
        message.error(result.error || '添加账号失败')
      }
    } catch (e) {
      message.error('添加账号失败：' + e.message)
    } finally {
      addingAccount.value = false
    }
  }

  /**
   * 登录新创建的账号
   */
  const setupLoginForCreatedAccount = async () => {
    if (!createdAccountId.value) return
    loginAccountLoading.value = true
    try {
      const result = await window.api.account.setupLogin(createdAccountId.value)
      if (result.success) {
        message.success(result.message || '账号登录完成')
        await loadAccounts()
        closeAddAccountModal()
      } else {
        message.error(result.error || '登录账号失败')
      }
    } catch (e) {
      message.error('登录账号失败：' + e.message)
    } finally {
      loginAccountLoading.value = false
    }
  }

  /**
   * 移除发布标签
   */
  const removeTag = (tag) => {
    publishTags.value = publishTags.value.filter((t) => t !== tag)
    updatePipelineData({ publishTags: publishTags.value })
  }

  /**
   * 处理标签输入框的退格事件
   */
  function handleTagBackspace(e) {
    if (e.target.value === '' && publishTags.value.length > 0) {
      publishTags.value = publishTags.value.slice(0, -1)
      updatePipelineData({ publishTags: publishTags.value })
    }
  }

  /**
   * 从输入框添加发布标签
   */
  const addTagFromInput = () => {
    const tag = cleanTag(tagInput.value)
    if (tag && !publishTags.value.includes(tag)) {
      publishTags.value = [...publishTags.value, tag]
      updatePipelineData({ publishTags: publishTags.value })
    }
    tagInput.value = ''
  }

  /**
   * 计算属性：是否选中了小红书账号
   */
  const hasXiaohongshuInSelection = computed(() => {
    const selected = allAccounts.value.filter((acc) => selectedAccounts.value.includes(acc.id))
    return selected.some((acc) => acc.platform === 'xiaohongshu')
  })

  /**
   * 计算属性：是否可以发布
   */
  const canPublish = computed(() => {
    return selectedAccounts.value.length > 0 && !!publishVideoPath.value && !!publishTitle.value
  })

  /**
   * 打开/关闭添加账号弹窗
   */
  const openAddAccountModal = () => {
    newAccount.value = { platform: '', account_name: '', display_name: '' }
    createdAccountId.value = ''
    addAccountModalOpen.value = true
  }

  /**
   * 关闭添加账号弹窗
   */
  const closeAddAccountModal = () => {
    addAccountModalOpen.value = false
    createdAccountId.value = ''
  }

  /**
   * 打开关闭封面预览弹窗
   */
  const openCoverPreview = () => {
    if (coverPreviewSrc.value) {
      coverPreviewOpen.value = true
    }
  }

  /**
   * 关闭封面预览弹窗
   */
  const closeCoverPreview = () => {
    coverPreviewOpen.value = false
  }

  /**
   * 处理封面预览加载错误
   */
  const handleCoverPreviewError = () => {
    coverPreviewSrc.value = ''
    coverPath.value = ''
    message.error('封面图片加载失败，请检查文件路径')
  }

  /**
   * 视频路径相关计算
   */
  const displayVideoPath = computed(() => publishVideoPath.value)

  /**
   * 计算属性：视频名称
   */
  const displayVideoName = computed(() => {
    if (!displayVideoPath.value) return ''
    return displayVideoPath.value.split(/[\\/]/).pop() || ''
  })

  /**
   * 计算属性：视频预览路径
   */
  const displayVideoSrc = computed(() => {
    const path = displayVideoPath.value
    if (!path) return ''
    return path.startsWith('http') ? path : 'file://' + path
  })

  /**
   * 从管道数据恢复发布状态
   */
  const restoreFromPipeline = () => {
    const pl = pipeline || {}

    // 发布视频
    if (pl.publishVideoPath) publishVideoPath.value = pl.publishVideoPath
    if (pl.publishTitle) publishTitle.value = pl.publishTitle
    if (pl.publishDescription) publishDescription.value = pl.publishDescription
    if (pl.publishTags && Array.isArray(pl.publishTags)) {
      publishTags.value = [...pl.publishTags]
    }

    if (pl.coverPath) {
      coverPath.value = pl.coverPath
      coverPreviewSrc.value = normalizeUrl(pl.coverPath)
    }

    if (pl.selectedAccounts && Array.isArray(pl.selectedAccounts)) {
      selectedAccounts.value = [...pl.selectedAccounts]
    }

    if (pl.publishMode) publishMode.value = pl.publishMode
    if (pl.autoCloseBrowser !== undefined) autoCloseBrowser.value = pl.autoCloseBrowser

    if (pl.sourceVideoPath) {
      publishVideoPath.value = pl.sourceVideoPath
    }
  }

  const setPublishMode = (mode) => {
    publishMode.value = mode
  }

  function init() {
    restoreFromPipeline()
    loadSupportPlatforms()
    loadAccounts()
  }

  onMounted(() => {
    init()
  })

  return {
    // 状态
    loading,
    publishVideoPath,
    selectedAccounts,
    accountOptions,
    accountsLoading,
    publishTitle,
    publishDescription,
    publishMode,
    autoCloseBrowser,
    coverPath,
    coverPreviewOpen,
    tagInput,
    publishTags,
    progressText,
    addAccountModalOpen,
    addingAccount,
    createdAccountId,
    loginAccountLoading,
    supportedPlatforms,
    newAccount,
    // 计算属性
    allAccounts,
    hasXiaohongshuInSelection,
    canPublish,
    displayVideoPath,
    displayVideoName,
    displayVideoSrc,
    coverPreviewSrc,

    // 方法
    loadAccounts,
    handleSelectVideo,
    handleSelectCover,
    openCoverPreview,
    closeCoverPreview,
    handleCoverPreviewError,
    handlePublish,
    setPublishMode,

    getPlatformDisplayName,
    getPlatformColor,
    getPlatformBadgeText,
    isAccountSelected,
    toggleAccountSelected,

    submitAddAccount,
    setupLoginForCreatedAccount,
    openAddAccountModal,
    closeAddAccountModal,

    removeTag,
    handleTagBackspace,
    addTagFromInput
  }
}
