# AIGC Client

> 一站式 AIGC 内容生产桌面客户端 —— 集成文案改写、标题封面生成、数字人口播、语音克隆、视频剪辑、多平台一键发布。

## 功能特性

- ✍️ **文案改写** — AI 改写口语化脚本，降低违规风险
- 🎯 **标题 / 封面生成** — AI 自动生成发布标题、描述、标签、封面文案
- ⚖️ **内容审核** — 自动检测违规词，支持一键替换
- 🎤 **语音克隆** — 上传样本音频，训练专属声音模型
- 🧑 **数字人口播** — 数字人视频 + AI 配音生成口播视频
- 🎬 **视频剪辑工作台** — 字幕 / 背景音乐 / 画中画 / 模块化模板
- 🚀 **多平台一键发布** — 抖音 / 快手 / 小红书 / 微信视频号
- 💾 **数据备份与恢复** — 一键备份 SQLite 数据库

## 技术栈

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron 32+ |
| 前端框架 | Vue 3 + Pinia + Vue Router |
| UI 组件 | Ant Design Vue 4 |
| 构建工具 | electron-vite + Vite 7 |
| 样式 | Sass + Tailwind CSS |
| 数据库 | SQLite (better-sqlite3) |
| AI / LLM | OpenAI SDK |
| 视频处理 | ffmpeg + sharp + fontkit |

## 环境要求

- Node.js **>= 20.x**
- pnpm **>= 8.x** 或 npm **>= 10.x**
- Windows 10+ / macOS 12+ / Ubuntu 22.04+
- 已内置 ffmpeg 二进制 (`resources/ffmpeg/`),无需额外安装

## 快速开始

### 安装依赖

```bash
pnpm install
# 或
npm install
```

### 开发模式

```bash
pnpm dev
# 或
npm run dev
```

启动后会自动打开 Electron 窗口,主进程 + 渲染进程均支持热更新。

### 打包构建

```bash
# Windows (生成 .exe 安装包)
pnpm build:win

# macOS (生成 .dmg)
pnpm build:mac

# Linux (生成 .AppImage / .deb)
pnpm build:linux

# 仅打包不安装(快速验证)
pnpm justpack
```

构建产物位于 `release/` 或 `dist/` 目录。

## 项目结构

```
aigc-client/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── ipc/                 # IPC 通道（*.ipc.js）
│   │   ├── services/            # 业务服务层
│   │   ├── database/            # SQLite 封装 + models
│   │   ├── publish/             # 多平台发布实现
│   │   ├── login/               # 各平台登录
│   │   ├── utils/               # 工具函数
│   │   └── index.js             # 主进程入口
│   ├── preload/                 # preload 脚本（暴露 window.api）
│   └── renderer/                # Vue 渲染进程
│       ├── src/
│       │   ├── views/           # 页面（home / voice / avatar / ...）
│       │   ├── components/      # 公共组件
│       │   ├── store/           # Pinia store
│       │   ├── hooks/           # 组合式函数
│       │   └── router/          # 路由
├── resources/
│   ├── ffmpeg/                  # 内置 ffmpeg / ffprobe
│   ├── fonts/                   # 字体资源
│   └── build/                   # 打包配置 + 图标
├── build/                       # electron-builder 配置
├── electron.vite.config.ts      # electron-vite 配置
└── package.json
```

## 数据存储

- **数据库**:`<userData>/aigc_client.db`
  - accounts / voices / avatars / materials / tasks / config 等表
  - 备份：`设置 → 数据管理 → 备份数据`（生成 VACUUM INTO 一致性快照）
- **输出目录**:可在 `设置 → 通用 → 输出路径` 自定义
- **临时文件**: `<appRoot>/temp/`（封面抽帧 / 视频裁剪 / 字体副本）
- **缓存清理**: `设置 → 数据管理 → 清除缓存`

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发模式 |
| `pnpm build` | 构建主进程 + 渲染进程 |
| `pnpm build:win` | 打包 Windows 安装包 |
| `pnpm build:mac` | 打包 macOS DMG |
| `pnpm build:linux` | 打包 Linux 安装包 |
| `pnpm justpack` | 仅打包不安装（快速验证） |
| `pnpm lint` | ESLint 检查 |
| `pnpm format` | Prettier 格式化 |

## 开发约定

- **IPC 通信**:统一在 `src/main/ipc/` 注册,格式 `ipcMain.handle('module:action', ...)`
- **数据库表**:在 `src/main/database/index.js` 的 `createTables()` 中定义
- **平台账号**:`src/main/database/services.js` 的 `models.platform_accounts`
- **错误处理**:主进程所有 IPC 返回 `{ success, data?, error? }`
- **日志**:`electron-log` 自动写入 `<userData>/logs/`

## 许可证

[MIT](./LICENSE) © dajiaman

## 反馈

提交 Issue 或 PR: <https://github.com/dajiaman/aicg_client>
