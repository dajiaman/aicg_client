<template>
  <div class="member-center">
    <div class="member-banner">
      <div class="banner-content">
        <div class="banner-left">
          <div class="member-badge">
            <CrownOutlined class="crown-icon" />
            <span>VIP会员</span>
          </div>
          <h1 class="banner-title">{{ userInfo.username }}，感谢您的支持</h1>
          <p class="banner-desc">尊享全部功能，无限畅用</p>
          <div class="member-info">
            <div class="info-card">
              <span class="info-label">到期时间</span>
              <span class="info-value">
                {{ expiresText }}
              </span>
            </div>
            <div class="info-card">
              <span class="info-label">剩余天数</span>
              <span class="info-value highlight">{{ leftDay }}天</span>
            </div>
          </div>
          <a-button type="primary" class="renew-btn" @click="openUpgradeModal">
            <ThunderboltOutlined />
            续费会员
          </a-button>
        </div>
        <div class="banner-right">
          <div class="feature-showcase">
            <div class="showcase-item">
              <CheckCircleOutlined class="check-icon" />
              <span>无限次数</span>
            </div>
            <div class="showcase-item">
              <CheckCircleOutlined class="check-icon" />
              <span>全部功能</span>
            </div>

            <div class="showcase-item">
              <CheckCircleOutlined class="check-icon" />
              <span>优先处理</span>
            </div>

            <div class="showcase-item">
              <CheckCircleOutlined class="check-icon" />
              <span>专属客服</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="privileges-section">
      <h2 class="section-title">
        <StarOutlined />
        会员专属特权
      </h2>

      <div class="privileges-grid">
        <div class="privilege-card">
          <div class="card-icon" style="
              background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%);
            ">
            <FileTextOutlined />
          </div>
          <h3 class="card-title">无限次数</h3>
          <p class="card-desc">无限次数生成高质量文案内容，AI助力创作</p>
          <div class="card-tag">
            <FireOutlined />
            无限次数
          </div>
        </div>

        <div class="privilege-card">
          <div class="card-icon" style="
              background: linear-gradient(135deg, rgb(240, 147, 251) 0%, rgb(245, 87, 108) 100%);
            ">
            <SoundOutlined />
          </div>
          <h3 class="card-title">声音克隆</h3>
          <p class="card-desc">无限次数克隆声音，打造专属音色</p>
          <div class="card-tag">
            <FireOutlined />
            无限次数
          </div>
        </div>

        <div class="privilege-card">
          <div class="card-icon"
            style="background: linear-gradient(135deg, rgb(79, 172, 254) 0%, rgb(0, 242, 254) 100%)">
            <VideoCameraOutlined />
          </div>
          <h3 class="card-title">数字人生成</h3>
          <p class="card-desc">无限次数生成数字人视频，专业品质</p>
          <div class="card-tag">
            <FireOutlined />
            无限次数
          </div>
        </div>

        <div class="privilege-card">
          <div class="card-icon" style="
              background: linear-gradient(135deg, rgb(67, 233, 123) 0%, rgb(56, 249, 215) 100%);
            ">
            <RocketOutlined />
          </div>
          <h3 class="card-title">优先处理</h3>
          <p class="card-desc">任务优先排队处理，更快获得结果</p>
          <div class="card-tag">
            <FireOutlined />
            无限次数
          </div>
        </div>

        <div class="privilege-card">
          <div class="card-icon" style="
              background: linear-gradient(135deg, rgb(250, 112, 154) 0%, rgb(254, 225, 64) 100%);
            ">
            <CustomerServiceOutlined />
          </div>
          <h3 class="card-title">专属客服</h3>
          <p class="card-desc">7x24小时专属客服支持，随时解答疑问</p>
          <div class="card-tag">
            <FireOutlined />
            无限次数
          </div>
        </div>

        <div class="privilege-card">
          <div class="card-icon"
            style="background: linear-gradient(135deg, rgb(48, 207, 208) 0%, rgb(51, 8, 103) 100%)">
            <SafetyCertificateOutlined />
          </div>
          <h3 class="card-title">数据安全</h3>
          <p class="card-desc">本地存储，数据安全可控</p>
          <div class="card-tag">
            <FireOutlined />
            无限次数
          </div>
        </div>
      </div>
    </div>

    <div class="comparison-section">
      <h2 class="section-title">
        <SwapOutlined />
        功能对比
      </h2>
      <div class="comparison-table">
        <a-table :columns="columns" bordered :dataSource="dataSource" :pagination="false">
          <template #normalCell="{ record }">
            <span class="no-permission-text" v-if="record.normal === 'no permission'">无权限</span>
            <span class="close-mark" v-if="record.normal == 'close'">
              <CloseOutlined />
            </span>
          </template>

          <template #vipCell="{ record }">
            <span class="unlimited-text" v-if="record.vip === 'unlimited'">
              <FireOutlined />无限次
            </span>

            <span class="unlimited-text" v-if="record.vip === '4K'">
              <FireOutlined />
              4K画质
            </span>

            <span class="close-mark" v-if="record.vip == 'close'">
              <CloseOutlined />
            </span>

            <span class="check-mark vip" v-if="record.vip === 'check'">
              <CheckCircleOutlined />
            </span>
          </template>
        </a-table>
      </div>
    </div>

    <div class="footer-note">
      <InfoCircleOutlined />
      <span>所有功能均可无限次使用，无任何限制，让您的创作更加自由</span>
    </div>

    <a-modal title="激活VIP会员" v-model:open="upgradeModalOpen" centered @ok="handleOk" class="upgrade-modal-wrap">
      <div class="upgrade-modal-content">
        <div class="modal-icon">
          <CrownOutlined />
        </div>
        <h3 class="modal-title">输入激活码开通会员</h3>
        <p class="modal-desc">请输入您的激活码以开通VIP会员权限</p>
        <div class="modal-features">
          <div class="feature-item">
            <CheckCircleOutlined class="check-icon" />
            <span>无限次数使用所有功能</span>
          </div>
          <div class="feature-item">
            <CheckCircleOutlined class="check-icon" />
            <span>优先处理任务</span>
          </div>
          <div class="feature-item">
            <CheckCircleOutlined class="check-icon" />
            <span>专属客服支持</span>
          </div>
        </div>
        <a-form layout="vertical">
          <a-form-item label="激活码" required>
            <a-input v-model:value="activeCode" placeholder="请输入激活码" />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import {
  CheckCircleOutlined,
  CloseOutlined,
  CrownOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  FireOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SoundOutlined,
  StarOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '../../store/auth'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'

const authStore = useAuthStore()
const userInfo = computed(() => authStore.userInfo)
const vip_expires_at = computed(() => authStore.vip_expires_at || '')
const expiresText = computed(() => dayjs(Number(vip_expires_at.value * 1000)).format('YYYY年MM月DD日'))
const upgradeModalOpen = ref(false)

const openUpgradeModal = () => {
  upgradeModalOpen.value = true
}

// 激活码
const activeCode = ref('')

const leftDay = computed(() => {
  return dayjs(Number(vip_expires_at.value * 1000)).diff(dayjs(), 'day') > 0
    ? dayjs(Number(vip_expires_at.value * 1000)).diff(dayjs(), 'day')
    : 0
})

/**
 * 处理激活按钮点击事件
 */
const handleOk = async () => {
  if (!activeCode.value) {
    message.warning('请输入激活码')
    return
  }
  const res = await authStore.activate(activeCode.value)
  if (res.success) {
    message.success('会员激活成功')
    await authStore.getProfile()
    upgradeModalOpen.value = false
  } else {
    message.error(res.error || '激活失败')
  }
}

const columns = [
  {
    title: '功能',
    dataIndex: 'title',
    key: 'title'
  },
  {
    title: '普通用户',
    dataIndex: 'normal',
    key: 'normal',
    align: 'center',
    slots: { customRender: 'normalCell' }
  },
  {
    title: 'VIP会员',
    dataIndex: 'vip',
    key: 'vip',
    align: 'center',
    slots: { customRender: 'vipCell' }
  }
]

const dataSource = [
  {
    title: '文案生成',
    normal: 'no permission',
    vip: 'unlimited'
  },
  {
    title: '声音克隆',
    normal: 'no permission',
    vip: 'unlimited'
  },
  {
    title: '数字人视频',
    normal: 'no permission',
    vip: 'unlimited'
  },
  {
    title: '视频导出',
    normal: 'no permission',
    vip: '4K'
  },
  {
    title: '优先处理',
    normal: 'close',
    vip: 'check'
  },
  {
    title: '专属客服',
    normal: 'close',
    vip: 'check'
  },
  {
    title: '批量任务',
    normal: 'close',
    vip: 'check'
  },
  {
    title: '数据备份',
    normal: 'close',
    vip: 'check'
  }
]
</script>

<style lang="scss">
.member-center {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg,
      var(--theme-background) 0,
      var(--theme-background-lighter) 100%);
  min-height: 100vh;

  .member-banner {
    background: linear-gradient(135deg, var(--theme-primary) 0, var(--theme-secondary) 100%);
    border-radius: 16px;
    padding: 40px;
    margin-bottom: 40px;
    box-shadow: 0 8px 24px var(--theme-shadow-primary-strongest);
    border: 1px solid var(--theme-border-purple);
    position: relative;
    overflow: hidden;
  }
}

.member-banner:before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, hsla(0, 0%, 100%, 0.1) 0, transparent 70%);
  border-radius: 50%;
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
  position: relative;
  z-index: 1;
}

.banner-left {
  flex: 1;
}

.member-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--theme-overlay-medium);
  padding: 8px 16px;
  border-radius: 20px;
  color: var(--theme-text-primary);
  font-weight: 600;
  font-size: var(--app-font-size-body);
  margin-bottom: 20px;
}

.crown-icon {
  font-size: var(--app-font-size-card-title);
  color: var(--theme-warning);
}

.banner-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin: 0 0 12px 0;
}

.banner-desc {
  font-size: var(--app-font-size-card-title);
  color: var(--theme-text-secondary);
  margin: 0 0 30px 0;
}

.member-info {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.info-card {
  background: var(--theme-overlay-medium);
  padding: 16px 24px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.info-label {
  display: block;
  font-size: var(--app-font-size-meta);
  color: var(--theme-text-secondary);
  margin-bottom: 6px;
}

.info-value {
  display: block;
  font-size: var(--app-font-size-section-title);
  font-weight: 600;
  color: var(--theme-text-primary);
}

.info-value.highlight {
  color: var(--theme-warning);
}

.user-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: var(--app-font-size-meta);
  color: var(--theme-text-secondary);
}

.stat-value {
  font-size: var(--app-font-size-section-title);
  font-weight: 600;
  color: var(--theme-text-primary);
}

.renew-btn,
.upgrade-btn {
  height: 48px;
  padding: 0 32px;
  font-size: var(--app-font-size-body);
  font-weight: 600;
  border-radius: 24px;
  border: none;
  box-shadow: 0 4px 12px var(--theme-shadow-primary);
}

.upgrade-btn {
  background: linear-gradient(135deg, var(--theme-warning) 0, var(--theme-accent) 100%);
  color: var(--theme-primary-dark);
}

.renew-btn {
  background: var(--theme-overlay-medium);
  color: var(--theme-text-primary);
  border: 2px solid var(--theme-text-primary);
}

.banner-right {
  flex-shrink: 0;
}

.feature-showcase {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.showcase-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--theme-overlay-medium);
  padding: 12px 20px;
  border-radius: 8px;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-secondary);
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.check-icon {
  font-size: var(--app-font-size-section-title);
  color: var(--theme-success);
}

.privileges-section {
  margin-bottom: 50px;
}

.section-title {
  font-size: var(--app-font-size-page-title);
  font-weight: 600;
  color: var(--theme-text-tertiary);
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title .anticon {
  color: var(--theme-warning);
  font-size: var(--app-font-size-page-title);
}

.privileges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.privilege-card {
  background: linear-gradient(135deg,
      var(--theme-background-lighter) 0,
      var(--theme-background-light) 100%);
  border: 1px solid var(--theme-border-purple);
  border-radius: 12px;
  padding: 30px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.privilege-card:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--card-gradient);
  opacity: 0;
  transition: opacity 0.3s;
}

.privilege-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px var(--theme-shadow-primary-strong);
  border-color: var(--theme-border-purple-light);
}

.privilege-card:hover:before {
  opacity: 1;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--app-font-size-page-title);
  color: var(--theme-text-primary);
  margin-bottom: 20px;
}

.card-title {
  font-size: var(--app-font-size-card-title);
  font-weight: 600;
  color: var(--theme-text-tertiary);
  margin: 0 0 10px 0;
}

.card-desc {
  font-size: var(--app-font-size-body);
  color: var(--theme-text-gradient-purple);
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.card-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--theme-success);
  color: var(--theme-text-primary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: var(--app-font-size-meta);
  font-weight: 500;
}

.comparison-section {
  margin-bottom: 40px;
}

.comparison-table {
  background: linear-gradient(135deg,
      var(--theme-background-lighter) 0,
      var(--theme-background-light) 100%);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--theme-border-purple);
}

.comparison-table .ant-table {
  font-size: var(--app-font-size-secondary);
  background: transparent;
}

.comparison-table .ant-table-thead>tr>th {
  background: var(--theme-scrollbar-track-light);
  font-weight: 600;
  font-size: var(--app-font-size-body);
  color: var(--theme-text-tertiary);
  border-color: var(--theme-border);
}

.comparison-table .ant-table-tbody>tr>td {
  background: transparent !important;
  color: var(--theme-text-tertiary);
  border-color: var(--theme-border);
}

.comparison-table .ant-table-tbody>tr:hover>td {
  background: var(--theme-overlay-purple-strong) !important;
}

.check-mark {
  color: var(--theme-success);
  font-size: var(--app-font-size-section-title);
}

.check-mark.vip {
  color: var(--theme-warning);
  font-size: var(--app-font-size-section-title);
}

.close-mark {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-section-title);
}

.limit-text {
  color: var(--theme-text-disabled);
  font-size: var(--app-font-size-body);
}

.no-permission-text {
  color: var(--theme-error);
  font-size: var(--app-font-size-body);
  font-weight: 500;
}

.unlimited-text {
  color: var(--theme-success);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: var(--app-font-size-secondary);
}

.footer-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: var(--theme-overlay-purple-medium);
  border: 1px solid var(--theme-border-purple-light);
  border-radius: 8px;
  padding: 16px;
  color: var(--theme-primary-light);
  font-size: var(--app-font-size-body);
}

.footer-note .anticon {
  font-size: var(--app-font-size-card-title);
}

@media (max-width: 1024px) {
  .banner-content {
    flex-direction: column;
  }

  .banner-right {
    width: 100%;
  }

  .privileges-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .member-banner {
    padding: 30px 20px;
  }

  .banner-title {
    font-size: var(--app-font-size-page-title);
  }

  .banner-desc {
    font-size: var(--app-font-size-body);
  }

  .member-info {
    flex-direction: column;
    gap: 12px;
  }

  .feature-showcase,
  .privileges-grid {
    grid-template-columns: 1fr;
  }
}

.upgrade-modal-content {
  text-align: center;
  padding: 20px 0;
}

.modal-icon {
  font-size: 64px;
  color: var(--theme-warning);
  margin-bottom: 20px;
}

.modal-title {
  font-size: var(--app-font-size-page-title);
  font-weight: 600;
  color: var(--theme-text-tertiary);
  margin: 0 0 12px 0;
  text-align: center;
  width: 100%;
  color: var(--theme-text);
}

.modal-desc {
  font-size: var(--app-font-size-body);
  color: var(--theme-text-gradient-purple);
  margin: 0 0 30px 0;
  line-height: 1.6;
}

.modal-features {
  background: var(--theme-overlay-purple-light);
  border: 1px solid var(--theme-border-purple-light);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;

  .feature-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    font-size: var(--app-font-size-secondary);
    color: var(--theme-text);
  }
}

.feature-item:last-child {
  margin-bottom: 0;
}

.feature-item .check-icon {
  color: var(--theme-success);
  font-size: var(--app-font-size-body);
}

.modal-close-btn {
  height: 48px;
  font-size: var(--app-font-size-body);
  font-weight: 600;
  border-radius: 8px;
}
</style>
