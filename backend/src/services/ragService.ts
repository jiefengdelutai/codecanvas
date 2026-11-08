import { Project, Version, ChatMessage } from '../models'

export interface RAGCitation {
  sourceType: 'project' | 'version' | 'chat'
  sourceId: string
  score: number
  snippet: string
}

interface RAGContext {
  projectId?: string
  sessionId?: number
  userId?: number
  topK?: number
}

interface CandidateChunk {
  sourceType: 'project' | 'version' | 'chat'
  sourceId: string
  text: string
  score: number
}

export class RAGService {
  static async answerWithRag(
    question: string,
    context: RAGContext
  ): Promise<{ reply: string; citations: RAGCitation[]; meta: { strategy: string; topK: number; retrievedCount: number } }> {
    const topK = context.topK ?? 3
    const chunks = await this.retrieveRelevantChunks(question, context, topK)

    if (chunks.length === 0) {
      return {
        reply: '未在当前项目知识库中检索到足够信息。请提供更具体的问题，或先保存/同步项目与版本内容后再试。',
        citations: [],
        meta: {
          strategy: 'keyword-retrieval-v1',
          topK,
          retrievedCount: 0,
        },
      }
    }

    const citations: RAGCitation[] = chunks.map((chunk) => ({
      sourceType: chunk.sourceType,
      sourceId: chunk.sourceId,
      score: Number(chunk.score.toFixed(4)),
      snippet: this.shorten(chunk.text, 180),
    }))

    const evidenceText = chunks
      .map((chunk, index) => `[${index + 1}] ${this.shorten(chunk.text, 260)}`)
      .join('\n\n')

    const reply = [
      '基于项目内检索结果，我给出的建议如下：',
      evidenceText,
      '',
      '你可以继续追问“请按这段代码直接给出修改后的 JSON（html/css/js）”，我会基于同一批上下文继续细化。',
    ].join('\n')

    return {
      reply,
      citations,
      meta: {
        strategy: 'keyword-retrieval-v1',
        topK,
        retrievedCount: chunks.length,
      },
    }
  }

  private static async retrieveRelevantChunks(
    question: string,
    context: RAGContext,
    topK: number
  ): Promise<CandidateChunk[]> {
    const keywords = this.extractKeywords(question)
    if (keywords.length === 0) return []

    const candidates: CandidateChunk[] = []

    if (context.projectId) {
      const project = await Project.findByPk(context.projectId, {
        attributes: ['id', 'name', 'description', 'content', 'tags'],
      })

      if (project) {
        const contentChunks = this.chunkText(this.serializeProject(project), 320)
        contentChunks.forEach((text) => {
          const score = this.computeKeywordScore(text, keywords)
          if (score > 0) {
            candidates.push({
              sourceType: 'project',
              sourceId: String(project.id),
              text,
              score,
            })
          }
        })
      }

      const versions = await Version.findAll({
        where: { projectId: context.projectId },
        attributes: ['id', 'content', 'description', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 6,
      })

      versions.forEach((version) => {
        const rawText = `${version.description || ''}\n${version.content || ''}`
        const chunks = this.chunkText(rawText, 260)
        chunks.forEach((text) => {
          const score = this.computeKeywordScore(text, keywords)
          if (score > 0) {
            candidates.push({
              sourceType: 'version',
              sourceId: String(version.id),
              text,
              score,
            })
          }
        })
      })
    }

    if (context.sessionId) {
      const messages = await ChatMessage.findAll({
        where: { sessionId: context.sessionId },
        attributes: ['id', 'content', 'type', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 20,
      })

      messages.forEach((msg) => {
        const text = `${msg.type}: ${msg.content || ''}`
        const score = this.computeKeywordScore(text, keywords)
        if (score > 0) {
          candidates.push({
            sourceType: 'chat',
            sourceId: String(msg.id),
            text,
            score,
          })
        }
      })
    }

    candidates.sort((a, b) => b.score - a.score)
    return candidates.slice(0, topK)
  }

  private static extractKeywords(text: string): string[] {
    return Array.from(
      new Set(
        text
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s_-]/gu, ' ')
          .split(/\s+/)
          .map((word) => word.trim())
          .filter((word) => word.length >= 2)
      )
    ).slice(0, 12)
  }

  private static computeKeywordScore(text: string, keywords: string[]): number {
    const lower = text.toLowerCase()
    let score = 0

    keywords.forEach((kw) => {
      if (lower.includes(kw)) {
        const occurrences = lower.split(kw).length - 1
        score += 1 + Math.min(occurrences, 4) * 0.3
      }
    })

    return score
  }

  private static chunkText(text: string, chunkSize = 300): string[] {
    const normalized = (text || '').replace(/\s+/g, ' ').trim()
    if (!normalized) return []

    const chunks: string[] = []
    for (let i = 0; i < normalized.length; i += chunkSize) {
      chunks.push(normalized.slice(i, i + chunkSize))
    }
    return chunks
  }

  private static serializeProject(project: any): string {
    const sections: string[] = []
    if (project.name) sections.push(`项目名: ${project.name}`)
    if (project.description) sections.push(`项目描述: ${project.description}`)
    if (project.tags) sections.push(`项目标签: ${project.tags}`)

    const rawContent = project.content || ''
    try {
      const parsed = JSON.parse(rawContent)
      const html = parsed.html || ''
      const css = parsed.css || ''
      const js = parsed.js || parsed.javascript || ''
      sections.push(`HTML: ${html}`)
      sections.push(`CSS: ${css}`)
      sections.push(`JavaScript: ${js}`)
    } catch {
      sections.push(`项目内容: ${rawContent}`)
    }

    return sections.join('\n')
  }

  private static shorten(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text
    return `${text.slice(0, maxLen)}...`
  }
}

export default RAGService
