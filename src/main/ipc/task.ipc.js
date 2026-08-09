import { models } from '../database/services'
import logger from '../log'
import fs from 'fs'

export function registerTaskIpc(ipcMain) {
  /**
   * 创建任务
   */
  ipcMain.handle('task:create', async (_, task) => {
    logger.info('[task:create]', JSON.stringify(task))

    try {
      const { steps } = task
      const res = await models.task.create(task)

      Object.keys(steps).forEach(async (key) => {
        await models.taskSteps.create({
          task_id: res.id,
          step_name: key,
          status: steps[key].status
        })
      })

      return { success: true, data: res }
    } catch (error) {
      logger.error('[task:create]', error)
      return { success: false, error: '创建任务失败' }
    }
  })

  /**
   * 获取任务列表
   */
  ipcMain.handle('task:list', async (_, options) => {
    logger.info('[task:list]', JSON.stringify(options))
    const res = models.task.list(options)
    return { success: true, data: res }
  })

  /**
   * 获取任务详情
   */
  ipcMain.handle('task:detail', async (_, id) => {
    logger.info('[task:detail]', id)

    const taskData = await models.task.get(id)
    if (!taskData) {
      return { success: false, error: '任务不存在' }
    }

    const steps = await models.taskSteps.listByTask(id)
    return {
      success: true,
      data: {
        task: taskData,
        steps: steps
      }
    }
  })

  /**
   * 更新任务状态
   */
  ipcMain.handle('task:update-status', async (_, id, status, progress, result, error) => {
    logger.info('[task:update-status]', id, status, progress, result, error)
    return { success: true }
  })

  /**
   * 更新任务数据
   */
  ipcMain.handle('task:update-data', async (_, params) => {
    try {
      models.task.update(params.taskId, {
        ...params
      })
      // // 更新任务步骤数据
      if (params['stepUpdate'] !== undefined) {
        const stepUpdate = params['stepUpdate']
        logger.info('[task:update-data]', stepUpdate)
        models.taskSteps.upsert({
          taskId: params.taskId,
          task_id: params.taskId,
          step_name: stepUpdate.name,
          status: stepUpdate.status ?? 'pending',
          output_data: JSON.stringify(stepUpdate.data) ?? null,
          error_message: stepUpdate.error ? JSON.stringify(stepUpdate.error) : '',
          started_at: stepUpdate.status === 'processing' ? new Date().toISOString() : null,
          completed_at: stepUpdate.status == 'success' ? new Date().toISOString() : null
        })
      }
      return { success: true }
    } catch (error) {
      logger.error('[task:update-data]', error)
      return { success: false, error: '更新任务数据失败' }
    }
  })

  /**
   * 删除任务
   */
  ipcMain.handle('task:delete', async (_, id) => {
    logger.info('[task:delete]', id)

    try {
      models.task.delete(id)
      models.taskSteps.deleteByTask(id)
      return { success: true }
    } catch (error) {
      logger.error('[task:delete]', error)
      return { success: false, error: '删除任务失败' }
    }
  })

  /**
   * 获取任务统计
   */
  ipcMain.handle('task:stats', async () => {
    logger.info('[task:stats]')

    const stats = {
      completed: 0,
      failed: 0,
      pending: 0,
      processing: 0,
      total: 0
    }

    // 所有数量
    const total = await models.task.count()
    stats.total = total

    // 已完成数量
    const completed = await models.task.count({ status: 'completed' })
    stats.completed = completed

    // 失败数量
    const failed = await models.task.count({ status: 'failed' })
    stats.failed = failed

    // 待处理数量
    const pending = await models.task.count({ status: 'pending' })
    stats.pending = pending

    // 处理中数量
    const processing = await models.task.count({ status: 'processing' })
    stats.processing = processing

    return { success: true, data: stats }
  })

  /**
   * 启动任务执行器
   */
  ipcMain.handle('task:start-executor', async () => {
    logger.info('[task:start-executor]')
    return { success: true }
  })

  /**
   * 停止任务执行器
   */
  ipcMain.handle('task:stop-executor', async () => {
    logger.info('[task:stop-executor]')
    return { success: true }
  })

  /**
   * 获取任务执行器状态
   */
  ipcMain.handle('task:executor-status', async () => {
    logger.info('[task:executor-status]')
    return { success: true }
  })
}
