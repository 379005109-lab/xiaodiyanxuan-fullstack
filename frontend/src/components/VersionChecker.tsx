import { useEffect, useState } from 'react'

const CURRENT_VERSION = '2.1.0'
const CHECK_INTERVAL = 30000 // 每30秒检查一次

export default function VersionChecker() {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json?t=' + Date.now())
        const data = await response.json()
        
        console.log('当前版本:', CURRENT_VERSION)
        console.log('服务器版本:', data.version)
        
        if (data.version !== CURRENT_VERSION) {
          console.log('发现新版本，准备刷新...')
          setShowUpdate(true)
          
          // 5秒后自动刷新
          setTimeout(() => {
            window.location.reload()
          }, 5000)
        }
      } catch (error) {
        console.error('版本检查失败:', error)
      }
    }

    // 立即检查一次
    checkVersion()

    // 定期检查
    const interval = setInterval(checkVersion, CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  if (!showUpdate) return null

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 20px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        fontSize: '14px',
        fontWeight: 'bold'
      }}
    >
      🎉 发现新版本！页面将在5秒后自动刷新...
      <button
        onClick={() => window.location.reload()}
        style={{
          marginLeft: '15px',
          padding: '6px 16px',
          background: 'white',
          color: '#667eea',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '13px'
        }}
      >
        立即刷新
      </button>
    </div>
  )
}
