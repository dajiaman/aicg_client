/**
 * validateBenchmarkBeforeNext
 * 验证 BenchmarkStudy 组件当前步骤是否满足进入下一步的条件
 *
 * 根据当前激活的 Tab（activeTab）执行不同的验证逻辑：
 * - extract: 必须有提取的文案内容
 * - ipBrain: 必须从 IP 大脑生成了文案并选择了其中一条
 * - keyword: 必须选择了选题并生成了文案
 * - freeCreate: 必须生成了自由创作文案并选择了其中一条
 *
 * 验证通过后，会将选中的文案更新到 pipeline 中
 */

// ----- 核心函数 -----

/**
 * 验证 BenchmarkStudy 是否可以进入下一步
 */
export function validateBenchmarkBeforeNext(params) {
  const {
    activeTab,
    extractedContent,
    selectedKeywordTopic,
    currentCreationResults,
    selectedFreeCreationId,
    hasGeneratedCopyForSelectedTopic,
    isGeneratingCopy,
    updatePipelineData
  } = params

  // ===== 1. 提取模式 =====
  if (activeTab === 'extract') {
    const content = extractedContent?.trim()
    if (!content) {
      return {
        success: false,
        message: '请先提取文案内容'
      }
    }

    // 更新 pipeline
    updatePipelineData({
      originalContent: content,
      rewrittenContent: content
    })

    return {
      success: true,
      nextStepKey: 'rewrite'
    }
  }

  // ===== 2. IP大脑模式 =====
  if (activeTab === 'ipBrain') {
    // 正在生成中，不允许跳转
    if (isGeneratingCopy) {
      return {
        success: false,
        message: 'AI正在生成文案，请稍候...'
      }
    }

    // 检查是否有任何文案结果（且不为空）
    const hasResults = currentCreationResults.some((r) => r.text?.trim())
    if (!hasResults) {
      return {
        success: false,
        message: '请先生成文案'
      }
    }

    // 检查是否选中了一条文案
    if (!selectedFreeCreationId) {
      return {
        success: false,
        message: '请先选择一条文案'
      }
    }

    // 查找选中的结果
    const selected = currentCreationResults.find((r) => r.id === selectedFreeCreationId)
    if (!selected || !selected.text?.trim()) {
      return {
        success: false,
        message: '选中的文案内容为空，请重新选择'
      }
    }

    // 更新 pipeline
    updatePipelineData({
      originalContent: selected.text,
      rewrittenContent: selected.text
    })
    return {
      success: true,
      nextStepKey: 'rewrite'
    }
  }

  // ===== 3. 关键词选题模式 =====
  if (activeTab === 'keyword') {
    // 正在生成中，不允许跳转
    if (isGeneratingCopy) {
      return {
        success: false,
        message: 'AI正在生成文案，请稍候...'
      }
    }

    // 必须选择一个选题
    if (!selectedKeywordTopic) {
      return {
        success: false,
        message: '请先选择一个选题'
      }
    }

    // 必须为当前选题生成了文案
    if (!hasGeneratedCopyForSelectedTopic) {
      return {
        success: false,
        message: '请先生成文案'
      }
    }

    // 检查是否选中了一条文案
    if (!selectedFreeCreationId) {
      return {
        success: false,
        message: '请先选择一条文案'
      }
    }

    // 查找选中的结果
    const selected = currentCreationResults.find((r) => r.id === selectedFreeCreationId)
    if (!selected || !selected.text?.trim()) {
      return {
        success: false,
        message: '选中的文案内容为空，请重新选择'
      }
    }

    // 更新 pipeline
    updatePipelineData({
      originalContent: selected.text,
      rewrittenContent: selected.text
    })
    return {
      success: true,
      nextStepKey: 'rewrite'
    }
  }

  // ===== 4. 自由创作模式 =====
  if (activeTab === 'freeCreate') {
    // 正在生成中，不允许跳转
    if (isGeneratingCopy) {
      return {
        success: false,
        message: 'AI正在生成文案，请稍候...'
      }
    }

    // 检查是否有任何文案结果（且不为空）
    const hasResults = currentCreationResults.some((r) => r.text?.trim())
    if (!hasResults) {
      return {
        success: false,
        message: '请先生成文案'
      }
    }

    // 检查是否选中了一条文案
    if (!selectedFreeCreationId) {
      return {
        success: false,
        message: '请先选择一条文案'
      }
    }

    // 查找选中的结果
    const selected = currentCreationResults.find((r) => r.id === selectedFreeCreationId)
    if (!selected || !selected.text?.trim()) {
      return {
        success: false,
        message: '选中的文案内容为空，请重新选择'
      }
    }

    // 更新 pipeline
    updatePipelineData({
      originalContent: selected.text,
      rewrittenContent: selected.text
    })
    return {
      success: true,
      nextStepKey: 'rewrite'
    }
  }

  // ===== 未知模式（兜底） =====
  return {
    success: false,
    message: '请先完成当前步骤并确认文案'
  }
}
