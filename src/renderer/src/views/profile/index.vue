<template>
  <div class="profile-page">
    <!-- 顶部返回 -->
    <div class="page-header">
      <a-button type="text" class="back-btn" @click="onBack">
        <template #icon>
          <ArrowLeftOutlined />
        </template>
        返回
      </a-button>
    </div>

    <div class="profile-grid">
      <!-- 左：基本信息 -->
      <a-card title="基本信息" class="profile-card" :bordered="false">
        <a-form
          ref="basicFormRef"
          :model="basicForm"
          :rules="basicRules"
          :label-col="{ style: { width: '100px' } }"
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
              {{ authStore.userInfo.user.points }}
            </span>
          </a-form-item>

          <a-form-item>
            <a-space>
              <a-button
                type="primary"
                :loading="basicSaving"
                :disabled="basicSaving"
                @click="onSaveBasic"
              >
                保存修改
              </a-button>
              <a-button :disabled="basicSaving" @click="onCancelBasic">取 消</a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 右：修改密码 -->
      <a-card title="修改密码" class="profile-card" :bordered="false">
        <a-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          layout="vertical"
          autocomplete="off"
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

          <a-form-item>
            <a-space>
              <a-button
                type="primary"
                html-type="submit"
                :loading="passwordSaving"
                :disabled="passwordSaving"
              >
                修改密码
              </a-button>
              <a-button :disabled="passwordSaving" @click="onResetPassword"> 重 置 </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-card>
    </div>

    <!-- 底部：激活会员 -->
    <a-card title="激活会员" class="profile-card activate-card" :bordered="false">
      <a-alert
        v-if="!isVip"
        class="activate-tip"
        type="warning"
        show-icon
        message="请输入激活码激活会员以使用完整功能"
      >
        <template #icon>
          <InfoCircleOutlined />
        </template>
      </a-alert>

      <a-form
        ref="activateFormRef"
        :model="activateForm"
        :rules="activateRules"
        layout="vertical"
        autocomplete="off"
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

        <a-form-item>
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

const accountStatusText = computed(() => (authStore.userInfo.user.is_active ? '已激活' : '未激活'))
const accountStatusColor = computed(() =>
  authStore.userInfo.user.is_active ? 'success' : 'default'
)
const isVip = computed(() => !!authStore.userInfo.user.is_vip)
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
  code: [
    { required: true, message: '请输入激活码', trigger: 'blur' },
    { min: 4, message: '激活码格式不正确', trigger: 'blur' }
  ]
}

async function onActivate() {
  activating.value = true
  try {
    const res = await window.api.user.activate(activateForm.code.trim(), authStore.userInfo.token)
    if (res.success) {
      message.success('激活成功')
      activateFormRef.value?.resetFields()
    } else {
      message.error(res?.error || '激活失败')
    }
  } catch (e) {
    message.error(e?.message || '激活失败')
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
    const profileRes = await window.api.user.getProfile()
    if (profileRes.success) {
      basicForm.email = profileRes.data.email
      basicForm.username = profileRes.data.username
    }
  } catch (e) {
    console.error('get profile failed:', e)
  }
})
</script>

<style lang="scss" scoped>
.profile-page {
  width: 100%;
  min-height: 100vh;
  padding: 24px 28px 60px;
  color: #f5f5f5;
}

.page-header {
  margin-bottom: 24px;

  .back-btn {
    color: #f5f5f5;
    font-size: 14px;
    padding: 4px 10px;

    &:hover {
      background: rgba(255, 255, 255, 0.06) !important;
    }
  }
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.activate-card {
  margin-top: 0;
}

.activate-tip {
  margin-bottom: 18px;
  background: rgba(250, 204, 21, 0.08) !important;
  border: 1px solid rgba(250, 204, 21, 0.4) !important;
  color: #facc15 !important;

  :deep(.ant-alert-icon) {
    color: #facc15 !important;
  }

  :deep(.ant-alert-message) {
    color: #facc15 !important;
  }
}

.required-star {
  color: #ef4444;
  margin-right: 4px;
}

.status-tag {
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 6px;
}

.points {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #facc15;

  .points-icon {
    color: #facc15;
  }
}

.suffix-icon {
  color: rgba(255, 255, 255, 0.35);
  cursor: help;
}

// 响应式：小屏单列
@media (max-width: 960px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
