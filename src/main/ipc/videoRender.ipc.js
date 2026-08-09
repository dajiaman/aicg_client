import logger from '../log'

/**
 * 注册 videoRender:* 通道
 */
export function registerVideoRenderIpc(ipcMain) {
  logger.info('[video-render] registering video render ipc')
  // ------------------------------------------------------------
  // ---------- 渲染视频 ----------
  /**
   * 渲染视频
   */
  ipcMain.handle('video-render:render', async (_, params) => {
    return { success: true, data: params }
  })

  /**
   * 获取视频模板
   */
  ipcMain.handle('video-render:get-templates', async () => {
    logger.info('[video-render] get-templates')

    const list = [
      {
        id: 't1',
        name: '经典黄白 T1',
        description: '支持关键词高亮和多种字幕动画效果，无自动匹配BGM',
        version: '1.0',
        preview_video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t1.mp4',
        cover_image_url: 'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t1.jpg'
      },
      {
        id: 't10',
        name: '专业蓝白 T10',
        description: '自动BGM和声音特效，自动画面动画,关键词高亮',
        version: '1.0',
        preview_video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t10.mp4',
        cover_image_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t10.png'
      },
      {
        id: 't2',
        name: '高级橙白 T2',
        description: '动态分句显示字幕，关键词高亮，无自动匹配BGM',
        version: '1.0',
        preview_video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t2.mp4',
        cover_image_url: 'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t2.jpg'
      },
      {
        id: 't3',
        name: '黄白字幕 T3',
        description: '自动BGM和声音特效，自动画面动画,关键词高亮',
        version: '1.0',
        preview_video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t3.mp4',
        cover_image_url: 'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t3.jpg'
      },
      {
        id: 't4',
        name: '书法黄白 T4',
        description: '自动BGM和声音特效，自动画面动画,关键词高亮',
        version: '1.0',
        preview_video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t4.mp4',
        cover_image_url: 'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t4.jpg'
      },
      {
        id: 't5',
        name: '高级情感 T5',
        description: '自动BGM和声音特效，自动画面动画,关键词高亮',
        version: '1.0',
        preview_video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t5.mp4',
        cover_image_url: 'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t5.jpg'
      },
      {
        id: 't6',
        name: '百搭暖黄 T6',
        description: '自动BGM和声音特效，自动画面动画,关键词高亮',
        version: '1.0',
        preview_video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t6.mp4',
        cover_image_url: 'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t6.jpg'
      },
      {
        id: 't7',
        name: '红白经典 T7',
        description: '自动BGM和声音特效，自动画面动画,关键词高亮',
        version: '1.0',
        preview_video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t7.mp4',
        cover_image_url: 'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t7.jpg'
      },
      {
        id: 't8',
        name: '粉白经典 T8',
        description: '自动BGM和声音特效，自动画面动画,关键词高亮',
        version: '1.0',
        preview_video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t8.mp4',
        cover_image_url: 'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t8.jpg'
      },
      {
        id: 't9',
        name: '专业橙白 T9',
        description: '自动BGM和声音特效，自动画面动画,关键词高亮',
        version: '1.0',
        preview_video_url:
          'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t9.mp4',
        cover_image_url: 'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/t9.png'
      }
    ]

    return { success: true, data: list }
  })
}
