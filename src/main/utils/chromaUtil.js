import { ChromaClient } from 'chromadb'
import { models } from '../database/services'
import OpenAI from 'openai'
import { getChromaDbInfo } from '../database/chroma'
import { v4 as uuidv4 } from 'uuid'

/**
 * 火山方舟 doubao-embedding-vision-251215（多模态 embedding，1024 维）
 *
 * 注意：
 *   1) doubao-embedding-vision-* 系列只支持 /v3/embeddings/multimodal 端点，
 *      不支持普通的 /v3/embeddings，会抛 400：
 *      "the requested model ... does not support this api"
 *   2) 250615 之后的版本（包含 251215）支持纯文本输入，input 形如
 *      [ { type: 'text', text: '...' } ]
 *   3) 老版本 doubao-embedding-text-240715 已下线，不要使用
 *
 * 符合 chromadb EmbeddingFunction 规范（仅接受 string[] 输入），
 * 内部把每个 string 转成 {type:'text', text:string} 后调用 multimodal 端点。
 */
class DoubaoEmbeddingFunction {
  constructor(options) {
    this.openai = new OpenAI({
      apiKey: options.apiKey,
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
      timeout: 30000,
      maxRetries: 2
    })
    this.endpointId = options.endpointId || 'doubao-embedding-vision-251215'
    // doubao-embedding-vision-251215 默认 1024 维
    this.dimensions = options.dimensions || 1024
  }

  /**
   * chromadb 强制规范方法
   * @param {string[]} texts
   * @returns {number[][]}
   */
  async generate(texts) {
    // doubao-embedding-vision-* 的 /embeddings/multimodal 端点返回：
    //   { data: { embedding: number[] } }   ← 单条直接 vector，没有数组包装
    //
    // 而 chromadb 协议要求 generate(string[]) → number[][]
    // 所以必须并发循环调用每条，再按输入顺序返回
    const inputs = texts.map((t) => ({ type: 'text', text: String(t ?? '') }))

    const tasks = inputs.map((input) => {
      const body = {
        model: this.endpointId,
        encoding_format: 'float',
        input: [input]
      }
      if (this.dimensions) body.dimensions = this.dimensions
      return this.openai.post('/embeddings/multimodal', { body })
    })

    const results = await Promise.all(tasks)
    // results[i] 是第 i 条的响应：{ data: { embedding: [...] } }
    return results.map((r) => r?.data?.embedding || [])
  }
}

let chromaClient = null
/**
 * 单 embedder
 */
let embeddingFn = null

/**
 * 获取 chroma client
 *
 * chromadb 0.4+ 已经废弃 `path` 参数（每次连接都会打 deprecation 警告），
 * 这里统一使用 host + port 构造客户端；优先使用回环 127.0.0.1，
 * 避免 Windows 上 ECONNREFUSED 0.0.0.0。
 */
export function getChromaClient(info) {
  if (!chromaClient) {
    // 优先 127.0.0.1（回环），其次回落到 info.host
    const host = info && info.host && info.host !== '0.0.0.0' ? info.host : '127.0.0.1'
    const port = info && info.port
    chromaClient = new ChromaClient({ host, port })
  }
  return chromaClient
}

/**
 * 获取 embedder
 */
export async function getEmbedder() {
  if (embeddingFn) return embeddingFn
  const aiConfig = await models.config.getByCategory('ai')
  embeddingFn = new DoubaoEmbeddingFunction({
    apiKey: aiConfig['ai.apiKey'],
    endpointId: 'doubao-embedding-vision-251215', // 多模态，支持纯文本输入
    dimensions: 1024
  })
  return embeddingFn
}

/**
 * 默认 collection 元数据（与历史数据保持一致：cosine 距离）
 */
const DEFAULT_COLLECTION_METADATA = { 'hnsw:space': 'cosine' }

/**
 * 获取或创建素材向量 collection（首次写入自动创建）
 *
 * 使用 getOrCreateCollection 而不是 getCollection，
 * 避免首次访问 collection 不存在时抛 ChromaNotFoundError。
 */
async function getOrCreateMaterialCollection(client, embeddingFn) {
  return client.getOrCreateCollection({
    name: 'material_embeddings',
    embeddingFunction: embeddingFn,
    metadata: DEFAULT_COLLECTION_METADATA
  })
}

/**
 * 仅获取已存在的 collection；不存在时返回 null（不抛错）
 */
async function tryGetMaterialCollection(client, embeddingFn) {
  try {
    return await client.getCollection({
      name: 'material_embeddings',
      embeddingFunction: embeddingFn,
      metadata: DEFAULT_COLLECTION_METADATA
    })
  } catch (e) {
    // ChromaNotFoundError 或 status 404 都视为未创建
    const msg = (e && e.message) || String(e)
    if (/not\s*found|404/i.test(msg)) return null
    // 其它错误仍抛出，避免吞掉真实异常
    throw e
  }
}

/**
 * 素材向量检索
 * @param {string} queryText 用户搜索文本
 * @param {number} limit 返回条数
 * @param {number} scoreThreshold 相似度阈值（余弦距离）
 * @param {object} where 元数据过滤条件
 */
export async function searchMaterial(queryText, limit = 5, scoreThreshold = 0.8, where = null) {
  // 通过向量数据库搜索
  const chromaInfo = await getChromaDbInfo()
  if (!chromaInfo || !chromaInfo.running) {
    return { success: false, message: '向量服务未运行' }
  }

  try {
    const client = getChromaClient(chromaInfo)
    const embeddingFn = await getEmbedder()
    // 检索路径允许 collection 不存在（返回空结果）
    const collection = await tryGetMaterialCollection(client, embeddingFn)
    if (!collection) {
      return { success: true, data: [], count: 0, message: '向量库为空' }
    }

    const queryOption = {
      queryTexts: [queryText],
      nResults: limit
    }

    // 追加元数据过滤（可选）
    if (where) {
      queryOption.where = where
    }

    const rawResult = await collection.query(queryOption)

    // 格式化结果 + 过滤低相似度
    const output = []
    const ids = rawResult.ids[0]
    const distances = rawResult.distances[0]
    const documents = rawResult.documents[0]
    const metadatas = rawResult.metadatas[0]

    for (let i = 0; i < ids.length; i++) {
      const dist = distances[i]
      // cosine距离规则：越接近0 越相似；1代表完全不相关
      // 阈值根据业务调整，一般 0 ~ 0.8 区间保留
      if (dist <= scoreThreshold) {
        output.push({
          vectorId: ids[i],
          distance: dist,
          document: documents[i],
          meta: metadatas[i]
        })
      }
    }

    return output
  } catch (error) {
    console.error('向量检索失败:', error)
    return
  }
}

/**
 * 素材向量化
 * @param {object} material 素材对象
 * @returns {object} 向量化结果
 */
export async function vectorizeMaterial(material) {
  if (!material) {
    return { success: false, error: '素材不存在' }
  }

  if (material.status === 'vectorized') {
    return { success: false, error: '素材已向量化' }
  }

  // 通过向量数据库搜索
  const chromaInfo = await getChromaDbInfo()
  if (!chromaInfo || !chromaInfo.running) {
    return { success: false, error: '向量服务未运行' }
  }

  const client = getChromaClient(chromaInfo)
  const embeddingFn = await getEmbedder()

  // 首次写入应使用 getOrCreateCollection，否则会抛 ChromaNotFoundError
  const collection = await getOrCreateMaterialCollection(client, embeddingFn)

  // 作为向量id
  const vector_id = uuidv4()
  const materialId = String(material.id)

  const descriptionText = [
    `文件名: ${material.file_name}`,
    `描述: ${material.description || '无描述'}`,
    `时长: ${material.duration}秒`
  ].join('\n')

  const metadata = {
    fileName: String(material.file_name),
    description: String(material.description || ''),
    mediaType: material.isImage ? 'image' : 'video',
    categoryId: String(material.category_id)
  }

  const document = truncateText(descriptionText)

  await collection.add({
    ids: [vector_id],
    documents: [document],
    metadatas: [metadata]
  })

  models.material.update(materialId, {
    vector_id: vector_id,
    status: 'vectorized'
  })

  return { success: true, message: '素材向量化成功', data: { vector_id } }
}

/**
 * 简单截断文本，防止超出embedding长度限制
 * @param {string} text
 * @param {number} maxChars 最大字符，保守设2000
 */
function truncateText(text, maxChars = 2000) {
  if (!text) return ''
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars)
}
