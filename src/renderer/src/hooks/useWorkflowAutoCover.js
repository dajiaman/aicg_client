/**
 * 判断是否应该在从 videoEdit 跳转到 titleCover 时自动生成封面。
 *
 * @param params - 包含当前步骤、目标步骤及全局 pipeline 数据
 * @returns 若返回 true，则表示需要自动生成封面；false 表示不需要。
 */
export function shouldAutoGenerateCoverAfterNext(params) {
  const { fromKey, toKey, pipeline } = params

  // 只有从 'videoEdit' 跳转到 'titleCover' 时才可能自动生成
  if (fromKey !== 'videoEdit' || toKey !== 'titleCover') {
    return false
  }

  // 检查是否已存在标题相关数据
  const hasTitle = !!(pipeline.publishTitle || pipeline.coverTitleMain || pipeline.coverTitleSub)

  // 检查是否已存在封面相关数据（路径或设计器配置）
  const hasCover = !!(pipeline.coverPath || pipeline.coverUrl || pipeline.coverDesignerConfig)

  // 如果既没有标题也没有封面，则返回 true（需要自动生成）
  return !hasTitle && !hasCover
}
