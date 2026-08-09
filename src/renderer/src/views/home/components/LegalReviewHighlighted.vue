<template>
  <span class="legal-text-wrap">
    <template v-for="(seg, i) in segments" :key="i">
      <a-tooltip v-if="seg.type === 'risk'" :title="seg.tooltip" placement="top" color="#1f2937">
        <span class="risk-word">{{ seg.text }}</span>
      </a-tooltip>
      <span v-else class="legal-text">{{ seg.text }}</span>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  risks: { type: Array, default: () => [] }
})

/**
 * 计算高亮 segments：
 *   - 普通文本段:{ type: 'text', text }
 *   - 风险词段:{ type: 'risk', text, tooltip }
 */
const segments = computed(() => {
  const text = props.text || ''
  const risks = props.risks || []
  if (!text) return []
  if (!risks.length) {
    return [{ type: 'text', text }]
  }

  // 1) 收集所有匹配
  const matches = []
  for (const r of risks) {
    const word = String(r.word || '').trim()
    if (!word) continue
    let from = 0
    while (from <= text.length) {
      const idx = text.indexOf(word, from)
      if (idx < 0) break
      matches.push({
        start: idx,
        end: idx + word.length,
        word,
        reason: r.reason,
        recommendation: r.recommendation
      })
      from = idx + word.length
    }
  }
  matches.sort((a, b) => a.start - b.start)

  // 2) 切成 segments
  const out = []
  let cursor = 0
  for (const m of matches) {
    if (m.start < cursor) continue // 跳过重叠
    if (m.start > cursor) {
      out.push({ type: 'text', text: text.slice(cursor, m.start) })
    }

    // tooltip：违规原因 + 建议
    const tipParts = []
    if (m.reason) tipParts.push(`违规原因: ${m.reason}`)
    if (m.recommendation) tipParts.push(`建议: ${m.recommendation}`)

    out.push({
      type: 'risk',
      text: text.slice(m.start, m.end),
      tooltip: tipParts.join('\n')
    })
    cursor = m.end
  }
  if (cursor < text.length) {
    out.push({ type: 'text', text: text.slice(cursor) })
  }
  return out
})
</script>

<style scoped>
.legal-text-wrap {
  display: inline;
  white-space: pre-wrap;
  word-break: break-word;
}

.legal-text {
  color: inherit;
}

.risk-word {
  font-weight: 700;
  cursor: help;
  padding: 0 4px;
  border-radius: 4px;
  background-color: rgba(239, 68, 68, 0.18);
  color: #f87171;
  border-bottom: 2px dashed currentColor;
}
</style>
