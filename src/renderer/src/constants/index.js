// 字幕模板预设
export const subtitleStylePresets = [
  {
    id: 'yellow_white_split',
    name: '黄白裂开',
    description: '上下分层，黄色主句 + 白色副句',
    preview: ['主次分明', '强调'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: ['bold'],
      color: '#FDF084',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 2,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.4, // 增大行高以分隔
      positionX: 540,
      positionY: 1742,
      animations: ['fade_in'],
      videoOrientation: 'vertical'
    }
  },
  {
    id: 'yellow_white_italic',
    name: '黄白斜体',
    description: '黄白交替，逐字跳动感',
    preview: ['效率提升', '快速掌握'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: ['bold', 'italic'],
      color: '#FDF084',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 0,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 3,
      shadowColor: '#000000',
      shadowOpacity: 0.45,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0.7,
      lineHeight: 1.16,
      positionX: 540,
      positionY: 1742,
      animations: ['fade_in', 'slide_up'],
      videoOrientation: 'vertical'
    }
  },
  {
    id: 'yellow_white_calligraphy',
    name: '黄白书法',
    description: '书法字体，黄白渐变氛围',
    preview: ['人生建议', '每日一句'],
    source: 'newClip',
    config: {
      fontFamily: '三极行楷简体',
      fontSize: 58,
      fontStyles: [],
      color: '#FDF084',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: false,
      strokeWidth: 0,
      strokeColor: '#000000',
      enableShadow: true,
      shadowDistance: 4,
      shadowColor: '#000000',
      shadowOpacity: 0.4,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['fade_in']
    }
  },
  {
    id: 'yellow_white_bounce',
    name: '黄白弹跳',
    description: '黄白弹跳，活泼动感',
    preview: ['活泼可爱', '逐字弹跳'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: ['bold'],
      color: '#FDF084',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 2,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['bounce']
    }
  },
  {
    id: 'yellow_box_white',
    name: '黄底白字',
    description: '黄色背景框，打字机表达',
    preview: ['重点来了', '关键结论'],
    source: 'newClip',
    config: {
      fontFamily: '黑体',
      fontSize: 56,
      fontStyles: ['bold'],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: false,
      strokeWidth: 0,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'solid',
      backgroundColor: '#FFD83B',
      backgroundOpacity: 0.95,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['typewriter']
    }
  },

  {
    id: 'white_pinyin',
    name: '白色注音',
    description: '白色大字，带拼音注音',
    preview: ['注音', '学习'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: ['bold'],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: false,
      strokeWidth: 0,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['fade_in']
    }
  },

  {
    id: 'variety_wave',
    name: '综艺波浪',
    description: '综艺波浪，逐字入场',
    preview: ['综艺效果', '太有意思了'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: ['bold'],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 3,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['wave']
    }
  },

  {
    id: 'simple_brown_white',
    name: '棕白简约',
    description: '棕色描边，白色字体，适合质感口播',
    preview: ['质感', '口播'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: [],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 2,
      strokeColor: '#8B5A2B', // 棕色
      enableShadow: true,
      shadowDistance: 3,
      shadowColor: '#5A351F',
      shadowOpacity: 0.5,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['fade_in']
    }
  },

  {
    id: 'simple_yellow_white',
    name: '简约黄白',
    description: '黄白配色，基础简洁',
    preview: ['简洁', '直接'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 54,
      fontStyles: [],
      color: '#FDF084',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: false,
      strokeWidth: 0,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#ffffff',
      backgroundOpacity: 1,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['fade_in']
    }
  },

  {
    id: 'scrolling_4lines',
    name: '四行滚动',
    description: '四行显示，当前行高亮',
    preview: ['滚动字幕', '重要信息'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 48,
      fontStyles: [],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: false,
      strokeWidth: 0,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'solid',
      backgroundColor: '#000000',
      backgroundOpacity: 0.28,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['scroll']
    }
  },

  {
    id: 'simple_blue_white',
    name: '蓝白简约',
    description: '蓝白配色，适合知识科普',
    preview: ['知识科普', '深度分析'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: [],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 2,
      strokeColor: '#2775FF',
      enableShadow: true,
      shadowDistance: 3,
      shadowColor: '#1A2A54',
      shadowOpacity: 0.5,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['fade_in']
    }
  },

  {
    id: 'scrolling_3lines',
    name: '三行滚动',
    description: '三行滚动，当前行高亮',
    preview: ['三行重点', '当前高亮'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 52,
      fontStyles: [],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: false,
      strokeWidth: 0,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'solid',
      backgroundColor: '#000000',
      backgroundOpacity: 0.22,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['scroll']
    }
  },

  {
    id: 'red_yellow',
    name: '红黄字幕',
    description: '红黄配色，短视频冲击感',
    preview: ['注意看', '重点来了'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: ['bold'],
      color: '#FDF084',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 3,
      strokeColor: '#A30023',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1500,
      animations: ['fade_in']
    }
  },
  {
    id: 'red_blue_science',
    name: '红蓝科普',
    description: '红蓝交替，适合科普讲解',
    preview: ['科学', '科普'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: [],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 2,
      strokeColor: '#FF3D2E',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['fade_in']
    }
  },

  {
    id: 'purple_slide',
    name: '紫色滑块',
    description: '紫色滑块背景，逐字显示',
    preview: ['高亮', '核心技巧'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: [],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: false,
      strokeWidth: 0,
      strokeColor: '#000000',
      enableShadow: true,
      shadowDistance: 3,
      shadowColor: '#000000',
      shadowOpacity: 0.45,
      backgroundType: 'solid',
      backgroundColor: '#7C3AED', // 紫色
      backgroundOpacity: 0.88,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['slide_up'] // 逐字滑动
    }
  },

  {
    id: 'cartoon_yellow',
    name: '卡通黄白',
    description: '卡通字体，黄白配色',
    preview: ['卡通风格', '很有趣'],
    source: 'newClip',
    config: {
      fontFamily: '三极行楷简体',
      fontSize: 58,
      fontStyles: [],
      color: '#FFE66D',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 3,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#ffffff',
      backgroundOpacity: 1,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['typewriter']
    }
  },

  {
    id: 'energy_pink_yellow',
    name: '活力粉黄',
    description: '粉黄波浪，适合生活娱乐',
    preview: ['元气满满', '一起冲呀'],
    source: 'newClip',
    config: {
      fontFamily: '三极行楷简体',
      fontSize: 58,
      fontStyles: [],
      color: '#FF6BC5',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 3,
      strokeColor: '#FFF069',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['wave', 'bounce']
    }
  },

  {
    id: 'cute_pink',
    name: '可爱粉色',
    description: '粉嫩配色，逐字弹跳',
    preview: ['可爱日常', '温馨提醒'],
    source: 'newClip',
    config: {
      fontFamily: '三极行楷简体',
      fontSize: 58,
      fontStyles: [],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 2,
      strokeColor: '#FF8BD2',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['bounce']
    }
  },

  {
    id: '3d_flip',
    name: '3D 翻转',
    description: '翻转入场，适合强调重点',
    preview: ['创意视觉', '重点出现'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: ['bold'],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 2,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['3d_flip']
    }
  },

  {
    id: 'black_white_bilingual',
    name: '黑白双语',
    description: '黑白简约，双语字幕',
    preview: ['简洁', '双语'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: [],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 2,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['fade_in']
    }
  },

  {
    id: 'yellow_white_bilingual',
    name: '黄白双语',
    description: '黄白配色，双语信息层级',
    preview: ['中文重点', '英文辅助'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: [],
      color: '#FDF084',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: false,
      strokeWidth: 0,
      strokeColor: '#000000',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 1742,
      animations: ['fade_in']
    }
  },
  {
    id: 'red_white_bilingual',
    name: '红白双语',
    description: '红白配色，适合双语字幕',
    preview: ['中文重点', '英文辅助'],
    source: 'newClip',
    config: {
      fontFamily: '微软雅黑',
      fontSize: 56,
      fontStyles: ['bold'],
      color: '#FFFFFF',
      opacity: 1,
      letterSpacing: 0,
      enableStroke: true,
      strokeWidth: 2,
      strokeColor: '#A30023',
      enableShadow: false,
      shadowDistance: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      backgroundType: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0,
      lineHeight: 1.2,
      positionX: 540,
      positionY: 580,
      animations: ['fade_in']
    }
  }
]

// titleStylePresets - 完整预设数组（共 11 个）
export const titleStylePresets = [
  {
    id: 'title_yellow_ximai_stroke',
    name: '黄白喜脉体',
    description: '黄色喜脉体，白字黑边，适合综艺感',
    source: 'newClip',
    style: {
      fontFamily: '喜脉体',
      fontSize: 70,
      color: '#F8F3C3',
      secondaryColor: '#FFD83B',
      fontWeight: '900',
      position: 'topCenter',
      offsetX: 0,
      offsetY: 100,
      enableStroke: true,
      strokeColor: '#000000',
      strokeWidth: 3,
      enableShadow: true,
      shadowDistance: 0,
      backgroundColor: 'rgba(0,0,0,0)'
    }
  },
  {
    id: 'title_yellow_white_xingkai_shadow',
    name: '黄白行楷',
    description: '三极行楷，黄上白下带阴影',
    source: 'newClip',
    style: {
      fontFamily: '三极行楷简体',
      fontSize: 70,
      color: '#FDF084',
      secondaryColor: '#FFFFFF',
      fontWeight: 'bold',
      position: 'topCenter',
      offsetX: 0,
      offsetY: 100,
      enableStroke: false,
      strokeWidth: 0,
      enableShadow: true,
      shadowDistance: 3,
      shadowColor: '#000000',
      backgroundColor: 'rgba(0,0,0,0)'
    }
  },
  {
    id: 'title_yellow_white_serif',
    name: '黄白标题黑',
    description: '思源宋体，黄白配色，优雅大方',
    source: 'newClip',
    style: {
      fontFamily: '思源宋体',
      fontSize: 70,
      color: '#FDF084',
      secondaryColor: '#FFFFFF',
      fontWeight: 'bold',
      position: 'topCenter',
      offsetX: 0,
      offsetY: 100,
      enableStroke: true,
      strokeColor: '#000000',
      strokeWidth: 0,
      enableShadow: true,
      shadowDistance: 3,
      shadowColor: '#000000',
      backgroundColor: 'rgba(0,0,0,0)'
    }
  },
  {
    id: 'title_yellow_white_dakai_shadow',
    name: '黄白大楷',
    description: '东方大楷，黄上白下带阴影',
    source: 'newClip',
    style: {
      fontFamily: '东方大楷',
      fontSize: 70,
      color: '#FDF084',
      secondaryColor: '#FFFFFF',
      fontWeight: 'bold',
      position: 'topCenter',
      offsetX: 0,
      offsetY: 100,
      enableStroke: true,
      strokeColor: '#000000',
      strokeWidth: 0,
      enableShadow: true,
      shadowDistance: 3,
      shadowColor: '#000000',
      backgroundColor: 'rgba(0,0,0,0)'
    }
  },
  {
    id: 'title_white_houzun_italic',
    name: '白色猴尊斜体',
    description: '猴尊宋体斜体，粉色背景遮罩',
    source: 'newClip',
    style: {
      fontFamily: '猴尊宋体',
      fontSize: 70,
      color: '#FFFFFF',
      secondaryColor: '#FFFFFF',
      fontWeight: '900',
      fontStyle: 'italic',
      position: 'topCenter',
      offsetX: 0,
      offsetY: 80,
      enableStroke: true,
      strokeColor: '#000000',
      strokeWidth: 0,
      enableShadow: false,
      shadowDistance: 2,
      shadowColor: '#000000',
      enableBackground: true,
      backgroundColor: 'rgba(255,105,180,0.5)'
    }
  },
  {
    id: 'title_red_jiangcheng_stroke',
    name: '红色律动宋',
    description: '江城律动宋，红字白描边',
    source: 'newClip',
    style: {
      fontFamily: '江城律动宋',
      fontSize: 70,
      color: '#FF3D2E',
      secondaryColor: '#FF3D2E',
      fontWeight: 'bold',
      position: 'topCenter',
      offsetX: 0,
      offsetY: 100,
      enableStroke: true,
      strokeColor: '#FFFFFF',
      strokeWidth: 3,
      enableShadow: true,
      shadowDistance: 0,
      backgroundColor: 'rgba(0,0,0,0)'
    }
  },
  {
    id: 'title_orange_yellow_xiehei_stroke',
    name: '橙黄错位',
    description: '江城斜黑体，错位排版描边',
    source: 'newClip',
    style: {
      fontFamily: '江城斜黑体',
      fontSize: 70,
      color: '#FF9800',
      secondaryColor: '#FDF084',
      fontWeight: 'bold',
      fontStyle: 'italic',
      position: 'topCenter',
      offsetX: -120,
      offsetY: 100,
      enableStroke: true,
      strokeColor: '#000000',
      strokeWidth: 3,
      enableShadow: true,
      shadowDistance: 0,
      backgroundColor: 'rgba(0,0,0,0)'
    }
  },
  {
    id: 'title_orange_white_stroke',
    name: '橙白粗黑宋',
    description: '优设标题黑，橙上白下带描边',
    source: 'newClip',
    style: {
      fontFamily: '优设标题黑',
      fontSize: 70,
      color: '#FF9800',
      secondaryColor: '#FFFFFF',
      fontWeight: 'bold',
      position: 'topCenter',
      offsetX: 0,
      offsetY: 100,
      enableStroke: true,
      strokeColor: '#000000',
      strokeWidth: 3,
      enableShadow: false,
      shadowDistance: 0,
      backgroundColor: 'rgba(0,0,0,0)'
    }
  },
  {
    id: 'title_orange_white_serif_shadow',
    name: '橙白思源宋',
    description: '思源宋体，橙上白下带阴影遮罩',
    source: 'newClip',
    style: {
      fontFamily: '思源宋体',
      fontSize: 70,
      color: '#EA8439',
      secondaryColor: '#FFFFFF',
      fontWeight: 'bold',
      position: 'topCenter',
      offsetX: 0,
      offsetY: 80,
      enableStroke: true,
      strokeColor: '#000000',
      strokeWidth: 0,
      enableShadow: true,
      shadowDistance: 3,
      shadowColor: '#000000',
      enableBackground: true,
      backgroundColor: 'rgba(0,0,0,0.3)'
    }
  },
  {
    id: 'title_blue_wendao_stroke',
    name: '蓝色文道潮黑',
    description: '文道潮黑体，蓝字白描边',
    source: 'newClip',
    style: {
      fontFamily: '文道潮黑体',
      fontSize: 64,
      color: '#3F509B',
      secondaryColor: '#3F509B',
      fontWeight: 'bold',
      fontStyle: 'italic',
      position: 'topCenter',
      offsetX: 0,
      offsetY: 100,
      enableStroke: true,
      strokeColor: '#FFFFFF',
      strokeWidth: 3,
      enableShadow: true,
      shadowDistance: 0,
      backgroundColor: 'rgba(0,0,0,0)'
    }
  }
]

// 服务提供商预设
export const PROVIDER_PRESETS = {
  volcengine: {
    label: '火山引擎',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKeyUrl: 'https://console.volcengine.com/ark',
    model: 'doubao-seed-2-0-lite-260428',
    models: [
      'doubao-seed-2-0-lite-260428',
      'doubao-seed-1-6-251015',
      'doubao-pro-32k',
      'doubao-lite-32k'
    ],
    visionModels: [
      'doubao-seed-2-0-lite-260428',
      'doubao-seed-evolving-latest-version',
      'doubao-seed-2-1-pro-260628',
      'doubao-seed-2-1-turbo-260628',
      'doubao-seed-2-0-pro-260215',
      'doubao-seed-1-6-vision-251015',
      'doubao-1-5-vision-pro',
      'doubao-1-5-vision-lite'
    ]
  }
}

// 默认预设行配置
const DEFAULT_PRESET_LINES = {
  h1: {
    x: 0, // 水平居中（相对于画布中心）
    y: 100, // 从顶部向下 100px
    fontSize: 70, // 字号 70px
    bold: true // 加粗
  },
  h2: {
    x: 0, // 水平居中
    y: 160, // 从顶部向下 160px（比 h1 低 60px）
    fontSize: 65, // 字号 65px
    bold: false // 普通字重
  }
}

/**
 * 标题预设行配置
 */
export const PRESET_LINES_TEMPLATES = {
  title_yellow_ximai_stroke: DEFAULT_PRESET_LINES,
  title_yellow_white_xingkai_shadow: DEFAULT_PRESET_LINES,
  title_yellow_white_serif: DEFAULT_PRESET_LINES,
  title_yellow_white_dakai_shadow: {
    h1: { x: 0, y: 100, fontSize: 70, bold: true },
    h2: { x: 0, y: 180, fontSize: 65, bold: false }
  },
  title_white_houzun_italic: {
    h1: { x: 0, y: 80, fontSize: 70, bold: true, italic: true },
    h2: { x: 0, y: 160, fontSize: 70, bold: false, italic: false },
    mask: { y: 80, fontSize: 70, paddingTop: 20, paddingBottom: 20 }
  },
  title_red_jiangcheng_stroke: {
    h1: { x: 0, y: 100, fontSize: 70, bold: true },
    h2: { x: 0, y: 180, fontSize: 70, bold: false }
  },
  title_orange_yellow_xiehei_stroke: {
    h1: { x: -200, y: 100, fontSize: 70, bold: true, italic: false },
    h2: { x: 200, y: 180, fontSize: 70, bold: false, italic: false }
  },

  title_orange_white_stroke: {
    h1: { x: 0, y: 100, fontSize: 70, bold: true },
    h2: { x: 0, y: 180, fontSize: 65, bold: false }
  },

  title_orange_white_serif_shadow: {
    h1: { x: 0, y: 80, fontSize: 70, bold: true },
    h2: { x: 0, y: 160, fontSize: 65, bold: false },
    mask: { y: 80, fontSize: 70, paddingTop: 20, paddingBottom: 20 }
  },

  title_blue_wendao_stroke: {
    h1: { x: 0, y: 100, fontSize: 70, bold: false, italic: false, fontWeight: 'bold' },
    h2: { x: 0, y: 160, fontSize: 60, bold: true, italic: false, fontWeight: 'bold' }
  }
}
