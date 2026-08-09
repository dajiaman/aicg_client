import { getChromaDbInfo } from '../database/chroma'
import { models } from '../database/services'
import logger from '../log'
import { vectorizeMaterial } from '../utils/chromaUtil'

/**
 * 单 embedder 复用（DefaultEmbeddingFunction 内部会下载 ONNX 模型，复用能省一次加载）
 */
let cachedEmbedder = null
function getEmbedder() {
  if (!cachedEmbedder) cachedEmbedder = new DefaultEmbeddingFunction()
  return cachedEmbedder
}

export function registerVectorIpc(ipcMain) {
  logger.info('registerVectorIpc')

  /**
   * 初始化向量服务
   */
  ipcMain.handle('vector:init', async (_, options = {}) => {
    logger.info('[vector:init]', options)
  })

  /**
   * 向量化单条素材
   * @param {string} text 素材描述文本
   * @param {object} meta 素材元数据（含 materialId / fileName / filePath / description / duration / mediaType / categoryId / fileSize / createdTime 等）
   * @returns {Promise<{success: boolean, data?: {vector_id: string, collection: string}, message?: string}>}
   *
   *   - 默认写入 collection 'material_embeddings'
   *   - 默认距离函数 'cosine'
   *   - text 截断到 8000 字符
   *   - vector_id 优先使用 meta.materialId；缺失时自动 uuid
   *   - meta 的所有字段都会原样写入 chroma metadata（用于后续 where 过滤检索）
   */
  ipcMain.handle('vector:embed', async (_, text, meta = {}) => {
    logger.info('[vector:embed] text:', text, 'meta:', meta)
    try {
      // 1) 校验 text
      const raw = String(text ?? '').trim()
      if (!raw) {
        return { success: false, message: '向量化文本不能为空' }
      }

      const materialId = String(meta.materialId)
      if (!materialId) {
        return { success: false, message: '向量化素材 ID 不能为空' }
      }

      const material = await models.material.get(materialId)
      if (!material) {
        return { success: false, message: '素材不存在' }
      }

      const res = await vectorizeMaterial(material)

      return res;
    } catch (error) {
      logger.error('[vector:embed] error:', error?.message || error)
      return { success: false, error: error?.message || '向量化失败' }
    }
  })

  /**
   * 向量检索：返回与 query 最相似的 TopK 条目

  /**
   * 向量检索：返回与 query 最相似的 TopK 条目
   * @param {string} query
   * @param {object} options  { collection,where, whereDocument }
   * @returns {Promise<{success: boolean, data?: {ids, documents, metadatas, distances}}>}
   */
  ipcMain.handle('vector:search', async (_, query, topK, options = {}) => {
    logger.info('[vector:search]', query, topK, options)
    try {
      const raw = String(query ?? '').trim()
      if (!raw) return { success: false, message: '检索 query 不能为空' }

      const chromaInfo = await getChromaDbInfo()
      if (!chromaInfo || !chromaInfo.running) {
        return { success: false, message: '向量服务未运行' }
      }

      const client = getChromaClient(chromaInfo.host, chromaInfo.port, chromaInfo.baseUrl)
      const collectionName = normalizeCollection(options.collection)
      const collection = await client.getCollection({
        name: collectionName,
        embeddingFunction: getEmbedder()
      })

      const result = await collection.query({
        queryTexts: [raw],
        nResults: topK,
        where: options.where,
        whereDocument: options.whereDocument
      })

      // 0.4+ API：扁平数组 + 双层结构（queryTexts × nResults）
      const ids = result.ids?.[0] || []
      const documents = result.documents?.[0] || []
      const metadatas = result.metadatas?.[0] || []
      const distances = result.distances?.[0] || []

      return {
        success: true,
        data: { vector_ids: ids, documents, metadatas, distances, count: ids.length }
      }
    } catch (error) {
      logger.error('[vector:search] 失败:', error?.message || error)
      return { success: false, error: error?.message || '检索失败' }
    }
  })

  /**
   * 删除向量
   * @param {string} id
   * @param {object} options  { collection }
   */
  ipcMain.handle('vector:delete', async (_, id, options = {}) => {
    logger.info('[vector:delete]', id, options)
    try {
      const chromaInfo = await getChromaDbInfo()
      if (!chromaInfo || !chromaInfo.running) {
        return { success: false, message: '向量服务未运行' }
      }

      const client = getChromaClient(chromaInfo.host, chromaInfo.port, chromaInfo.baseUrl)
      const collectionName = normalizeCollection(options.collection)
      const collection = await client.getCollection({
        name: collectionName,
        embeddingFunction: getEmbedder()
      })

      await collection.delete({ ids: [String(id)] })

      return { success: true, data: { vector_id: id, collection: collectionName } }
    } catch (error) {
      logger.error('[vector:delete] 失败:', error?.message || error)
      return { success: false, error: error?.message || '删除失败' }
    }
  })
}
