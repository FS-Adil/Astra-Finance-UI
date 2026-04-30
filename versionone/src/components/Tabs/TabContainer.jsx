import React, { useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import Tab1 from './Tab1';
import Tab2 from './Tab2';
import './Tabs.css';

const FIXED_ORGANIZATION = {
  id: "11111111-1111-1111-1111-111111111111", // Строковый UUID вместо числа
  name: "ООО 'Ромашка'"
};

const TabContainer = ({ userRole, onLogout }) => {
  const [activeTab, setActiveTab] = useState(1);

  const renderTabContent = () => {
    switch(activeTab) {
      case 1:
        return (
          <div style={{ display: activeTab === 1 ? 'block' : 'none' }}>
            <Tab1 userRole={userRole} organization={FIXED_ORGANIZATION} />
          </div>
        );
      case 2:
        return (
          <div style={{ display: activeTab === 2 ? 'block' : 'none' }}>
            <Tab2 userRole={userRole} organization={FIXED_ORGANIZATION} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#667eea',
          borderRadius: 6,
        },
      }}
    >
      <div className="app-container">
        <header className="app-header">
          <h1>Система расчетов</h1>
          <div className="user-info">
            <span>Роль: {userRole}</span>
            <button onClick={onLogout} className="logout-button">
              Выйти
            </button>
          </div>
        </header>

        <div className="organization-section">
          <div className="organization-info">
            <label>Организация:</label>
            <span className="organization-name">{FIXED_ORGANIZATION.name}</span>
          </div>
        </div>

        <div className="tabs-container">
          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab === 1 ? 'active' : ''}`}
              onClick={() => setActiveTab(1)}
            >
              Расчет за период
            </button>
            <button 
              className={`tab-button ${activeTab === 2 ? 'active' : ''}`}
              onClick={() => setActiveTab(2)}
            >
              Расчет на дату
            </button>
          </div>

          <div className="tab-content-wrapper">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default TabContainer;