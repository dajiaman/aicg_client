<template>
  <div class="space-y-4">
    <section class="card space-y-3">
      <h2 class="font-semibold">🧠 LLM 文案</h2>

      <a-form layout="vertical">
        <!-- 服务提供商 -->
        <a-form-item label="服务提供商">
          <a-select v-model:value="ai.provider" :options="providerOptions" @change="onProviderChange" />
        </a-form-item>

        <!-- API Key -->
        <a-form-item label="API Key">
          <a-input-password v-model:value="ai.apiKey" :visibility-toggle="true" placeholder="填入 API Key">
            <template #suffix v-if="apiKeyUrl">
              <a-tooltip title="在新窗口打开">
                <a :href="apiKeyUrl" target="_blank" rel="noopener noreferrer" class="api-key-link"
                  title="前往获取 API Key">
                  <span class="link-icon">🔗</span>
                  <span class="link-text">获取 Key</span>
                </a>
              </a-tooltip>
            </template>
          </a-input-password>
          <div v-if="apiKeyUrl" class="api-key-tip">
            <span class="tip-icon">💡</span>
            <span>
              没有 API Key？
              <a :href="apiKeyUrl" target="_blank" rel="noopener noreferrer" class="link-inline">
                点击前往 {{ providerLabel }} 控制台获取 →
              </a>
            </span>
          </div>
        </a-form-item>

        <!-- Base URL / 模型 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a-form-item label="Base URL">
            <a-input v-model:value="ai.baseURL" placeholder="https://api.example.com/v1" />
          </a-form-item>

          <a-form-item label="模型">
            <a-input v-if="ai.provider === 'custom'" v-model:value="ai.model" placeholder="模型名" />
            <a-select v-else v-model:value="ai.model" :options="modelOptions.map((m) => ({ value: m, label: m }))"
              show-search />
          </a-form-item>

          <!-- 视觉模型 -->
          <a-form-item label="视觉模型">
            <a-input v-if="ai.provider === 'custom'" v-model:value="ai.visionModel" placeholder="自定义视觉模型名，如 gpt-4o" />
            <a-select v-else-if="visionModelOptions.length > 0" v-model:value="ai.visionModel"
              :options="visionModelOptions.map((m) => ({ value: m, label: m }))" show-search allow-clear
              placeholder="选择视觉模型（用于图片理解）" />
            <a-input v-else v-model:value="ai.visionModel" placeholder="当前服务商暂无预设视觉模型，可手动填写" />
          </a-form-item>
        </div>

        <!-- temperature / maxTokens / enableStream -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a-form-item :label="`temperature ${Number(ai.temperature ?? 0.7).toFixed(1)}`">
            <a-slider v-model:value="ai.temperature" :min="0" :max="2" :step="0.1"
              :tooltip-formatter="(v) => Number(v).toFixed(1)" />
          </a-form-item>

          <a-form-item label="最大 Tokens">
            <a-input-number v-model:value="ai.maxTokens" :min="1" :max="32000" :step="100" class="w-full" />
          </a-form-item>

          <a-form-item label="是否流式输出">
            <a-switch v-model:checked="ai.enableStream" checked-children="开" un-checked-children="关" />
            <span class="ml-2 text-sm text-gray-300">
              {{ ai.enableStream ? '已开启' : '已关闭' }}
            </span>
          </a-form-item>
        </div>
      </a-form>

      <!-- 操作区 -->
      <div class="flex items-center gap-2 flex-wrap pt-2 border-t border-white/10">
        <a-button type="primary" @click="saveLLM">保存</a-button>
        <a-button @click="test">
          <template #icon><span>🔌</span></template>
          测试连接
        </a-button>
        <a-button @click="reset">重置</a-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* antd 表单 label 颜色与暗色调对齐 */
:deep(.ant-form-item-label > label) {
  color: #d1d5db;
}

/* 让 a-input-number 占满行宽 */
:deep(.ant-input-number) {
  width: 100%;
}

/* API Key 链接样式 */
.api-key-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: #c4b5fd;
  background: rgba(217, 70, 239, 0.1);
  text-decoration: none;
  transition: all 0.18s ease;
  cursor: pointer;
}

.api-key-link:hover {
  background: rgba(217, 70, 239, 0.25);
  color: #f0abfc;
  transform: translateY(-1px);
}

.api-key-link .link-icon {
  font-size: 12px;
}

.api-key-link .link-text {
  font-weight: 500;
}

.api-key-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: #a1a1aa;
  line-height: 1.6;
}

.api-key-tip .tip-icon {
  font-size: 13px;
}

.api-key-tip .link-inline {
  color: #d946ef;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.18s ease;
}

.api-key-tip .link-inline:hover {
  color: #f0abfc;
  text-decoration: underline;
}
</style>

<script setup>
import { message } from 'ant-design-vue'
import { onMounted, reactive, computed, ref } from 'vue'
import { PROVIDER_PRESETS } from '../../../constants'

const apiKeyUrl = computed(() => PROVIDER_PRESETS[ai.provider]?.apiKeyUrl || '')

const ai = reactive({
  provider: 'volcengine',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  model: 'doubao-seed-2-0-lite-260428',
  apiKey: '',
  temperature: 0.7,
  maxTokens: 4000,
  visionModel: '',
  enableStream: true
})

const getAiConfig = async () => {
  try {
    const configRes = await window.api.config.getCategory('ai')
    console.log(configRes)
    if (!configRes || !configRes.success || !configRes.data) return
    const data = configRes.data
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && ai[k] !== undefined) {
        // enableStream 必须是 boolean，防止后端写回字符串 'true' / 'false'
        if (k === 'enableStream') {
          ai[k] = v === true || String(v).toLowerCase() === 'true'
        } else if (k === 'temperature' || k === 'maxTokens' || k === 'fps') {
          // 数值型字段：后端可能存成字符串，转回 number
          const n = Number(v)
          ai[k] = Number.isNaN(n) ? ai[k] : n
        } else {
          ai[k] = v
        }
      }
    }
  } catch (e) {
    console.warn('[ai config] 加载失败：', e)
  }
}

onMounted(() => {
  getAiConfig()
})

async function test() {
  const start = Date.now()
  try {
    if (!ai.apiKey) throw new Error('请先填写 API Key')
    if (!ai.baseURL) throw new Error('请先填写 Base URL')
    const base = String(ai.baseURL).replace(/\/+$/, '')

    message.loading('测试连接中...')

    const resp = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ai.apiKey}`
      },
      body: JSON.stringify({
        model: ai.model,
        messages: [{ role: 'user', content: 'hello' }],
        max_tokens: 1,
        stream: false
      })
    })
    const elapsed = Date.now() - start
    if (resp.ok) {
      message.success(`✓ 连接正常 · ${elapsed}ms`)
    } else {
      let detail = ''
      try {
        const data = await resp.json()
        detail = data?.error?.message || data?.message || ''
      } catch {
        /* ignore */
      }
      message.error(`✕ ${resp.status} ${detail || resp.statusText}`)
    }
  } catch (e) {
    message.error(e.message)
  }
}

/**
 * 保存 LLM 模型配置
 */
async function saveLLM() {
  try {
    const res = await window.api.config.updateCategory('ai', {
      provider: ai.provider,
      baseURL: ai.baseURL || '',
      apiKey: ai.apiKey || '',
      model: ai.model || '',
      visionModel: ai.visionModel || '',
      fps: Number(ai.fps ?? 2),
      temperature: Number(ai.temperature ?? 0.7),
      maxTokens: Number(ai.maxTokens ?? 4000),
      enableStream: !!ai.enableStream
    })
    console.log(res)
    if (!res || !res.success) throw new Error('保存失败')
    message.success('LLM 模型配置已保存')
    setTimeout(() => {
      getAiConfig()
    }, 1000)
  } catch (e) {
    console.error(e)
    message.error(e.message)
  }
}

const providerOptions = Object.entries(PROVIDER_PRESETS).map(([value, cfg]) => ({
  value,
  label: cfg.label
}))

/**
 * 当前 provider 的模型列表
 * - 优先取 PROVIDER_PRESETS[provider].models
 */
const modelOptions = computed(() => {
  const list = PROVIDER_PRESETS[ai.provider]?.models || []
  // 当前已选模型不在预设列表中时，也补进去（兼容自定义 / 历史值）
  if (ai.model && !list.includes(ai.model)) return [ai.model, ...list]
  return list
})

/**
 * 当前 provider 的视觉模型列表
 * - 优先取 PROVIDER_PRESETS[provider].visionModels
 * - 若当前 visionModel 不在列表中（如切换 provider），保留当前值以便显示
 */
const visionModelOptions = computed(() => {
  const list = PROVIDER_PRESETS[ai.provider]?.visionModels || []
  if (ai.visionModel && !list.includes(ai.visionModel)) return [ai.visionModel, ...list]
  return list
})

function onProviderChange() {
  const preset = PROVIDER_PRESETS[ai.provider]
  if (!preset || ai.provider === 'custom') return
  ai.baseURL = preset.baseURL
  ai.model = preset.model
  // 切换 provider 时，若旧 visionModel 不在新预设中则重置
  const visionList = preset.visionModels || []
  if (ai.visionModel && !visionList.includes(ai.visionModel)) {
    ai.visionModel = visionList[0] || ''
  } else if (!ai.visionModel && visionList.length > 0) {
    ai.visionModel = visionList[0]
  }
}

/**
 * 重置 LLM 模型配置
 */
async function reset() {
  try {
    await window.api.config.updateCategory('ai', {
      provider: 'deepseek',
      baseURL: ai.baseURL || '',
      apiKey: ai.apiKey || '',
      model: ai.model || '',
      visionModel: ai.visionModel || '',
      fps: Number(ai.fps ?? 2),
      temperature: Number(ai.temperature ?? 0.7),
      maxTokens: Number(ai.maxTokens ?? 4000),
      enableStream: !!ai.enableStream
    })
    message.success('已重置为默认配置')
    getAiConfig()
  } catch (e) {
    console.error(e)
    message.error(e.message)
  }
}
</script>
