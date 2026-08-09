<template>
  <div class="login-page-wrapper">
    <div class="login-container">
      <LoginTitleBar />

      <!-- 顶部品牌区 -->
      <div class="login-header">
        <div class="app-icon">
          <img
            :src="appStore.oemInfo.logoUrl"
            class="logo-image"
          />
        </div>
        <div class="app-text">
          <div class="app-title">{{ appStore.oemInfo.name }}</div>
          <div class="app-subtitle">AI内容创作平台</div>
        </div>
      </div>

      <!-- 表单卡片 -->
      <div class="login-box">
        <div v-if="mode === 'login'" class="login-form">
          <h2 class="form-title">账号登录</h2>
          <!-- 登录账号表单 -->
          <a-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            layout="vertical"
            autocomplete="off"
            @finish="handleLoginSubmit"
            @finish-failed="onLoginFinishFailed"
          >
            <a-form-item label="邮箱" name="email">
              <a-input
                v-model:value="loginForm.email"
                size="large"
                placeholder="请输入邮箱"
                allow-clear
              >
                <template #prefix>
                  <MailOutlined />
                </template>
              </a-input>
            </a-form-item>
            <a-form-item label="密码" name="password">
              <a-input-password
                v-model:value="loginForm.password"
                size="large"
                placeholder="请输入密码"
              >
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item>
              <div style="display: flex; justify-content: space-between; align-items: center">
                <a-checkbox v-model:checked="loginForm.autoLogin" name="autoLogin">
                  自动登录
                </a-checkbox>

                <a-button type="link" @click="setMode('resetPassword')">忘记密码</a-button>
              </div>
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                html-type="submit"
                block
                size="large"
                :loading="submitting"
                :disabled="submitting"
              >
                登录
              </a-button>
            </a-form-item>
          </a-form>

          <div class="form-footer">
            <a-button type="link" @click="setMode('register')">还没有账号？立即注册</a-button>
          </div>
        </div>

        <div v-if="mode === 'register'" class="login-form">
          <h2 class="form-title">账号注册</h2>

          <!-- 注册账号表单 -->
          <a-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            layout="vertical"
            autocomplete="off"
            @finish="handleRegisterSubmit"
            @finish-failed="onRegisterFinishFailed"
          >
            <a-form-item label="用户名" name="username">
              <a-input
                v-model:value="registerForm.username"
                size="large"
                placeholder="请输入用户名"
                allow-clear
              >
                <template #prefix>
                  <UserOutlined />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item label="邮箱" name="email">
              <a-input
                v-model:value="registerForm.email"
                size="large"
                placeholder="请输入邮箱"
                allow-clear
              >
                <template #prefix>
                  <MailOutlined />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item label="密码" name="password">
              <a-input-password
                v-model:value="registerForm.password"
                size="large"
                placeholder="请输入密码"
              >
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item label="确认密码" name="confirmPassword">
              <a-input-password
                v-model:value="registerForm.confirmPassword"
                size="large"
                placeholder="请再次输入密码"
              >
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                size="large"
                html-type="submit"
                block
                :loading="submitting"
                :disabled="submitting"
              >
                注册账号
              </a-button>
            </a-form-item>
          </a-form>

          <div class="form-footer">
            <a-button type="link" @click="setMode('login')">已经有账号？立即登录</a-button>
          </div>
        </div>

        <div v-if="mode === 'resetPassword'" class="login-form">
          <h2 class="form-title">重置密码</h2>

          <!-- 重置密码表单 -->
          <a-form
            ref="resetPasswordFormRef"
            :model="resetPasswordForm"
            :rules="resetPasswordRules"
            layout="vertical"
            autocomplete="off"
            @finish="handleResetPasswordSubmit"
            @finish-failed="onResetPasswordFinishFailed"
          >
            <a-form-item label="邮箱" name="email">
              <a-input
                v-model:value="resetPasswordForm.email"
                size="large"
                placeholder="请输入邮箱"
                allow-clear
              >
                <template #prefix>
                  <MailOutlined />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item label="验证码" name="code">
              <div style="display: flex; gap: 10px">
                <a-input
                  v-model:value="resetPasswordForm.code"
                  size="large"
                  placeholder="请输入验证码"
                  allow-clear
                >
                  <template #prefix>
                    <MailOutlined />
                  </template>
                </a-input>

                <a-button size="large">获取验证码</a-button>
              </div>
            </a-form-item>

            <a-form-item label="新密码" name="password">
              <a-input-password
                v-model:value="resetPasswordForm.password"
                size="large"
                placeholder="请输入新密码"
              >
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item label="确认新密码" name="confirmPassword">
              <a-input-password
                v-model:value="resetPasswordForm.confirmPassword"
                size="large"
                placeholder="请再次输入新密码"
              >
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                html-type="submit"
                block
                :loading="submitting"
                :disabled="submitting"
                size="large"
              >
                重置密码
              </a-button>
            </a-form-item>
          </a-form>

          <div class="form-footer">
            <a-button type="link" @click="setMode('login')">返回登录</a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import LoginTitleBar from '../../components/LoginTitleBar.vue'
import { useAuthStore } from '../../store/auth'
import { useAppStore } from '../../store/app'

defineOptions({ name: 'LoginView' })

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const submitting = ref(false)
const loginFormRef = ref(null)
const registerFormRef = ref(null)
const resetPasswordFormRef = ref(null)

const mode = ref('login')

const loginForm = reactive({
  email: '',
  password: '',
  autoLogin: false
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const resetPasswordForm = reactive({
  email: '',
  code: '',
  password: '',
  confirmPassword: ''
})

// ============ 校验规则 ============
const loginRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度需在 3-20 字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value) => {
        if (!value) return Promise.resolve()
        return value === registerForm.password
          ? Promise.resolve()
          : Promise.reject(new Error('两次密码不一致'))
      },
      trigger: 'blur'
    }
  ]
}

const resetPasswordRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value) => {
        if (!value) return Promise.resolve()
        return value === resetPasswordForm.password
          ? Promise.resolve()
          : Promise.reject(new Error('两次密码不一致'))
      },
      trigger: 'blur'
    }
  ]
}

onMounted(() => {
  appStore.getOemInfo()

  const autoLoginCredentials = JSON.parse(localStorage.getItem('autoLoginCredentials')) || null
  if (autoLoginCredentials) {
    loginForm.email = autoLoginCredentials.email
    loginForm.password = autoLoginCredentials.password
    loginForm.autoLogin = autoLoginCredentials.autoLogin

    // 自动登录
    if (loginForm.autoLogin) {
      setTimeout(() => {
        handleLoginSubmit(loginForm)
      }, 500)
    }
  }

  const lastLoginEmail = localStorage.getItem('lastLoginEmail') || ''
  if (lastLoginEmail) {
    loginForm.email = lastLoginEmail
  }
})

// ============ 模式切换 ============
function setMode(newMode) {
  if (mode.value === newMode) return
  mode.value = newMode
  // 清空校验状态
  loginFormRef.value?.resetFields()
  registerFormRef.value?.resetFields()
}

// ============ 提交处理 ============
async function handleLoginSubmit() {
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await authStore.login({
      email: loginForm.email,
      password: loginForm.password,
      autoLogin: loginForm.autoLogin
    })
    if (res.success) {
      message.success('登录成功')
      router.replace('/home')
    } else {
      message.error(res.error || '登录失败')
    }
  } finally {
    submitting.value = false
  }
}

function onLoginFinishFailed(errorInfo) {
  console.warn('登录表单校验失败:', errorInfo)
}

async function handleRegisterSubmit(values) {
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await authStore.register({
      username: values.username,
      email: values.email,
      password: values.password
    })
    if (res.success) {
      message.success('注册成功，请登录')
      setMode('login')
    } else {
      message.error(res.error || '注册失败')
    }
  } finally {
    submitting.value = false
  }
}

function onRegisterFinishFailed(errorInfo) {
  console.warn('注册表单校验失败:', errorInfo)
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, var(--theme-primary) 0, var(--theme-secondary) 100%);
  position: relative;
  padding: 20px;
  box-sizing: border-box;
  color: var(--theme-text-primary);
}

.login-header {
  display: flex;
  align-items: center;
  padding: 20px 30px;
  background: var(--theme-overlay-medium);
  border-radius: 12px;
  margin-bottom: 20px;
  max-width: 400px;
  width: 100%;
  box-sizing: border-box;
  gap: 16px;
}

.login-header .app-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-header .logo-image {
  width: 100%;
  height: 100%;
  -o-object-fit: contain;
  object-fit: contain;
}

.app-title {
  font-size: var(--app-font-size-page-title);
  font-weight: 700;
  color: var(--theme-text-primary);
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.app-subtitle {
  font-size: var(--app-font-size-caption);
  color: var(--theme-text-secondary);
  margin: 0;
  line-height: 1.2;
}

.login-form {
  margin-top: 20px;
}

.form-title {
  font-size: var(--app-font-size-section-title);
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0 0 24px 0;
  text-align: center;
}

.form-footer {
  text-align: center;
  margin-top: 16px;
}

.login-box {
  width: 400px;
  border-radius: 12px;
  background: #fff;
  padding: 40px;
  box-shadow: 0 10px 40px var(--theme-shadow-dark);
}
</style>
