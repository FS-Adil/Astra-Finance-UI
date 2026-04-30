import React, { useEffect, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

const data = [
  { name: 'Янв', value: 400 },
  { name: 'Фев', value: 300 },
  { name: 'Мар', value: 600 },
  { name: 'Апр', value: 800 },
  { name: 'Май', value: 500 },
  { name: 'Июн', value: 700 },
]

function App() {
  const containerRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [theme, setTheme] = useState('light')

  // Отправка высоты родителю
  const sendHeight = () => {
    const height = containerRef.current?.scrollHeight
    window.parent.postMessage({ type: 'RESIZE', height }, '*')
  }

  // Сообщаем о готовности
  useEffect(() => {
    window.parent.postMessage({ type: 'READY' }, '*')
    sendHeight()
    
    const observer = new ResizeObserver(sendHeight)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    // Слушаем сообщения от родителя
    const handleMessage = (event) => {
      if (event.data.type === 'THEME_CHANGE') {
        setTheme(event.data.theme)
      }
      setMessages(prev => [...prev, `Получено: ${JSON.stringify(event.data)}`])
    }

    window.addEventListener('message', handleMessage)

    return () => {
      observer.disconnect()
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const sendToParent = () => {
    window.parent.postMessage({ 
      type: 'CHILD_MESSAGE', 
      from: 'Dashboard',
      data: 'Привет от дочернего приложения!' 
    }, '*')
  }

  return (
    <div ref={containerRef} className={`dashboard ${theme}`}>
      <div className="dashboard-header">
        <h2>📊 Панель управления</h2>
        <button onClick={sendToParent} className="send-btn">
          Отправить родителю
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Всего пользователей</h3>
          <p className="stat-value">1,234</p>
          <span className="stat-trend positive">↑ 12%</span>
        </div>
        <div className="stat-card">
          <h3>Активные сессии</h3>
          <p className="stat-value">456</p>
          <span className="stat-trend positive">↑ 8%</span>
        </div>
        <div className="stat-card">
          <h3>Доход</h3>
          <p className="stat-value">₽45,678</p>
          <span className="stat-trend negative">↓ 3%</span>
        </div>
      </div>

      <div className="chart-container">
        <h3>Активность за полгода</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#667eea" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {messages.length > 0 && (
        <div className="messages-panel">
          <h4>Сообщения от родителя:</h4>
          {messages.map((msg, i) => (
            <div key={i} className="message">{msg}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App