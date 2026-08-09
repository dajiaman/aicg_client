import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}')
  }),
  getters: {
    token: (state) => state.userInfo?.token || '',
    isLoggedIn: (state) => !!state.userInfo?.token,
    vip_expires_at: (state) => state.userInfo?.user?.vip_expires_at || '',
    displayName: (state) => state.userInfo?.user?.username || state.userInfo?.user?.email || '',
    isVip: (state) => (state.userInfo?.user?.is_vip == 1 ? true : false)
  },
  actions: {
    setUserInfo(user) {
      this.userInfo = user
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
    },
    reset() {
      this.token = ''
      this.userInfo = { username: '', email: '' }
      this.signInfo = {}
      localStorage.removeItem('userInfo')
    },
    /**
     * 设置最后登录邮箱
     * @param {string} email - 最后登录邮箱
     */
    setLastLoginEmail(email) {
      localStorage.setItem('lastLoginEmail', email || '')
    },

    /**
     * 设置自动登录凭证
     * @param {{ email: string, password: string, autoLogin?: boolean }} credentials
     */
    setAutoLoginCredentials(credentials) {
      localStorage.setItem('autoLoginCredentials', JSON.stringify(credentials))
    },

    /**
     * 登录
     * @param {{ email: string, password: string, remember?: boolean }} form
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    async login(form) {
      try {
        const res = await window.api.user.login(form.email.trim(), form.password.trim())
        if (res?.success && res.data) {
          this.setUserInfo(res.data)
          // 自动登录
          if (form.autoLogin) {
            this.setAutoLoginCredentials({
              ...form
            })
          }

          // 通知登录成功
          window.api.user.notifyLoginSuccess()
          return { success: true }
        }
        return { success: false, error: res?.error || '登录失败' }
      } catch (e) {
        return { success: false, error: e?.message || '登录失败' }
      }
    },

    /**
     * 获取用户信息
     */
    async getProfile() {
      const res = await window.api.user.getProfile()
      if (res?.success && res.data) {
        this.setUserInfo({
          ...this.userInfo,
          ...res.data
        })
        return res.data
      }
      return {}
    },

    /**
     * 注册
     * @param {{ username: string, email: string, password: string }} form
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    async register(form) {
      try {
        const res = await window.api.user.register(
          form.username.trim(),
          form.email.trim(),
          form.password.trim()
        )
        if (res?.success) return { success: true }
        return { success: false, error: res?.error || '注册失败' }
      } catch (e) {
        return { success: false, error: e?.message || '注册失败' }
      }
    },

    /**
     * 退出登录
     */
    async logout() {
      console.log('logout')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('autoLoginCredentials')
      this.reset()
      return true
    },

    /**
     * 激活会员
     * @param {string} activeCode - 激活码
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    async active(activeCode) {
      try {
        if (!this.token) return { success: false, error: '未登录' }
        const res = await window.api.user.activate(activeCode.trim(), this.token)
        if (res?.success) return { success: true }
        return { success: false, error: res?.error || '激活失败' }
      } catch (e) {
        return { success: false, error: e?.message || '激活失败' }
      }
    }
  }
})
