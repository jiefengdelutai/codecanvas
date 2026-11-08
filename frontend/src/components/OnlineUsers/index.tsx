import React from 'react'
import { Avatar, Tooltip, Badge } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import styles from './index.module.css'

interface OnlineUser {
  userId: number
  username: string
  nickname?: string
  avatar_url?: string
}

interface OnlineUsersProps {
  users: OnlineUser[]
  currentUserId?: number
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ users, currentUserId }) => {
  if (users.length === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Badge count={users.length} showZero={false}>
          <span className={styles.title}>在线协作</span>
        </Badge>
      </div>
      <div className={styles.userList}>
        {users.map(user => {
          const isCurrentUser = user.userId === currentUserId
          const displayName = user.nickname || user.username
          
          return (
            <Tooltip
              key={user.userId}
              title={
                <div>
                  <div>{displayName}</div>
                  {isCurrentUser && <div style={{ fontSize: 12, color: '#95de64' }}>（我）</div>}
                </div>
              }
              placement="bottom"
            >
              <div className={styles.userItem}>
                <Badge dot color="#52c41a" offset={[-2, 2]}>
                  <Avatar
                    src={user.avatar_url}
                    icon={<UserOutlined />}
                    size="small"
                    style={{
                      border: isCurrentUser ? '2px solid #1890ff' : '2px solid transparent',
                    }}
                  />
                </Badge>
              </div>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

export default OnlineUsers
