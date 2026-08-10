<template>
  <div class="profile-container">
    <a-page-header title="返回" @back="onBack"> </a-page-header>

    <div class="profile-content">
      <div class="profile-row">
        <!-- 左：基本信息 -->
        <a-card class="profile-card profile-left">
          <template #title>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>
          <a-form
            ref="basicFormRef"
            :model="basicForm"
            :rules="basicRules"
            :label-col="{ span: 6 }"
            autocomplete="off"
          >
            <a-form-item label="用户名" name="username">
              <a-input
                v-model:value="basicForm.username"
                size="large"
                placeholder="请输入用户名"
                allow-clear
                spell-check="false"
              >
                <template #suffix>
                  <a-tooltip title="用户名一旦创建不可修改">
                    <LockOutlined class="suffix-icon" />
                  </a-tooltip>
                </template>
              </a-input>
            </a-form-item>

            <a-form-item label="邮箱" name="email">
              <a-input
                v-model:value="basicForm.email"
                size="large"
                placeholder="请输入邮箱"
                readonly
              />
            </a-form-item>

            <a-form-item label="账号状态">
              <a-tag class="status-tag" :color="accountStatusColor">
                {{ accountStatusText }}
              </a-tag>
            </a-form-item>

            <a-form-item label="会员状态">
              <a-tag class="status-tag" :color="vipStatusColor">
                <CrownOutlined v-if="isVip" />
                {{ vipStatusText }}
              </a-tag>
            </a-form-item>

            <a-form-item label="积分">
              <span class="points">
                <ThunderboltOutlined class="points-icon" />
                {{ authStore.userInfo.score }}
              </span>
            </a-form-item>

            <a-form-item :wrapper-col="{ offset: 6, span: 16 }">
              <a-button
                type="primary"
                :loading="basicSaving"
                :disabled="basicSaving"
                @click="onSaveBasic"
              >
                保存修改
              </a-button>
              <a-button style="margin-left: 10px" :disabled="basicSaving" @click="onCancelBasic"
                >取 消</a-button
              >
            </a-form-item>
          </a-form>
        </a-card>

        <!-- 右：修改密码 -->
        <a-card class="profile-card profile-right">
          <template #title>
            <div class="card-header">
              <span>修改密码</span>
            </div>
          </template>
          <a-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            autocomplete="off"
            :label-col="{ span: 6 }"
            @finish="onChangePassword"
            @finish-failed="onPasswordFailed"
          >
            <a-form-item label="当前密码" name="currentPassword">
              <a-input-password
                v-model:value="passwordForm.currentPassword"
                size="large"
                placeholder="请输入当前密码"
              />
            </a-form-item>

            <a-form-item label="新密码" name="newPassword">
              <a-input-password
                v-model:value="passwordForm.newPassword"
                size="large"
                placeholder="请输入新密码（至少6位）"
              />
            </a-form-item>

            <a-form-item label="确认密码" name="confirmPassword">
              <a-input-password
                v-model:value="passwordForm.confirmPassword"
                size="large"
                placeholder="请再次输入新密码"
              />
            </a-form-item>

            <a-form-item :wrapper-col="{ offset: 6, span: 16 }">
              <a-button
                type="primary"
                html-type="submit"
                :loading="passwordSaving"
                :disabled="passwordSaving"
              >
                修改密码
              </a-button>
              <a-button
                :disabled="passwordSaving"
                @click="onResetPassword"
                style="margin-left: 10px"
              >
                重 置
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </div>
    </div>

    <!-- 底部：激活会员 -->
    <a-card class="profile-card activate-card">
      <template #title>
        <div class="card-header">
          <span>激活会员</span>
        </div>
      </template>
      <a-alert
        v-if="!isVip"
        class="activate-tip"
        type="warning"
        show-icon
        message="请输入激活码激活会员以使用完整功能"
        style="margin-bottom: 20px"
      >
        <template #icon>
          <InfoCircleOutlined />
        </template>
      </a-alert>

      <a-form
        ref="activateFormRef"
        :model="activateForm"
        :rules="activateRules"
        autocomplete="off"
        :label-col="{ span: 5 }"
        @finish="onActivate"
        @finish-failed="onActivateFailed"
      >
        <a-form-item label="激活码" name="code">
          <a-input
            v-model:value="activateForm.code"
            size="large"
            placeholder="请输入激活码"
            allow-clear
          />
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 5, span: 16 }">
          <a-button type="primary" html-type="submit" :loading="activating" :disabled="activating">
            激活会员
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { computed, h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  CrownOutlined,
  InfoCircleOutlined,
  LockOutlined,
  ThunderboltOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '../../store/auth'

defineOptions({ name: 'ProfileView' })

const router = useRouter()
const authStore = useAuthStore()

// ============ 基础信息 ============
const basicFormRef = ref(null)
const basicSaving = ref(false)

const basicForm = reactive({
  username: '',
  email: ''
})

const accountStatusText = computed(() => (authStore.isActive ? '已激活' : '未激活'))
const accountStatusColor = computed(() =>
  authStore.isActive ? 'success' : 'default'
)
const isVip = computed(() => !!authStore.isVip)
const vipStatusText = computed(() => (isVip.value ? 'VIP会员' : '普通用户'))
const vipStatusColor = computed(() => (isVip.value ? 'gold' : 'default'))

const basicRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度需在 3-20 字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
}

async function onSaveBasic() {
  try {
    await basicFormRef.value?.validate()
  } catch {
    return
  }
  basicSaving.value = true
  try {
    const res = await window.api.user.updateProfile(basicForm.username, basicForm.email)
    if (res?.success !== false) {
      await authStore.getProfile()
      message.success('保存成功')
    } else {
      message.error(res?.error || '保存失败')
    }
  } catch (e) {
    message.error(e?.message || '保存失败')
  } finally {
    basicSaving.value = false
  }
}

function onCancelBasic() {
  basicForm.username = authStore.user?.username || ''
  basicForm.email = authStore.user?.email || ''
  basicFormRef.value?.resetFields()
}

// ============ 修改密码 ============
const passwordFormRef = ref(null)
const passwordSaving = ref(false)

// 密码修改表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value) => {
        if (!value) return Promise.resolve()
        return value === passwordForm.newPassword
          ? Promise.resolve()
          : Promise.reject(new Error('两次输入的密码不一致'))
      },
      trigger: 'blur'
    }
  ]
}

/**
 * 密码修改
 */
async function onChangePassword() {
  passwordSaving.value = true
  try {
    const res = await window.api.user.updatePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    )
    if (res?.success !== false) {
      message.success('密码修改成功，请重新登录')
      onResetPassword()
      authStore.reset?.()
      router.replace('/login')
    } else {
      message.error(res?.error || '密码修改失败')
    }
  } catch (e) {
    message.error(e?.message || '密码修改失败')
  } finally {
    passwordSaving.value = false
  }
}

function onPasswordFailed(errorInfo) {
  console.warn('密码表单校验失败:', errorInfo)
}

function onResetPassword() {
  passwordFormRef.value?.resetFields()
}

// ============ 激活会员 ============
const activateFormRef = ref(null)
const activating = ref(false)

const activateForm = reactive({
  code: ''
})

const activateRules = {
  code: [{ required: true, message: '请输入激活码', trigger: 'blur' }]
}


/**
 * 激活会员
 */
async function onActivate() {
  activating.value = true
  try {
    const res = await authStore.activate(activateForm.code.trim())
    if (res.success) {
      message.success('账户激活成功')
      activateFormRef.value?.resetFields()
    } else {
      message.error(res?.error || '账户激活失败')
    }
  } catch (e) {
    message.error(e?.message || '账户激活失败')
  } finally {
    activating.value = false
  }
}

function onActivateFailed(errorInfo) {
  console.warn('激活表单校验失败:', errorInfo)
}

function onBack() {
  if (window.history.length > 1) router.back()
  else router.replace('/')
}

onMounted(async () => {
  try {
    const profileRes = await authStore.getProfile()
    if (profileRes.success) {
      basicForm.email = profileRes.data.email || ''
      basicForm.username = profileRes.data.username || ''
    }
  } catch (e) {
    console.error('get profile failed:', e)
  }
})
</script>

<style lang="scss">
.profile-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(
    135deg,
    var(--theme-background) 0,
    var(--theme-background-lighter) 100%
  );

  min-height: 100vh;

  .page-title {
    font-size: var(--app-font-size-card-title);
    font-weight: 600;
    color: var(--theme-text-tertiary);
  }

  .profile-content {
    margin-top: 20px;
    width: 100%;
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
  }

  .profile-row {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
  }

  .profile-left,
  .profile-right {
    flex: 1;
    min-width: 0;
    max-width: 50%;
  }

  .profile-card {
    margin-bottom: 20px;
    height: -moz-fit-content;
    height: fit-content;
    width: 100%;
    background: linear-gradient(
      135deg,
      var(--theme-background-lighter) 0,
      var(--theme-background-light) 100%
    );
    border: 1px solid var(--theme-border-purple);
    border-radius: 12px;
    box-shadow: 0 4px 16px var(--theme-shadow-dark);
  }

  .profile-card .ant-card-head {
    background: var(--theme-scrollbar-track-light);
    border-bottom: 1px solid var(--theme-border);
  }

  .profile-card .ant-card-body {
    background: transparent;
  }

  .activate-card {
    margin-top: 20px;
    width: 100%;
  }

  .card-header {
    font-size: var(--app-font-size-body);
    font-weight: 600;
    color: var(--theme-text-tertiary);
  }

  .profile-card .ant-form-item-label > label {
    color: var(--theme-text-tertiary);
    font-weight: 500;
  }

  .profile-card .ant-input,
  .profile-card .ant-input-affix-wrapper,
  .profile-card .ant-input-password {
    background: var(--theme-scrollbar-track-light);
    border-color: var(--theme-input-border);
    color: var(--theme-text-primary);
  }

  .profile-card .ant-input::-moz-placeholder {
    color: var(--theme-text-muted);
    opacity: 0.4;
  }

  .profile-card .ant-input::placeholder {
    color: var(--theme-text-muted);
    opacity: 0.4;
  }

  .profile-card .ant-input-affix-wrapper:hover,
  .profile-card .ant-input:hover {
    border-color: var(--theme-input-hover-border);
  }

  .profile-card .ant-input-affix-wrapper-focused,
  .profile-card .ant-input-affix-wrapper:focus,
  .profile-card .ant-input:focus {
    border-color: var(--theme-input-focus-border);
    box-shadow: 0 0 0 2px var(--theme-input-focus-shadow);
  }

  .profile-card .ant-input-suffix {
    color: var(--theme-text-primary);
    opacity: 0.6;
  }

  .profile-card .ant-tag {
    border-color: var(--theme-border-purple);
    background: var(--theme-scrollbar-track-light);
  }

  .profile-card .ant-tag-success {
    background: var(--theme-alert-success-bg);
    border-color: var(--theme-success);
    color: var(--theme-tag-success-text);
  }

  .profile-card .ant-tag-error {
    background: var(--theme-alert-error-bg);
    border-color: var(--theme-error);
    color: var(--theme-error-light);
  }

  .profile-card .ant-tag-warning {
    background: var(--theme-alert-warning-bg);
    border-color: var(--theme-warning);
    color: var(--theme-tag-warning-text);
  }

  .profile-card .ant-tag-default {
    background: var(--theme-tag-default-bg);
    border-color: var(--theme-tag-default-border);
    color: var(--theme-tag-default-text);
  }

  .profile-card .ant-form-item-control-input-content > span {
    color: var(--theme-text-tertiary);
    font-weight: 500;
    font-size: var(--app-font-size-body);
  }

  .profile-card .ant-btn-primary {
    background: var(--theme-modal-button-primary-bg);
    border: none;
  }

  .profile-card .ant-btn-primary:hover {
    background: var(--theme-modal-button-primary-hover-bg);
  }

  .profile-card .ant-btn:not(.ant-btn-primary) {
    background: var(--theme-scrollbar-track-light);
    border-color: var(--theme-input-border);
    color: var(--theme-text-tertiary);
  }

  .profile-card .ant-btn:not(.ant-btn-primary):hover {
    border-color: var(--theme-input-hover-border);
    color: var(--theme-text-primary);
  }

  .activate-card .ant-alert {
    background: var(--theme-alert-warning-bg);
    border: 1px solid var(--theme-alert-warning-border);
  }

  .activate-card .ant-alert-description,
  .activate-card .ant-alert-icon,
  .activate-card .ant-alert-message {
    color: var(--theme-tag-warning-text);
  }

  .ant-page-header {
    background: transparent;
    padding-left: 0;
    padding-right: 0;
  }

  .ant-page-header-back-button,
  .ant-page-header-heading-title {
    color: var(--theme-text-tertiary);
  }

  @media (max-width: 1200px) {
    .profile-content {
      max-width: 100%;
      padding: 0 10px;
    }

    .profile-row {
      gap: 16px;
    }
  }

  @media (max-width: 992px) {
    .profile-row {
      flex-direction: column;
      gap: 0;
    }

    .profile-left,
    .profile-right {
      max-width: 100%;
      margin-bottom: 20px;
    }
  }

  @media (max-width: 768px) {
    .profile-content {
      padding: 0 5px;
    }

    .profile-card {
      margin-bottom: 16px;
    }

    .activate-card {
      margin-top: 16px;
    }
  }

  @media (max-width: 480px) {
    .profile-content {
      padding: 0;
    }
  }
}
</style>
