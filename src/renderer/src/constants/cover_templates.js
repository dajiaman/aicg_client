export const TEMPLATES = [
  // ---------- default: 默认模板 ----------
  {
    id: 'default',
    name: 'V0-默认',
    description: '居中大字，白字黑边',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [],
    textLayers: [
      {
        id: 'main',
        text: '{title}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 110,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 960,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V1: 通屏黑底 ----------
  {
    id: 'v1',
    name: 'V1-通屏黑底',
    description: '通屏半透明黑底，白色大字',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 760,
      width: 1080,
      height: 400,
      color: '#000000',
      opacity: 0.6,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'main',
        text: '{title}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 110,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 960,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V2: 全屏遮罩 ----------

  {
    id: 'v2',
    name: 'V2-全屏遮罩',
    description: '全屏半透明遮罩，白色大字',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 0.5,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'main',
        text: '{title}',
        style: {
          fontFamily: '东方大楷',
          fontSize: 120,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 960,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V3: 黄字描黑 ----------
  {
    id: 'v3',
    name: 'V3-黄字描黑',
    description: '全屏遮罩，黄色大字黑边',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 0.4,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'main',
        text: '{title}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 130,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFEB3B',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 960,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 10
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V4: 卡片框 ----------
  {
    id: 'v4',
    name: 'V4-卡片框',
    description: '黑底白边框，上下文字带青色分割线',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 90,
      y: 700,
      width: 900,
      height: 520,
      color: '#000000',
      opacity: 0.6,
      radius: 8,
      stroke: {
        enabled: true,
        color: '#FFFFFF',
        width: 10
      },
      rotation: 0
    },
    shapes: [
      {
        id: 'divider',
        type: 'rect',
        x: 150,
        y: 956,
        width: 780,
        height: 6,
        fill: '#00FFFF',
        opacity: 1,
        rotation: 0,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 130,
          bold: false,
          italic: true,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 840,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 70,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1070,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V5: 圆角黑底 ----------
  {
    id: 'v5',
    name: 'V5-圆角黑底',
    description: '居中圆角黑底，白字',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 80,
      y: 740,
      width: 920,
      height: 440,
      color: '#000000',
      opacity: 0.65,
      radius: 20,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'main',
        text: '{title}',
        style: {
          fontFamily: '江城斜黑体',
          fontSize: 110,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 960,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V6: 黄字居中 ----------
  {
    id: 'v6',
    name: 'V6-黄字居中',
    description: '居中文字，黄色大字',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [],
    textLayers: [
      {
        id: 'main',
        text: '{title}',
        style: {
          fontFamily: '文道潮黑体',
          fontSize: 130,
          bold: false,
          italic: false,
          underline: false,
          color: '#FDE004',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 960,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V8: 霓虹冲击 ----------
  {
    id: 'v8',
    name: 'V8-霓虹冲击',
    description: '全屏弱遮罩，白字配青色霓虹描边',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#050814',
      opacity: 0.42,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'main',
        text: '{title}',
        style: {
          fontFamily: '江城斜黑体',
          fontSize: 118,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.28,
          align: 'center',
          x: 540,
          y: 960,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#00E5FF',
            width: 14
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V9: 赛博电光 ----------
  {
    id: 'v9',
    name: 'V9-赛博电光',
    description: '深沉暗调，青色主字搭配亮粉色高光描边，充满科技感',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#090B10',
      opacity: 0.75,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [
      {
        id: 'cyberLine1',
        type: 'rect',
        x: 0,
        y: 780,
        width: 150,
        height: 12,
        fill: '#FF007F',
        opacity: 0.9,
        rotation: 0,
        radius: 0
      },
      {
        id: 'cyberLine2',
        type: 'rect',
        x: 880,
        y: 1140,
        width: 200,
        height: 12,
        fill: '#00FFFF',
        opacity: 0.9,
        rotation: 0,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 140,
          bold: false,
          italic: true,
          underline: false,
          color: '#00FFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 900,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FF007F',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 65,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1040,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V10: 极简杂志 ----------
  {
    id: 'v10',
    name: 'V10-极简杂志',
    description: '白色半透遮罩，大面积留白，黑色优雅文字排版',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 60,
      y: 60,
      width: 960,
      height: 1800,
      color: '#FFFFFF',
      opacity: 0.88,
      radius: 0,
      stroke: {
        enabled: true,
        color: '#000000',
        width: 4
      },
      rotation: 0
    },
    shapes: [
      {
        id: 'magDivider',
        type: 'rect',
        x: 480,
        y: 960,
        width: 120,
        height: 4,
        fill: '#000000',
        opacity: 1,
        rotation: 0,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '东方大楷',
          fontSize: 120,
          bold: false,
          italic: false,
          underline: false,
          color: '#000000',
          opacity: 1,
          letterSpacing: 6,
          lineHeight: 1.4,
          align: 'center',
          x: 540,
          y: 860,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '江城斜黑体',
          fontSize: 55,
          bold: false,
          italic: false,
          underline: false,
          color: '#333333',
          opacity: 1,
          letterSpacing: 10,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1060,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V12: 渐变情绪 ----------
  {
    id: 'v12',
    name: 'V12-渐变情绪',
    description: '底部高级黑场渐变，配合错落有致的文字，电影感拉满',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 768,
      width: 1080,
      height: 1152,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1152
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0)',
        0.5,
        'rgba(0,0,0,0.8)',
        1,
        'rgba(0,0,0,1)'
      ],
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 130,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1440,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 15,
            distance: 0
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 60,
          bold: false,
          italic: false,
          underline: false,
          color: '#D4AF37',
          opacity: 0.9,
          letterSpacing: 15,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1690,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V13: 斜角先锋 ----------
  {
    id: 'v13',
    name: 'V13-斜角先锋',
    description: '倾斜文字排版，配合极具张力的渐变遮罩，适合Vlog与街拍',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 1080,
        y: 1920
      },
      fillLinearGradientColorStops: [0, 'rgba(255,87,34,0.6)', 1, 'rgba(33,150,243,0.6)'],
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '文道潮黑体',
          fontSize: 160,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 500,
          y: 880,
          rotation: -8,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.4,
            blur: 20,
            distance: 10
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '江城斜黑体',
          fontSize: 80,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFEB3B',
          opacity: 1,
          letterSpacing: 6,
          lineHeight: 1.3,
          align: 'center',
          x: 600,
          y: 1060,
          rotation: -8,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V16: 爆款结构 ----------
  {
    id: 'v16',
    name: 'V16-爆款结构',
    description: '四角白色巨字包围，中间标题副标题突出，适合真人口播与知识类爆款封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.08)',
        0.45,
        'rgba(0,0,0,0.08)',
        1,
        'rgba(0,0,0,0.3)'
      ],
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'cornerTopLeft',
        text: '爆',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 340,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF8E6',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 245,
          y: 300,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F2E8D1',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 10,
            distance: 10
          }
        }
      },
      {
        id: 'cornerTopRight',
        text: '款',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 340,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF8E6',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 835,
          y: 300,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F2E8D1',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 10,
            distance: 10
          }
        }
      },
      {
        id: 'cornerBottomLeft',
        text: '结',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 370,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF8E6',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 260,
          y: 1590,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F2E8D1',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.5,
            blur: 12,
            distance: 10
          }
        }
      },
      {
        id: 'cornerBottomRight',
        text: '构',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 370,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF8E6',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 820,
          y: 1590,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F2E8D1',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.5,
            blur: 12,
            distance: 10
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 78,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.18,
          align: 'left',
          x: 82,
          y: 1110,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#27313A',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 86,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF4B8',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.15,
          align: 'left',
          x: 82,
          y: 1220,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#3B3A2E',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 8,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V17: 左侧高级字 ----------
  {
    id: 'v17',
    name: 'V17-左侧高级字',
    description: '左侧四个白色巨字竖排，中间副标题和黄色主标题突出，适合真人出镜封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#0C2B2E',
      opacity: 0.18,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [
      {
        id: 'bottomShade',
        type: 'rect',
        x: 0,
        y: 1400,
        width: 1080,
        height: 520,
        fill: '#000000',
        opacity: 0.18,
        rotation: 0,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'leftChar1',
        text: '高',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 320,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 220,
          y: 235,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F7F7F7',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.65,
            blur: 16,
            distance: 12
          }
        }
      },
      {
        id: 'leftChar2',
        text: '级',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 320,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 220,
          y: 590,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F7F7F7',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.65,
            blur: 16,
            distance: 12
          }
        }
      },
      {
        id: 'leftChar3',
        text: '封',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 320,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 220,
          y: 1050,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F7F7F7',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.65,
            blur: 16,
            distance: 12
          }
        }
      },
      {
        id: 'leftChar4',
        text: '面',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 320,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 220,
          y: 1405,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F7F7F7',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.65,
            blur: 16,
            distance: 12
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 62,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFE03B',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.18,
          align: 'left',
          x: 220,
          y: 1794,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#3B3420',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 8,
            distance: 5
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 168,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD900',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'left',
          x: 220,
          y: 1612,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#2E2A18',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.65,
            blur: 14,
            distance: 8
          }
        }
      }
    ]
  },

  // ---------- V18: 高级封面条幅 ----------
  {
    id: 'v18',
    name: 'V18-高级封面条幅',
    description: '顶部白色大字，中间黑色半透条幅蓝字，底部黄色大字，适合口播教程封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1080,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 0.12,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [
      {
        id: 'titleBand',
        type: 'rect',
        x: 0,
        y: 805,
        width: 1080,
        height: 250,
        fill: '#000000',
        opacity: 0.58,
        rotation: 0,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'topLeft',
        text: '高',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 260,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 205,
          y: 190,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F8F8F8',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 18,
            distance: 12
          }
        }
      },
      {
        id: 'topRight',
        text: '级',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 260,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 875,
          y: 190,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F8F8F8',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 18,
            distance: 12
          }
        }
      },
      {
        id: 'main',
        text: '{title}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 92,
          bold: false,
          italic: false,
          underline: false,
          color: '#86C8FF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.08,
          align: 'center',
          x: 540,
          y: 930,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#173246',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'bottomLeft',
        text: '封',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 300,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFE100',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 190,
          y: 1650,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#312A00',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.65,
            blur: 14,
            distance: 8
          }
        }
      },
      {
        id: 'bottomRight',
        text: '面',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 300,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFE100',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 890,
          y: 1650,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#312A00',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.65,
            blur: 14,
            distance: 8
          }
        }
      }
    ]
  },

  // ---------- V19: 新人指南 ----------
  {
    id: 'v19',
    name: 'V19-新人指南',
    description: '橙色斜条白字黑边，米白标题条黄字黑边，清单和底部提示适合职场教程封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 0.08,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [
      {
        id: 'topOrangeBand',
        type: 'rect',
        x: 34.19,
        y: 84,
        width: 760.22,
        height: 210,
        fill: '#FFB52E',
        opacity: 1,
        rotation: -3,
        radius: 0
      },
      {
        id: 'middleCreamBand',
        type: 'rect',
        x: 190.06,
        y: 298,
        width: 910.06,
        height: 200,
        fill: '#FFF3D8',
        opacity: 0.96,
        rotation: 0,
        radius: 0
      },
      {
        id: 'listBg1',
        type: 'rect',
        x: 164.92,
        y: 820,
        width: 360,
        height: 72,
        fill: '#FFE15A',
        opacity: 0.95,
        radius: 12.07,
        rotation: 0
      },
      {
        id: 'listBg2',
        type: 'rect',
        x: 164.92,
        y: 910,
        width: 360,
        height: 72,
        fill: '#FFE15A',
        opacity: 0.95,
        radius: 12.07,
        rotation: 0
      },
      {
        id: 'listBg3',
        type: 'rect',
        x: 164.92,
        y: 1000,
        width: 360,
        height: 72,
        fill: '#FFE15A',
        opacity: 0.95,
        radius: 12.07,
        rotation: 0
      },
      {
        id: 'bottomCreamBand',
        type: 'rect',
        x: 82.46,
        y: 1735,
        width: 916.09,
        height: 118,
        fill: '#FFF2C9',
        opacity: 0.96,
        radius: 20.11,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 111.62,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.3,
          align: 'center',
          x: 415.31,
          y: 190,
          rotation: -3,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0,
            blur: 0,
            distance: 0
          }
        }
      },
      {
        id: 'middleTitle',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 131.73,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFC84B',
          opacity: 1,
          letterSpacing: 5,
          lineHeight: 1.3,
          align: 'center',
          x: 634.53,
          y: 400,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 9
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0,
            blur: 0,
            distance: 0
          }
        }
      },
      {
        id: 'check1',
        text: '✓',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 62.35,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 114.64,
          y: 855,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#E8A600',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list1',
        text: '稳住心态',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 48.27,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'left',
          x: 185.03,
          y: 855,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'check2',
        text: '✓',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 62.35,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 114.64,
          y: 945,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#E8A600',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list2',
        text: '守时靠谱',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 48.27,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'left',
          x: 185.03,
          y: 945,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'check3',
        text: '✓',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 62.35,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 114.64,
          y: 1035,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#E8A600',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list3',
        text: '少言多做',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 48.27,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'left',
          x: 185.03,
          y: 1035,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottomIcon',
        text: '👍',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 70.39,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 144.8,
          y: 1794,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottomTip',
        text: '牢记这3点，80%的问题都能解决',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'left',
          x: 205.14,
          y: 1794,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V20: 职场女性进阶 ----------
  {
    id: 'v20',
    name: 'V20-职场女性进阶',
    description: '浅奶黄斜体大字，搭配底部暗场和精致引号，适合职场女性成长类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,246,210,0.1)',
        0.58,
        'rgba(0,0,0,0)',
        1,
        'rgba(0,0,0,0.58)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'bottomSoftShade',
        type: 'rect',
        x: 0,
        y: 1510,
        width: 1080,
        height: 410,
        fill: '#000000',
        opacity: 0.22,
        rotation: 0,
        radius: 0
      },
      {
        id: 'leftQuoteBg',
        type: 'rect',
        x: 54.3,
        y: 1620,
        width: 58.32,
        height: 58,
        fill: '#B30000',
        opacity: 0.95,
        radius: 4.02,
        rotation: 0
      },
      {
        id: 'rightQuoteBg',
        type: 'rect',
        x: 968.38,
        y: 1620,
        width: 58.32,
        height: 58,
        fill: '#B30000',
        opacity: 0.95,
        radius: 4.02,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '{titleMain}',
        style: {
          fontFamily: '东方大楷',
          fontSize: 169.94,
          bold: false,
          italic: true,
          underline: false,
          color: '#FFF8B8',
          opacity: 1,
          letterSpacing: 18,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 210,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#6E5D35',
            opacity: 0.28,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'middleTip',
        text: '（打破你的天花板）',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 48.27,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 6,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1560,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 8,
            distance: 3
          }
        }
      },
      {
        id: 'bottomTitle',
        text: '{titleSub}',
        style: {
          fontFamily: '东方大楷',
          fontSize: 111.62,
          bold: false,
          italic: true,
          underline: false,
          color: '#FFF8B8',
          opacity: 1,
          letterSpacing: 10,
          lineHeight: 1.08,
          align: 'center',
          x: 540,
          y: 1710,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#6E5D35',
            opacity: 0.32,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'leftQuote',
        text: '“',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 62.35,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFF8B8',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 83.46,
          y: 1650,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'rightQuote',
        text: '”',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 62.35,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFF8B8',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 996.54,
          y: 1650,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V21: 自媒体手写指南 ----------
  {
    id: 'v21',
    name: 'V21-自媒体手写指南',
    description: '黄色手写主标题，白色手写副标题和箭头备注，适合自媒体剪辑、教程类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 1080,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,61,126,0.4)',
        0.58,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,0,0,0.18)'
      ],
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '三极行楷简体',
          fontSize: 149.83,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD928',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 1.05,
          align: 'left',
          x: 76.42,
          y: 160,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#082B52',
            opacity: 0.35,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '月星楷',
          fontSize: 103.58,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 5,
          lineHeight: 1.15,
          align: 'left',
          x: 86.48,
          y: 350,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#06284A',
            opacity: 0.45,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'arrow',
        text: '↪',
        style: {
          fontFamily: '月星楷',
          fontSize: 107.6,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 592.29,
          y: 883,
          rotation: -12,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#06284A',
            opacity: 0.4,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'note',
        text: '剪辑人\n脑洞不限量',
        style: {
          fontFamily: '月星楷',
          fontSize: 56.31,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.22,
          align: 'left',
          x: 674.75,
          y: 830,
          rotation: -4,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#06284A',
            opacity: 0.45,
            blur: 8,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V22: 蓝框写真标题 ----------
  {
    id: 'v22',
    name: 'V22-蓝框写真标题',
    description: '蓝色霓虹细框，中心白色主标题和简洁副标题，适合剪映封面、写真教程类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,90,150,0.25)',
        0.52,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,95,170,0.3)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'outerTop',
        type: 'rect',
        x: 70.39,
        y: 135,
        width: 940.22,
        height: 4,
        fill: '#38B8FF',
        opacity: 0.9,
        rotation: 0,
        radius: 0
      },
      {
        id: 'outerBottom',
        type: 'rect',
        x: 70.39,
        y: 1765,
        width: 940.22,
        height: 4,
        fill: '#38B8FF',
        opacity: 0.9,
        rotation: 0,
        radius: 0
      },
      {
        id: 'outerLeft',
        type: 'rect',
        x: 70.39,
        y: 135,
        width: 4.02,
        height: 1630,
        fill: '#38B8FF',
        opacity: 0.9,
        rotation: 0,
        radius: 0
      },
      {
        id: 'outerRight',
        type: 'rect',
        x: 1005.59,
        y: 135,
        width: 4.02,
        height: 1630,
        fill: '#38B8FF',
        opacity: 0.9,
        rotation: 0,
        radius: 0
      },
      {
        id: 'innerTop',
        type: 'rect',
        x: 109.61,
        y: 215,
        width: 859.78,
        height: 4,
        fill: '#38B8FF',
        opacity: 0.78,
        rotation: 0,
        radius: 0
      },
      {
        id: 'innerBottom',
        type: 'rect',
        x: 109.61,
        y: 1690,
        width: 859.78,
        height: 4,
        fill: '#38B8FF',
        opacity: 0.78,
        rotation: 0,
        radius: 0
      },
      {
        id: 'innerLeft',
        type: 'rect',
        x: 109.61,
        y: 215,
        width: 4.02,
        height: 1475,
        fill: '#38B8FF',
        opacity: 0.78,
        rotation: 0,
        radius: 0
      },
      {
        id: 'innerRight',
        type: 'rect',
        x: 966.37,
        y: 215,
        width: 4.02,
        height: 1475,
        fill: '#38B8FF',
        opacity: 0.78,
        rotation: 0,
        radius: 0
      },
      {
        id: 'titleSoftBand',
        type: 'rect',
        x: 0,
        y: 750,
        width: 1080,
        height: 230,
        fill: '#000000',
        opacity: 0.12,
        rotation: 0,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'topSmall',
        text: 'SHIPINJIANJI',
        style: {
          fontFamily: '源样明体',
          fontSize: 28.16,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.85,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'left',
          x: 230.28,
          y: 220,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#002D52',
            opacity: 0.5,
            blur: 6,
            distance: 2
          }
        }
      },
      {
        id: 'rightSmall',
        text: 'SHIPINJIANJI',
        style: {
          fontFamily: '源样明体',
          fontSize: 26.15,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.8,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 993.52,
          y: 560,
          rotation: 90,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#002D52',
            opacity: 0.5,
            blur: 6,
            distance: 2
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '江城律动宋',
          fontSize: 91.51,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.12,
          align: 'center',
          x: 540,
          y: 850,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#173246',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 12,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '王漢宗中仿宋簡',
          fontSize: 52.29,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.94,
          letterSpacing: 8,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1005,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 10,
            distance: 3
          }
        }
      }
    ]
  },

  // ---------- V23: 职场血泪经验 ----------
  {
    id: 'v23',
    name: 'V23-职场血泪经验',
    description: '右侧勾选清单，中部黑白描边说明，底部黄色超大标题，适合职场经验总结类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.02)',
        0.62,
        'rgba(0,0,0,0.04)',
        1,
        'rgba(0,0,0,0.2)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'bottomWhiteBand',
        type: 'rect',
        x: 0,
        y: 1590,
        width: 1080,
        height: 330,
        fill: '#FFFFFF',
        opacity: 0.34,
        rotation: 0,
        radius: 0
      },
      {
        id: 'checkCircle1',
        type: 'rect',
        x: 622.46,
        y: 850,
        width: 54.3,
        height: 54,
        fill: '#FFFFFF',
        opacity: 0.92,
        radius: 27.15,
        rotation: 0
      },
      {
        id: 'checkCircle2',
        type: 'rect',
        x: 622.46,
        y: 940,
        width: 54.3,
        height: 54,
        fill: '#FFFFFF',
        opacity: 0.92,
        radius: 27.15,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'checkMark1',
        text: '✓',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 42.23,
          bold: false,
          italic: false,
          underline: false,
          color: '#8B806B',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 648.6,
          y: 877,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list1',
        text: '主动汇报工作',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'left',
          x: 699.89,
          y: 875,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFE15A',
            opacity: 0.95,
            blur: 0,
            distance: 4
          }
        }
      },
      {
        id: 'checkMark2',
        text: '✓',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 42.23,
          bold: false,
          italic: false,
          underline: false,
          color: '#8B806B',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 648.6,
          y: 967,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list2',
        text: '精准提建议',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'left',
          x: 699.89,
          y: 965,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFE15A',
            opacity: 0.95,
            blur: 0,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 91.51,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.05,
          align: 'center',
          x: 540,
          y: 1536,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 9
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.35,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 175.98,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD92E',
          opacity: 1,
          letterSpacing: 6,
          lineHeight: 0.96,
          align: 'center',
          x: 540,
          y: 1755,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 12
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#BDA000',
            opacity: 0.7,
            blur: 0,
            distance: 5
          }
        }
      }
    ]
  },

  // ---------- V24: 装修效果清单 ----------
  {
    id: 'v24',
    name: 'V24-装修效果清单',
    description: '顶部白字棕描边，中央黄色超大标题，斜条清单标签，适合装修、家居、省钱攻略类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,245,230,0.1)',
        0.62,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,0,0,0.16)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'whiteOvalTop',
        type: 'rect',
        x: 169.94,
        y: 300,
        width: 740.11,
        height: 26,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 13.07,
        rotation: -5
      },
      {
        id: 'whiteOvalBottom',
        type: 'rect',
        x: 95.53,
        y: 510,
        width: 900,
        height: 30,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 15.08,
        rotation: 3
      },
      {
        id: 'listBand',
        type: 'rect',
        x: 575.2,
        y: 690,
        width: 380.11,
        height: 96,
        fill: '#FFD83B',
        opacity: 0.98,
        radius: 4.02,
        rotation: 5
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '18万装出',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 121.68,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 499.78,
          y: 180,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#6B3E23',
            width: 12
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.95,
            blur: 0,
            distance: 8
          }
        }
      },
      {
        id: 'emoji',
        text: '😎👍',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 78.44,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 884.92,
          y: 185,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 159.89,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD83B',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 0.96,
          align: 'center',
          x: 540,
          y: 430,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#6B3E23',
            width: 14
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.85,
            blur: 0,
            distance: 7
          }
        }
      },
      {
        id: 'sparkle',
        text: '✦',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 86.48,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD83B',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 504.8,
          y: 735,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#6B3E23',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.8,
            blur: 0,
            distance: 4
          }
        }
      },
      {
        id: 'listText',
        text: '{titleSub}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#6B3E23',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1.3,
          align: 'center',
          x: 765.25,
          y: 740,
          rotation: 5,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V25: 租房改造避坑 ----------
  {
    id: 'v25',
    name: 'V25-租房改造避坑',
    description: '顶部巨型白字，左右扭曲倾斜关键词，底部强提醒大字，适合避坑、省钱、改造类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.04)',
        0.58,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,0,0,0.28)'
      ],
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'topTitle',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 171.96,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 0.95,
          align: 'center',
          x: 540,
          y: 180,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.75,
            blur: 0,
            distance: 10
          }
        }
      },
      {
        id: 'leftTwist',
        text: '别错过',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 103.58,
          bold: false,
          italic: true,
          underline: false,
          color: '#FFFBD8',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 180,
          y: 990,
          rotation: 8,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 10
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.75,
            blur: 0,
            distance: 8
          }
        }
      },
      {
        id: 'rightTwist',
        text: '必看',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 111.62,
          bold: false,
          italic: true,
          underline: false,
          color: '#F052FF',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1.3,
          align: 'center',
          x: 874.86,
          y: 980,
          rotation: -10,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 10
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.78,
            blur: 0,
            distance: 8
          }
        }
      },
      {
        id: 'emoji',
        text: '??',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 74.41,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 954.3,
          y: 1490,
          rotation: 10,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottomTitle',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 111.62,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.04,
          align: 'center',
          x: 540,
          y: 1735,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 9
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.75,
            blur: 0,
            distance: 9
          }
        }
      }
    ]
  },

  // ---------- V26: 沉浸式开箱 ----------
  {
    id: 'v26',
    name: 'V26-沉浸式开箱',
    description: '蓝色大字白描边，橙色英文副标，右侧体验标签和底部气泡，适合开箱、测评、分享类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.08)',
        0.58,
        'rgba(255,235,190,0.06)',
        1,
        'rgba(0,0,0,0.1)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'orangeUnderline1',
        type: 'rect',
        x: 111.62,
        y: 760,
        width: 149.83,
        height: 22,
        fill: '#FFB85C',
        opacity: 0.75,
        rotation: -2,
        radius: 11.06
      },
      {
        id: 'orangeUnderline2',
        type: 'rect',
        x: 720,
        y: 900,
        width: 250.39,
        height: 24,
        fill: '#FFB85C',
        opacity: 0.75,
        rotation: -5,
        radius: 12.07
      },
      {
        id: 'bottomBubble',
        type: 'rect',
        x: 284.58,
        y: 1420,
        width: 800.45,
        height: 105,
        fill: '#FFF2B8',
        opacity: 0.96,
        radius: 52.29,
        rotation: 6
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 141.79,
          bold: false,
          italic: false,
          underline: false,
          color: '#2F9FE8',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 0.98,
          align: 'center',
          x: 540,
          y: 135,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 12
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#F2A76D',
            opacity: 0.5,
            blur: 0,
            distance: 5
          }
        }
      },
      {
        id: 'tag1',
        text: '无广',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 72.4,
          bold: false,
          italic: false,
          underline: false,
          color: '#2F9FE8',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 111.62,
          y: 735,
          rotation: -2,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'tag2',
        text: '真实体验',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 70.39,
          bold: false,
          italic: false,
          underline: false,
          color: '#2F9FE8',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 790.39,
          y: 875,
          rotation: -5,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottomTip',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 58.32,
          bold: false,
          italic: false,
          underline: false,
          color: '#E77B32',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1.3,
          align: 'center',
          x: 521.9,
          y: 1500,
          rotation: 6,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V27: 无标题热视频 ----------
  {
    id: 'v27',
    name: 'V27-无标题热视频',
    description: '顶部橙色书名号标题，底部两行超大白字黑描边，适合热视频、爆款分享类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.08)',
        0.5,
        'rgba(0,0,0,0.03)',
        1,
        'rgba(0,0,0,0.55)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'bottomDarkBand',
        type: 'rect',
        x: 0,
        y: 1300,
        width: 1080,
        height: 620,
        fill: '#000000',
        opacity: 0.2,
        rotation: 0,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '《无标题》',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 97.54,
          bold: false,
          italic: false,
          underline: false,
          color: '#E9863B',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 245,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#5A351F',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 0,
            distance: 5
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 169.94,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 0.9,
          align: 'center',
          x: 540,
          y: 1450,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#151515',
            width: 12
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.75,
            blur: 0,
            distance: 10
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 161.9,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 0.9,
          align: 'center',
          x: 540,
          y: 1690,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#151515',
            width: 12
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.75,
            blur: 0,
            distance: 10
          }
        }
      }
    ]
  },

  // ---------- V28: REC备考攻略 ----------
  {
    id: 'v28',
    name: 'V28-REC备考攻略',
    description: '录制取景框界面，白色副标题搭配亮黄主标题，适合学习、备考、攻略类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.18)',
        0.52,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,0,0,0.36)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'topLeftH',
        type: 'rect',
        x: 44.25,
        y: 70,
        width: 220.22,
        height: 4,
        fill: '#FFFFFF',
        opacity: 0.95,
        rotation: 0,
        radius: 0
      },
      {
        id: 'topLeftV',
        type: 'rect',
        x: 44.25,
        y: 70,
        width: 4.02,
        height: 230,
        fill: '#FFFFFF',
        opacity: 0.95,
        rotation: 0,
        radius: 0
      },
      {
        id: 'topRightH',
        type: 'rect',
        x: 815.53,
        y: 70,
        width: 220.22,
        height: 4,
        fill: '#FFFFFF',
        opacity: 0.95,
        rotation: 0,
        radius: 0
      },
      {
        id: 'topRightV',
        type: 'rect',
        x: 1031.73,
        y: 70,
        width: 4.02,
        height: 230,
        fill: '#FFFFFF',
        opacity: 0.95,
        rotation: 0,
        radius: 0
      },
      {
        id: 'bottomLeftH',
        type: 'rect',
        x: 44.25,
        y: 1845,
        width: 220.22,
        height: 4,
        fill: '#FFFFFF',
        opacity: 0.95,
        rotation: 0,
        radius: 0
      },
      {
        id: 'bottomLeftV',
        type: 'rect',
        x: 44.25,
        y: 1615,
        width: 4.02,
        height: 230,
        fill: '#FFFFFF',
        opacity: 0.95,
        rotation: 0,
        radius: 0
      },
      {
        id: 'bottomRightH',
        type: 'rect',
        x: 815.53,
        y: 1845,
        width: 220.22,
        height: 4,
        fill: '#FFFFFF',
        opacity: 0.95,
        rotation: 0,
        radius: 0
      },
      {
        id: 'bottomRightV',
        type: 'rect',
        x: 1031.73,
        y: 1615,
        width: 4.02,
        height: 230,
        fill: '#FFFFFF',
        opacity: 0.95,
        rotation: 0,
        radius: 0
      },
      {
        id: 'focusTopLeftH',
        type: 'rect',
        x: 415.31,
        y: 730,
        width: 70.39,
        height: 4,
        fill: '#FFFFFF',
        opacity: 0.75,
        rotation: 0,
        radius: 0
      },
      {
        id: 'focusTopLeftV',
        type: 'rect',
        x: 415.31,
        y: 730,
        width: 4.02,
        height: 70,
        fill: '#FFFFFF',
        opacity: 0.75,
        rotation: 0,
        radius: 0
      },
      {
        id: 'focusBottomRightH',
        type: 'rect',
        x: 595.31,
        y: 960,
        width: 70.39,
        height: 4,
        fill: '#FFFFFF',
        opacity: 0.75,
        rotation: 0,
        radius: 0
      },
      {
        id: 'focusBottomRightV',
        type: 'rect',
        x: 660.67,
        y: 890,
        width: 4.02,
        height: 70,
        fill: '#FFFFFF',
        opacity: 0.75,
        rotation: 0,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'battery',
        text: '▰',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 58.32,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.9,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 144.8,
          y: 155,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'rec',
        text: 'REC',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 60.34,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.95,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 935.2,
          y: 150,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'topTitle',
        text: '{titleSub}',
        style: {
          fontFamily: '江城律动宋',
          fontSize: 103.58,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 6,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 285,
          rotation: 4,
          stroke: {
            enabled: true,
            color: '#6B4A20',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.35,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '江城律动宋',
          fontSize: 149.83,
          bold: false,
          italic: false,
          underline: false,
          color: '#F4FF2D',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 515,
          rotation: 3,
          stroke: {
            enabled: true,
            color: '#806F16',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.35,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'bottomLeft',
        text: '4K 60FPS',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 50.28,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.95,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'left',
          x: 91.51,
          y: 1775,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottomCenter',
        text: '短期高效复习',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 48.27,
          bold: false,
          italic: false,
          underline: false,
          color: '#F4FF2D',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1766,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.35,
            blur: 8,
            distance: 3
          }
        }
      },
      {
        id: 'bottomNote',
        text: '跟我走 成功在望',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 38.21,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.95,
          letterSpacing: 3,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1834,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'hd',
        text: 'HD',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.95,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'right',
          x: 988.49,
          y: 1775,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V29: 面试话术指南 ----------
  {
    id: 'v29',
    name: 'V29-面试话术指南',
    description: '顶部黄色超大标题，左侧问题清单，底部白字加蓝色强调，适合面试、答题模板类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(190,235,255,0.32)',
        0.6,
        'rgba(255,255,255,0.02)',
        1,
        'rgba(0,0,0,0.18)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'bottomShade',
        type: 'rect',
        x: 0,
        y: 1510,
        width: 1080,
        height: 410,
        fill: '#000000',
        opacity: 0.12,
        rotation: 0,
        radius: 0
      },
      {
        id: 'arrowLine',
        type: 'rect',
        x: 94.53,
        y: 1750,
        width: 250.39,
        height: 18,
        fill: '#FFE545',
        opacity: 1,
        radius: 9.05,
        rotation: 20
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 190.06,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFE545',
          opacity: 1,
          letterSpacing: 6,
          lineHeight: 0.9,
          align: 'center',
          x: 540,
          y: 165,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 0,
            distance: 7
          }
        }
      },
      {
        id: 'dot1',
        text: '○',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 48.27,
          bold: false,
          italic: false,
          underline: false,
          color: '#63DDF5',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 72.4,
          y: 520,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list1',
        text: '高频问题',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 58.32,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'left',
          x: 111.62,
          y: 520,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'dot2',
        text: '○',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 48.27,
          bold: false,
          italic: false,
          underline: false,
          color: '#63DDF5',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 72.4,
          y: 615,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list2',
        text: '潜台词拆解',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 58.32,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'left',
          x: 111.62,
          y: 615,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'dot3',
        text: '○',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 58.32,
          bold: false,
          italic: false,
          underline: false,
          color: '#63DDF5',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 72.4,
          y: 710,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list3',
        text: '高分回答模板',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 58.32,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'left',
          x: 111.62,
          y: 710,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'middleTitle',
        text: '万能面试话术',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 99.55,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 440.45,
          y: 1555,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 0,
            distance: 6
          }
        }
      },
      {
        id: 'arrow',
        text: '↪',
        style: {
          fontFamily: '月星楷',
          fontSize: 109.61,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFE545',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 77.43,
          y: 1750,
          rotation: -22,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottomTitle',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 123.69,
          bold: false,
          italic: false,
          underline: false,
          color: '#63DDF5',
          opacity: 1,
          letterSpacing: 6,
          lineHeight: 1.3,
          align: 'center',
          x: 595.31,
          y: 1770,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.7,
            blur: 0,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V30: 职场晋升因素 ----------
  {
    id: 'v30',
    name: 'V30-职场晋升因素',
    description: '顶部白色巨字，左侧荧光绿标签，底部蓝色超大标题，适合职场成长、晋升经验类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.04)',
        0.6,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,0,0,0.42)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'labelBg1',
        type: 'rect',
        x: 64.36,
        y: 610,
        width: 245.36,
        height: 72,
        fill: '#D9FF66',
        opacity: 0.96,
        radius: 2.01,
        rotation: 0
      },
      {
        id: 'labelBg2',
        type: 'rect',
        x: 64.36,
        y: 720,
        width: 245.36,
        height: 72,
        fill: '#D9FF66',
        opacity: 0.96,
        radius: 2.01,
        rotation: 0
      },
      {
        id: 'labelBg3',
        type: 'rect',
        x: 64.36,
        y: 830,
        width: 245.36,
        height: 72,
        fill: '#D9FF66',
        opacity: 0.96,
        radius: 2.01,
        rotation: 0
      },
      {
        id: 'bottomDark',
        type: 'rect',
        x: 0,
        y: 1560,
        width: 1080,
        height: 360,
        fill: '#000000',
        opacity: 0.18,
        rotation: 0,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 167.93,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 5,
          lineHeight: 0.95,
          align: 'center',
          x: 540,
          y: 175,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F7F7F7',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 0,
            distance: 10
          }
        }
      },
      {
        id: 'label1',
        text: '岗位技能',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 48.27,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 186.03,
          y: 646,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'label2',
        text: '业绩成果',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 48.27,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 186.03,
          y: 756,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'label3',
        text: '大局意识',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 48.27,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 186.03,
          y: 866,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 177.99,
          bold: false,
          italic: false,
          underline: false,
          color: '#82E7FF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 0.95,
          align: 'center',
          x: 540,
          y: 1730,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 10
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.45,
            blur: 0,
            distance: 5
          }
        }
      }
    ]
  },

  // ---------- V31: 爆款封面教学 ----------
  {
    id: 'v31',
    name: 'V31-爆款封面教学',
    description: '顶部黑色超大标题，蓝色提问气泡，绿色提示文案和底部蓝色引用条，适合封面教程类内容',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.16)',
        0.62,
        'rgba(255,255,255,0)',
        1,
        'rgba(0,0,0,0.18)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'questionBubble',
        type: 'rect',
        x: 42.23,
        y: 500,
        width: 299.66,
        height: 92,
        fill: '#8FE9FF',
        opacity: 0.95,
        radius: 46.26,
        rotation: -6
      },
      {
        id: 'bottomBand',
        type: 'rect',
        x: 119.66,
        y: 1735,
        width: 879.89,
        height: 98,
        fill: '#83E8FF',
        opacity: 0.94,
        radius: 8.04,
        rotation: -2
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 167.93,
          bold: false,
          italic: false,
          underline: false,
          color: '#000000',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 0.95,
          align: 'center',
          x: 540,
          y: 185,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.7,
            blur: 0,
            distance: 5
          }
        }
      },
      {
        id: 'question',
        text: '怎么做？',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 208.16,
          y: 534,
          rotation: -6,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'tip',
        text: '一分钟就会!!',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 48.27,
          bold: false,
          italic: false,
          underline: false,
          color: '#C9FF7A',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 849.72,
          y: 540,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.5,
            blur: 0,
            distance: 3
          }
        }
      },
      {
        id: 'sparkle',
        text: '✦',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 70.39,
          bold: false,
          italic: false,
          underline: false,
          color: '#83E8FF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 710.95,
          y: 423,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'arrow',
        text: '↪',
        style: {
          fontFamily: '月星楷',
          fontSize: 93.52,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 710.95,
          y: 480,
          rotation: 22,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'leftQuote',
        text: '“',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 88.49,
          bold: false,
          italic: false,
          underline: false,
          color: '#83E8FF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 76.42,
          y: 1788,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 56.31,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 570.17,
          y: 1767,
          rotation: -2,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'rightQuote',
        text: '”',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 88.49,
          bold: false,
          italic: false,
          underline: false,
          color: '#83E8FF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 1007.6,
          y: 1778,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V32: 职场成长力 ----------
  {
    id: 'v32',
    name: 'V32-职场必修课',
    description:
      '蓝色背景氛围，顶部白色巨字，左侧黄色知识标签，底部建议收藏提示，适合职场技能课封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,166,230,0.42)',
        0.58,
        'rgba(0,130,200,0.16)',
        1,
        'rgba(0,0,0,0.18)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'labelBg1',
        type: 'rect',
        x: 42.23,
        y: 610,
        width: 349.94,
        height: 86,
        fill: '#FFE15A',
        opacity: 0.98,
        radius: 14.08,
        rotation: 0
      },
      {
        id: 'labelBg2',
        type: 'rect',
        x: 42.23,
        y: 780,
        width: 329.83,
        height: 86,
        fill: '#FFE15A',
        opacity: 0.98,
        radius: 14.08,
        rotation: 0
      },
      {
        id: 'labelBg3',
        type: 'rect',
        x: 42.23,
        y: 950,
        width: 339.89,
        height: 86,
        fill: '#FFE15A',
        opacity: 0.98,
        radius: 14.08,
        rotation: 0
      },
      {
        id: 'bottomTagBg',
        type: 'rect',
        x: 177.99,
        y: 1670,
        width: 499.78,
        height: 78,
        fill: '#FFE15A',
        opacity: 0.98,
        radius: 12.07,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 137.77,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 5,
          lineHeight: 0.95,
          align: 'center',
          x: 540,
          y: 185,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#1B86B6',
            opacity: 0.65,
            blur: 0,
            distance: 7
          }
        }
      },
      {
        id: 'label1',
        text: '高效率工作法',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 217.21,
          y: 653,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'label2',
        text: '不emo秘籍',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 207.15,
          y: 823,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'label3',
        text: '职场关系学',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 212.18,
          y: 993,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sparkle',
        text: '✦',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 82.46,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFE15A',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 177.99,
          y: 1670,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'arrow',
        text: '↪',
        style: {
          fontFamily: '月星楷',
          fontSize: 107.6,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 177.99,
          y: 1670,
          rotation: 22,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottomTip',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 50.28,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 449.5,
          y: 1707,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V33: 职场成长力 ----------
  {
    id: 'v33',
    name: 'V33-职场成长力',
    description: '顶部高级分色大标题，底部金白混排能力清单，适合职场成长、升职逻辑类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.28)',
        0.5,
        'rgba(0,0,0,0.06)',
        1,
        'rgba(0,0,0,0.68)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'bottomDeepShade',
        type: 'rect',
        x: 0,
        y: 1490,
        width: 1080,
        height: 430,
        fill: '#000000',
        opacity: 0.25,
        rotation: 0,
        radius: 0
      },
      {
        id: 'circleMark',
        type: 'rect',
        x: 788.38,
        y: 1630,
        width: 220.22,
        height: 72,
        fill: '#000000',
        opacity: 0,
        radius: 36.2,
        stroke: {
          enabled: true,
          color: '#F4DFA8',
          width: 5
        },
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'topWhite',
        text: '成长',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 149.83,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 345.92,
          y: 150,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 0,
            distance: 6
          }
        }
      },
      {
        id: 'topGold',
        text: '指南',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 149.83,
          bold: false,
          italic: false,
          underline: false,
          color: '#F4DFA8',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 720,
          y: 150,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 0,
            distance: 6
          }
        }
      },
      {
        id: 'mainTitle',
        text: '{titleMain}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 109.61,
          bold: false,
          italic: false,
          underline: false,
          color: '#F4DFA8',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1.08,
          align: 'center',
          x: 540,
          y: 1620,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 6,
            distance: 3
          }
        }
      },
      {
        id: 'bottomLine2',
        text: '{titleSub}',
        style: {
          fontFamily: '思源宋体',
          fontSize: 84.47,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.08,
          align: 'center',
          x: 540,
          y: 1790,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 6,
            distance: 3
          }
        }
      }
    ]
  },

  // ---------- V35: 雅思口语救星 ----------
  {
    id: 'v35',
    name: 'V35-雅思口语救星',
    description:
      '黑白质感背景，红白撞色标题，四个问题标签和底部红色行动条，适合英语口语、考试提分类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.72)',
        0.48,
        'rgba(0,0,0,0.52)',
        1,
        'rgba(0,0,0,0.72)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'yellowMark',
        type: 'rect',
        x: 395.2,
        y: 200,
        width: 299.66,
        height: 34,
        fill: '#FFE545',
        opacity: 0.95,
        rotation: -4,
        radius: 0
      },
      {
        id: 'tagBg1',
        type: 'rect',
        x: 82.46,
        y: 760,
        width: 245.36,
        height: 78,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 18.1,
        rotation: 3
      },
      {
        id: 'tagBg2',
        type: 'rect',
        x: 755.2,
        y: 760,
        width: 235.31,
        height: 78,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 18.1,
        rotation: -4
      },
      {
        id: 'tagBg3',
        type: 'rect',
        x: 70.39,
        y: 1035,
        width: 210.17,
        height: 76,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 16.09,
        rotation: 1
      },
      {
        id: 'tagBg4',
        type: 'rect',
        x: 790.39,
        y: 1038,
        width: 220.22,
        height: 76,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 16.09,
        rotation: 2
      },
      {
        id: 'bottomBand',
        type: 'rect',
        x: 60.34,
        y: 1770,
        width: 960.34,
        height: 98,
        fill: '#FF4B55',
        opacity: 0.98,
        radius: 49.27,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 111.62,
          bold: false,
          italic: false,
          underline: false,
          color: '#FF4B55',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 1.3,
          align: 'center',
          x: 610.39,
          y: 185,
          rotation: 5,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 0,
            distance: 6
          }
        }
      },
      {
        id: 'slashLeft',
        text: '\\',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 119.66,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 190.06,
          y: 425,
          rotation: -10,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 121.68,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 6,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 430,
          rotation: 2,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFE545',
            opacity: 0.75,
            blur: 0,
            distance: 6
          }
        }
      },
      {
        id: 'slashRight',
        text: '/',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 119.66,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 889.94,
          y: 425,
          rotation: 10,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'tag1',
        text: '词汇不够',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 42.23,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 205.14,
          y: 800,
          rotation: 3,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'tag2',
        text: '开口紧张',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 42.23,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 871.84,
          y: 800,
          rotation: -4,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'tag3',
        text: '没逻辑',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 42.23,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 174.97,
          y: 1075,
          rotation: 1,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'tag4',
        text: '不纯正',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 42.23,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 900,
          y: 1078,
          rotation: 2,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'arrow',
        text: '↪',
        style: {
          fontFamily: '月星楷',
          fontSize: 95.53,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 105.59,
          y: 129,
          rotation: 15,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'heart',
        text: '💗',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 88.49,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1530,
          rotation: -10,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottomTip',
        text: '开学自信开口 · 英语直接开挂',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 56.31,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1820,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V36: 摆脱焦虑步骤 ----------
  {
    id: 'v36',
    name: 'V36-摆脱焦虑步骤',
    description:
      '黄色黑描边大标题，左侧竖排拒绝标签，底部超大步骤提示，适合情绪管理、成长方法类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.05)',
        0.58,
        'rgba(0,0,0,0)',
        1,
        'rgba(0,0,0,0.28)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'bottomShade',
        type: 'rect',
        x: 0,
        y: 1580,
        width: 1080,
        height: 340,
        fill: '#000000',
        opacity: 0.16,
        rotation: 0,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 167.93,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF177',
          opacity: 1,
          letterSpacing: 6,
          lineHeight: 0.98,
          align: 'left',
          x: 52.29,
          y: 220,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 10
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 0,
            distance: 6
          }
        }
      },
      {
        id: 'wave',
        text: '👋',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 82.46,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD85A',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 881.9,
          y: 200,
          rotation: 12,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'leftVertical1',
        text: '拒\n绝\n内\n耗',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 50.28,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.02,
          align: 'center',
          x: 91.51,
          y: 995,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#333333',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 0,
            distance: 3
          }
        }
      },
      {
        id: 'leftCross1',
        text: '×',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 76.42,
          bold: false,
          italic: false,
          underline: false,
          color: '#FF2424',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 94.53,
          y: 851,
          rotation: 10,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'leftVertical2',
        text: '拒\n绝\n负\n面\n情\n绪',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 50.28,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.02,
          align: 'center',
          x: 210.17,
          y: 1040,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#333333',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 0,
            distance: 3
          }
        }
      },
      {
        id: 'leftCross2',
        text: '×',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 76.42,
          bold: false,
          italic: false,
          underline: false,
          color: '#FF2424',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 218.21,
          y: 849,
          rotation: -12,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottomSuffix',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 125.7,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF177',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 560.11,
          y: 1740,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 9
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 0,
            distance: 7
          }
        }
      }
    ]
  },

  // ---------- V37: 反向画饼 ----------
  {
    id: 'v37',
    name: 'V37-反向画饼',
    description: '顶部黄白分色大标题，底部棕色强描边文案和蓝色下划线，适合职场沟通、老板逻辑类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(90,35,0,0.5)',
        0.55,
        'rgba(0,0,0,0.05)',
        1,
        'rgba(255,235,0,0.62)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'bottomYellowGlow',
        type: 'rect',
        x: 0,
        y: 1560,
        width: 1080,
        height: 360,
        fill: '#FFF15A',
        opacity: 0.22,
        rotation: 0,
        radius: 0
      },
      {
        id: 'blueUnderline1',
        type: 'rect',
        x: 309.72,
        y: 1812,
        width: 260.45,
        height: 24,
        fill: '#85E8FF',
        opacity: 0.95,
        radius: 12.07,
        rotation: -4
      },
      {
        id: 'blueUnderline2',
        type: 'rect',
        x: 600.34,
        y: 1810,
        width: 299.66,
        height: 24,
        fill: '#85E8FF',
        opacity: 0.95,
        radius: 12.07,
        rotation: -3
      }
    ],
    textLayers: [
      {
        id: 'topWhite',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 173.97,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF177',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'left',
          x: 90.5,
          y: 162,
          rotation: 2,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#4B2108',
            opacity: 0.6,
            blur: 0,
            distance: 7
          }
        }
      },
      {
        id: 'topBang',
        text: '!',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 230.28,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF177',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 87.49,
          y: 1712,
          rotation: 5,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#4B2108',
            opacity: 0.45,
            blur: 0,
            distance: 6
          }
        }
      },
      {
        id: 'sparkle',
        text: '✦',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 111.62,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF177',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 45.25,
          y: 161,
          rotation: 8,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottomQuestion',
        text: '如何用老板的逻辑',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 90.5,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1670,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#6B2A00',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.35,
            blur: 0,
            distance: 4
          }
        }
      },
      {
        id: 'bottomAnswer',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 93.52,
          bold: false,
          italic: false,
          underline: false,
          color: '#6B2A00',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1825,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.5,
            blur: 0,
            distance: 4
          }
        }
      }
    ]
  },

  {
    id: 'v38',
    name: 'V38-考研党必备',
    description: '黑红撞色大标题，倾斜招数提示和点赞收藏贴纸，适合考研资料、学习方法类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(128,40,40,0.45)',
        0.5,
        'rgba(0,0,0,0.04)',
        1,
        'rgba(0,0,0,0.25)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'speechBg',
        type: 'rect',
        x: 649.61,
        y: 1240,
        width: 329.83,
        height: 180,
        fill: '#FFFFFF',
        opacity: 0.98,
        radius: 28.16,
        rotation: -5,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 6
        }
      }
    ],
    textLayers: [
      {
        id: 'topBlack',
        text: '考研党',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 135.75,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1.3,
          align: 'left',
          x: 52.29,
          y: 170,
          rotation: -3,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 9
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 0,
            distance: 6
          }
        }
      },
      {
        id: 'topRed',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 135.75,
          bold: false,
          italic: false,
          underline: false,
          color: '#B51616',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.3,
          align: 'left',
          x: 144.8,
          y: 290,
          rotation: 3,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 9
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 0,
            distance: 6
          }
        }
      },
      {
        id: 'leftTip1',
        text: '这',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 88.49,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 154.86,
          y: 505,
          rotation: -12,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'leftTipNumber',
        text: '3',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 105.59,
          bold: false,
          italic: false,
          underline: false,
          color: '#B51616',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 265.47,
          y: 500,
          rotation: -10,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'leftTip2',
        text: '招',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 88.49,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 360,
          y: 505,
          rotation: -8,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'leftTip3',
        text: '直接用！',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 66.37,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 255.42,
          y: 655,
          rotation: -8,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'slashLeft',
        text: '\\',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 95.53,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 80.45,
          y: 700,
          rotation: -8,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'slashRight',
        text: '/',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 95.53,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 484.69,
          y: 690,
          rotation: 8,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sticker',
        text: '点赞\n+收藏',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 50.28,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.2,
          align: 'center',
          x: 814.53,
          y: 1330,
          rotation: -5,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V39: 美妆直播攻略 ----------
  {
    id: 'v39',
    name: 'V39-美妆直播攻略',
    description: '粉色网格背景，黑色斜条大标题，粉色气泡卖点标签，适合美妆直播、好物购买攻略封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#FFC7E6',
      opacity: 0.42,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [
      {
        id: 'topShadowBand',
        type: 'rect',
        x: 99.55,
        y: 245,
        width: 900,
        height: 185,
        fill: '#FFF5A8',
        opacity: 0.9,
        rotation: -2,
        radius: 0
      },
      {
        id: 'topBlackBand',
        type: 'rect',
        x: 109.61,
        y: 120,
        width: 879.89,
        height: 300,
        fill: '#000000',
        opacity: 1,
        rotation: 4,
        radius: 0
      },
      {
        id: 'gridLine1',
        type: 'rect',
        x: 0,
        y: 520,
        width: 1080,
        height: 3,
        fill: '#FFFFFF',
        opacity: 0.28,
        rotation: 0,
        radius: 0
      },
      {
        id: 'gridLine2',
        type: 'rect',
        x: 0,
        y: 700,
        width: 1080,
        height: 3,
        fill: '#FFFFFF',
        opacity: 0.28,
        rotation: 0,
        radius: 0
      },
      {
        id: 'gridLine3',
        type: 'rect',
        x: 0,
        y: 880,
        width: 1080,
        height: 3,
        fill: '#FFFFFF',
        opacity: 0.28,
        rotation: 0,
        radius: 0
      },
      {
        id: 'leftBubble',
        type: 'rect',
        x: 58.32,
        y: 735,
        width: 299.66,
        height: 120,
        fill: '#FF8BD2',
        opacity: 0.98,
        radius: 52.29,
        rotation: 0
      },
      {
        id: 'rightBubble',
        type: 'rect',
        x: 720,
        y: 615,
        width: 299.66,
        height: 120,
        fill: '#FF8BD2',
        opacity: 0.98,
        radius: 52.29,
        rotation: 0
      },
      {
        id: 'smallBubble',
        type: 'rect',
        x: 770.28,
        y: 930,
        width: 215.2,
        height: 82,
        fill: '#FFE39A',
        opacity: 0.98,
        radius: 40.22,
        rotation: 0
      },
      {
        id: 'photoFrame',
        type: 'rect',
        x: 370.06,
        y: 560,
        width: 459.55,
        height: 560,
        fill: '#FFFFFF',
        opacity: 0.18,
        radius: 0,
        rotation: 0
      },
      {
        id: 'stripe1',
        type: 'rect',
        x: 56.31,
        y: 1080,
        width: 299.66,
        height: 10,
        fill: '#FF6BC5',
        opacity: 0.55,
        rotation: 45,
        radius: 0
      },
      {
        id: 'stripe2',
        type: 'rect',
        x: 80.45,
        y: 1125,
        width: 299.66,
        height: 10,
        fill: '#FF6BC5',
        opacity: 0.55,
        rotation: 45,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'star',
        text: '⭐',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 82.46,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF5A8',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 94.53,
          y: 290,
          rotation: -12,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 127.71,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 225,
          rotation: 4,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 72.4,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 365,
          rotation: 4,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'peace',
        text: '✌',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 86.48,
          bold: false,
          italic: false,
          underline: false,
          color: '#FF8BD2',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 970.39,
          y: 180,
          rotation: 12,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'leftBubbleText',
        text: '福利秒杀',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 208.16,
          y: 795,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'rightBubbleText',
        text: '好礼空降',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 869.83,
          y: 675,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'smallBubbleText',
        text: '大牌好物',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 38.21,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 877.88,
          y: 971,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'eyes',
        text: '👀',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 82.46,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 879.89,
          y: 1620,
          rotation: 8,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  {
    id: 'v40',
    name: 'V40-小卧室收纳',
    description: '棕色标题条搭配白色斜条副标题，黄色小标签和收藏提示，适合家居收纳、空间整理类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.05)',
        0.62,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,0,0,0.16)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'topBrownBand',
        type: 'rect',
        x: 114.64,
        y: 190,
        width: 859.78,
        height: 190,
        fill: '#A96824',
        opacity: 0.96,
        rotation: 1,
        radius: 0
      },
      {
        id: 'topTag',
        type: 'rect',
        x: 689.83,
        y: 135,
        width: 240.34,
        height: 72,
        fill: '#FFC333',
        opacity: 0.98,
        radius: 36.2,
        rotation: 5
      },
      {
        id: 'whiteBand',
        type: 'rect',
        x: 210.17,
        y: 420,
        width: 790.39,
        height: 160,
        fill: '#FFFFFF',
        opacity: 0.96,
        rotation: -4,
        radius: 0
      },
      {
        id: 'leftTipBg',
        type: 'rect',
        x: 90.5,
        y: 1490,
        width: 319.78,
        height: 150,
        fill: '#000000',
        opacity: 0.1,
        radius: 12.07,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'tagText',
        text: '吐血整理',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 40.22,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 810.5,
          y: 172,
          rotation: 5,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '思源宋体',
          fontSize: 93.52,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 6,
          lineHeight: 1.3,
          align: 'center',
          x: 550.06,
          y: 287,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#5F3411',
            opacity: 0.45,
            blur: 0,
            distance: 4
          }
        }
      },
      {
        id: 'horn',
        text: '📣',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 76.42,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 127.71,
          y: 535,
          rotation: -12,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '思源宋体',
          fontSize: 86.48,
          bold: false,
          italic: false,
          underline: false,
          color: '#A96824',
          opacity: 1,
          letterSpacing: 6,
          lineHeight: 1.3,
          align: 'center',
          x: 630.5,
          y: 468,
          rotation: -4,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'shineRight',
        text: '〃',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 78.44,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 970.39,
          y: 750,
          rotation: 18,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'leftTip',
        text: '建议收藏！\n关注我 不迷路',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 44.25,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.25,
          align: 'left',
          x: 97.54,
          y: 1564,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#A96824',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.35,
            blur: 5,
            distance: 2
          }
        }
      }
    ]
  },

  // ---------- V41: 装修避坑经验 ----------
  {
    id: 'v41',
    name: 'V41-装修避坑经验',
    description: '白色标题框、橙色经验条、底部避坑提示和选中框装饰，适合装修避坑、经验分享类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#8D8A7F',
      opacity: 0.18,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [
      {
        id: 'topWhiteBox',
        type: 'rect',
        x: 76.42,
        y: 92,
        width: 928.16,
        height: 180,
        fill: '#FFFFFF',
        opacity: 0.98,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 4
        },
        rotation: 0,
        radius: 0
      },
      {
        id: 'orangeBand',
        type: 'rect',
        x: 230.28,
        y: 278,
        width: 730.06,
        height: 124,
        fill: '#E7B092',
        opacity: 0.98,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 4
        },
        rotation: 0,
        radius: 0
      },
      {
        id: 'bottomWhiteBox',
        type: 'rect',
        x: 42.23,
        y: 1585,
        width: 995.53,
        height: 112,
        fill: '#FFFFFF',
        opacity: 0.98,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 4
        },
        rotation: 0,
        radius: 0
      },
      {
        id: 'corner1',
        type: 'rect',
        x: 66.37,
        y: 74,
        width: 30.17,
        height: 30,
        fill: '#FFFFFF',
        opacity: 1,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 3
        },
        rotation: 0,
        radius: 0
      },
      {
        id: 'corner2',
        type: 'rect',
        x: 984.47,
        y: 74,
        width: 30.17,
        height: 30,
        fill: '#FFFFFF',
        opacity: 1,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 3
        },
        rotation: 0,
        radius: 0
      },
      {
        id: 'corner3',
        type: 'rect',
        x: 66.37,
        y: 1563,
        width: 30.17,
        height: 30,
        fill: '#FFFFFF',
        opacity: 1,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 3
        },
        rotation: 0,
        radius: 0
      },
      {
        id: 'corner4',
        type: 'rect',
        x: 984.47,
        y: 1563,
        width: 30.17,
        height: 30,
        fill: '#FFFFFF',
        opacity: 1,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 3
        },
        rotation: 0,
        radius: 0
      },
      {
        id: 'bubbleBg',
        type: 'rect',
        x: 169.94,
        y: 1435,
        width: 220.22,
        height: 62,
        fill: '#FFFFFF',
        opacity: 0.98,
        radius: 12.07,
        rotation: 6,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 3
        }
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 78.44,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 180,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 62.35,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 595.31,
          y: 340,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'light',
        text: '💡',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 68.38,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 119.66,
          y: 505,
          rotation: -12,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'arrow',
        text: '↪',
        style: {
          fontFamily: '月星楷',
          fontSize: 82.46,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 88.49,
          y: 1500,
          rotation: 22,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bubbleText',
        text: '建议收藏',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 36.2,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 279.55,
          y: 1465,
          rotation: 6,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottom',
        text: '新家装修要避开的 1回1个坑',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 60.34,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 1641,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  {
    id: 'v42',
    name: 'V42-装修清单抄作业',
    description: '双层黄色标题条，装修清单列表和欢迎围观贴纸，适合家装避坑、省钱清单类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.08)',
        0.62,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,0,0,0.16)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'topBandBack',
        type: 'rect',
        x: 93.52,
        y: 118,
        width: 889.94,
        height: 132,
        fill: '#FFFFFF',
        opacity: 0.95,
        rotation: -2,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 4
        },
        radius: 0
      },
      {
        id: 'topBand1',
        type: 'rect',
        x: 111.62,
        y: 125,
        width: 829.61,
        height: 120,
        fill: '#FFE15A',
        opacity: 0.98,
        rotation: -2,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 4
        },
        radius: 0
      },
      {
        id: 'topBand2',
        type: 'rect',
        x: 155.87,
        y: 255,
        width: 824.58,
        height: 120,
        fill: '#FFE15A',
        opacity: 0.98,
        rotation: 1,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 4
        },
        radius: 0
      },
      {
        id: 'listBg1',
        type: 'rect',
        x: 25.14,
        y: 785,
        width: 519.89,
        height: 72,
        fill: '#FFFFFF',
        opacity: 0.96,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 3
        },
        rotation: 0,
        radius: 0
      },
      {
        id: 'listBg2',
        type: 'rect',
        x: 25.14,
        y: 890,
        width: 519.89,
        height: 72,
        fill: '#FFFFFF',
        opacity: 0.96,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 3
        },
        rotation: 0,
        radius: 0
      },
      {
        id: 'listBg3',
        type: 'rect',
        x: 25.14,
        y: 995,
        width: 519.89,
        height: 72,
        fill: '#FFFFFF',
        opacity: 0.96,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 3
        },
        rotation: 0,
        radius: 0
      },
      {
        id: 'bottomBurst',
        type: 'rect',
        x: 210.17,
        y: 1605,
        width: 270.5,
        height: 180,
        fill: '#FFE15A',
        opacity: 0.98,
        radius: 28.16,
        rotation: -5,
        stroke: {
          enabled: true,
          color: '#111111',
          width: 5
        }
      }
    ],
    textLayers: [
      {
        id: 'mainLine1',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 78.44,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1.3,
          align: 'center',
          x: 540,
          y: 185,
          rotation: -2,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'mainLine2',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 82.46,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1.3,
          align: 'center',
          x: 565.14,
          y: 315,
          rotation: 1,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 7
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'eyes',
        text: '👀',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 84.47,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 104.58,
          y: 342,
          rotation: -10,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list1Icon',
        text: '✓',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 46.26,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD52E',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 76.42,
          y: 824,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list1',
        text: '瓷砖怎么选最省钱',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 42.23,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'left',
          x: 114.64,
          y: 824,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list2Icon',
        text: '✓',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 46.26,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD52E',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 76.42,
          y: 929,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list2',
        text: '家电应该要怎么选',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 42.23,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'left',
          x: 114.64,
          y: 929,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list3Icon',
        text: '✓',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 46.26,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD52E',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 76.42,
          y: 1034,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'list3',
        text: '吊顶性价比最高',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 42.23,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'left',
          x: 114.64,
          y: 1034,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'horn',
        text: '📣',
        style: {
          fontFamily: '微软雅黑',
          fontSize: 91.51,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 114.64,
          y: 1710,
          rotation: -20,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'bottomTip',
        text: '欢迎\n围观',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 50.28,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.15,
          align: 'center',
          x: 344.92,
          y: 1695,
          rotation: -5,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'arrow',
        text: '↪',
        style: {
          fontFamily: '月星楷',
          fontSize: 82.46,
          bold: false,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 72.4,
          y: 655,
          rotation: 20,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V44: 视频日记REC ----------
  {
    id: 'v44',
    name: 'V44-视频日记REC',
    description:
      '左上 REC 录制框，右上日期与 Day 数字，底部白色大标题，适合视频日记、个人成长口播封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.42)',
        0.55,
        'rgba(0,0,0,0.08)',
        1,
        'rgba(0,0,0,0.58)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'recLeftTopV',
        type: 'rect',
        x: 70.39,
        y: 88,
        width: 8.04,
        height: 330,
        fill: '#F4FF38',
        opacity: 0.95,
        radius: 4.02,
        rotation: 0
      },
      {
        id: 'recLeftTopH',
        type: 'rect',
        x: 70.39,
        y: 88,
        width: 30.17,
        height: 8,
        fill: '#F4FF38',
        opacity: 0.95,
        radius: 4.02,
        rotation: 0
      },
      {
        id: 'recLeftBottomH',
        type: 'rect',
        x: 70.39,
        y: 410,
        width: 30.17,
        height: 8,
        fill: '#F4FF38',
        opacity: 0.95,
        radius: 4.02,
        rotation: 0
      },
      {
        id: 'recRightTopV',
        type: 'rect',
        x: 375.08,
        y: 88,
        width: 8.04,
        height: 330,
        fill: '#F4FF38',
        opacity: 0.95,
        radius: 4.02,
        rotation: 0
      },
      {
        id: 'recRightTopH',
        type: 'rect',
        x: 344.92,
        y: 88,
        width: 38.21,
        height: 8,
        fill: '#F4FF38',
        opacity: 0.95,
        radius: 4.02,
        rotation: 0
      },
      {
        id: 'recRightBottomH',
        type: 'rect',
        x: 344.92,
        y: 410,
        width: 38.21,
        height: 8,
        fill: '#F4FF38',
        opacity: 0.95,
        radius: 4.02,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'rec',
        text: '● REC',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 34.19,
          bold: true,
          italic: false,
          underline: false,
          color: '#F4FF38',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'left',
          x: 34.19,
          y: 45,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 6,
            distance: 2
          }
        }
      },
      {
        id: 'diaryCn',
        text: '视频\n日记',
        style: {
          fontFamily: '思源宋体',
          fontSize: 103.58,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.22,
          align: 'center',
          x: 225.25,
          y: 240,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'diaryEn',
        text: 'Diary',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 34.19,
          bold: true,
          italic: false,
          underline: false,
          color: '#F4FF38',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'center',
          x: 225.25,
          y: 455,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 6,
            distance: 2
          }
        }
      },
      {
        id: 'date',
        text: '2026/03/29',
        style: {
          fontFamily: '源样明体',
          fontSize: 70.39,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 824.58,
          y: 145,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.48,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'day',
        text: 'Day 36',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 125.7,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 800.45,
          y: 305,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 5
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '江城斜黑体',
          fontSize: 137.77,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.06,
          align: 'left',
          x: 38.21,
          y: 1390,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#E9F5F8',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.48,
            blur: 12,
            distance: 5
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '江城斜黑体',
          fontSize: 137.77,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.06,
          align: 'left',
          x: 38.21,
          y: 1610,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#E9F5F8',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.48,
            blur: 12,
            distance: 5
          }
        }
      }
    ]
  },

  // ---------- V45: 淡淡VLOG ----------
  {
    id: 'v45',
    name: 'V45-淡淡VLOG',
    description: '粉白发光 VLOG 标识，白底黑字日常文案条，适合生活记录、学习日常、轻松口播封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.02)',
        0.58,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,0,0,0.28)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'textBox1',
        type: 'rect',
        x: 72.4,
        y: 1310,
        width: 550.06,
        height: 102,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 0,
        rotation: 0
      },
      {
        id: 'textBox2',
        type: 'rect',
        x: 139.78,
        y: 1425,
        width: 760.22,
        height: 108,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 0,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'leftQuote',
        text: '“',
        style: {
          fontFamily: '思源宋体',
          fontSize: 72.4,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 24.13,
          y: 1385,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.3,
            blur: 8,
            distance: 2
          }
        }
      },
      {
        id: 'vlog',
        text: 'VLOG',
        style: {
          fontFamily: '源样明体',
          fontSize: 125.7,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.3,
          align: 'left',
          x: 64.36,
          y: 1185,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFB4D6',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FF77B8',
            opacity: 0.8,
            blur: 16,
            distance: 0
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 76.42,
          bold: true,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 346.93,
          y: 1362,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 74.41,
          bold: true,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'center',
          x: 519.89,
          y: 1482,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'rightQuote',
        text: '”',
        style: {
          fontFamily: '思源宋体',
          fontSize: 72.4,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 1051.84,
          y: 1465,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.3,
            blur: 8,
            distance: 2
          }
        }
      }
    ]
  },

  {
    id: 'v46',
    name: 'V46-富豪访谈',
    description: '半透明灰色横幅，青色大标题搭配白色副标题',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 826,
      width: 1080,
      height: 518,
      color: '#B8B8B8',
      opacity: 0.58,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      rotation: 0
    },
    shapes: [
      {
        id: 'wealthBandTopShade',
        type: 'rect',
        x: 0,
        y: 826,
        width: 1080,
        height: 42,
        fill: '#FFFFFF',
        opacity: 0.16,
        rotation: 0,
        radius: 0
      },
      {
        id: 'wealthBandBottomShade',
        type: 'rect',
        x: 0,
        y: 1286,
        width: 1080,
        height: 70,
        fill: '#6E6E6E',
        opacity: 0.2,
        rotation: 0,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 141.79,
          bold: false,
          italic: false,
          underline: false,
          color: '#8FFFF2',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1.12,
          align: 'center',
          x: 540,
          y: 970,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.82,
            blur: 3,
            distance: 10
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 76.42,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.18,
          align: 'center',
          x: 540,
          y: 1162,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.78,
            blur: 2,
            distance: 7
          }
        }
      }
    ]
  },

  // ---------- V47: 小店日记 ----------
  {
    id: 'v47',
    name: 'V47-小店日记',
    description: '左上括号日记标、右上日期与 Day、中部黄字钩、底部白条半透黄底主标题',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [
      {
        id: 'vlogYellowBand',
        type: 'rect',
        x: 0,
        y: 1530,
        width: 1080,
        height: 220,
        fill: '#FFE066',
        opacity: 0.5,
        radius: 0,
        rotation: 0
      },
      {
        id: 'diaryBracketLeftTop',
        type: 'rect',
        x: 28.16,
        y: 55,
        width: 74.41,
        height: 10,
        fill: '#FFEB3B',
        opacity: 1,
        radius: 5.03,
        rotation: 0
      },
      {
        id: 'diaryBracketLeft',
        type: 'rect',
        x: 28.16,
        y: 55,
        width: 10.06,
        height: 270,
        fill: '#FFEB3B',
        opacity: 1,
        radius: 5.03,
        rotation: 0
      },
      {
        id: 'diaryBracketLeftBottom',
        type: 'rect',
        x: 28.16,
        y: 315,
        width: 74.41,
        height: 10,
        fill: '#FFEB3B',
        opacity: 1,
        radius: 5.03,
        rotation: 0
      },
      {
        id: 'diaryBracketRightTop',
        type: 'rect',
        x: 390.17,
        y: 55,
        width: 74.41,
        height: 10,
        fill: '#FFEB3B',
        opacity: 1,
        radius: 5.03,
        rotation: 0
      },
      {
        id: 'diaryBracketRight',
        type: 'rect',
        x: 453.52,
        y: 55,
        width: 10.06,
        height: 270,
        fill: '#FFEB3B',
        opacity: 1,
        radius: 5.03,
        rotation: 0
      },
      {
        id: 'diaryBracketRightBottom',
        type: 'rect',
        x: 390.17,
        y: 315,
        width: 74.41,
        height: 10,
        fill: '#FFEB3B',
        opacity: 1,
        radius: 5.03,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'diaryTag',
        text: '视频\n日记',
        style: {
          fontFamily: '东方大楷',
          fontSize: 117.65,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 0.94,
          align: 'center',
          x: 246.37,
          y: 185,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#777777',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.65,
            blur: 6,
            distance: 7
          }
        }
      },
      {
        id: 'shootDate',
        text: '2026/03/21',
        style: {
          fontFamily: '思源黑体',
          fontSize: 64.36,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'right',
          x: 1045.81,
          y: 72,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 5,
            distance: 5
          }
        }
      },
      {
        id: 'dayCount',
        text: 'Day 16',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 149.83,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'right',
          x: 1051.84,
          y: 198,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.72,
            blur: 8,
            distance: 8
          }
        }
      },
      {
        id: 'hook',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 127.71,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFEB3B',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.15,
          align: 'left',
          x: 38.21,
          y: 1355,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#4B4B00',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.78,
            blur: 10,
            distance: 7
          }
        }
      },
      {
        id: 'main',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 145.81,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.12,
          align: 'center',
          x: 540,
          y: 1640,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#3A3A3A',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.9,
            blur: 8,
            distance: 8
          }
        }
      }
    ]
  },

  // ---------- V48: 老板语录 ----------
  {
    id: 'v48',
    name: 'V48-老板语录',
    description: '左上账号名，底部磨砂圆角框，黄字主标题搭配白色副标题',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 44.25,
      y: 1230,
      width: 991.51,
      height: 440,
      color: '#3F3F3F',
      opacity: 0.48,
      radius: 34.19,
      stroke: {
        enabled: true,
        color: '#FFFFFF',
        width: 4
      },
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'account',
        text: '@美业X姐',
        style: {
          fontFamily: '思源黑体',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'left',
          x: 64.36,
          y: 1160,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#555555',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 6,
            distance: 4
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '东方大楷',
          fontSize: 109.61,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF6A3',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1.08,
          align: 'center',
          x: 540,
          y: 1390,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#6B5F24',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.72,
            blur: 8,
            distance: 5
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 70.39,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.15,
          align: 'center',
          x: 540,
          y: 1550,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#333333',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.68,
            blur: 8,
            distance: 5
          }
        }
      }
    ]
  },

  {
    id: 'v49',
    name: 'V49-数学方法',
    description: '白底黑字问题句，黄底黑字方法句，底部黑底白字栏目名',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [
      {
        id: 'mathWhiteBox',
        type: 'rect',
        x: 70.39,
        y: 1160,
        width: 699.89,
        height: 150,
        fill: '#FFFFFF',
        opacity: 0.98,
        radius: 0,
        rotation: 0
      },
      {
        id: 'mathYellowBox',
        type: 'rect',
        x: 70.39,
        y: 1315,
        width: 910.06,
        height: 160,
        fill: '#F5FF00',
        opacity: 0.98,
        radius: 0,
        rotation: 0
      },
      {
        id: 'mathBlackTag',
        type: 'rect',
        x: 70.39,
        y: 1480,
        width: 344.92,
        height: 78,
        fill: '#000000',
        opacity: 0.94,
        radius: 0,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 99.55,
          bold: true,
          italic: false,
          underline: false,
          color: '#000000',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'left',
          x: 93.52,
          y: 1237,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 103.58,
          bold: true,
          italic: false,
          underline: false,
          color: '#000000',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1,
          align: 'left',
          x: 93.52,
          y: 1398,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'tag',
        text: 'XX谈教育',
        style: {
          fontFamily: '思源黑体',
          fontSize: 52.29,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'left',
          x: 88.49,
          y: 1520,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.35,
            blur: 4,
            distance: 2
          }
        }
      }
    ]
  },
  {
    id: 'v50',
    name: 'V50-HR面试判断',
    description: '橙色发光访谈横幅，右上身份标签，白色斜体长标题',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [
      {
        id: 'hrGlowTop',
        type: 'rect',
        x: 25.14,
        y: 1070,
        width: 1029.72,
        height: 90,
        fill: '#FF9800',
        opacity: 0.34,
        radius: 26.15,
        rotation: 0
      },
      {
        id: 'hrOrangeBox',
        type: 'rect',
        x: 44.25,
        y: 1130,
        width: 991.51,
        height: 390,
        fill: '#E99012',
        opacity: 0.78,
        radius: 18.1,
        rotation: 0
      },
      {
        id: 'hrGlowBottom',
        type: 'rect',
        x: 32.18,
        y: 1485,
        width: 1015.64,
        height: 75,
        fill: '#FF9800',
        opacity: 0.28,
        radius: 28.16,
        rotation: 0
      },
      {
        id: 'hrBubbleTail',
        type: 'rect',
        x: 129.72,
        y: 1495,
        width: 139.78,
        height: 140,
        fill: '#E99012',
        opacity: 0.68,
        radius: 8.04,
        rotation: 45
      },
      {
        id: 'hrTagBase',
        type: 'rect',
        x: 595.31,
        y: 940,
        width: 390.17,
        height: 86,
        fill: '#D8941B',
        opacity: 0.86,
        radius: 0,
        rotation: 0
      },
      {
        id: 'hrTagLine',
        type: 'rect',
        x: 641.56,
        y: 1020,
        width: 400.22,
        height: 7,
        fill: '#FFFFFF',
        opacity: 0.9,
        radius: 0,
        rotation: -6
      }
    ],
    textLayers: [
      {
        id: 'quote',
        text: '“',
        style: {
          fontFamily: '思源宋体',
          fontSize: 82.46,
          bold: false,
          italic: true,
          underline: false,
          color: '#FFE4A3',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'left',
          x: 610.39,
          y: 976,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#8A4A00',
            opacity: 0.55,
            blur: 4,
            distance: 2
          }
        }
      },
      {
        id: 'tag',
        text: '大厂10年HR',
        style: {
          fontFamily: '方正书宋简体',
          fontSize: 54.3,
          bold: false,
          italic: true,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'right',
          x: 999.55,
          y: 984,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#8A4A00',
            opacity: 0.55,
            blur: 5,
            distance: 3
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '方正书宋简体',
          fontSize: 86.48,
          bold: false,
          italic: true,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.15,
          align: 'center',
          x: 540,
          y: 1250,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#7B3F00',
            opacity: 0.6,
            blur: 8,
            distance: 5
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '方正书宋简体',
          fontSize: 78.44,
          bold: false,
          italic: true,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1.15,
          align: 'center',
          x: 540,
          y: 1385,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#7B3F00',
            opacity: 0.6,
            blur: 8,
            distance: 5
          }
        }
      }
    ]
  },

  {
    id: 'v51',
    name: 'V51-保险推销',
    description: '大号蓝字黑边标题，底部蓝色圆角条承载白色提问',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [
      {
        id: 'insuranceBlueBar',
        type: 'rect',
        x: 34.19,
        y: 1565,
        width: 1011.62,
        height: 170,
        fill: '#4EB7ED',
        opacity: 0.96,
        radius: 28.16,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 157.88,
          bold: true,
          italic: false,
          underline: false,
          color: '#55BDF4',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1375,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.82,
            blur: 6,
            distance: 7
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 103.58,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1650,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#222222',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.78,
            blur: 5,
            distance: 5
          }
        }
      }
    ]
  },

  {
    id: 'v52',
    name: 'V52-大健康专业',
    description: '底部黑色渐变，薄荷绿大标题带角标，白色专业副标题',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 960,
      width: 1080,
      height: 960,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 960
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0)',
        0.35,
        'rgba(0,0,0,0.55)',
        1,
        'rgba(0,0,0,0.98)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'healthCornerLT1',
        type: 'rect',
        x: 42.23,
        y: 1310,
        width: 58.32,
        height: 8,
        fill: '#68F0B0',
        opacity: 1,
        radius: 0,
        rotation: 0
      },
      {
        id: 'healthCornerLT2',
        type: 'rect',
        x: 42.23,
        y: 1310,
        width: 8.04,
        height: 66,
        fill: '#68F0B0',
        opacity: 1,
        radius: 0,
        rotation: 0
      },
      {
        id: 'healthCornerRT1',
        type: 'rect',
        x: 968.38,
        y: 1525,
        width: 58.32,
        height: 8,
        fill: '#68F0B0',
        opacity: 1,
        radius: 0,
        rotation: 0
      },
      {
        id: 'healthCornerRT2',
        type: 'rect',
        x: 1017.65,
        y: 1465,
        width: 8.04,
        height: 68,
        fill: '#68F0B0',
        opacity: 1,
        radius: 0,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 141.79,
          bold: true,
          italic: false,
          underline: false,
          color: '#6EF3B3',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1415,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#073E29',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.82,
            blur: 10,
            distance: 7
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '思源宋体',
          fontSize: 82.46,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 5,
          lineHeight: 1.12,
          align: 'center',
          x: 540,
          y: 1630,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.8,
            blur: 8,
            distance: 5
          }
        }
      }
    ]
  },

  {
    id: 'v53',
    name: 'V53-养生SPA',
    description: '暖色暗角背景，中部白绿手写标题，左下门店标签和服务列表',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.1)',
        0.48,
        'rgba(0,0,0,0.05)',
        1,
        'rgba(0,0,0,0.7)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'spaShopTag',
        type: 'rect',
        x: 52.29,
        y: 1605,
        width: 341.9,
        height: 72,
        fill: '#69DFA6',
        opacity: 0.96,
        radius: 14.08,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'lead',
        text: '带你第一视角',
        style: {
          fontFamily: '三极行楷简体',
          fontSize: 86.48,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 5,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1060,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#453B2D',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.75,
            blur: 8,
            distance: 6
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '三极行楷简体',
          fontSize: 103.58,
          bold: false,
          italic: false,
          underline: false,
          color: '#5FD59B',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'left',
          x: 82.46,
          y: 1195,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#2B4F39',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.72,
            blur: 8,
            distance: 6
          }
        }
      },
      {
        id: 'shop',
        text: '厦门·XXX',
        style: {
          fontFamily: '霞鹜文楷',
          fontSize: 46.26,
          bold: false,
          italic: false,
          underline: false,
          color: '#123126',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'left',
          x: 74.41,
          y: 1642,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '霞鹜文楷',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1,
          align: 'left',
          x: 54.3,
          y: 1745,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.8,
            blur: 8,
            distance: 5
          }
        }
      }
    ]
  },

  {
    id: 'v56',
    name: 'V56-房贷守钱包',
    description: '暗部阴影遮罩，紧凑三层渐变大字，红色重点压住灰白信息层，黄色结果句在最上层',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 538,
      width: 1080,
      height: 1382,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1382
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0)',
        0.18,
        'rgba(0,0,0,0.5)',
        0.58,
        'rgba(0,0,0,0.74)',
        1,
        'rgba(0,0,0,0.94)'
      ],
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'top',
        text: '房贷利率调整',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 117.65,
          bold: true,
          italic: false,
          underline: false,
          color: '#E6E6E6',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 0.9,
          align: 'left',
          x: 38.21,
          y: 1185,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.86,
            blur: 5,
            distance: 9
          },
          fillLinearGradientStartPoint: {
            x: 0,
            y: 0
          },
          fillLinearGradientEndPoint: {
            x: 0,
            y: 118
          },
          fillLinearGradientColorStops: [0, '#FFFFFF', 0.48, '#DCDCDC', 1, '#7B7B7B']
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 248.38,
          bold: true,
          italic: false,
          underline: false,
          color: '#F51F1F',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 0.88,
          align: 'left',
          x: 26.15,
          y: 1391,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#220000',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.9,
            blur: 7,
            distance: 10
          },
          fillLinearGradientStartPoint: {
            x: 0,
            y: 0
          },
          fillLinearGradientEndPoint: {
            x: 0,
            y: 248
          },
          fillLinearGradientColorStops: [0, '#FF3C36', 0.46, '#E61519', 1, '#740008']
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 141.79,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFD447',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 0.9,
          align: 'left',
          x: 36.2,
          y: 1610,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#2F1B00',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.88,
            blur: 7,
            distance: 9
          },
          fillLinearGradientStartPoint: {
            x: 0,
            y: 0
          },
          fillLinearGradientEndPoint: {
            x: 0,
            y: 142
          },
          fillLinearGradientColorStops: [0, '#FFF176', 0.48, '#FFC928', 1, '#FF8A00']
        }
      }
    ]
  },

  {
    id: 'v57',
    name: 'V57-AI陪读育娃',
    description: '泡泡字层级：粉色AI陪读、黄色轻松育娃、白色卖点、蓝色结果句，统一黑色描边',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.08)',
        0.55,
        'rgba(0,0,0,0)',
        1,
        'rgba(0,0,0,0.28)'
      ],
      rotation: 0
    },
    shapes: [],
    textLayers: [
      {
        id: 'top',
        text: 'AI陪读',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 115.64,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFA6C9',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'left',
          x: 54.3,
          y: 112,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 9
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#050505',
            opacity: 0.95,
            blur: 0,
            distance: 8
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 161.9,
          bold: true,
          italic: false,
          underline: false,
          color: '#FBFF8D',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 330,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 10
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#050505',
            opacity: 0.96,
            blur: 0,
            distance: 9
          }
        }
      },
      {
        id: 'sparkle',
        text: '✨\n✨',
        style: {
          fontFamily: '思源黑体',
          fontSize: 50.28,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFE466',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.8,
          align: 'center',
          x: 58.32,
          y: 1345,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#5B4200',
            opacity: 0.55,
            blur: 5,
            distance: 2
          }
        }
      },
      {
        id: 'points',
        text: '不费妈\n不花钱',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 64.36,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.18,
          align: 'left',
          x: 131.73,
          y: 1353,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.72,
            blur: 5,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 147.82,
          bold: true,
          italic: false,
          underline: false,
          color: '#DFFBFF',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1700,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 10
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#050505',
            opacity: 0.96,
            blur: 0,
            distance: 9
          }
        }
      }
    ]
  },

  {
    id: 'v58',
    name: 'V58-父母教育',
    description: '顶部灰条黄色整行标题，中部图钉卖点，底部白黄双层教育金句',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.12)',
        0.48,
        'rgba(0,0,0,0)',
        1,
        'rgba(0,0,0,0.36)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'parentTopBand',
        type: 'rect',
        x: 0,
        y: 46,
        width: 1080,
        height: 205,
        fill: '#EAEAEA',
        opacity: 0.72,
        radius: 0,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '真正厉害的父母',
        style: {
          fontFamily: '东方大楷',
          fontSize: 95.53,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF7A8',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 150,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#3B3320',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.72,
            blur: 8,
            distance: 6
          }
        }
      },
      {
        id: 'pinPoints',
        text: '📌多肯定\n📌少打压',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 48.27,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.22,
          align: 'left',
          x: 74.41,
          y: 1220,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#333333',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.7,
            blur: 6,
            distance: 4
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '东方大楷',
          fontSize: 121.68,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 5,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1465,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#2D2D2D',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.82,
            blur: 9,
            distance: 7
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '东方大楷',
          fontSize: 117.65,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF59A',
          opacity: 1,
          letterSpacing: 5,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1665,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#4A3F1C',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.82,
            blur: 9,
            distance: 7
          }
        }
      }
    ]
  },

  {
    id: 'v59',
    name: 'V59-低首付买房',
    description: '房产顾问封面，底部蓝黑阴影遮罩，白橙绿大字突出月薪与买房',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0)',
        0.45,
        'rgba(0,0,0,0.02)',
        0.64,
        'rgba(0,0,0,0.42)',
        0.78,
        'rgba(0,23,94,0.82)',
        1,
        'rgba(0,28,130,0.96)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'bottomBlueShadow',
        type: 'rect',
        x: 0,
        y: 1160,
        width: 1080,
        height: 760,
        opacity: 1,
        radius: 0,
        fillLinearGradientStartPoint: {
          x: 0,
          y: 0
        },
        fillLinearGradientEndPoint: {
          x: 0,
          y: 760
        },
        fillLinearGradientColorStops: [
          0,
          'rgba(0,0,0,0)',
          0.28,
          'rgba(0,16,65,0.42)',
          0.58,
          'rgba(0,35,144,0.82)',
          1,
          'rgba(0,25,118,0.98)'
        ],
        rotation: 0
      },
      {
        id: 'titleBackShadow',
        type: 'rect',
        x: 0,
        y: 1030,
        width: 1080,
        height: 460,
        opacity: 0.72,
        radius: 0,
        fillLinearGradientStartPoint: {
          x: 0,
          y: 0
        },
        fillLinearGradientEndPoint: {
          x: 1080,
          y: 0
        },
        fillLinearGradientColorStops: [
          0,
          'rgba(0,0,0,0.62)',
          0.5,
          'rgba(0,0,0,0.18)',
          1,
          'rgba(0,0,0,0.02)'
        ],
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'consultant',
        text: '资深置业顾问 X哥',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 56.31,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'right',
          x: 1037.77,
          y: 78,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#4B4B4B',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.72,
            blur: 7,
            distance: 4
          }
        }
      },
      {
        id: 'salaryLine',
        text: '{titleMain}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 184.02,
          bold: false,
          italic: false,
          underline: false,
          color: '#FF6B00',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'left',
          x: 50.28,
          y: 1170,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.86,
            blur: 6,
            distance: 9
          }
        }
      },
      {
        id: 'buyHouseLine',
        text: '{titleSub}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 177.99,
          bold: false,
          italic: false,
          underline: false,
          color: '#35F29B',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1,
          align: 'left',
          x: 52.29,
          y: 1385,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#073A2D',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.84,
            blur: 5,
            distance: 8
          }
        }
      },
      {
        id: 'sub',
        text: '超低首付房源推荐',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 82.46,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'left',
          x: 58.32,
          y: 1802,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#0B1742',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.78,
            blur: 5,
            distance: 5
          }
        }
      }
    ]
  },

  {
    id: 'v60',
    name: 'V60-年底美发预约',
    description: '上下双红色渐变遮罩，顶部米黄书法大字，底部白色预约提示',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [
      {
        id: 'topRedMask',
        type: 'rect',
        x: 0,
        y: 0,
        width: 1080,
        height: 430,
        opacity: 1,
        radius: 0,
        fillLinearGradientStartPoint: {
          x: 0,
          y: 0
        },
        fillLinearGradientEndPoint: {
          x: 0,
          y: 430
        },
        fillLinearGradientColorStops: [
          0,
          'rgba(139,0,0,0.92)',
          0.56,
          'rgba(170,27,15,0.58)',
          1,
          'rgba(170,27,15,0)'
        ],
        rotation: 0
      },
      {
        id: 'bottomRedMask',
        type: 'rect',
        x: 0,
        y: 1200,
        width: 1080,
        height: 720,
        opacity: 1,
        radius: 0,
        fillLinearGradientStartPoint: {
          x: 0,
          y: 0
        },
        fillLinearGradientEndPoint: {
          x: 0,
          y: 720
        },
        fillLinearGradientColorStops: [
          0,
          'rgba(120,0,0,0)',
          0.28,
          'rgba(118,0,0,0.42)',
          0.64,
          'rgba(145,0,0,0.82)',
          1,
          'rgba(154,0,0,0.98)'
        ],
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'topEnglish',
        text: 'YU YUE',
        style: {
          fontFamily: 'Times New Roman',
          fontSize: 103.58,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.12,
          letterSpacing: 10,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 105,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'topTitle',
        text: '提前预约',
        style: {
          fontFamily: '东方大楷',
          fontSize: 177.99,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFE8B1',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 168,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#8A1B10',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#7A0000',
            opacity: 0.6,
            blur: 12,
            distance: 4
          }
        }
      },
      {
        id: 'bottomEnglish',
        text: 'TI QIAN YU YUE',
        style: {
          fontFamily: 'Times New Roman',
          fontSize: 95.53,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.16,
          letterSpacing: 8,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1710,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '东方大楷',
          fontSize: 125.7,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1350,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#5F0000',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 8,
            distance: 5
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '东方大楷',
          fontSize: 115.64,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1560,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#5F0000',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 8,
            distance: 5
          }
        }
      }
    ]
  },

  {
    id: 'v61',
    name: 'V61-医美坦白局',
    description: '左侧黄色竖排医美标题，右下蓝色观点文案，适合医美口播类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.04)',
        0.55,
        'rgba(0,0,0,0)',
        1,
        'rgba(0,0,0,0.18)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'rightTextBg',
        type: 'rect',
        x: 317.77,
        y: 1066,
        width: 600.34,
        height: 130,
        fill: '#4A4A4A',
        opacity: 0.44,
        radius: 0,
        rotation: 0
      },
      {
        id: 'leftTextSoftShade',
        type: 'rect',
        x: 0,
        y: 0,
        width: 220.22,
        height: 1920,
        opacity: 0.2,
        radius: 0,
        fillLinearGradientStartPoint: {
          x: 0,
          y: 0
        },
        fillLinearGradientEndPoint: {
          x: 220,
          y: 0
        },
        fillLinearGradientColorStops: [
          0,
          'rgba(0,0,0,0.45)',
          0.62,
          'rgba(0,0,0,0.14)',
          1,
          'rgba(0,0,0,0)'
        ],
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'leftTitle',
        text: '{titleMain}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 175.98,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF26A',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 0.96,
          align: 'center',
          x: 370.06,
          y: 960,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#6F6A2A',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 4,
            distance: 5
          }
        }
      },
      {
        id: 'rightBottom',
        text: '{titleSub}',
        style: {
          fontFamily: '方正粗黑宋简体',
          fontSize: 82.46,
          bold: false,
          italic: false,
          underline: false,
          color: '#78D6FF',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1,
          align: 'center',
          x: 618.44,
          y: 1146,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#1E3440',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.52,
            blur: 5,
            distance: 4
          }
        }
      }
    ]
  },

  {
    id: 'v62',
    name: 'V62-黄金糯玉米',
    description: '农产品带货封面，黑色粗字搭配黄色和荧光绿底条，突出甜糯和现摘现发',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.06)',
        0.52,
        'rgba(0,0,0,0)',
        1,
        'rgba(0,0,0,0.22)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'yellowTitleBar',
        type: 'rect',
        x: 12.07,
        y: 1160,
        width: 1055.87,
        height: 150,
        fill: '#FFE500',
        opacity: 0.98,
        radius: 18.1,
        rotation: 0
      },
      {
        id: 'greenTitleBar',
        type: 'rect',
        x: 12.07,
        y: 1395,
        width: 920.11,
        height: 132,
        fill: '#B8FF22',
        opacity: 0.98,
        radius: 16.09,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'taste',
        text: '味道嘎嘎好！',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 72.4,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFE337',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1,
          align: 'left',
          x: 20.11,
          y: 1055,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.95,
            blur: 0,
            distance: 3
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 97.54,
          bold: false,
          italic: false,
          underline: false,
          color: '#000000',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'left',
          x: 32.18,
          y: 1238,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 93.52,
          bold: false,
          italic: false,
          underline: false,
          color: '#000000',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'left',
          x: 36.2,
          y: 1464,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  {
    id: 'v63',
    name: 'V63-带娃神器',
    description: '亲子出行可爱风，粉色泡泡标题、勾选卖点和底部黄字黑边',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,255,255,0.08)',
        0.5,
        'rgba(0,0,0,0)',
        1,
        'rgba(0,0,0,0.22)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'checkBg1',
        type: 'rect',
        x: 50.28,
        y: 1140,
        width: 86.48,
        height: 86,
        fill: '#18D83A',
        opacity: 0.98,
        radius: 16.09,
        rotation: 0
      },
      {
        id: 'checkBg2',
        type: 'rect',
        x: 50.28,
        y: 1320,
        width: 86.48,
        height: 86,
        fill: '#18D83A',
        opacity: 0.98,
        radius: 16.09,
        rotation: 0
      },
      {
        id: 'starBg1',
        type: 'rect',
        x: 113.63,
        y: 1130,
        width: 190.06,
        height: 96,
        fill: '#FFF264',
        opacity: 0.95,
        radius: 28.16,
        rotation: 0
      },
      {
        id: 'starBg2',
        type: 'rect',
        x: 113.63,
        y: 1310,
        width: 190.06,
        height: 96,
        fill: '#FFF264',
        opacity: 0.95,
        radius: 28.16,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 155.87,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD5E5',
          opacity: 1,
          letterSpacing: 7,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 140,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#050505',
            width: 12
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.7,
            blur: 2,
            distance: 6
          }
        }
      },
      {
        id: 'check1',
        text: '✓',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 78.44,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 92.51,
          y: 1182,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'point1',
        text: '巨好用',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 64.36,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1,
          align: 'left',
          x: 134.75,
          y: 1182,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 2,
            distance: 3
          }
        }
      },
      {
        id: 'check2',
        text: '✓',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 78.44,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 92.51,
          y: 1362,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'point2',
        text: '贼平价',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 64.36,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1,
          align: 'left',
          x: 134.75,
          y: 1362,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 2,
            distance: 3
          }
        }
      },
      {
        id: 'bottomTitle',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 121.68,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF07A',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1775,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 9
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.72,
            blur: 2,
            distance: 5
          }
        }
      }
    ]
  },

  {
    id: 'v64',
    name: 'V64-孩子越玩越聪明',
    description: '上半区白色遮罩，可爱泡泡字黑红两行，适合亲子育儿类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [
      {
        id: 'topWhiteMask',
        type: 'rect',
        x: 0,
        y: 0,
        width: 1080,
        height: 770,
        fill: '#FFFFFF',
        opacity: 0.98,
        radius: 0,
        rotation: 0
      },
      {
        id: 'topSoftBottom',
        type: 'rect',
        x: 0,
        y: 700,
        width: 1080,
        height: 130,
        opacity: 1,
        radius: 0,
        fillLinearGradientStartPoint: {
          x: 0,
          y: 0
        },
        fillLinearGradientEndPoint: {
          x: 0,
          y: 130
        },
        fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.98)', 1, 'rgba(255,255,255,0)'],
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 159.89,
          bold: false,
          italic: false,
          underline: false,
          color: '#000000',
          opacity: 1,
          letterSpacing: 5,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 150,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 18
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.9,
            blur: 0,
            distance: 5
          }
        }
      },
      {
        id: 'subTitle',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 173.97,
          bold: false,
          italic: false,
          underline: false,
          color: '#C91414',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 430,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 18
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#C91414',
            opacity: 0.9,
            blur: 0,
            distance: 5
          }
        }
      }
    ]
  },

  {
    id: 'v65',
    name: 'V65-洗面奶误区',
    description: '护肤科普卡片风，粉色背景氛围、蓝色标签、白色斜卡片和蓝粉撞色标题',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(255,210,230,0.34)',
        0.55,
        'rgba(255,255,255,0.05)',
        1,
        'rgba(255,185,215,0.42)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'tipTag',
        type: 'rect',
        x: 42.23,
        y: 1100,
        width: 319.78,
        height: 110,
        fill: '#4AA4DF',
        opacity: 0.96,
        radius: 0,
        rotation: 0
      },
      {
        id: 'cardShadow',
        type: 'rect',
        x: 42.23,
        y: 1300,
        width: 995.53,
        height: 360,
        fill: '#2B91D1',
        opacity: 0.95,
        radius: 0,
        rotation: -2
      },
      {
        id: 'whiteCard',
        type: 'rect',
        x: 24.13,
        y: 1275,
        width: 984.47,
        height: 350,
        fill: '#FFFFFF',
        opacity: 0.98,
        radius: 0,
        rotation: -2
      },
      {
        id: 'rightBlueLine',
        type: 'rect',
        x: 990.5,
        y: 1310,
        width: 18.1,
        height: 270,
        fill: '#2B91D1',
        opacity: 0.95,
        radius: 0,
        rotation: 8
      }
    ],
    textLayers: [
      {
        id: 'tagText',
        text: '护肤小tip',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 58.32,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1,
          align: 'center',
          x: 202.12,
          y: 1155,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#2C6F9C',
            width: 2
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.35,
            blur: 3,
            distance: 2
          }
        }
      },
      {
        id: 'mainBlue',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 109.61,
          bold: false,
          italic: false,
          underline: false,
          color: '#0A7BC4',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'left',
          x: 70.39,
          y: 1410,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#D8F2FF',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#095B91',
            opacity: 0.75,
            blur: 0,
            distance: 4
          }
        }
      },
      {
        id: 'mainPink',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 109.61,
          bold: false,
          italic: false,
          underline: false,
          color: '#F05A93',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'left',
          x: 145.81,
          y: 1520,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFE2EE',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#B43D6B',
            opacity: 0.7,
            blur: 0,
            distance: 4
          }
        }
      }
    ]
  },

  {
    id: 'v66',
    name: 'V66-拒绝内耗',
    description: '上下深红遮罩，四角蓝白大字，中间红色标签和白红人生标题',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [
      {
        id: 'topRedMask',
        type: 'rect',
        x: 0,
        y: 0,
        width: 1080,
        height: 260,
        opacity: 1,
        radius: 0,
        fillLinearGradientStartPoint: {
          x: 0,
          y: 0
        },
        fillLinearGradientEndPoint: {
          x: 0,
          y: 260
        },
        fillLinearGradientColorStops: [
          0,
          'rgba(105,0,0,0.98)',
          0.72,
          'rgba(118,0,0,0.92)',
          1,
          'rgba(118,0,0,0.72)'
        ],
        rotation: 0
      },
      {
        id: 'bottomRedMask',
        type: 'rect',
        x: 0,
        y: 1640,
        width: 1080,
        height: 280,
        opacity: 1,
        radius: 0,
        fillLinearGradientStartPoint: {
          x: 0,
          y: 0
        },
        fillLinearGradientEndPoint: {
          x: 0,
          y: 280
        },
        fillLinearGradientColorStops: [
          0,
          'rgba(118,0,0,0.72)',
          0.28,
          'rgba(118,0,0,0.92)',
          1,
          'rgba(105,0,0,0.98)'
        ],
        rotation: 0
      },
      {
        id: 'middleBlueLine',
        type: 'rect',
        x: 0,
        y: 1628,
        width: 1080,
        height: 10,
        fill: '#2B7BAE',
        opacity: 0.8,
        radius: 0,
        rotation: 0
      },
      {
        id: 'topBlueLine',
        type: 'rect',
        x: 0,
        y: 250,
        width: 1080,
        height: 8,
        fill: '#2B7BAE',
        opacity: 0.65,
        radius: 0,
        rotation: 0
      },
      {
        id: 'centerTagBg',
        type: 'rect',
        x: 329.83,
        y: 1070,
        width: 420.34,
        height: 98,
        fill: '#9A0012',
        opacity: 0.94,
        radius: 0,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'cornerReject',
        text: '拒',
        style: {
          fontFamily: '东方大楷',
          fontSize: 210.17,
          bold: false,
          italic: false,
          underline: false,
          color: '#075386',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'center',
          x: 125.7,
          y: 115,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 3,
            distance: 4
          }
        }
      },
      {
        id: 'cornerNever',
        text: '绝',
        style: {
          fontFamily: '东方大楷',
          fontSize: 210.17,
          bold: false,
          italic: false,
          underline: false,
          color: '#075386',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'center',
          x: 950.28,
          y: 115,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 3,
            distance: 4
          }
        }
      },
      {
        id: 'cornerInner',
        text: '内',
        style: {
          fontFamily: '东方大楷',
          fontSize: 210.17,
          bold: false,
          italic: false,
          underline: false,
          color: '#075386',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'center',
          x: 125.7,
          y: 1790,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 3,
            distance: 4
          }
        }
      },
      {
        id: 'cornerWaste',
        text: '耗',
        style: {
          fontFamily: '东方大楷',
          fontSize: 210.17,
          bold: false,
          italic: false,
          underline: false,
          color: '#075386',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'center',
          x: 950.28,
          y: 1790,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 3,
            distance: 4
          }
        }
      },
      {
        id: 'tag',
        text: '{titleMain}',
        style: {
          fontFamily: '方正书宋简体',
          fontSize: 68.38,
          bold: false,
          italic: true,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 5,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1118,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.35,
            blur: 4,
            distance: 2
          }
        }
      },
      {
        id: 'main',
        text: '{titleSub}',
        style: {
          fontFamily: '方正书宋简体',
          fontSize: 111.62,
          bold: false,
          italic: true,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1300,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#9A0012',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 5,
            distance: 5
          }
        }
      }
    ]
  },

  {
    id: 'v67',
    name: 'V67-新生宝宝护理',
    description: '母婴护理封面，顶部黄字青描边，底部倾斜浅黄卡片突出护理要点',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.08)',
        0.55,
        'rgba(0,0,0,0)',
        1,
        'rgba(0,0,0,0.18)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'bottomCardShadow',
        type: 'rect',
        x: 70.39,
        y: 1310,
        width: 960.34,
        height: 430,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 0,
        rotation: -3
      },
      {
        id: 'bottomCard',
        type: 'rect',
        x: 26.15,
        y: 1330,
        width: 1027.71,
        height: 380,
        fill: '#FFF985',
        opacity: 0.98,
        radius: 0,
        rotation: -3
      },
      {
        id: 'clip1',
        type: 'rect',
        x: 36.2,
        y: 1255,
        width: 32.18,
        height: 76,
        fill: '#FFF985',
        opacity: 1,
        radius: 14.08,
        rotation: 0
      },
      {
        id: 'clip2',
        type: 'rect',
        x: 78.44,
        y: 1255,
        width: 32.18,
        height: 76,
        fill: '#FFF985',
        opacity: 1,
        radius: 14.08,
        rotation: 0
      },
      {
        id: 'clip3',
        type: 'rect',
        x: 119.66,
        y: 1255,
        width: 32.18,
        height: 76,
        fill: '#FFF985',
        opacity: 1,
        radius: 14.08,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '一次性讲清楚',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 117.65,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF07A',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 150,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 10
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#5EE6F0',
            opacity: 0.9,
            blur: 0,
            distance: 6
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 129.72,
          bold: false,
          italic: false,
          underline: false,
          color: '#8EF4FF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1465,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.95,
            blur: 0,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 103.58,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1635,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#5EE6F0',
            opacity: 0.82,
            blur: 0,
            distance: 4
          }
        }
      }
    ]
  },

  {
    id: 'v68',
    name: 'V68-漏财坏习惯',
    description: '粉色粗边框遮罩，内部留图，底部粉色泡泡主标题和白色副标题',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [
      {
        id: 'pinkFrameTop',
        type: 'rect',
        x: 0,
        y: 0,
        width: 1080,
        height: 120,
        fill: '#F64DA8',
        opacity: 0.98,
        radius: 0,
        rotation: 0
      },
      {
        id: 'pinkFrameBottom',
        type: 'rect',
        x: 0,
        y: 1810,
        width: 1080,
        height: 110,
        fill: '#F64DA8',
        opacity: 0.98,
        radius: 0,
        rotation: 0
      },
      {
        id: 'pinkFrameLeft',
        type: 'rect',
        x: 0,
        y: 0,
        width: 78.44,
        height: 1920,
        fill: '#F64DA8',
        opacity: 0.98,
        radius: 0,
        rotation: 0
      },
      {
        id: 'pinkFrameRight',
        type: 'rect',
        x: 1001.56,
        y: 0,
        width: 78.44,
        height: 1920,
        fill: '#F64DA8',
        opacity: 0.98,
        radius: 0,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'burst',
        text: '✹',
        style: {
          fontFamily: '思源黑体',
          fontSize: 117.65,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFE64D',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'center',
          x: 205.14,
          y: 430,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#F04B1A',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.9,
            blur: 0,
            distance: 3
          }
        }
      },
      {
        id: 'moneyBag',
        text: '💰',
        style: {
          fontFamily: '思源黑体',
          fontSize: 105.59,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD65A',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'center',
          x: 869.83,
          y: 760,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 4,
            distance: 3
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 121.68,
          bold: false,
          italic: false,
          underline: false,
          color: '#F45BA8',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1360,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 12
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 1,
            blur: 0,
            distance: 8
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 105.59,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1605,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 10
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.72,
            blur: 2,
            distance: 5
          }
        }
      }
    ]
  },

  {
    id: 'v69',
    name: 'V69-极速涨粉',
    description: '蓝色边框遮罩，四角浅蓝黑边大字，中间白底卖点条',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [
      {
        id: 'blueFrameTop',
        type: 'rect',
        x: 0,
        y: 0,
        width: 1080,
        height: 40,
        fill: '#83D8FF',
        opacity: 0.98,
        radius: 0,
        rotation: 0
      },
      {
        id: 'blueFrameBottom',
        type: 'rect',
        x: 0,
        y: 1880,
        width: 1080,
        height: 40,
        fill: '#83D8FF',
        opacity: 0.98,
        radius: 0,
        rotation: 0
      },
      {
        id: 'blueFrameLeft',
        type: 'rect',
        x: 0,
        y: 0,
        width: 32.18,
        height: 1920,
        fill: '#83D8FF',
        opacity: 0.98,
        radius: 0,
        rotation: 0
      },
      {
        id: 'blueFrameRight',
        type: 'rect',
        x: 1047.82,
        y: 0,
        width: 32.18,
        height: 1920,
        fill: '#83D8FF',
        opacity: 0.98,
        radius: 0,
        rotation: 0
      },
      {
        id: 'tipBar1',
        type: 'rect',
        x: 82.46,
        y: 920,
        width: 329.83,
        height: 62,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 0,
        rotation: 0
      },
      {
        id: 'tipBar2',
        type: 'rect',
        x: 82.46,
        y: 1040,
        width: 375.08,
        height: 62,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 0,
        rotation: 0
      },
      {
        id: 'tipBar3',
        type: 'rect',
        x: 82.46,
        y: 1160,
        width: 479.66,
        height: 62,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 0,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'corner1',
        text: '极',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 186.03,
          bold: false,
          italic: false,
          underline: false,
          color: '#8CDAFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'center',
          x: 149.83,
          y: 190,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 12
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0,
            blur: 0,
            distance: 0
          }
        }
      },
      {
        id: 'corner2',
        text: '速',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 186.03,
          bold: false,
          italic: false,
          underline: false,
          color: '#8CDAFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'center',
          x: 920.11,
          y: 190,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 12
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0,
            blur: 0,
            distance: 0
          }
        }
      },
      {
        id: 'corner3',
        text: '涨',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 186.03,
          bold: false,
          italic: false,
          underline: false,
          color: '#8CDAFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'center',
          x: 149.83,
          y: 1760,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 12
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0,
            blur: 0,
            distance: 0
          }
        }
      },
      {
        id: 'corner4',
        text: '粉',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 186.03,
          bold: false,
          italic: false,
          underline: false,
          color: '#8CDAFF',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'center',
          x: 920.11,
          y: 1760,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 12
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0,
            blur: 0,
            distance: 0
          }
        }
      },
      {
        id: 'tip1',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 50.28,
          bold: false,
          italic: true,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'left',
          x: 99.55,
          y: 950,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'tip2',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 50.28,
          bold: false,
          italic: true,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'left',
          x: 99.55,
          y: 1070,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'tip3',
        text: '👉视频质感upup',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 50.28,
          bold: false,
          italic: true,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'left',
          x: 99.55,
          y: 1190,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  {
    id: 'v70',
    name: 'V70-封面制作教程',
    description: '风景教程封面，双层细线边框，顶部英文标识，中间黄字黑边标题',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,45,110,0.28)',
        0.45,
        'rgba(0,0,0,0)',
        1,
        'rgba(0,0,0,0.24)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'outerTop',
        type: 'rect',
        x: 28.16,
        y: 30,
        width: 1023.69,
        height: 4,
        fill: '#F4E9B7',
        opacity: 0.92,
        radius: 0,
        rotation: 0
      },
      {
        id: 'outerLeft',
        type: 'rect',
        x: 28.16,
        y: 30,
        width: 4.02,
        height: 1860,
        fill: '#F4E9B7',
        opacity: 0.92,
        radius: 0,
        rotation: 0
      },
      {
        id: 'outerRight',
        type: 'rect',
        x: 1047.82,
        y: 30,
        width: 4.02,
        height: 1860,
        fill: '#F4E9B7',
        opacity: 0.92,
        radius: 0,
        rotation: 0
      },
      {
        id: 'outerBottom',
        type: 'rect',
        x: 28.16,
        y: 1886,
        width: 1023.69,
        height: 4,
        fill: '#F4E9B7',
        opacity: 0.92,
        radius: 0,
        rotation: 0
      },
      {
        id: 'innerTop',
        type: 'rect',
        x: 70.39,
        y: 88,
        width: 940.22,
        height: 3,
        fill: '#F4E9B7',
        opacity: 0.74,
        radius: 0,
        rotation: 0
      },
      {
        id: 'innerLeft',
        type: 'rect',
        x: 70.39,
        y: 88,
        width: 3.02,
        height: 1710,
        fill: '#F4E9B7',
        opacity: 0.74,
        radius: 0,
        rotation: 0
      },
      {
        id: 'innerRight',
        type: 'rect',
        x: 1006.59,
        y: 88,
        width: 3.02,
        height: 1710,
        fill: '#F4E9B7',
        opacity: 0.74,
        radius: 0,
        rotation: 0
      },
      {
        id: 'innerBottom',
        type: 'rect',
        x: 70.39,
        y: 1798,
        width: 940.22,
        height: 3,
        fill: '#F4E9B7',
        opacity: 0.74,
        radius: 0,
        rotation: 0
      },
      {
        id: 'topDecorLeft',
        type: 'rect',
        x: 125.7,
        y: 68,
        width: 111.62,
        height: 3,
        fill: '#F4E9B7',
        opacity: 0.9,
        radius: 0,
        rotation: 0
      },
      {
        id: 'topDecorRight',
        type: 'rect',
        x: 770.28,
        y: 68,
        width: 210.17,
        height: 3,
        fill: '#F4E9B7',
        opacity: 0.9,
        radius: 0,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'topLabel',
        text: '-EDITING TUTORIAL-',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 44.25,
          bold: true,
          italic: true,
          underline: false,
          color: '#F4E9B7',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 70,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#00335F',
            opacity: 0.45,
            blur: 4,
            distance: 2
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '东方大楷',
          fontSize: 107.6,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF02C',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 925,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#14263D',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.58,
            blur: 5,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '方正书宋简体',
          fontSize: 46.26,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF02C',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1065,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#234460',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 4,
            distance: 3
          }
        }
      },
      {
        id: 'date',
        text: '04/2026',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 30.17,
          bold: false,
          italic: false,
          underline: false,
          color: '#F4E9B7',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1,
          align: 'center',
          x: 1009.61,
          y: 1560,
          rotation: 90,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.42,
            blur: 3,
            distance: 2
          }
        }
      }
    ]
  },

  {
    id: 'v71',
    name: 'V71-内容标签条',
    description: '底部黄色斜角内容信息框，适合街拍、运动、探店类深色画面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.1)',
        0.5,
        'rgba(0,0,0,0)',
        1,
        'rgba(0,0,0,0.42)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'tagBgShadow',
        type: 'rect',
        x: 167.93,
        y: 1420,
        width: 689.83,
        height: 220,
        fill: '#1F1F1F',
        opacity: 0.72,
        radius: 0,
        rotation: -3
      },
      {
        id: 'tagBg',
        type: 'rect',
        x: 149.83,
        y: 1400,
        width: 689.83,
        height: 220,
        fill: '#DCA500',
        opacity: 0.96,
        radius: 0,
        rotation: -3
      },
      {
        id: 'tagInner',
        type: 'rect',
        x: 195.08,
        y: 1430,
        width: 600.34,
        height: 160,
        fill: '#2B2B2B',
        opacity: 0.84,
        radius: 0,
        rotation: -3
      },
      {
        id: 'tagTopLine',
        type: 'rect',
        x: 149.83,
        y: 1400,
        width: 689.83,
        height: 7,
        fill: '#FFDE37',
        opacity: 1,
        radius: 0,
        rotation: -3
      }
    ],
    textLayers: [
      {
        id: 'label',
        text: '标题内容',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 34.19,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1,
          align: 'left',
          x: 205.14,
          y: 1416,
          rotation: -3,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 3,
            distance: 2
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 54.3,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'left',
          x: 235.31,
          y: 1482,
          rotation: -3,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.5,
            blur: 4,
            distance: 3
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 52.29,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'left',
          x: 235.31,
          y: 1549,
          rotation: -3,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.5,
            blur: 4,
            distance: 3
          }
        }
      }
    ]
  },

  {
    id: 'v72',
    name: 'V72-紫色统一封面',
    description: '紫色人物封面风，白色细边框，中部半透明横幅和黄色教程标题',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(130,80,170,0.18)',
        0.5,
        'rgba(0,0,0,0)',
        1,
        'rgba(80,45,120,0.2)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'topLine',
        type: 'rect',
        x: 28.16,
        y: 42,
        width: 1023.69,
        height: 4,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 0,
        rotation: 0
      },
      {
        id: 'leftLine',
        type: 'rect',
        x: 28.16,
        y: 42,
        width: 4.02,
        height: 1836,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 0,
        rotation: 0
      },
      {
        id: 'rightLine',
        type: 'rect',
        x: 1047.82,
        y: 42,
        width: 4.02,
        height: 1836,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 0,
        rotation: 0
      },
      {
        id: 'bottomLine',
        type: 'rect',
        x: 28.16,
        y: 1874,
        width: 1023.69,
        height: 4,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 0,
        rotation: 0
      },
      {
        id: 'centerBand',
        type: 'rect',
        x: 42.23,
        y: 770,
        width: 995.53,
        height: 360,
        fill: '#3B3340',
        opacity: 0.46,
        radius: 0,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'brand',
        text: 'XINGCHENDAHAI',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 36.2,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.55,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'left',
          x: 117.65,
          y: 90,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 159.89,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF12F',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 860,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#2C2C2C',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.58,
            blur: 4,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 52.29,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFF12F',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1055,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#4A4A4A',
            width: 3
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.45,
            blur: 3,
            distance: 3
          }
        }
      },
      {
        id: 'sideText',
        text: 'XINGCHENDAHAI',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 28.16,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.58,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'center',
          x: 1007.6,
          y: 1510,
          rotation: 90,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 0
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  {
    id: 'v73',
    name: 'V73-斜体蓝条教程',
    description: '中部斜体蓝色半透明遮罩，搭配倾斜白色粗字，适合短视频教程类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.06)',
        0.52,
        'rgba(0,0,0,0)',
        1,
        'rgba(0,0,0,0.18)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'slantBand',
        type: 'rect',
        x: -70.39,
        y: 775,
        width: 1219.78,
        height: 430,
        fill: '#233B74',
        opacity: 0.68,
        radius: 0,
        rotation: -8
      },
      {
        id: 'slantBandHighlight',
        type: 'rect',
        x: -30.17,
        y: 1110,
        width: 1160.45,
        height: 8,
        fill: '#7EA5FF',
        opacity: 0.62,
        radius: 0,
        rotation: -8
      },
      {
        id: 'slantIconBox',
        type: 'rect',
        x: 410.28,
        y: 800,
        width: 260.45,
        height: 230,
        fill: '#1A2A54',
        opacity: 0.28,
        radius: 22.12,
        rotation: -8
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '江城斜黑体',
          fontSize: 180,
          bold: true,
          italic: true,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 860,
          rotation: -8,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 1
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#10204A',
            opacity: 0.7,
            blur: 4,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '江城斜黑体',
          fontSize: 70.39,
          bold: true,
          italic: true,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1,
          align: 'center',
          x: 540,
          y: 1075,
          rotation: -8,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 1
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#10204A',
            opacity: 0.72,
            blur: 4,
            distance: 4
          }
        }
      },
      {
        id: 'icon',
        text: '✎',
        style: {
          fontFamily: '思源黑体',
          fontSize: 149.83,
          bold: false,
          italic: false,
          underline: false,
          color: '#0E1A38',
          opacity: 0.38,
          letterSpacing: 0,
          lineHeight: 1,
          align: 'center',
          x: 42.23,
          y: 980,
          rotation: -8,
          stroke: {
            enabled: true,
            color: '#5D76B5',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  {
    id: 'v74',
    name: 'V74-爆款选题板',
    description: '深色背景叠加亮黄色信息卡片，中心大标题突出重点，适合知识干货、短视频选题类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(5,8,18,0.72)',
        0.46,
        'rgba(8,12,28,0.45)',
        1,
        'rgba(5,8,18,0.82)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'mainCard',
        type: 'rect',
        x: 66.37,
        y: 520,
        width: 948.27,
        height: 610,
        fill: '#FFF7D6',
        opacity: 0.96,
        radius: 34.19,
        rotation: -2
      },
      {
        id: 'mainCardShadow',
        type: 'rect',
        x: 86.48,
        y: 548,
        width: 948.27,
        height: 610,
        fill: '#F4B400',
        opacity: 0.62,
        radius: 34.19,
        rotation: -2
      },
      {
        id: 'blackTitleBar',
        type: 'rect',
        x: 103.58,
        y: 610,
        width: 871.84,
        height: 144,
        fill: '#111111',
        opacity: 1,
        radius: 18.1,
        rotation: -2
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 117.65,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 3,
          lineHeight: 0.95,
          align: 'center',
          x: 540,
          y: 681,
          rotation: -2,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.5,
            blur: 0,
            distance: 5
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 91.51,
          bold: true,
          italic: false,
          underline: false,
          color: '#111111',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.08,
          align: 'center',
          x: 540,
          y: 890,
          rotation: -2,
          stroke: {
            enabled: true,
            color: '#FFE45C',
            width: 5
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.72,
            blur: 0,
            distance: 4
          }
        }
      }
    ]
  },

  // ---------- V75: REC取景框 ----------
  {
    id: 'v75',
    name: 'V75-REC取景框',
    description:
      '仿相机录制界面，深色横幅大标题、取景框线条和 REC 状态信息，适合教程、视频封面制作类内容',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.42)',
        0.5,
        'rgba(0,0,0,0.28)',
        1,
        'rgba(0,0,0,0.55)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'titleBand',
        type: 'rect',
        x: 0,
        y: 690,
        width: 1080,
        height: 310,
        fill: '#000000',
        opacity: 0.58,
        radius: 0,
        rotation: 0
      },
      {
        id: 'frameTopLeftH',
        type: 'rect',
        x: 58.32,
        y: 140,
        width: 230.28,
        height: 6,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 3.02,
        rotation: 0
      },
      {
        id: 'frameTopLeftV',
        type: 'rect',
        x: 58.32,
        y: 140,
        width: 6.03,
        height: 230,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 3.02,
        rotation: 0
      },
      {
        id: 'frameTopRightH',
        type: 'rect',
        x: 792.4,
        y: 140,
        width: 230.28,
        height: 6,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 3.02,
        rotation: 0
      },
      {
        id: 'frameTopRightV',
        type: 'rect',
        x: 1015.64,
        y: 140,
        width: 6.03,
        height: 230,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 3.02,
        rotation: 0
      },
      {
        id: 'frameBottomLeftH',
        type: 'rect',
        x: 58.32,
        y: 1774,
        width: 230.28,
        height: 6,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 3.02,
        rotation: 0
      },
      {
        id: 'frameBottomLeftV',
        type: 'rect',
        x: 58.32,
        y: 1550,
        width: 6.03,
        height: 230,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 3.02,
        rotation: 0
      },
      {
        id: 'frameBottomRightH',
        type: 'rect',
        x: 792.4,
        y: 1774,
        width: 230.28,
        height: 6,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 3.02,
        rotation: 0
      },
      {
        id: 'frameBottomRightV',
        type: 'rect',
        x: 1015.64,
        y: 1550,
        width: 6.03,
        height: 230,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 3.02,
        rotation: 0
      },
      {
        id: 'titleTopLine',
        type: 'rect',
        x: 72.4,
        y: 672,
        width: 936.2,
        height: 5,
        fill: '#FFFFFF',
        opacity: 0.76,
        radius: 2.01,
        rotation: 0
      },
      {
        id: 'titleBottomLine',
        type: 'rect',
        x: 72.4,
        y: 1016,
        width: 936.2,
        height: 5,
        fill: '#FFFFFF',
        opacity: 0.76,
        radius: 2.01,
        rotation: 0
      },
      {
        id: 'subLine',
        type: 'rect',
        x: 141.79,
        y: 1308,
        width: 796.42,
        height: 5,
        fill: '#FFFFFF',
        opacity: 0.82,
        radius: 2.01,
        rotation: 0
      },
      {
        id: 'progressLine',
        type: 'rect',
        x: 248.38,
        y: 1410,
        width: 584.25,
        height: 5,
        fill: '#FFFFFF',
        opacity: 0.72,
        radius: 2.01,
        rotation: 0
      },
      {
        id: 'dotLeft',
        type: 'rect',
        x: 453.52,
        y: 1386,
        width: 48.27,
        height: 48,
        fill: '#FFFFFF',
        opacity: 1,
        radius: 24.13,
        rotation: 0
      },
      {
        id: 'dotCenter',
        type: 'rect',
        x: 509.83,
        y: 1372,
        width: 60.34,
        height: 60,
        fill: '#FFFFFF',
        opacity: 1,
        radius: 30.17,
        rotation: 0
      },
      {
        id: 'dotRight',
        type: 'rect',
        x: 578.21,
        y: 1386,
        width: 48.27,
        height: 48,
        fill: '#FFFFFF',
        opacity: 1,
        radius: 24.13,
        rotation: 0
      },
      {
        id: 'leftIconBox',
        type: 'rect',
        x: 40.22,
        y: 520,
        width: 46.26,
        height: 34,
        fill: '#FFFFFF',
        opacity: 0.18,
        radius: 4.02,
        rotation: 0
      },
      {
        id: 'batteryBody',
        type: 'rect',
        x: 893.97,
        y: 1605,
        width: 91.51,
        height: 42,
        fill: '#FFFFFF',
        opacity: 0.9,
        radius: 5.03,
        rotation: 0
      },
      {
        id: 'batteryCap',
        type: 'rect',
        x: 993.52,
        y: 1618,
        width: 12.07,
        height: 18,
        fill: '#FFFFFF',
        opacity: 0.9,
        radius: 3.02,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'rec',
        text: 'REC ●',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 34.19,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'right',
          x: 991.51,
          y: 214,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            blur: 4,
            distance: 2
          }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '思源黑体',
          fontSize: 131.73,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.05,
          align: 'center',
          x: 540,
          y: 838,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 1
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.75,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 82.46,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.08,
          align: 'center',
          x: 540,
          y: 1168,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 1
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.72,
            blur: 7,
            distance: 3
          }
        }
      },
      {
        id: 'leftStatus',
        text: 'ON\n1050 P',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 36.2,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.78,
          letterSpacing: 0,
          lineHeight: 1.15,
          align: 'left',
          x: 42.23,
          y: 1548,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 4,
            distance: 2
          }
        }
      },
      {
        id: 'rightStatus',
        text: '56 M',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 38.21,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.82,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'right',
          x: 1037.77,
          y: 1630,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.55,
            blur: 4,
            distance: 2
          }
        }
      },
      {
        id: 'duration',
        text: '28 min',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 24.13,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 0.7,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'left',
          x: 42.23,
          y: 603,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
            blur: 10,
            distance: 4
          }
        }
      }
    ]
  },

  {
    id: 'v76',
    name: 'V76-十字遮罩教程',
    description:
      '左侧十字交叉白线配合横向半透明遮罩，黄白粗标题和副标题分区，适合封面教程、方法论类内容',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.16)',
        0.48,
        'rgba(0,0,0,0.08)',
        1,
        'rgba(0,0,0,0.28)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'topShade',
        type: 'rect',
        x: 0,
        y: 440,
        width: 1080,
        height: 440,
        fill: '#000000',
        opacity: 0.48,
        radius: 0,
        rotation: 0
      },
      {
        id: 'middleShade',
        type: 'rect',
        x: 0,
        y: 1110,
        width: 1080,
        height: 300,
        fill: '#000000',
        opacity: 0.36,
        radius: 0,
        rotation: 0
      },
      {
        id: 'verticalLine',
        type: 'rect',
        x: 117.65,
        y: 165,
        width: 10.06,
        height: 1590,
        fill: '#FFFFFF',
        opacity: 0.9,
        radius: 5.03,
        rotation: 0
      },
      {
        id: 'horizontalLine',
        type: 'rect',
        x: 0,
        y: 1086,
        width: 519.89,
        height: 10,
        fill: '#FFFFFF',
        opacity: 0.9,
        radius: 5.03,
        rotation: 0
      },
      {
        id: 'cameraBg',
        type: 'rect',
        x: 790.39,
        y: 1450,
        width: 169.94,
        height: 132,
        fill: '#000000',
        opacity: 0.22,
        radius: 66.37,
        rotation: 0
      },
      {
        id: 'cameraBody',
        type: 'rect',
        x: 829.61,
        y: 1494,
        width: 117.65,
        height: 70,
        fill: '#FFFFFF',
        opacity: 0.9,
        radius: 8.04,
        rotation: 0
      },
      {
        id: 'cameraLens',
        type: 'rect',
        x: 867.82,
        y: 1506,
        width: 46.26,
        height: 46,
        fill: '#111111',
        opacity: 0.88,
        radius: 23.13,
        rotation: 0
      },
      {
        id: 'cameraTop',
        type: 'rect',
        x: 847.71,
        y: 1476,
        width: 52.29,
        height: 22,
        fill: '#FFFFFF',
        opacity: 0.9,
        radius: 5.03,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '文道潮黑体',
          fontSize: 91.51,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFF31F',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.05,
          align: 'left',
          x: 159.89,
          y: 590,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.65,
            blur: 4,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '文道潮黑体',
          fontSize: 93.52,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.05,
          align: 'left',
          x: 159.89,
          y: 760,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.65,
            blur: 4,
            distance: 4
          }
        }
      },
      {
        id: 'label',
        text: 'XX教剪辑',
        style: {
          fontFamily: '阿里普惠体',
          fontSize: 70.39,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 8,
          lineHeight: 1.3,
          align: 'left',
          x: 159.89,
          y: 1220,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 1
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.62,
            blur: 5,
            distance: 3
          }
        }
      }
    ]
  },

  {
    id: 'v77',
    name: 'V77-井字白框大字',
    description: '四条细白线组成井字构图，中间超大白色标题，适合合集、模板、重点提醒类封面',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      color: '#000000',
      opacity: 1,
      radius: 0,
      stroke: {
        enabled: false,
        color: '#FFFFFF',
        width: 0
      },
      fillLinearGradientStartPoint: {
        x: 0,
        y: 0
      },
      fillLinearGradientEndPoint: {
        x: 0,
        y: 1920
      },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.36)',
        0.5,
        'rgba(0,0,0,0.28)',
        1,
        'rgba(0,0,0,0.42)'
      ],
      rotation: 0
    },
    shapes: [
      {
        id: 'topLine',
        type: 'rect',
        x: 26.15,
        y: 365,
        width: 1027.71,
        height: 6,
        fill: '#FFFFFF',
        opacity: 0.86,
        radius: 3.02,
        rotation: 0
      },
      {
        id: 'bottomLine',
        type: 'rect',
        x: 26.15,
        y: 1555,
        width: 1027.71,
        height: 6,
        fill: '#FFFFFF',
        opacity: 0.86,
        radius: 3.02,
        rotation: 0
      },
      {
        id: 'leftLine',
        type: 'rect',
        x: 117.65,
        y: 300,
        width: 6.03,
        height: 1320,
        fill: '#FFFFFF',
        opacity: 0.86,
        radius: 3.02,
        rotation: 0
      },
      {
        id: 'rightLine',
        type: 'rect',
        x: 956.31,
        y: 300,
        width: 6.03,
        height: 1320,
        fill: '#FFFFFF',
        opacity: 0.86,
        radius: 3.02,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '文道潮黑体',
          fontSize: 123.69,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.02,
          align: 'center',
          x: 540,
          y: 770,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 1
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.62,
            blur: 8,
            distance: 4
          }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '文道潮黑体',
          fontSize: 190.06,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 4,
          lineHeight: 0.98,
          align: 'center',
          x: 540,
          y: 1115,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 1
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.66,
            blur: 9,
            distance: 5
          }
        }
      }
    ]
  },

  // ---------- V78: 护肤霓虹渐变 ----------
  {
    id: 'v78',
    name: 'V78-护肤霓虹渐变',
    description: '白字蓝色粗描边和蓝色发光阴影，上下分区大字s强调',
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      opacity: 1,
      radius: 0,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: 1920 },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.28)',
        0.48,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,0,0,0.38)'
      ]
    },
    shapes: [
      {
        id: 'topGlow',
        type: 'rect',
        x: 0,
        y: 0,
        width: 1080,
        height: 320,
        fill: '#168CFF',
        opacity: 0.16,
        radius: 0
      },
      {
        id: 'warningDot',
        type: 'rect',
        x: 68,
        y: 1380,
        width: 58,
        height: 58,
        fill: '#FFE500',
        opacity: 0.96,
        radius: 29
      },
      {
        id: 'warningInner',
        type: 'rect',
        x: 82,
        y: 1390,
        width: 30,
        height: 30,
        fill: '#111111',
        opacity: 0.45,
        radius: 15
      }
    ],
    textLayers: [
      {
        id: 'topTitle',
        text: '拒绝无效护肤',
        style: {
          fontFamily: '思源宋体',
          fontSize: 188,
          color: '#94FFC2',
          align: 'center',
          x: 540,
          y: 142,
          bold: true,
          letterSpacing: 6,
          stroke: { enabled: true, color: '#001A4D', width: 10 },
          shadow: { enabled: true, color: '#001A4D', blur: 24, distance: 0, opacity: 0.92 }
        }
      },
      {
        id: 'sub',
        text: '护肤小tip：拒绝无效护肤',
        style: {
          fontFamily: '江城斜黑体',
          fontSize: 54,
          color: '#FFFFFF',
          align: 'left',
          x: 72,
          y: 430,
          italic: false,
          bold: false,
          lineHeight: 1.45,
          letterSpacing: 1,
          stroke: { enabled: true, color: '#111111', width: 5 },
          shadow: { enabled: true, color: '#000000', blur: 4, distance: 3, opacity: 0.72 }
        }
      },
      {
        id: 'tag',
        text: '⚠️ 如何正确护肤',
        style: {
          fontFamily: '江城斜黑体',
          fontSize: 64,
          color: '#FFF37A',
          align: 'left',
          x: 138,
          y: 1400,
          italic: false,
          bold: false,
          letterSpacing: 1,
          stroke: { enabled: true, color: '#111111', width: 5 },
          shadow: { enabled: true, color: '#000000', blur: 5, distance: 3, opacity: 0.72 }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '思源宋体',
          fontSize: 142,
          color: '#DDEBFF',
          align: 'center',
          x: 540,
          y: 1750,
          bold: true,
          letterSpacing: 2,
          lineHeight: 0.98,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: 145 },
          fillLinearGradientColorStops: [0, '#FFFFFF', 0.5, '#A9D6FF', 1, '#168CFF'],
          stroke: { enabled: true, color: '#002D52', width: 4 },
          shadow: { enabled: true, color: '#168CFF', blur: 12, distance: 0, opacity: 0.86 }
        }
      }
    ]
  },

  // ---------- V80: 保险百科横幅 ----------
  {
    id: 'v80',
    name: 'V80-保险百科横幅',
    description: '上下蓝白分区，大号蓝字黑边标题，底部蓝色圆角条承载白色提问',
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      opacity: 1,
      radius: 0,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: 1920 },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.28)',
        0.5,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,0,0,0.45)'
      ]
    },
    shapes: [
      {
        id: 'topBlueBand',
        type: 'rect',
        x: 0,
        y: 0,
        width: 1080,
        height: 360,
        fill: '#24D9C6',
        opacity: 0.92,
        radius: 0
      },
      {
        id: 'bottomBlueShadow',
        type: 'rect',
        x: 0,
        y: 1650,
        width: 1080,
        height: 270,
        fill: '#FDE004',
        opacity: 0.9,
        radius: 0
      },
      {
        id: 'tag',
        type: 'rect',
        x: 820,
        y: 14,
        width: 356,
        height: 92,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 0
      },
      {
        id: 'tagShadow',
        type: 'rect',
        x: 810,
        y: 9,
        width: 366,
        height: 102,
        fill: '#111111',
        opacity: 0.18,
        radius: 0
      }
    ],
    textLayers: [
      {
        id: 'tagLabel',
        text: '保险科普',
        style: {
          fontFamily: 'Arial',
          fontSize: 52,
          color: '#111111',
          align: 'center',
          x: 980,
          y: 58,
          bold: true,
          letterSpacing: 1
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 120,
          color: '#FFFFFF',
          align: 'center',
          x: 540,
          y: 210,
          bold: true,
          letterSpacing: 2,
          stroke: { enabled: true, color: '#111111', width: 8 },
          shadow: { enabled: true, color: '#000000', blur: 3, distance: 4, opacity: 0.58 }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 120,
          color: '#FDE004',
          align: 'center',
          x: 540,
          y: 1755,
          bold: true,
          letterSpacing: 1,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: 120 },
          fillLinearGradientColorStops: [0, '#FFFFFF', 0.46, '#FDE004', 1, '#FDE004'],
          stroke: { enabled: true, color: '#111111', width: 5 },
          shadow: { enabled: true, color: '#000000', blur: 3, distance: 3, opacity: 0.55 }
        }
      }
    ]
  },

  // ---------- V82: 口播步骤横幅 ----------
  {
    id: 'v82',
    name: 'V82-口播步骤横幅',
    description: '上下紫色遮罩，底部倾斜白字黑影，文字上下配斜线条',
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      opacity: 1,
      radius: 0,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: 1920 },
      fillLinearGradientColorStops: [
        0,
        'rgba(116,105,214,0.24)',
        0.5,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(116,105,214,0.28)'
      ]
    },
    shapes: [
      {
        id: 'topPurpleBand',
        type: 'rect',
        x: 0,
        y: 0,
        width: 1080,
        height: 290,
        fill: '#7E77D8',
        opacity: 0.92,
        radius: 0,
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 0, y: 290 },
        fillLinearGradientColorStops: [0, '#7C73D6', 0.5, '#7E77D8', 1, '#827ADF']
      },
      {
        id: 'bottomPurpleBand',
        type: 'rect',
        x: -20,
        y: 1600,
        width: 1120,
        height: 360,
        fill: '#7E77D8',
        opacity: 0.94,
        radius: 0,
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 0, y: 360 },
        fillLinearGradientColorStops: [0, '#6F6BD0', 0.45, '#7E77D8', 1, '#746CD0']
      },
      {
        id: 'slantBand1',
        type: 'rect',
        x: 190,
        y: 1480,
        width: 760,
        height: 5,
        fill: '#FFFFFF',
        opacity: 0.78,
        radius: 3,
        rotation: -10
      },
      {
        id: 'slantBand2',
        type: 'rect',
        x: 180,
        y: 1750,
        width: 760,
        height: 5,
        fill: '#FFFFFF',
        opacity: 0.78,
        radius: 3,
        rotation: -10
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: 'Arial',
          fontSize: 70,
          color: '#FFFFFF',
          align: 'center',
          x: 540,
          y: 1500,
          rotation: -10,
          bold: true,
          letterSpacing: 2,
          lineHeight: 1.05,
          stroke: { enabled: true, color: '#FFFFFF', width: 1 },
          shadow: { enabled: true, color: '#1B1B2D', blur: 4, distance: 5, opacity: 0.78 }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: 'Arial',
          fontSize: 70,
          color: '#FFFFFF',
          align: 'center',
          x: 540,
          y: 1760,
          rotation: -10,
          bold: true,
          letterSpacing: 2,
          lineHeight: 1.05,
          stroke: { enabled: true, color: '#FFFFFF', width: 1 },
          shadow: { enabled: true, color: '#1B1B2D', blur: 4, distance: 5, opacity: 0.78 }
        }
      }
    ]
  },

  // ---------- V83: AI反推白卡 ----------
  {
    id: 'v83',
    name: 'V83-AI反推白卡',
    description: '米白质感卡片，中间深色标题，底部行动标签',
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      opacity: 1,
      radius: 0,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: 1920 },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.28)',
        0.32,
        'rgba(0,0,0,0.22)',
        0.68,
        'rgba(0,0,0,0.45)',
        1,
        'rgba(0,0,0,0.32)'
      ]
    },
    shapes: [
      {
        id: 'mainCard',
        type: 'rect',
        x: 0,
        y: 500,
        width: 1080,
        height: 760,
        fill: '#FFFFFF',
        opacity: 0.98,
        radius: 0
      },
      {
        id: 'topTag',
        type: 'rect',
        x: 350,
        y: 490,
        width: 500,
        height: 118,
        fill: '#FFE500',
        opacity: 0.24,
        radius: 18
      },
      {
        id: 'topTagInner',
        type: 'rect',
        x: 345,
        y: 470,
        width: 510,
        height: 112,
        fill: '#FFE500',
        opacity: 1,
        radius: 16
      }
    ],
    textLayers: [
      {
        id: 'tagLabel',
        text: '💡 AI 反推',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 48,
          color: '#FFFFFF',
          align: 'center',
          x: 600,
          y: 540,
          bold: true,
          letterSpacing: 4,
          shadow: { enabled: true, color: '#000000', blur: 2, distance: 2, opacity: 0.36 }
        }
      },
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 126,
          color: '#FFE500',
          align: 'center',
          x: 540,
          y: 790,
          bold: true,
          letterSpacing: 4,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: 126 },
          fillLinearGradientColorStops: [0, '#FDB72E', 0.55, '#FDB72E', 1, '#ED9A12']
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '荆南波波黑',
          fontSize: 58,
          color: '#8B5A2B',
          align: 'center',
          x: 540,
          y: 965,
          bold: true,
          letterSpacing: 2,
          shadow: { enabled: true, color: '#FFFFFF', blur: 0, distance: 2, opacity: 0.5 }
        }
      }
    ]
  },

  // ---------- V85: 泼墨古风 ----------
  {
    id: 'v85',
    name: 'V85-泼墨古风',
    description: '宣纸色遮罩、墨色竖排主标题和朱红印章点缀',
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      opacity: 1,
      radius: 0,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 1080, y: 1920 },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.55)',
        0.45,
        'rgba(0,0,0,0.28)',
        1,
        'rgba(0,0,0,0.42)'
      ]
    },
    shapes: [
      {
        id: 'paperPanel',
        type: 'rect',
        x: 78,
        y: 170,
        width: 924,
        height: 1650,
        fill: '#F8F3C3',
        opacity: 0.36,
        radius: 28
      },
      {
        id: 'seal',
        type: 'rect',
        x: 890,
        y: 500,
        width: 120,
        height: 120,
        fill: '#B51E1B',
        opacity: 0.9,
        radius: 6,
        rotation: -4
      },
      {
        id: 'bottomLine',
        type: 'rect',
        x: 180,
        y: 1660,
        width: 720,
        height: 4,
        fill: '#2A211A',
        opacity: 0.55,
        radius: 2
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '东方大楷',
          fontSize: 158,
          color: '#FFFFFF',
          align: 'center',
          x: 540,
          y: 720,
          bold: true,
          letterSpacing: 10,
          lineHeight: 1.22,
          stroke: { enabled: true, color: '#111111', width: 7 },
          shadow: { enabled: true, color: '#000000', blur: 4, distance: 4, opacity: 0.52 }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: '思源宋体',
          fontSize: 62,
          color: '#2A1A00',
          align: 'center',
          x: 540,
          y: 1630,
          letterSpacing: 8,
          shadow: { enabled: true, color: '#F8E8C2', blur: 0, distance: 2, opacity: 0.5 }
        }
      },
      {
        id: 'sealText',
        text: '国风',
        style: {
          fontFamily: '东方大楷',
          fontSize: 42,
          color: '#FFFFFF',
          align: 'center',
          x: 950,
          y: 560,
          rotation: -4,
          bold: true,
          lineHeight: 1.05,
          letterSpacing: 2
        }
      }
    ]
  },

  // ---------- V86: 高级爆款白框 ----------
  {
    id: 'v86',
    name: 'V86-高级爆款白框',
    description: '中部白色粗边框卡片叠加暗色透明内层，白色中文大标题与英文副标题',
    mask: {
      enabled: true,
      type: 'rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      opacity: 1,
      radius: 0,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: 1920 },
      fillLinearGradientColorStops: [
        0,
        'rgba(0,0,0,0.2)',
        0.5,
        'rgba(0,0,0,0.02)',
        1,
        'rgba(0,0,0,0.2)'
      ]
    },
    shapes: [
      {
        id: 'whiteFrame',
        type: 'rect',
        x: 0,
        y: 665,
        width: 1080,
        height: 540,
        fill: '#FFFFFF',
        opacity: 0.96,
        radius: 0
      },
      {
        id: 'innerDark',
        type: 'rect',
        x: 52,
        y: 725,
        width: 976,
        height: 420,
        fill: '#000000',
        opacity: 0.52,
        radius: 0
      },
      {
        id: 'dividerLine',
        type: 'rect',
        x: 250,
        y: 1060,
        width: 580,
        height: 3,
        fill: '#FFFFFF',
        opacity: 0.74,
        radius: 2
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: 'Arial',
          fontSize: 104,
          color: '#FFFFFF',
          align: 'center',
          x: 540,
          y: 840,
          bold: true,
          letterSpacing: 2,
          lineHeight: 1.04,
          shadow: { enabled: true, color: '#000000', blur: 6, distance: 3, opacity: 0.52 }
        }
      },
      {
        id: 'sub',
        text: '{titleSub}',
        style: {
          fontFamily: 'Arial',
          fontSize: 60,
          color: '#FFFFFF',
          align: 'center',
          x: 540,
          y: 975,
          bold: true,
          letterSpacing: 1,
          shadow: { enabled: true, color: '#000000', blur: 5, distance: 2, opacity: 0.5 }
        }
      },
      {
        id: 'en',
        text: 'PREMIUM DESIGN',
        style: {
          fontFamily: 'Arial',
          fontSize: 40,
          color: '#FFFFFF',
          align: 'center',
          x: 540,
          y: 1075,
          letterSpacing: 1,
          opacity: 0.94,
          shadow: { enabled: true, color: '#000000', blur: 4, distance: 2, opacity: 0.45 }
        }
      }
    ]
  },

  // ---------- V87: 装修避坑贴纸 ----------
  {
    id: 'v87',
    name: 'V87-装修避坑贴纸',
    description: '装修场景封面，顶部白字棕色粗描边，红色避坑副标题，人物贴纸白边和左下角黑白提示',
    canvasReference: {
      width: 1080,
      height: 1920
    },
    currentCanvas: {
      width: 1074,
      height: 1920
    },
    mask: {
      enabled: false
    },
    shapes: [
      {
        id: 'personSticker',
        type: 'rect',
        x: 30.17,
        y: 1580,
        width: 800.45,
        height: 200,
        fill: '#FFFFFF',
        opacity: 0.78,
        radius: 180,
        rotation: 0
      }
    ],
    textLayers: [
      {
        id: 'main',
        text: '{titleMain}',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 123.69,
          bold: true,
          italic: true,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'left',
          x: 24.13,
          y: 135,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#8A4E12',
            width: 9
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.35,
            blur: 3,
            distance: 3
          }
        }
      },
      {
        id: 'sparkleLeft',
        text: '✨',
        style: {
          fontFamily: '思源黑体',
          fontSize: 56.31,
          bold: false,
          italic: false,
          underline: false,
          color: '#FFD24A',
          opacity: 1,
          letterSpacing: 0,
          lineHeight: 1.3,
          align: 'center',
          x: 962.35,
          y: 152,
          rotation: 0,
          stroke: {
            enabled: false,
            color: '#000000',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.66,
            blur: 6,
            distance: 0
          }
        }
      },
      {
        id: 'question',
        text: '😍 {titleSub}💰',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 78.44,
          bold: true,
          italic: false,
          underline: false,
          color: '#F03A36',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'left',
          x: 48.27,
          y: 315,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 6
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.24,
            blur: 2,
            distance: 2
          }
        }
      },
      {
        id: 'bottomTop',
        text: '装修冷知识',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 64.36,
          bold: true,
          italic: false,
          underline: false,
          color: '#FFFFFF',
          opacity: 1,
          letterSpacing: 1,
          lineHeight: 1.3,
          align: 'left',
          x: 408.27,
          y: 1627,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#111111',
            width: 8
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#FFFFFF',
            opacity: 0.5,
            blur: 0,
            distance: 2
          }
        }
      },
      {
        id: 'bottomMain',
        text: '少走弯路',
        style: {
          fontFamily: '优设标题黑',
          fontSize: 74.41,
          bold: true,
          italic: true,
          underline: false,
          color: '#FFF3C0',
          opacity: 1,
          letterSpacing: 2,
          lineHeight: 1.3,
          align: 'left',
          x: 148.83,
          y: 1720,
          rotation: 0,
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 4
          },
          background: {
            enabled: false,
            color: '#000000',
            opacity: 0.6,
            radius: 0,
            width: null,
            height: null
          },
          shadow: {
            enabled: true,
            color: '#6B3F00',
            opacity: 0.58,
            blur: 4,
            distance: 3
          },
          fillLinearGradientStartPoint: {
            x: 0,
            y: 0
          },
          fillLinearGradientEndPoint: {
            x: 0,
            y: 74
          },
          fillLinearGradientColorStops: [0, '#FFFFFF', 0.48, '#FFE69A', 1, '#B66A19']
        }
      }
    ]
  }
]


export function getTemplateOptionById(id) {
  return TEMPLATES.filter(item => item.id === id)[0]
}
