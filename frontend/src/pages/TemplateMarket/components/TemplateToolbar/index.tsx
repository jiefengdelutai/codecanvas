import React from 'react'
import { Input, Select, Tabs, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { TEMPLATE_CATEGORIES } from '@/constants/templateCategories'
import styles from './index.module.css'

const { Text } = Typography
const { Option } = Select

interface TemplateToolbarProps {
  keyword: string
  category: string
  sortBy: string
  totalCount: number
  onSearch: (keyword: string) => void
  onCategoryChange: (category: string) => void
  onSortChange: (sort: string) => void
}

const TemplateToolbar: React.FC<TemplateToolbarProps> = ({
  keyword,
  category,
  sortBy,
  totalCount,
  onSearch,
  onCategoryChange,
  onSortChange,
}) => {
  const tabItems = TEMPLATE_CATEGORIES.map(c => ({ key: c.key, label: c.label }))

  return (
    <div className={styles.toolbar}>
      <div className={styles.topRow}>
        <Input
          className={styles.searchInput}
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="搜索模板名称、描述或标签..."
          value={keyword}
          onChange={e => onSearch(e.target.value)}
          allowClear
        />
        <div className={styles.rightControls}>
          <Text type="secondary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
            共 <Text strong>{totalCount}</Text> 个模板
          </Text>
          <Select
            value={sortBy}
            onChange={onSortChange}
            className={styles.sortSelect}
            size="middle"
          >
            <Option value="downloads">最热门</Option>
            <Option value="createdAt">最新上传</Option>
          </Select>
        </div>
      </div>

      <Tabs
        activeKey={category}
        onChange={onCategoryChange}
        items={tabItems}
        className={styles.categoryTabs}
        size="small"
      />
    </div>
  )
}

export default TemplateToolbar
