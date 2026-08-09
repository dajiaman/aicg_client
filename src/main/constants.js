export const SUPPORTED_PLATFORMS = [
  {
    key: 'douyin',
    name: '某音'
  },
  {
    key: 'kuaishou',
    name: '某手'
  },
  {
    key: 'wx_channels',
    name: '蝴蝶号'
  },
  {
    key: 'xiaohongshu',
    name: '小某书'
  }
]

// 默认模板
export const DEFAULT_TEMPLATE = {
  bgm_category: '',
  content_prompts: {
    subtitles: '请分析以下字幕内容，提取关键词并选择动画效果'
  },
  description: '默认模板（选择这个则根据字幕设置来生成）',
  global_elements: {},
  keyframes: {
    animation_options: []
  },
  pip_config: {
    position: 'center',
    scale: 1
  },
  project_settings: {
    fps: 30,
    background: '#000000',
    duration: 0,
    width: 1074,
    height: 1920
  },
  subtitle_config: {
    animation_options: ['fade_in'],
    position: [540, 1500],
    style: {
      fontSize: 48,
      fontFamily: '微软雅黑',
      color: '#FFFFFF'
    }
  },
  template_id: 'default',
  version: '1'
}
