import React, { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const containerRef = useRef(null)
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'ru',
    autoSave: true,
  })

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

    return () => observer.disconnect()
  }, [])

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    // Отправляем изменения родителю
    window.parent.postMessage({ 
      type: 'SETTINGS_CHANGED', 
      settings: { ...settings, [key]: value } 
    }, '*')
  }

  return (
    <div ref={containerRef} className="settings-app">
      <h2>⚙️ Настройки приложения</h2>
      
      <div className="settings-section">
        <h3>Основные настройки</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Уведомления</label>
            <p>Получать уведомления о важных событиях</p>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.notifications}
              onChange={(e) => updateSetting('notifications', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Темная тема</label>
            <p>Использовать темное оформление</p>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.darkMode}
              onChange={(e) => updateSetting('darkMode', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Автосохранение</label>
            <p>Автоматически сохранять изменения</p>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.autoSave}
              onChange={(e) => updateSetting('autoSave', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Язык интерфейса</label>
            <p>Выберите предпочитаемый язык</p>
          </div>
          <select 
            value={settings.language}
            onChange={(e) => updateSetting('language', e.target.value)}
            className="language-select"
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3>Информация о системе</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Версия:</span>
            <span className="info-value">1.0.0</span>
          </div>
          <div className="info-item">
            <span className="info-label">Окружение:</span>
            <span className="info-value">Development</span>
          </div>
          <div className="info-item">
            <span className="info-label">Последнее обновление:</span>
            <span className="info-value">{new Date().toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="save-btn" onClick={() => alert('Настройки сохранены!')}>
          Сохранить настройки
        </button>
        <button className="reset-btn" onClick={() => setSettings({
          notifications: true,
          darkMode: false,
          language: 'ru',
          autoSave: true,
        })}>
          Сбросить
        </button>
      </div>
    </div>
  )
}

export default App