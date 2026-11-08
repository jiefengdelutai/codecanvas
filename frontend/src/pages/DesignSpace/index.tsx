import React, { useEffect, useState } from 'react'
import { message } from 'antd'
import { observer } from 'mobx-react-lite'
import WorkSpaceHeader from '../../components/WorkSpaceHeader'
import VisualMode from '../../components/VisualMode'
import CodeMode from '../../components/CodeMode'
import ProjectInfoModal from '../../components/ProjectInfoModal'
import ConflictResolutionModal from '../../components/ConflictResolutionModal'
import { useDesignSpace } from '../../contexts/DesignSpaceContext'
import { CodeData } from '../../contexts/DesignSpaceContext'
import { useWebSocket } from '@/hooks/useWebSocket'
import { projectStore } from '@/store/projectStore'
import { userStore } from '@/store/userStore'
import { Project } from '@/types/project'
import styles from './index.module.css'

const DesignSpace: React.FC = observer(() => {
  const { mode, hasUnsavedChanges, syncStylesToHTML, code, setCode, refreshCode } = useDesignSpace()
  const [isEditMode, setIsEditMode] = useState(true) // 默认开启编辑模式
  const [projectInfoModalVisible, setProjectInfoModalVisible] = useState(false)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [conflictModalVisible, setConflictModalVisible] = useState(false)
  const [serverCode, setServerCode] = useState<CodeData | null>(null)
  const [serverVersion, setServerVersion] = useState<number>(1)
  
  // WebSocket实时协作
  const currentProjectId = localStorage.getItem('currentProjectId')
  const { onlineUsers, sendEditingEvent } = useWebSocket({
    projectId: currentProjectId,
    enabled: !!currentProjectId,
  })

  // 页面加载时优先从数据库加载项目代码
  useEffect(() => {
    const initializeProject = async () => {
      const currentProjectId = localStorage.getItem('currentProjectId')
      
      if (currentProjectId) {
        // 如果有项目ID，从数据库加载
        try {
          const project = await projectStore.fetchProject(currentProjectId)
          if (project && project.content) {
            const projectCode = JSON.parse(project.content)
            setCode(projectCode)
            setCurrentProject(project)
            console.log('从数据库加载项目代码成功')
          } else {
            // 数据库中没有内容，从localStorage加载
            refreshCode()
          }
        } catch (error) {
          console.error('从数据库加载项目失败，使用localStorage:', error)
          refreshCode()
        }
      } else {
        // 没有项目ID，从localStorage加载
        refreshCode()
      }
    }
    
    initializeProject()
  }, [])

  // 加载项目信息（仅更新项目元数据，不更新代码）
  const loadProjectInfo = async () => {
    const currentProjectId = localStorage.getItem('currentProjectId')
    if (currentProjectId) {
      try {
        const project = await projectStore.fetchProject(currentProjectId)
        if (project) {
          setCurrentProject(project)
        }
      } catch (error) {
        console.error('加载项目信息失败:', error)
      }
    }
  }

  // 监听模式切换，切换到代码模式时重新读取localStorage
  useEffect(() => {
    if (mode === 'code') {
      // 切换到代码模式时，重新从localStorage读取最新的代码
      refreshCode()
    }
  }, [mode])

  // 处理页面卸载时的样式同步
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        // 同步样式（注意：beforeunload事件中异步操作可能不会完成）
        try {
          await syncStylesToHTML()
          console.log('页面卸载前已同步样式')
        } catch (error) {
          console.error('页面卸载前同步样式失败:', error)
        }
        
        // 显示确认对话框
        event.preventDefault()
        event.returnValue = '您有未保存的样式修改，确定要离开吗？'
        return '您有未保存的样式修改，确定要离开吗？'
      }
    }

    const handleVisibilityChange = async () => {
      // 当页面变为隐藏时（比如切换标签页），尝试同步样式
      if (document.visibilityState === 'hidden' && hasUnsavedChanges()) {
        try {
          await syncStylesToHTML()
          console.log('页面隐藏时已同步样式')
        } catch (error) {
          console.error('页面隐藏时同步样式失败:', error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasUnsavedChanges, syncStylesToHTML])

  // 模式切换现在由Header组件通过Context处理

  // 处理编辑模式切换
  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode)
  }

  // 处理预览功能
  const handlePreview = async () => {
    // 先同步样式到HTML，确保获取最新内容
    await syncStylesToHTML()
    
    // 从localStorage读取最新的代码
    const savedCode = localStorage.getItem('code')
    const latestCode = savedCode ? JSON.parse(savedCode) : code
    
    const previewContent = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>预览 - CodeCanvas</title>
        <style>${latestCode.css}</style>
      </head>
      <body>
        ${latestCode.html}
        <script>${latestCode.js}</script>
      </body>
      </html>
    `
    
    const blob = new Blob([previewContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    
    // 清理URL对象以释放内存
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }

  // 处理保存
  const handleSave = async () => {
    try {
      // 1. 先同步样式变更到localStorage中的HTML
      await syncStylesToHTML()
      
      // 2. 从localStorage读取最新的代码（包含样式变更）
      const savedCode = localStorage.getItem('code')
      const latestCode = savedCode ? JSON.parse(savedCode) : code
      
      // 3. 更新状态为最新代码
      setCode(latestCode)
      
      // 4. 检查是否有项目ID
      const currentProjectId = localStorage.getItem('currentProjectId')
      
      if (currentProjectId) {
        // 如果有项目ID，更新数据库中的项目
        try {
          console.log('保存到数据库的代码长度:', JSON.stringify(latestCode).length)
          await projectStore.updateProject(currentProjectId, {
            content: JSON.stringify(latestCode),  // 使用最新的代码
            currentVersion: currentProject?.currentVersion // 发送当前版本号进行冲突检测
          })
          message.success('保存成功！项目已同步到数据库')
          // 重新加载项目信息以获取最新版本号
          await loadProjectInfo()
        } catch (error: any) {
          // 检查是否是版本冲突错误
          if (error.response?.status === 409 && error.response?.data?.code === 'VERSION_CONFLICT') {
            // 版本冲突，获取服务器最新代码
            const conflictData = error.response.data.data
            const latestProject = await projectStore.fetchProject(currentProjectId)
            
            if (latestProject) {
              const latestCode = JSON.parse(latestProject.content)
              setServerCode(latestCode)
              setServerVersion(conflictData.serverVersion)
              setConflictModalVisible(true)
            }
            // 版本冲突已处理，不再抛出错误
            return
          } else {
            throw error
          }
        }
      } else {
        // 如果没有项目ID，只保存到localStorage
        message.warning('保存到本地成功！提示：这是临时项目，请在"我的项目"中创建项目以永久保存')
      }
    } catch (error: any) {
      console.error('保存失败:', error)
      message.error(error.message || '保存失败，请重试')
    }
  }

  // 处理冲突解决
  const handleConflictResolve = async (resolution: 'import' | 'overwrite', resolvedCode?: CodeData) => {
    const currentProjectId = localStorage.getItem('currentProjectId')
    if (!currentProjectId || !resolvedCode) return

    try {
      if (resolution === 'import') {
        // 导入最新代码
        setCode(resolvedCode)
        localStorage.setItem('code', JSON.stringify(resolvedCode))
        message.success('已导入最新代码')
      } else {
        // 强制覆盖 - 不发送版本号，直接覆盖
        await projectStore.updateProject(currentProjectId, {
          content: JSON.stringify(resolvedCode)
          // 不发送currentVersion，后端将直接更新
        })
        message.success('代码已强制覆盖到服务器')
        await loadProjectInfo()
      }
      setConflictModalVisible(false)
    } catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  // 处理代码变更
  const handleCodeChange = (newCode: { html: string; css: string; js: string }) => {
    setCode(newCode)
    localStorage.setItem('code', JSON.stringify(newCode))
    // 发送正在编辑事件
    sendEditingEvent()
  }

  // 处理项目信息保存
  const handleProjectInfoSave = async (values: any) => {
    const currentProjectId = localStorage.getItem('currentProjectId')
    if (!currentProjectId) {
      message.error('无法更新项目信息：未找到项目ID')
      return
    }

    try {
      await projectStore.updateProject(currentProjectId, values)
      // 重新加载项目信息
      await loadProjectInfo()
      message.success('项目信息已更新')
    } catch (error: any) {
      message.error(error.message || '更新失败')
      throw error
    }
  }

  return (
    <div className={styles.container}>
      <WorkSpaceHeader 
        onSave={handleSave}
        isEditMode={isEditMode}
        onEditModeToggle={handleEditModeToggle}
        onPreview={handlePreview}
        currentProject={currentProject}
        onProjectInfoClick={() => setProjectInfoModalVisible(true)}
        onlineUsers={onlineUsers}
        currentUserId={userStore.user?.id}
      />
      {mode === 'design' ? (
        <VisualMode 
          code={code} 
          isEditMode={isEditMode}
        />
      ) : (
        <CodeMode 
          code={code}
          onCodeChange={handleCodeChange}
        />
      )}
      
      {/* 项目信息编辑弹窗 */}
      <ProjectInfoModal
        visible={projectInfoModalVisible}
        project={currentProject}
        onClose={() => setProjectInfoModalVisible(false)}
        onSave={handleProjectInfoSave}
      />

      {/* 代码冲突解决弹窗 */}
      {serverCode && (
        <ConflictResolutionModal
          visible={conflictModalVisible}
          localCode={code}
          serverCode={serverCode}
          localVersion={currentProject?.currentVersion || 1}
          serverVersion={serverVersion}
          onResolve={handleConflictResolve}
          onCancel={() => setConflictModalVisible(false)}
        />
      )}
    </div>
  )
})

export default DesignSpace