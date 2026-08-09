// 统一注册所有主进程 IPC 通道
// 每个模块导出一个 register(ipcMain, deps) 函数；这里顺序调用。
import { registerDbIpc } from './db.ipc'
import { registerAccountIpc } from './account.ipc'
import { registerFileIpc } from './file.ipc'
import { registerVideoIpc } from './video.ipc'
import { registerCoverIpc } from './cover.ipc'
import { registerPublishIpc } from './publish.ipc'
import { registerVideoParserIpc } from './videoParser.ipc'
import { registerVideoRenderIpc } from './videoRender.ipc'
import { registerConfigIpc } from './config.ipc'
import { registerLlmIpc } from './llm.ipc'
import { registerPathIpc } from './path.ipc'
import { registerPythonIpc } from './python.ipc'
import { registerCryptoIpc } from './crypto.ipc'
import { registerAudioIpc } from './audio.ipc'
import { registerShellIpc } from './shell.ipc'
import { registerVideoCompositionIpc } from './videoComposition.ipc'
import { registerIpBrainIpc } from './ipBrain.ipc'

import { registerOssIpc } from './oss.ipc'
import { registerFontIpc } from './font.ipc'
import { registerMaterialIpc } from './material.ipc'
import { registerVectorIpc } from './vector.ipc'
import { registerTaskIpc } from './task.ipc'
import { registerOemIpc } from './oem.ipc'
import { registerCloudIpc } from './cloud.ipc'
import { registerLoggerIpc } from './logger.ipc'
import { registerWindowIpc } from './window.ipc'
import { registerUserIpc } from './user.ipc'

/**
 * 一次性注册全部 ipcMain.handle。
 * 调用方只需：
 *   import { registerAllIpc } from './ipc'
 *   registerAllIpc(ipcMain)
 */
export function registerAllIpc(ipcMain) {
  registerDbIpc(ipcMain)
  registerVectorIpc(ipcMain)
  registerLoggerIpc(ipcMain)
  registerCloudIpc(ipcMain)
  registerWindowIpc(ipcMain)
  registerAccountIpc(ipcMain)
  registerVideoCompositionIpc(ipcMain)
  registerCryptoIpc(ipcMain)
  registerUserIpc(ipcMain)
  registerFileIpc(ipcMain)
  registerVideoIpc(ipcMain)
  registerCoverIpc(ipcMain)
  registerPathIpc(ipcMain)
  registerPublishIpc(ipcMain)
  registerMaterialIpc(ipcMain)
  registerVideoParserIpc(ipcMain)
  registerVideoRenderIpc(ipcMain)
  registerConfigIpc(ipcMain)
  registerLlmIpc(ipcMain)
  registerOssIpc(ipcMain)

  registerPythonIpc(ipcMain)

  registerAudioIpc(ipcMain)
  registerShellIpc(ipcMain)
  registerIpBrainIpc(ipcMain)
  registerTaskIpc(ipcMain)
  registerOemIpc(ipcMain)

  registerFontIpc(ipcMain)
}

export {
  registerDbIpc,
  registerAccountIpc,
  registerTaskIpc,
  registerFileIpc,
  registerVideoIpc,
  registerCoverIpc,
  registerPathIpc,
  registerCryptoIpc,
  registerOemIpc,
  registerPublishIpc,
  registerVideoParserIpc,
  registerConfigIpc,
  registerLlmIpc,
  registerPythonIpc,
  registerAudioIpc,
  registerVideoRenderIpc,
  registerShellIpc,
  registerIpBrainIpc,
  registerOssIpc,
  registerFontIpc,
  registerVideoCompositionIpc
}
