<template>
  <div>
    <div>
      <div>数据备份与恢复</div>
      <a-button @click="handleBackup"> 备份数据 </a-button>
      <a-button @click="handleRestore"> 恢复数据 </a-button>
    </div>

    <div>
      <div class="">清除缓存</div>
      <a-button @click="handleClearCache">
        <ClearOutlined />
        清除缓存
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ClearOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const handleClearCache = async () => {
  await window.api.file.clearCache()
}

const handleBackup = async () => {
  const res = await window.api.file.selectDirectory({
    title: '选择备份文件保存位置',
    defaultPath: ''
  })
  if (res.success && !res.canceld) {
    // 动态生成时间戳，避免 Windows 文件名非法字符（:）
    const ts = dayjs().format('YYYY-MM-DD_HH-mm-ss')
    const dbPath = pathJoin(res.data.filesPaths[0], `aigc_client_backup_${ts}.db`)
    await window.api.db.backup(dbPath)
  }
}

const handleRestore = async () => {
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
  }
}
</script>

<style lang="scss" scoped></style>
