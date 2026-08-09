/**
 * 模块 emoji 字典
 *
 * 设计规范要求 emoji 仅作为模块入口标识 / 空状态提示使用，
 * 不允许在按钮、label、卡片标题旁作装饰。
 *
 * 详见 docs/DESIGN_SYSTEM.md §4.1
 */

export const moduleEmoji = {
  // studio 模块
  source:       '🎬',
  subtitle:     '💬',
  title:        '🎯',
  namecard:     '🪪',
  bgm:          '🎵',
  mixcut:       '✂️',
  soundEffect:  '🔊',

  // 顶导航 / 主菜单
  avatar:       '🧑',
  voice:        '🎙️',
  material:     '🗂️',
  setting:      '⚙️',
  task:         '📋',
  home:         '🏠',

  // 操作类（仅在空状态 / 简短提示使用）
  empty:        '📭',
  success:      '✅',
  warning:      '⚠️',
  error:        '❌'
}

export default moduleEmoji