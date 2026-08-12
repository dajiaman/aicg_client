<template>
  <div class="data-tab">
    <div class="block">
      <div class="block-title">数据备份与恢复</div>
      <a-button @click="handleBackup" :loading="backupLoading" type="primary">
        <CloudDownloadOutlined />
        备份数据
      </a-button>
      <p class="block-desc">将当前所有数据备份到本地文件</p>
      <a-button @click="handleRestore" :loading="restoreLoading">
        <CloudUploadOutlined />
        恢复数据
      </a-button>
      <p class="block-desc">从本地文件恢复所有数据</p>
    </div>

    <div class="block">
      <div class="block-title">清除缓存</div>
      <a-button @click="handleClearCache">
        <ClearOutlined />
        清除缓存
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ClearOutlined, CloudDownloadOutlined, CloudUploadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ref } from 'vue'

const clearCacheLoading = ref(false)
const backupLoading = ref(false)
const restoreLoading = ref(false)

/**
 * 清除缓存
 */
const handleClearCache = async () => {
  try {
    clearCacheLoading.value = true
    await window.api.file.clearCache()
    message.success('缓存清除成功')
  } finally {
    clearCacheLoading.value = false
  }
}


/**
 * 备份数据
 */
const handleBackup = async () => {
  try {
    backupLoading.value = true

    const res = await window.api.file.selectDirectory({
      title: '选择备份文件保存位置',
      defaultPath: ''
    })
    if (res.success && !res.canceld) {
      // 动态生成时间戳，避免 Windows 文件名非法字符（:）
      const ts = dayjs().format('YYYY-MM-DD_HH-mm-ss')
      const dbPath = pathJoin(res.data.filesPaths[0], `aigc_client_backup_${ts}.db`)
      await window.api.db.backup(dbPath)
      message.success('备份备份成功')
    }
  } catch (error) {
    message.error('备份失败')
  } finally {
    backupLoading.value = false
  }
}

/**
 * 恢复数据
 */
const handleRestore = async () => {
  restoreLoading.value = true
  try {

    const res = await window.api.file.selectFile({
      title: '选择备份文件',
      filters: [
        {
          name: '数据库备份文件',
          extensions: ['db']
        }
      ]
    })


    if (res.success && !res.canceld) {
      const dbPath = res.data.filePaths[0]
      await window.api.db.restore(dbPath)
      message.success('恢复恢复成功')
    }
  } catch (error) {
    message.error('恢复失败')
  } finally {
    restoreLoading.value = false
  }

}
</script>

<style lang="scss" scoped>
.data-tab {
  display: flex;
  flex-direction: column;
  gap: 28px; // 块与块之间的间距
  padding: 4px 0;
}

.block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px; // 块内元素之间的间距
}

.block-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, rgba(255, 255, 255, 0.88)); // 与全局主题对齐
  margin-bottom: 2px;
}

.block-desc {
  font-size: 12px; // 与其他 tab 一致(text-xs)
  color: var(--text-secondary, rgba(255, 255, 255, 0.45));
  line-height: 1.5;
  margin: 0;
}
</style>
