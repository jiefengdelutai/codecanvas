import React, { useState, useEffect } from 'react'
import { Modal, Input, List, Avatar, Button, Space, Tag, message, Spin, Empty } from 'antd'
import { SearchOutlined, UserOutlined, DeleteOutlined, CrownOutlined } from '@ant-design/icons'
import { collaboratorService, Collaborator, UserSearchResult } from '@/services/collaboratorService'
import styles from './CollaboratorModal.module.css'

interface CollaboratorModalProps {
  visible: boolean
  projectId: string
  projectName: string
  onClose: () => void
}

const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  visible,
  projectId,
  projectName,
  onClose
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [userRole, setUserRole] = useState<'owner' | 'editor' | null>(null)

  useEffect(() => {
    if (visible) {
      loadCollaborators()
      checkPermission()
    }
  }, [visible, projectId])

  const loadCollaborators = async () => {
    try {
      setLoading(true)
      const response = await collaboratorService.getCollaborators(projectId)
      console.log('协作者列表响应:', response)
      // axios拦截器返回response.data，即{success, data}对象
      if (response.success && Array.isArray(response.data)) {
        setCollaborators(response.data)
        console.log('协作者数量:', response.data.length)
      }
    } catch (error: any) {
      console.error('加载协作者失败:', error)
      console.error('错误详情:', error.response?.data)
      message.error(error.response?.data?.message || '加载协作者失败')
    } finally {
      setLoading(false)
    }
  }

  const checkPermission = async () => {
    try {
      const response = await collaboratorService.checkPermission(projectId)
      console.log('权限检查响应:', response)
      // axios拦截器返回response.data，即{success, data}对象
      if (response.success && response.data && response.data.role) {
        setUserRole(response.data.role)
        console.log('用户角色:', response.data.role)
      }
    } catch (error: any) {
      console.error('检查权限失败:', error)
      console.error('错误详情:', error.response?.data)
      message.error('无法获取权限信息')
    }
  }

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      message.warning('请输入搜索关键词')
      return
    }

    try {
      setSearching(true)
      const response = await collaboratorService.searchUsers(projectId, searchKeyword)
      console.log('搜索结果:', response)
      // axios拦截器返回response.data，即{success, data}对象
      if (response.success && Array.isArray(response.data)) {
        setSearchResults(response.data)
        if (response.data.length === 0) {
          message.info('未找到匹配的用户')
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '搜索用户失败')
    } finally {
      setSearching(false)
    }
  }

  const handleAddCollaborator = async (userId: number) => {
    try {
      const response = await collaboratorService.addCollaborator(projectId, userId, 'editor')
      if (response.success) {
        message.success('协作者添加成功')
        setSearchKeyword('')
        setSearchResults([])
        loadCollaborators()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '添加协作者失败')
    }
  }

  const handleRemoveCollaborator = async (userId: number, username: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要移除协作者 "${username}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await collaboratorService.removeCollaborator(projectId, userId)
          if (response.success) {
            message.success('协作者删除成功')
            loadCollaborators()
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除协作者失败')
        }
      }
    })
  }

  const handleTransferOwnership = async (userId: number, username: string) => {
    Modal.confirm({
      title: '转让项目所有权',
      content: (
        <div>
          <p>确定要将项目所有权转让给 <strong>{username}</strong> 吗？</p>
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>
            ⚠️ 转让后您将成为编辑者，无法再管理协作者！
          </p>
        </div>
      ),
      okText: '确认转让',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await collaboratorService.transferOwnership(projectId, userId)
          if (response.success) {
            message.success('所有权转让成功')
            loadCollaborators()
            checkPermission() // 重新检查权限
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '转让所有权失败')
        }
      }
    })
  }

  const isOwner = userRole === 'owner'

  return (
    <Modal
      title={`管理协作者 - ${projectName}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div className={styles.container}>
        {/* 搜索区域 */}
        {isOwner && (
          <div className={styles.searchSection}>
            <h4>添加协作者</h4>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="搜索用户名、邮箱或昵称..."
                prefix={<SearchOutlined />}
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
              />
              <Button type="primary" onClick={handleSearch} loading={searching}>
                搜索
              </Button>
            </Space.Compact>

            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <List
                className={styles.searchResults}
                dataSource={searchResults}
                renderItem={user => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        onClick={() => handleAddCollaborator(user.id)}
                      >
                        添加
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar src={user.avatar_url} icon={<UserOutlined />} />
                      }
                      title={user.nickname || user.username}
                      description={user.email}
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        )}

        {/* 协作者列表 */}
        <div className={styles.collaboratorSection}>
          <h4>当前协作者 ({collaborators.length}/5)</h4>
          {loading ? (
            <div className={styles.loading}>
              <Spin />
            </div>
          ) : collaborators.length === 0 ? (
            <Empty description="暂无协作者" />
          ) : (
            <List
              dataSource={collaborators}
              renderItem={collaborator => (
                <List.Item
                  actions={
                    isOwner && collaborator.role !== 'owner'
                      ? [
                          <Button
                            type="link"
                            size="small"
                            onClick={() =>
                              handleTransferOwnership(
                                collaborator.userId,
                                collaborator.user?.username || ''
                              )
                            }
                          >
                            设为创建者
                          </Button>,
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              handleRemoveCollaborator(
                                collaborator.userId,
                                collaborator.user?.username || ''
                              )
                            }
                          >
                            移除
                          </Button>
                        ]
                      : undefined
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={collaborator.user?.avatar_url}
                        icon={<UserOutlined />}
                      />
                    }
                    title={
                      <Space>
                        {collaborator.user?.nickname || collaborator.user?.username}
                        {collaborator.role === 'owner' && (
                          <Tag icon={<CrownOutlined />} color="gold">
                            创建者
                          </Tag>
                        )}
                        {collaborator.role === 'editor' && (
                          <Tag color="blue">编辑者</Tag>
                        )}
                      </Space>
                    }
                    description={collaborator.user?.email}
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}

export default CollaboratorModal
