import { Template, Project } from '../models'

interface RecommendContext {
  userId?: number
  keyword?: string
  category?: string
  projectId?: string
}

export interface TemplateScoreBreakdown {
  templateId: string
  hot: number
  fresh: number
  relevance: number
  preference: number
  projectContext: number
  totalScore: number
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 模板推荐服务（V1）
 * 放置点A：在 GET /api/templates 内部进行重排
 */
export class TemplateRecommendService {
  private static readonly WEIGHTS = {
    hot: 0.3,
    fresh: 0.15,
    relevance: 0.2,
    preference: 0.1,
    projectContext: 0.25,
  }

  static async rankTemplates(
    templates: Template[],
    context: RecommendContext
  ): Promise<Template[]> {
    const result = await this.rankTemplatesWithScores(templates, context)
    return result.templates
  }

  static async rankTemplatesWithScores(
    templates: Template[],
    context: RecommendContext
  ): Promise<{ templates: Template[]; scores: TemplateScoreBreakdown[] }> {
    if (templates.length <= 1) {
      return {
        templates,
        scores: templates.map((template) => ({
          templateId: template.id,
          hot: templates.length === 1 ? 1 : 0,
          fresh: 1,
          relevance: 0,
          preference: 0,
          projectContext: 0,
          totalScore: templates.length === 1 ? 1 : 0,
        })),
      }
    }

    const maxDownloads = Math.max(...templates.map((t) => t.downloads || 0), 1)

    const userTagProfile = context.userId
      ? await this.getUserTagProfile(context.userId)
      : new Set<string>()

    const projectContextTags = context.projectId
      ? await this.getProjectContextTags(context.projectId)
      : new Set<string>()

    const scored = templates.map((template) => {
      const hot = this.calcHotScore(template.downloads || 0, maxDownloads)
      const fresh = this.calcFreshScore(template.createdAt)
      const relevance = this.calcRelevanceScore(template, context)
      const preference = this.calcPreferenceScore(template, userTagProfile)
      const projectContext = this.calcProjectContextScore(template, projectContextTags)

      const totalScore =
        this.WEIGHTS.hot * hot +
        this.WEIGHTS.fresh * fresh +
        this.WEIGHTS.relevance * relevance +
        this.WEIGHTS.preference * preference +
        this.WEIGHTS.projectContext * projectContext

      return {
        template,
        score: {
          templateId: template.id,
          hot,
          fresh,
          relevance,
          preference,
          projectContext,
          totalScore,
        },
      }
    })

    scored.sort((a, b) => {
      if (b.score.totalScore !== a.score.totalScore) {
        return b.score.totalScore - a.score.totalScore
      }
      if ((b.template.downloads || 0) !== (a.template.downloads || 0)) {
        return (b.template.downloads || 0) - (a.template.downloads || 0)
      }
      return new Date(b.template.createdAt).getTime() - new Date(a.template.createdAt).getTime()
    })

    return {
      templates: scored.map((item) => item.template),
      scores: scored.map((item) => item.score),
    }
  }

  private static calcHotScore(downloads: number, maxDownloads: number): number {
    return Math.min(downloads / maxDownloads, 1)
  }

  private static calcFreshScore(createdAt: Date): number {
    const days = Math.max((Date.now() - new Date(createdAt).getTime()) / DAY_MS, 0)
    // 30天半衰期的简化版本
    return 1 / (1 + days / 30)
  }

  private static calcRelevanceScore(template: Template, context: RecommendContext): number {
    let score = 0

    const keyword = (context.keyword || '').trim().toLowerCase()
    if (keyword) {
      const name = (template.name || '').toLowerCase()
      const description = (template.description || '').toLowerCase()
      const tags = (template.tags || '').toLowerCase()

      if (name.includes(keyword)) score += 0.6
      if (description.includes(keyword)) score += 0.25
      if (tags.includes(keyword)) score += 0.15
    }

    const category = (context.category || '').trim().toLowerCase()
    if (category && category !== 'all' && (template.category || '').toLowerCase() === category) {
      score += 0.2
    }

    return Math.min(score, 1)
  }

  private static calcPreferenceScore(template: Template, profileTags: Set<string>): number {
    if (profileTags.size === 0) return 0

    const templateTags = this.parseTags(template.tags)
    if (templateTags.length === 0) return 0

    const hitCount = templateTags.filter((tag) => profileTags.has(tag)).length
    return hitCount / templateTags.length
  }

  private static calcProjectContextScore(template: Template, projectContextTags: Set<string>): number {
    if (projectContextTags.size === 0) return 0

    const templateTags = this.parseTags(template.tags)
    if (templateTags.length === 0) return 0

    const hitCount = templateTags.filter((tag) => projectContextTags.has(tag)).length
    return hitCount / templateTags.length
  }

  private static async getUserTagProfile(userId: number): Promise<Set<string>> {
    const projects = await Project.findAll({
      where: { userId },
      attributes: ['tags'],
      limit: 30,
      order: [['updatedAt', 'DESC']],
    })

    const tags = new Set<string>()
    projects.forEach((project) => {
      const projectTags = this.parseTags(project.tags)
      projectTags.forEach((tag) => tags.add(tag))
    })

    return tags
  }

  private static async getProjectContextTags(projectId: string): Promise<Set<string>> {
    const project = await Project.findByPk(projectId, {
      attributes: ['tags'],
    })

    if (!project) return new Set<string>()

    const tags = new Set<string>()
    this.parseTags(project.tags).forEach((tag) => tags.add(tag))
    return tags
  }

  private static parseTags(rawTags: string | null): string[] {
    if (!rawTags) return []
    return rawTags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
  }
}

export default TemplateRecommendService
