import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { pathJoin } from '../utils'

/**
 * 提取视频文案
 */
export function useExtractContent() {
  const loading = ref(false)
  /**
   * 视频链接
   */
  const videoLink = ref('')
  const extractedContent = ref('')
  const mediaExtracting = ref(false)
  const selectedMediaName = ref('')
  const selectedMediaFilePath = ref('')

  /**
   * 选择音视频文件
   */
  const selectFile = async () => {
    const result = await window.api.file.selectFile({
      title: '选择音视频文件',
      filters: [
        {
          name: '音频或视频文件',
          extensions: [
            'mp3',
            'wav',
            'm4a',
            'aac',
            'flac',
            'ogg',
            'mp4',
            'mov',
            'avi',
            'mkv',
            'flv',
            'webm',
            'm4v'
          ]
        }
      ]
    })

    if (result.success) {
      selectedMediaName.value = result.data.fileName
      selectedMediaFilePath.value = result.data.filePath
    }
  }

  /**
   * 从视频链接提取文案
   */
  const extractFromLink = async (url, onProgress) => {
    if (!url || !url.trim()) {
      message.warning('请输入视频链接')
      return { success: false, error: '请输入视频链接' }
    }

    loading.value = true
    mediaExtracting.value = true
    extractedContent.value = ''

    try {
      let videoUrl = url.trim()

      // 如果链接不是以 http 开头，尝试解析
      if (!videoUrl.startsWith('http')) {
        try {
          onProgress?.('正在解析视频链接...')
          const parsed = await window.api.videoParser.extractUrl(videoUrl)
          if (parsed?.success && parsed?.data?.url) {
            videoUrl = String(parsed.data.url)
            onProgress?.('视频链接解析成功')
            console.log('视频链接解析成功:', videoUrl)
          } else {
            throw new Error('解析视频链接失败')
          }
        } catch (err) {
          console.error('视频链接解析出错', err)
          throw new Error('解析视频链接失败，请检查链接格式是否正确')
        }
      }

      // 验证链接有效性
      onProgress?.('正在验证视频链接...')
      const validateResult = await window.api.videoParser.validateUrl(videoUrl)
      if (!validateResult?.success) {
        console.warn('视频链接验证失败，继续尝试...')
      }

      console.log('视频链接验证成功:', videoUrl)
      // 提取文案
      onProgress?.('正在提取文案内容...')
      const result = await window.api.videoParser.parseAndExtract(videoUrl)

      if (result?.success) {
        const content = result.data?.extractedContent || ''
        extractedContent.value = content
        onProgress?.('提取完成！')
        console.log('提取文案成功')
        console.log('视频信息:', result.data?.videoInfo)
        return {
          success: true,
          data: {
            content,
            videoInfo: result.data?.videoInfo
          }
        }
      }

      throw new Error(result?.error || '文案提取失败')
    } catch (err) {
      const errorMsg = err.message || '未知错误'
      message.error('提取文案失败：' + errorMsg)
      onProgress?.('提取失败')
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
      mediaExtracting.value = false
    }
  }

  /**
   * 从视频链接或本地文件提取文案
   */
  const extractContent = async (url, onProgress) => {
    if (url) {
      return extractFromLink(url, onProgress)
    }

    if (!selectedMediaFilePath.value) {
      return
    }
    return extractFromMedia(selectedMediaFilePath.value, onProgress)
  }

  /**
   * 从本地音视频文件提取文案
   */
  const extractFromMedia = async (filePath, onProgress) => {
    if (!filePath) {
      return { success: false, error: '未选择文件' }
    }

    loading.value = true
    mediaExtracting.value = true
    extractedContent.value = ''

    console.log('正从媒体文件中提取文案', filePath)

    try {
      // 检查文件是否为视频格式
      const isVideo = /\.(mp4|mov|avi|mkv|flv|webm|m4v)$/i.test(filePath)
      const isAudio = /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(filePath)

      if (!isVideo && !isAudio) {
        throw new Error('不支持的格式，请使用 MP4、AVI、MOV、WMV、FLV、MKV 或 WEBM 格式')
      }

      let audioPath = filePath

      // 如果是视频，先提取音频
      if (isVideo) {
        onProgress?.('正在从视频中提取音频...')
        const dataRes = await window.api.file.getDataPath()
        const dataDir = dataRes.data.dataDir
        // 从视频中提取音频
        const extractResult = await window.api.video.extractAudio({
          videoPath: filePath,
          outputPath: pathJoin(dataDir, 'extract_media', `media_audio_${Date.now()}.mp3`)
        })
        if (!extractResult?.success || !extractResult?.data?.audioPath) {
          throw new Error(extractResult?.error || '提取音频失败')
        }

        audioPath = extractResult.data.audioPath
      }

      // 识别语音
      onProgress?.('正在识别语音...')
      const asrResult = await window.api.python.asr.recognize(audioPath, 'auto', true)
      console.log('语音识别结果', asrResult)

      if (!asrResult?.success) {
        throw new Error(asrResult?.error || '语音识别失败')
      }

      const text = asrResult?.data?.data?.text || asrResult?.data?.data?.processed_text || ''
      if (!text) {
        throw new Error('ASR识别成功但没有返回句子数据')
      }

      extractedContent.value = text
      onProgress?.('提取完成！')
      return {
        success: true,
        data: { content: text }
      }
    } catch (err) {
      console.error('提取文案失败', err)
      const errorMsg = err.message || '未知错误'
      message.error('提取失败：' + errorMsg)
      onProgress?.('提取失败')
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
      mediaExtracting.value = false
    }
  }

  /**
   * 清除
   */
  const clear = () => {
    videoLink.value = ''
    extractedContent.value = ''
    selectedMediaName.value = ''
    selectedMediaFilePath.value = ''
  }

  return {
    loading,
    videoLink,
    extractedContent,
    mediaExtracting,
    selectedMediaName,
    selectedMediaFilePath,
    extractContent,
    extractFromMedia,
    extractFromLink,
    clear,
    selectFile
  }
}
