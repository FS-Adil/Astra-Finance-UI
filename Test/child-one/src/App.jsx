import React, { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const containerRef = useRef(null)
  const [users, setUsers] = useState([
    { id: 1, name: 'Анна Иванова', email: 'anna@example.com', role: 'Admin', status: 'active' },
    { id: 2, name: 'Петр Сидоров', email: 'petr@example.com', role: 'User', status: 'active' },
    { id: 3, name: 'Мария Козлова', email: 'maria@example.com', role: 'Manager', status: 'inactive' },
    { id: 4, name: 'Иван Петров', email: 'ivan@example.com', role: 'User', status: 'active' },
  ])
  const [filter, setFilter] = useState('all')

  const sendHeight = () => {
    const height = containerRef.current?.scrollHeight
    window.parent.postMessage({ type: 'RESIZE', height }, '*')
  }

  useEffect(() => {
    window.parent.postMessage({ type: 'READY' }, '*')
    sendHeight()
    
    const observer = new ResizeObserver(sendHeight)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    const handleMessage = (event) => {
      console.log('Users app received:', event.data)
    }

    window.addEventListener('message', handleMessage)
    return () => {
      observer.disconnect()
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.status === filter)

  const toggleStatus = (id) => {
    setUsers(users.map(u => 
      u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
    ))
    setTimeout(sendHeight, 100)
  }

  return (
    <div ref={containerRef} className="users-app">
      <div className="users-header">
        <h2>👥 Управление пользователями</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Активные
          </button>
          <button 
            className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilter('inactive')}
          >
            Неактивные
          </button>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td><span className="role-badge">{user.role}</span></td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td>
                  <button 
                    className="action-btn"
                    onClick={() => toggleStatus(user.id)}
                  >
                    Переключить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App