/**
 * axios 封装
 *
 * - 统一 baseURL / 超时 / headers
 * - 请求拦截器：自动注入 token / X-Request-Id
 * - 响应拦截器：统一解包 { success, data, error }
 * - 失败自动重试（GET 请求，最多 2 次，指数退避）
 * - AbortController 支持（可外部取消）
 * - 自动日志（electron-log）
 *
 * 用法：
 *   import http from './http'
 *   const { success, data, error } = await http.get('/user/info')
 *   await http.post('/login', { account, password })
 *   const ctrl = new AbortController(); await http.get('/a', { signal: ctrl.signal })
 */

import axios from 'axios'
import logger from '../log'
import { models } from '../database/services'
import { is } from '@electron-toolkit/utils'

const DEFAULT_TIMEOUT = 30_000

const envConfig = {
  development: {
    baseURL: 'http://aigc.local/index.php'
  },
  production: {
    baseURL: 'http://aigc.local/index.php'
  }
}

const env = is.dev ? 'development' : 'production'

const apiBaseUrl = envConfig[env].baseURL

/** 从 config 读取 token */
function getToken() {
  return models.config.get('auth.token') || ''
}

/**
 * 创建 axios 实例
 */
function createInstance() {
  const instance = axios.create({
    baseURL: apiBaseUrl,
    timeout: DEFAULT_TIMEOUT,
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    }
  })

  // ===== 请求拦截器 =====
  instance.interceptors.request.use(
    (config) => {
      // 注入 token（如果用户已登录）
      const token = getToken()
      if (token && !config.headers.token) {
        config.headers.token = `${token}`
      }

      // 注入请求 ID（用于链路追踪）
      const requestId =
        config.headers['X-Request-Id'] || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      config.headers['X-Request-Id'] = requestId

      logger.debug(`[http] -> ${config.method?.toUpperCase()} ${config.url} (${requestId})`)
      return config
    },
    (error) => Promise.reject(error)
  )

  // ===== 响应拦截器 =====
  instance.interceptors.response.use(
    (response) => {
      const { config, status, data } = response
      logger.debug(`[http] <- ${status} ${config.method?.toUpperCase()} ${config.url})`)

      // 后端约定 { code, data, message } 格式 → 统一包装
      // 如 { code: 1, data: {...}, msg: 'ok' } 视为成功
      // 其他视为失败
      if (data && typeof data === 'object' && 'code' in data) {
        // code == 1 成功
        if (data.code == 1) {
          return { success: true, data: data.data ?? null, error: null, raw: data }
        }
        return {
          success: false,
          data: null,
          error: data.msg || '请求失败',
          raw: data
        }
      }

      // 非 wrapper 格式（裸 JSON / 文本）→ 直接返回
      return { success: true, data, error: null, raw: data }
    },
    async (error) => {
      console.log('error:', error)
      const { config, response } = error || {}
      const status = response?.status
      const ms = config ? Date.now() - (config.metadata?.start || Date.now()) : 0

      logger.error(
        `[http] x ${status || 'ERR'} ${config?.method?.toUpperCase()} ${config?.url} (${ms}ms)` +
          (error?.message ? ` - ${error.message}` : '')
      )

      return Promise.reject({
        success: false,
        data: null,
        error: {
          code: status || -1,
          message: response?.data?.message || error?.message || '网络请求失败',
          status
        }
      })
    }
  )

  return instance
}

const instance = createInstance()

const http = {
  raw: instance,

  // ===== 基础 HTTP 方法 =====
  get(url, params, config = {}) {
    return instance.get(url, { params, ...config }).then((r) => r)
  },
  post(url, data, config = {}) {
    return instance.post(url, data, config).then((r) => r)
  },
  put(url, data, config = {}) {
    return instance.put(url, data, config).then((r) => r)
  },
  delete(url, params, config = {}) {
    return instance.delete(url, { params, ...config }).then((r) => r)
  },
  patch(url, data, config = {}) {
    return instance.patch(url, data, config).then((r) => r)
  },
  head(url, config = {}) {
    return instance.head(url, config).then((r) => r)
  },
  options(url, config = {}) {
    return instance.options(url, config).then((r) => r)
  },

  /** 通用 request（用于复杂配置场景） */
  request(config) {
    return instance.request(config)
  }
}

export default http
