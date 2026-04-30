import React, { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

// Обновленный компонент EmbeddedApp с правильным управлением шириной
const EmbeddedApp = ({ id, title, url, isActive, refreshTrigger, onLoad, onLoadingStart }) => {
  const iframeRef = useRef(null);
  const containerRef = useRef(null); // Добавляем реф для контейнера
  const [height, setHeight] = useState('auto');
  const [width, setWidth] = useState('100%'); // Добавляем состояние для ширины
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const heightRef = useRef(0);
  const hasNotifiedLoadRef = useRef(false);
  const isMountedRef = useRef(false);
  const loadAttemptsRef = useRef(0);
  const readyReceivedRef = useRef(false);
  const currentRefreshTriggerRef = useRef(0);

  // Функция для обновления ширины контейнера
  const updateContainerWidth = useCallback(() => {
    if (containerRef.current && isMountedRef.current) {
      const containerWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
      setWidth(`${containerWidth}px`);
    }
  }, []);

  // Отслеживаем изменение размера окна
  useEffect(() => {
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, [updateContainerWidth]);

  // Проверка доступности iframe
  const checkIframeAvailability = useCallback(() => {
    if (!iframeRef.current || !isMountedRef.current || readyReceivedRef.current) return;
    
    loadAttemptsRef.current++;
    
    try {
      const iframeWindow = iframeRef.current.contentWindow;
      if (!iframeWindow) {
        if (loadAttemptsRef.current > 10) {
          console.log(`❌ App ${id} not accessible after ${loadAttemptsRef.current} attempts`);
          setIsLoading(false);
          setHasError(true);
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
        }
        return;
      }
      
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc && iframeDoc.readyState === 'complete') {
        console.log(`📄 App ${id} iframe loaded, waiting for READY...`);
        
        setTimeout(() => {
          if (!readyReceivedRef.current && !hasNotifiedLoadRef.current && isMountedRef.current) {
            console.log(`⏰ App ${id} timeout waiting for READY after iframe load`);
            setIsLoading(false);
            setHasError(true);
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
          }
        }, 10000);
        
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      }
    } catch (e) {
      console.log(`⚠️ App ${id} CORS error, but iframe may be loaded`);
      
      if (loadAttemptsRef.current > 20) {
        console.log(`❌ App ${id} timeout (CORS) after ${loadAttemptsRef.current} attempts`);
        setIsLoading(false);
        setHasError(true);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      }
    }
  }, [id]);

  // Обработка сообщений от iframe
  useEffect(() => {
    const handleMessage = (event) => {
      const allowedOrigins = ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3030'];
      if (!allowedOrigins.includes(event.origin)) return;

      if (event.data.type === 'READY') {
        if (event.source !== iframeRef.current?.contentWindow) return;
        
        if (readyReceivedRef.current) {
          console.log(`⚠️ App ${id} READY already processed for this refresh cycle, ignoring`);
          return;
        }
        
        console.log(`✅ App ${id} received READY message`);
        readyReceivedRef.current = true;
        
        if (!hasNotifiedLoadRef.current && isMountedRef.current) {
          hasNotifiedLoadRef.current = true;
          setIsLoading(false);
          setHasError(false);
          onLoad?.(id);
          
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
        }
      }

      if (event.data.type === 'RESIZE' && event.data.height) {
        const newHeight = event.data.height;
        if (Math.abs(heightRef.current - newHeight) > 10) {
          heightRef.current = newHeight;
          setHeight(`${newHeight}px`);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [id, onLoad]);

  const checkIntervalRef = useRef(null);
  
  useEffect(() => {
    if (isLoading && isMountedRef.current && !readyReceivedRef.current) {
      loadAttemptsRef.current = 0;
      checkIntervalRef.current = setInterval(() => {
        checkIframeAvailability();
      }, 500);
      
      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      };
    }
  }, [isLoading, checkIframeAvailability]);

  const reloadIframe = useCallback(() => {
    if (!iframeRef.current || !isMountedRef.current) return;
    
    console.log(`🔄 Reloading app ${id}`);
    
    hasNotifiedLoadRef.current = false;
    readyReceivedRef.current = false;
    loadAttemptsRef.current = 0;
    
    setIsLoading(true);
    setHasError(false);
    
    onLoadingStart?.(id);
    
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    
    const currentSrc = iframeRef.current.src;
    iframeRef.current.src = 'about:blank';
    setTimeout(() => {
      if (iframeRef.current && isMountedRef.current) {
        iframeRef.current.src = url;
      }
    }, 50);
  }, [id, url, onLoadingStart]);

  useEffect(() => {
    if (refreshTrigger > 0 && iframeRef.current && isMountedRef.current) {
      if (refreshTrigger === currentRefreshTriggerRef.current) {
        return;
      }
      
      currentRefreshTriggerRef.current = refreshTrigger;
      reloadIframe();
    }
  }, [refreshTrigger, reloadIframe]);

  useEffect(() => {
    if (isLoading && isMountedRef.current) {
      const timeout = setTimeout(() => {
        if (isLoading && isMountedRef.current && !hasNotifiedLoadRef.current && !readyReceivedRef.current) {
          console.log(`⏰ Global timeout for app ${id}`);
          setIsLoading(false);
          setHasError(true);
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
        }
      }, 20000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, id]);

  useEffect(() => {
    isMountedRef.current = true;
    
    const sendReadyMessage = () => {
      if (iframeRef.current && iframeRef.current.contentWindow && isMountedRef.current) {
        iframeRef.current.contentWindow.postMessage({ type: 'PARENT_READY' }, url);
      }
    };
    
    const timer = setTimeout(sendReadyMessage, 100);
    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, [url]);

  const handleRetry = () => {
    console.log(`🔄 Retry app ${id}`);
    reloadIframe();
  };

  return (
    <div 
      ref={containerRef}
      className={`embedded-app-container ${isActive ? 'active' : ''}`}
      style={{ 
        height: height,
        width: width,
        maxWidth: '100%',
        display: isActive ? 'block' : 'none'
      }}
    >
      {isLoading && (
        <div className="iframe-loader">
          <div className="spinner"></div>
          <p>Загрузка {title}...</p>
          <p className="loader-url">{url}</p>
          <p className="loader-attempts">Попытка подключения...</p>
        </div>
      )}
      
      {hasError && !isLoading && (
        <div className="iframe-error">
          <p>⚠️ Не удалось загрузить {title}</p>
          <p className="error-url">{url}</p>
          <p className="error-hint">
            {!readyReceivedRef.current && !hasNotifiedLoadRef.current 
              ? '❌ Приложение не отвечает. Проверьте, запущен ли сервер на этом порту.'
              : 'Приложение не ответило или данные не загрузились'}
          </p>
          <button onClick={handleRetry}>🔄 Повторить попытку</button>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={url}
        title={title}
        className="embedded-iframe"
        style={{
          display: (isLoading || hasError) ? 'none' : 'block',
          width: '100%',
          maxWidth: '100%'
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
        onError={() => {
          console.log(`❌ Iframe ${id} onError event`);
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

// Главный компонент приложения (без изменений)
function App() {
  const [activeApp, setActiveApp] = useState(1);
  const [loadedApps, setLoadedApps] = useState({});
  const [refreshTriggers, setRefreshTriggers] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  const menuItems = [
    { id: 1, name: '📊 Dashboard', url: 'http://localhost:3001' },
    { id: 2, name: '👥 Пользователи', url: 'http://localhost:3002' },
    { id: 3, name: '⚙️ Настройки', url: 'http://localhost:3003' },
    { id: 4, name: '📈 Monitoring', url: 'http://localhost:3030' },
  ];

  const handleLoadingStart = useCallback((appId) => {
    console.log(`🟡 Loading start for app ${appId}`);
    setLoadedApps(prev => ({
      ...prev,
      [appId]: false
    }));
  }, []);

  const handleAppLoad = useCallback((appId) => {
    console.log(`🟢 App ${appId} loaded successfully`);
    setLoadedApps(prev => ({
      ...prev,
      [appId]: true
    }));
  }, []);

  const refreshActiveApp = () => {
    console.log(`🔄 Refresh active app ${activeApp}`);
    setRefreshTriggers(prev => ({
      ...prev,
      [activeApp]: prev[activeApp] + 1
    }));
  };

  const refreshAllApps = () => {
    console.log(`🔄 Refresh all apps`);
    setRefreshTriggers(prev => ({
      1: prev[1] + 1,
      2: prev[2] + 1,
      3: prev[3] + 1,
      4: prev[4] + 1,
    }));
  };

  const activeItem = menuItems.find(item => item.id === activeApp);
  const loadedCount = Object.values(loadedApps).filter(v => v === true).length;
  const totalApps = menuItems.length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <h2>Digital Holding</h2>
          <p className="logo-subtitle">Microfrontend Platform</p>
        </div>
        
        <nav className="menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${activeApp === item.id ? 'active' : ''}`}
              onClick={() => setActiveApp(item.id)}
            >
              {/* <span className="menu-icon">{item.name.charAt(0)}</span> */}
              <span className="menu-text">{item.name}</span>
              {loadedApps[item.id] === true && <span className="loaded-badge">✓</span>}
              {loadedApps[item.id] === false && <span className="loading-dot">●</span>}
              {loadedApps[item.id] === undefined && <span className="loading-dot">●</span>}
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(loadedCount / totalApps) * 100}%` }}
            />
          </div>
          <div className="status-stats">
            <span>Загружено: {loadedCount}/{totalApps}</span>
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="header">
          <div className="header-info">
            <h1>{activeItem?.name}</h1>
            <div className="header-meta">
              <span className="meta-badge">Активное приложение</span>
              <span className="meta-url">{activeItem?.url}</span>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary" 
              onClick={refreshAllApps}
              title="Обновить все приложения"
            >
              🔄 Обновить все
            </button>
            <button 
              className="btn btn-primary" 
              onClick={refreshActiveApp}
              title="Обновить текущее приложение"
            >
              🔄 Обновить
            </button>
          </div>
        </header>

        <div className="iframe-container">
          {menuItems.map((item) => (
            <EmbeddedApp
              key={item.id}
              id={item.id}
              title={item.name}
              url={item.url}
              isActive={activeApp === item.id}
              refreshTrigger={refreshTriggers[item.id]}
              onLoad={handleAppLoad}
              onLoadingStart={handleLoadingStart}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;