<template>
  <div class="prompt-editor" :class="{ 'is-readonly': readonly, 'is-edit': !readonly }">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <span class="editor-label">
          <FileTextOutlined /> {{ label }}
        </span>
        <span class="stat">
          {{ stats.chars }} 字符 · {{ stats.lines }} 行
        </span>
      </div>

      <div class="toolbar-right">
        <button class="toolbar-btn" type="button" @click="copyText" :disabled="!model">
          <CopyOutlined /> 复制
        </button>
      </div>
    </div>



    <!-- 输入：左编辑 + 右预览 -->
    <div class="editor-body ">
      <div class="editor-pane w-full">
        <textarea ref="textareaRef" v-model="model" class="editor-textarea" :placeholder="placeholder"
          :maxlength="maxlength" spellcheck="false" :readonly="readonly" />
      </div>

    </div>
  </div>
</template>

<script setup>
import {
  CopyOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '请输入内容...' },
  maxlength: { type: Number, default: 10000 },
  readonly: { type: Boolean, default: false },
  label: { type: String, default: '内容' }
})
const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const textareaRef = ref(null)

const stats = computed(() => {
  const v = model.value || ''
  return {
    chars: v.length,
    lines: v ? v.split('\n').length : 1
  }
})

/* ========== 转义：XSS 防护 ========== */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/* ========== 自实现的简易 markdown 渲染 ========== */
// /* 支持：# 一级..六级标题、**bold**/*italic*/`code`、
//  - 无序列表、1. 有序列表、> 引用、``` 代码块、--- 分隔线、链接、[ ] 勾选 */
const renderedHtml = computed(() => {
  try {
    return renderMarkdown(model.value || '')
  } catch (e) {
    console.error('[PromptEditor] renderMarkdown failed:', e)
    return ''
  }
})

function renderMarkdown(src) {
  // 拆分为代码块和段落，先把 ```..``` 提取出来，最后回填
  const codeBlocks = []
  src = String(src).replace(/```([\s\S]*?)```/g, (m, code) => {
    const idx = codeBlocks.length
    codeBlocks.push(code)
    return `@@CODEBLOCK_${idx}@@`
  })

  // 行级处理
  const lines = src.split(/\r?\n/)
  const out = []
  let inUL = false
  let inOL = false
  let inBlockquote = false

  const closeLists = () => {
    if (inUL) {
      out.push('</ul>')
      inUL = false
    }
    if (inOL) {
      out.push('</ol>')
      inOL = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (line == null) continue

    // 占位代码块回填
    const codeMatch = line.match(/^@@CODEBLOCK_(\d+)@@$/)
    if (codeMatch) {
      closeLists()
      if (inBlockquote) {
        out.push('</blockquote>')
        inBlockquote = false
      }
      const code = codeBlocks[Number(codeMatch[1])]
      out.push(`<pre class="md-pre"><code>${escapeHtml(code)}</code></pre>`)
      continue
    }

    // 分隔线
    if (/^-{3,}\s*$|^\*{3,}\s*$/.test(line)) {
      closeLists()
      out.push('<hr class="md-hr" />')
      continue
    }

    // 标题
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      closeLists()
      if (inBlockquote) {
        out.push('</blockquote>')
        inBlockquote = false
      }
      const level = h[1].length
      out.push(`<h${level} class="md-h md-h${level}">${inline(h[2])}</h${level}>`)
      continue
    }

    // 引用
    if (/^>\s?/.test(line)) {
      closeLists()
      if (!inBlockquote) {
        out.push('<blockquote class="md-quote">')
        inBlockquote = true
      }
      out.push(`<p>${inline(line.replace(/^>\s?/, ''))}</p>`)
      continue
    } else if (inBlockquote) {
      out.push('</blockquote>')
      inBlockquote = false
    }

    // 无序列表
    const ul = line.match(/^[-*+]\s+(.*)$/)
    if (ul) {
      if (inOL) {
        out.push('</ol>')
        inOL = false
      }
      if (!inUL) {
        out.push('<ul class="md-ul">')
        inUL = true
      }
      // 任务列表 [ ] / [x]
      const task = ul[1].match(/^\[( |x|X)\]\s+(.*)$/)
      if (task) {
        const checked = /x/i.test(task[1]) ? 'checked' : ''
        out.push(
          `<li class="md-task"><label><input type="checkbox" disabled ${checked} /> ${inline(task[2])}</label></li>`
        )
      } else {
        out.push(`<li>${inline(ul[1])}</li>`)
      }
      continue
    }

    // 有序列表
    const ol = line.match(/^\d+[.)]\s+(.*)$/)
    if (ol) {
      if (inUL) {
        out.push('</ul>')
        inUL = false
      }
      if (!inOL) {
        out.push('<ol class="md-ol">')
        inOL = true
      }
      out.push(`<li>${inline(ol[1])}</li>`)
      continue
    }

    // 空行：闭合并跳过
    if (line.trim() === '') {
      closeLists()
      continue
    }

    // 普通段落
    closeLists()
    out.push(`<p>${inline(line)}</p>`)
  }

  closeLists()
  if (inBlockquote) out.push('</blockquote>')

  return out.join('')
}

/* ========== 行内元素：bold / italic / code / link ========== */
function inline(text) {
  let s = escapeHtml(text)
  // code
  s = s.replace(/`([^`\n]+)`/g, '<code class="md-code">$1</code>')
  // bold
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
  // italic
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')
  // link
  s = s.replace(
    /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
    '<a class="md-link" href="$2" target="_blank" rel="noopener">$1</a>'
  )
  return s
}

/* ========== 复制 ========== */
async function copyText() {
  const text = model.value || ''
  if (!text) {
    message.warning('内容为空')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      message.success('已复制到剪贴板')
    } catch {
      message.error('复制失败，请手动复制')
    }
  }
}
</script>

<style scoped>
.prompt-editor {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 10, 20, 0.7);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.prompt-editor:focus-within {
  border-color: rgba(217, 70, 239, 0.55);
  box-shadow: 0 0 0 3px rgba(217, 70, 239, 0.12);
}

/* ========== 工具栏 ========== */
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.editor-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #f0abfc;
  font-weight: 500;
}

.stat {
  font-size: 11px;
  color: #6b7280;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  margin-left: 4px;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  background: rgba(217, 70, 239, 0.12);
  color: #f0abfc;
  border: 1px solid rgba(217, 70, 239, 0.25);
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: rgba(217, 70, 239, 0.22);
  border-color: rgba(217, 70, 239, 0.45);
  transform: translateY(-1px);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== 编辑主体：分屏 ========== */
.editor-body {
  display: block;
}

.editor-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
  min-height: 260px;
}

@media (max-width: 900px) {
  .editor-split {
    grid-template-columns: 1fr;
  }
}

.editor-pane {
  background: rgba(10, 10, 20, 0.5);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
}

@media (max-width: 900px) {
  .editor-pane {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
}

.editor-textarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 16px 18px;
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #f3f4f6;
  background: transparent;
  caret-color: #f0abfc;
  min-height: 260px;
  overflow: auto;
}

.editor-textarea::placeholder {
  color: #6b7280;
  font-style: italic;
}

.preview-pane {
  padding: 16px 18px;
  overflow: auto;
  background: rgba(15, 15, 30, 0.4);
  min-height: 260px;
  max-height: 600px;
  color: #e5e7eb;
  font-size: 13px;
  line-height: 1.7;
  text-align: left;
}

.preview-empty {
  color: #6b7280;
  font-style: italic;
  text-align: center;
  margin-top: 80px;
}

/* ========== 只读容器 ========== */
.editor-readonly {
  padding: 16px 18px;
  overflow: auto;
  min-height: 260px;
  max-height: 600px;
  color: #e5e7eb;
  background: rgba(15, 15, 30, 0.4);
  font-size: 13px;
  line-height: 1.7;
  text-align: left;
}
</style>

<!-- 非 scoped 样式：v-html 生成的 markdown 内容无法使用 scoped 样式 -->
<style>
/* ========== Markdown 渲染基础样式 ========== */
.prompt-editor .md-render {
  width: 100%;
  color: #e5e7eb;
  text-align: left;
}

.prompt-editor .md-render>*:first-child {
  margin-top: 0 !important;
}

.prompt-editor .md-render>*:last-child {
  margin-bottom: 0 !important;
}

/* 标题 */
.prompt-editor .md-h {
  font-weight: 600;
  color: #f5d0fe;
  line-height: 1.4;
  margin: 1em 0 0.5em;
}

.prompt-editor .md-h1 {
  font-size: 1.4em;
}

.prompt-editor .md-h2 {
  font-size: 1.25em;
}

.prompt-editor .md-h3 {
  font-size: 1.1em;
}

.prompt-editor .md-h4,
.prompt-editor .md-h5,
.prompt-editor .md-h6 {
  font-size: 1em;
}

/* 段落与列表 */
.prompt-editor .md-render p {
  margin: 0.6em 0;
}

.prompt-editor .md-ul,
.prompt-editor .md-ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.prompt-editor .md-render li {
  margin: 0.25em 0;
}

/* 任务列表 */
.prompt-editor .md-task {
  list-style: none;
  margin-left: -1em;
}

.prompt-editor .md-task label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}

/* 引用 */
.prompt-editor .md-quote {
  margin: 0.6em 0;
  padding: 6px 12px;
  border-left: 3px solid rgba(217, 70, 239, 0.55);
  background: rgba(217, 70, 239, 0.06);
  color: #d1d5db;
}

/* 行内 code */
.prompt-editor .md-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.92em;
  color: #f0abfc;
}

/* 代码块 */
.prompt-editor .md-pre {
  margin: 0.6em 0;
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.prompt-editor .md-pre code {
  background: transparent;
  padding: 0;
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.95em;
}

/* 链接 */
.prompt-editor .md-link {
  color: #f0abfc;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.prompt-editor .md-link:hover {
  color: #f9a8d4;
}

/* 分隔线 */
.prompt-editor .md-hr {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 1em 0;
}

/* strong / em */
.prompt-editor .md-render strong {
  color: #f3f4f6;
}

.prompt-editor .md-render em {
  color: #e5e7eb;
}
</style>
