import React, { useState, useMemo } from 'react'
import { Modal, Button, Radio, Space, Tabs, Segmented } from 'antd'
import { WarningOutlined, CloudDownloadOutlined, CloudUploadOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import ReactDiffViewer from 'react-diff-viewer-continued'
import Editor from '@monaco-editor/react'
import { CodeData } from '@/contexts/DesignSpaceContext'
import styles from './index.module.css'

interface ConflictResolutionModalProps {
  visible: boolean
  localCode: CodeData
  serverCode: CodeData
  localVersion: number
  serverVersion: number
  onResolve: (resolution: 'import' | 'overwrite', code?: CodeData) => void
  onCancel: () => void
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  visible,
  localCode,
  serverCode,
  localVersion,
  serverVersion,
  onResolve,
  onCancel
}) => {
  const [resolution, setResolution] = useState<'import' | 'overwrite' | 'manual'>('import')
  const [viewMode, setViewMode] = useState<'diff' | 'edit'>('diff')
  const [mergedCode, setMergedCode] = useState<CodeData>(serverCode)
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html')

  // 计算差异
  const differences = useMemo(() => {
    const diffs = {
      html: localCode.html !== serverCode.html,
      css: localCode.css !== serverCode.css,
      js: localCode.js !== serverCode.js,
    }
    return diffs
  }, [localCode, serverCode])

  const hasDifferences = differences.html || differences.css || differences.js

  const handleConfirm = () => {
    if (resolution === 'import') {
      // 导入最新代码
      onResolve('import', serverCode)
    } else if (resolution === 'overwrite') {
      // 强制覆盖
      onResolve('overwrite', localCode)
    } else {
      // 手动合并
      onResolve('import', mergedCode)
    }
  }

  // 处理代码编辑
  const handleCodeEdit = (value: string | undefined) => {
    if (value !== undefined) {
      setMergedCode({
        ...mergedCode,
        [activeTab]: value
      })
    }
  }

  // 代码差异对比视图
  const renderDiffView = (type: 'html' | 'css' | 'js') => {
    const hasChange = differences[type]
    
    if (!hasChange) {
      return (
        <div className={styles.noChange}>
          <p>✓ 该文件无变化</p>
        </div>
      )
    }

    return (
      <div className={styles.diffViewContainer}>
        <ReactDiffViewer
          oldValue={localCode[type] || ''}
          newValue={serverCode[type] || ''}
          splitView={true}
          leftTitle={`本地版本 (v${localVersion})`}
          rightTitle={`服务器版本 (v${serverVersion})`}
          showDiffOnly={false}
          useDarkTheme={false}
          styles={{
            variables: {
              light: {
                diffViewerBackground: '#fff',
                addedBackground: '#e6ffed',
                addedColor: '#24292e',
                removedBackground: '#ffeef0',
                removedColor: '#24292e',
                wordAddedBackground: '#acf2bd',
                wordRemovedBackground: '#fdb8c0',
                addedGutterBackground: '#cdffd8',
                removedGutterBackground: '#ffdce0',
                gutterBackground: '#f6f8fa',
                gutterBackgroundDark: '#f3f4f6',
                highlightBackground: '#fffbdd',
                highlightGutterBackground: '#fff5b1',
              },
            },
          }}
        />
      </div>
    )
  }

  // 手动编辑视图
  const renderEditView = (type: 'html' | 'css' | 'js') => {
    const language = type === 'js' ? 'javascript' : type
    
    return (
      <div className={styles.editorContainer}>
        <div className={styles.editorHeader}>
          <span>正在编辑: {type.toUpperCase()}</span>
          <span className={styles.editorHint}>💡 提示: 您可以手动合并两个版本的代码</span>
        </div>
        <Editor
          height="500px"
          language={language}
          value={mergedCode[type]}
          onChange={handleCodeEdit}
          theme="vs"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineHeight: 20,
            padding: { top: 10, bottom: 10 },
          }}
        />
      </div>
    )
  }

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined style={{ color: '#faad14' }} />
          <span>代码冲突</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1200}
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          danger={resolution === 'overwrite'}
        >
          {resolution === 'import' ? '导入最新代码' : resolution === 'manual' ? '应用合并结果' : '强制覆盖'}
        </Button>
      ]}
    >
      <div className={styles.container}>

        {/* 版本信息 */}
        <div className={styles.versionInfo}>
          <Space size="large">
            <span>本地版本: <strong>v{localVersion}</strong></span>
            <span>→</span>
            <span>服务器版本: <strong>v{serverVersion}</strong></span>
          </Space>
        </div>

        {/* 解决方案选择 */}
        <div className={styles.resolutionChoice}>
          <h4>选择解决方案：</h4>
          <Radio.Group
            value={resolution}
            onChange={e => setResolution(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="import" className={styles.radioOption}>
                <Space>
                  <CloudDownloadOutlined />
                  <div>
                    <div className={styles.optionTitle}>导入最新代码</div>
                    <div className={styles.optionDesc}>
                      使用服务器最新版本,您的本地修改将被放弃。建议先复制重要代码再导入。
                    </div>
                  </div>
                </Space>
              </Radio>
              <Radio value="manual" className={styles.radioOption}>
                <Space>
                  <EditOutlined />
                  <div>
                    <div className={styles.optionTitle}>手动合并代码</div>
                    <div className={styles.optionDesc}>
                      在编辑器中手动合并两个版本的代码,保留需要的修改。
                    </div>
                  </div>
                </Space>
              </Radio>
              <Radio value="overwrite" className={styles.radioOption}>
                <Space>
                  <CloudUploadOutlined />
                  <div>
                    <div className={styles.optionTitle}>强制覆盖</div>
                    <div className={styles.optionDesc}>
                      用您的本地代码覆盖服务器版本。警告：其他协作者的修改将被永久丢失！
                    </div>
                  </div>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {/* 代码差异对比或手动编辑 */}
        {hasDifferences && (
          <div className={styles.diffSection}>
            <div className={styles.diffHeader}>
              <h4>{resolution === 'manual' ? '手动合并代码' : '代码差异对比'}：</h4>
              {resolution === 'manual' && (
                <Segmented
                  value={viewMode}
                  onChange={(value) => setViewMode(value as 'diff' | 'edit')}
                  options={[
                    {
                      label: (
                        <Space>
                          <EyeOutlined />
                          <span>查看差异</span>
                        </Space>
                      ),
                      value: 'diff',
                    },
                    {
                      label: (
                        <Space>
                          <EditOutlined />
                          <span>编辑代码</span>
                        </Space>
                      ),
                      value: 'edit',
                    },
                  ]}
                />
              )}
            </div>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as 'html' | 'css' | 'js')}
              items={[
                {
                  key: 'html',
                  label: `HTML ${differences.html ? '●' : ''}`,
                  children: resolution === 'manual' && viewMode === 'edit' 
                    ? renderEditView('html')
                    : renderDiffView('html'),
                },
                {
                  key: 'css',
                  label: `CSS ${differences.css ? '●' : ''}`,
                  children: resolution === 'manual' && viewMode === 'edit'
                    ? renderEditView('css')
                    : renderDiffView('css'),
                },
                {
                  key: 'js',
                  label: `JavaScript ${differences.js ? '●' : ''}`,
                  children: resolution === 'manual' && viewMode === 'edit'
                    ? renderEditView('js')
                    : renderDiffView('js'),
                },
              ]}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ConflictResolutionModal
