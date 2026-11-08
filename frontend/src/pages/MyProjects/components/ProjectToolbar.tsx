import React, { useState } from 'react'
import { Button, Input, Select, Space } from 'antd'
import { PlusOutlined, SearchOutlined, DeleteOutlined, AppstoreAddOutlined, CheckSquareOutlined } from '@ant-design/icons'
import styles from './ProjectToolbar.module.css'

interface ProjectToolbarProps {
  onSearch: (keyword: string) => void
  onSort: (sortBy: string, order: string) => void
  onFilter: (status?: string) => void
  onFilterFavorite: (isFavorite?: boolean) => void
  onCreateProject: () => void
  onImportTemplate: () => void
  onToggleBatchMode: () => void
  onBatchDelete: () => void
  onCancelBatch: () => void
  totalCount: number
  selectedCount: number
  isBatchMode: boolean
  sortValue: string
  filterValue?: string
  favoriteFilter?: boolean
}

const ProjectToolbar: React.FC<ProjectToolbarProps> = ({
  onSearch,
  onSort,
  onFilter,
  onFilterFavorite,
  onCreateProject,
  onImportTemplate,
  onToggleBatchMode,
  onBatchDelete,
  onCancelBatch,
  selectedCount,
  isBatchMode,
  sortValue,
  filterValue,
  favoriteFilter
}) => {
  const [keyword, setKeyword] = useState('')

  const handleSearch = () => {
    onSearch(keyword)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={styles.toolbar}>
      {/* 左侧：搜索、排序、筛选 */}
      <div className={styles.left}>
        <Space size="middle">
          <Input
            placeholder="搜索项目名称..."
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleKeyPress}
            style={{ width: 260 }}
            allowClear
            onClear={() => onSearch('')}
          />

          <Select
            placeholder="排序方式"
            style={{ width: 150 }}
            value={sortValue}
            onChange={value => {
              const [sortBy, order] = value.split('-')
              onSort(sortBy, order)
            }}
          >
            <Select.Option value="updatedAt-DESC">最近更新</Select.Option>
            <Select.Option value="createdAt-DESC">创建时间</Select.Option>
            <Select.Option value="name-ASC">名称 A-Z</Select.Option>
            <Select.Option value="viewCount-DESC">访问量</Select.Option>
          </Select>

          <Select
            placeholder="筛选状态"
            style={{ width: 120 }}
            value={filterValue}
            onChange={value => {
              onFilter(value)
            }}
            allowClear
            onClear={() => {
              onFilter(undefined)
            }}
          >
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="published">已发布</Select.Option>
            <Select.Option value="archived">已归档</Select.Option>
          </Select>

          <Select
            placeholder="筛选收藏"
            style={{ width: 120 }}
            value={favoriteFilter}
            onChange={value => {
              onFilterFavorite(value)
            }}
            allowClear
            onClear={() => {
              onFilterFavorite(undefined)
            }}
          >
            <Select.Option value={true}>已收藏</Select.Option>
            <Select.Option value={false}>未收藏</Select.Option>
          </Select>
        </Space>
      </div>

      {/* 右侧：操作按钮 */}
      <div className={styles.right}>
        {isBatchMode ? (
          // 批量模式
          <Space size="middle">
            <span className={styles.batchInfo}>
              <CheckSquareOutlined /> 已选 {selectedCount} 个
            </span>
            <Button 
              danger
              icon={<DeleteOutlined />}
              onClick={onBatchDelete}
              disabled={selectedCount === 0}
            >
              删除选中
            </Button>
            <Button onClick={onCancelBatch}>
              取消
            </Button>
          </Space>
        ) : (
          // 正常模式
          <Space size="middle">
            <Button 
              icon={<CheckSquareOutlined />}
              onClick={onToggleBatchMode}
            >
              批量操作
            </Button>
            <Button 
              icon={<AppstoreAddOutlined />}
              onClick={onImportTemplate}
            >
              模板导入
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={onCreateProject}
            >
              新建项目
            </Button>
          </Space>
        )}
      </div>
    </div>
  )
}

export default ProjectToolbar
