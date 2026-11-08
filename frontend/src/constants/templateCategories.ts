export interface TemplateCategoryItem {
  key: string
  label: string
}

export const TEMPLATE_CATEGORIES: TemplateCategoryItem[] = [
  { key: 'all',       label: '全部' },
  { key: 'general',   label: '通用' },
  { key: 'personal',  label: '个人主页' },
  { key: 'business',  label: '企业官网' },
  { key: 'ecommerce', label: '电商' },
  { key: 'blog',      label: '博客' },
  { key: 'portfolio', label: '作品集' },
  { key: 'landing',   label: '落地页' },
  { key: 'other',     label: '其他' },
]

export const CATEGORY_LABEL_MAP: Record<string, string> = Object.fromEntries(
  TEMPLATE_CATEGORIES.map(c => [c.key, c.label])
)
