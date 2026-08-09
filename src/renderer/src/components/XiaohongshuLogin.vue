/**
 * 小红书登录 UI 组件示例
 * 展示如何在 Vue 组件中使用增强的 Cookie 获取功能
 */

<template>
  <div class="xiaohongshu-login">
    <h2>小红书登录</h2>
    
    <!-- 状态显示 -->
    <div v-if="status" :class="['status', status.type]">
      {{ status.message }}
    </div>
    
    <!-- 二维码显示 -->
    <div v-if="qrCodeSrc" class="qrcode-container">
      <img :src="qrCodeSrc" alt="扫码登录" class="qrcode-image" />
      <p>请使用小红书 APP 扫码登录</p>
    </div>
    
    <!-- 操作按钮 -->
    <div class="actions">
      <button 
        @click="checkCookie" 
        :disabled="loading"
        class="btn btn-secondary"
      >
        {{ loading ? '检查中...' : '检查 Cookie' }}
      </button>
      
      <button 
        @click="startLogin" 
        :disabled="loading"
        class="btn btn-primary"
      >
        {{ loading ? '登录中...' : '扫码登录' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { login as loginXiaohongshuEnhanced, validateCookie as validateXiaohongshuCookie } from '../../main/accountService'

export default {
  name: 'XiaohongshuLogin',
  props: {
    accountFile: {
      type: String,
      required: true
    }
  },
  emits: ['login-success', 'login-error'],
  setup(props, { emit }) {
    const loading = ref(false)
    const status = ref(null)
    const qrCodeSrc = ref(null)
    
    // 检查 Cookie
    const checkCookie = async () => {
      loading.value = true
      status.value = { type: 'info', message: '正在检查 Cookie...' }
      
      try {
        const result = await validateXiaohongshuCookie(
          props.accountFile,
          (msg) => {
            status.value = { type: 'info', message: msg }
          }
        )
        
        if (result.valid) {
          status.value = { type: 'success', message: 'Cookie 有效' }
          emit('login-success', { cached: true })
        } else {
          status.value = { type: 'warning', message: 'Cookie 无效，请重新登录' }
        }
      } catch (error) {
        status.value = { type: 'error', message: error.message }
        emit('login-error', error)
      } finally {
        loading.value = false
      }
    }
    
    // 开始登录
    const startLogin = async () => {
      loading.value = true
      qrCodeSrc.value = null
      status.value = { type: 'info', message: '正在启动登录...' }
      
      try {
        const result = await loginXiaohongshuEnhanced(
          props.accountFile,
          { headless: false },
          (msg) => {
            status.value = { type: 'info', message: msg }
          },
          (qrData) => {
            // 显示二维码
            if (qrData.src) {
              qrCodeSrc.value = qrData.src
            }
          }
        )
        
        if (result.success) {
          status.value = { type: 'success', message: '登录成功！' }
          qrCodeSrc.value = null
          emit('login-success', result)
        } else {
          status.value = { type: 'error', message: result.message }
          emit('login-error', result)
        }
      } catch (error) {
        status.value = { type: 'error', message: error.message }
        emit('login-error', error)
      } finally {
        loading.value = false
      }
    }
    
    return {
      loading,
      status,
      qrCodeSrc,
      checkCookie,
      startLogin
    }
  }
}
</script>

<style scoped>
.xiaohongshu-login {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.status {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
}

.status.info {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status.success {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status.warning {
  background-color: #fff3e0;
  color: #f57c00;
}

.status.error {
  background-color: #ffebee;
  color: #d32f2f;
}

.qrcode-container {
  text-align: center;
  margin: 20px 0;
}

.qrcode-image {
  max-width: 200px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #e53935;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #c62828;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #eeeeee;
}
</style>
