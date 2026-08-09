<script setup>
import { ref, computed, onMounted, reactive, createVNode } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import CustomTourDescription from '../../components/CustomTourDescription.vue'

// 账号列表
const accounts = ref([])
// 支持的平台
const supportedPlatforms = ref([])
// 添加账号中
const addingAccount = ref(false)
// 加载中
const accountsLoading = ref(false)
// 测试中
const testConnectionLoading = ref(false)
// 打开中
const openAccountLoading = ref(false)

const mode = ref('add')
const showModal = ref(false)

// 编辑账号表单数据
const editForm = reactive({
  id: '',
  platform: '',
  account_name: '',
  display_name: ''
})

/** 平台徽章文字 */
function platformBadgeText(platform) {
  return supportedPlatforms.value.find((item) => item.key === platform)?.name || platform
}

/**
 * 加载账号列表
 */
const loadAccounts = async () => {
  accountsLoading.value = true
  try {
    const result = await window.api.account.list({ pageSize: 100 })
    if (result.success && result.data) {
      accounts.value = result.data
    }
  } catch (e) {
    console.error('加载账号失败:', e)
    message.error(e.message || '加载账号失败')
  } finally {
    accountsLoading.value = false
  }
}

/**
 * 加载支持的平台
 */
const loadSupportedPlatforms = async () => {
  try {
    const result = await window.api.account.getSupportedPlatforms()
    if (result.success && result.data) {
      supportedPlatforms.value = result.data
    }
  } catch (e) {
    console.error('加载支持的平台失败:', e)
    message.error(e.message || '加载支持的平台失败')
  }
}

/**
 * 打开添加账号弹窗
 */
function openAddAccountModal() {
  editForm.id = ''
  editForm.platform = ''
  editForm.account_name = ''
  editForm.display_name = ''
  mode.value = 'add'
  showModal.value = true
}

/**
 * 打开编辑账号弹窗
 */
function openEditAccountModal(a) {
  editForm.id = a.id || ''
  editForm.platform = a.platform || ''
  editForm.account_name = a.account_name || ''
  editForm.display_name = a.display_name || ''
  mode.value = 'edit'
  showModal.value = true
}

/**
 * 关闭账号弹窗
 */
function closeAccountModal() {
  showModal.value = false
}

/**
 * 提交账号表单：添加或编辑统一入口
 */
async function submitAccountForm() {
  if (!editForm.platform || !editForm.account_name) {
    message.warning('请填写必要信息')
    return
  }

  const payload = {
    platform: editForm.platform,
    account_name: editForm.account_name,
    display_name: editForm.display_name
  }

  if (mode.value == 'add') {
    payload.id = ''
  } else {
    payload.id = editForm.id
  }

  try {
    const res =
      mode.value == 'edit'
        ? await window.api.account.update(payload.id, payload)
        : await window.api.account.create(payload)

    if (res.success) {
      message.success(res.message || (mode.value == 'edit' ? '已保存' : '添加账号成功'))
      closeAccountModal()
      await loadAccounts()
    } else {
      message.error(res.message || (mode.value == 'edit' ? '保存失败' : '添加账号失败'))
    }
  } catch (e) {
    console.error('提交账号失败:', e)
    message.error(e.message || (mode.value == 'edit' ? '保存失败' : '添加账号失败'))
  } finally {
    addingAccount.value = false
  }
}

/**
 * 登录指定账号
 */
const loginAccount = async (a) => {
  try {
    const loginRes = await window.api.account.setupLogin(a.id)
    if (loginRes.success) {
      message.success('登录成功')
    } else {
      message.error(loginRes.message || '登录失败')
    }
    // 刷新账号列表
    await loadAccounts()
  } catch (e) {
    message.error(e.message || '登录失败')
  }
}

/**
 * 删除指定账号
 */
async function remove(a) {
  try {
    const res = await window.api.account.delete(a.id)
    if (res.success) {
      message.success(res.message || '已删除')
      await loadAccounts()
    } else {
      message.error(res.message || '删除失败')
    }
  } catch (e) {
    message.error(e.message || '删除失败')
  }
}

/**
 * 测试指定账号的连接
 */
const testConnection = async (a) => {
  try {
    testConnectionLoading.value = true
    await window.api.account.testLogin(a.id)
  } catch (e) {
    testConnectionLoading.value = false
  } finally {
    testConnectionLoading.value = false
  }
}

/**
 * 打开指定账号
 */
const openAccount = async (a) => {
  try {
    openAccountLoading.value = true
    await window.api.account.openAccount(a.id)
  } catch (e) {
    openAccountLoading.value = false
  } finally {
    openAccountLoading.value = false
  }
}

const ref1 = ref(null)
const ref2 = ref(null)

const current = ref(0)
const open = ref(false)
// tour target 用函数形式：返回 DOM 元素本身（HTMLElement），而不是组件实例的 $el
const steps = ref([
  {
    title: '添加账号',
    description: createVNode(CustomTourDescription, {
      description: '点击这里可以添加新的平台账号，例如某音、小某书等，用于后续视频发布。'
    }),
    rowDescription: '点击这里可以添加新的平台账号，例如某音、小某书等，用于后续视频发布。',
    target: () => ref1.value || null,
    placement: 'bottom'
  },
  {
    title: '账号列表',
    description: createVNode(CustomTourDescription, {
      description: '这里展示所有已添加的账号。如果还没有账号，可以先点击上方的“添加账号”按钮。'
    }),
    rowDescription: '这里展示所有已添加的账号。如果还没有账号，可以先点击上方的“添加账号”按钮。',
    target: () => ref2.value || null,
    placement: 'top'
  },
  {
    title: '账号状态',
    description: createVNode(CustomTourDescription, {
      description: '每个账号都会显示当前的登录状态以及最后一次登录时间，方便你判断账号是否可用。'
    }),
    rowDescription: '每个账号都会显示当前的登录状态以及最后一次登录时间，方便你判断账号是否可用。',
    target: () => {
      // 获取第一个账号卡片
      return ref2.value.querySelector('.account-card') || ref2.value || null
    },
    placement: 'right'
  },
  {
    title: '账号操作',
    description: createVNode(CustomTourDescription, {
      description: '这里可以对账号执行登录、测试连接、打开主页、编辑信息和删除账号等操作。'
    }),
    rowDescription: '这里可以对账号执行登录、测试连接、打开主页、编辑信息和删除账号等操作。',
    target: () => {
      // 获取第一个账号卡片
      return ref2.value.querySelector('.account-card') || ref2.value || null
    },
    placement: 'right'
  }
])

const handleHelpClick = () => {
  // 等待 DOM 渲染完成后再打开，避免定位到隐藏的 v-if 节点
  current.value = 0
  // 下一帧再打开 tour，确保 target 元素已挂载
  requestAnimationFrame(() => {
    handleOpen(true)
  })
}

function handleOpen(value) {
  open.value = value
}

function onStepChange(index) {
  current.value = index
}

onMounted(() => {
  loadSupportedPlatforms()
  loadAccounts()
})
</script>

<template>
  <div class="account-management">
    <a-tour
      v-model:current="current"
      :open="open"
      :steps="steps"
      @close="handleOpen(false)"
      :mask="false"
      @change="onStepChange"
    />

    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>账号管理</h1>
          <p>管理各平台发布账号的登录状态和信息，提示：已登录成功的账号才会在发布时可以选择</p>
        </div>
        <a-button class="help-btn" type="text" title="查看使用引导" @click="handleHelpClick">
          <QuestionCircleOutlined />
          帮助
        </a-button>
      </div>
    </div>

    <div class="toolbar">
      <button class="btn btn-primary" @click="openAddAccountModal" ref="ref1">
        <plus-outlined />
        添加账号
      </button>
    </div>

    <div class="account-list" data-guide="account-list" ref="ref2">
      <div class="empty-state" data-guide="empty-state" v-if="accounts.length == 0">
        <div class="empty-icon">📱</div>
        <h3>暂无账号</h3>
        <p>点击"添加账号"开始管理您的发布账号</p>
      </div>

      <div class="account-grid" data-guide="account-grid" v-if="accounts.length > 0">
        <div class="account-card" v-for="account in accounts" :key="account.id">
          <div class="account-info">
            <div class="platform-badge" :class="account.platform">
              {{ platformBadgeText(account.platform) }}
            </div>

            <h3 class="account-name">{{ account.display_name || account.account_name || '' }}</h3>
            <p class="account-username">@{{ account.account_name }}</p>

            <div class="status-info" data-guide="account-status">
              <span
                class="status-badge"
                :class="{
                  active: account.status == 'active',
                  inactive: account.status == 'inactive'
                }"
                >{{ account.status == 'active' ? '已登录' : '未登录' }}</span
              >
              <span class="last-login" v-if="account.last_login_at"
                >最后登录：{{ dayjs(account.last_login_at).format('YYYY/MM/DD HH:mm:ss') }}</span
              >
            </div>
          </div>
          <div class="account-actions" data-guide="account-actions">
            <button
              class="btn btn-primary btn-sm"
              @click="loginAccount(account)"
              v-if="account.status == 'inactive'"
            >
              <span>登录账号</span>
            </button>
            <button
              class="btn btn-success btn-sm"
              @click="testConnection(account)"
              v-if="account.status == 'active'"
              :disabled="testConnectionLoading"
              :loading="testConnectionLoading"
            >
              <span>{{ testConnectionLoading ? '测试中' : '测试连接' }}</span>
            </button>
            <button
              class="btn btn-info btn-sm"
              :disabled="openAccountLoading"
              :loading="openAccountLoading"
              @click="openAccount(account)"
              v-if="account.status == 'active'"
            >
              <span>
                {{ openAccountLoading ? '打开中' : '打开' }}
              </span>
            </button>
            <button class="btn btn-secondary btn-sm" @click="openEditAccountModal(account)">
              <span>编辑</span>
            </button>
            <button class="btn btn-danger btn-sm" @click="remove(account)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ mode.value == 'add' ? '添加账号' : '编辑账号' }}</h2>
          <button class="close-btn" @click="closeAccountModal">x</button>
        </div>
        <div class="modal-body">
          <form>
            <div class="form-group" v-if="mode == 'add'">
              <label>平台类型</label>
              <select required class="form-select" v-model="editForm.platform">
                <option value="">请选择平台</option>
                <option :value="item.key" v-for="(item, index) in supportedPlatforms" :key="index">
                  {{ item.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>账号名称</label>
              <input
                type="text"
                class="form-input"
                v-model="editForm.account_name"
                required
                placeholder="输入账号名称或用户名"
              />
            </div>

            <div class="form-group">
              <label>显示名称</label>
              <input
                type="text"
                class="form-input"
                v-model="editForm.display_name"
                placeholder="输入显示名称（可选）"
              />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAccountModal">取消</button>
          <button class="btn btn-primary" @click="submitAccountForm">
            <span> {{ mode.value == 'add' ? '添加' : '保存' }} </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-management {
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-header h1 {
  font-size: var(--app-font-size-page-title);
  color: var(--theme-text-tertiary);
  margin: 0 0 8px 0;
}

.page-header p {
  color: var(--theme-text-gradient-purple);
  margin: 0;
}

.help-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--theme-text-gradient-purple);
  font-size: var(--app-font-size-body);
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.3s;
}

.help-btn:hover {
  background: var(--theme-overlay-purple-strong);
  color: var(--theme-secondary);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--theme-scrollbar-track-light);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--theme-shadow-dark);
  border: 1px solid var(--theme-border-purple);
}

.filters {
  display: flex;
  gap: 12px;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.account-card {
  background: var(--theme-scrollbar-track-light);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px var(--theme-shadow-dark);
  border: 2px solid var(--theme-border-purple);
  transition: all 0.2s ease;
}

.account-card:hover {
  box-shadow: 0 4px 16px var(--theme-shadow-darker);
  transform: translateY(-2px);
  border-color: var(--theme-border-purple-light);
}

.account-card.active {
  border-color: var(--theme-success);
}

.platform-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: var(--app-font-size-caption);
  font-weight: 500;
  color: var(--theme-text-primary);
  margin-bottom: 12px;
}

.platform-badge.douyin {
  background: var(--theme-platform-douyin);
}

.platform-badge.kuaishou {
  background: var(--theme-platform-kuaishou);
}

.platform-badge.wx_channels {
  background: var(--theme-platform-wechat);
}

.platform-badge.xiaohongshu {
  background: var(--theme-platform-xiaohongshu);
}

.account-name {
  font-size: var(--app-font-size-card-title);
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--theme-text-tertiary);
}

.account-username {
  color: var(--theme-text-gradient-purple);
  margin: 0 0 12px 0;
  font-size: var(--app-font-size-body);
}

.status-info {
  margin-bottom: 16px;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: var(--app-font-size-caption);
  font-weight: 500;
  margin-right: 8px;
}

.status-badge.active {
  background: var(--theme-status-active-bg);
  color: var(--theme-status-active-color);
}

.status-badge.inactive {
  background: var(--theme-status-inactive-bg);
  color: var(--theme-status-inactive-color);
}

.last-login {
  font-size: var(--app-font-size-caption);
  color: var(--theme-text-gradient-purple);
  display: block;
  margin-top: 4px;
}

.account-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.publish-stats {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid var(--theme-border-purple);
}

.stats-link {
  background: none;
  border: none;
  color: var(--theme-secondary);
  font-size: var(--app-font-size-body);
  cursor: pointer;
  text-decoration: underline;
}

.stats-link:hover {
  color: var(--theme-text-gradient-purple);
}

.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--theme-table-header-bg);
  border-top: 3px solid var(--theme-secondary);
  border-radius: 50%;
  animation: spin-f89a577e 1s linear infinite;
  margin: 0 auto 16px auto;
}

@keyframes spin-f89a577e {
  0% {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(1turn);
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: var(--theme-text-gradient-purple);
  margin: 0 0 8px 0;
}

.empty-state p {
  color: var(--theme-text-muted);
  margin: 0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-info {
  color: var(--theme-text-gradient-purple);
  font-size: var(--app-font-size-body);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--theme-modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--theme-modal-bg);
  border: 1px solid var(--theme-border-purple);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--theme-border-purple);
}

.modal-header h2 {
  margin: 0;
  font-size: var(--app-font-size-section-title);
  color: var(--theme-text-tertiary);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--app-font-size-page-title);
  cursor: pointer;
  color: var(--theme-text-gradient-purple);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--theme-secondary);
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--theme-border-purple);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--theme-text-tertiary);
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--theme-input-border);
  border-radius: 6px;
  font-size: var(--app-font-size-body);
  transition: border-color 0.2s;
  background: var(--theme-scrollbar-track-light);
  color: var(--theme-text-primary);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--theme-input-focus-border);
  box-shadow: 0 0 0 3px var(--theme-input-focus-shadow);
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: var(--app-font-size-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--theme-modal-button-primary-bg);
  color: var(--theme-text-primary);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: var(--theme-modal-button-primary-hover-bg);
  box-shadow: 0 4px 12px var(--theme-modal-button-primary-shadow);
}

.btn-secondary {
  background: var(--theme-scrollbar-track-light);
  color: var(--theme-text-tertiary);
  border: 1px solid var(--theme-input-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--theme-overlay-purple-strongest);
  border-color: var(--theme-input-hover-border);
  color: var(--theme-secondary);
}

.btn-success {
  background: var(--theme-success);
  color: var(--theme-text-primary);
  border: none;
}

.btn-success:hover:not(:disabled) {
  background: var(--theme-success-dark);
}

.btn-warning {
  background: var(--theme-warning);
  color: var(--theme-text-primary);
  border: none;
}

.btn-warning:hover:not(:disabled) {
  background: var(--theme-warning-dark);
}

.btn-danger {
  background: var(--theme-error);
  color: var(--theme-text-primary);
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background: var(--theme-error-dark);
}

.btn-info {
  background: var(--theme-info);
  color: var(--theme-text-primary);
  border: none;
}

.btn-info:hover:not(:disabled) {
  background: var(--theme-info-dark);
}

.btn-sm {
  padding: 6px 12px;
  font-size: var(--app-font-size-caption);
}

.icon-plus:before {
  content: '+';
  font-weight: 700;
}
</style>
