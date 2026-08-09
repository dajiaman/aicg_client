<template>
  <div class="space-y-6 general-tab">
    <div class="space-y-3">
      <div class="font-semibold">运行模式</div>
      <div class="flex items-center gap-6 text-sm">
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="general.runMode" type="radio" value="local" />
          <span>本地</span>
        </label>
        <!-- <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="general.runMode" type="radio" value="cloud" />
          <span>云端</span>
        </label> -->
      </div>
      <p class="text-xs text-gray-400">选择服务运行模式：本地优先使用本机能力，云端调用远程API</p>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <div class="font-semibold">声音合成高性能模式</div>
        </div>
        <label class="inline-flex items-center cursor-pointer">
          <input v-model="voiceClone.highPerformance" type="checkbox" class="sr-only peer" @change="toggleHighPerf" />
          <div
            class="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-fuchsia-500 peer-checked:to-purple-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 relative">
          </div>
        </label>
      </div>
      <p class="text-xs text-gray-400">
        开启后将启动常驻服务，大幅提升声音合成响应速度，但会占用更多显存
        8G以下显存不要开启，否则会很卡。
      </p>
      <p v-if="voiceClone.highPerformance" class="text-xs text-amber-400">
        {{ running ? '服务运行中' : '服务未运行（点击开关启动）' }}
      </p>
    </div>

    <div class="space-y-3">
      <div class="font-semibold">统一输出根目录</div>
      <div class="flex gap-2">
        <a-input v-model:value="paths.baseOutput" disabled class="input flex-1 font-mono text-sm"
          placeholder="选择统一输出根目录" autocorrect="false" autocomplete="off" spellcheck="false" />
        <button class="btn-ghost whitespace-nowrap" @click="pickOutputDir">选择</button>
      </div>
      <p class="text-xs text-gray-400">
        只需选择一个根目录，系统将自动在该目录下生成 audios / videos / drafts / exports / thumbs
        子目录
      </p>
    </div>

    <div class="space-y-3">
      <div>
        <div class="font-semibold">音频输出路径</div>
        <div class="mt-2">
          <a-input v-model:value="paths.audioOutput" disabled class="input font-mono text-sm"
            placeholder="由根目录自动派生：audios" />
          <p class="text-xs text-gray-500 mt-1">
            留空则跟随统一根目录自动派生为 audios，可手动覆盖
          </p>
        </div>
      </div>
      <div>
        <div class="font-semibold">视频输出路径</div>
        <div class="mt-2">
          <a-input v-model:value="paths.videoOutput" disabled class="input font-mono text-sm"
            placeholder="由根目录自动派生：videos" />
          <p class="text-xs text-gray-500 mt-1">
            留空则跟随统一根目录自动派生为 videos，可手动覆盖
          </p>
        </div>
      </div>
      <div>
        <div class="font-semibold">草稿输出路径</div>
        <div class="mt-2">
          <a-input v-model:value="paths.draftOutput" disabled class="input font-mono text-sm"
            placeholder="由根目录自动派生：drafts" />
          <p class="text-xs text-gray-500 mt-1">
            留空则跟随统一根目录自动派生为 drafts，可手动覆盖
          </p>
        </div>
      </div>
      <div>
        <div class="font-semibold">导出输出路径</div>
        <div class="mt-2">
          <a-input v-model:value="paths.exportOutput" disabled class="input font-mono text-sm"
            placeholder="由根目录自动派生：exports" />
          <p class="text-xs text-gray-500 mt-1">
            留空则跟随统一根目录自动派生为 exports，可手动覆盖
          </p>
        </div>
      </div>
      <div>
        <div class="font-semibold">封面输出路径</div>
        <div class="mt-2">
          <a-input v-model:value="paths.thumbs" disabled class="input font-mono text-sm"
            placeholder="由根目录自动派生：thumbs" />
          <p class="text-xs text-gray-500 mt-1">
            留空则跟随统一根目录自动派生为 thumbs（素材视频封面存放目录），可手动覆盖
          </p>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <a-button class="btn-primary" @click="save">保存设置</a-button>
    </div>
  </div>
</template>

<script setup>
import { message } from 'ant-design-vue'
import { onMounted, reactive, ref } from 'vue'

const general = reactive({})
const paths = reactive({})
const voiceClone = reactive({})

const running = ref(false)

function fill(target, src) {
  Object.keys(target).forEach((k) => delete target[k])
  Object.assign(target, src || {})
}

function fillStripped(target, group) {
  const stripped = {}
  for (const [k, v] of Object.entries(group || {})) {
    stripped[k.includes('.') ? k.split('.').slice(1).join('.') : k] = v
  }
  fill(target, stripped)
}

/**
 * 切换高性能模式
 */
function toggleHighPerf() {
  if (!voiceClone.highPerformance) {
    voiceClone.highPerformance = false
    running.value = false
    return
  }
  running.value = true
}

/**
 * 选择统一输出根目录
 */
async function pickOutputDir() {
  try {
    const res = await window.api.file.selectDirectory('选择统一输出根目录')
    if (res.success && res.data.canceled === false) {
      paths.baseOutput = res.data.filePaths[0]
      paths.audioOutput = `${paths.baseOutput}/audios`
      paths.videoOutput = `${paths.baseOutput}/videos`
      paths.draftOutput = `${paths.baseOutput}/drafts`
      paths.exportOutput = `${paths.baseOutput}/exports`
      paths.thumbs = `${paths.baseOutput}/thumbs`
    }
  } catch (e) {
    console.error(e)
    message.error(e.message)
  }
}


/**
 * 获取配置
 */
const getConfig = async () => {
  const configRes = await window.api.config.getAll()
  const allConfig = configRes.success ? configRes.data : {}
  fillStripped(general, allConfig.general)
  fillStripped(paths, allConfig.paths)
  fillStripped(voiceClone, allConfig.voiceClone)
}

/**
 * 保存设置
 */
const save = async () => {
  try {
    await window.api.config.updateCategory('general', {
      runMode: general.runMode || 'local'
    })
    await window.api.config.updateCategory('paths', {
      baseOutput: paths.baseOutput,
      audioOutput: paths.audioOutput,
      videoOutput: paths.videoOutput,
      draftOutput: paths.draftOutput,
      exportOutput: paths.exportOutput,
      thumbs: paths.thumbs
    })
    message.success('设置已保存')
    getConfig()
  } catch (e) {
    message.error(e.message)
  }
}

onMounted(() => {
  getConfig()
})
</script>

<style scoped>
.general-tab {
  input {
    color: #fff;
  }
}
</style>
