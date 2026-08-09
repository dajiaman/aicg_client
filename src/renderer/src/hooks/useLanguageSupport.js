import { computed } from "vue"

export function useLanguageSupport() {
  /**
   * 语言选项列表
   * 用于翻译目标语言选择
   */
  const languageOptions = [
    { label: '中文', value: 'zh' },
    { label: '粤语', value: 'yue' },
    { label: '英语', value: 'en' },
    { label: '日语', value: 'ja' },
    { label: '韩语', value: 'ko' },
    { label: '法语', value: 'fr' },
    { label: '西班牙语', value: 'es' },
    { label: '葡萄牙语', value: 'pt' },
    { label: '意大利语', value: 'it' },
    { label: '荷兰语', value: 'nl' },
    { label: '德语', value: 'de' },
    { label: '芬兰语', value: 'fi' },
    { label: '波兰语', value: 'pl' },
    { label: '瑞典语', value: 'sv' },
    { label: '丹麦语', value: 'da' },
    { label: '挪威语', value: 'no' },
    { label: '俄语', value: 'ru' },
    { label: '希腊语', value: 'el' },
    { label: '阿拉伯语', value: 'ar' },
    { label: '希伯来语', value: 'he' },
    { label: '印地语', value: 'hi' },
    { label: '印尼语', value: 'id' },
    { label: '马来语', value: 'ms' },
    { label: '越南语', value: 'vi' },
    { label: '土耳其语', value: 'tr' },
    { label: '泰语', value: 'th' },
    { label: '缅甸语', value: 'my' },
    { label: '高棉语', value: 'km' },
    { label: '老挝语', value: 'lo' },
    { label: '斯瓦希里语', value: 'sw' },
    { label: '他加禄语', value: 'tl' }
  ]

  /**
   * 方言列表（需要快速模型 V2）
   * 这些语言在经典模型（V1）中不支持，必须使用 V2
   */
  const dialectCodes = new Set([
    'yue', // 粤语
    'wuu', // 吴语
    'hak', // 客家话
    'nan', // 闽南语
    'cmn' // 普通话（但普通话一般不算方言，不过这里可能为了统一处理）
  ])

  /**
   * 判断目标语言是否为方言
   * @param {string} languageCode - 语言代码（如 'yue', 'zh' 等）
   * @returns {boolean}
   */
  const isDialect = (languageCode) => {
    return dialectCodes.has(languageCode)
  }

  /**
   * 判断目标语言是否需要使用快速模型（V2）
   * 规则：如果是方言，或者语言不在经典模型支持列表中，则需要 V2
   * @param {string} languageCode
   * @returns {boolean}
   */
  const requiresFastModel = (languageCode) => {
    // 经典模型（V1）支持的语言：中英文
    const classicSupported = new Set(['zh', 'en'])
    if (classicSupported.has(languageCode)) {
      return false
    }
    // 方言或其他语言需要使用 V2
    return true
  }

  /**
   * 获取语言选项列表（用于 a-select）
   * 格式：[{ label: '中文', value: 'zh' }, ...]
   */
  const voiceTranslationLanguageOptions = computed(() => {
    return languageOptions.map((opt) => ({
      label: opt.label,
      value: opt.value
    }))
  })

  /**
   * 基于当前语言（需外部提供）判断是否为方言
   * 这里设计为接受一个 language 参数，由调用方传入
   */
  const selectedVoiceTargetIsDialect = (languageCode) => {
    return isDialect(languageCode)
  }

  /**
   * 基于当前语言判断是否需要快速模型
   */
  const selectedVoiceTargetRequiresFastModel = (languageCode) => {
    return requiresFastModel(languageCode)
  }

  /**
   * 获取语言对应的字数限制
   * 不同语言可能有不同的字符数限制
   */
  const getCharLimit = (languageCode) => {
    const limits = {
      zh: 1500,
      en: 4200,
      ja: 1800,
      ko: 1800,
      fr: 4500,
      es: 4500,
      pt: 4500,
      it: 4500,
      nl: 4500,
      de: 4800,
      fi: 4800,
      pl: 4800,
      sv: 4800,
      da: 4800,
      no: 4800,
      ru: 4000,
      el: 4000,
      ar: 4000,
      he: 4000,
      hi: 3500,
      id: 3500,
      ms: 3500,
      vi: 3500,
      tr: 3500,
      th: 3500,
      my: 3500,
      km: 3500,
      lo: 3500,
      sw: 3500,
      tl: 3500
    }
    return limits[languageCode] || 3500
  }

  // 返回所有功能
  return {
    voiceTranslationLanguageOptions,
    selectedVoiceTargetIsDialect,
    selectedVoiceTargetRequiresFastModel,
    isDialect,
    requiresFastModel,
    getCharLimit,
    languageOptions
  }
}
