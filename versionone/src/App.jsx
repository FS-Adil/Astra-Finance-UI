import React, { useState, useEffect } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import LoginForm from './components/Auth/LoginForm';
import TabContainer from './components/Tabs/TabContainer';
import { login } from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем сохраненную сессию
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      const { role } = JSON.parse(savedAuth);
      setUserRole(role);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (loginValue, password) => {
    const response = await login(loginValue, password);
    
    if (response.success) {
      setUserRole(response.user.role);
      setIsAuthenticated(true);
      localStorage.setItem('auth', JSON.stringify({
        login: loginValue,
        role: response.user.role
      }));
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('auth');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AntApp>
        <LoginForm onLogin={handleLogin} />
      </AntApp>
    );
  }

  return (
    <AntApp>
      <TabContainer userRole={userRole} onLogout={handleLogout} />
    </AntApp>
  );
}

export default App;