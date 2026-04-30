import { mockCalculationData } from './mockData';

const API_URL = 'http://localhost:3001/api';
const USE_MOCK = true; // Переключение между реальным API и моками

// Вспомогательная функция для запросов
const fetchWithTimeout = (url, options, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

// API для авторизации (без изменений)
export const login = async (login, password) => {
  // ... оставляем как было
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Моковые пользователи
    const mockUsers = [
      { login: "user", password: "user123", role: "user" },
      { login: "admin", password: "admin123", role: "admin" },
      { login: "operator", password: "operator123", role: "operator" }
    ];
    
    const user = mockUsers.find(u => u.login === login && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    }
    throw new Error('Invalid credentials');
  }

  // Реальный API запрос
  try {
    const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    
    if (!response.ok) throw new Error('Invalid credentials');
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Расчет для первой вкладки (убрали orgId)
export const calculateTab1 = async (dateFrom, dateTo, userRole) => {
  const data = {
    dateFrom,
    dateTo,
    user: userRole
  };

  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      ...mockCalculationData.tab1,
      period: `${dateFrom} - ${dateTo}`,
      user: userRole,
      organization: "ООО 'Ромашка'"
    };
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/calculate/tab1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Calculation failed');
    return await response.json();
  } catch (error) {
    console.error('API Error, using mock calculation:', error);
    return {
      ...mockCalculationData.tab1,
      period: `${dateFrom} - ${dateTo}`,
      user: userRole,
      organization: "ООО 'Ромашка'"
    };
  }
};

// Расчет для второй вкладки (убрали orgId)
export const calculateTab2 = async (dateTo, userRole) => {
  const data = {
    dateTo,
    user: userRole
  };

  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      ...mockCalculationData.tab2,
      date: dateTo,
      user: userRole,
      organization: "ООО 'Ромашка'"
    };
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/calculate/tab2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Calculation failed');
    return await response.json();
  } catch (error) {
    console.error('API Error, using mock calculation:', error);
    return {
      ...mockCalculationData.tab2,
      date: dateTo,
      user: userRole,
      organization: "ООО 'Ромашка'"
    };
  }
};