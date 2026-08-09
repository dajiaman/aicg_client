/**
 * useWorkflowTargetStatus
 * 获取当前步骤的完成状态（目标名称、状态标签、是否完成、预览内容）
 */

/**
 * 工具：将任意值转为字符串
 */
function toString(value) {
  return String(value || '')
}

/**
 * 主函数：获取工作流目标状态
 */
export function useWorkflowTargetStatus({ activeKey, pipeline, stepState = {} }) {
  const hasContent = (str) => !!String(str || '').trim()

  const getExtractStatus = (pipelineData) => {
    const original = pipelineData.originalContent || ''
    console.log('original', original)
    const rewritten = pipelineData.rewrittenContent || ''
    const hasOriginal = hasContent(original)
    const hasRewritten = hasContent(rewritten)
    const confirmed = !!hasOriginal && !!hasRewritten
    const label = confirmed ? '已确认' : '未确认'
    const preview = original || rewritten || ''
    return buildStatus('当前文案', confirmed, label, preview)
  }

  /**
   * 构建标准状态对象
   */
  function buildStatus(target, confirmed, label, preview = '') {
    return {
      target,
      label,
      confirmed,
      preview
    }
  }

  // 2. 通用步骤（使用 pipeline 中某个字段判断）
  const getGenericStatus = (
    target,
    fieldKey,
    completeLabel,
    incompleteLabel,
    previewField = fieldKey
  ) => {
    const value = pipeline[fieldKey] || ''
    const preview = pipeline[previewField] || ''
    const confirmed = hasContent(value)
    const label = confirmed ? completeLabel : incompleteLabel
    return buildStatus(target, confirmed, label, preview)
  }

  // ----- benchmark（对标学习） -----
  if (activeKey === 'benchmark') {
    return getExtractStatus(pipeline)
  }

  // ----- rewrite（文案改写） -----
  if (activeKey === 'rewrite') {
    return getGenericStatus('改写文案', 'rewrittenContent', '已填写', '未填写', 'rewrittenContent')
  }

  // ----- voiceClone（声音生成） -----
  if (activeKey === 'voiceClone') {
    // 只要有克隆音频路径或URL即视为已完成
    const audioPath = pipeline.clonedAudioPath || pipeline.clonedAudioUrl || ''
    const audioConfirmed = hasContent(audioPath)
    return buildStatus('当前音频', audioConfirmed, audioConfirmed ? '已生成' : '未生成')
  }

  // ----- digitalHuman（数字人视频） -----
  if (activeKey === 'digitalHuman') {
    return getGenericStatus('当前视频', 'generatedVideoPath', '已生成', '未生成', '')
  }

  // ----- videoEdit（视频剪辑） -----
  if (activeKey === 'videoEdit') {
    return getGenericStatus('剪辑结果', 'previewVideoPath', '已生成', '未生成')
  }

  // ----- titleCover（标题封面） -----
  if (activeKey === 'titleCover') {
    // 封面步骤：判断是否有封面且未脏
    const coverPath = pipeline.coverPath || pipeline.coverUrl || ''
    const hasCover = stepState.hasCover !== undefined ? !!stepState.hasCover : hasContent(coverPath)
    const isDirty = !!stepState.coverDirty
    const confirmed = hasCover && !isDirty
    const label = confirmed ? '已完成' : '未生成'
    return buildStatus('标题封面', confirmed, label, '')
  }

  // ----- publish（一键发布） -----
  if (activeKey === 'publish') {
    // 发布步骤：检查发布状态或发布完成标记
    const publishStatus = pipeline.publishStatus || ''
    const isCompleted = publishStatus === 'success' || !!pipeline.publishCompleted
    const label = isCompleted ? '已发布' : '未发布'
    return buildStatus('发布', isCompleted, label, '')
  }

  // ----- 默认（未知步骤） -----
  return buildStatus('未知步骤', false, '未完成', '')
}
