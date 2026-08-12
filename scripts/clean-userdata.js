/**
 * 清理 aigc-client electron 用户数据
 * 删除 C:\Users\<user>\AppData\Roaming\aigc-client
 *
 * 使用: node scripts/clean-userdata.js
 */
const fs = require('fs')
const os = require('os')
const path = require('path')

const TARGET_DIR = path.join(os.homedir(), 'AppData', 'Roaming', 'aigc-client')

function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(2)} ${units[i]}`
}

/**
 * 递归计算目录大小
 */
function getDirSize(dir) {
  let total = 0
  let count = 0
  if (!fs.existsSync(dir)) return { size: 0, count: 0 }
  const walk = (d) => {
    const entries = fs.readdirSync(d, { withFileTypes: true })
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.isFile()) {
        total += fs.statSync(p).size
        count++
      }
    }
  }
  walk(dir)
  return { size: total, count }
}

/**
 * 递归删除目录(同步)
 */
function rmDir(dir) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      rmDir(p)
      fs.rmdirSync(p)
    } else {
      fs.unlinkSync(p)
    }
  }
  fs.rmdirSync(dir)
}

console.log('========================================')
console.log('  清理 aigc-client 用户数据')
console.log('========================================')
console.log(`目标目录: ${TARGET_DIR}`)

if (!fs.existsSync(TARGET_DIR)) {
  console.log('✅ 目录不存在,无需清理')
  process.exit(0)
}

// 计算大小
const { size, count } = getDirSize(TARGET_DIR)
console.log(`当前大小: ${formatSize(size)}  (${count} 个文件)`)
console.log('')
console.log('⚠️  警告:此操作将删除该目录下所有内容,包括:')
console.log('   - 数据库(SQLite .db 文件)')
console.log('   - 用户配置、登录状态、cookies')
console.log('   - 日志文件')
console.log('   - 浏览器缓存(Electron / Chromium)')
console.log('')

// 默认自动 yes(脚本模式)
const autoYes = process.argv.includes('--yes') || process.argv.includes('-y')

let confirmed = autoYes
if (!autoYes) {
  // 简单的同步输入
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })
  readline.question('确认删除? (yes/no): ', (answer) => {
    readline.close()
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      doDelete()
    } else {
      console.log('已取消')
    }
  })
} else {
  doDelete()
}

function doDelete() {
  console.log('')
  console.log('开始删除...')
  try {
    rmDir(TARGET_DIR)
    console.log('✅ 删除成功')
    console.log(`已释放: ${formatSize(size)}`)
  } catch (e) {
    console.error(`❌ 删除失败: ${e.message}`)
    // 部分文件可能因占用而无法删除(如正在运行的进程持有句柄)
    console.error('提示:请先关闭 aigc-client 应用,然后重试')
    process.exit(1)
  }
}
