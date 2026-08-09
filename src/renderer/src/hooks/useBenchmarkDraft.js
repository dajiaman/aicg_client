// 默认草稿
const DEFAULT_DRAFT = {
  activeTab: 'extract',
  ipBrainForm: { url: '', deepLearning: true },
  topicForm: { keyword: '', persona: undefined, customPersona: '', targetAudience: '' },
  freeCreationForm: {
    productName: '',
    sellingPoints: '',
    targetAudience: '',
    promotions: '',
    persona: ''
  },
  selectedTemplateId: null,
  wordCountType: '300',
  customWordCount: 500,
  topicWordCountType: '300',
  topicCustomWordCount: 200
}

export function normalizeBenchmarkDraft(input = {}) {
  const normalized = input && typeof input === 'object' ? input : {}
  return {
    activeTab: normalized.activeTab ?? DEFAULT_DRAFT.activeTab,
    ipBrainForm: { ...DEFAULT_DRAFT.ipBrainForm, ...(normalized.ipBrainForm || {}) },
    topicForm: { ...DEFAULT_DRAFT.topicForm, ...(normalized.topicForm || {}) },
    freeCreationForm: { ...DEFAULT_DRAFT.freeCreationForm, ...(normalized.freeCreationForm || {}) },
    selectedTemplateId:
      normalized.selectedTemplateId !== undefined
        ? normalized.selectedTemplateId
        : DEFAULT_DRAFT.selectedTemplateId,
    wordCountType: normalized.wordCountType ?? DEFAULT_DRAFT.wordCountType,
    customWordCount: normalized.customWordCount ?? DEFAULT_DRAFT.customWordCount,
    topicWordCountType: normalized.topicWordCountType ?? DEFAULT_DRAFT.topicWordCountType,
    topicCustomWordCount: normalized.topicCustomWordCount ?? DEFAULT_DRAFT.topicCustomWordCount
  }
}

export function createBenchmarkDraftSnapshot(input) {
  return normalizeBenchmarkDraft({
    activeTab: input.activeTab,
    ipBrainForm: input.ipBrainForm ? { ...input.ipBrainForm } : undefined,
    topicForm: input.topicForm ? { ...input.topicForm } : undefined,
    freeCreationForm: input.freeCreationForm ? { ...input.freeCreationForm } : undefined,
    selectedTemplateId: input.selectedTemplateId,
    wordCountType: input.wordCountType,
    customWordCount: input.customWordCount,
    topicWordCountType: input.topicWordCountType,
    topicCustomWordCount: input.topicCustomWordCount
  })
}

/**
 * 重置为新任务状态
 * 保留用户自定义的人设（customPersona），其他字段恢复默认值
 *
 * @param input - 当前 Draft 数据（用于提取自定义人设）
 * @returns 重置后的 BenchmarkDraft
 */
export function resetBenchmarkDraftForNewTask(input = {}) {
  const current = normalizeBenchmarkDraft(input)
  return normalizeBenchmarkDraft({
    topicForm: { customPersona: current.topicForm?.customPersona || '' }
  })
}
