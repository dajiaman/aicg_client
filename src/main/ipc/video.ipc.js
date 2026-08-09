// video:*  —  视频相关：抽帧 / 提取音频
import fs from 'fs'
import { spawn } from 'child_process'
import path, { join } from 'path'
import logger from '../log'
import { models } from '../database/services'
import { ensureDir, getFFmpegBin, runCmd, normalizePath, stripExt, pathFileName } from '../utils/index'
import { getDataDir } from './file.ipc'

/**
 * 注册 video:* 通道
 */
export function registerVideoIpc(ipcMain) {
  logger.info('[video] registering video ipc')
  // ------------------------------------------------------------
  // 视频提取音频（video:extract-audio）
  // ------------------------------------------------------------
  // 入参：{
  //   videoPath: string,                    // 必填
  //   outputDir?: string,                   // 可选，覆盖 paths.audioOutput
  //   outputName?: string,                  // 可选，自定义文件名（不含扩展名）
  // }
  // 输出：写入系统配置 `paths.audioOutput` 下，
  //       `${audioRoot}/<safeStem>/<safeName>.<ext>`
  // 返回：{ success: true, data: { audioPath, audioDir, audioName,
  //         audioSize, videoPath, format } }
  ipcMain.handle('video:extract-audio', async (_, opts = {}) => {
    logger.info(`[video:extract-audio] ${JSON.stringify(opts)}`)
    try {
      const { videoPath, outputPath, outputDir, outputName } = opts || {}
      const audioBitrate = '192k'

      if (!videoPath || typeof videoPath !== 'string') {
        return { success: false, error: 'videoPath 不能为空' }
      }
      if (!fs.existsSync(videoPath)) {
        return { success: false, error: `视频文件不存在: ${videoPath}` }
      }

      // 兼容两种调用：
      //   1) 直接传 outputPath
      //   2) 传 outputDir + outputName
      // 都没有则兜底到 dataDir/audioOutput/<videoStem>.wav
      let finalOutputPath = outputPath
      if (!finalOutputPath && outputDir) {
        const dir = path.resolve(outputDir)
        const name = outputName ? safeFileName(outputName) : `${stripExt(pathFileName(videoPath))}.wav`
        finalOutputPath = join(dir, name)
      }
      if (!finalOutputPath || typeof finalOutputPath !== 'string') {
        const fallbackDir = join(getDataDir(), 'audioOutput')
        finalOutputPath = join(fallbackDir, `${stripExt(pathFileName(videoPath))}.wav`)
      }
      // 兜底后再次防御
      if (!finalOutputPath || typeof finalOutputPath !== 'string') {
        return { success: false, error: '无法确定输出路径（outputPath 不能为空）' }
      }

      // 确保输出目录存在
      ensureDir(path.dirname(path.resolve(finalOutputPath)))

      const ffmpegPath = getFFmpegBin('ffmpeg')
      if (!ffmpegPath) {
        return {
          success: false,
          error: '未找到 ffmpeg，请确认 ./ffmpeg/bin/ffmpeg.exe 已放置'
        }
      }

      // 从 finalOutputPath 后缀推断目标格式（无后缀时兜底 wav）
      const extRaw = finalOutputPath ? path.extname(finalOutputPath).slice(1).toLowerCase() : ''
      const ext = extRaw || 'wav'
      const bitrate =
        typeof audioBitrate === 'string' && /^\d{2,5}k$/i.test(audioBitrate) ? audioBitrate : '192k'

      // ffmpeg 参数：仅音频流 (-vn)，按格式选编码器
      const args = ['-i', videoPath, '-vn', '-y']
      if (ext === 'mp3') {
        args.push('-acodec', 'libmp3lame', '-b:a', bitrate)
      } else if (ext === 'wav') {
        args.push('-acodec', 'pcm_s16le')
      } else if (ext === 'm4a' || ext === 'aac') {
        args.push('-acodec', 'aac', '-b:a', bitrate)
      } else {
        // 兜底：直接 copy 视频源音轨
        args.push('-c:a', 'copy')
      }
      args.push(finalOutputPath)

      logger.info(`[video:extract-audio] ffmpeg -> ${finalOutputPath} (${ext}, ${bitrate})`)

      try {
        await runCmd(ffmpegPath, args)
        logger.info(`[video:extract-audio] ffmpeg success: ${finalOutputPath}`)
      } catch (e) {
        logger.error(`[video:extract-audio] ffmpeg failed: ${e.message}`)
        return { success: false, error: e.message }
      }

      if (!fs.existsSync(finalOutputPath) || fs.statSync(finalOutputPath).size === 0) {
        return { success: false, error: '音频提取失败，未生成文件' }
      }

      let audioSize = 0
      try {
        audioSize = fs.statSync(finalOutputPath).size
      } catch {}

      return {
        success: true,
        data: {
          audioPath: finalOutputPath,
          audioDir: path.dirname(finalOutputPath),
          audioName: pathFileName(finalOutputPath),
          audioSize,
          videoPath,
          format: ext
        }
      }
    } catch (e) {
      logger.error(`[video:extract-audio] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  // ------------------------------------------------------------
  // 视频剪辑（video:trim）
  // ------------------------------------------------------------
  // 入参：{
  //   inputPath: string,     // 必填
  //   start / startTime: number,         // 必填，开始时间（秒）
  //   duration?: number,                 // 裁剪时长（秒），与 endTime 二选一
  //   endTime?: number,                  // 结束时间（秒）
  //   opts?: {
  //     format?: string,                 // 默认按输出后缀
  //     codec?: 'copy' | 'h264' | 'h265' | 'libx264' | 'libx265' | 'vp9' | ...
  //     bitrate?: string,                // 例如 '4M'
  //     preset?: string,                 // x264 预设：ultrafast / medium / slow
  //     crf?: number,                    // 0-51，越低质量越好
  //     size?: string,                   // 缩放：'1920x1080' / '1280x?'
  //     audioCodec?: 'copy' | 'aac' | 'mp3' | ...
  //     timeoutMs?: number,              // 默认 60000
  //   }
  // }
  // 返回：{
  //   success: true,
  //   data: {
  //     inputPath, outputPath,
  //     start, duration, endTime,
  //     format, codec, size, durationActual
  //   }
  // }
  ipcMain.handle('video:trim', async (_, params = {}) => {
    logger.info('[video:trim] invoke')
    try {
      // ---------- 1. 解析参数（兼容两种命名） ----------
      const inputPath = params.inputPath
      const start = Number(params.start ?? params.startTime)
      let duration = Number(params.duration)
      let endTime = Number(params.endTime)
      const opts = params.opts || params.options || {}

      if (!inputPath || typeof inputPath !== 'string') {
        return { success: false, error: 'inputPath / videoPath 不能为空' }
      }

      if (!fs.existsSync(inputPath)) {
        return { success: false, error: `视频文件不存在: ${inputPath}` }
      }

      if (!Number.isFinite(start) || start < 0) {
        return { success: false, error: 'start / startTime 必须为非负数（秒）' }
      }

      // ---------- 2. 计算 duration / endTime ----------
      // 优先级：duration > endTime > endTime = start（默认截 1 秒）
      if (!Number.isFinite(duration) || duration <= 0) {
        if (Number.isFinite(endTime) && endTime > start) {
          duration = endTime - start
        } else {
          return { success: false, error: 'duration 或 endTime 必须为正数（秒）' }
        }
      }
      endTime = start + duration

      // ---------- 3. 输出路径 ----------
      // 原视频后缀
      const ext = path.extname(inputPath).slice(1).toLowerCase()
      // 原视频文件名, 不包含后缀
      const filename = path.basename(inputPath, `.${ext}`)

      // 输出路径
      const outputPath = join(getDataDir(), 'videos/', `${filename}_${Date.now()}.${ext}`)

      // 确保输出目录存在
      const outDir = path.dirname(outputPath)
      ensureDir(outDir)

      // ---------- 4. 解析编码参数 ----------
      const codec = opts.codec || 'copy' // 默认 stream copy（极快）
      const isReencode = codec !== 'copy'
      const format = opts.format || ext || 'mp4'

      // ---------- 5. 构建 ffmpeg 参数 ----------
      const args = ['-y']

      // 输入在 -ss 前 → input seek（快速但精度差，适合 copy）
      // 输入在 -ss 后 → output seek（精确但慢，适合 re-encode）
      if (isReencode) {
        args.push('-i', inputPath, '-ss', String(start), '-t', String(duration))
      } else {
        args.push('-ss', String(start), '-i', inputPath, '-t', String(duration))
      }

      // 编码器
      if (isReencode) {
        args.push('-c:v', codec)
        if (opts.preset) args.push('-preset', String(opts.preset))
        if (opts.crf !== undefined) args.push('-crf', String(opts.crf))
        if (opts.bitrate) args.push('-b:v', String(opts.bitrate))
        if (opts.size) args.push('-vf', `scale=${String(opts.size)}`)
      } else {
        args.push('-c:v', 'copy')
      }

      // 音频
      args.push('-c:a', opts.audioCodec || (isReencode ? 'aac' : 'copy'))

      // 容器
      args.push('-f', format)

      // 避免重新编码时输出末尾多 1 秒
      args.push('-avoid_negative_ts', 'make_zero')

      args.push(outputPath)

      logger.info(`[video:trim] ffmpeg ${args.join(' ')}`)

      // ---------- 6. 执行 ----------
      const ffmpegPath = getFFmpegBin('ffmpeg')
      if (!ffmpegPath) {
        return { success: false, error: '未找到 ffmpeg.exe ...' }
      }

      const timeoutMs = Number(opts.timeoutMs) || 60000
      let timeoutHandle
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error(`ffmpeg 超时（${timeoutMs}ms）`)),
          timeoutMs
        )
      })

      let ffmpegResult
      try {
        ffmpegResult = await Promise.race([runCmd(ffmpegPath, args), timeoutPromise])
      } finally {
        clearTimeout(timeoutHandle)
      }

      // ---------- 校验执行结果 ----------
      // ffmpeg 在 -c copy 流拷贝时，即使成功也可能 stderr 有 warning
      // （比如"non monotonically increasing dts"）—— 必须结合 exit code 判断
      if (ffmpegResult.code === undefined || ffmpegResult.code === null) {
        // 进程没正常退出（被 signal kill 或 spawn 失败）
        return {
          success: false,
          error: `ffmpeg 未正常退出（signal: ${ffmpegResult.signal || 'N/A'}）`
        }
      }
      if (ffmpegResult.code !== 0) {
        return {
          success: false,
          error: `ffmpeg 退出码 ${ffmpegResult.code}: ${ffmpegResult.stderr?.slice(-400) || ''}`
        }
      }

      // ---------- 7. 校验输出 ----------
      if (!fs.existsSync(outputPath)) {
        return { success: false, error: '输出文件未生成' }
      }
      const stat = fs.statSync(outputPath)
      if (stat.size <= 0) {
        return { success: false, error: '输出文件为空' }
      }

      return {
        success: true,
        data: {
          inputPath,
          outputPath,
          start,
          duration,
          endTime,
          format,
          codec,
          size: stat.size,
          durationActual: duration // 流拷贝下就是 duration；re-encode 时近似
        }
      }
    } catch (e) {
      logger.error('[video:trim] failed:', e)
      return { success: false, error: e.message || '视频裁剪失败' }
    }
  })

  /**
   * 多镜头构建（多数字人参考视频顺序拼接）
   *
   * 入参 params: {
   *   scenes: Array<{ videoPath: string, duration: number }>  // 每个镜头的视频与循环时长
   *   targetHeight?: number                                  // 统一高度，默认 720
   * }
   *
   * 行为：
   *   - 每个输入用 `-stream_loop -1 -t <duration>` 循环到指定时长
   *   - 所有输入统一缩放到 targetHeight，保持宽高比
   *   - 用 concat 滤镜首尾相接拼成一个长视频（不是并排）
   *   - 输出 mp4（H.264 + AAC）
   */
  ipcMain.handle('video:build-multi-avatar-reference', async (_, params) => {
    logger.info('[video:build-multi-avatar-reference]', params)
    const { scenes, targetHeight = 1920 } = params || {}

    if (!scenes || scenes.length === 0) {
      return { success: false, message: '无镜头' }
    }
    // 验证每个镜头
    const invalid = scenes.find((s) => !s.videoPath || !s.duration || s.duration <= 0)
    if (invalid) {
      return { success: false, message: '镜头配置不完整！' }
    }
    // 校验输入文件存在
    const missing = scenes.find((s) => !fs.existsSync(s.videoPath))
    if (missing) {
      return { success: false, message: `输入视频不存在: ${missing.videoPath}` }
    }

    const ffmpegPath = getFFmpegBin('ffmpeg')
    if (!ffmpegPath) {
      return { success: false, error: '未找到 ffmpeg.exe。请将 ffmpeg.exe 放在 ./ffmpeg/bin/ 下' }
    }

    const videoOutputDir = models.config.get('paths.videoOutput')
    ensureDir(videoOutputDir)
    const outputPath = path.join(videoOutputDir, `multi_avatar_reference_${Date.now()}.mp4`)

    const n = scenes.length

    // 视频统一到精确尺寸，准备 concat。
    // 注意：concat 要求所有片段宽高严格一致，不能各自保持比例（否则宽度不同报 -22）。
    // 数字人参考视频多为竖屏（9:16），以 targetHeight 为长边（高度），
    // 宽度 = 高 × 9/16，等比缩放后 pad 到统一尺寸（W×H，均为偶数），避免画幅被压小。
    const targetWidth = Math.round((targetHeight * 9) / 16 / 2) * 2 // 9:16 竖屏宽度，保证偶数
    const scaleParts = []
    const concatVideoLabels = []
    for (let i = 0; i < n; i++) {
      scaleParts.push(
        `[${i}:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p[${i}v]`
      )
      concatVideoLabels.push(`[${i}v]`)
    }
    const videoConcat = `${concatVideoLabels.join('')}concat=n=${n}:v=1:a=0[vout]`
    const filterComplex = [...scaleParts, videoConcat].join(';')

    // 总时长（用于生成等长静音音轨）
    const totalDuration = scenes.reduce((sum, s) => sum + Number(s.duration) || 0, 0)

    // 输入参数：-stream_loop -1 -t duration -i videoPath ...
    const inputArgs = ['-hide_banner']
    scenes.forEach((s) => {
      inputArgs.push('-stream_loop', '-1', '-t', `${s.duration}`, '-i', s.videoPath)
    })
    // 追加一个 lavfi 静音音源（总时长），作为唯一音频输入，避免各输入音轨不一致 / 无音轨问题
    inputArgs.push(
      '-f',
      'lavfi',
      '-t',
      `${totalDuration}`,
      '-i',
      'anullsrc=channel_layout=stereo:sample_rate=48000'
    )
    const audioInputIndex = n // lavfi 输入是最后一个（索引 = 输入文件数）

    const args = [
      '-y',
      ...inputArgs,
      '-filter_complex',
      filterComplex,
      '-map',
      '[vout]',
      '-map',
      `${audioInputIndex}:a`,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputPath
    ]

    logger.info(`[video:build-multi-avatar-reference] ffmpeg ${args.join(' ')}`)

    // 自定义 spawn：捕获完整 stderr（runCmd 只保留末尾 400 字符，不利于定位 -22 根因）
    const ffmpegError = await new Promise((resolve) => {
      const child = spawn(ffmpegPath, args, { windowsHide: true })
      let stderr = ''
      child.stderr?.on('data', (d) => {
        stderr += d.toString()
      })
      child.on('error', (e) => resolve(`spawn error: ${e.message}`))
      child.on('close', (code) => {
        if (code === 0) resolve(null)
        else resolve(`exit ${code}: ${stderr.slice(-1500)}`)
      })
    })

    if (ffmpegError) {
      logger.error(`[video:build-multi-avatar-reference] ffmpeg failed: ${ffmpegError}`)
      return { success: false, error: `合成失败: ${ffmpegError}` }
    }

    if (!fs.existsSync(outputPath)) {
      return { success: false, error: '合成完成但未生成输出文件' }
    }

    // 用 ffprobe 读取真实输出信息（分辨率/时长/大小）
    const returnData = {
      duration: 0,
      fileSize: fs.statSync(outputPath).size,
      fps: 0,
      height: 0,
      outputPath: outputPath,
      success: true,
      width: 0
    }

    const ffprobePath = getFFmpegBin('ffprobe')
    if (ffprobePath) {
      try {
        const { stdout } = await runCmd(ffprobePath, [
          '-v',
          'quiet',
          '-print_format',
          'json',
          '-show_format',
          '-show_streams',
          outputPath
        ])
        const meta = JSON.parse(stdout)
        const videoStream = (meta.streams || []).find((s) => s.codec_type === 'video')
        const fmt = meta.format || {}
        if (videoStream) {
          returnData.width = parseInt(videoStream.width) || 0
          returnData.height = parseInt(videoStream.height) || 0
          if (videoStream.avg_frame_rate) {
            const [a, b] = videoStream.avg_frame_rate.split('/').map(Number)
            returnData.fps = b ? +(a / b).toFixed(2) : 0
          }
        }
        returnData.duration = parseFloat(fmt.duration) || 0
      } catch (e) {
        logger.warn(`[video:build-multi-avatar-reference] ffprobe failed: ${e.message}`)
      }
    }

    logger.info(
      `[video:build-multi-avatar-reference] done: ${outputPath} ${returnData.width}x${returnData.height}`
    )
    console.log('returnData:', returnData)
    return { success: true, data: returnData }
  })

  // ------------------------------------------------------------
  // 视频封面（video:get-cover）
  // ------------------------------------------------------------
  // 入参：{
  //   videoPath: string,                    // 必填
  //   outputPath?: string,                  // 选填，封面输出路径（不传则自动生成）
  //   options?: { width?: number, time?: number, format?: 'jpg' | 'png' }
  // }
  // 返回：{ success: true, coverPath, videoPath, time, width, height }
  //   注意：coverPath 在顶层（平铺），与 renderer 的 `coverRes.coverPath` 一致
  ipcMain.handle('video:get-cover', async (_, videoPath, outputPath, options = {}) => {
    logger.info('[video:get-cover]', videoPath, outputPath, options)
    try {
      // ---------- 兼容三种入参格式 ----------
      //   A: getCover(videoPath)                        // 单参
      //   B: getCover(videoPath, outputPath)            // 输出路径
      //   C: getCover(videoPath, outputPath, options)   // 完整
      //   D: getCover({ videoPath, outputPath, options }) // 对象（renderer 没用到）
      let inputVideo = videoPath
      let inputOutput = outputPath

      let opts = options || {}
      if (typeof videoPath === 'object' && videoPath !== null) {
        const obj = videoPath
        inputVideo = obj.videoPath
        inputOutput = obj.outputPath
        opts = obj.options || obj.opts || {}
      }

      // ---------- 1. 参数校验 ----------
      if (!inputVideo || typeof inputVideo !== 'string') {
        return { success: false, error: 'videoPath 不能为空' }
      }
      if (!fs.existsSync(inputVideo)) {
        return { success: false, error: `视频文件不存在: ${inputVideo}` }
      }
      const stat = fs.statSync(inputVideo)
      if (stat.isDirectory()) {
        return { success: false, error: `不能是目录: ${inputVideo}` }
      }

      const ffmpegPath = getFFmpegBin('ffmpeg')
      const ffprobePath = getFFmpegBin('ffprobe')
      if (!ffmpegPath) {
        return { success: false, error: '未找到 ffmpeg.exe。请将 ffmpeg.exe 放在 ./ffmpeg/bin/ 下' }
      }

      // ---------- 2. 计算抽帧时间 ----------
      let probeDuration = 0
      try {
        if (ffprobePath) {
          const { stdout } = await runCmd(ffprobePath, [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            inputVideo
          ])
          const d = parseFloat(stdout.trim())
          if (Number.isFinite(d) && d > 0) probeDuration = d
        }
      } catch {
        // ffprobe 失败时退化为默认
      }

      const explicitTime =
        opts.time != null && Number.isFinite(Number(opts.time)) && Number(opts.time) >= 0
      let actualTime
      if (explicitTime) {
        actualTime = Math.max(0.05, Number(opts.time))
        if (probeDuration > 0 && actualTime > probeDuration - 0.2) {
          actualTime = Math.max(0.1, probeDuration - 0.2)
        }
      } else {
        // 默认：前 5 秒随机；不足 5s 时按视频长度范围随机
        const capSec = probeDuration > 0 ? Math.min(5, probeDuration) : 5
        const upper = Math.max(0.5, capSec - 0.1)
        const lower = 0.1
        actualTime = lower + Math.random() * (upper - lower)
      }

      // ---------- 3. 输出路径 ----------
      const fmt = (opts.format || 'jpg').toLowerCase()
      let coverPath = inputOutput

      if (!coverPath) {
        const dir = path.join(getDataDir(), 'thumbs')
        const stem = path.basename(inputVideo, path.extname(inputVideo))
        coverPath = path.join(dir, `${stem}_cover_${Date.now()}.${fmt}`)
      }

      ensureDir(path.dirname(coverPath))

      // ---------- 4. 抽帧 ----------
      const width = Number(opts.width) > 0 ? Math.round(Number(opts.width)) : 1080
      const args = ['-ss', actualTime.toFixed(3), '-i', inputVideo, '-frames:v', '1', '-q:v', '2']
      if (width > 0) {
        args.push('-vf', `scale=${width}:-2`)
      }
      args.push('-y', coverPath)

      logger.info(`[video:get-cover] ffmpeg ${actualTime.toFixed(2)}s -> ${coverPath}`)

      const result = await runCmd(ffmpegPath, args)

      if (result.code !== undefined && result.code !== 0) {
        return {
          success: false,
          error: `ffmpeg 退出码 ${result.code}: ${result.stderr?.slice(-400) || ''}`
        }
      }

      // ---------- 5. 校验输出 ----------
      if (!fs.existsSync(coverPath)) {
        return { success: false, error: '封面文件未生成' }
      }
      const coverStat = fs.statSync(coverPath)
      if (coverStat.size <= 0) {
        return { success: false, error: '封面文件为空' }
      }

      // 尝试读取图片尺寸
      let imgWidth = 0
      let imgHeight = 0
      try {
        const dimProbe = await runCmd(ffprobePath, [
          '-v',
          'error',
          '-select_streams',
          'v:0',
          '-show_entries',
          'stream=width,height',
          '-of',
          'csv=s=x:p=0',
          coverPath
        ])
        const [w, h] = dimProbe.stdout.trim().split('x').map(Number)
        if (Number.isFinite(w) && Number.isFinite(h)) {
          imgWidth = w
          imgHeight = h
        }
      } catch {
        // 读取尺寸失败不阻塞
      }

      // ---------- 6. 返回（与 renderer 字段读取一致：平铺） ----------
      return {
        success: true,
        data: {
          coverPath,
          videoPath: inputVideo,
          time: actualTime,
          width: imgWidth,
          height: imgHeight,
          size: coverStat.size,
          format: fmt
        }
      }
    } catch (e) {
      logger.error('[video:get-cover] failed:', e)
      return { success: false, error: e.message || '获取视频封面失败' }
    }
  })

  /**
   * 获取视频信息（video:get-info）
   *
   * 返回
   * {
   *   success: true,
   *   data: {
   *     path: string,                 // 视频绝对路径
   *     bitrate: number,              // 码率（bps）
   *     display_rotation: number | null, // 显示方向旋转角
   *     duration: number,             // 时长（秒）
   *     fps: number,                  // 帧率（保留 2 位小数）
   *     height: number,               // 显示高度
   *     width: number,                // 显示宽度
   *   }
   * }
   */
  ipcMain.handle('video:get-info', async (_, videoPath) => {
    logger.info('[video:get-info]', videoPath)
    try {
      // ---------- 参数校验 ----------
      if (!videoPath || typeof videoPath !== 'string') {
        logger.warn('[video:get-info] videoPath is empty or not a string')
        return { success: false, error: 'videoPath 不能为空' }
      }

      const absPath = normalizePath(videoPath)
      if (!fs.existsSync(absPath)) {
        return { success: false, error: `视频文件不存在: ${absPath}` }
      }
      const stat = fs.statSync(absPath)
      if (stat.isDirectory()) {
        return { success: false, error: `不能是目录: ${absPath}` }
      }

      // ---------- ffprobe ----------
      const ffprobePath = getFFmpegBin('ffprobe')
      logger.info('[video:get-info] ffprobePath=%s absPath=%s', ffprobePath, absPath)
      if (!ffprobePath) {
        return {
          success: false,
          message: '未找到 ffprobe.exe。请将 ffmpeg.exe / ffprobe.exe 放在 ./ffmpeg/bin/ 下'
        }
      }

      let probe
      let probeStdout = ''
      try {
        // 不要用 -v error：旧版 ffprobe 在某些容器上会把 "moov atom not found"
        // 之类的解析错误也归到 error，导致 stdout 为空；
        // 用 -v quiet 把 stderr 噪声压住，保留 info/warning 到 stderr 方便排查
        const { stdout, stderr } = await runCmd(ffprobePath, [
          '-v',
          'quiet',
          '-print_format',
          'json',
          '-show_format',
          '-show_streams',
          absPath
        ])
        probeStdout = stdout || ''
        probe = JSON.parse(probeStdout)
      } catch (e) {
        logger.error(
          '[video:get-info] ffprobe failed for %s: %s. stdout(len=%d)=%s stderr=%s',
          absPath,
          e.message,
          probeStdout.length,
          probeStdout.slice(0, 300),
          (e.stderr || '').slice(0, 200)
        )
        return {
          success: false,
          error: `ffprobe 失败: ${e.message || 'unknown'}`
        }
      }

      // 诊断：打印视频流的关键字段，便于排查 width/height 为 0 的问题
      logger.info(
        '[video:get-info] %s streams=%d format=%j',
        absPath,
        (probe.streams || []).length,
        {
          format_name: probe.format?.format_name,
          duration: probe.format?.duration,
          bit_rate: probe.format?.bit_rate
        }
      )
      for (const s of probe.streams || []) {
        if (s.codec_type === 'video') {
          logger.info(
            '[video:get-info] video stream: width=%s height=%s coded_width=%s coded_height=%s rotation=%j side_data=%j',
            s.width,
            s.height,
            s.coded_width,
            s.coded_height,
            s.tags?.rotate ?? s.tags?.rotation,
            s.side_data_list
          )
        }
      }

      const fmt = probe.format || {}
      const streams = Array.isArray(probe.streams) ? probe.streams : []
      // 优先找 codec_type === 'video'；退化策略：取 streams[0]（部分容器不写 codec_type）
      let videoStream = streams.find((s) => s.codec_type === 'video') || null
      if (!videoStream && streams.length > 0) {
        const first = streams[0]
        // 只要有 width/height 字段就当作视频流
        if (first && (first.width || first.height || first.coded_width || first.coded_height)) {
          videoStream = first
          logger.warn(
            '[video:get-info] no codec_type=video, falling back to streams[0] (codec_type=%s codec_name=%s)',
            first.codec_type,
            first.codec_name
          )
        }
      }
      // 诊断：未找到视频流时打印详细 stream 列表
      if (!videoStream) {
        logger.warn(
          '[video:get-info] no video stream found. streams=%j',
          streams.map((s) => ({
            idx: streams.indexOf(s),
            codec_type: s.codec_type,
            codec_name: s.codec_name
          }))
        )
      }

      // ---------- 解析显示宽高 + rotation ----------
      // iPhone 视频 width=1080 height=1920 但 tags.rotate=-90，
      // 用户视觉上的方向是 1920x1080，这里互换为 display 方向
      //
      // 兼容字段名：
      //   width/height     标准
      //   coded_width/coded_height  旧版 ffprobe / 编码尺寸
      //   sample_aspect_ratio / display_aspect_ratio  极少数容器
      let width = 0
      let height = 0
      let display_rotation = null
      if (videoStream) {
        const rawW = videoStream.width ?? videoStream.coded_width ?? 0
        const rawH = videoStream.height ?? videoStream.coded_height ?? 0
        width = parseInt(rawW, 10) || 0
        height = parseInt(rawH, 10) || 0
        const rotRaw =
          videoStream.tags?.rotate ??
          videoStream.tags?.rotation ??
          videoStream.side_data_list?.find?.((x) => x.rotation !== undefined)?.rotation ??
          null
        if (rotRaw !== undefined && rotRaw !== null && rotRaw !== '') {
          display_rotation = parseInt(rotRaw, 10) || 0
          const absRot = Math.abs(display_rotation)
          if ((absRot === 90 || absRot === 270) && width && height) {
            ;[width, height] = [height, width]
          }
        }
      }

      // ---------- 解析时长 ----------
      let duration = parseFloat(fmt.duration) || 0
      if (!duration && videoStream?.duration) {
        duration = parseFloat(videoStream.duration) || 0
      }

      // ---------- 解析帧率 fps ----------
      // ffprobe 字段形如 "30000/1001" / "30/1" / "29.97"，
      // 计算结果保留 2 位小数；解析失败返回 0
      function parseFps(rateStr) {
        if (!rateStr || typeof rateStr !== 'string') return 0
        const s = rateStr.trim()
        if (s.includes('/')) {
          const [num, den] = s.split('/').map((v) => parseFloat(v))
          if (!isFinite(num) || !isFinite(den) || den === 0) return 0
          const v = num / den
          return Math.round(v * 100) / 100
        }
        const v = parseFloat(s)
        if (!isFinite(v)) return 0
        return Math.round(v * 100) / 100
      }
      let fps = 0
      if (videoStream) {
        fps = parseFps(videoStream.avg_frame_rate) || parseFps(videoStream.r_frame_rate) || 0
      }

      // ---------- 码率 bitrate（bps）----------
      // 优先取视频流的 bit_rate，回退到 format.bit_rate（容器级）
      let bitrate = 0
      if (videoStream?.bit_rate) {
        bitrate = parseInt(videoStream.bit_rate, 10) || 0
      }
      if (!bitrate) {
        bitrate = parseInt(fmt.bit_rate, 10) || 0
      }

      // ---------- 返回（与 JSDoc + renderer 现有调用方保持一致）----------
      // 字段命名以用户期望为准（camelCase + 短字段名），同时保留旧别名向下兼容
      //
      // 守卫：如果文件不是视频（无视频流），返回 success:false，
      // 避免下游把 width/height/fps=0 当作有效数据。
      if (!videoStream) {
        const codecTypes = streams.map((s) => s.codec_type || 'unknown').join(',')
        logger.warn('[video:get-info] no video stream in %s (codec_types=%s)', absPath, codecTypes)
        return {
          success: false,
          error: `该文件不包含视频流（codec_types=${codecTypes}）`,
          data: {
            path: absPath,
            duration,
            bitrate,
            width: 0,
            height: 0,
            fps: 0,
            display_rotation: null
          }
        }
      }

      // 主字段（与 renderer 期望一致）
      const out = {
        success: true,
        data: {
          // 主字段（与 renderer 期望一致）
          path: absPath,
          bitrate,
          display_rotation: width > height ? 1 : 0,
          duration,
          fps,
          height,
          width
        }
      }
      logger.info('[video:get-info] parsed: %j', {
        width,
        height,
        fps,
        duration,
        bitrate,
        display_rotation,
        videoStream: !!videoStream,
        streamCount: streams.length
      })
      return out
    } catch (e) {
      logger.error('[video:get-info] failed:', e)
      return { success: false, error: e.message || '获取视频信息失败' }
    }
  })

  // ------------------------------------------------------------
  // 视频封面嵌入（video:embed-cover）
  // ------------------------------------------------------------
  //
  //
  // @param videoPath 视频文件路径 必填
  // @param coverPath 封面文件路径 必填
  // @param outputPath 输出文件路径 必填
  //
  ipcMain.handle('video:embed-cover', async (_, params) => {
    logger.info('[video:embed-cover]', params)

    const { videoPath, coverPath, outputPath } = params

    // 参数校验
    if (!videoPath || !coverPath || !outputPath) {
      return { success: false, error: 'videoPath / coverPath / outputPath 均为必填' }
    }
    if (!fs.existsSync(videoPath)) {
      return { success: false, error: `视频文件不存在: ${videoPath}` }
    }
    if (!fs.existsSync(coverPath)) {
      return { success: false, error: `封面文件不存在: ${coverPath}` }
    }

    const ffmpegPath = getFFmpegBin('ffmpeg')
    if (!ffmpegPath) {
      return { success: false, error: '未找到 ffmpeg.exe。请将 ffmpeg.exe 放在 ./ffmpeg/bin/ 下' }
    }
    const ffprobePath = getFFmpegBin('ffprobe')

    // 封面显示时长（秒），默认 1s（约 30 帧 @30fps），足够作为首帧
    const coverDuration = 1

    // 先用 ffprobe 拿到原视频的精确宽高（编码尺寸，忽略 rotation tag）。
    //   目的：避免 scale2ref 在某些视频上把 [v0] 推断成 0x0，导致 concat 失败。
    //   ffprobe 调用通过 spawn 数组参数直传，Windows 下的通配符（? *）不会被 cmd 展开。
    let srcW = 0
    let srcH = 0
    const probeReason = []
    if (ffprobePath) {
      try {
        const { stdout } = await runCmd(ffprobePath, [
          '-v',
          'error',
          '-select_streams',
          'v:0',
          '-show_entries',
          'stream=width,height',
          '-of',
          'csv=p=0:s=x',
          videoPath
        ])
        // 形如 "1074x1920"，严格匹配第一对
        const m = String(stdout || '')
          .trim()
          .match(/^(\d+)\s*x\s*(\d+)/i)
        if (m) {
          srcW = parseInt(m[1], 10) || 0
          srcH = parseInt(m[2], 10) || 0
          logger.info(
            '[video:embed-cover] ffprobe size: stdout=%j w=%d h=%d',
            String(stdout || '').trim(),
            srcW,
            srcH
          )
        } else {
          probeReason.push(`ffprobe stdout 无法解析: ${String(stdout || '').slice(0, 200)}`)
        }
      } catch (e) {
        probeReason.push(`ffprobe 调用失败: ${e.message}`)
        logger.warn('[video:embed-cover] ffprobe failed: %s', e.message)
      }
    } else {
      probeReason.push('ffprobe 未找到')
    }
    if (!srcW || !srcH) {
      logger.error('[video:embed-cover] 无法探测尺寸 reason=%s', probeReason.join(' | '))
      return {
        success: false,
        error: `无法探测原视频尺寸（${probeReason.join(' | ')}），嵌入封面失败`
      }
    }

    // libx264 要求偶数尺寸
    srcW = srcW % 2 === 0 ? srcW : srcW + 1
    srcH = srcH % 2 === 0 ? srcH : srcH + 1

    // 方案：分两步合成，完全规避 filter_complex 的尺寸协商坑。
    //   step1: 封面图合成 0.1s 的 mp4（尺寸固定为 srcW×srcH，含静音轨道，编码参数与目标一致）
    //   step2: ffmpeg concat demuxer 把封面 mp4 和原视频 mp4 首尾拼接到 outputPath
    //   concat demuxer 不要求两段 mp4 帧级别参数一致，只需 stream 数和编码参数相同。
    const tmpCoverMp4 = join(path.dirname(outputPath), `.embed_cover_tmp_${Date.now()}.mp4`)
    ensureDir(path.dirname(outputPath))

    const args1 = [
      '-y',
      '-loop',
      '1',
      '-t',
      `${coverDuration}`,
      '-i',
      coverPath,
      '-f',
      'lavfi',
      '-t',
      `${coverDuration}`,
      '-i',
      `anullsrc=channel_layout=stereo:sample_rate=48000`,
      '-vf',
      `scale=${srcW}:${srcH}:force_original_aspect_ratio=decrease,pad=${srcW}:${srcH}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p`,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-shortest',
      tmpCoverMp4
    ]

    logger.info(`[video:embed-cover] step1 ffmpeg ${args1.join(' ')}`)

    const step1Err = await new Promise((resolve) => {
      const child = spawn(ffmpegPath, args1, { windowsHide: true })
      let stderr = ''
      child.stderr?.on('data', (d) => (stderr += d.toString()))
      child.on('error', (e) => resolve(`spawn error: ${e.message}`))
      child.on('close', (code) =>
        code === 0 ? resolve(null) : resolve(`exit ${code}: ${stderr.slice(-1500)}`)
      )
    })
    if (step1Err) {
      logger.error(`[video:embed-cover] step1 failed: ${step1Err}`)
      try {
        fs.unlinkSync(tmpCoverMp4)
      } catch {}
      return { success: false, error: `嵌入封面失败(step1 合成封面): ${step1Err}` }
    }
    if (!fs.existsSync(tmpCoverMp4)) {
      return { success: false, error: '嵌入封面失败(step1 未生成临时封面 mp4)' }
    }

    // concat demuxer 列表文件
    const listFile = tmpCoverMp4 + '.list.txt'
    // 注意：用 POSIX 路径分隔符 + 转义单引号；Windows 下 ffmpeg 也支持 forward slash
    const escape = (p) => String(p).replace(/'/g, "'\\''")
    const listContent = `file '${escape(tmpCoverMp4)}'\nfile '${escape(videoPath)}'\n`
    // 关键：写无 BOM 的 utf-8（fs.writeFileSync('utf-8') 会带 BOM，
    // ffmpeg concat demuxer 不认 BOM，会报 "unknown keyword"）
    fs.writeFileSync(listFile, Buffer.from(listContent, 'utf-8'))

    const args2 = [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listFile,
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      outputPath
    ]

    logger.info(`[video:embed-cover] step2 ffmpeg ${args2.join(' ')}`)

    // 自定义 spawn：捕获完整 stderr（便于定位错误）
    const ffmpegError = await new Promise((resolve) => {
      const child = spawn(ffmpegPath, args2, { windowsHide: true })
      let stderr = ''
      child.stderr?.on('data', (d) => {
        stderr += d.toString()
      })
      child.on('error', (e) => resolve(`spawn error: ${e.message}`))
      child.on('close', (code) => {
        if (code === 0) resolve(null)
        else resolve(`exit ${code}: ${stderr.slice(-1500)}`)
      })
    })

    // 不论成功失败，先清理临时文件
    try {
      fs.unlinkSync(tmpCoverMp4)
      fs.unlinkSync(listFile)
    } catch {}

    if (ffmpegError) {
      logger.error(`[video:embed-cover] ffmpeg failed: ${ffmpegError}`)
      return { success: false, error: `嵌入封面失败: ${ffmpegError}` }
    }

    if (!fs.existsSync(outputPath)) {
      return { success: false, error: '嵌入封面完成但未生成输出文件' }
    }

    const stat = fs.statSync(outputPath)
    logger.info(`[video:embed-cover] done: ${outputPath} (${stat.size} bytes)`)
    return {
      success: true,
      data: {
        videoPath,
        coverPath,
        outputPath,
        fileSize: stat.size
      }
    }
  })
}
