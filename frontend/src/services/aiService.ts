// AI API 调用服务
import { message } from 'antd'

// AI API 配置
const AI_API_CONFIG = {
  baseURL: 'https://aicanapi.com/v1',
  // 模型优先级列表：按顺序尝试，第一个可用的模型将被使用
  models: [
    'claude-sonnet-4-5-20250929',
    'gpt-4',
    'deepseek-chat'
  ],
  // 注意：实际使用时API密钥应该从环境变量或后端获取
  apiKey: import.meta.env.VITE_AI_API_KEY || '',
}

// 当前使用的模型索引
let currentModelIndex = 0

// 获取当前模型
const getCurrentModel = (): string => {
  return AI_API_CONFIG.models[currentModelIndex]
}

// 切换到下一个模型
const switchToNextModel = (): boolean => {
  if (currentModelIndex < AI_API_CONFIG.models.length - 1) {
    currentModelIndex++
    console.log(`模型切换: ${AI_API_CONFIG.models[currentModelIndex - 1]} -> ${AI_API_CONFIG.models[currentModelIndex]}`)
    return true
  }
  return false
}

// 重置模型索引（每次新请求时重置）
const resetModelIndex = (): void => {
  currentModelIndex = 0
}

// 判断是否为模型不可用错误
const isModelUnavailableError = (status: number, errorText: string): boolean => {
  // 常见的模型不可用状态码和错误信息
  const unavailableStatuses = [503, 529, 500, 502, 504]
  const unavailableKeywords = [
    'model not available',
    'model_not_available',
    'overloaded',
    'capacity',
    'rate limit',
    'rate_limit',
    'temporarily unavailable',
    'service unavailable',
    'model not found',
    'model_not_found',
    'does not exist',
    'invalid model'
  ]
  
  if (unavailableStatuses.includes(status)) {
    return true
  }
  
  const lowerErrorText = errorText.toLowerCase()
  return unavailableKeywords.some(keyword => lowerErrorText.includes(keyword))
}

// 请求接口类型定义
interface TextMessage {
  role: 'user'
  content: string
}

interface MultimodalMessage {
  role: 'user'
  content: Array<{
    type: 'image' | 'text'
    source?: {
      type: 'base64'
      media_type: string
      data: string
    }
    text?: string
  }>
}

interface AIRequest {
  model: string
  messages: (TextMessage | MultimodalMessage)[]
  stream?: boolean
  max_tokens?: number
}

// Anthropic API 响应格式
interface AnthropicResponse {
  content: Array<{
    text: string
    type: string
  }>
  id: string
  model: string
  role: string
  stop_reason: string
  stop_sequence: string | null
  type: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

// OpenAI 兼容响应格式
interface AIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// AI模式枚举
export enum AIMode {
  GENERATE = 'generate', // 页面生成模式
  OPTIMIZE = 'optimize'  // 页面优化模式
}

export type IntentType = 'modify' | 'ask' | 'other'

interface AskContextInput {
  question: string
  retrievedInfo: string
}

// 构建意图识别提示词
const buildIntentPrompt = (userMessage: string): string => {
  return `你是一个意图识别器，只需要判断用户消息属于哪一类。

可选分类只有以下三种：
- modify：修改项目代码、页面、样式、逻辑
- ask：查询、建议、解释、归纳等不需要修改代码的情况
- other：其它

请只返回JSON，不要输出任何解释。
返回格式必须严格为：{"intent":"modify"}

用户消息：
${userMessage}`
}

export const detectIntent = async (userMessage: string): Promise<IntentType> => {
  const text = userMessage.toLowerCase()
  const askKeywords = [
    '项目名称', '项目描述', '项目状态', '项目标签', '当前项目代码',
    '当前项目', '这个项目', '项目信息', '查看项目', '查询项目', '项目详情',
    '建议', '优化建议', '怎么优化', '如何优化', '解释', '说明', '归纳'
  ]
  const modifyKeywords = [
    '修改', '调整', '优化', '重构', '修复', '改成', '改为', '帮我改', '更新代码', '修改代码', '页面', '样式', '布局', '组件', '逻辑'
  ]

  if (askKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
    return 'ask'
  }

  if (modifyKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
    return 'modify'
  }

  try {
    resetModelIndex()
    const prompt = buildIntentPrompt(userMessage)
    const response = await fetch(`${AI_API_CONFIG.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'x-api-key': AI_API_CONFIG.apiKey,
      },
      body: JSON.stringify({
        model: getCurrentModel(),
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        max_tokens: 100,
      })
    })

    const data = await response.json()
    const replyText = data?.content?.[0]?.text || data?.choices?.[0]?.message?.content || ''
    const match = replyText.match(/\{"intent"\s*:\s*"(modify|query|other)"\}/)
    return (match?.[1] as IntentType) || 'other'
  } catch (error) {
    console.error('意图识别失败:', error)
    return 'other'
  }
}

// 构建页面生成模式的系统提示词
const buildGeneratePrompt = (userRequirements: string): string => {
  return `你是一个专业的前端开发助手，专门负责生成网页页面。

任务：根据用户描述生成完整的HTML页面代码。

要求：
1. 只返回HTML代码，不要返回CSS或JavaScript
2. HTML代码必须包含完整的样式（使用内联style或<style>标签）
3. 代码要现代化、美观、响应式
4. 返回格式：将HTML代码包裹在\`\`\`html和\`\`\`之间
5. 不要添加任何解释文字，只返回代码

用户需求：
${userRequirements}`
}

// 构建页面优化模式的系统提示词
const buildModifyPrompt = (userRequirements: string, currentProjectCode: string = ''): string => {
  return `系统角色说明
你是一个专业的前端/代码修改助手，负责根据用户要求修改项目代码。
你只需要依据当前项目代码进行修改，不要引入无关内容。

用户修改目标
${userRequirements}

当前项目上下文
${currentProjectCode}

本次具体要求
请根据用户修改目标，结合当前项目上下文完成修改。

输出格式要求
1. 返回JSON格式：{"html": "...", "css": "...", "js": "..."}
2. 如果用户提供了"当前选中的元素信息"，请仅修改该元素的样式
3. 元素路径格式如：html > body > div > div:nth-child(1)，使用CSS选择器定位
4. 保持其他元素不变，只返回完整的修改后代码
5. 不要添加任何解释文字，只返回JSON代码`
}

const buildAskPrompt = (userQuestion: string, retrievedInfo: string): string => {
  return `系统角色说明
你是一个专业的项目助手，负责根据用户问题结合检索到的信息进行回答。
你只需要基于给定的检索信息回答，不要编造未提供的内容。

用户问题
${userQuestion}

检索到的信息
${retrievedInfo}

本次具体要求
请根据用户问题和检索到的信息，给出自然、简洁、准确的回答。

输出格式要求
1. 直接返回自然语言回答
2. 不要输出JSON
3. 不要添加无关解释
4. 如果信息不足，请明确说明信息不足`
}

const buildOptimizePrompt = (userRequirements: string): string => {
  return buildModifyPrompt(userRequirements)
}

// 根据模式构建系统提示词
const buildSystemPrompt = (userRequirements: string, mode: AIMode): string => {
  switch (mode) {
    case AIMode.GENERATE:
      return buildGeneratePrompt(userRequirements)
    case AIMode.OPTIMIZE:
      return buildOptimizePrompt(userRequirements)
    default:
      return buildOptimizePrompt(userRequirements)
  }
}

// 纯文本请求
export const callAIWithText = async (
  userRequirements: string,
  onProgress?: (chunk: string) => void,
  saveToLocalStorage: boolean = true, // 是否将AI返回的代码保存到localStorage
  mode: AIMode = AIMode.OPTIMIZE,
  currentProjectCode: string = '',
  askContext?: AskContextInput
): Promise<string> => {
  // 重置模型索引，从第一个模型开始尝试
  resetModelIndex()
  
  const prompt = mode === AIMode.OPTIMIZE
    ? buildModifyPrompt(userRequirements, currentProjectCode)
    : askContext
      ? buildAskPrompt(askContext.question, askContext.retrievedInfo)
      : buildSystemPrompt(userRequirements, mode)
  
  // 循环尝试所有可用模型
  while (true) {
    const currentModel = getCurrentModel()
    
    try {
      console.log(`尝试使用模型: ${currentModel}`)
      
      // 尝试使用 Anthropic 原生格式
      const anthropicRequestBody = {
        model: currentModel,
        messages: [{
          role: 'user',
          content: prompt
        }],
        stream: !!onProgress,
        max_tokens: 4000
      }

      console.log('发送AI请求 (纯文本):', {
        model: currentModel,
        prompt: prompt.substring(0, 100) + '...',
        stream: anthropicRequestBody.stream
      })

      // 首先尝试 Anthropic 原生格式
      let response = await fetch(`${AI_API_CONFIG.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          'x-api-key': AI_API_CONFIG.apiKey,
        },
        body: JSON.stringify(anthropicRequestBody)
      })

      // 如果 messages 端点失败，回退到 chat/completions 端点
      if (!response.ok) {
        const errorText = await response.text()
        
        // 检查是否为模型不可用错误
        if (isModelUnavailableError(response.status, errorText)) {
          console.log(`模型 ${currentModel} 不可用: ${errorText}`)
          
          // 尝试切换到下一个模型
          if (switchToNextModel()) {
            message.warning(`模型 ${currentModel} 不可用，正在切换到备用模型...`)
            continue // 继续尝试下一个模型
          }
        }
        
        console.log('Anthropic 原生格式失败，尝试 OpenAI 兼容格式...')
        
        const openaiRequestBody: AIRequest = {
          model: currentModel,
          messages: [{
            role: 'user',
            content: prompt
          }],
          stream: !!onProgress,
          max_tokens: 4000
        }

        response = await fetch(`${AI_API_CONFIG.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
          },
          body: JSON.stringify(openaiRequestBody)
        })
      }

      if (!response.ok) {
        const errorText = await response.text()
        
        // 检查是否为模型不可用错误
        if (isModelUnavailableError(response.status, errorText)) {
          console.log(`模型 ${currentModel} 不可用: ${errorText}`)
          
          // 尝试切换到下一个模型
          if (switchToNextModel()) {
            message.warning(`模型 ${currentModel} 不可用，正在切换到备用模型...`)
            continue // 继续尝试下一个模型
          }
        }
        
        throw new Error(`AI API请求失败: ${response.status} ${response.statusText}\n${errorText}`)
      }

      // 请求成功，显示使用的模型
      console.log(`成功使用模型: ${currentModel}`)

      let result = ''
      
      if (onProgress) {
        // 检查响应头来确定是哪种流式格式
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('text/event-stream')) {
          // Anthropic 流式响应格式
          result = await handleAnthropicStreamResponse(response, onProgress)
        } else {
          // OpenAI 兼容流式响应格式
          result = await handleStreamResponse(response, onProgress)
        }
      } else {
        // 处理普通响应
        const data = await response.json()
        
        // 检查是否为 Anthropic 原生响应格式
        if (data.content && Array.isArray(data.content)) {
          const anthropicData = data as AnthropicResponse
          result = anthropicData.content[0]?.text || ''
        } else {
          // OpenAI 兼容格式
          const aiData = data as AIResponse
          result = aiData.choices?.[0]?.message?.content || ''
        }
      }
      
      // 根据参数决定是否提取并存储代码
      if (saveToLocalStorage) {
        console.log('准备提取代码，响应长度:', result.length)
        if (result && result.length > 0) {
          extractCodeFromResponse(result, mode)
        }
      } else {
        console.log('跳过代码保存（saveToLocalStorage=false）')
      }
      
      return result
    } catch (error) {
      console.error(`模型 ${currentModel} 调用失败:`, error)
      
      // 尝试切换到下一个模型
      if (switchToNextModel()) {
        message.warning(`模型 ${currentModel} 调用失败，正在切换到备用模型...`)
        continue // 继续尝试下一个模型
      }
      
      // 所有模型都失败了
      message.error('所有AI模型都不可用，请稍后重试')
      throw error
    }
  }
}

// 多模态请求（图片+文本）- 专用于图生码场景
export const callAIWithImageAndText = async (
  userRequirements: string,
  imageBase64: string,
  imageMimeType: string = 'image/jpeg',
  onProgress?: (chunk: string) => void
): Promise<string> => {
  // 重置模型索引，从第一个模型开始尝试
  resetModelIndex()
  
  // 图生码场景固定使用生成模式
  const prompt = buildSystemPrompt(userRequirements, AIMode.GENERATE)
  
  // 循环尝试所有可用模型
  while (true) {
    const currentModel = getCurrentModel()
    
    try {
      console.log(`尝试使用模型: ${currentModel}`)
      
      // 尝试使用 Anthropic 原生格式
      const anthropicRequestBody = {
        model: currentModel,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageMimeType,
                data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '') // 移除data URL前缀
              }
            },
            {
              type: 'text',
              text: `请参考上传的图片，${prompt}`
            }
          ]
        }],
        stream: !!onProgress,
        max_tokens: 4000
      }

      console.log('发送AI请求 (多模态):', {
        model: currentModel,
        hasImage: true,
        imageSize: imageBase64.length,
        prompt: prompt.substring(0, 100) + '...'
      })

      // 首先尝试 Anthropic 原生格式
      let response = await fetch(`${AI_API_CONFIG.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          'x-api-key': AI_API_CONFIG.apiKey,
        },
        body: JSON.stringify(anthropicRequestBody)
      })

      // 如果 messages 端点失败，回退到 chat/completions 端点
      if (!response.ok) {
        const errorText = await response.text()
        
        // 检查是否为模型不可用错误
        if (isModelUnavailableError(response.status, errorText)) {
          console.log(`模型 ${currentModel} 不可用: ${errorText}`)
          
          // 尝试切换到下一个模型
          if (switchToNextModel()) {
            message.warning(`模型 ${currentModel} 不可用，正在切换到备用模型...`)
            continue // 继续尝试下一个模型
          }
        }
        
        console.log('Anthropic 原生格式失败，尝试 OpenAI 兼容格式...')
        
        const openaiRequestBody: AIRequest = {
          model: currentModel,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageMimeType,
                  data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
                }
              },
              {
                type: 'text',
                text: `请参考上传的图片，${prompt}`
              }
            ]
          }],
          stream: !!onProgress,
          max_tokens: 4000
        }

        response = await fetch(`${AI_API_CONFIG.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
          },
          body: JSON.stringify(openaiRequestBody)
        })
      }

      if (!response.ok) {
        const errorText = await response.text()
        
        // 检查是否为模型不可用错误
        if (isModelUnavailableError(response.status, errorText)) {
          console.log(`模型 ${currentModel} 不可用: ${errorText}`)
          
          // 尝试切换到下一个模型
          if (switchToNextModel()) {
            message.warning(`模型 ${currentModel} 不可用，正在切换到备用模型...`)
            continue // 继续尝试下一个模型
          }
        }
        
        throw new Error(`AI API请求失败: ${response.status} ${response.statusText}\n${errorText}`)
      }

      // 请求成功，显示使用的模型
      console.log(`成功使用模型: ${currentModel}`)

      let result = ''
      
      if (onProgress) {
        // 检查响应头来确定是哪种流式格式
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('text/event-stream')) {
          // Anthropic 流式响应格式
          result = await handleAnthropicStreamResponse(response, onProgress)
        } else {
          // OpenAI 兼容流式响应格式
          result = await handleStreamResponse(response, onProgress)
        }
      } else {
        // 处理普通响应
        const data = await response.json()
        
        // 检查是否为 Anthropic 原生响应格式
        if (data.content && Array.isArray(data.content)) {
          const anthropicData = data as AnthropicResponse
          result = anthropicData.content[0]?.text || ''
        } else {
          // OpenAI 兼容格式
          const aiData = data as AIResponse
          result = aiData.choices?.[0]?.message?.content || ''
        }
      }
      
      // 图生码场景固定使用生成模式提取代码
      console.log('准备提取代码，响应长度:', result.length)
      if (result && result.length > 0) {
        extractCodeFromResponse(result, AIMode.GENERATE)
      }
      
      return result
    } catch (error) {
      console.error(`模型 ${currentModel} 调用失败:`, error)
      
      // 尝试切换到下一个模型
      if (switchToNextModel()) {
        message.warning(`模型 ${currentModel} 调用失败，正在切换到备用模型...`)
        continue // 继续尝试下一个模型
      }
      
      // 所有模型都失败了
      message.error('所有AI模型都不可用，请稍后重试')
      throw error
    }
  }
}

// 处理流式响应
const handleStreamResponse = async (
  response: Response,
  onProgress: (chunk: string) => void
): Promise<string> => {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  let fullContent = ''
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          
          if (data === '[DONE]') {
            return fullContent
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            
            if (content) {
              fullContent += content
              onProgress(content)
            }
          } catch (e) {
            // 忽略解析错误，继续处理下一行
            continue
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullContent
}

// 处理 Anthropic 流式响应
const handleAnthropicStreamResponse = async (
  response: Response,
  onProgress: (chunk: string) => void
): Promise<string> => {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  const decoder = new TextDecoder()
  let fullContent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          
          if (data === '[DONE]') {
            return fullContent
          }

          try {
            const parsed = JSON.parse(data)
            
            // Anthropic 流式响应格式
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              const content = parsed.delta.text
              fullContent += content
              onProgress(content)
            } else if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
              // 消息结束
              return fullContent
            }
          } catch (e) {
            // 忽略解析错误，继续处理下一行
            continue
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullContent
}

// 代码存储接口
export interface CodeStorage {
  html: string
  css: string
  javascript: string
}

// 提取代码并存储到localStorage（根据AI模式处理不同格式）
export const extractCodeFromResponse = (response: string, mode: AIMode = AIMode.OPTIMIZE): string => {
  console.log('原始响应内容:', response.substring(0, 500) + '...')
  console.log('响应长度:', response.length)
  console.log('AI模式:', mode)
  
  let codeData: CodeStorage = { html: '', css: '', javascript: '' }
  let extracted = false
  
  if (mode === AIMode.GENERATE) {
    // 页面生成模式：优先提取HTML代码块
    const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/)
    if (htmlMatch && htmlMatch[1]) {
      codeData.html = htmlMatch[1].trim()
      extracted = true
      console.log('生成模式：成功提取HTML代码块')
    } else if (response.trim().startsWith('<!DOCTYPE') || response.trim().startsWith('<html')) {
      // 如果整个响应就是HTML
      codeData.html = response.trim()
      extracted = true
      console.log('生成模式：将整个响应作为HTML代码')
    }
  } else {
    // 页面优化模式：优先提取JSON格式的代码
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim())
        if (parsed.html !== undefined || parsed.css !== undefined || parsed.js !== undefined) {
          codeData = {
            html: parsed.html || '',
            css: parsed.css || '',
            javascript: parsed.js || parsed.javascript || ''
          }
          extracted = true
          console.log('优化模式：成功解析JSON格式代码')
        }
      } catch (e) {
        console.log('优化模式：JSON解析失败，尝试其他格式')
      }
    }
    
    // 后备方式：尝试直接解析响应中的JSON对象
    if (!extracted) {
      try {
        const jsonObjMatch = response.match(/\{[\s\S]*"html"[\s\S]*\}/)
        if (jsonObjMatch) {
          const parsed = JSON.parse(jsonObjMatch[0])
          if (parsed.html !== undefined) {
            codeData = {
              html: parsed.html || '',
              css: parsed.css || '',
              javascript: parsed.js || parsed.javascript || ''
            }
            extracted = true
            console.log('优化模式：成功从响应中提取JSON对象')
          }
        }
      } catch (e) {
        console.log('优化模式：直接JSON解析失败')
      }
    }
  }
  
  // 后备方式：如果上面都失败，尝试传统的HTML代码块匹配
  if (!extracted) {
    const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/)
    if (htmlMatch && htmlMatch[1]) {
      codeData.html = htmlMatch[1].trim()
      extracted = true
      console.log('后备方式：匹配到HTML代码块')
      
      // 同时尝试匹配CSS和JS代码块
      const cssMatch = response.match(/```css\s*([\s\S]*?)\s*```/)
      if (cssMatch && cssMatch[1]) {
        codeData.css = cssMatch[1].trim()
      }
      
      const jsMatch = response.match(/```(?:javascript|js)\s*([\s\S]*?)\s*```/)
      if (jsMatch && jsMatch[1]) {
        codeData.javascript = jsMatch[1].trim()
      }
    } else if (response.trim().startsWith('<!DOCTYPE') || response.trim().startsWith('<html')) {
      // 如果整个响应就是HTML
      codeData.html = response.trim()
      extracted = true
      console.log('后备方式：将整个响应作为HTML代码')
    }
  }
  
  if (!extracted) {
    console.log('未找到可提取的代码，响应开头:', response.substring(0, 100))
    return response // 返回原始响应
  }
  
  // 处理Unicode转义字符（如 \u003c 转换为 <）
  const processUnicode = (str: string) => {
    return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => {
      return String.fromCharCode(parseInt(code, 16))
    })
  }
  
  codeData.html = processUnicode(codeData.html)
  codeData.css = processUnicode(codeData.css)
  codeData.javascript = processUnicode(codeData.javascript)
  
  console.log('提取的代码:', {
    htmlLength: codeData.html.length,
    cssLength: codeData.css.length,
    jsLength: codeData.javascript.length
  })
  
  // 只有当有代码内容时才存储
  if (codeData.html.trim() || codeData.css.trim() || codeData.javascript.trim()) {
    saveCodeToLocalStorage(codeData)
  } else {
    console.log('代码为空，跳过存储')
  }
  
  return codeData.html
}

// 保持向后兼容的别名
export const extractHTMLFromResponse = extractCodeFromResponse

// 保存代码到localStorage
const saveCodeToLocalStorage = (code: CodeStorage): void => {
  try {
    localStorage.setItem('code', JSON.stringify(code))
    console.log('代码已保存到localStorage:', code)
  } catch (error) {
    console.error('保存代码到localStorage失败:', error)
  }
}

// 从localStorage获取代码
export const getCodeFromLocalStorage = (): CodeStorage | null => {
  try {
    const codeStr = localStorage.getItem('code')
    if (codeStr) {
      return JSON.parse(codeStr) as CodeStorage
    }
    return null
  } catch (error) {
    console.error('从localStorage获取代码失败:', error)
    return null
  }
}

// 清除localStorage中的代码
export const clearCodeFromLocalStorage = (): void => {
  try {
    localStorage.removeItem('code')
    console.log('localStorage中的代码已清除')
  } catch (error) {
    console.error('清除localStorage中的代码失败:', error)
  }
}

// 验证API密钥配置
export const validateAPIConfig = (): boolean => {
  if (!AI_API_CONFIG.apiKey) {
    message.error('AI API密钥未配置，请联系管理员')
    return false
  }
  return true
}
