import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo:
      localStorage.getItem('userInfo') !== undefined
        ? JSON.parse(localStorage.getItem('userInfo'))
        : {}
  }),
  getters: {
    token: (state) => state.userInfo?.user?.token || '',
    isLoggedIn: (state) => !!state.userInfo?.user?.token,
    vip_expires_at: (state) => state.userInfo?.user?.vip_expires_at || '',
    displayName: (state) => state.userInfo?.user?.username || state.userInfo?.user?.email || '',
    isVip: (state) => (state.userInfo?.user?.is_vip == 1 ? true : false),
    isActive: (state) => (state.userInfo?.user?.is_active == 1 ? true : false)
  },
  actions: {
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },
    reset() {
      this.userInfo = { username: '', email: '' }
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

    saveToken(token) {
      window.api.config.set('auth.token', token || '', 'auth')
    },

    /**
     * 登录
     * @param {{ email: string, password: string, remember?: boolean }} form
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    async login(form) {
      try {
        const res = await window.api.user.login(form.email.trim(), form.password.trim())
        console.log('登录响应:', res)
        if (res?.success && res.data) {
          this.setUserInfo(res.data)
          this.saveToken(res.data.token)
          this.setLastLoginEmail(form.email.trim())
          // 自动登录
          if (form.autoLogin) {
            this.setAutoLoginCredentials({
              ...form
            })
          }
          return { success: true, data: res.data }
        }
        return { success: false, error: res?.error || '登录失败' }
      } catch (e) {
        console.error('登录失败:', e)
        return { success: false, error: e?.message || '登录失败' }
      }
    },

    /**
     * 获取用户信息
     */
    async getProfile() {
      const res = await window.api.user.getProfile()
      console.log('获取用户信息响应:', res)
      if (res?.success && res.data) {
        this.setUserInfo({
          ...this.userInfo,
          ...res.data
        })
        return {
          success: true,
          data: res.data.user
        }
      } else {
        return { success: false, error: res?.error || '获取用户信息失败' }
      }
    },

    /**
     * 重置密码
     * @param {{ email: string, code: string, password: string }} form
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    async resetPassword(form) {
      try {
        const res = await window.api.user.resetPassword(
          form.email.trim(),
          form.code.trim(),
          form.password.trim()
        )
        return res
      } catch (e) {
        return { success: false, error: e?.message || '重置密码失败' }
      }
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
      window.api.config.set('auth.token', '', 'auth')
      localStorage.removeItem('autoLoginCredentials')
      this.reset()
      return true
    },

    /**
     * 激活会员
     * @param {string} activeCode - 激活码
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    async activate(activeCode) {
      try {
        if (!activeCode) return { success: false, error: '激活码不能为空' }
        if (!this.token) return { success: false, error: '未登录' }

        console.log('activeCode:', activeCode)
        console.log('token:', this.token)

        const res = await window.api.user.activate(activeCode.trim(), this.token)
        if (res?.success) {
          await this.getProfile()
          return { success: true, message: '会员激活成功' }
        }

        return { success: false, error: res?.error || '激活失败' }
      } catch (e) {
        return { success: false, error: e?.message || '激活失败' }
      }
    }
  }
})
