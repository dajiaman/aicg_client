import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'

/**
 * 权限管理钩子函数
 * 提供用户权限状态的管理、检查和提示功能
 */
export function usePermission() {
  const userInfo = ref(null) // 用户信息对象
  const loading = ref(false) // 加载状态
  const isVipMember = ref(true) // 是否 VIP 会员
  const isAccountActive = ref(true) // 账号是否已激活

  const hasFullPermission = computed(() => {
    return isVipMember.value && isAccountActive.value
  })

  // ----- 加载用户信息 -----
  const loadUserInfo = async () => {
    loading.value = true
    try {
      // 从配置或 API 获取用户信息
      isVipMember.value = true
      isAccountActive.value = true
    } catch (error) {
      console.error('加载用户信息失败:', error)
      userInfo.value = null
      isVipMember.value = false
      isAccountActive.value = false
    } finally {
      loading.value = false
    }
  }

  /**
   * 检查 VIP 权限
   * @param {string} featureName - 功能名称（用于提示）
   * @param {boolean} showMessage - 是否显示提示消息（默认 true）
   * @returns {boolean} 是否有 VIP 权限
   */
  const checkVipPermission = (featureName = '此功能', showMessage = true) => {
    if (isVipMember.value) {
      return true
    }
    if (showMessage) {
      message.warning({
        content: `${featureName}需要VIP会员权限，请先开通会员`,
        duration: 3
      })
      // 跳转到会员中心（可选）
      // 原始代码中使用了 _0x481816['push']('/member-center')
      // 这里我们仅做提示，不自动跳转
    }
    return false
  }

  /**
   * 检查账号是否已激活
   * @param {string} featureName - 功能名称（用于提示）
   * @param {boolean} showMessage - 是否显示提示消息（默认 true）
   * @returns {boolean} 账号是否已激活
   */
  const checkAccountActive = (featureName = '此功能', showMessage = true) => {
    if (isAccountActive.value) {
      return true
    }

    if (showMessage) {
      message.warning({
        content: `${featureName}需要激活账号，请先激活您的账号`,
        duration: 3
      })
      // 可跳转到激活页面
    }
    return false
  }

  /**
   * 检查完整权限（VIP + 账号激活）
   * @param {string} featureName - 功能名称（用于提示）
   * @param {boolean} showMessage - 是否显示提示消息（默认 true）
   * @returns {boolean} 是否有完整权限
   */
  const checkFullPermission = (featureName = '此功能', showMessage = true) => {
    // 先检查 VIP
    if (!checkVipPermission(featureName, showMessage)) {
      return false
    }
    // 再检查账号激活
    if (!checkAccountActive(featureName, showMessage)) {
      return false
    }
    return true
  }

  /**
   * 获取权限提示文本（用于 UI 展示）
   * @param {string} featureName - 功能名称
   * @returns {string} 提示文本
   */
  const getPermissionTip = (featureName = '此功能') => {
    if (!isAccountActive.value) {
      return `${featureName}需要激活账号`
    }
    if (!isVipMember.value) {
      return isAccountActive.value ? `${featureName}需要VIP会员权限` : `${featureName}需要激活账号`
    }
    return ''
  }

  /**
   * 获取权限状态对象
   * @returns {Object} 包含各种权限状态的描述
   */
  const getPermissionStatus = () => {
    return {
      isVip: isVipMember.value,
      isActive: isAccountActive.value,
      hasFullPermission: hasFullPermission.value,
      tip: getPermissionTip()
    }
  }

  return {
    // 状态
    userInfo,
    loading,
    isVipMember,
    isAccountActive,
    hasFullPermission,

    // 方法
    loadUserInfo,
    checkVipPermission,
    checkAccountActive,
    checkFullPermission,
    getPermissionTip,
    getPermissionStatus
  }
}
