import { makeAutoObservable } from 'mobx'
import type { Project, EditorMode, SelectedElement, ChatMessage } from '@/types'

/**
 * 编辑器状态管理
 */
class EditorStore {
  // 当前项目
  currentProject: Project | null = null
  
  // 编辑器模式
  editorMode: EditorMode = 'visual'
  
  // 当前代码
  code: string = ''
  
  // 选中的元素
  selectedElement: SelectedElement | null = null
  
  // AI 对话历史
  chatMessages: ChatMessage[] = []
  
  // 加载状态
  loading: boolean = false

  constructor() {
    makeAutoObservable(this)
  }

  /**
   * 设置当前项目
   */
  setCurrentProject(project: Project | null) {
    this.currentProject = project
    if (project) {
      this.code = project.content
    }
  }

  /**
   * 切换编辑器模式
   */
  setEditorMode(mode: EditorMode) {
    this.editorMode = mode
  }

  /**
   * 更新代码
   */
  setCode(code: string) {
    this.code = code
  }

  /**
   * 选中元素
   */
  selectElement(element: SelectedElement | null) {
    this.selectedElement = element
  }

  /**
   * 添加聊天消息
   */
  addChatMessage(message: ChatMessage) {
    this.chatMessages.push(message)
  }

  /**
   * 清空聊天历史
   */
  clearChatMessages() {
    this.chatMessages = []
  }

  /**
   * 设置加载状态
   */
  setLoading(loading: boolean) {
    this.loading = loading
  }
}

export const editorStore = new EditorStore()
export default editorStore

